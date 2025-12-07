/**
 * GPU Matching Service
 * Implements intelligent GPU matching algorithm with benchmarks and cost-benefit analysis
 * Requirements: 3.1, 3.2, 3.4, 3.5, 3.6, 3.7, 12.1, 12.3, 14.2, 14.3
 */

import { JobAnalysis } from './job-analysis.service';

export interface Provider {
  id: string;
  workerId: string;
  qubicAddress: string;
  name?: string;
  gpuModel: string;
  gpuVram: number; // GB
  cpuModel: string;
  cpuCores: number;
  ramTotal: number; // GB
  location?: string;
  pricePerHour: number; // QUBIC
  isOnline: boolean;
  isAvailable: boolean;
  totalEarnings: number;
  totalJobs: number;
  uptime: number;
}

export interface CompatibleGPU {
  provider: Provider;
  compatibility: 'recommended' | 'compatible' | 'borderline' | 'insufficient';
  estimatedDuration: number; // seconds
  estimatedCost: number; // QUBIC
  costBenefitScore: number; // 0-100
  warnings: string[];
}

export interface Benchmark {
  jobType: string;
  gpuModel: string;
  baseTimeSeconds: number;
  parameters?: {
    epochs?: number;
    resolution?: number;
    datasetSize?: number;
  };
}

/**
 * Benchmark database with job types and GPU models
 * Requirements: 12.1, 14.2
 */
export const BENCHMARKS: Benchmark[] = [
  // MNIST Training benchmarks
  {
    jobType: 'mnist_training',
    gpuModel: 'RTX 4090',
    baseTimeSeconds: 120,
    parameters: { epochs: 5, datasetSize: 10000 }
  },
  {
    jobType: 'mnist_training',
    gpuModel: 'RTX 4080',
    baseTimeSeconds: 150,
    parameters: { epochs: 5, datasetSize: 10000 }
  },
  {
    jobType: 'mnist_training',
    gpuModel: 'RTX 3090',
    baseTimeSeconds: 180,
    parameters: { epochs: 5, datasetSize: 10000 }
  },
  {
    jobType: 'mnist_training',
    gpuModel: 'RTX 3080',
    baseTimeSeconds: 220,
    parameters: { epochs: 5, datasetSize: 10000 }
  },
  {
    jobType: 'mnist_training',
    gpuModel: 'RTX 3070',
    baseTimeSeconds: 280,
    parameters: { epochs: 5, datasetSize: 10000 }
  },
  {
    jobType: 'mnist_training',
    gpuModel: 'RTX 3060',
    baseTimeSeconds: 350,
    parameters: { epochs: 5, datasetSize: 10000 }
  },
  
  // Stable Diffusion benchmarks
  {
    jobType: 'stable_diffusion',
    gpuModel: 'RTX 4090',
    baseTimeSeconds: 300,
    parameters: { resolution: 512 }
  },
  {
    jobType: 'stable_diffusion',
    gpuModel: 'RTX 4080',
    baseTimeSeconds: 400,
    parameters: { resolution: 512 }
  },
  {
    jobType: 'stable_diffusion',
    gpuModel: 'RTX 3090',
    baseTimeSeconds: 450,
    parameters: { resolution: 512 }
  },
  {
    jobType: 'stable_diffusion',
    gpuModel: 'RTX 3080',
    baseTimeSeconds: 550,
    parameters: { resolution: 512 }
  },
  {
    jobType: 'stable_diffusion',
    gpuModel: 'RTX 3070',
    baseTimeSeconds: 700,
    parameters: { resolution: 512 }
  },
  
  // Inference benchmarks
  {
    jobType: 'inference',
    gpuModel: 'RTX 4090',
    baseTimeSeconds: 60,
  },
  {
    jobType: 'inference',
    gpuModel: 'RTX 4080',
    baseTimeSeconds: 80,
  },
  {
    jobType: 'inference',
    gpuModel: 'RTX 3090',
    baseTimeSeconds: 100,
  },
  {
    jobType: 'inference',
    gpuModel: 'RTX 3080',
    baseTimeSeconds: 120,
  },
  {
    jobType: 'inference',
    gpuModel: 'RTX 3070',
    baseTimeSeconds: 150,
  },
  
  // Custom script benchmarks (conservative estimates)
  {
    jobType: 'custom_script',
    gpuModel: 'RTX 4090',
    baseTimeSeconds: 600,
  },
  {
    jobType: 'custom_script',
    gpuModel: 'RTX 4080',
    baseTimeSeconds: 750,
  },
  {
    jobType: 'custom_script',
    gpuModel: 'RTX 3090',
    baseTimeSeconds: 900,
  },
  {
    jobType: 'custom_script',
    gpuModel: 'RTX 3080',
    baseTimeSeconds: 1100,
  },
  {
    jobType: 'custom_script',
    gpuModel: 'RTX 3070',
    baseTimeSeconds: 1400,
  },
];

