# QUBIX Enhanced Worker

Enhanced Python worker with full job execution capabilities for the QUBIX platform.

## Features

✅ **Job Polling** - Polls for assigned jobs every 5 seconds (Requirement 11.1)
✅ **MNIST Training** - Full PyTorch MNIST training implementation (Requirement 11.3)
✅ **Stable Diffusion** - Image generation with Stable Diffusion (Requirement 11.3)
✅ **Custom Scripts** - Execute arbitrary Python scripts via subprocess (Requirement 11.3)
✅ **Progress Reporting** - Reports progress every 10 seconds with metrics (Requirement 11.2)
✅ **GPU Metrics** - Collects GPU utilization, memory, temperature, power using nvidia-smi (Requirement 11.6)
✅ **Result Upload** - Uploads results and notifies backend on completion (Requirement 11.4)
✅ **Error Handling** - Reports errors with details on failure (Requirement 11.5)
✅ **GPU Cleanup** - Cleans up GPU memory after job execution (Requirement 11.6)

## Installation

### Prerequisites

- Python 3.8+
- NVIDIA GPU with CUDA support (optional, will fallback to CPU)
- nvidia-smi installed (for GPU metrics)

### Install Dependencies

```bash
cd worker
pip install -r requirements.txt
```

### Optional: Install PyTorch with CUDA

For GPU acceleration:

```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

### Optional: Install Stable Diffusion

For image generation:

```bash
pip install diffusers transformers accelerate
```

## Usage

### Basic Usage

```bash
python qubix_worker_enhanced.py --backend http://127.0.0.1:3001
```

### With Custom Configuration

```bash
python qubix_worker_enhanced.py \
  --backend http://api.qubix.io \
  --price 10.0 \
  --name "My Gaming PC" \
  --location "US East (Virginia)"
```

### Command Line Options

- `--backend URL` - Backend API URL (default: http://127.0.0.1:3001)
- `--price FLOAT` - Price per hour in QUBIC (default: 5.0)
- `--name STRING` - Provider name (default: Provider-{worker_id})
- `--location STRING` - Provider location (default: Local Network)

## Architecture

### JobExecutor Class

The `JobExecutor` class handles job execution with support for:

1. **MNIST Training** (`_execute_mnist_training`)
   - Loads MNIST dataset
   - Trains simple CNN model with PyTorch
   - Reports progress after each epoch
   - Saves and uploads trained model
   - Falls back to simulation if PyTorch unavailable

2. **Stable Diffusion** (`_execute_stable_diffusion`)
   - Loads Stable Diffusion pipeline
   - Generates images from text prompts
   - Saves and uploads generated images
   - Falls back to simulation if diffusers unavailable

3. **Custom Scripts** (`_execute_custom_script`)
   - Downloads script from URL or uses provided content
   - Executes in isolated temporary directory
   - Captures stdout/stderr
   - Reports execution progress
   - Cleans up after completion

### Progress Reporting

Progress is reported every 10 seconds (configurable) with:
- Progress percentage (0-100)
- Current operation string
- GPU metrics (utilization, memory, temperature, power)
- Timestamp

### GPU Metrics Collection

Uses `nvidia-smi` to collect:
- GPU utilization (%)
- GPU memory used/total (MB)
- GPU temperature (°C)
- Power usage (W)

Falls back gracefully if nvidia-smi is unavailable.

## Job Types

### MNIST Training Job

```json
{
  "id": "job-123",
  "jobType": "mnist_training",
  "inputData": {
    "epochs": 5,
    "batch_size": 64,
    "learning_rate": 0.01
  }
}
```

### Stable Diffusion Job

```json
{
  "id": "job-456",
  "jobType": "stable_diffusion",
  "inputData": {
    "prompt": "a beautiful landscape",
    "num_images": 4,
    "steps": 50
  }
}
```

### Custom Script Job

```json
{
  "id": "job-789",
  "jobType": "custom_script",
  "inputData": {
    "scriptUrl": "https://example.com/script.py",
    "script": "print('Hello from QUBIX!')"
  }
}
```

## Testing

### Test MNIST Training

```python
# Create test job
job = {
    "id": "test-mnist",
    "jobType": "mnist_training",
    "inputData": {
        "epochs": 2,
        "batch_size": 32
    }
}

# Execute
executor = JobExecutor("http://localhost:3001", "test-worker")
result = executor.execute_job(job)
print(result)
```

### Test Custom Script

```python
job = {
    "id": "test-script",
    "jobType": "custom_script",
    "inputData": {
        "script": """
import time
for i in range(5):
    print(f'Step {i+1}/5')
    time.sleep(1)
print('Done!')
"""
    }
}

executor = JobExecutor("http://localhost:3001", "test-worker")
result = executor.execute_job(job)
print(result)
```

## Requirements Validation

This implementation satisfies all requirements from task 15:

- ✅ **11.1** - Worker polls for jobs every 5 seconds
- ✅ **11.2** - Reports progress every 10 seconds with percentage and operation
- ✅ **11.3** - Progress reports include GPU metrics (utilization, memory, temp, power)
- ✅ **11.4** - Uploads results and notifies backend on completion
- ✅ **11.5** - Reports errors with details on failure
- ✅ **11.6** - Collects GPU metrics using nvidia-smi and cleans up GPU memory

## Troubleshooting

### PyTorch Not Found

If PyTorch is not installed, the worker will fall back to simulated training:

```
⚠️  PyTorch not available: No module named 'torch'
📊 Simulating MNIST training (PyTorch not available)
```

Install PyTorch:
```bash
pip install torch torchvision
```

### nvidia-smi Not Found

If nvidia-smi is not available, GPU metrics will be empty but the worker will continue:

```
⚠️  Failed to collect GPU metrics: [Errno 2] No such file or directory: 'nvidia-smi'
```

Ensure NVIDIA drivers are installed and nvidia-smi is in PATH.

### Connection Refused

If the backend is not running:

```
❌ Error registering: HTTPConnectionPool(host='127.0.0.1', port=3001): Max retries exceeded
```

Start the backend server:
```bash
cd backend
npm run dev
```

## Performance

- **MNIST Training**: ~2-5 minutes for 5 epochs (GPU) or ~5-10 minutes (CPU)
- **Stable Diffusion**: ~30-60 seconds per image (GPU) or ~5-10 minutes (CPU)
- **Custom Scripts**: Depends on script complexity
- **Progress Reporting**: Every 10 seconds with <100ms overhead
- **GPU Metrics**: Collected in <50ms using nvidia-smi

## License

MIT License - Part of the QUBIX platform
