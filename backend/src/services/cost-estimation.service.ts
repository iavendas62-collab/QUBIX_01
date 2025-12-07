/**
 * Cost Estimation Service
 * Provides cost and duration estimation with parameter-based adjustments
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 14.1, 14.2, 14.3, 14.4, 14.5
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface EstimationParameters {
  epochs?: number;
  resolution?: number;
  datasetSize?: number;
}

export interface CostEstimate {
  estimatedDuration: number; // seconds
  estimatedDurationFormatted: string; // human-readable
  estimatedCost: number; // QUBIC
  perMinuteRate: number; // QUBIC per minute
  totalCost: number; // QUBIC (same as estimatedCost)
  confidence: 'high' | 'medium' | 'low';
  costBreakdown: {
    baseRate: number;
    duration: string;
    total: number;
  };
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
 * Get benchmark from database
 * Requirements: 14.2
 */
async function getBenchmark(jobType: string, gpuModel: string) {
  return await prisma.benchmark.findUnique({
    where: {
      jobType_gpuModel: {
        jobType,
        gpuModel,
      },
    },
  });
}

/**
 * Estimate duration with parameter adjustments
 * Requirements: 12.1, 14.3
 */
export async function estimateDuration(
  jobType: string,
  gpuModel: string,
  parameters?: EstimationParameters
): Promise<{ duration: number; confidence: 'high' | 'medium' | 'low' }> {
  // Try to get benchmark from database
  const benchmark = await getBenchmark(jobType, gpuModel);
  
  if (!benchmark) {
    // No benchmark found - use conservative estimate
    const defaultDurations: Record<string, number> = {
      mnist_training: 300,
      stable_diffusion: 600,
      inference: 120,
      rendering: 900,
      custom_script: 1200,
    };
    
    const duration = defaultDurations[jobType] || 1200;
    return { duration, confidence: 'low' };
  }
  
  let estimatedTime = benchmark.baseTimeSeconds;
  let confidence: 'high' | 'medium' | 'low' = 'high';
  
  // Adjust for parameters (Requirements: 14.3)
  if (parameters) {
    // Adjust for epochs (linear scaling)
    if (parameters.epochs && benchmark.epochs) {
      const epochMultiplier = parameters.epochs / benchmark.epochs;
      estimatedTime *= epochMultiplier;
      
      // Reduce confidence if epochs differ significantly
      if (Math.abs(epochMultiplier - 1) > 0.5) {
        confidence = 'medium';
      }
    }
    
    // Adjust for resolution (quadratic scaling - 2x resolution = 4x time)
    if (parameters.resolution && benchmark.resolution) {
      const resolutionRatio = parameters.resolution / benchmark.resolution;
      const resolutionMultiplier = Math.pow(resolutionRatio, 2);
      estimatedTime *= resolutionMultiplier;
      
      // Reduce confidence if resolution differs significantly
      if (Math.abs(resolutionMultiplier - 1) > 1) {
        confidence = 'medium';
      }
    }
    
    // Adjust for dataset size (linear scaling)
    if (parameters.datasetSize && benchmark.datasetSize) {
      const datasetMultiplier = parameters.datasetSize / benchmark.datasetSize;
      estimatedTime *= datasetMultiplier;
      
      // Reduce confidence if dataset size differs significantly
      if (Math.abs(datasetMultiplier - 1) > 0.5) {
        confidence = 'medium';
      }
    }
  }
  
  return {
    duration: Math.ceil(estimatedTime),
    confidence,
  };
}

/**
 * Calculate cost estimate with breakdown
 * Requirements: 12.3, 12.4
 */
export async function calculateCostEstimate(
  jobType: string,
  gpuModel: string,
  pricePerHour: number,
  parameters?: EstimationParameters
): Promise<CostEstimate> {
  // Get duration estimate
  const { duration, confidence } = await estimateDuration(jobType, gpuModel, parameters);
  
  // Calculate costs
  const durationHours = duration / 3600;
  const durationMinutes = duration / 60;
  const estimatedCost = durationHours * pricePerHour;
  const perMinuteRate = pricePerHour / 60;
  
  // Format duration
  const estimatedDurationFormatted = formatDuration(duration);
  
  // Create cost breakdown (Requirements: 12.4)
  const costBreakdown = {
    baseRate: pricePerHour,
    duration: estimatedDurationFormatted,
    total: estimatedCost,
  };
  
  return {
    estimatedDuration: duration,
    estimatedDurationFormatted,
    estimatedCost,
    perMinuteRate,
    totalCost: estimatedCost,
    confidence,
    costBreakdown,
  };
}

/**
 * Get all benchmarks for a job type
 * Requirements: 14.2
 */
export async function getBenchmarksForJobType(jobType: string): Promise<Record<string, number>> {
  const benchmarks = await prisma.benchmark.findMany({
    where: { jobType },
  });
  
  const result: Record<string, number> = {};
  benchmarks.forEach((b) => {
    result[b.gpuModel] = b.baseTimeSeconds;
  });
  
  return result;
}

/**
 * Calculate cost estimate range when uncertain
 * Requirements: 12.6
 */
export async function calculateCostEstimateRange(
  jobType: string,
  gpuModel: string,
  pricePerHour: number,
  parameters?: EstimationParameters
): Promise<{
  minEstimate: CostEstimate;
  maxEstimate: CostEstimate;
  confidence: 'high' | 'medium' | 'low';
}> {
  const baseEstimate = await calculateCostEstimate(jobType, gpuModel, pricePerHour, parameters);
  
  // If confidence is low, provide a range
  if (baseEstimate.confidence === 'low') {
    const minDuration = Math.floor(baseEstimate.estimatedDuration * 0.7);
    const maxDuration = Math.ceil(baseEstimate.estimatedDuration * 1.3);
    
    const minEstimate: CostEstimate = {
      ...baseEstimate,
      estimatedDuration: minDuration,
      estimatedDurationFormatted: formatDuration(minDuration),
      estimatedCost: (minDuration / 3600) * pricePerHour,
      totalCost: (minDuration / 3600) * pricePerHour,
      costBreakdown: {
        baseRate: pricePerHour,
        duration: formatDuration(minDuration),
        total: (minDuration / 3600) * pricePerHour,
      },
    };
    
    const maxEstimate: CostEstimate = {
      ...baseEstimate,
      estimatedDuration: maxDuration,
      estimatedDurationFormatted: formatDuration(maxDuration),
      estimatedCost: (maxDuration / 3600) * pricePerHour,
      totalCost: (maxDuration / 3600) * pricePerHour,
      costBreakdown: {
        baseRate: pricePerHour,
        duration: formatDuration(maxDuration),
        total: (maxDuration / 3600) * pricePerHour,
      },
    };
    
    return { minEstimate, maxEstimate, confidence: 'low' };
  }
  
  // If confidence is high or medium, return same estimate for min and max
  return {
    minEstimate: baseEstimate,
    maxEstimate: baseEstimate,
    confidence: baseEstimate.confidence,
  };
}
