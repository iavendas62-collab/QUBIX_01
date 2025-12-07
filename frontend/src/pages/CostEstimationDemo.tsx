/**
 * Cost Estimation Demo Page
 * Demonstrates reactive cost estimation with parameter adjustments
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6
 */

import React, { useState } from 'react';
import { CostEstimation } from '../components/CostEstimation';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function CostEstimationDemo() {
  const [jobType, setJobType] = useState('mnist_training');
  const [gpuModel, setGPUModel] = useState('RTX 4090');
  const [pricePerHour, setPricePerHour] = useState(2.5);
  const [epochs, setEpochs] = useState(5);
  const [resolution, setResolution] = useState(512);
  const [datasetSize, setDatasetSize] = useState(10000);
  const [showRange, setShowRange] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Cost Estimation Demo
          </h1>
          <p className="text-gray-600">
            Test reactive cost estimation with parameter adjustments (recalculates within 500ms)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Configuration</h2>
            
            <div className="space-y-4">
              {/* Job Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Type
                </label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="mnist_training">MNIST Training</option>
                  <option value="stable_diffusion">Stable Diffusion</option>
                  <option value="inference">Inference</option>
                  <option value="custom_script">Custom Script</option>
                </select>
              </div>

              {/* GPU Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GPU Model
                </label>
                <select
                  value={gpuModel}
                  onChange={(e) => setGPUModel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="RTX 4090">RTX 4090</option>
                  <option value="RTX 4080">RTX 4080</option>
                  <option value="RTX 3090">RTX 3090</option>
                  <option value="RTX 3080">RTX 3080</option>
                  <option value="RTX 3070">RTX 3070</option>
                  <option value="RTX 3060">RTX 3060</option>
                  <option value="Unknown GPU">Unknown GPU (Low Confidence)</option>
                </select>
              </div>

              {/* Price Per Hour */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Per Hour (QUBIC): {pricePerHour.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.1"
                  value={pricePerHour}
                  onChange={(e) => setPricePerHour(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Parameters Section */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Job Parameters (Adjust to see reactive recalculation)
                </h3>

                {/* Epochs (for training jobs) */}
                {(jobType === 'mnist_training' || jobType === 'custom_script') && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Epochs: {epochs}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      step="1"
                      value={epochs}
                      onChange={(e) => setEpochs(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Linear scaling: 2x epochs = 2x time
                    </p>
                  </div>
                )}

                {/* Resolution (for image generation) */}
                {jobType === 'stable_diffusion' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resolution: {resolution}x{resolution}
                    </label>
                    <input
                      type="range"
                      min="256"
                      max="1024"
                      step="128"
                      value={resolution}
                      onChange={(e) => setResolution(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Quadratic scaling: 2x resolution = 4x time
                    </p>
                  </div>
                )}

                {/* Dataset Size (for training jobs) */}
                {(jobType === 'mnist_training' || jobType === 'custom_script') && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dataset Size: {datasetSize.toLocaleString()}
                    </label>
                    <input
                      type="range"
                      min="1000"
                      max="50000"
                      step="1000"
                      value={datasetSize}
                      onChange={(e) => setDatasetSize(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Linear scaling: 2x dataset = 2x time
                    </p>
                  </div>
                )}
              </div>

              {/* Show Range Toggle */}
              <div className="pt-4 border-t border-gray-200">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showRange}
                    onChange={(e) => setShowRange(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Show estimate range (for low confidence)
                  </span>
                </label>
              </div>
            </div>
          </Card>

          {/* Cost Estimation Display */}
          <div>
            <CostEstimation
              jobType={jobType}
              gpuModel={gpuModel}
              pricePerHour={pricePerHour}
              parameters={{
                epochs: jobType === 'mnist_training' || jobType === 'custom_script' ? epochs : undefined,
                resolution: jobType === 'stable_diffusion' ? resolution : undefined,
                datasetSize: jobType === 'mnist_training' || jobType === 'custom_script' ? datasetSize : undefined,
              }}
              showRange={showRange}
            />

            {/* Info Card */}
            <Card className="p-6 mt-6 bg-blue-50 border-blue-200">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                💡 How It Works
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Estimates recalculate within 500ms of parameter changes</li>
                <li>• Benchmarks are stored in database for accuracy</li>
                <li>• Parameter adjustments scale duration proportionally</li>
                <li>• Low confidence shows estimate range (±30%)</li>
                <li>• Cost = Duration × Hourly Rate</li>
              </ul>
            </Card>
          </div>
        </div>

        {/* Test Scenarios */}
        <Card className="p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Quick Test Scenarios</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => {
                setJobType('mnist_training');
                setGPUModel('RTX 4090');
                setPricePerHour(2.5);
                setEpochs(5);
                setDatasetSize(10000);
              }}
              variant="outline"
            >
              Fast Training (RTX 4090)
            </Button>
            <Button
              onClick={() => {
                setJobType('stable_diffusion');
                setGPUModel('RTX 3090');
                setPricePerHour(2.0);
                setResolution(1024);
              }}
              variant="outline"
            >
              High-Res Generation
            </Button>
            <Button
              onClick={() => {
                setJobType('custom_script');
                setGPUModel('Unknown GPU');
                setPricePerHour(1.5);
                setShowRange(true);
              }}
              variant="outline"
            >
              Unknown GPU (Range)
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default CostEstimationDemo;
