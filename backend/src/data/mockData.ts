/**
 * Mock Data for Development and Demo
 * Used when PostgreSQL is not available or USE_MOCK_DATA=true
 */

export const MOCK_JOBS = [
  {
    id: '1',
    userId: 'demo_user',
    modelType: 'LLM Inference',
    status: 'COMPLETED',
    computeNeeded: 2,
    inputData: { prompt: 'Generate a summary of quantum computing' },
    estimatedCost: 4.0,
    actualCost: 3.8,
    progress: 100,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    startedAt: new Date(Date.now() - 3000000).toISOString(),
    completedAt: new Date(Date.now() - 600000).toISOString(),
    result: { 
      output: 'Quantum computing leverages quantum mechanics to process information...',
      tokensGenerated: 150,
      executionTime: 2.3
    },
    provider: {
      id: 'provider-1',
      workerId: 'worker-rtx4090-001',
      gpuModel: 'NVIDIA RTX 4090',
      gpuVram: 24,
      pricePerHour: 2.0
    },
    user: {
      qubicAddress: 'DEMO_CONSUMER_ADDRESS_QUBIC_HACKATHON_2024_LABLAB',
      username: 'demo_consumer'
    }
  },
  {
    id: '2',
    userId: 'demo_user',
    modelType: 'Image Generation',
    status: 'RUNNING',
    computeNeeded: 1,
    inputData: { prompt: 'A futuristic city with flying cars', style: 'cyberpunk' },
    estimatedCost: 3.0,
    actualCost: null,
    progress: 65,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    startedAt: new Date(Date.now() - 900000).toISOString(),
    completedAt: null,
    result: null,
    provider: {
      id: 'provider-2',
      workerId: 'worker-a100-002',
      gpuModel: 'NVIDIA A100',
      gpuVram: 40,
      pricePerHour: 3.0
    },
    user: {
      qubicAddress: 'DEMO_CONSUMER_ADDRESS_QUBIC_HACKATHON_2024_LABLAB',
      username: 'demo_consumer'
    }
  },
  {
    id: '3',
    userId: 'demo_user',
    modelType: 'Model Fine-tuning',
    status: 'PENDING',
    computeNeeded: 8,
    inputData: { model: 'stable-diffusion', dataset: 'custom-art-style' },
    estimatedCost: 24.0,
    actualCost: null,
    progress: 0,
    createdAt: new Date(Date.now() - 300000).toISOString(),
    startedAt: null,
    completedAt: null,
    result: null,
    provider: null,
    user: {
      qubicAddress: 'DEMO_CONSUMER_ADDRESS_QUBIC_HACKATHON_2024_LABLAB',
      username: 'demo_consumer'
    }
  }
];

