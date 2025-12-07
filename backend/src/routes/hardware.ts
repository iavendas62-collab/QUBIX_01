/**
 * Hardware Detection Routes
 * Auto-detect GPU using Python script
 */

import { Router, Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);
const router = Router();

/**
 * GET /api/hardware/detect
 * Detect hardware and return info (without registering)
 * Uses Python GPUtil for reliable detection
 */
router.get('/detect', async (req: Request, res: Response) => {
  try {
    console.log('🔍 Detecting hardware with Python GPUtil...');

    // Use Python script for detection
    const scriptPath = path.join(process.cwd(), '..', 'detect-gpu.py');
    
    try {
      const { stdout, stderr } = await execAsync(`python "${scriptPath}"`);
      
      if (stderr) {
        console.warn('Python stderr:', stderr);
      }
      
      console.log('Python output:', stdout);
      
      // Parse JSON output from Python script
      const result = JSON.parse(stdout.trim());
      
      res.json(result);
      
    } catch (pythonError: any) {
      console.error('Python detection failed:', pythonError);
      
      // Fallback to nvidia-smi
      try {
        const { stdout } = await execAsync('nvidia-smi --query-gpu=name,memory.total --format=csv,noheader');
        
        const lines = stdout.trim().split('\n');
        const gpu = lines[0];
        const [name, memory] = gpu.split(',').map(s => s.trim());
        const memoryMB = parseInt(memory.split(' ')[0]);
        const memoryGB = Math.round(memoryMB / 1024);
        
        res.json({
          success: true,
          detected: true,
          hardware: {
            gpu_model: name,
            gpu_vram_gb: memoryGB,
            vendor: 'NVIDIA'
          }
        });
      } catch (smiError) {
        // No GPU detected
        res.json({
          success: true,
          detected: false,
          message: 'No NVIDIA GPU detected'
        });
      }
    }
  } catch (error: any) {
    console.error('❌ Hardware detection error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/hardware/detect
 * Detect hardware using Python script and register automatically
 */
router.post('/detect', async (req: Request, res: Response) => {
  try {
    console.log('🔍 Starting hardware detection...');

    // Path to Python script
    const scriptPath = path.join(process.cwd(), '..', 'register-my-gpu.py');
    
    // Execute Python script
    const { stdout, stderr } = await execAsync(`python "${scriptPath}"`);
    
    console.log('Python output:', stdout);
    if (stderr) {
      console.error('Python errors:', stderr);
    }

    // Check if registration was successful
    if (stdout.includes('GPU REGISTRADA COM SUCESSO')) {
      // Extract provider ID from output
      const providerIdMatch = stdout.match(/Provider ID: (\d+)/);
      const providerId = providerIdMatch ? providerIdMatch[1] : null;

      res.json({
        success: true,
        message: 'Hardware detected and registered successfully',
        providerId,
        output: stdout
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to detect or register hardware',
        output: stdout,
        stderr
      });
    }
  } catch (error: any) {
    console.error('❌ Hardware detection error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Hardware detection failed',
      details: error.stderr || error.stdout
    });
  }
});

/**
 * GET /api/hardware/metrics
 * Get real-time GPU metrics for provider dashboard
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    console.log('📊 Getting GPU metrics...');

    // Use Python script for real-time metrics
    const scriptPath = path.join(process.cwd(), '..', 'detect-gpu.py');
    
    try {
      const { stdout } = await execAsync(`python "${scriptPath}"`);
      const result = JSON.parse(stdout.trim());
      
      if (result.success && result.detected) {
        res.json({
          success: true,
          metrics: {
            gpu_model: result.hardware.gpu_model,
            gpu_load: result.hardware.gpu_load,
            gpu_temp: result.hardware.gpu_temp,
            gpu_memory_used: result.hardware.gpu_memory_used,
            gpu_memory_total: result.hardware.gpu_memory_total,
            gpu_memory_percent: (result.hardware.gpu_memory_used / result.hardware.gpu_memory_total * 100).toFixed(1)
          }
        });
      } else {
        res.json({
          success: false,
          message: 'No GPU detected'
        });
      }
    } catch (error: any) {
      console.error('Failed to get metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get GPU metrics'
      });
    }
  } catch (error: any) {
    console.error('❌ Metrics error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/hardware/info
 * Get hardware info without registering
 */
router.get('/info', async (req: Request, res: Response) => {
  try {
    // Try to detect GPU using nvidia-smi
    try {
      const { stdout } = await execAsync('nvidia-smi --query-gpu=name,memory.total --format=csv,noheader');
      
      const lines = stdout.trim().split('\n');
      const gpus = lines.map(line => {
        const [name, memory] = line.split(',').map(s => s.trim());
        const memoryMB = parseInt(memory.split(' ')[0]);
        const memoryGB = (memoryMB / 1024).toFixed(1);
        
        return {
          name,
          vram: parseFloat(memoryGB),
          vendor: 'NVIDIA'
        };
      });

      res.json({
        success: true,
        gpus,
        hasGPU: gpus.length > 0
      });
    } catch (gpuError) {
      // No NVIDIA GPU found
      res.json({
        success: true,
        gpus: [],
        hasGPU: false,
        message: 'No NVIDIA GPU detected'
      });
    }
  } catch (error: any) {
    console.error('❌ Hardware info error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
