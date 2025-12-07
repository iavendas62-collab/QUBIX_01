/**
 * Cost Estimation Component
 * Displays cost and duration estimates with breakdown
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6
 */

import React from 'react';
import { useCostEstimation, useCostEstimationRange, EstimationParameters } from '../hooks/useCostEstimation';
import { Card } from './ui/Card';
import { Clock, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

interface CostEstimationProps {
  jobType: string;
  gpuModel: string;
  pricePerHour: number;
  parameters?: EstimationParameters;
  showRange?: boolean; // Show range for uncertain estimates (Requirement 12.6)
}

/**
 * Cost Estimation Component
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6
 */
export const CostEstimation: React.FC<CostEstimationProps> = ({
  jobType,
  gpuModel,
  pricePerHour,
  parameters,
  showRange = false,
}) => {
  // Use appropriate hook based on showRange
  const singleEstimate = useCostEstimation({
    jobType,
    gpuModel,
    pricePerHour,
    parameters,
    debounceMs: 500, // Requirement 12.5: Recalculate within 500ms
  });
  
  const rangeEstimate = useCostEstimationRange({
    jobType,
    gpuModel,
    pricePerHour,
    parameters,
    debounceMs: 500,
  });
  
  const { estimate, loading, error } = showRange ? 
    { estimate: rangeEstimate.estimateRange?.minEstimate || null, loading: rangeEstimate.loading, error: rangeEstimate.error } :
    singleEstimate;
  
  const estimateRange = rangeEstimate.estimateRange;
  
  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Error calculating estimate</span>
        </div>
        <p className="text-sm text-red-500 mt-2">{error}</p>
      </Card>
    );
  }
  
  if (!estimate) {
    return null;
  }
  
  // Determine if we should show range
  const shouldShowRange = showRange && estimateRange && estimateRange.confidence === 'low';
  
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Cost Estimate</h3>
      
      {/* Confidence Badge */}
      <div className="mb-4">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            estimate.confidence === 'high'
              ? 'bg-green-100 text-green-800'
              : estimate.confidence === 'medium'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-orange-100 text-orange-800'
          }`}
        >
          {estimate.confidence === 'high' && '✓ High Confidence'}
          {estimate.confidence === 'medium' && '~ Medium Confidence'}
          {estimate.confidence === 'low' && '? Low Confidence (Estimate Range)'}
        </span>
      </div>
      
      {/* Duration Estimate (Requirement 12.2: Human-readable format) */}
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600">Estimated Duration</p>
            {shouldShowRange ? (
              <p className="text-xl font-bold text-gray-900">
                {estimateRange!.minEstimate.estimatedDurationFormatted} - {estimateRange!.maxEstimate.estimatedDurationFormatted}
              </p>
            ) : (
              <p className="text-xl font-bold text-gray-900">
                {estimate.estimatedDurationFormatted}
              </p>
            )}
          </div>
        </div>
        
        {/* Cost Estimate (Requirement 12.3: Cost calculation) */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600">Total Cost</p>
            {shouldShowRange ? (
              <p className="text-xl font-bold text-gray-900">
                {estimateRange!.minEstimate.totalCost.toFixed(2)} - {estimateRange!.maxEstimate.totalCost.toFixed(2)} QUBIC
              </p>
            ) : (
              <p className="text-xl font-bold text-gray-900">
                {estimate.totalCost.toFixed(2)} QUBIC
              </p>
            )}
          </div>
        </div>
        
        {/* Cost Breakdown (Requirement 12.4) */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600">Cost Breakdown</p>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Base Rate:</span>
                <span className="font-medium">{estimate.costBreakdown.baseRate.toFixed(2)} QUBIC/hour</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Per Minute:</span>
                <span className="font-medium">{estimate.perMinuteRate.toFixed(4)} QUBIC/min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">{estimate.costBreakdown.duration}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-900 font-semibold">Total:</span>
                <span className="font-bold text-green-600">
                  {estimate.costBreakdown.total.toFixed(2)} QUBIC
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Low confidence warning */}
      {estimate.confidence === 'low' && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5" />
            <div className="text-sm text-orange-800">
              <p className="font-medium">Estimate Uncertainty</p>
              <p className="mt-1">
                No benchmark data available for this GPU and job type combination. 
                Using conservative estimates. Actual duration may vary.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Parameter info */}
      {parameters && Object.keys(parameters).length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Adjusted for parameters:</p>
          <div className="flex flex-wrap gap-2">
            {parameters.epochs && (
              <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                Epochs: {parameters.epochs}
              </span>
            )}
            {parameters.resolution && (
              <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                Resolution: {parameters.resolution}
              </span>
            )}
            {parameters.datasetSize && (
              <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                Dataset: {parameters.datasetSize}
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default CostEstimation;