export const MOCK_PROVIDERS = [
  {
    id: 'provider-real-mx150',
    workerId: 'real-gpu-mx150-local',
    name: 'NVIDIA GeForce MX150 (Your GPU)',
    model: 'NVIDIA GeForce MX150',
    gpuModel: 'NVIDIA GeForce MX150',
    vram: 4,
    gpuVram: 4,
    price: 0.5,
    isOnline: true,
    online: true,
    isAvailable: true,
    status: 'available',
    specs: {
      gpu_model: 'NVIDIA GeForce MX150',
      gpu_vram_gb: 4,
      cpu_model: '4-core CPU',
      cpu_cores: 4,
      ram_total_gb: 15.9
    },
    pricePerHour: 0.5,
    totalEarnings: 0,
    totalJobs: 0,
    location: 'Local Machine',
    metrics: {
      cpu_percent: 25.3,
      ram_percent: 42.1,
      gpu_percent: 0,
      gpu_temp: 45,
      gpu_mem_used_mb: 0,
      gpu_mem_total_mb: 4096
    }
  },
  {
    id: 'provider-1',
    workerId: 'worker-rtx4090-001',
    name: 'RTX 4090 Gaming Rig',
    model: 'NVIDIA RTX 4090',
    gpuModel: 'NVIDIA RTX 4090',
    vram: 24,
    gpuVram: 24,
    price: 2.0,
    isOnline: true,
    online: true,
    isAvailable: true,
    status: 'available',
    specs: {
      gpu_model: 'NVIDIA RTX 4090',
      gpu_vram_gb: 24,
      cpu_model: 'AMD Ryzen 9 7950X',
      cpu_cores: 16,
      ram_total_gb: 64
    },
    pricePerHour: 2.0,
    totalEarnings: 156.50,
    totalJobs: 42,
    location: 'US-East',
    metrics: {
      cpu_percent: 45.2,
      ram_percent: 38.5,
      gpu_percent: 72.0,
      gpu_temp: 68,
      gpu_mem_used_mb: 12000,
      gpu_mem_total_mb: 24000
    }
  },
  {
    id: 'provider-2',
    workerId: 'worker-a100-002',
    name: 'NVIDIA A100 Datacenter',
    model: 'NVIDIA A100',
    gpuModel: 'NVIDIA A100',
    vram: 40,
    gpuVram: 40,
    price: 3.0,
    isOnline: true,
    online: true,
    isAvailable: false,
    status: 'rented',
    specs: {
      gpu_model: 'NVIDIA A100',
      gpu_vram_gb: 40,
      cpu_model: 'Intel Xeon Platinum 8380',
      cpu_cores: 40,
      ram_total_gb: 256
    },
    pricePerHour: 3.0,
    totalEarnings: 892.00,
    totalJobs: 128,
    location: 'EU-West',
    metrics: {
      cpu_percent: 82.5,
      ram_percent: 65.2,
      gpu_percent: 95.0,
      gpu_temp: 75,
      gpu_mem_used_mb: 35000,
      gpu_mem_total_mb: 40000
    }
  },
  {
    id: 'provider-3',
    workerId: 'worker-h100-003',
    name: 'NVIDIA H100 Supercomputer',
    model: 'NVIDIA H100',
    gpuModel: 'NVIDIA H100',
    vram: 80,
    gpuVram: 80,
    price: 5.0,
    isOnline: true,
    online: true,
    isAvailable: true,
    status: 'available',
    specs: {
      gpu_model: 'NVIDIA H100',
      gpu_vram_gb: 80,
      cpu_model: 'AMD EPYC 9654',
      cpu_cores: 96,
      ram_total_gb: 512
    },
    pricePerHour: 5.0,
    totalEarnings: 2450.00,
    totalJobs: 215,
    location: 'US-West',
    metrics: {
      cpu_percent: 15.8,
      ram_percent: 22.3,
      gpu_percent: 0,
      gpu_temp: 42,
      gpu_mem_used_mb: 0,
      gpu_mem_total_mb: 80000
    }
  },
  {
    id: 'provider-4',
    workerId: 'worker-rtx4090-004',
    name: 'RTX 4090 Workstation',
    model: 'NVIDIA RTX 4090',
    gpuModel: 'NVIDIA RTX 4090',
    vram: 24,
    gpuVram: 24,
    price: 1.9,
    isOnline: true,
    online: true,
    isAvailable: true,
    status: 'available',
    specs: {
      gpu_model: 'NVIDIA RTX 4090',
      gpu_vram_gb: 24,
      cpu_model: 'Intel Core i9-13900K',
      cpu_cores: 24,
      ram_total_gb: 64
    },
    pricePerHour: 1.9,
    totalEarnings: 234.80,
    totalJobs: 67,
    location: 'US-West',
    metrics: {
      cpu_percent: 32.1,
      ram_percent: 45.2,
      gpu_percent: 0,
      gpu_temp: 45,
      gpu_mem_used_mb: 0,
      gpu_mem_total_mb: 24000
    }
  },
  {
    id: 'provider-5',
    workerId: 'worker-rtx4080-005',
    name: 'RTX 4080 Gaming PC',
    model: 'NVIDIA RTX 4080',
    gpuModel: 'NVIDIA RTX 4080',
    vram: 16,
    gpuVram: 16,
    price: 1.5,
    isOnline: true,
    online: true,
    isAvailable: true,
    status: 'available',
    specs: {
      gpu_model: 'NVIDIA RTX 4080',
      gpu_vram_gb: 16,
      cpu_model: 'AMD Ryzen 9 7900X',
      cpu_cores: 12,
      ram_total_gb: 32
    },
    pricePerHour: 1.5,
    totalEarnings: 89.20,
    totalJobs: 28,
    location: 'EU-Central',
    metrics: {
      cpu_percent: 28.5,
      ram_percent: 52.1,
      gpu_percent: 0,
      gpu_temp: 48,
      gpu_mem_used_mb: 0,
      gpu_mem_total_mb: 16000
    }
  },
  {
    id: 'provider-6',
    workerId: 'worker-a100-006',
    name: 'A100 Cloud Server',
    model: 'NVIDIA A100',
    gpuModel: 'NVIDIA A100',
    vram: 40,
    gpuVram: 40,
    price: 2.8,
    isOnline: true,
    online: true,
    isAvailable: true,
    status: 'available',
    specs: {
      gpu_model: 'NVIDIA A100',
      gpu_vram_gb: 40,
      cpu_model: 'Intel Xeon Gold 6338',
      cpu_cores: 32,
      ram_total_gb: 256
    },
    pricePerHour: 2.8,
    totalEarnings: 1245.60,
    totalJobs: 189,
    location: 'Asia-East',
    metrics: {
      cpu_percent: 18.2,
      ram_percent: 35.8,
      gpu_percent: 0,
      gpu_temp: 52,
      gpu_mem_used_mb: 0,
      gpu_mem_total_mb: 40000
    }
  },
  {
    id: 'provider-7',
    workerId: 'worker-rtx3090-007',
    name: 'RTX 3090 Ti Studio',
    model: 'NVIDIA RTX 3090 Ti',
    gpuModel: 'NVIDIA RTX 3090 Ti',
    vram: 24,
    gpuVram: 24,
    price: 1.6,
    isOnline: true,
    online: true,
    isAvailable: true,
    status: 'available',
    specs: {
      gpu_model: 'NVIDIA RTX 3090 Ti',
      gpu_vram_gb: 24,
      cpu_model: 'AMD Ryzen 9 5950X',
      cpu_cores: 16,
      ram_total_gb: 64
    },
    pricePerHour: 1.6,
    totalEarnings: 456.30,
    totalJobs: 142,
    location: 'US-Central',
    metrics: {
      cpu_percent: 42.8,
      ram_percent: 48.5,
      gpu_percent: 0,
      gpu_temp: 55,
      gpu_mem_used_mb: 0,
      gpu_mem_total_mb: 24000
    }
  },
  {
    id: 'provider-8',
    workerId: 'worker-v100-008',
    name: 'Tesla V100 Server',
    model: 'NVIDIA Tesla V100',
    gpuModel: 'NVIDIA Tesla V100',
    vram: 32,
    gpuVram: 32,
    price: 2.2,
    isOnline: true,
    online: true,
    isAvailable: false,
    status: 'rented',
    specs: {
      gpu_model: 'NVIDIA Tesla V100',
      gpu_vram_gb: 32,
      cpu_model: 'Intel Xeon E5-2698',
      cpu_cores: 20,
      ram_total_gb: 128
    },
    pricePerHour: 2.2,
    totalEarnings: 678.90,
    totalJobs: 156,
    location: 'EU-North',
    metrics: {
      cpu_percent: 88.5,
      ram_percent: 72.3,
      gpu_percent: 92.0,
      gpu_temp: 78,
      gpu_mem_used_mb: 28000,
      gpu_mem_total_mb: 32000
    }
  },
  {
    id: 'provider-9',
    workerId: 'worker-rtx4070ti-009',
    name: 'RTX 4070 Ti Desktop',
    model: 'NVIDIA RTX 4070 Ti',
    gpuModel: 'NVIDIA RTX 4070 Ti',
    vram: 12,
    gpuVram: 12,
    price: 1.2,
    isOnline: true,
    online: true,
    isAvailable: true,
    status: 'available',
    specs: {
      gpu_model: 'NVIDIA RTX 4070 Ti',
      gpu_vram_gb: 12,
      cpu_model: 'Intel Core i7-13700K',
      cpu_cores: 16,
      ram_total_gb: 32
    },
    pricePerHour: 1.2,
    totalEarnings: 123.45,
    totalJobs: 45,
    location: 'US-East',
    metrics: {
      cpu_percent: 35.2,
      ram_percent: 41.8,
      gpu_percent: 0,
      gpu_temp: 50,
      gpu_mem_used_mb: 0,
      gpu_mem_total_mb: 12000
    }
  },
  {
    id: 'provider-10',
    workerId: 'worker-h100-010',
    name: 'H100 Enterprise Node',
    model: 'NVIDIA H100',
    gpuModel: 'NVIDIA H100',
    vram: 80,
    gpuVram: 80,
    price: 4.8,
    isOnline: true,
    online: true,
    isAvailable: true,
    status: 'available',
    specs: {
      gpu_model: 'NVIDIA H100',
      gpu_vram_gb: 80,
      cpu_model: 'AMD EPYC 9554',
      cpu_cores: 64,
      ram_total_gb: 512
    },
    pricePerHour: 4.8,
    totalEarnings: 3456.70,
    totalJobs: 298,
    location: 'US-Central',
    metrics: {
      cpu_percent: 12.5,
      ram_percent: 18.9,
      gpu_percent: 0,
      gpu_temp: 38,
      gpu_mem_used_mb: 0,
      gpu_mem_total_mb: 80000
    }
  },
  {
    id: 'provider-11',
    workerId: 'worker-rtx3080-011',
    name: 'RTX 3080 Gaming Rig',
    model: 'NVIDIA RTX 3080',
    gpuModel: 'NVIDIA RTX 3080',
    vram: 10,
    gpuVram: 10,
    price: 1.0,
    isOnline: true,
    online: true,
    isAvailable: true,
    status: 'available',
    specs: {
      gpu_model: 'NVIDIA RTX 3080',
      gpu_vram_gb: 10,
      cpu_model: 'AMD Ryzen 7 5800X',
      cpu_cores: 8,
      ram_total_gb: 32
    },
    pricePerHour: 1.0,
    totalEarnings: 234.56,
    totalJobs: 98,
    location: 'EU-West',
    metrics: {
      cpu_percent: 38.7,
      ram_percent: 55.2,
      gpu_percent: 0,
      gpu_temp: 58,
      gpu_mem_used_mb: 0,
      gpu_mem_total_mb: 10000
    }
  },
  {
    id: 'provider-12',
    workerId: 'worker-a6000-012',
    name: 'RTX A6000 Workstation',
    model: 'NVIDIA RTX A6000',
    gpuModel: 'NVIDIA RTX A6000',
    vram: 48,
    gpuVram: 48,
    price: 3.5,
    isOnline: true,
    online: true,
    isAvailable: true,
    status: 'available',
    specs: {
      gpu_model: 'NVIDIA RTX A6000',
      gpu_vram_gb: 48,
      cpu_model: 'Intel Xeon W-3375',
      cpu_cores: 38,
      ram_total_gb: 256
    },
    pricePerHour: 3.5,
    totalEarnings: 1567.80,
    totalJobs: 203,
    location: 'US-West',
    metrics: {
      cpu_percent: 22.3,
      ram_percent: 38.5,
      gpu_percent: 0,
      gpu_temp: 46,
      gpu_mem_used_mb: 0,
      gpu_mem_total_mb: 48000
    }
  },
  {
    id: 'provider-13',
    workerId: 'worker-rtx4090-013',
    name: 'RTX 4090 Pro Build',
    model: 'NVIDIA RTX 4090',
    gpuModel: 'NVIDIA RTX 4090',
    vram: 24,
    gpuVram: 24,
    price: 2.1,
    isOnline: true,
    online: true,
    isAvailable: true,
    status: 'available',
    specs: {
      gpu_model: 'NVIDIA RTX 4090',
      gpu_vram_gb: 24,
      cpu_model: 'AMD Ryzen 9 7950X3D',
      cpu_cores: 16,
      ram_total_gb: 128
    },
    pricePerHour: 2.1,
    totalEarnings: 345.67,
    totalJobs: 78,
    location: 'Asia-Pacific',
    metrics: {
      cpu_percent: 28.9,
      ram_percent: 32.1,
      gpu_percent: 0,
      gpu_temp: 44,
      gpu_mem_used_mb: 0,
      gpu_mem_total_mb: 24000
    }
  },
  {
    id: 'provider-14',
    workerId: 'worker-l40-014',
    name: 'L40 AI Server',
    model: 'NVIDIA L40',
    gpuModel: 'NVIDIA L40',
    vram: 48,
    gpuVram: 48,
    price: 3.2,
    isOnline: true,
    online: true,
    isAvailable: true,
    status: 'available',
    specs: {
      gpu_model: 'NVIDIA L40',
      gpu_vram_gb: 48,
      cpu_model: 'Intel Xeon Platinum 8468',
      cpu_cores: 48,
      ram_total_gb: 384
    },
    pricePerHour: 3.2,
    totalEarnings: 987.65,
    totalJobs: 145,
    location: 'EU-Central',
    metrics: {
      cpu_percent: 25.8,
      ram_percent: 42.3,
      gpu_percent: 0,
      gpu_temp: 49,
      gpu_mem_used_mb: 0,
      gpu_mem_total_mb: 48000
    }
  },
  {
    id: 'provider-15',
    workerId: 'worker-rtx3090-015',
    name: 'RTX 3090 Creator PC',
    model: 'NVIDIA RTX 3090',
    gpuModel: 'NVIDIA RTX 3090',
    vram: 24,
    gpuVram: 24,
    price: 1.4,
    isOnline: true,
    online: true,
    isAvailable: true,
    status: 'available',
    specs: {
      gpu_model: 'NVIDIA RTX 3090',
      gpu_vram_gb: 24,
      cpu_model: 'AMD Ryzen 9 5900X',
      cpu_cores: 12,
      ram_total_gb: 64
    },
    pricePerHour: 1.4,
    totalEarnings: 567.89,
    totalJobs: 178,
    location: 'US-East',
    metrics: {
      cpu_percent: 45.6,
      ram_percent: 58.9,
      gpu_percent: 0,
      gpu_temp: 62,
      gpu_mem_used_mb: 0,
      gpu_mem_total_mb: 24000
    }
  },
  {
    id: 'provider-16',
    workerId: 'worker-a100-016',
    name: 'A100 HPC Cluster',
    model: 'NVIDIA A100',
    gpuModel: 'NVIDIA A100',
    vram: 80,
    gpuVram: 80,
    price: 4.5,
    isOnline: true,
    online: true,
    isAvailable: true,
    status: 'available',
    specs: {
      gpu_model: 'NVIDIA A100',
      gpu_vram_gb: 80,
      cpu_model: 'AMD EPYC 7763',
      cpu_cores: 64,
      ram_total_gb: 512
    },
    pricePerHour: 4.5,
    totalEarnings: 2789.45,
    totalJobs: 267,
    location: 'US-West',
    metrics: {
      cpu_percent: 15.2,
      ram_percent: 28.7,
      gpu_percent: 0,
      gpu_temp: 41,
      gpu_mem_used_mb: 0,
      gpu_mem_total_mb: 80000
    }
  },
  {
    id: 'provider-17',
    workerId: 'worker-rtx4080-017',
    name: 'RTX 4080 Super Build',
    model: 'NVIDIA RTX 4080',
    gpuModel: 'NVIDIA RTX 4080',
    vram: 16,
    gpuVram: 16,
    price: 1.6,
    isOnline: true,
    online: true,
    isAvailable: true,
    status: 'available',
    specs: {
      gpu_model: 'NVIDIA RTX 4080',
      gpu_vram_gb: 16,
      cpu_model: 'Intel Core i9-14900K',
      cpu_cores: 24,
      ram_total_gb: 64
    },
    pricePerHour: 1.6,
    totalEarnings: 178.90,
    totalJobs: 52,
    location: 'Asia-East',
    metrics: {
      cpu_percent: 31.4,
      ram_percent: 44.6,
      gpu_percent: 0,
      gpu_temp: 47,
      gpu_mem_used_mb: 0,
      gpu_mem_total_mb: 16000
    }
  },
  {
    id: 'provider-18',
    workerId: 'worker-rtx3070-018',
    name: 'RTX 3070 Gaming Setup',
    model: 'NVIDIA RTX 3070',
    gpuModel: 'NVIDIA RTX 3070',
    vram: 8,
    gpuVram: 8,
    price: 0.8,
    isOnline: true,
    online: true,
    isAvailable: true,
    status: 'available',
    specs: {
      gpu_model: 'NVIDIA RTX 3070',
      gpu_vram_gb: 8,
      cpu_model: 'AMD Ryzen 7 5700X',
      cpu_cores: 8,
      ram_total_gb: 32
    },
    pricePerHour: 0.8,
    totalEarnings: 145.23,
    totalJobs: 87,
    location: 'EU-South',
    metrics: {
      cpu_percent: 52.3,
      ram_percent: 62.1,
      gpu_percent: 0,
      gpu_temp: 65,
      gpu_mem_used_mb: 0,
      gpu_mem_total_mb: 8000
    }
  },
  {
    id: 'provider-19',
    workerId: 'worker-a40-019',
    name: 'A40 Data Center',
    model: 'NVIDIA A40',
    gpuModel: 'NVIDIA A40',
    vram: 48,
    gpuVram: 48,
    price: 3.0,
    isOnline: true,
    online: true,
    isAvailable: true,
    status: 'available',
    specs: {
      gpu_model: 'NVIDIA A40',
      gpu_vram_gb: 48,
      cpu_model: 'Intel Xeon Gold 6348',
      cpu_cores: 28,
      ram_total_gb: 256
    },
    pricePerHour: 3.0,
    totalEarnings: 1234.56,
    totalJobs: 198,
    location: 'US-Central',
    metrics: {
      cpu_percent: 19.8,
      ram_percent: 36.4,
      gpu_percent: 0,
      gpu_temp: 51,
      gpu_mem_used_mb: 0,
      gpu_mem_total_mb: 48000
    }
  },
  {
    id: 'provider-20',
    workerId: 'worker-rtx4060ti-020',
    name: 'RTX 4060 Ti Compact',
    model: 'NVIDIA RTX 4060 Ti',
    gpuModel: 'NVIDIA RTX 4060 Ti',
    vram: 16,
    gpuVram: 16,
    price: 1.1,
    isOnline: true,
    online: true,
    isAvailable: true,
    status: 'available',
    specs: {
      gpu_model: 'NVIDIA RTX 4060 Ti',
      gpu_vram_gb: 16,
      cpu_model: 'Intel Core i5-13600K',
      cpu_cores: 14,
      ram_total_gb: 32
    },
    pricePerHour: 1.1,
    totalEarnings: 89.45,
    totalJobs: 34,
    location: 'EU-West',
    metrics: {
      cpu_percent: 41.2,
      ram_percent: 48.7,
      gpu_percent: 0,
      gpu_temp: 53,
      gpu_mem_used_mb: 0,
      gpu_mem_total_mb: 16000
    }
  }
];

export const MOCK_USER = {
  id: 'user-demo',
  qubicAddress: 'DEMO_CONSUMER_ADDRESS_QUBIC_HACKATHON_2024_LABLAB',
  username: 'demo_consumer',
  email: 'demo@qubix.ai',
  role: 'BOTH',
  balance: 1000.0,
  createdAt: new Date(Date.now() - 86400000 * 30).toISOString()
};

// Helper to check if mock data should be used
export function shouldUseMockData(): boolean {
  return process.env.USE_MOCK_DATA === 'true' || process.env.NODE_ENV === 'demo';
}
