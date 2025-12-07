/**
 * Test script for GPU matching API
 * Tests the GPU matching endpoint with sample data
 */

import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function testGPUMatching() {
  console.log('🧪 Testing GPU Matching API...\n');

  try {
    // Test 1: Match GPUs for MNIST training
    console.log('Test 1: MNIST Training Job');
    console.log('=' .repeat(50));
    
    const mnistRequirements = {
      jobType: 'mnist_training',
      detectedFramework: 'pytorch',
      estimatedVRAM: 4,
      estimatedCompute: 5,
      estimatedRAM: 8,
      estimatedStorage: 2,
      confidence: 'high'
    };

    const response1 = await axios.post(`${API_URL}/api/providers/match`, {
      jobRequirements: mnistRequirements,
      sortBy: 'cost_benefit'
    });

    console.log(`✅ Found ${response1.data.totalCompatible} compatible GPUs`);
    console.log(`\nTop 3 Recommendations:`);
    response1.data.recommendations.forEach((gpu: any, index: number) => {
      console.log(`\n${index + 1}. ${gpu.provider.gpuModel}`);
      console.log(`   Compatibility: ${gpu.compatibility}`);
      console.log(`   Duration: ${gpu.estimatedDurationFormatted}`);
      console.log(`   Cost: ${gpu.estimatedCost.toFixed(2)} QUBIC`);
      console.log(`   Cost-Benefit Score: ${gpu.costBenefitScore}/100`);
      if (gpu.warnings.length > 0) {
        console.log(`   ⚠️  Warnings: ${gpu.warnings.join(', ')}`);
      }
    });

    // Test 2: Match GPUs for Stable Diffusion with custom parameters
    console.log('\n\n' + '='.repeat(50));
    console.log('Test 2: Stable Diffusion (1024x1024)');
    console.log('=' .repeat(50));
    
    const sdRequirements = {
      jobType: 'stable_diffusion',
      detectedFramework: 'pytorch',
      estimatedVRAM: 12,
      estimatedCompute: 15,
      estimatedRAM: 16,
      estimatedStorage: 10,
      confidence: 'high'
    };

    const response2 = await axios.post(`${API_URL}/api/providers/match`, {
      jobRequirements: sdRequirements,
      sortBy: 'cost_benefit',
      parameters: {
        resolution: 1024
      }
    });

    console.log(`✅ Found ${response2.data.totalCompatible} compatible GPUs`);
    console.log(`\nTop 3 Recommendations:`);
    response2.data.recommendations.forEach((gpu: any, index: number) => {
      console.log(`\n${index + 1}. ${gpu.provider.gpuModel}`);
      console.log(`   Compatibility: ${gpu.compatibility}`);
      console.log(`   Duration: ${gpu.estimatedDurationFormatted}`);
      console.log(`   Cost: ${gpu.estimatedCost.toFixed(2)} QUBIC`);
      console.log(`   Cost-Benefit Score: ${gpu.costBenefitScore}/100`);
    });

    // Test 3: Get benchmarks for job type
    console.log('\n\n' + '='.repeat(50));
    console.log('Test 3: Get Benchmarks for MNIST Training');
    console.log('=' .repeat(50));
    
    const response3 = await axios.get(`${API_URL}/api/providers/benchmarks/mnist_training`);
    
    console.log(`✅ Benchmarks for ${response3.data.jobType}:`);
    Object.entries(response3.data.benchmarks).forEach(([gpu, time]) => {
      console.log(`   ${gpu}: ${time}s`);
    });

    // Test 4: Sort by different criteria
    console.log('\n\n' + '='.repeat(50));
    console.log('Test 4: Sort by Price (Lowest First)');
    console.log('=' .repeat(50));
    
    const response4 = await axios.post(`${API_URL}/api/providers/match`, {
      jobRequirements: mnistRequirements,
      sortBy: 'price_low'
    });

    console.log(`\nCheapest Options:`);
    response4.data.compatibleGPUs.slice(0, 3).forEach((gpu: any, index: number) => {
      console.log(`\n${index + 1}. ${gpu.provider.gpuModel}`);
      console.log(`   Cost: ${gpu.estimatedCost.toFixed(2)} QUBIC`);
      console.log(`   Duration: ${gpu.estimatedDurationFormatted}`);
    });

    // Test 5: Sort by performance
    console.log('\n\n' + '='.repeat(50));
    console.log('Test 5: Sort by Performance (Fastest First)');
    console.log('=' .repeat(50));
    
    const response5 = await axios.post(`${API_URL}/api/providers/match`, {
      jobRequirements: mnistRequirements,
      sortBy: 'performance'
    });

    console.log(`\nFastest Options:`);
    response5.data.compatibleGPUs.slice(0, 3).forEach((gpu: any, index: number) => {
      console.log(`\n${index + 1}. ${gpu.provider.gpuModel}`);
      console.log(`   Duration: ${gpu.estimatedDurationFormatted}`);
      console.log(`   Cost: ${gpu.estimatedCost.toFixed(2)} QUBIC`);
    });

    console.log('\n\n✅ All GPU matching tests passed!');

  } catch (error: any) {
    console.error('❌ Error testing GPU matching:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

// Run tests
testGPUMatching();
