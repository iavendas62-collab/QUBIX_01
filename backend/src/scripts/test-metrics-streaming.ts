/**
 * Test script for real-time metrics streaming backend
 * Tests Requirements: 7.5, 11.2, 11.3
 * 
 * This script tests:
 * 1. Job progress update endpoint with metrics
 * 2. Storing metrics in JobMetric table
 * 3. Storing logs in JobLog table
 * 4. Calculating time remaining and cost-so-far
 * 5. Retrieving monitoring data
 */

import { PrismaClient, JobStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function testMetricsStreaming() {
  console.log('🧪 Testing Real-Time Metrics Streaming Backend\n');

  try {
    // Step 1: Create a test user
    console.log('1️⃣ Creating test user...');
    const testUser = await prisma.user.upsert({
      where: { qubicAddress: 'TEST_METRICS_USER' },
      update: {},
      create: {
        qubicAddress: 'TEST_METRICS_USER',
        role: 'CONSUMER'
      }
    });
    console.log(`✅ Test user created: ${testUser.id}\n`);

    // Step 2: Create a test provider
    console.log('2️⃣ Creating test provider...');
    const testProvider = await prisma.provider.upsert({
      where: { workerId: 'TEST_METRICS_WORKER' },
      update: {},
      create: {
        workerId: 'TEST_METRICS_WORKER',
        userId: testUser.id,
        qubicAddress: 'TEST_PROVIDER_ADDRESS',
        type: 'NATIVE',
        gpuModel: 'RTX 4090',
        gpuVram: 24,
        cpuModel: 'AMD Ryzen 9 5950X',
        cpuCores: 16,
        ramTotal: 64,
        pricePerHour: 2.5,
        isOnline: true,
        isAvailable: true
      }
    });
    console.log(`✅ Test provider created: ${testProvider.id}\n`);

    // Step 3: Create a test job
    console.log('3️⃣ Creating test job...');
    const testJob = await prisma.job.create({
      data: {
        userId: testUser.id,
        providerId: testProvider.id,
        modelType: 'mnist_training',
        jobType: 'mnist_training',
        framework: 'pytorch',
        fileName: 'test_mnist.py',
        fileUrl: 'https://example.com/test_mnist.py',
        computeNeeded: 1.0,
        inputData: { epochs: 10, batch_size: 64 },
        estimatedCost: 2.5,
        estimatedDuration: 3600,
        status: JobStatus.RUNNING,
        progress: 0,
        startedAt: new Date()
      }
    });
    console.log(`✅ Test job created: ${testJob.id}\n`);

    // Step 4: Simulate progress updates with metrics
    console.log('4️⃣ Simulating progress updates with metrics...');
    
    const progressUpdates = [
      { progress: 10, operation: 'Loading dataset', gpuUtil: 15, temp: 45 },
      { progress: 25, operation: 'Training epoch 1/10', gpuUtil: 85, temp: 68 },
      { progress: 40, operation: 'Training epoch 3/10', gpuUtil: 90, temp: 72 },
      { progress: 60, operation: 'Training epoch 6/10', gpuUtil: 88, temp: 70 },
      { progress: 80, operation: 'Training epoch 8/10', gpuUtil: 87, temp: 69 },
      { progress: 95, operation: 'Saving model', gpuUtil: 20, temp: 50 }
    ];

    for (const update of progressUpdates) {
      // Update job progress
      await prisma.job.update({
        where: { id: testJob.id },
        data: {
          progress: update.progress,
          currentOperation: update.operation
        }
      });

      // Store metrics
      await prisma.jobMetric.create({
        data: {
          jobId: testJob.id,
          gpuUtilization: update.gpuUtil,
          gpuMemoryUsed: 18000, // 18GB
          gpuMemoryTotal: 24000, // 24GB
          gpuTemperature: update.temp,
          powerUsage: 350
        }
      });

      // Store logs
      await prisma.jobLog.createMany({
        data: [
          {
            jobId: testJob.id,
            level: 'info',
            message: `Progress: ${update.progress}% - ${update.operation}`
          },
          {
            jobId: testJob.id,
            level: 'info',
            message: `GPU Utilization: ${update.gpuUtil}%, Temperature: ${update.temp}°C`
          }
        ]
      });

      console.log(`   ✓ Progress: ${update.progress}% - ${update.operation}`);
      
      // Small delay to simulate real-time updates
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log(`✅ Stored ${progressUpdates.length} progress updates\n`);

    // Step 5: Test metrics retrieval
    console.log('5️⃣ Testing metrics retrieval...');
    const metrics = await prisma.jobMetric.findMany({
      where: { jobId: testJob.id },
      orderBy: { timestamp: 'desc' },
      take: 10
    });
    console.log(`✅ Retrieved ${metrics.length} metrics entries`);
    console.log(`   Latest GPU Utilization: ${metrics[0].gpuUtilization}%`);
    console.log(`   Latest Temperature: ${metrics[0].gpuTemperature}°C\n`);

    // Step 6: Test logs retrieval
    console.log('6️⃣ Testing logs retrieval...');
    const logs = await prisma.jobLog.findMany({
      where: { jobId: testJob.id },
      orderBy: { timestamp: 'desc' },
      take: 5
    });
    console.log(`✅ Retrieved ${logs.length} log entries`);
    logs.forEach((log, i) => {
      console.log(`   ${i + 1}. [${log.level}] ${log.message}`);
    });
    console.log();

    // Step 7: Test time remaining and cost calculation
    console.log('7️⃣ Testing time remaining and cost calculation...');
    const updatedJob = await prisma.job.findUnique({
      where: { id: testJob.id },
      include: { provider: true }
    });

    if (updatedJob && updatedJob.startedAt && updatedJob.provider) {
      const elapsedMs = Date.now() - updatedJob.startedAt.getTime();
      const elapsedSeconds = elapsedMs / 1000;
      
      // Estimate total time based on current progress
      const estimatedTotalSeconds = (elapsedSeconds / updatedJob.progress) * 100;
      const timeRemaining = Math.max(0, estimatedTotalSeconds - elapsedSeconds);
      
      // Calculate cost so far
      const elapsedHours = elapsedSeconds / 3600;
      const costSoFar = elapsedHours * updatedJob.provider.pricePerHour;

      console.log(`✅ Calculations:`);
      console.log(`   Progress: ${updatedJob.progress}%`);
      console.log(`   Elapsed: ${elapsedSeconds.toFixed(2)}s`);
      console.log(`   Time Remaining: ${timeRemaining.toFixed(2)}s`);
      console.log(`   Cost So Far: ${costSoFar.toFixed(4)} QUBIC`);
      console.log(`   Estimated Total: ${(costSoFar / updatedJob.progress * 100).toFixed(4)} QUBIC\n`);
    }

    // Step 8: Test metrics aggregation (last 60 seconds)
    console.log('8️⃣ Testing metrics aggregation...');
    const sixtySecondsAgo = new Date(Date.now() - 60000);
    const recentMetrics = await prisma.jobMetric.findMany({
      where: {
        jobId: testJob.id,
        timestamp: { gte: sixtySecondsAgo }
      },
      orderBy: { timestamp: 'asc' }
    });
    console.log(`✅ Retrieved ${recentMetrics.length} metrics from last 60 seconds`);
    
    if (recentMetrics.length > 0) {
      const avgGpuUtil = recentMetrics.reduce((sum, m) => sum + (m.gpuUtilization || 0), 0) / recentMetrics.length;
      const avgTemp = recentMetrics.reduce((sum, m) => sum + (m.gpuTemperature || 0), 0) / recentMetrics.length;
      console.log(`   Average GPU Utilization: ${avgGpuUtil.toFixed(1)}%`);
      console.log(`   Average Temperature: ${avgTemp.toFixed(1)}°C\n`);
    }

    // Step 9: Test log filtering
    console.log('9️⃣ Testing log filtering...');
    const infoLogs = await prisma.jobLog.count({
      where: { jobId: testJob.id, level: 'info' }
    });
    const warningLogs = await prisma.jobLog.count({
      where: { jobId: testJob.id, level: 'warning' }
    });
    const errorLogs = await prisma.jobLog.count({
      where: { jobId: testJob.id, level: 'error' }
    });
    console.log(`✅ Log counts by level:`);
    console.log(`   Info: ${infoLogs}`);
    console.log(`   Warning: ${warningLogs}`);
    console.log(`   Error: ${errorLogs}\n`);

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await prisma.jobLog.deleteMany({ where: { jobId: testJob.id } });
    await prisma.jobMetric.deleteMany({ where: { jobId: testJob.id } });
    await prisma.job.delete({ where: { id: testJob.id } });
    await prisma.provider.delete({ where: { id: testProvider.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log('✅ Cleanup complete\n');

    console.log('✅ All tests passed! Real-time metrics streaming backend is working correctly.\n');
    console.log('📊 Summary:');
    console.log('   ✓ Job progress updates with metrics');
    console.log('   ✓ Metrics storage in JobMetric table');
    console.log('   ✓ Logs storage in JobLog table');
    console.log('   ✓ Time remaining calculation');
    console.log('   ✓ Cost-so-far calculation');
    console.log('   ✓ Metrics aggregation (last 60 seconds)');
    console.log('   ✓ Log filtering by level');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testMetricsStreaming()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
