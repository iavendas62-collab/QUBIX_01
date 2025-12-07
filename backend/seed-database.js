/**
 * Database Seeding Script
 * Populates the database with demo data for development
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Demo data
const demoUsers = [
  {
    email: 'demo@qubix.io',
    username: 'DemoUser',
    role: 'CONSUMER',
    qubicAddress: 'DEMOQUBICADDRESSABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQR',
    balance: 1000000.0, // 1M QUBIC demo balance
    passwordHash: 'demo123'
  },
  {
    email: 'provider@qubix.io',
    username: 'DemoProvider',
    role: 'PROVIDER',
    qubicAddress: 'PROVIDERQUBICADDRESSABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOP',
    balance: 500000.0, // 500K QUBIC demo balance
    passwordHash: 'provider123'
  },
  {
    email: 'consumer@qubix.io',
    username: 'DemoConsumer',
    role: 'CONSUMER',
    qubicAddress: 'CONSUMERQUBICADDRESSABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOP',
    balance: 750000.0, // 750K QUBIC demo balance
    passwordHash: 'consumer123'
  }
];

const demoJobs = [
  {
    userId: 1, // DemoUser
    modelType: 'gpt2',
    status: 'COMPLETED',
    computeNeeded: 10,
    budget: 50.0,
    createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
    provider: {
      workerId: 'worker-demo-1',
      gpuModel: 'NVIDIA RTX 4090'
    }
  },
  {
    userId: 1, // DemoUser
    modelType: 'bert',
    status: 'RUNNING',
    computeNeeded: 20,
    budget: 100.0,
    createdAt: new Date(Date.now() - 3600000), // 1 hour ago
    provider: {
      workerId: 'worker-demo-2',
      gpuModel: 'NVIDIA RTX 3090'
    }
  },
  {
    userId: 2, // DemoProvider (running as consumer)
    modelType: 'stable-diffusion',
    status: 'PENDING',
    computeNeeded: 30,
    budget: 150.0,
    createdAt: new Date(Date.now() - 300000), // 5 minutes ago
  },
  {
    userId: 3, // DemoConsumer
    modelType: 'llama',
    status: 'COMPLETED',
    computeNeeded: 40,
    budget: 200.0,
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    provider: {
      workerId: 'worker-demo-3',
      gpuModel: 'NVIDIA A100'
    }
  },
  {
    userId: 3, // DemoConsumer
    modelType: 'gpt2',
    status: 'FAILED',
    computeNeeded: 15,
    budget: 75.0,
    createdAt: new Date(Date.now() - 43200000), // 12 hours ago
    provider: {
      workerId: 'worker-demo-4',
      gpuModel: 'NVIDIA RTX 3080'
    },
    error: 'GPU memory insufficient'
  }
];

const demoProviders = [
  {
    workerId: 'worker-demo-1',
    name: 'RTX 4090 SuperNode',
    type: 'gpu',
    specs: {
      gpu_model: 'NVIDIA RTX 4090',
      gpu_vram_gb: 24,
      cpu_cores: 16,
      ram_total_gb: 64,
      gpu_available: true
    },
    location: 'São Paulo, Brazil',
    pricePerHour: 10.0,
    reputation: 0.98,
    totalJobs: 150,
    totalEarnings: 1250.0,
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 30) // 30 days ago
  },
  {
    workerId: 'worker-demo-2',
    name: 'RTX 3090 Workstation',
    type: 'gpu',
    specs: {
      gpu_model: 'NVIDIA RTX 3090',
      gpu_vram_gb: 24,
      cpu_cores: 12,
      ram_total_gb: 32,
      gpu_available: true
    },
    location: 'Miami, US',
    pricePerHour: 8.0,
    reputation: 0.95,
    totalJobs: 89,
    totalEarnings: 712.0,
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 25)
  },
  {
    workerId: 'worker-demo-3',
    name: 'A100 DataCenter',
    type: 'gpu',
    specs: {
      gpu_model: 'NVIDIA A100',
      gpu_vram_gb: 80,
      cpu_cores: 24,
      ram_total_gb: 256,
      gpu_available: true
    },
    location: 'Frankfurt, Germany',
    pricePerHour: 25.0,
    reputation: 0.99,
    totalJobs: 234,
    totalEarnings: 5850.0,
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 45)
  },
  {
    workerId: 'worker-demo-4',
    name: 'RTX 3080 Gaming Rig',
    type: 'gpu',
    specs: {
      gpu_model: 'NVIDIA RTX 3080',
      gpu_vram_gb: 10,
      cpu_cores: 8,
      ram_total_gb: 16,
      gpu_available: true
    },
    location: 'Tokyo, Japan',
    pricePerHour: 6.0,
    reputation: 0.87,
    totalJobs: 67,
    totalEarnings: 402.0,
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 15)
  },
  {
    workerId: 'worker-demo-5',
    name: 'H100 AI Cluster',
    type: 'gpu',
    specs: {
      gpu_model: 'NVIDIA H100',
      gpu_vram_gb: 80,
      cpu_cores: 32,
      ram_total_gb: 512,
      gpu_available: true
    },
    location: 'Virginia, US',
    pricePerHour: 40.0,
    reputation: 1.0,
    totalJobs: 45,
    totalEarnings: 1800.0,
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 7)
  }
];

const demoModels = [
  {
    name: 'Fine-tuned GPT-2 for Code',
    description: 'GPT-2 model fine-tuned on programming code datasets',
    modelType: 'gpt2',
    price: 25.0,
    downloads: 245,
    ownerId: 1,
    category: 'code',
    size: '117M parameters',
    createdAt: new Date(Date.now() - 86400000 * 10)
  },
  {
    name: 'BERT Sentiment Analyzer',
    description: 'Advanced sentiment analysis with BERT transformer',
    modelType: 'bert',
    price: 30.0,
    downloads: 189,
    ownerId: 2,
    category: 'nlp',
    size: '110M parameters',
    createdAt: new Date(Date.now() - 86400000 * 15)
  },
  {
    name: 'Stable Diffusion Art Generator',
    description: 'Custom Stable Diffusion for artistic image generation',
    modelType: 'stable-diffusion',
    price: 50.0,
    downloads: 512,
    ownerId: 3,
    category: 'art',
    size: '860M parameters',
    createdAt: new Date(Date.now() - 86400000 * 20)
  },
  {
    name: 'LLaMA Code Assistant',
    description: 'LLaMA model specialized in programming assistance',
    modelType: 'llama',
    price: 75.0,
    downloads: 156,
    ownerId: 1,
    category: 'code',
    size: '7B parameters',
    createdAt: new Date(Date.now() - 86400000 * 5)
  },
  {
    name: 'CLIP Image Encoder',
    description: 'OpenAI CLIP for image-text matching and understanding',
    modelType: 'clip',
    price: 20.0,
    downloads: 892,
    ownerId: 2,
    category: 'multimodal',
    size: '151M parameters',
    createdAt: new Date(Date.now() - 86400000 * 25)
  }
];

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await prisma.job.deleteMany({});
    await prisma.model.deleteMany({});
    await prisma.provider.deleteMany({});
    await prisma.user.deleteMany({});

    // Seed users
    console.log('👥 Seeding users...');
    for (const user of demoUsers) {
      await prisma.user.create({ data: user });
    }
    console.log(`✅ Created ${demoUsers.length} users`);

    // Seed providers
    console.log('🏭 Seeding providers...');
    for (const provider of demoProviders) {
      await prisma.provider.create({ data: provider });
    }
    console.log(`✅ Created ${demoProviders.length} providers`);

    // Seed models
    console.log('🤖 Seeding models...');
    for (const model of demoModels) {
      await prisma.model.create({ data: model });
    }
    console.log(`✅ Created ${demoModels.length} models`);

    // Seed jobs
    console.log('💼 Seeding jobs...');
    for (const job of demoJobs) {
      await prisma.job.create({ data: job });
    }
    console.log(`✅ Created ${demoJobs.length} jobs`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Demo Data Summary:');
    console.log(`   • ${demoUsers.length} Users (demo@qubix.io, provider@qubix.io, consumer@qubix.io)`);
    console.log(`   • ${demoProviders.length} GPU Providers (RTX 4090, 3090, A100, 3080, H100)`);
    console.log(`   • ${demoModels.length} AI Models (GPT-2, BERT, Stable Diffusion, LLaMA, CLIP)`);
    console.log(`   • ${demoJobs.length} Jobs (mix of completed, running, pending, failed)`);
    console.log('\n🔐 Demo Credentials:');
    console.log('   • demo@qubix.io / demo123 (Consumer + Wallet)');
    console.log('   • provider@qubix.io / provider123 (Provider)');
    console.log('   • consumer@qubix.io / consumer123 (Consumer)');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