/**
 * Calculate GPU compatibility based on VRAM and compute requirements
 * Requirements: 3.1, 3.2, 3.4
 */
export function calculateCompatibility(
  gpu: Provider,
  requirements: JobAnalysis
): { compatibility: CompatibleGPU['compatibility']; warnings: string[] } {
  const warnings: string[] = [];
  
  // Check VRAM requirements
  const vramRatio = gpu.gpuVram / requirements.estimatedVRAM;
  
  // Check RAM requirements
  const ramRatio = gpu.ramTotal / requirements.estimatedRAM;
  
  // Determine compatibility level
  if (vramRatio >= 1.5 && ramRatio >= 1.3) {
    // Plenty of headroom - recommended
    return { compatibility: 'recommended', warnings };
  } else if (vramRatio >= 1.2 && ramRatio >= 1.1) {
    // Good fit - compatible
    return { compatibility: 'compatible', warnings };
  } else if (vramRatio >= 1.0 && ramRatio >= 1.0) {
    // Tight fit - borderline
    warnings.push('GPU VRAM is at minimum requirement - may run slower');
    if (ramRatio < 1.1) {
      warnings.push('System RAM is at minimum - consider closing other applications');
    }
    return { compatibility: 'borderline', warnings };
  } else {
    // Insufficient resources
    if (vramRatio < 1.0) {
      warnings.push(`Insufficient VRAM: ${gpu.gpuVram}GB available, ${requirements.estimatedVRAM}GB required`);
    }
    if (ramRatio < 1.0) {
      warnings.push(`Insufficient RAM: ${gpu.ramTotal}GB available, ${requirements.estimatedRAM}GB required`);
    }
    return { compatibility: 'insufficient', warnings };
  }
}

/**
 * Estimate job duration using benchmark data with parameter adjustments
 * Requirements: 12.1, 14.3
 */
export function estimateDuration(
  gpuModel: string,
  jobType: string,
  parameters?: { epochs?: number; resolution?: number; datasetSize?: number }
): number {
  // Find benchmark for this GPU and job type
  const benchmark = BENCHMARKS.find(
    b => b.gpuModel === gpuModel && b.jobType === jobType
  );
  
  if (!benchmark) {
    // No benchmark found - use conservative estimate based on job type
    const defaultDurations: Record<string, number> = {
      mnist_training: 300,
      stable_diffusion: 600,
      inference: 120,
      rendering: 900,
      custom_script: 1200
    };
    return defaultDurations[jobType] || 1200;
  }
  
  let estimatedTime = benchmark.baseTimeSeconds;
  
  // Adjust for parameters (Requirements: 14.3)
  if (parameters) {
    // Adjust for epochs (linear scaling)
    if (parameters.epochs && benchmark.parameters?.epochs) {
      const epochMultiplier = parameters.epochs / benchmark.parameters.epochs;
      estimatedTime *= epochMultiplier;
    }
    
    // Adjust for resolution (quadratic scaling - 2x resolution = 4x time)
    if (parameters.resolution && benchmark.parameters?.resolution) {
      const resolutionRatio = parameters.resolution / benchmark.parameters.resolution;
      const resolutionMultiplier = Math.pow(resolutionRatio, 2);
      estimatedTime *= resolutionMultiplier;
    }
    
    // Adjust for dataset size (linear scaling)
    if (parameters.datasetSize && benchmark.parameters?.datasetSize) {
      const datasetMultiplier = parameters.datasetSize / benchmark.parameters.datasetSize;
      estimatedTime *= datasetMultiplier;
    }
  }
  
  return Math.ceil(estimatedTime);
}

/**
 * Calculate estimated cost based on duration and hourly rate
 * Requirements: 12.3
 */
export function calculateCost(durationSeconds: number, pricePerHour: number): number {
  const durationHours = durationSeconds / 3600;
  return durationHours * pricePerHour;
}

