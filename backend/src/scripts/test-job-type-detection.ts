/**
 * Test script for job type detection from script content
 * Requirements: 14.1, 2.1
 */

import * as fs from 'fs';
import * as path from 'path';
import { analyzeJobFile } from '../services/job-analysis.service';

console.log('Testing Job Type Detection from Script Content\n');
console.log('='.repeat(60));

// Test with sample MNIST file
const mnistPath = path.join(__dirname, '../../../test-files/sample-mnist.py');
if (fs.existsSync(mnistPath)) {
  const mnistContent = fs.readFileSync(mnistPath, 'utf-8');
  const mnistResult = analyzeJobFile('sample-mnist.py', mnistContent);
  
  console.log('\n1. MNIST Training Script:');
  console.log('   File: sample-mnist.py');
  console.log(`   Job Type: ${mnistResult.jobType}`);
  console.log(`   Framework: ${mnistResult.detectedFramework}`);
  console.log(`   Confidence: ${mnistResult.confidence}`);
  console.log(`   VRAM: ${mnistResult.estimatedVRAM} GB`);
  console.log(`   Compute: ${mnistResult.estimatedCompute} TFLOPS`);
  console.log(`   RAM: ${mnistResult.estimatedRAM} GB`);
  console.log(`   Storage: ${mnistResult.estimatedStorage} GB`);
  
  // Verify detection
  if (mnistResult.jobType === 'mnist_training' && 
      mnistResult.detectedFramework === 'pytorch' &&
      mnistResult.confidence === 'high') {
    console.log('   ✓ MNIST detection PASSED');
  } else {
    console.log('   ✗ MNIST detection FAILED');
  }
}

// Test with sample Stable Diffusion file
const sdPath = path.join(__dirname, '../../../test-files/sample-stable-diffusion.py');
if (fs.existsSync(sdPath)) {
  const sdContent = fs.readFileSync(sdPath, 'utf-8');
  const sdResult = analyzeJobFile('sample-stable-diffusion.py', sdContent);
  
  console.log('\n2. Stable Diffusion Script:');
  console.log('   File: sample-stable-diffusion.py');
  console.log(`   Job Type: ${sdResult.jobType}`);
  console.log(`   Framework: ${sdResult.detectedFramework}`);
  console.log(`   Confidence: ${sdResult.confidence}`);
  console.log(`   VRAM: ${sdResult.estimatedVRAM} GB`);
  console.log(`   Compute: ${sdResult.estimatedCompute} TFLOPS`);
  console.log(`   RAM: ${sdResult.estimatedRAM} GB`);
  console.log(`   Storage: ${sdResult.estimatedStorage} GB`);
  
  // Verify detection
  if (sdResult.jobType === 'stable_diffusion' && 
      sdResult.detectedFramework === 'pytorch' &&
      sdResult.confidence === 'high') {
    console.log('   ✓ Stable Diffusion detection PASSED');
  } else {
    console.log('   ✗ Stable Diffusion detection FAILED');
  }
}

// Test with various framework imports
const testCases = [
  {
    name: 'PyTorch Import',
    content: 'import torch\nimport torch.nn as nn\n',
    expectedFramework: 'pytorch',
    expectedConfidence: 'high'
  },
  {
    name: 'TensorFlow Import',
    content: 'import tensorflow as tf\nfrom tensorflow import keras\n',
    expectedFramework: 'tensorflow',
    expectedConfidence: 'high'
  },
  {
    name: 'JAX Import',
    content: 'import jax\nfrom jax import numpy as jnp\n',
    expectedFramework: 'jax',
    expectedConfidence: 'high'
  },
  {
    name: 'Diffusers Import',
    content: 'from diffusers import StableDiffusionPipeline\nimport torch\n',
    expectedFramework: 'pytorch',
    expectedJobType: 'stable_diffusion'
  },
  {
    name: 'MNIST with TensorFlow',
    content: 'from tensorflow.keras.datasets import mnist\n(x_train, y_train), _ = mnist.load_data()\n',
    expectedFramework: 'tensorflow',
    expectedJobType: 'mnist_training'
  },
  {
    name: 'Inference Pattern',
    content: 'import torch\nwith torch.no_grad():\n    predictions = model(data)\n',
    expectedFramework: 'pytorch',
    expectedJobType: 'inference'
  }
];

console.log('\n3. Framework Detection Tests:');
testCases.forEach((testCase, index) => {
  const result = analyzeJobFile('test.py', testCase.content);
  const frameworkMatch = result.detectedFramework === testCase.expectedFramework;
  const jobTypeMatch = !testCase.expectedJobType || result.jobType === testCase.expectedJobType;
  const confidenceMatch = !testCase.expectedConfidence || result.confidence === testCase.expectedConfidence;
  
  console.log(`\n   ${index + 1}. ${testCase.name}:`);
  console.log(`      Framework: ${result.detectedFramework} ${frameworkMatch ? '✓' : '✗'}`);
  if (testCase.expectedJobType) {
    console.log(`      Job Type: ${result.jobType} ${jobTypeMatch ? '✓' : '✗'}`);
  }
  if (testCase.expectedConfidence) {
    console.log(`      Confidence: ${result.confidence} ${confidenceMatch ? '✓' : '✗'}`);
  }
  
  if (frameworkMatch && jobTypeMatch && confidenceMatch) {
    console.log(`      Status: PASSED`);
  } else {
    console.log(`      Status: FAILED`);
  }
});

console.log('\n' + '='.repeat(60));
console.log('Job Type Detection Test Complete\n');
