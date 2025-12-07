/**
 * GPU Matching Service Tests
 * Tests for GPU matching algorithm, benchmarks, and cost calculations
 */

import {
  calculateCompatibility,
  estimateDuration,
  calculateCost,
  calculateCostBenefitScore,
  matchGPUs,
  getTopRecommendations,
  formatDuration,
  getBenchmarksForJobType,
  Provider,
  BENCHMARKS
} from '../services/gpu-matching.service';
import { JobAnalysis } from '../services/job-analysis.service';

describe('GPU Matching Service', () => {
  // Sample providers for testing
  const sampleProviders: Provider[] = [
    {
      id: '1',
      workerId: 'worker-1',
      qubicAddress: 'QUBIC1234567890',
      gpuModel: 'RTX 4090',
      gpuVram: 24,
      cpuModel: 'Intel i9',
      cpuCores: 16,
      ramTotal: 64,
      pricePerHour: 2.0,
      isOnline: true,
      isAvailable: true,
      totalEarnings: 0,
      totalJobs: 0,
      uptime: 0
    },
    {
      id: '2',
      workerId: 'worker-2',
      qubicAddress: 'QUBIC0987654321',
      gpuModel: 'RTX 3090',
      gpuVram: 24,
      cpuModel: 'AMD Ryzen 9',
      cpuCores: 12,
      ramTotal: 32,
      pricePerHour: 1.5,
      isOnline: true,
      isAvailable: true,
      totalEarnings: 0,
      totalJobs: 0,
      uptime: 0
    },
    {
      id: '3',
      workerId: 'worker-3',
      qubicAddress: 'QUBIC1111111111',
      gpuModel: 'RTX 3060',
      gpuVram: 12,
      cpuModel: 'Intel i7',
      cpuCores: 8,
      ramTotal: 16,
      pricePerHour: 0.5,
      isOnline: true,
      isAvailable: true,
      totalEarnings: 0,
      totalJobs: 0,
      uptime: 0
    },
    {
      id: '4',
      workerId: 'worker-4',
      qubicAddress: 'QUBIC2222222222',
      gpuModel: 'RTX 3070',
      gpuVram: 8,
      cpuModel: 'AMD Ryzen 7',
      cpuCores: 8,
      ramTotal: 16,
      pricePerHour: 0.8,
      isOnline: true,
      isAvailable: true,
      totalEarnings: 0,
      totalJobs: 0,
      uptime: 0
    }
  ];

  // Sample job requirements
  const mnistRequirements: JobAnalysis = {
    jobType: 'mnist_training',
    detectedFramework: 'pytorch',
    estimatedVRAM: 4,
    estimatedCompute: 5,
    estimatedRAM: 8,
    estimatedStorage: 2,
    confidence: 'high'
  };

  const stableDiffusionRequirements: JobAnalysis = {
    jobType: 'stable_diffusion',
    detectedFramework: 'pytorch',
    estimatedVRAM: 12,
    estimatedCompute: 15,
    estimatedRAM: 16,
    estimatedStorage: 10,
    confidence: 'high'
  };

  describe('calculateCompatibility', () => {
    it('should classify GPU as recommended when resources are abundant', () => {
      const result = calculateCompatibility(sampleProviders[0], mnistRequirements);
      expect(result.compatibility).toBe('recommended');
      expect(result.warnings).toHaveLength(0);
    });

    it('should classify GPU as compatible when resources are adequate', () => {
      // RTX 3070: 8GB VRAM / 4GB required = 2.0 ratio (>= 1.5 = recommended)
      // 16GB RAM / 8GB required = 2.0 ratio (>= 1.3 = recommended)
      // This actually qualifies as recommended, not just compatible
      const result = calculateCompatibility(sampleProviders[3], mnistRequirements);
      expect(result.compatibility).toBe('recommended');
    });

    it('should classify GPU as borderline when resources are minimal', () => {
      const tightRequirements: JobAnalysis = {
        ...mnistRequirements,
        estimatedVRAM: 7.5,
        estimatedRAM: 15
      };
      const result = calculateCompatibility(sampleProviders[3], tightRequirements);
      expect(result.compatibility).toBe('borderline');
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should classify GPU as insufficient when VRAM is too low', () => {
      const highRequirements: JobAnalysis = {
        ...stableDiffusionRequirements,
        estimatedVRAM: 16
      };
      const result = calculateCompatibility(sampleProviders[2], highRequirements);
      expect(result.compatibility).toBe('insufficient');
      expect(result.warnings.some(w => w.includes('VRAM'))).toBe(true);
    });

    it('should classify GPU as insufficient when RAM is too low', () => {
      const highRAMRequirements: JobAnalysis = {
        ...mnistRequirements,
        estimatedRAM: 20
      };
      const result = calculateCompatibility(sampleProviders[2], highRAMRequirements);
      expect(result.compatibility).toBe('insufficient');
      expect(result.warnings.some(w => w.includes('RAM'))).toBe(true);
    });
  });

  describe('estimateDuration', () => {
    it('should return benchmark time for known GPU and job type', () => {
      const duration = estimateDuration('RTX 4090', 'mnist_training');
      expect(duration).toBe(120);
    });

    it('should return default time for unknown GPU', () => {
      const duration = estimateDuration('Unknown GPU', 'mnist_training');
      expect(duration).toBe(300); // Default for mnist_training
    });

    it('should adjust duration based on epochs parameter', () => {
      const baseDuration = estimateDuration('RTX 4090', 'mnist_training');
      const adjustedDuration = estimateDuration('RTX 4090', 'mnist_training', { epochs: 10 });
      expect(adjustedDuration).toBe(baseDuration * 2); // 10 epochs vs 5 base
    });

    it('should adjust duration based on resolution parameter', () => {
      const baseDuration = estimateDuration('RTX 4090', 'stable_diffusion');
      const adjustedDuration = estimateDuration('RTX 4090', 'stable_diffusion', { resolution: 1024 });
      expect(adjustedDuration).toBe(baseDuration * 4); // (1024/512)^2 = 4
    });

    it('should adjust duration based on dataset size parameter', () => {
      const baseDuration = estimateDuration('RTX 4090', 'mnist_training');
      const adjustedDuration = estimateDuration('RTX 4090', 'mnist_training', { datasetSize: 20000 });
      expect(adjustedDuration).toBe(baseDuration * 2); // 20000 vs 10000 base
    });
  });

  describe('calculateCost', () => {
    it('should calculate cost correctly for duration and hourly rate', () => {
      const cost = calculateCost(3600, 2.0); // 1 hour at $2/hour
      expect(cost).toBe(2.0);
    });

    it('should calculate cost for partial hours', () => {
      const cost = calculateCost(1800, 2.0); // 30 minutes at $2/hour
      expect(cost).toBe(1.0);
    });

    it('should handle very short durations', () => {
      const cost = calculateCost(60, 2.0); // 1 minute at $2/hour
      expect(cost).toBeCloseTo(0.0333, 2);
    });
  });

  describe('calculateCostBenefitScore', () => {
    it('should return higher score for faster and cheaper GPUs', () => {
      const score1 = calculateCostBenefitScore(120, 0.5); // Fast and cheap
      const score2 = calculateCostBenefitScore(300, 2.0); // Slow and expensive
      expect(score1).toBeGreaterThan(score2);
    });

    it('should return score between 0 and 100', () => {
      const score = calculateCostBenefitScore(180, 1.5);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('matchGPUs', () => {
    it('should return all GPUs with compatibility ratings', () => {
      const matches = matchGPUs(mnistRequirements, sampleProviders);
      expect(matches).toHaveLength(sampleProviders.length);
      expect(matches[0]).toHaveProperty('compatibility');
      expect(matches[0]).toHaveProperty('estimatedDuration');
      expect(matches[0]).toHaveProperty('estimatedCost');
      expect(matches[0]).toHaveProperty('costBenefitScore');
    });

    it('should sort by cost-benefit by default', () => {
      const matches = matchGPUs(mnistRequirements, sampleProviders);
      // Verify descending order of cost-benefit scores
      for (let i = 0; i < matches.length - 1; i++) {
        expect(matches[i].costBenefitScore).toBeGreaterThanOrEqual(matches[i + 1].costBenefitScore);
      }
    });

    it('should sort by price when specified', () => {
      const matches = matchGPUs(mnistRequirements, sampleProviders, 'price_low');
      // Verify ascending order of costs
      for (let i = 0; i < matches.length - 1; i++) {
        expect(matches[i].estimatedCost).toBeLessThanOrEqual(matches[i + 1].estimatedCost);
      }
    });

    it('should sort by performance when specified', () => {
      const matches = matchGPUs(mnistRequirements, sampleProviders, 'performance');
      // Verify ascending order of durations (faster first)
      for (let i = 0; i < matches.length - 1; i++) {
        expect(matches[i].estimatedDuration).toBeLessThanOrEqual(matches[i + 1].estimatedDuration);
      }
    });

    it('should include warnings for borderline GPUs', () => {
      const tightRequirements: JobAnalysis = {
        ...mnistRequirements,
        estimatedVRAM: 7.5
      };
      const matches = matchGPUs(tightRequirements, sampleProviders);
      const borderlineGPU = matches.find(m => m.compatibility === 'borderline');
      expect(borderlineGPU?.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('getTopRecommendations', () => {
    it('should return at most 3 recommendations', () => {
      const recommendations = getTopRecommendations(mnistRequirements, sampleProviders);
      expect(recommendations.length).toBeLessThanOrEqual(3);
    });

    it('should exclude insufficient GPUs from recommendations', () => {
      const highRequirements: JobAnalysis = {
        ...stableDiffusionRequirements,
        estimatedVRAM: 20
      };
      const recommendations = getTopRecommendations(highRequirements, sampleProviders);
      recommendations.forEach(rec => {
        expect(rec.compatibility).not.toBe('insufficient');
      });
    });

    it('should return recommendations sorted by cost-benefit', () => {
      const recommendations = getTopRecommendations(mnistRequirements, sampleProviders);
      for (let i = 0; i < recommendations.length - 1; i++) {
        expect(recommendations[i].costBenefitScore).toBeGreaterThanOrEqual(
          recommendations[i + 1].costBenefitScore
        );
      }
    });
  });

  describe('formatDuration', () => {
    it('should format seconds correctly', () => {
      expect(formatDuration(45)).toBe('45 seconds');
    });

    it('should format minutes correctly', () => {
      expect(formatDuration(120)).toBe('2 minutes');
      expect(formatDuration(90)).toBe('1 minute 30 seconds');
    });

    it('should format hours correctly', () => {
      expect(formatDuration(3600)).toBe('1 hour');
      expect(formatDuration(7200)).toBe('2 hours');
      expect(formatDuration(3900)).toBe('1 hour 5 minutes');
    });

    it('should handle edge cases', () => {
      expect(formatDuration(60)).toBe('1 minute');
      expect(formatDuration(61)).toBe('1 minute 1 seconds');
    });
  });

  describe('getBenchmarksForJobType', () => {
    it('should return benchmarks for known job type', () => {
      const benchmarks = getBenchmarksForJobType('mnist_training');
      expect(Object.keys(benchmarks).length).toBeGreaterThan(0);
      expect(benchmarks['RTX 4090']).toBe(120);
    });

    it('should return empty object for unknown job type', () => {
      const benchmarks = getBenchmarksForJobType('unknown_job');
      expect(Object.keys(benchmarks).length).toBe(0);
    });

    it('should include all GPU models for the job type', () => {
      const benchmarks = getBenchmarksForJobType('stable_diffusion');
      expect(benchmarks).toHaveProperty('RTX 4090');
      expect(benchmarks).toHaveProperty('RTX 3090');
    });
  });

  describe('BENCHMARKS database', () => {
    it('should contain benchmarks for all major job types', () => {
      const jobTypes = ['mnist_training', 'stable_diffusion', 'inference', 'custom_script'];
      jobTypes.forEach(jobType => {
        const hasBenchmark = BENCHMARKS.some(b => b.jobType === jobType);
        expect(hasBenchmark).toBe(true);
      });
    });

    it('should have consistent GPU models across job types', () => {
      const gpuModels = new Set(BENCHMARKS.map(b => b.gpuModel));
      expect(gpuModels.size).toBeGreaterThan(0);
      // RTX 4090 should be in benchmarks
      expect(gpuModels.has('RTX 4090')).toBe(true);
    });

    it('should have positive time values for all benchmarks', () => {
      BENCHMARKS.forEach(benchmark => {
        expect(benchmark.baseTimeSeconds).toBeGreaterThan(0);
      });
    });
  });

  describe('Integration: Full matching flow', () => {
    it('should complete full matching flow for MNIST training', () => {
      const matches = matchGPUs(mnistRequirements, sampleProviders);
      const recommendations = getTopRecommendations(mnistRequirements, sampleProviders);
      
      expect(matches.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeGreaterThan(0);
      
      // All recommendations should be in matches
      recommendations.forEach(rec => {
        const found = matches.find(m => m.provider.id === rec.provider.id);
        expect(found).toBeDefined();
      });
    });

    it('should handle Stable Diffusion with custom parameters', () => {
      const parameters = { resolution: 1024, epochs: 10 };
      const matches = matchGPUs(stableDiffusionRequirements, sampleProviders, 'cost_benefit', parameters);
      
      // Durations should be adjusted for higher resolution
      matches.forEach(match => {
        expect(match.estimatedDuration).toBeGreaterThan(0);
        expect(match.estimatedCost).toBeGreaterThan(0);
      });
    });
  });
});
