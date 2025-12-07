/**
 * Manual test script for job analysis endpoint
 * Run with: npm run dev (in one terminal) and tsx src/scripts/test-job-analysis.ts (in another)
 */

import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

// Sample Python scripts for testing
const sampleScripts = {
  mnist: `
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms

# MNIST Training Script
transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.1307,), (0.3081,))
])

train_dataset = datasets.MNIST('./data', train=True, download=True, transform=transform)
train_loader = torch.utils.data.DataLoader(train_dataset, batch_size=64, shuffle=True)

model = nn.Sequential(
    nn.Linear(784, 128),
    nn.ReLU(),
    nn.Linear(128, 10)
)

optimizer = optim.Adam(model.parameters())
criterion = nn.CrossEntropyLoss()

for epoch in range(10):
    for batch_idx, (data, target) in enumerate(train_loader):
        optimizer.zero_grad()
        output = model(data.view(-1, 784))
        loss = criterion(output, target)
        loss.backward()
        optimizer.step()
`,

  stableDiffusion: `
from diffusers import StableDiffusionPipeline
import torch

# Stable Diffusion Image Generation
pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5",
    torch_dtype=torch.float16
)
pipe = pipe.to("cuda")

prompts = [
    "A beautiful landscape with mountains",
    "A futuristic city at night",
    "An abstract painting in the style of Picasso"
]

for i, prompt in enumerate(prompts):
    image = pipe(prompt, num_inference_steps=50).images[0]
    image.save(f"output_{i}.png")
`,

  tensorflow: `
import tensorflow as tf
from tensorflow import keras
import numpy as np

# TensorFlow Model Training
(x_train, y_train), (x_test, y_test) = keras.datasets.mnist.load_data()
x_train = x_train.astype('float32') / 255
x_test = x_test.astype('float32') / 255

model = keras.Sequential([
    keras.layers.Flatten(input_shape=(28, 28)),
    keras.layers.Dense(128, activation='relu'),
    keras.layers.Dropout(0.2),
    keras.layers.Dense(10, activation='softmax')
])

model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

model.fit(x_train, y_train, epochs=5, validation_split=0.2)
`,

  inference: `
import torch
import torch.nn as nn

# Model Inference Script
model = torch.load('trained_model.pth')
model.eval()

def predict(input_data):
    with torch.no_grad():
        output = model(input_data)
        predictions = output.argmax(dim=1)
        return predictions

# Run inference on batch
batch = torch.randn(32, 784)
results = predict(batch)
print(f"Predictions: {results}")
`,

  custom: `
# Custom Python Script
import numpy as np
import pandas as pd

data = pd.read_csv('data.csv')
processed = data.groupby('category').mean()
processed.to_csv('output.csv')
print("Processing complete!")
`
};

async function testAnalysis(scriptName: string, scriptContent: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${scriptName}`);
  console.log('='.repeat(60));

  try {
    // Create a temporary file
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFile = path.join(tempDir, `${scriptName}.py`);
    fs.writeFileSync(tempFile, scriptContent);

    // Create form data
    const form = new FormData();
    form.append('file', fs.createReadStream(tempFile), `${scriptName}.py`);

    // Make request
    const response = await fetch('http://localhost:3000/api/jobs/analyze', {
      method: 'POST',
      body: form as any,
      headers: form.getHeaders()
    });

    const result: any = await response.json();

    // Clean up
    fs.unlinkSync(tempFile);

    // Display results
    if (result.success) {
      console.log('✅ Analysis successful!');
      console.log('\nResults:');
      console.log(`  Job Type: ${result.analysis.jobType}`);
      console.log(`  Framework: ${result.analysis.detectedFramework}`);
      console.log(`  Confidence: ${result.analysis.confidence}`);
      console.log(`  Estimated VRAM: ${result.analysis.estimatedVRAM} GB`);
      console.log(`  Estimated Compute: ${result.analysis.estimatedCompute} TFLOPS`);
      console.log(`  Estimated RAM: ${result.analysis.estimatedRAM} GB`);
      console.log(`  Estimated Storage: ${result.analysis.estimatedStorage} GB`);
    } else {
      console.log('❌ Analysis failed:', result.error);
    }
  } catch (error: any) {
    console.log('❌ Error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Job Analysis Tests');
  console.log('Make sure the backend server is running on http://localhost:3000\n');

  // Test each sample script
  for (const [name, content] of Object.entries(sampleScripts)) {
    await testAnalysis(name, content);
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests completed!');
  console.log('='.repeat(60));
}

// Run tests
runTests().catch(console.error);
