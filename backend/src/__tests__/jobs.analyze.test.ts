/**
 * Job Analysis API Endpoint Tests
 * Tests for /api/jobs/analyze endpoint
 */

import request from 'supertest';
import express from 'express';
import { jobRoutes } from '../routes/jobs';

describe('POST /api/jobs/analyze', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/jobs', jobRoutes({}));
  });

  it('should analyze a Python script with PyTorch', async () => {
    const pythonScript = `
import torch
import torch.nn as nn
from torchvision.datasets import MNIST

# MNIST training script
dataset = MNIST(root='./data', train=True, download=True)
model = nn.Sequential(nn.Linear(784, 128), nn.ReLU(), nn.Linear(128, 10))
    `;

    const response = await request(app)
      .post('/api/jobs/analyze')
      .attach('file', Buffer.from(pythonScript), 'train_mnist.py');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.analysis).toBeDefined();
    expect(response.body.analysis.jobType).toBe('mnist_training');
    expect(response.body.analysis.detectedFramework).toBe('pytorch');
    expect(response.body.analysis.confidence).toBe('high');
    expect(response.body.analysis.estimatedVRAM).toBeGreaterThan(0);
    expect(response.body.analysis.estimatedCompute).toBeGreaterThan(0);
    expect(response.body.analysis.estimatedRAM).toBeGreaterThan(0);
    expect(response.body.analysis.estimatedStorage).toBeGreaterThan(0);
  });

  it('should analyze a Stable Diffusion script', async () => {
    const sdScript = `
from diffusers import StableDiffusionPipeline
import torch

pipe = StableDiffusionPipeline.from_pretrained("runwayml/stable-diffusion-v1-5")
pipe = pipe.to("cuda")

prompt = "A beautiful landscape"
image = pipe(prompt).images[0]
    `;

    const response = await request(app)
      .post('/api/jobs/analyze')
      .attach('file', Buffer.from(sdScript), 'generate_image.py');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.analysis.jobType).toBe('stable_diffusion');
    expect(response.body.analysis.detectedFramework).toBe('pytorch');
    expect(response.body.analysis.estimatedVRAM).toBeGreaterThanOrEqual(12);
  });

  it('should analyze a TensorFlow script', async () => {
    const tfScript = `
import tensorflow as tf
from tensorflow import keras

model = keras.Sequential([
    keras.layers.Dense(128, activation='relu'),
    keras.layers.Dense(10, activation='softmax')
])
    `;

    const response = await request(app)
      .post('/api/jobs/analyze')
      .attach('file', Buffer.from(tfScript), 'model.py');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.analysis.detectedFramework).toBe('tensorflow');
  });

  it('should analyze a Jupyter notebook', async () => {
    const notebook = JSON.stringify({
      cells: [
        {
          cell_type: 'code',
          source: ['import torch\n', 'import torch.nn as nn']
        },
        {
          cell_type: 'code',
          source: ['from torchvision.datasets import MNIST\n', 'dataset = MNIST(root="./data")']
        }
      ]
    });

    const response = await request(app)
      .post('/api/jobs/analyze')
      .attach('file', Buffer.from(notebook), 'notebook.ipynb');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.analysis.jobType).toBe('mnist_training');
    expect(response.body.analysis.detectedFramework).toBe('pytorch');
  });

  it('should analyze a Dockerfile', async () => {
    const dockerfile = `
FROM nvidia/cuda:11.8-base
RUN pip install torch torchvision
COPY train.py /app/
WORKDIR /app
CMD ["python", "train.py"]
    `;

    const response = await request(app)
      .post('/api/jobs/analyze')
      .attach('file', Buffer.from(dockerfile), 'Dockerfile');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.analysis.detectedFramework).toBe('pytorch');
    expect(response.body.analysis.estimatedVRAM).toBeGreaterThan(0);
  });

  it('should handle custom scripts with no framework', async () => {
    const customScript = `
print("Hello World")
x = 1 + 1
for i in range(10):
    print(i)
    `;

    const response = await request(app)
      .post('/api/jobs/analyze')
      .attach('file', Buffer.from(customScript), 'script.py');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.analysis.jobType).toBe('custom_script');
    expect(response.body.analysis.detectedFramework).toBe('none');
    expect(response.body.analysis.confidence).toBe('low');
  });

  it('should return error when no file is uploaded', async () => {
    const response = await request(app)
      .post('/api/jobs/analyze');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('No file uploaded');
  });

  it('should handle inference scripts', async () => {
    const inferenceScript = `
import torch

model = torch.load('model.pth')
model.eval()

with torch.no_grad():
    output = model(input_data)
    predictions = output.argmax(dim=1)
    `;

    const response = await request(app)
      .post('/api/jobs/analyze')
      .attach('file', Buffer.from(inferenceScript), 'inference.py');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.analysis.jobType).toBe('inference');
    expect(response.body.analysis.detectedFramework).toBe('pytorch');
  });

  it('should return fileName in response', async () => {
    const script = 'import torch';
    const fileName = 'my_script.py';

    const response = await request(app)
      .post('/api/jobs/analyze')
      .attach('file', Buffer.from(script), fileName);

    expect(response.status).toBe(200);
    expect(response.body.fileName).toBe(fileName);
  });

  it('should handle JAX framework', async () => {
    const jaxScript = `
import jax
import jax.numpy as jnp

def loss_fn(params, x, y):
    predictions = model(params, x)
    return jnp.mean((predictions - y) ** 2)
    `;

    const response = await request(app)
      .post('/api/jobs/analyze')
      .attach('file', Buffer.from(jaxScript), 'train.py');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.analysis.detectedFramework).toBe('jax');
  });
});
