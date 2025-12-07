/**
 * Test script for Job Management System
 * Demonstrates job creation, assignment, progress tracking, and completion
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testJobManagement() {
  console.log('🧪 Testing Job Management System\n');

  try {
    // 1. Create a test user
    console.log('1️⃣ Creating test user...');
    const user = await prisma.user.upsert({
      where: { qubicAddress: 'TESTCONSUMERABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQR' },
      update: {},
      create: {
        qubicAddress: 'TESTCONSUMERABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQR',
        username: 'Test Consumer',
        role: 'CONSUMER',
        balance: 100.0
      }
    });
    console.log(`✅ User created: ${user.id}\n`);

    // 2. Create a test provider
    console.log('2️⃣ Creating test provider...');
    const provider = await prisma.provider.upsert({
      where: { workerId: 'test-worker-001' },
      update: {
        isOnline: true,
        isAvailable: true
      },
      create: {
        workerId: 'test-worker-001',
        userId: user.id,
        qubicAddress: 'TESTPROVIDERABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRS',
        name: 'Test Provider',
        type: 'NATIVE',
        gpuModel: 'NVIDIA RTX 4090',
        gpuVram: 24,
        cpuModel: 'AMD Ryzen 9 5950X',
        cpuCores: 16,
        ramTotal: 64,
        location: 'US-East',
        pricePerHour: 1.5,
        isOnline: true,
        isAvailable: true
      }
    });
    console.log(`✅ Provider created: ${provider.id}\n`);

    // 3. Create a job
    console.log('3️⃣ Creating job...');
    const job = await prisma.job.create({
      data: {
        userId: user.id,
        modelType: 'llama-2-70b',
        computeNeeded: 2.0, // 2 hours
        inputData: {
          prompt: 'Explain quantum computing',
          maxTokens: 1000
        },
        estimatedCost: 3.0, // 2 hours * $1.5/hour
        status: 'PENDING',
        progress: 0
      }
    });
    console.log(`✅ Job created: ${job.id}`);
    console.log(`   Status: ${job.status}`);
    console.log(`   Estimated Cost: $${job.estimatedCost}\n`);

    // 4. Assign job to provider
    console.log('4️⃣ Assigning job to provider...');
    const assignedJob = await prisma.job.update({
      where: { id: job.id },
      data: {
        providerId: provider.id,
        status: 'ASSIGNED'
      }
    });
    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        isAvailable: false,
        currentJobId: job.id
      }
    });
    console.log(`✅ Job assigned to provider ${provider.workerId}`);
    console.log(`   Status: ${assignedJob.status}\n`);

    // 5. Simulate progress updates
    console.log('5️⃣ Simulating job progress...');
    for (const progress of [25, 50, 75]) {
      await prisma.job.update({
        where: { id: job.id },
        data: {
          progress,
          status: 'RUNNING',
          startedAt: progress === 25 ? new Date() : undefined
        }
      });
      console.log(`   Progress: ${progress}%`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    console.log('');

    // 6. Complete the job
    console.log('6️⃣ Completing job...');
    const processingTimeSeconds = 7200; // 2 hours
    const actualCost = (processingTimeSeconds / 3600) * provider.pricePerHour;
    
    const completedJob = await prisma.job.update({
      where: { id: job.id },
      data: {
        status: 'COMPLETED',
        progress: 100,
        result: {
          output: 'Quantum computing is a type of computation that harnesses...',
          tokensGenerated: 856
        },
        completedAt: new Date(),
        actualCost
      }
    });

    // Update provider
    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        isAvailable: true,
        currentJobId: null,
        totalJobs: { increment: 1 },
        totalEarnings: { increment: actualCost }
      }
    });

    console.log(`✅ Job completed successfully`);
    console.log(`   Status: ${completedJob.status}`);
    console.log(`   Progress: ${completedJob.progress}%`);
    console.log(`   Actual Cost: $${completedJob.actualCost}\n`);

    // 7. Create transactions
    console.log('7️⃣ Creating payment transactions...');
    await prisma.transaction.create({
      data: {
        userId: user.id,
        jobId: job.id,
        type: 'PAYMENT',
        amount: actualCost,
        status: 'COMPLETED'
      }
    });

    await prisma.transaction.create({
      data: {
        userId: provider.userId,
        jobId: job.id,
        type: 'EARNING',
        amount: actualCost,
        status: 'COMPLETED'
      }
    });
    console.log(`✅ Transactions created\n`);

    // 8. Display summary
    console.log('📊 Summary:');
    const updatedProvider = await prisma.provider.findUnique({
      where: { id: provider.id }
    });
    console.log(`   Provider Total Jobs: ${updatedProvider?.totalJobs}`);
    console.log(`   Provider Total Earnings: $${updatedProvider?.totalEarnings}`);
    console.log(`   Provider Available: ${updatedProvider?.isAvailable}\n`);

    // 9. Test job failure and reassignment
    console.log('8️⃣ Testing job failure and reassignment...');
    const failedJob = await prisma.job.create({
      data: {
        userId: user.id,
        modelType: 'stable-diffusion',
        computeNeeded: 0.5,
        inputData: { prompt: 'A beautiful sunset' },
        estimatedCost: 0.75,
        status: 'ASSIGNED',
        providerId: provider.id,
        progress: 50
      }
    });

    // Simulate failure
    await prisma.job.update({
      where: { id: failedJob.id },
      data: {
        status: 'FAILED',
        error: 'GPU out of memory',
        completedAt: new Date()
      }
    });

    // Reassign
    await prisma.job.update({
      where: { id: failedJob.id },
      data: {
        status: 'PENDING',
        providerId: null,
        progress: 0,
        error: 'Reassignment attempt 1 after failure: GPU out of memory'
      }
    });

    console.log(`✅ Job marked for reassignment`);
    console.log(`   Job ID: ${failedJob.id}`);
    console.log(`   Status: PENDING (ready for reassignment)\n`);

    console.log('✅ All tests completed successfully!\n');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testJobManagement();
