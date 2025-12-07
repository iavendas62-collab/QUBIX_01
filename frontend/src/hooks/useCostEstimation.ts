/**
 * Cost Estimation Hook
 * Provides reactive cost estimation with debounced recalculation
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
  totalCost: number; // QUBIC
  confidence: 'high' | 'medium' | 'low';
  costBreakdown: {
    baseRate: number;
    duration: string;
    total: number;
  };
}

export interface CostEstimateRange {
  minEstimate: CostEstimate;
  maxEstimate: CostEstimate;
  confidence: 'high' | 'medium' | 'low';
}

interface UseCostEstimationOptions {
  jobType: string;
  gpuModel: string;
  pricePerHour: number;
  parameters?: EstimationParameters;
  debounceMs?: number; // Default 500ms for reactive recalculation (Requirement 12.5)
}

/**
 * Hook for cost estimation with reactive recalculation
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */
export function useCostEstimation(options: UseCostEstimationOptions) {
  const { jobType, gpuModel, pricePerHour, parameters, debounceMs = 500 } = options;
  
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to track the latest calculation request
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const calculateEstimate = useCallback(async () => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(
        `${API_URL}/api/cost-estimation/calculate`,
        {
          jobType,
          gpuModel,
          pricePerHour,
          parameters,
        },
        {
          signal: abortController.signal,
        }
      );
      
      if (response.data.success) {
        setEstimate(response.data.estimate);
      } else {
        setError(response.data.error || 'Failed to calculate estimate');
      }
    } catch (err: any) {
      if (err.name !== 'CanceledError') {
        console.error('Error calculating cost estimate:', err);
        setError(err.response?.data?.error || 'Failed to calculate estimate');
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }
  }, [jobType, gpuModel, pricePerHour, parameters]);
  
  // Debounced recalculation on parameter changes (Requirement 12.5)
  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout for debounced calculation
    timeoutRef.current = setTimeout(() => {
      calculateEstimate();
    }, debounceMs);
    
    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [calculateEstimate, debounceMs]);
  
  return {
    estimate,
    loading,
    error,
    recalculate: calculateEstimate,
  };
}

/**
 * Hook for cost estimation range (for uncertain estimates)
 * Requirements: 12.6
 */
export function useCostEstimationRange(options: UseCostEstimationOptions) {
  const { jobType, gpuModel, pricePerHour, parameters, debounceMs = 500 } = options;
  
  const [estimateRange, setEstimateRange] = useState<CostEstimateRange | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const calculateEstimateRange = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(
        `${API_URL}/api/cost-estimation/calculate-range`,
        {
          jobType,
          gpuModel,
          pricePerHour,
          parameters,
        },
        {
          signal: abortController.signal,
        }
      );
      
      if (response.data.success) {
        setEstimateRange({
          minEstimate: response.data.minEstimate,
          maxEstimate: response.data.maxEstimate,
          confidence: response.data.confidence,
        });
      } else {
        setError(response.data.error || 'Failed to calculate estimate range');
      }
    } catch (err: any) {
      if (err.name !== 'CanceledError') {
        console.error('Error calculating cost estimate range:', err);
        setError(err.response?.data?.error || 'Failed to calculate estimate range');
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }
  }, [jobType, gpuModel, pricePerHour, parameters]);
  
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      calculateEstimateRange();
    }, debounceMs);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [calculateEstimateRange, debounceMs]);
  
  return {
    estimateRange,
    loading,
    error,
    recalculate: calculateEstimateRange,
  };
}

/**
 * Fetch benchmarks for a job type
 * Requirements: 14.2
 */
export async function fetchBenchmarks(jobType: string): Promise<Record<string, number>> {
  try {
    const response = await axios.get(`${API_URL}/api/cost-estimation/benchmarks/${jobType}`);
    
    if (response.data.success) {
      return response.data.benchmarks;
    }
    
    throw new Error(response.data.error || 'Failed to fetch benchmarks');
  } catch (error) {
    console.error('Error fetching benchmarks:', error);
    throw error;
  }
}

