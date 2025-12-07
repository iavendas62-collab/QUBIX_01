/**
 * Job Analysis Service Tests
 * Tests for file analysis and GPU requirement extraction
 */

import {
  analyzePythonScript,
  analyzeJupyterNotebook,
  analyzeDockerfile,
  calculateGPURequirements,
  analyzeJobFile
} from '../services/job-analysis.service';

describe('Job Analysis Service', () => {
  describe('analyzePythonScript', () => {
    it('should detect PyTorch framework', () => {
      const script = `
import torch
import torch.nn as nn

model = nn.Linear(10, 1)
      `;
      const result = analyzePythonScript(script);
      expect(result.detectedFramework).toBe('pytorch');
      expect(result.confidence).toBe('high');
    });

    it('should detect TensorFlow framework', () => {
      const script = `
import tensorflow as tf
from tensorflow import keras

model = keras.Sequential()
      `;
      const result = analyzePythonScript(script);
      expect(result.detectedFramework).toBe('tensorflow');
      expect(result.confidence).toBe('high');
    });

    it('should detect JAX framework', () => {
      const script = `
import jax
import jax.numpy as jnp

x = jnp.array([1, 2, 3])
      `;
      const result = analyzePythonScript(script);
      expect(result.detectedFramework).toBe('jax');
      expect(result.confidence).toBe('high');
    });

    it('should detect MNIST training job', () => {
      const script = `
import torch
from torchvision.datasets import MNIST

dataset = MNIST(root='./data', train=True)
      `;
      const result = analyzePythonScript(script);
      expect(result.jobType).toBe('mnist_training');
      expect(result.confidence).toBe('high');
    });

    it('should detect Stable Diffusion job', () => {
      const script = `
from diffusers import StableDiffusionPipeline

pipe = StableDiffusionPipeline.from_pretrained("model")
      `;
      const result = analyzePythonScript(script);
      expect(result.jobType).toBe('stable_diffusion');
      expect(result.confidence).toBe('high');
    });

    it('should detect inference job', () => {
      const script = `
import torch

model.eval()
with torch.no_grad():
    output = model(input)
      `;
      const result = analyzePythonScript(script);
      expect(result.jobType).toBe('inference');
      expect(result.confidence).toBe('medium');
    });

    it('should default to custom_script for unknown code', () => {
      const script = `
print("Hello World")
x = 1 + 1
      `;
      const result = analyzePythonScript(script);
      expect(result.jobType).toBe('custom_script');
      expect(result.detectedFramework).toBe('none');
    });

    it('should detect PyTorch with from import', () => {
      const script = `
from torch import nn
from torch.optim import Adam

model = nn.Sequential()
      `;
      const result = analyzePythonScript(script);
      expect(result.detectedFramework).toBe('pytorch');
      expect(result.confidence).toBe('high');
    });

    it('should detect TensorFlow with keras import', () => {
      const script = `
from tensorflow.keras import layers
from tensorflow.keras.models import Sequential

model = Sequential()
      `;
      const result = analyzePythonScript(script);
      expect(result.detectedFramework).toBe('tensorflow');
      expect(result.confidence).toBe('high');
    });

    it('should detect MNIST with keras datasets', () => {
      const script = `
from tensorflow.keras.datasets import mnist

(x_train, y_train), (x_test, y_test) = mnist.load_data()
      `;
      const result = analyzePythonScript(script);
      expect(result.jobType).toBe('mnist_training');
      expect(result.confidence).toBe('high');
    });

    it('should detect Stable Diffusion with diffusers import', () => {
      const script = `
from diffusers import DiffusionPipeline
import torch

pipeline = DiffusionPipeline.from_pretrained("model")
      `;
      const result = analyzePythonScript(script);
      expect(result.jobType).toBe('stable_diffusion');
      expect(result.detectedFramework).toBe('pytorch');
      expect(result.confidence).toBe('high');
    });

    it('should detect training job with optimizer.step()', () => {
      const script = `
import torch

for epoch in range(10):
    loss = criterion(output, target)
    loss.backward()
    optimizer.step()
      `;
      const result = analyzePythonScript(script);
      expect(result.detectedFramework).toBe('pytorch');
      expect(result.jobType).toBe('custom_script');
      expect(result.confidence).toBe('high');
    });

    it('should detect inference with torch.no_grad()', () => {
      const script = `
import torch

with torch.no_grad():
    predictions = model(input_data)
      `;
      const result = analyzePythonScript(script);
      expect(result.jobType).toBe('inference');
      expect(result.detectedFramework).toBe('pytorch');
    });

    it('should prioritize PyTorch over TensorFlow', () => {
      const script = `
import torch
import tensorflow as tf

# Mixed framework code
      `;
      const result = analyzePythonScript(script);
      expect(result.detectedFramework).toBe('pytorch');
    });

    it('should detect JAX with jax.numpy import', () => {
      const script = `
from jax import numpy as jnp
from jax import grad

def loss_fn(params):
    return jnp.sum(params ** 2)
      `;
      const result = analyzePythonScript(script);
      expect(result.detectedFramework).toBe('jax');
      expect(result.confidence).toBe('high');
    });
  });

  describe('analyzeJupyterNotebook', () => {
    it('should analyze Jupyter notebook cells', () => {
      const notebook = JSON.stringify({
        cells: [
          {
            cell_type: 'code',
            source: ['import torch\n', 'import torch.nn as nn']
          },
          {
            cell_type: 'markdown',
            source: ['# Training']
          },
          {
            cell_type: 'code',
            source: ['model = nn.Linear(10, 1)']
          }
        ]
      });

      const result = analyzeJupyterNotebook(notebook);
      expect(result.detectedFramework).toBe('pytorch');
      expect(result.confidence).toBe('high');
      expect(result.estimatedRAM).toBeGreaterThan(0);
    });

    it('should handle invalid JSON gracefully', () => {
      const result = analyzeJupyterNotebook('invalid json');
      expect(result.jobType).toBe('custom_script');
      expect(result.confidence).toBe('low');
    });
  });

  describe('analyzeDockerfile', () => {
    it('should detect PyTorch in Dockerfile', () => {
      const dockerfile = `
FROM nvidia/cuda:11.8-base
RUN pip install torch torchvision
COPY train.py /app/
      `;
      const result = analyzeDockerfile(dockerfile);
      expect(result.detectedFramework).toBe('pytorch');
      expect(result.confidence).toBe('high');
    });

    it('should detect TensorFlow in Dockerfile', () => {
      const dockerfile = `
FROM tensorflow/tensorflow:latest-gpu
RUN pip install tensorflow-datasets
      `;
      const result = analyzeDockerfile(dockerfile);
      expect(result.detectedFramework).toBe('tensorflow');
      expect(result.confidence).toBe('high');
    });

    it('should detect CUDA requirements', () => {
      const dockerfile = `
FROM nvidia/cuda:11.8-base
RUN apt-get install cuda-toolkit
      `;
      const result = analyzeDockerfile(dockerfile);
      expect(result.estimatedVRAM).toBeGreaterThanOrEqual(8);
    });
  });

  describe('calculateGPURequirements', () => {
    it('should calculate requirements for MNIST training', () => {
      const result = calculateGPURequirements('mnist_training', 'pytorch');
      expect(result.estimatedVRAM).toBeGreaterThan(0);
      expect(result.estimatedCompute).toBeGreaterThan(0);
      expect(result.estimatedRAM).toBeGreaterThan(0);
      expect(result.estimatedStorage).toBeGreaterThan(0);
    });

    it('should calculate requirements for Stable Diffusion', () => {
      const result = calculateGPURequirements('stable_diffusion', 'pytorch');
      expect(result.estimatedVRAM).toBeGreaterThanOrEqual(12);
      expect(result.estimatedCompute).toBeGreaterThan(0);
    });

    it('should apply framework multipliers', () => {
      const pytorchReqs = calculateGPURequirements('custom_script', 'pytorch');
      const tensorflowReqs = calculateGPURequirements('custom_script', 'tensorflow');
      
      // TensorFlow should have higher requirements due to multiplier
      expect(tensorflowReqs.estimatedVRAM).toBeGreaterThanOrEqual(pytorchReqs.estimatedVRAM);
    });

    it('should ensure all requirements are positive', () => {
      const result = calculateGPURequirements('custom_script', 'none');
      expect(result.estimatedVRAM).toBeGreaterThan(0);
      expect(result.estimatedCompute).toBeGreaterThan(0);
      expect(result.estimatedRAM).toBeGreaterThan(0);
      expect(result.estimatedStorage).toBeGreaterThan(0);
    });
  });

  describe('analyzeJobFile', () => {
    it('should analyze Python file', () => {
      const content = `
import torch
from torchvision.datasets import MNIST

dataset = MNIST(root='./data', train=True)
      `;
      const result = analyzeJobFile('train.py', content);
      
      expect(result.jobType).toBe('mnist_training');
      expect(result.detectedFramework).toBe('pytorch');
      expect(result.confidence).toBe('high');
      expect(result.estimatedVRAM).toBeGreaterThan(0);
      expect(result.estimatedCompute).toBeGreaterThan(0);
      expect(result.estimatedRAM).toBeGreaterThan(0);
      expect(result.estimatedStorage).toBeGreaterThan(0);
    });

    it('should analyze Jupyter notebook', () => {
      const notebook = JSON.stringify({
        cells: [
          {
            cell_type: 'code',
            source: ['import torch\n', 'from diffusers import StableDiffusionPipeline']
          }
        ]
      });
      
      const result = analyzeJobFile('notebook.ipynb', notebook);
      expect(result.jobType).toBe('stable_diffusion');
      expect(result.detectedFramework).toBe('pytorch');
    });

    it('should analyze Dockerfile', () => {
      const dockerfile = `
FROM tensorflow/tensorflow:latest-gpu
RUN pip install tensorflow-datasets
      `;
      
      const result = analyzeJobFile('Dockerfile', dockerfile);
      expect(result.detectedFramework).toBe('tensorflow');
    });

    it('should handle unknown file types', () => {
      const result = analyzeJobFile('unknown.txt', 'some content');
      expect(result.jobType).toBe('custom_script');
      expect(result.detectedFramework).toBe('none');
      expect(result.confidence).toBe('low');
      expect(result.estimatedVRAM).toBeGreaterThan(0);
    });

    it('should return complete JobAnalysis object', () => {
      const result = analyzeJobFile('test.py', 'import torch');
      
      expect(result).toHaveProperty('jobType');
      expect(result).toHaveProperty('detectedFramework');
      expect(result).toHaveProperty('estimatedVRAM');
      expect(result).toHaveProperty('estimatedCompute');
      expect(result).toHaveProperty('estimatedRAM');
      expect(result).toHaveProperty('estimatedStorage');
      expect(result).toHaveProperty('confidence');
    });
  });
});
