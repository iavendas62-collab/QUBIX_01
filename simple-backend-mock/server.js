const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3001',
    process.env.FRONTEND_URL || '*'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Mock data
const mockUsers = [];
const mockJobs = [];
const mockProviders = [];

// Helper functions
function generateQubicAddress() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return Array.from({ length: 60 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

function generateQubicSeed() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  return Array.from({ length: 55 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'QUBIX Backend API',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      stats: '/api/stats',
      auth: '/api/auth/*',
      jobs: '/api/jobs/*',
      providers: '/api/providers/*'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/stats', (req, res) => {
  res.json({
    jobs: { total: 156, active: 12, completed: 120, failed: 24 },
    providers: { total: 45, active: 32, online: 28 },
    network: {
      totalComputors: 1423,
      availableCompute: 8945,
      averagePrice: 4.2
    }
  });
});

// Auth routes
app.post('/api/auth/register-email', (req, res) => {
  console.log('📧 Email registration:', req.body.email);

  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password required'
    });
  }

  const newUser = {
    id: Date.now().toString(),
    name: name || email.split('@')[0],
    email,
    type: 'CONSUMER',
    qubicIdentity: generateQubicAddress(),
    qubicSeed: generateQubicSeed(),
    createdAt: new Date().toISOString()
  };

  mockUsers.push(newUser);

  const token = Buffer.from(JSON.stringify({
    userId: newUser.id,
    email: newUser.email
  })).toString('base64');

  res.status(201).json({
    success: true,
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      type: newUser.type,
      qubicIdentity: newUser.qubicIdentity
    },
    wallet: {
      identity: newUser.qubicIdentity,
      seed: newUser.qubicSeed
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  const user = mockUsers.find(u => u.email === email);

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  const token = Buffer.from(JSON.stringify({
    userId: user.id,
    email: user.email
  })).toString('base64');

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      type: user.type,
      qubicIdentity: user.qubicIdentity
    }
  });
});

// Jobs routes
app.get('/api/jobs/user/:userId', (req, res) => {
  res.json(mockJobs);
});

app.post('/api/jobs/submit', (req, res) => {
  const newJob = {
    id: Date.now().toString(),
    userId: req.body.userId || 'anonymous',
    modelType: req.body.modelType || 'llm-inference',
    status: 'PENDING',
    progress: 0,
    createdAt: new Date().toISOString()
  };

  mockJobs.push(newJob);

  res.json({
    success: true,
    job: newJob,
    jobId: newJob.id
  });
});

// Providers routes
app.get('/api/providers', (req, res) => {
  res.json(mockProviders);
});

app.post('/api/providers/quick-register', (req, res) => {
  const { workerId, qubicAddress, gpu } = req.body;

  const newProvider = {
    id: Date.now().toString(),
    worker_id: workerId,
    qubicAddress,
    specs: {
      gpu_model: gpu?.model || 'Unknown',
      gpu_vram_gb: gpu?.vram || 0
    },
    isActive: true,
    createdAt: new Date().toISOString()
  };

  mockProviders.push(newProvider);

  res.json({
    success: true,
    provider: newProvider,
    isNew: true
  });
});

// Qubic integration status
app.get('/api/qubic/status', (req, res) => {
  res.json({
    connected: true,
    network: {
      tick: 59115,
      epoch: 1,
      status: 'healthy'
    },
    integration: {
      rpcCalls: 2,
      simulatedTx: 2,
      totalFeatures: 4
    }
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 QUBIX Backend running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: ${corsOptions.origin}`);
});
