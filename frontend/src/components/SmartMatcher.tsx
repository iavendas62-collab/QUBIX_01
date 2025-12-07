/**
 * SmartMatcher Component
 * Intelligent GPU matching and recommendation engine
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, 
  Zap, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Award,
  ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { JobAnalysis } from './JobUploader';
import { gpuCardHover, listContainer, listItem } from '../utils/animations';

// Provider interface matching backend
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

// Compatible GPU interface matching backend
export interface CompatibleGPU {
  provider: Provider;
  compatibility: 'recommended' | 'compatible' | 'borderline' | 'insufficient';
  estimatedDuration: number; // seconds
  estimatedCost: number; // QUBIC
  costBenefitScore: number; // 0-100
  warnings: string[];
}

export interface SmartMatcherProps {
  jobRequirements: JobAnalysis;
  availableGPUs: Provider[];
  onGPUSelected: (gpu: Provider) => void;
  selectedGPU?: Provider | null;
}

type SortOption = 'cost_benefit' | 'price_low' | 'performance' | 'availability';

export function SmartMatcher({
  jobRequirements,
  availableGPUs,
  onGPUSelected,
  selectedGPU = null
}: SmartMatcherProps) {
  const [sortBy, setSortBy] = useState<SortOption>('cost_benefit');
  const [showComparison, setShowComparison] = useState(false);

  /**
   * Calculate GPU compatibility
   * Requirements: 3.1, 3.2, 3.4
   */
  const calculateCompatibility = (
    gpu: Provider
  ): { compatibility: CompatibleGPU['compatibility']; warnings: string[] } => {
    const warnings: string[] = [];
    
    const vramRatio = gpu.gpuVram / jobRequirements.estimatedVRAM;
    const ramRatio = gpu.ramTotal / jobRequirements.estimatedRAM;
    
    if (vramRatio >= 1.5 && ramRatio >= 1.3) {
      return { compatibility: 'recommended', warnings };
    } else if (vramRatio >= 1.2 && ramRatio >= 1.1) {
      return { compatibility: 'compatible', warnings };
    } else if (vramRatio >= 1.0 && ramRatio >= 1.0) {
      warnings.push('GPU VRAM is at minimum requirement - may run slower');
      if (ramRatio < 1.1) {
        warnings.push('System RAM is at minimum - consider closing other applications');
      }
      return { compatibility: 'borderline', warnings };
    } else {
      if (vramRatio < 1.0) {
        warnings.push(`Insufficient VRAM: ${gpu.gpuVram}GB available, ${jobRequirements.estimatedVRAM}GB required`);
      }
      if (ramRatio < 1.0) {
        warnings.push(`Insufficient RAM: ${gpu.ramTotal}GB available, ${jobRequirements.estimatedRAM}GB required`);
      }
      return { compatibility: 'insufficient', warnings };
    }
  };

  /**
   * Estimate duration using simplified benchmark logic
   * Requirements: 3.6
   */
  const estimateDuration = (gpuModel: string): number => {
    // Simplified benchmark estimates (in seconds)
    const benchmarks: Record<string, Record<string, number>> = {
      mnist_training: {
        'RTX 4090': 120,
        'RTX 4080': 150,
        'RTX 3090': 180,
        'RTX 3080': 220,
        'RTX 3070': 280,
        'RTX 3060': 350,
      },
      stable_diffusion: {
        'RTX 4090': 300,
        'RTX 4080': 400,
        'RTX 3090': 450,
        'RTX 3080': 550,
        'RTX 3070': 700,
      },
      inference: {
        'RTX 4090': 60,
        'RTX 4080': 80,
        'RTX 3090': 100,
        'RTX 3080': 120,
        'RTX 3070': 150,
      },
      custom_script: {
        'RTX 4090': 600,
        'RTX 4080': 750,
        'RTX 3090': 900,
        'RTX 3080': 1100,
        'RTX 3070': 1400,
      },
    };

    const jobTypeBenchmarks = benchmarks[jobRequirements.jobType];
    if (jobTypeBenchmarks && jobTypeBenchmarks[gpuModel]) {
      return jobTypeBenchmarks[gpuModel];
    }

    // Default conservative estimate
    return 1200;
  };

  /**
   * Calculate cost
   * Requirements: 3.7
   */
  const calculateCost = (durationSeconds: number, pricePerHour: number): number => {
    const durationHours = durationSeconds / 3600;
    return durationHours * pricePerHour;
  };

  /**
   * Calculate cost-benefit score
   * Requirements: 3.5
   */
  const calculateCostBenefitScore = (
    estimatedDuration: number,
    estimatedCost: number
  ): number => {
    const performanceScore = 1000 / estimatedDuration;
    const costScore = 1 / (estimatedCost + 0.01);
    const rawScore = (performanceScore * 0.6) + (costScore * 0.4);
    const normalizedScore = Math.min(100, rawScore * 10);
    return Math.round(normalizedScore);
  };

  /**
   * Process and sort GPUs
   * Requirements: 3.1, 3.2, 3.4, 3.5
   */
  const compatibleGPUs = useMemo(() => {
    const processed: CompatibleGPU[] = availableGPUs.map(gpu => {
      const { compatibility, warnings } = calculateCompatibility(gpu);
      const estimatedDuration = estimateDuration(gpu.gpuModel);
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

    // Sort based on selected criteria (Requirement 3.5)
    return processed.sort((a, b) => {
      switch (sortBy) {
        case 'cost_benefit':
          return b.costBenefitScore - a.costBenefitScore;
        case 'price_low':
          return a.estimatedCost - b.estimatedCost;
        case 'performance':
          return a.estimatedDuration - b.estimatedDuration;
        case 'availability':
          const aAvailable = a.provider.isOnline && a.provider.isAvailable ? 1 : 0;
          const bAvailable = b.provider.isOnline && b.provider.isAvailable ? 1 : 0;
          return bAvailable - aAvailable;
        default:
          return 0;
      }
    });
  }, [availableGPUs, jobRequirements, sortBy]);

  /**
   * Get top 3 recommendations
   * Requirements: 3.7
   */
  const topRecommendations = useMemo(() => {
    return compatibleGPUs
      .filter(gpu => gpu.compatibility !== 'insufficient')
      .slice(0, 3);
  }, [compatibleGPUs]);

  /**
   * Format duration as human-readable
   */
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  };

  /**
   * Get compatibility badge
   * Requirements: 3.2
   */
  const getCompatibilityBadge = (compatibility: CompatibleGPU['compatibility']) => {
    switch (compatibility) {
      case 'recommended':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/20 border border-green-500/50 rounded-full">
            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs font-medium text-green-300">Recommended</span>
          </div>
        );
      case 'compatible':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/20 border border-cyan-500/50 rounded-full">
            <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-medium text-cyan-300">Compatible</span>
          </div>
        );
      case 'borderline':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-full">
            <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs font-medium text-yellow-300">Borderline</span>
          </div>
        );
      case 'insufficient':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/20 border border-red-500/50 rounded-full">
            <XCircle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs font-medium text-red-300">Insufficient</span>
          </div>
        );
    }
  };

  /**
   * Render GPU card
   * Requirements: 3.2, 3.3, 3.6, 3.7, 3.8
   */
  const renderGPUCard = (compatibleGPU: CompatibleGPU, isTopRecommendation: boolean = false) => {
    const { provider, compatibility, estimatedDuration, estimatedCost, costBenefitScore, warnings } = compatibleGPU;
    const isSelected = selectedGPU?.id === provider.id;
    const isDisabled = compatibility === 'insufficient' || !provider.isOnline || !provider.isAvailable;

    return (
      <motion.div
        key={provider.id}
        variants={gpuCardHover}
        initial="rest"
        whileHover={!isDisabled ? "hover" : "rest"}
        whileTap={!isDisabled ? "tap" : "rest"}
        layout
      >
        <Card
          variant={isSelected ? 'bordered' : 'default'}
          className={`
            relative transition-all duration-200
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-cyan-500/50'}
            ${isSelected ? 'ring-2 ring-cyan-500/50' : ''}
          `}
          onClick={() => !isDisabled && onGPUSelected(provider)}
        >
        {/* Top Recommendation Badge */}
        {isTopRecommendation && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full shadow-lg">
              <Award className="w-3.5 h-3.5 text-white" />
              <span className="text-xs font-bold text-white">TOP PICK</span>
            </div>
          </div>
        )}

        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="text-base font-semibold text-white mb-1">{provider.gpuModel}</h4>
              <p className="text-xs text-slate-400">{provider.name || provider.workerId}</p>
            </div>
            {getCompatibilityBadge(compatibility)}
          </div>

          {/* Specs */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <div>
                <p className="text-xs text-slate-400">VRAM</p>
                <p className="text-sm font-medium text-white">{provider.gpuVram} GB</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <div>
                <p className="text-xs text-slate-400">RAM</p>
                <p className="text-sm font-medium text-white">{provider.ramTotal} GB</p>
              </div>
            </div>
          </div>

          {/* Estimates (Requirements: 3.6, 3.7) */}
          <div className="grid grid-cols-2 gap-2 mb-3 p-2 bg-slate-900/50 rounded-lg">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-xs text-slate-400">Est. Time</p>
              </div>
              <p className="text-sm font-semibold text-white">{formatDuration(estimatedDuration)}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-xs text-slate-400">Est. Cost</p>
              </div>
              <p className="text-sm font-semibold text-cyan-400">{estimatedCost.toFixed(2)} QUBIC</p>
            </div>
          </div>

          {/* Cost-Benefit Score */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">Value Score</span>
              <span className="text-xs font-medium text-white">{costBenefitScore}/100</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  costBenefitScore >= 70 ? 'bg-green-500' :
                  costBenefitScore >= 40 ? 'bg-yellow-500' :
                  'bg-orange-500'
                }`}
                style={{ width: `${costBenefitScore}%` }}
              />
            </div>
          </div>

          {/* Warnings (Requirements: 3.3) */}
          {warnings.length > 0 && (
            <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              {warnings.map((warning, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-yellow-200">{warning}</p>
                </div>
              ))}
            </div>
          )}

          {/* Status */}
          <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${provider.isOnline && provider.isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-slate-400">
                {provider.isOnline && provider.isAvailable ? 'Available' : 'Offline'}
              </span>
            </div>
            <span className="text-xs text-slate-400">{provider.pricePerHour.toFixed(2)} QUBIC/hr</span>
          </div>
        </CardContent>
      </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Sorting Controls (Requirement 3.5) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Smart GPU Matching</CardTitle>
              <p className="text-sm text-slate-400 mt-1">
                {compatibleGPUs.length} GPUs analyzed • {topRecommendations.length} recommended
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-400">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="cost_benefit">Best Value</option>
                <option value="price_low">Lowest Price</option>
                <option value="performance">Fastest</option>
                <option value="availability">Available Now</option>
              </select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Top 3 Recommendations Comparison (Requirement 3.7) */}
      {topRecommendations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Top Recommendations
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComparison(!showComparison)}
              rightIcon={<ChevronDown className={`w-4 h-4 transition-transform ${showComparison ? 'rotate-180' : ''}`} />}
            >
              {showComparison ? 'Hide' : 'Show'} Comparison
            </Button>
          </div>

          <AnimatePresence>
            {showComparison && (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {topRecommendations.map((gpu, idx) => (
                  <motion.div 
                    key={gpu.provider.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    {renderGPUCard(gpu, idx === 0)}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* All GPUs Grid */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">All Available GPUs</h3>
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={listContainer}
          initial="hidden"
          animate="visible"
        >
          {compatibleGPUs.map(gpu => (
            <motion.div key={gpu.provider.id} variants={listItem}>
              {renderGPUCard(gpu)}
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* No GPUs Available */}
      {compatibleGPUs.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No GPUs Available</h3>
            <p className="text-sm text-slate-400">
              There are currently no GPUs that match your requirements. Please try again later or adjust your job requirements.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

