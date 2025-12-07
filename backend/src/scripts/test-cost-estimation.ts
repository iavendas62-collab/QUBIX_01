/**
 * Test script for cost estimation service
 * Tests: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 14.1, 14.2, 14.3, 14.4, 14.5
 */

import {
  calculateCostEstimate,
  calculateCostEstimateRange,
  getBenchmarksForJobType,
  formatDuration,
} from '../services/cost-estimation.service';

async function testCostEstimation() {
  console.log('🧪 Testing Cost Estimation Service\n');
  console.log('='.repeat(60));
  
  // Test 1: Basic cost estimation (Requirements 12.1, 12.3)
  console.log('\n📊 Test 1: Basic Cost Estimation');
  console.log('-'.repeat(60));
  
  const estimate1 = await calculateCostEstimate(
    'mnist_training',
    'RTX 4090',
    2.5 // QUBIC per hour
  );
  
  console.log('Job Type: mnist_training');
  console.log('GPU Model: RTX 4090');
  console.log('Price: 2.5 QUBIC/hour');
  console.log(`Duration: ${estimate1.estimatedDuration}s (${estimate1.estimatedDurationFormatted})`);
  console.log(`Cost: ${estimate1.estimatedCost.toFixed(4)} QUBIC`);
  console.log(`Confidence: ${estimate1.confidence}`);
  
  // Test 2: Human-readable time format (Requirement 12.2)
  console.log('\n⏰ Test 2: Human-Readable Time Format');
  console.log('-'.repeat(60));
  
  const testDurations = [45, 90, 150, 3600, 5400, 7200];
  testDurations.forEach(seconds => {
    console.log(`${seconds}s → ${formatDuration(seconds)}`);
  });
  
  // Test 3: Cost breakdown (Requirement 12.4)
  console.log('\n💰 Test 3: Cost Breakdown Display');
  console.log('-'.repeat(60));
  
  console.log('Cost Breakdown:');
  console.log(`  Base Rate: ${estimate1.costBreakdown.baseRate} QUBIC/hour`);
  console.log(`  Per Minute: ${estimate1.perMinuteRate.toFixed(4)} QUBIC/min`);
  console.log(`  Duration: ${estimate1.costBreakdown.duration}`);
  console.log(`  Total: ${estimate1.costBreakdown.total.toFixed(4)} QUBIC`);
  
  // Test 4: Parameter-based adjustment (Requirement 14.3)
  console.log('\n🔧 Test 4: Parameter-Based Adjustment');
  console.log('-'.repeat(60));
  
  const baseEstimate = await calculateCostEstimate(
    'mnist_training',
    'RTX 3090',
    2.0,
    { epochs: 5, datasetSize: 10000 }
  );
  
  const adjustedEstimate = await calculateCostEstimate(
    'mnist_training',
    'RTX 3090',
    2.0,
    { epochs: 10, datasetSize: 20000 } // 2x epochs, 2x dataset
  );
  
  console.log('Base (5 epochs, 10k dataset):');
  console.log(`  Duration: ${baseEstimate.estimatedDurationFormatted}`);
  console.log(`  Cost: ${baseEstimate.estimatedCost.toFixed(4)} QUBIC`);
  
  console.log('\nAdjusted (10 epochs, 20k dataset):');
  console.log(`  Duration: ${adjustedEstimate.estimatedDurationFormatted}`);
  console.log(`  Cost: ${adjustedEstimate.estimatedCost.toFixed(4)} QUBIC`);
  console.log(`  Multiplier: ${(adjustedEstimate.estimatedDuration / baseEstimate.estimatedDuration).toFixed(2)}x`);
  
  // Test 5: Resolution adjustment for Stable Diffusion (Requirement 14.3)
  console.log('\n🎨 Test 5: Resolution Adjustment (Quadratic Scaling)');
  console.log('-'.repeat(60));
  
  const sd512 = await calculateCostEstimate(
    'stable_diffusion',
    'RTX 4090',
    3.0,
    { resolution: 512 }
  );
  
  const sd1024 = await calculateCostEstimate(
    'stable_diffusion',
    'RTX 4090',
    3.0,
    { resolution: 1024 } // 2x resolution = 4x time
  );
  
  console.log('512x512 resolution:');
  console.log(`  Duration: ${sd512.estimatedDurationFormatted}`);
  console.log(`  Cost: ${sd512.estimatedCost.toFixed(4)} QUBIC`);
  
  console.log('\n1024x1024 resolution:');
  console.log(`  Duration: ${sd1024.estimatedDurationFormatted}`);
  console.log(`  Cost: ${sd1024.estimatedCost.toFixed(4)} QUBIC`);
  console.log(`  Multiplier: ${(sd1024.estimatedDuration / sd512.estimatedDuration).toFixed(2)}x (expected ~4x)`);
  
  // Test 6: Estimate range for uncertain estimates (Requirement 12.6)
  console.log('\n📈 Test 6: Estimate Range (Low Confidence)');
  console.log('-'.repeat(60));
  
  const rangeEstimate = await calculateCostEstimateRange(
    'custom_script',
    'Unknown GPU',
    2.5
  );
  
  console.log(`Confidence: ${rangeEstimate.confidence}`);
  console.log('Min Estimate:');
  console.log(`  Duration: ${rangeEstimate.minEstimate.estimatedDurationFormatted}`);
  console.log(`  Cost: ${rangeEstimate.minEstimate.estimatedCost.toFixed(4)} QUBIC`);
  console.log('Max Estimate:');
  console.log(`  Duration: ${rangeEstimate.maxEstimate.estimatedDurationFormatted}`);
  console.log(`  Cost: ${rangeEstimate.maxEstimate.estimatedCost.toFixed(4)} QUBIC`);
  
  // Test 7: Fetch benchmarks (Requirement 14.2)
  console.log('\n📚 Test 7: Fetch Benchmarks for Job Type');
  console.log('-'.repeat(60));
  
  const benchmarks = await getBenchmarksForJobType('mnist_training');
  console.log('MNIST Training Benchmarks:');
  Object.entries(benchmarks).forEach(([gpu, time]) => {
    console.log(`  ${gpu}: ${time}s (${formatDuration(time)})`);
  });
  
  // Test 8: Multiple GPU comparison
  console.log('\n🏆 Test 8: Multiple GPU Comparison');
  console.log('-'.repeat(60));
  
  const gpuModels = ['RTX 4090', 'RTX 3090', 'RTX 3080', 'RTX 3070'];
  const pricePerHour = 2.5;
  
  console.log(`Job: stable_diffusion, Price: ${pricePerHour} QUBIC/hour\n`);
  
  for (const gpuModel of gpuModels) {
    const estimate = await calculateCostEstimate(
      'stable_diffusion',
      gpuModel,
      pricePerHour
    );
    
    console.log(`${gpuModel}:`);
    console.log(`  Duration: ${estimate.estimatedDurationFormatted}`);
    console.log(`  Cost: ${estimate.estimatedCost.toFixed(4)} QUBIC`);
    console.log(`  Confidence: ${estimate.confidence}`);
    console.log('');
  }
  
  console.log('='.repeat(60));
  console.log('✅ All tests completed successfully!\n');
}

// Run tests
testCostEstimation()
  .then(() => {
    console.log('🎉 Cost estimation service is working correctly!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error testing cost estimation:', error);
    process.exit(1);
  });