/**
 * Compute cost-benefit score for GPU ranking
 * Score = (Performance / Cost) * 100, normalized to 0-100 range
 * Requirements: 3.5
 */
export function calculateCostBenefitScore(
  estimatedDuration: number,
  estimatedCost: number
): number {
  // Lower duration and lower cost = higher score
  // Use inverse of duration as performance metric
  const performanceScore = 1000 / estimatedDuration; // Higher is better
  const costScore = 1 / (estimatedCost + 0.01); // Higher is better (avoid division by zero)
  
  // Combine scores with weights (60% performance, 40% cost)
  const rawScore = (performanceScore * 0.6) + (costScore * 0.4);
  
  // Normalize to 0-100 range (approximate)
  const normalizedScore = Math.min(100, rawScore * 10);
  
  return Math.round(normalizedScore);
}

/**
 * Filter and rank GPUs by compatibility and cost-benefit
 * Requirements: 3.1, 3.2, 3.4, 3.5, 3.6, 3.7
 */
export function matchGPUs(
  jobRequirements: JobAnalysis,
  availableGPUs: Provider[],
  sortBy: 'cost_benefit' | 'price_low' | 'performance' | 'availability' = 'cost_benefit',
  parameters?: { epochs?: number; resolution?: number; datasetSize?: number }
): CompatibleGPU[] {
  // Calculate compatibility for each GPU
  const compatibleGPUs: CompatibleGPU[] = availableGPUs.map(gpu => {
    const { compatibility, warnings } = calculateCompatibility(gpu, jobRequirements);
    const estimatedDuration = estimateDuration(gpu.gpuModel, jobRequirements.jobType, parameters);
    const estimatedCost = calculateCost(estimatedDuration, gpu.pricePerHour);
    const costBenefitScore = calculateCostBenefitScore(estimatedDuration, estimatedCost);
    
    return {
      provider: gpu,
      compatibility,
      estimatedDuration,
      estimatedCost,
      costBenefitScore,
      warnings
    };
  });
  
  // Sort GPUs based on criteria (Requirements: 3.5)
  const sortedGPUs = [...compatibleGPUs].sort((a, b) => {
    switch (sortBy) {
      case 'cost_benefit':
        // Higher score first
        return b.costBenefitScore - a.costBenefitScore;
      
      case 'price_low':
        // Lower cost first
        return a.estimatedCost - b.estimatedCost;
      
      case 'performance':
        // Lower duration (faster) first
        return a.estimatedDuration - b.estimatedDuration;
      
      case 'availability':
        // Online and available first
        const aAvailable = a.provider.isOnline && a.provider.isAvailable ? 1 : 0;
        const bAvailable = b.provider.isOnline && b.provider.isAvailable ? 1 : 0;
        return bAvailable - aAvailable;
      
      default:
        return 0;
    }
  });
  
  return sortedGPUs;
}

/**
 * Get top 3 GPU recommendations
 * Requirements: 3.7
 */
export function getTopRecommendations(
  jobRequirements: JobAnalysis,
  availableGPUs: Provider[],
  parameters?: { epochs?: number; resolution?: number; datasetSize?: number }
): CompatibleGPU[] {
  const allMatches = matchGPUs(jobRequirements, availableGPUs, 'cost_benefit', parameters);
  
  // Filter out insufficient GPUs for recommendations
  const viableGPUs = allMatches.filter(
    gpu => gpu.compatibility !== 'insufficient'
  );
  
  // Return top 3
  return viableGPUs.slice(0, 3);
}

/**
 * Format duration as human-readable string
 * Requirements: 12.2
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} seconds`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    }
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ${remainingSeconds} seconds`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const remainingMinutes = Math.floor((seconds % 3600) / 60);
    if (remainingMinutes === 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${remainingMinutes} ${remainingMinutes === 1 ? 'minute' : 'minutes'}`;
  }
}

/**
 * Get benchmark data for a specific job type
 * Requirements: 14.2
 */
export function getBenchmarksForJobType(jobType: string): Record<string, number> {
  const benchmarks = BENCHMARKS.filter(b => b.jobType === jobType);
  
  const result: Record<string, number> = {};
  benchmarks.forEach(b => {
    result[b.gpuModel] = b.baseTimeSeconds;
  });
  
  return result;
}
