/**
 * Backend Routes Configuration - LIMPO E ORGANIZADO
 * Todas as rotas em um único arquivo sem duplicação
 */

import { Express, Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { jobRoutes } from './jobs';
import { providerRoutes } from './providers';
import { modelRoutes } from './models';
import { statsRoutes } from './stats';
import { transactionRoutes } from './transactions';
import { earningsRoutes } from './earnings';
import qubicRoutes from './qubic';

const prisma = new PrismaClient();

/**
 * Setup all API routes
 */
export function setupRoutes(app: Express, services: any) {
  console.log('🔗 Setting up API routes...');

  // ============================================
  // HEALTH CHECK (sem prefixo /api)
  // ============================================
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // ============================================
  // AUTH ROUTES - Direct implementation
  // ============================================
  console.log('📝 Setting up auth routes (direct implementation)');
  
  const simpleAuthRouter = Router();

  // Register with email (DIRECT IMPLEMENTATION)
  simpleAuthRouter.post('/register-email', async (req, res) => {
    try {
      const { email, password, username, role } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Create user (simplified - no wallet creation for now)
      const user = await prisma.user.create({
        data: {
          email,
          username: username || email.split('@')[0],
          role: (role || 'CONSUMER') as any,
          qubicAddress: generateQubicAddress(),
          balance: 1000.0,
          passwordHash: password // Simplified - should hash in production
        }
      });

      // Generate token
      const token = Buffer.from(JSON.stringify({
        userId: user.id,
        email: user.email,
        qubicAddress: user.qubicAddress
      })).toString('base64');

      console.log('✅ User registered via email:', user.email);

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.username,
          email: user.email,
          role: user.role,
          qubicAddress: user.qubicAddress
        },
        wallet: {
          identity: user.qubicAddress,
          seed: generateQubicSeed()
        }
      });
    } catch (error: any) {
      console.error('Register email error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  // Login with email (DIRECT IMPLEMENTATION)
  simpleAuthRouter.post('/login-email', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate token
      const token = Buffer.from(JSON.stringify({
        userId: user.id,
        email: user.email,
        qubicAddress: user.qubicAddress
      })).toString('base64');

      console.log('✅ User logged in via email:', user.email);

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.username,
          email: user.email,
          role: user.role,
          qubicAddress: user.qubicAddress
        }
      });
    } catch (error: any) {
      console.error('Login email error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Register (fallback simples)
  simpleAuthRouter.post('/register', async (req, res) => {
    try {
      const { name, email, password, type, username, role } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          username: username || name || email.split('@')[0],
          role: (role || type || 'CONSUMER') as any,
          qubicAddress: generateQubicAddress(),
          balance: 1000.0, // Demo balance
          passwordHash: password // Store password as hash (simplified for demo)
        }
      });

      // Generate token
      const token = Buffer.from(JSON.stringify({
        userId: user.id,
        email: user.email,
        qubicAddress: user.qubicAddress
      })).toString('base64');

      console.log('✅ User registered:', user.email);

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.username,
          email: user.email,
          role: user.role,
          qubicAddress: user.qubicAddress
        },
        wallet: {
          identity: user.qubicAddress,
          seed: generateQubicSeed()
        }
      });
    } catch (error: any) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  // Login (fallback simples)
  simpleAuthRouter.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Find user (in production, verify password hash!)
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate token
      const token = Buffer.from(JSON.stringify({
        userId: user.id,
        email: user.email,
        qubicAddress: user.qubicAddress
      })).toString('base64');

      console.log('✅ User logged in:', user.email);

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.username,
          email: user.email,
          role: user.role,
          qubicAddress: user.qubicAddress
        }
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Get current user (fallback simples)
  simpleAuthRouter.get('/me', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const token = authHeader.replace('Bearer ', '');
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      res.json({
        id: user.id,
        name: user.username,
        email: user.email,
        role: user.role,
        qubicAddress: user.qubicAddress
      });
    } catch (error: any) {
      console.error('Auth error:', error);
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  // SEMPRE registrar simpleAuthRouter em /api/auth (tem as rotas que funcionam)
  app.use('/api/auth', simpleAuthRouter);
  console.log('✅ Simple auth routes registered at /api/auth');
  
  // Também registrar em rotas alternativas
  app.use('/api/auth-simple', simpleAuthRouter);
  app.use('/api/auth-fallback', simpleAuthRouter);

  // ============================================
  // QUBIC BLOCKCHAIN ROUTES (AUTO FALLBACK SYSTEM)
  // ============================================
  app.use('/api/qubic', (req, res, next) => {
    // Try real blockchain routes first
    const originalSend = res.send;
    let realApiResponded = false;

    res.send = function(data) {
      realApiResponded = true;
      return originalSend.call(this, data);
    };

    qubicRoutes(req, res, () => {
      // If real API didn't respond, try mock server
      if (!realApiResponded) {
        console.log(`🔄 Real Qubic API failed, trying mock fallback for ${req.method} ${req.path}`);

        // Forward to mock server
        const mockUrl = `http://localhost:3006${req.originalUrl}`;
        const options: any = {
          method: req.method,
          headers: {
            'Content-Type': req.headers['content-type'] || 'application/json',
            'Authorization': req.headers.authorization || ''
          }
        };

        if (req.method !== 'GET' && req.body) {
          options.body = JSON.stringify(req.body);
        }

        fetch(mockUrl, options)
          .then(response => response.json())
          .then(data => {
            console.log(`✅ Mock fallback successful for ${req.method} ${req.path}`);
            res.json(data);
          })
          .catch(error => {
            console.error(`❌ Both real and mock APIs failed for ${req.method} ${req.path}:`, error);
            res.status(503).json({
              success: false,
              error: 'Qubic network temporarily unavailable',
              fallback: 'mock_failed'
            });
          });
      }
    });
  });

  // ============================================
  // JOB ROUTES
  // ============================================
  app.use('/api/jobs', jobRoutes(services));

  // ============================================
  // PROVIDER & GPU ROUTES
  // ============================================
  app.use('/api/providers', providerRoutes(services));
  app.use('/api/gpus', providerRoutes(services)); // Alias

  // ============================================
  // MODEL ROUTES
  // ============================================
  app.use('/api/models', modelRoutes(services));

  // ============================================
  // STATS ROUTES
  // ============================================
  app.use('/api/stats', statsRoutes(services));

  // ============================================
  // TRANSACTION ROUTES
  // ============================================
  app.use('/api/transactions', transactionRoutes(services));

  // ============================================
  // EARNINGS ROUTES
  // ============================================
  app.use('/api/earnings', earningsRoutes(services));

  // ============================================
  // WALLET ROUTES (Balance check)
  // ============================================
  const walletRouter = Router();

  walletRouter.get('/balance/:qubicAddress', async (req, res) => {
    try {
      const { qubicAddress } = req.params;

      // Try to get from database first
      const user = await prisma.user.findUnique({
        where: { qubicAddress }
      });

      if (user) {
        return res.json({
          balance: user.balance,
          qubicAddress: user.qubicAddress
        });
      }

      // If not in DB, try real blockchain
      try {
        const response = await fetch(`https://rpc.qubic.org/v1/balances/${qubicAddress}`);
        if (response.ok) {
          const data = await response.json() as any;
          const balance = data.balance?.balance ? data.balance.balance / 1e8 : 0;
          return res.json({ balance, qubicAddress });
        }
      } catch (error) {
        console.error('Qubic RPC error:', error);
      }

      // Fallback to demo balance
      res.json({
        balance: 1000.0,
        qubicAddress
      });
    } catch (error: any) {
      console.error('Balance check error:', error);
      res.status(500).json({ error: 'Failed to check balance' });
    }
  });

  app.use('/api/wallet', walletRouter);

  // ============================================
  // DEBUG ROUTES
  // ============================================
  app.get('/api/debug/test', (req, res) => {
    res.json({
      status: 'ok',
      message: 'Server is running',
      authRouterLoaded: !!authRouter,
      timestamp: new Date().toISOString()
    });
  });

  // Test route to verify auth endpoints
  app.post('/api/debug/test-register', (req, res) => {
    res.json({
      success: true,
      message: 'This is a test route - if you see this, the server is working',
      receivedBody: req.body
    });
  });

  console.log('✅ All routes configured');
  console.log('📋 Available auth endpoints:');
  console.log('   POST /api/auth/register-email');
  console.log('   POST /api/auth/login-email');
  console.log('   POST /api/auth/register');
  console.log('   POST /api/auth/login');
  console.log('   GET  /api/auth/me');
}

// Helper functions
function generateQubicAddress(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return Array.from({ length: 60 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

function generateQubicSeed(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  return Array.from({ length: 55 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}
