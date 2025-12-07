import { describe, it, expect } from '@jest/globals';

describe('Job Management System - Core Logic', () => {

  it('should validate job progress is clamped between 0 and 100', () => {
    // Helper function to clamp progress
    function clampProgress(progress: number): number {
      return Math.min(100, Math.max(0, progress));
    }

    expect(clampProgress(50)).toBe(50);
    expect(clampProgress(-10)).toBe(0);
    expect(clampProgress(150)).toBe(100);
    expect(clampProgress(0)).toBe(0);
    expect(clampProgress(100)).toBe(100);
  });

  it('should calculate actual cost based on processing time and hourly rate', () => {
    // Helper function to calculate cost
    function calculateActualCost(processingTimeSeconds: number, pricePerHour: number): number {
      const processingHours = processingTimeSeconds / 3600;
      return processingHours * pricePerHour;
    }

    // 1 hour at $1/hour = $1
    expect(calculateActualCost(3600, 1.0)).toBe(1.0);
    
    // 30 minutes at $2/hour = $1
    expect(calculateActualCost(1800, 2.0)).toBe(1.0);
    
    // 2 hours at $1.5/hour = $3
    expect(calculateActualCost(7200, 1.5)).toBe(3.0);
    
    // 10 seconds at $1/hour = ~$0.0028
    expect(calculateActualCost(10, 1.0)).toBeCloseTo(0.0028, 4);
  });

  it('should determine job status based on progress', () => {
    // Helper function to determine status
    function determineJobStatus(progress: number): 'PENDING' | 'RUNNING' | 'COMPLETED' {
      if (progress === 0) return 'PENDING';
      if (progress === 100) return 'COMPLETED';
      return 'RUNNING';
    }

    expect(determineJobStatus(0)).toBe('PENDING');
    expect(determineJobStatus(1)).toBe('RUNNING');
    expect(determineJobStatus(50)).toBe('RUNNING');
    expect(determineJobStatus(99)).toBe('RUNNING');
    expect(determineJobStatus(100)).toBe('COMPLETED');
  });

  it('should validate required fields for job creation', () => {
    // Helper function to validate job creation request
    function validateJobCreationRequest(data: any): { valid: boolean; error?: string } {
      if (!data.modelType) {
        return { valid: false, error: 'modelType is required' };
      }
      if (!data.computeNeeded) {
        return { valid: false, error: 'computeNeeded is required' };
      }
      if (data.computeNeeded <= 0) {
        return { valid: false, error: 'computeNeeded must be positive' };
      }
      if (!data.qubicAddress) {
        return { valid: false, error: 'qubicAddress is required' };
      }
      return { valid: true };
    }

    expect(validateJobCreationRequest({
      modelType: 'llama-2',
      computeNeeded: 1.0,
      qubicAddress: 'ABCD...'
    })).toEqual({ valid: true });

    expect(validateJobCreationRequest({
      computeNeeded: 1.0,
      qubicAddress: 'ABCD...'
    })).toEqual({ valid: false, error: 'modelType is required' });

    expect(validateJobCreationRequest({
      modelType: 'llama-2',
      qubicAddress: 'ABCD...'
    })).toEqual({ valid: false, error: 'computeNeeded is required' });

    expect(validateJobCreationRequest({
      modelType: 'llama-2',
      computeNeeded: -1,
      qubicAddress: 'ABCD...'
    })).toEqual({ valid: false, error: 'computeNeeded must be positive' });

    expect(validateJobCreationRequest({
      modelType: 'llama-2',
      computeNeeded: 1.0
    })).toEqual({ valid: false, error: 'qubicAddress is required' });
  });

  it('should track reassignment attempts correctly', () => {
    // Helper function to extract reassignment attempt number
    function getReassignmentAttempt(errorMessage: string | null): number {
      if (!errorMessage) return 0;
      const match = errorMessage.match(/Reassignment attempt (\d+)/);
      return match ? parseInt(match[1]) : 0;
    }

    expect(getReassignmentAttempt(null)).toBe(0);
    expect(getReassignmentAttempt('Some other error')).toBe(0);
    expect(getReassignmentAttempt('Reassignment attempt 1 after failure: timeout')).toBe(1);
    expect(getReassignmentAttempt('Reassignment attempt 2 after failure: GPU error')).toBe(2);
    expect(getReassignmentAttempt('Reassignment attempt 3 after failure: network issue')).toBe(3);
  });
});
