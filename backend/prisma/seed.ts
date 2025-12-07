import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample users
  const consumer1 = await prisma.user.upsert({
    where: { qubicAddress: 'QUBIC_CONSUMER_1_ABC123' },
    update: {},
    create: {
      qubicAddress: 'QUBIC_CONSUMER_1_ABC123',
      email: 'consumer1@qubix.com',
      username: 'alice_consumer',
      role: 'CONSUMER',
      balance: 1000.0,
    },
  });

  const provider1User = await prisma.user.upsert({
    where: { qubicAddress: 'QUBIC_PROVIDER_1_DEF456' },
    update: {},
    create: {
      qubicAddress: 'QUBIC_PROVIDER_1_DEF456',
      email: 'provider1@qubix.com',
      username: 'bob_provider',
      role: 'BOTH',
      balance: 500.0,
    },
  });

  const provider2User = await prisma.user.upsert({
    where: { qubicAddress: 'QUBIC_PROVIDER_2_GHI789' },
    update: {},
    create: {
      qubicAddress: 'QUBIC_PROVIDER_2_GHI789',
      email: 'provider2@qubix.com',
      username: 'charlie_provider',
      role: 'PROVIDER',
      balance: 250.0,
    },
  });

  console.log('✅ Created 3 users');

  // Create sample providers
  const provider1 = await prisma.provider.upsert({
    where: { workerId: 'worker_001' },
    update: {},
    create: {
      workerId: 'worker_001',
      userId: provider1User.id,
      qubicAddress: provider1User.qubicAddress,
      name: 'High-Performance GPU Server',
      type: 'NATIVE',
      gpuModel: 'NVIDIA RTX 4090',
      gpuVram: 24.0,
      cpuModel: 'AMD Ryzen 9 7950X',
      cpuCores: 16,
      ramTotal: 64.0,
      location: 'US-East',
      pricePerHour: 2.5,
      isOnline: true,
      isAvailable: true,
      totalEarnings: 450.75,
      totalJobs: 23,
      uptime: 86400 * 30, // 30 days in seconds
      lastHeartbeat: new Date(),
    },
  });

  const provider2 = await prisma.provider.upsert({
    where: { workerId: 'worker_002' },
    update: {},
    create: {
      workerId: 'worker_002',
      userId: provider2User.id,
      qubicAddress: provider2User.qubicAddress,
      name: 'Budget GPU Node',
      type: 'BROWSER',
      gpuModel: 'NVIDIA GTX 1080 Ti',
      gpuVram: 11.0,
      cpuModel: 'Intel Core i7-9700K',
      cpuCores: 8,
      ramTotal: 32.0,
      location: 'EU-West',
      pricePerHour: 1.2,
      isOnline: true,
      isAvailable: false,
      totalEarnings: 125.50,
      totalJobs: 15,
      uptime: 86400 * 15, // 15 days in seconds
      lastHeartbeat: new Date(Date.now() - 300000), // 5 minutes ago
    },
  });

  const provider3 = await prisma.provider.upsert({
    where: { workerId: 'worker_003' },
    update: {},
    create: {
      workerId: 'worker_003',
      userId: provider1User.id,
      qubicAddress: provider1User.qubicAddress,
      name: 'Enterprise GPU Cluster',
      type: 'NATIVE',
      gpuModel: 'NVIDIA A100',
      gpuVram: 80.0,
      cpuModel: 'AMD EPYC 7763',
      cpuCores: 64,
      ramTotal: 512.0,
      location: 'US-West',
      pricePerHour: 8.0,
      isOnline: false,
      isAvailable: true,
      totalEarnings: 0,
      totalJobs: 0,
      uptime: 0,
    },
  });

  console.log('✅ Created 3 providers');

  // Create sample jobs
  const job1 = await prisma.job.create({
    data: {
      userId: consumer1.id,
      providerId: provider1.id,
      modelType: 'stable-diffusion',
      computeNeeded: 10.5,
      inputData: {
        prompt: 'A beautiful sunset over mountains',
        steps: 50,
        resolution: '512x512',
      },
      status: 'COMPLETED',
      progress: 100,
      result: {
        imageUrl: 'https://storage.qubix.com/results/img_001.png',
        seed: 42,
        processingTime: 45.2,
      },
      estimatedCost: 25.0,
      actualCost: 23.5,
      createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
      startedAt: new Date(Date.now() - 86400000 * 2 + 300000), // 5 min after creation
      completedAt: new Date(Date.now() - 86400000 * 2 + 600000), // 10 min after start
    },
  });

  const job2 = await prisma.job.create({
    data: {
      userId: consumer1.id,
      providerId: provider2.id,
      modelType: 'llama-2-7b',
      computeNeeded: 5.0,
      inputData: {
        prompt: 'Explain quantum computing in simple terms',
        maxTokens: 500,
        temperature: 0.7,
      },
      status: 'RUNNING',
      progress: 65,
      estimatedCost: 15.0,
      createdAt: new Date(Date.now() - 1800000), // 30 min ago
      startedAt: new Date(Date.now() - 1200000), // 20 min ago
    },
  });

  const job3 = await prisma.job.create({
    data: {
      userId: consumer1.id,
      modelType: 'whisper-large',
      computeNeeded: 8.0,
      inputData: {
        audioUrl: 'https://storage.qubix.com/audio/sample.mp3',
        language: 'en',
      },
      status: 'PENDING',
      progress: 0,
      estimatedCost: 20.0,
      createdAt: new Date(Date.now() - 300000), // 5 min ago
    },
  });

  const job4 = await prisma.job.create({
    data: {
      userId: consumer1.id,
      providerId: provider1.id,
      modelType: 'gpt-2',
      computeNeeded: 3.0,
      inputData: {
        prompt: 'Write a short story about AI',
        maxTokens: 200,
      },
      status: 'FAILED',
      progress: 25,
      error: 'GPU out of memory',
      estimatedCost: 10.0,
      createdAt: new Date(Date.now() - 86400000), // 1 day ago
      startedAt: new Date(Date.now() - 86400000 + 180000), // 3 min after creation
    },
  });

  console.log('✅ Created 4 sample jobs');

  // Create sample transactions
  const tx1 = await prisma.transaction.create({
    data: {
      userId: consumer1.id,
      jobId: job1.id,
      type: 'ESCROW_LOCK',
      amount: 25.0,
      status: 'COMPLETED',
      qubicTxHash: '0xabc123def456789',
      completedAt: new Date(Date.now() - 86400000 * 2),
    },
  });

  const tx2 = await prisma.transaction.create({
    data: {
      userId: provider1User.id,
      jobId: job1.id,
      type: 'EARNING',
      amount: 23.5,
      status: 'COMPLETED',
      qubicTxHash: '0xdef456ghi789abc',
      completedAt: new Date(Date.now() - 86400000 * 2 + 600000),
    },
  });

  const tx3 = await prisma.transaction.create({
    data: {
      userId: consumer1.id,
      jobId: job2.id,
      type: 'ESCROW_LOCK',
      amount: 15.0,
      status: 'PENDING',
      qubicTxHash: '0xghi789jkl012mno',
    },
  });

  console.log('✅ Created 3 sample transactions');

  // Create sample provider metrics
  const now = Date.now();
  for (let i = 0; i < 10; i++) {
    await prisma.providerMetric.create({
      data: {
        providerId: provider1.id,
        cpuPercent: 45 + Math.random() * 30,
        ramPercent: 60 + Math.random() * 20,
        gpuPercent: 70 + Math.random() * 25,
        gpuTemp: 65 + Math.random() * 15,
        gpuMemUsed: 18 + Math.random() * 4,
        timestamp: new Date(now - i * 300000), // Every 5 minutes
      },
    });
  }

  console.log('✅ Created 10 provider metrics');

  // Create benchmark data
  const benchmarkData = [
    // MNIST Training benchmarks
    { jobType: 'mnist_training', gpuModel: 'RTX 4090', baseTimeSeconds: 120, epochs: 5, datasetSize: 10000 },
    { jobType: 'mnist_training', gpuModel: 'RTX 4080', baseTimeSeconds: 150, epochs: 5, datasetSize: 10000 },
    { jobType: 'mnist_training', gpuModel: 'RTX 3090', baseTimeSeconds: 180, epochs: 5, datasetSize: 10000 },
    { jobType: 'mnist_training', gpuModel: 'RTX 3080', baseTimeSeconds: 220, epochs: 5, datasetSize: 10000 },
    { jobType: 'mnist_training', gpuModel: 'RTX 3070', baseTimeSeconds: 280, epochs: 5, datasetSize: 10000 },
    { jobType: 'mnist_training', gpuModel: 'RTX 3060', baseTimeSeconds: 350, epochs: 5, datasetSize: 10000 },
    
    // Stable Diffusion benchmarks
    { jobType: 'stable_diffusion', gpuModel: 'RTX 4090', baseTimeSeconds: 300, resolution: 512 },
    { jobType: 'stable_diffusion', gpuModel: 'RTX 4080', baseTimeSeconds: 400, resolution: 512 },
    { jobType: 'stable_diffusion', gpuModel: 'RTX 3090', baseTimeSeconds: 450, resolution: 512 },
    { jobType: 'stable_diffusion', gpuModel: 'RTX 3080', baseTimeSeconds: 550, resolution: 512 },
    { jobType: 'stable_diffusion', gpuModel: 'RTX 3070', baseTimeSeconds: 700, resolution: 512 },
    
    // Inference benchmarks
    { jobType: 'inference', gpuModel: 'RTX 4090', baseTimeSeconds: 60 },
    { jobType: 'inference', gpuModel: 'RTX 4080', baseTimeSeconds: 80 },
    { jobType: 'inference', gpuModel: 'RTX 3090', baseTimeSeconds: 100 },
    { jobType: 'inference', gpuModel: 'RTX 3080', baseTimeSeconds: 120 },
    { jobType: 'inference', gpuModel: 'RTX 3070', baseTimeSeconds: 150 },
    
    // Custom script benchmarks
    { jobType: 'custom_script', gpuModel: 'RTX 4090', baseTimeSeconds: 600 },
    { jobType: 'custom_script', gpuModel: 'RTX 4080', baseTimeSeconds: 750 },
    { jobType: 'custom_script', gpuModel: 'RTX 3090', baseTimeSeconds: 900 },
    { jobType: 'custom_script', gpuModel: 'RTX 3080', baseTimeSeconds: 1100 },
    { jobType: 'custom_script', gpuModel: 'RTX 3070', baseTimeSeconds: 1400 },
  ];

  for (const benchmark of benchmarkData) {
    await prisma.benchmark.upsert({
      where: {
        jobType_gpuModel: {
          jobType: benchmark.jobType,
          gpuModel: benchmark.gpuModel,
        },
      },
      update: {},
      create: benchmark,
    });
  }

  console.log('✅ Created 21 benchmarks');

  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   - Users: 3 (1 consumer, 2 providers)`);
  console.log(`   - Providers: 3 (2 online, 1 offline)`);
  console.log(`   - Jobs: 4 (1 completed, 1 running, 1 pending, 1 failed)`);
  console.log(`   - Transactions: 3 (2 completed, 1 pending)`);
  console.log(`   - Provider Metrics: 10`);
  console.log(`   - Benchmarks: 21`);
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
