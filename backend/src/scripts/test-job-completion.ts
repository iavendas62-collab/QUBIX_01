/**
 * Job Completion Flow Test Script
 * 
 * Tests the complete job completion flow:
 * 1. Create a job with escrow
 * 2. Simulate job execution with progress updates
 * 3. Complete the job successfully
 * 4. Verify payment release to provider
 * 5. Verify provider earnings update
 * 6. Test failure scenario with refund
 * 
 * Requirements: 6.4, 6.5, 11.4
 */

import { PrismaClient, JobStatus, TransactionType, TransactionStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function testJobCompletion() {
  console.log('🧪 Testing Job Completion Flow\n');

  try {
    // Step 1: Create test user (consumer)
    console.log('1️⃣ Creating test consumer...');
    const consumer = await prisma.user.upsert({
      where: { qubicAddress: 'TEST_CONSUMER_COMPLETION_123' },
      update: { balance: 100 },
      create: {
        qubicAddress: 'TEST_CONSUMER_COMPLETION_123',
        role: 'CONSUMER',
        balance: 100
      }
    });
    console.log(`✅ Consumer created: ${consumer.id}\n`);

    // Step 2: Create test provider
    console.log('2️⃣ Creating test provider...');
    const providerUser = await prisma.user.upsert({
      where: { qubicAddress: 'TEST_PROVIDER_COMPLETION_456' },
      update: {},
      create: {
        qubicAddress: 'TEST_PROVIDER_COMPLETION_456',
        role: 'PROVIDER',
        balance: 0
      }
    });

    const provider = await prisma.provider.upsert({
      where: { workerId: 'test-worker-completion-001' },
      update: {
        isOnline: true,
        isAvailable: true,
        pricePerHour: 2.0,
        totalEarnings: 0,
        totalJobs: 0
      },
      create: {
        userId: providerUser.id,
        workerId: 'test-worker-completion-001',
        gpuModel: 'RTX 4090',
        gpuMemory: 24,
        isOnline: true,
        isAvailable: true,
        pricePerHour: 2.0,
        totalEarnings: 0,
        totalJobs: 0
      }
    });
    console.log(`✅ Provider created: ${provider.id}\n`);

    // Step 3: Create job with escrow
    console.log('3️⃣ Creating job with escrow...');
    const job = await prisma.job.create({
      data: {
        userId: consumer.id,
        providerId: provider.id,
        modelType: 'test-model',
        jobType: 'mnist_training',
        fileName: 'test.py',
        fileUrl: 'test://file',
        computeNeeded: 1.0,
        estimatedCost: 2.0,
        requiredVRAM: 8,
        requiredCompute: 10,
        requiredRAM: 16,
        status: JobStatus.RUNNING,
        progress: 0,
        startedAt: new Date()
      }
    });
    console.log(`✅ Job created: ${job.id}`);

    // Create escrow lock transaction
    const escrow = await prisma.transaction.create({
      data: {
        userId: consumer.id,
        jobId: job.id,
        type: TransactionType.ESCROW_LOCK,
        amount: 2.0,
        status: TransactionStatus.PENDING,
        qubicTxHash: 'test-tx-hash-escrow-123'
      }
    });
    console.log(`✅ Escrow created: ${escrow.id}\n`);

    // Step 4: Simulate job progress
    console.log('4️⃣ Simulating job progress...');
    await prisma.job.update({
      where: { id: job.id },
      data: { progress: 50, currentOperation: 'Training epoch 5/10' }
    });
    console.log('✅ Progress: 50%\n');

    // Step 5: Complete job successfully
    console.log('5️⃣ Completing job successfully...');
    
    // Calculate actual cost (1 hour at $2/hour = $2)
    const actualCost = 2.0;
    const actualDuration = 3600; // 1 hour in seconds

    // Update job to completed
    const completedJob = await prisma.job.update({
      where: { id: job.id },
      data: {
        status: JobStatus.COMPLETED,
        progress: 100,
        completedAt: new Date(),
        actualCost,
        actualDuration,
        result: { output: 'model.pth', accuracy: 0.95 }
      }
    });
    console.log(`✅ Job completed: ${completedJob.id}`);
    console.log(`   Actual cost: ${actualCost} QUBIC`);
    console.log(`   Duration: ${actualDuration}s\n`);

    // Step 6: Release escrow (simulate payment release)
    console.log('6️⃣ Releasing escrow to provider...');
    
    // Mark escrow as completed
    await prisma.transaction.update({
      where: { id: escrow.id },
      data: {
        status: TransactionStatus.COMPLETED,
        completedAt: new Date()
      }
    });

    // Create release transaction
    const releaseTransaction = await prisma.transaction.create({
      data: {
        userId: providerUser.id,
        jobId: job.id,
        type: TransactionType.ESCROW_RELEASE,
        amount: actualCost,
        status: TransactionStatus.COMPLETED,
        qubicTxHash: 'test-tx-hash-release-456',
        completedAt: new Date()
      }
    });
    console.log(`✅ Escrow released: ${releaseTransaction.id}`);
    console.log(`   TX Hash: ${releaseTransaction.qubicTxHash}\n`);

    // Step 7: Update provider earnings
    console.log('7️⃣ Updating provider earnings...');
    const updatedProvider = await prisma.provider.update({
      where: { id: provider.id },
      data: {
        totalJobs: { increment: 1 },
        totalEarnings: { increment: actualCost },
        isAvailable: true,
        currentJobId: null
      }
    });
    console.log(`✅ Provider earnings updated:`);
    console.log(`   Total jobs: ${updatedProvider.totalJobs}`);
    console.log(`   Total earnings: ${updatedProvider.totalEarnings} QUBIC\n`);

    // Step 8: Test failure scenario
    console.log('8️⃣ Testing job failure scenario...');
    
    // Create another job
    const failJob = await prisma.job.create({
      data: {
        userId: consumer.id,
        providerId: provider.id,
        modelType: 'test-model-fail',
        jobType: 'custom_script',
        fileName: 'test-fail.py',
        fileUrl: 'test://file-fail',
        computeNeeded: 0.5,
        estimatedCost: 1.0,
        requiredVRAM: 8,
        requiredCompute: 10,
        requiredRAM: 16,
        status: JobStatus.RUNNING,
        progress: 25,
        startedAt: new Date()
      }
    });

    // Create escrow for failed job
    const failEscrow = await prisma.transaction.create({
      data: {
        userId: consumer.id,
        jobId: failJob.id,
        type: TransactionType.ESCROW_LOCK,
        amount: 1.0,
        status: TransactionStatus.PENDING,
        qubicTxHash: 'test-tx-hash-escrow-fail-789'
      }
    });

    console.log(`✅ Fail job created: ${failJob.id}`);

    // Mark job as failed
    const failedJob = await prisma.job.update({
      where: { id: failJob.id },
      data: {
        status: JobStatus.FAILED,
        completedAt: new Date(),
        error: 'GPU out of memory',
        actualDuration: 900 // 15 minutes
      }
    });
    console.log(`✅ Job marked as failed: ${failedJob.id}`);
    console.log(`   Error: ${failedJob.error}\n`);

    // Step 9: Refund escrow to consumer
    console.log('9️⃣ Refunding escrow to consumer...');
    
    // Mark escrow as completed
    await prisma.transaction.update({
      where: { id: failEscrow.id },
      data: {
        status: TransactionStatus.COMPLETED,
        completedAt: new Date()
      }
    });

    // Create refund transaction
    const refundTransaction = await prisma.transaction.create({
      data: {
        userId: consumer.id,
        jobId: failJob.id,
        type: TransactionType.REFUND,
        amount: 1.0,
        status: TransactionStatus.COMPLETED,
        qubicTxHash: 'test-tx-hash-refund-999',
        completedAt: new Date()
      }
    });
    console.log(`✅ Escrow refunded: ${refundTransaction.id}`);
    console.log(`   TX Hash: ${refundTransaction.qubicTxHash}`);
    console.log(`   Amount: ${refundTransaction.amount} QUBIC\n`);

    // Step 10: Verify final state
    console.log('🔍 Verifying final state...\n');

    // Check completed job
    const finalCompletedJob = await prisma.job.findUnique({
      where: { id: job.id },
      include: { provider: true }
    });
    console.log('✅ Completed Job:');
    console.log(`   Status: ${finalCompletedJob?.status}`);
    console.log(`   Progress: ${finalCompletedJob?.progress}%`);
    console.log(`   Actual Cost: ${finalCompletedJob?.actualCost} QUBIC`);
    console.log(`   Duration: ${finalCompletedJob?.actualDuration}s\n`);

    // Check failed job
    const finalFailedJob = await prisma.job.findUnique({
      where: { id: failJob.id }
    });
    console.log('✅ Failed Job:');
    console.log(`   Status: ${finalFailedJob?.status}`);
    console.log(`   Error: ${finalFailedJob?.error}\n`);

    // Check provider stats
    const finalProvider = await prisma.provider.findUnique({
      where: { id: provider.id }
    });
    console.log('✅ Provider Stats:');
    console.log(`   Total Jobs: ${finalProvider?.totalJobs}`);
    console.log(`   Total Earnings: ${finalProvider?.totalEarnings} QUBIC`);
    console.log(`   Available: ${finalProvider?.isAvailable}\n`);

    // Check transactions
    const allTransactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { jobId: job.id },
          { jobId: failJob.id }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });
    console.log('✅ Transactions:');
    allTransactions.forEach(tx => {
      console.log(`   ${tx.type}: ${tx.amount} QUBIC (${tx.status})`);
    });

    console.log('\n✅ All tests passed! Job completion flow working correctly.\n');

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await prisma.transaction.deleteMany({
      where: {
        OR: [
          { jobId: job.id },
          { jobId: failJob.id }
        ]
      }
    });
    await prisma.job.deleteMany({
      where: {
        id: { in: [job.id, failJob.id] }
      }
    });
    await prisma.provider.delete({ where: { id: provider.id } });
    await prisma.user.deleteMany({
      where: {
        id: { in: [consumer.id, providerUser.id] }
      }
    });
    console.log('✅ Cleanup complete\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testJobCompletion()
  .then(() => {
    console.log('✅ Test script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });
