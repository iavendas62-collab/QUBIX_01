/**
 * SmartMatcher Demo Page
 * Demonstrates the SmartMatcher component with sample data
 */

import { useState } from 'react';
import { SmartMatcher, Provider } from '../components/SmartMatcher';
import { JobAnalysis } from '../components/JobUploader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { notify } from '../components/ui';

// Sample job analysis
const sampleJobAnalysis: JobAnalysis = {
  jobType: 'mnist_training',
  detectedFramework: 'pytorch',
  estimatedVRAM: 8,
  estimatedCompute: 10,
  estimatedRAM: 16,
  estimatedStorage: 5,
  confidence: 'high'
};

// Sample GPU providers
const sampleProviders: Provider[] = [
  {
    id: '1',
    workerId: 'worker-001',
    qubicAddress: 'QUBIC123ABC',
    name: 'High-End Gaming Rig',
    gpuModel: 'RTX 4090',
    gpuVram: 24,
    cpuModel: 'AMD Ryzen 9 7950X',
    cpuCores: 16,
    ramTotal: 64,
    location: 'US-West',
    pricePerHour: 2.5,
    isOnline: true,
    isAvailable: true,
    totalEarnings: 1250,
    totalJobs: 45,
    uptime: 98.5
  },
  {
    id: '2',
    workerId: 'worker-002',
    qubicAddress: 'QUBIC456DEF',
    name: 'ML Workstation',
    gpuModel: 'RTX 3090',
    gpuVram: 24,
    cpuModel: 'Intel i9-12900K',
    cpuCores: 16,
    ramTotal: 32,
    location: 'EU-Central',
    pricePerHour: 1.8,
    isOnline: true,
    isAvailable: true,
    totalEarnings: 890,
    totalJobs: 32,
    uptime: 96.2
  },
  {
    id: '3',
    workerId: 'worker-003',
    qubicAddress: 'QUBIC789GHI',
    name: 'Budget GPU Server',
    gpuModel: 'RTX 3080',
    gpuVram: 10,
    cpuModel: 'AMD Ryzen 7 5800X',
    cpuCores: 8,
    ramTotal: 32,
    location: 'US-East',
    pricePerHour: 1.2,
    isOnline: true,
    isAvailable: true,
    totalEarnings: 560,
    totalJobs: 28,
    uptime: 94.8
  },
  {
    id: '4',
    workerId: 'worker-004',
    qubicAddress: 'QUBIC012JKL',
    name: 'Entry Level GPU',
    gpuModel: 'RTX 3070',
    gpuVram: 8,
    cpuModel: 'Intel i7-11700K',
    cpuCores: 8,
    ramTotal: 16,
    location: 'Asia-Pacific',
    pricePerHour: 0.9,
    isOnline: true,
    isAvailable: true,
    totalEarnings: 340,
    totalJobs: 19,
    uptime: 92.1
  },
  {
    id: '5',
    workerId: 'worker-005',
    qubicAddress: 'QUBIC345MNO',
    name: 'Insufficient GPU',
    gpuModel: 'RTX 3060',
    gpuVram: 6,
    cpuModel: 'AMD Ryzen 5 5600X',
    cpuCores: 6,
    ramTotal: 16,
    location: 'US-Central',
    pricePerHour: 0.7,
    isOnline: true,
    isAvailable: true,
    totalEarnings: 180,
    totalJobs: 12,
    uptime: 89.5
  },
  {
    id: '6',
    workerId: 'worker-006',
    qubicAddress: 'QUBIC678PQR',
    name: 'Offline GPU',
    gpuModel: 'RTX 4080',
    gpuVram: 16,
    cpuModel: 'Intel i9-13900K',
    cpuCores: 24,
    ramTotal: 64,
    location: 'EU-West',
    pricePerHour: 2.2,
    isOnline: false,
    isAvailable: false,
    totalEarnings: 720,
    totalJobs: 25,
    uptime: 87.3
  }
];

export default function SmartMatcherDemo() {
  const [selectedGPU, setSelectedGPU] = useState<Provider | null>(null);

  const handleGPUSelected = (gpu: Provider) => {
    setSelectedGPU(gpu);
    notify.success(`Selected ${gpu.gpuModel} - ${gpu.name || gpu.workerId}`);
  };

  const handleProceed = () => {
    if (selectedGPU) {
      notify.success('Proceeding to job configuration...');
      // In real app, this would navigate to next step
    } else {
      notify.error('Please select a GPU first');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Smart GPU Matcher Demo
          </h1>
          <p className="text-slate-400">
            Intelligent GPU matching with cost-benefit analysis
          </p>
        </div>

        {/* Job Requirements Display */}
        <Card>
          <CardHeader>
            <CardTitle>Job Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">Job Type</p>
                <p className="text-sm font-medium text-white capitalize">
                  {sampleJobAnalysis.jobType.replace(/_/g, ' ')}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Framework</p>
                <p className="text-sm font-medium text-white capitalize">
                  {sampleJobAnalysis.detectedFramework}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Required VRAM</p>
                <p className="text-sm font-medium text-white">
                  {sampleJobAnalysis.estimatedVRAM} GB
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Required RAM</p>
                <p className="text-sm font-medium text-white">
                  {sampleJobAnalysis.estimatedRAM} GB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SmartMatcher Component */}
        <SmartMatcher
          jobRequirements={sampleJobAnalysis}
          availableGPUs={sampleProviders}
          onGPUSelected={handleGPUSelected}
          selectedGPU={selectedGPU}
        />

        {/* Selected GPU Summary */}
        {selectedGPU && (
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Selected GPU</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {selectedGPU.gpuModel}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {selectedGPU.name || selectedGPU.workerId}
                  </p>
                </div>
                <Button onClick={handleProceed}>
                  Proceed to Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
