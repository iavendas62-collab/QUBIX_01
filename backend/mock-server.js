const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();

// CORS Configuration for development
const corsOptions = {
  origin: ['http://localhost:3001', 'http://localhost:3004', 'http://localhost:5173', 'http://127.0.0.1:3001', 'http://127.0.0.1:3004'], // Frontend URLs (porta 3001 and 3004)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Mock users database
// Demo users (pre-registered for testing)
const mockUsers = [
  {
    id: '1',
    name: 'Demo User',
    email: 'demo@qubix.io',
    password: 'demo123',
    type: 'PROVIDER',
    qubicIdentity: 'DEMOQUBICADDRESSABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQR',
    qubicSeed: 'demoseedphraseforsecuritytestingpurposesonly',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Pedro Farias',
    email: 'iavendas62@gmail.com',
    password: '@Llplac1234',
    type: 'PROVIDER',
    qubicIdentity: 'PEDROQUBICADDRESSABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOP',
    qubicSeed: 'pedroseedphraseforsecuritytestingpurposesonly',
    createdAt: new Date().toISOString()
  }
];

// Mock data - EXPANDED FOR DEMO
const mockStats = {
  jobs: { total: 2847, active: 127, completed: 2156, failed: 89 },
  providers: { total: 423, active: 267, online: 189 },
  models: { total: 892, downloads: 45632 },
  network: {
    totalComputors: 1423,
    availableCompute: 8945,
    averagePrice: 4.2,
    totalValueLocked: 1250000, // QUBIC
    transactions24h: 3456
  }
};

const mockJobs = [
  // COMPLETED jobs (5)
  {
    id: '1',
    userId: 'demo_user',
    modelType: 'gpt2',
    status: 'COMPLETED',
    computeNeeded: 10,
    budget: 50,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    provider: { id: '1', address: 'QUBIC_PROVIDER_1' }
  },
  {
    id: '2',
    userId: 'demo_user',
    modelType: 'bert',
    status: 'COMPLETED',
    computeNeeded: 15,
    budget: 75,
    createdAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
    provider: { id: '2', address: 'QUBIC_PROVIDER_2' }
  },
  {
    id: '3',
    userId: 'demo_user',
    modelType: 'stable-diffusion',
    status: 'COMPLETED',
    computeNeeded: 25,
    budget: 125,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    provider: { id: '3', address: 'QUBIC_PROVIDER_3' }
  },
  {
    id: '4',
    userId: 'demo_user',
    modelType: 'llama',
    status: 'COMPLETED',
    computeNeeded: 30,
    budget: 150,
    createdAt: new Date(Date.now() - 86400000 * 0.5).toISOString(),
    provider: { id: '4', address: 'QUBIC_PROVIDER_4' }
  },
  {
    id: '5',
    userId: 'demo_user',
    modelType: 'gpt2',
    status: 'COMPLETED',
    computeNeeded: 12,
    budget: 60,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    provider: { id: '5', address: 'QUBIC_PROVIDER_5' }
  },

  // RUNNING jobs (3)
  {
    id: '6',
    userId: 'demo_user',
    modelType: 'bert',
    status: 'RUNNING',
    computeNeeded: 20,
    budget: 100,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    provider: { id: '6', address: 'QUBIC_PROVIDER_6' }
  },
  {
    id: '7',
    userId: 'demo_user',
    modelType: 'stable-diffusion',
    status: 'RUNNING',
    computeNeeded: 35,
    budget: 175,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    provider: { id: '7', address: 'QUBIC_PROVIDER_7' }
  },
  {
    id: '8',
    userId: 'demo_user',
    modelType: 'llama',
    status: 'RUNNING',
    computeNeeded: 40,
    budget: 200,
    createdAt: new Date(Date.now() - 900000).toISOString(),
    provider: { id: '8', address: 'QUBIC_PROVIDER_8' }
  },

  // PENDING jobs (5)
  {
    id: '9',
    userId: 'demo_user',
    modelType: 'gpt2',
    status: 'PENDING',
    computeNeeded: 18,
    budget: 90,
    createdAt: new Date(Date.now() - 300000).toISOString()
  },
  {
    id: '10',
    userId: 'demo_user',
    modelType: 'bert',
    status: 'PENDING',
    computeNeeded: 22,
    budget: 110,
    createdAt: new Date(Date.now() - 240000).toISOString()
  },
  {
    id: '11',
    userId: 'demo_user',
    modelType: 'stable-diffusion',
    status: 'PENDING',
    computeNeeded: 28,
    budget: 140,
    createdAt: new Date(Date.now() - 180000).toISOString()
  },
  {
    id: '12',
    userId: 'demo_user',
    modelType: 'llama',
    status: 'PENDING',
    computeNeeded: 32,
    budget: 160,
    createdAt: new Date(Date.now() - 120000).toISOString()
  },
  {
    id: '13',
    userId: 'demo_user',
    modelType: 'gpt2',
    status: 'PENDING',
    computeNeeded: 14,
    budget: 70,
    createdAt: new Date(Date.now() - 60000).toISOString()
  },

  // ASSIGNED jobs (4)
  {
    id: '14',
    userId: 'demo_user',
    modelType: 'bert',
    status: 'ASSIGNED',
    computeNeeded: 16,
    budget: 80,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    provider: { id: '9', address: 'QUBIC_PROVIDER_9' }
  },
  {
    id: '15',
    userId: 'demo_user',
    modelType: 'stable-diffusion',
    status: 'ASSIGNED',
    computeNeeded: 24,
    budget: 120,
    createdAt: new Date(Date.now() - 1500000).toISOString(),
    provider: { id: '10', address: 'QUBIC_PROVIDER_10' }
  },
  {
    id: '16',
    userId: 'demo_user',
    modelType: 'llama',
    status: 'ASSIGNED',
    computeNeeded: 26,
    budget: 130,
    createdAt: new Date(Date.now() - 1200000).toISOString(),
    provider: { id: '11', address: 'QUBIC_PROVIDER_11' }
  },
  {
    id: '17',
    userId: 'demo_user',
    modelType: 'gpt2',
    status: 'ASSIGNED',
    computeNeeded: 19,
    budget: 95,
    createdAt: new Date(Date.now() - 900000).toISOString(),
    provider: { id: '12', address: 'QUBIC_PROVIDER_12' }
  },

  // FAILED jobs (3)
  {
    id: '18',
    userId: 'demo_user',
    modelType: 'bert',
    status: 'FAILED',
    computeNeeded: 20,
    budget: 100,
    createdAt: new Date(Date.now() - 86400000 * 0.8).toISOString(),
    provider: { id: '13', address: 'QUBIC_PROVIDER_13' },
    error: 'GPU memory insufficient'
  },
  {
    id: '19',
    userId: 'demo_user',
    modelType: 'stable-diffusion',
    status: 'FAILED',
    computeNeeded: 30,
    budget: 150,
    createdAt: new Date(Date.now() - 86400000 * 0.6).toISOString(),
    provider: { id: '14', address: 'QUBIC_PROVIDER_14' },
    error: 'Provider disconnected'
  },
  {
    id: '20',
    userId: 'demo_user',
    modelType: 'llama',
    status: 'FAILED',
    computeNeeded: 35,
    budget: 175,
    createdAt: new Date(Date.now() - 86400000 * 0.3).toISOString(),
    provider: { id: '15', address: 'QUBIC_PROVIDER_15' },
    error: 'Job timeout exceeded'
  }
];

const mockProviders = [
  // High-end GPUs (15 providers)
  {
    id: '1',
    address: 'QUBIC_PROVIDER_1_ABC123',
    computePower: 100,
    pricePerHour: 5.0,
    reputation: 0.95,
    totalJobs: 150,
    isActive: true,
    location: 'São Paulo, Brazil',
    specs: { gpu_model: 'RTX 4090', gpu_vram_gb: 24, cpu_cores: 16, ram_total_gb: 32 }
  },
  {
    id: '2',
    address: 'QUBIC_PROVIDER_2_DEF456',
    computePower: 200,
    pricePerHour: 8.0,
    reputation: 0.88,
    totalJobs: 89,
    isActive: true,
    location: 'Miami, US',
    specs: { gpu_model: 'RTX 3090', gpu_vram_gb: 24, cpu_cores: 12, ram_total_gb: 64 }
  },
  {
    id: '3',
    address: 'QUBIC_PROVIDER_3_GHI789',
    computePower: 180,
    pricePerHour: 7.5,
    reputation: 0.92,
    totalJobs: 234,
    isActive: true,
    location: 'London, UK',
    specs: { gpu_model: 'RTX 3090', gpu_vram_gb: 24, cpu_cores: 16, ram_total_gb: 32 }
  },
  {
    id: '4',
    address: 'QUBIC_PROVIDER_4_JKL012',
    computePower: 150,
    pricePerHour: 6.0,
    reputation: 0.89,
    totalJobs: 178,
    isActive: true,
    location: 'Tokyo, Japan',
    specs: { gpu_model: 'RTX 3090', gpu_vram_gb: 24, cpu_cores: 8, ram_total_gb: 16 }
  },
  {
    id: '5',
    address: 'QUBIC_PROVIDER_5_MNO345',
    computePower: 250,
    pricePerHour: 10.0,
    reputation: 0.96,
    totalJobs: 412,
    isActive: true,
    location: 'Frankfurt, Germany',
    specs: { gpu_model: 'A100', gpu_vram_gb: 80, cpu_cores: 24, ram_total_gb: 128 }
  },
  {
    id: '6',
    address: 'QUBIC_PROVIDER_6_PQR678',
    computePower: 220,
    pricePerHour: 9.0,
    reputation: 0.91,
    totalJobs: 298,
    isActive: true,
    location: 'New York, US',
    specs: { gpu_model: 'A100', gpu_vram_gb: 40, cpu_cores: 20, ram_total_gb: 64 }
  },
  {
    id: '7',
    address: 'QUBIC_PROVIDER_7_STU901',
    computePower: 190,
    pricePerHour: 8.5,
    reputation: 0.87,
    totalJobs: 156,
    isActive: true,
    location: 'Singapore',
    specs: { gpu_model: 'H100', gpu_vram_gb: 80, cpu_cores: 32, ram_total_gb: 256 }
  },
  {
    id: '8',
    address: 'QUBIC_PROVIDER_8_VWX234',
    computePower: 160,
    pricePerHour: 7.0,
    reputation: 0.93,
    totalJobs: 289,
    isActive: true,
    location: 'Sydney, Australia',
    specs: { gpu_model: 'RTX 4080', gpu_vram_gb: 16, cpu_cores: 12, ram_total_gb: 32 }
  },
  {
    id: '9',
    address: 'QUBIC_PROVIDER_9_YZA567',
    computePower: 140,
    pricePerHour: 6.5,
    reputation: 0.90,
    totalJobs: 203,
    isActive: true,
    location: 'Paris, France',
    specs: { gpu_model: 'RTX 4080', gpu_vram_gb: 16, cpu_cores: 16, ram_total_gb: 32 }
  },
  {
    id: '10',
    address: 'QUBIC_PROVIDER_10_BCD890',
    computePower: 130,
    pricePerHour: 5.5,
    reputation: 0.88,
    totalJobs: 167,
    isActive: true,
    location: 'Toronto, Canada',
    specs: { gpu_model: 'RTX 3080', gpu_vram_gb: 10, cpu_cores: 8, ram_total_gb: 16 }
  },
  {
    id: '11',
    address: 'QUBIC_PROVIDER_11_EFG123',
    computePower: 120,
    pricePerHour: 5.0,
    reputation: 0.85,
    totalJobs: 134,
    isActive: true,
    location: 'Los Angeles, US',
    specs: { gpu_model: 'RTX 3080', gpu_vram_gb: 10, cpu_cores: 12, ram_total_gb: 32 }
  },
  {
    id: '12',
    address: 'QUBIC_PROVIDER_12_HIJKL456',
    computePower: 110,
    pricePerHour: 4.5,
    reputation: 0.82,
    totalJobs: 98,
    isActive: false, // Offline for demo
    location: 'Chicago, US',
    specs: { gpu_model: 'RTX 3070', gpu_vram_gb: 8, cpu_cores: 8, ram_total_gb: 16 }
  },
  {
    id: '13',
    address: 'QUBIC_PROVIDER_13_MNOP789',
    computePower: 100,
    pricePerHour: 4.0,
    reputation: 0.80,
    totalJobs: 76,
    isActive: true,
    location: 'Amsterdam, Netherlands',
    specs: { gpu_model: 'RTX 3070', gpu_vram_gb: 8, cpu_cores: 6, ram_total_gb: 16 }
  },
  {
    id: '14',
    address: 'QUBIC_PROVIDER_14_QRST012',
    computePower: 90,
    pricePerHour: 3.5,
    reputation: 0.78,
    totalJobs: 54,
    isActive: true,
    location: 'Seoul, South Korea',
    specs: { gpu_model: 'A10', gpu_vram_gb: 24, cpu_cores: 8, ram_total_gb: 32 }
  },
  {
    id: '15',
    address: 'QUBIC_PROVIDER_15_UVWX345',
    computePower: 80,
    pricePerHour: 3.0,
    reputation: 0.75,
    totalJobs: 32,
    isActive: true,
    location: 'Mumbai, India',
    specs: { gpu_model: 'A10', gpu_vram_gb: 24, cpu_cores: 12, ram_total_gb: 64 }
  },

  // Medium-end GPUs (7 providers)
  {
    id: '16',
    address: 'QUBIC_PROVIDER_16_YZAB678',
    computePower: 70,
    pricePerHour: 2.5,
    reputation: 0.72,
    totalJobs: 28,
    isActive: true,
    location: 'Hong Kong',
    specs: { gpu_model: 'V100', gpu_vram_gb: 16, cpu_cores: 8, ram_total_gb: 32 }
  },
  {
    id: '17',
    address: 'QUBIC_PROVIDER_17_CDEF901',
    computePower: 60,
    pricePerHour: 2.0,
    reputation: 0.70,
    totalJobs: 19,
    isActive: true,
    location: 'Dubai, UAE',
    specs: { gpu_model: 'V100', gpu_vram_gb: 32, cpu_cores: 16, ram_total_gb: 64 }
  },
  {
    id: '18',
    address: 'QUBIC_PROVIDER_18_GHIJ234',
    computePower: 50,
    pricePerHour: 1.5,
    reputation: 0.68,
    totalJobs: 12,
    isActive: false,
    location: 'Virginia, US',
    specs: { gpu_model: 'T4', gpu_vram_gb: 16, cpu_cores: 8, ram_total_gb: 32 }
  },
  {
    id: '19',
    address: 'QUBIC_PROVIDER_19_KLMN567',
    computePower: 45,
    pricePerHour: 1.2,
    reputation: 0.65,
    totalJobs: 8,
    isActive: true,
    location: 'Oregon, US',
    specs: { gpu_model: 'T4', gpu_vram_gb: 16, cpu_cores: 4, ram_total_gb: 16 }
  },
  {
    id: '20',
    address: 'QUBIC_PROVIDER_20_OPQR890',
    computePower: 40,
    pricePerHour: 1.0,
    reputation: 0.60,
    totalJobs: 5,
    isActive: true,
    location: 'Ireland',
    specs: { gpu_model: 'Intel Arc A770', gpu_vram_gb: 16, cpu_cores: 8, ram_total_gb: 32 }
  },
  {
    id: '21',
    address: 'QUBIC_PROVIDER_21_STUV123',
    computePower: 35,
    pricePerHour: 0.8,
    reputation: 0.55,
    totalJobs: 3,
    isActive: true,
    location: 'Stockholm, Sweden',
    specs: { gpu_model: 'Radeon RX 6700 XT', gpu_vram_gb: 12, cpu_cores: 6, ram_total_gb: 16 }
  },
  {
    id: '22',
    address: 'QUBIC_PROVIDER_22_WXYZ456',
    computePower: 30,
    pricePerHour: 0.6,
    reputation: 0.50,
    totalJobs: 1,
    isActive: true,
    location: 'Warsaw, Poland',
    specs: { gpu_model: 'Radeon RX 6600', gpu_vram_gb: 8, cpu_cores: 4, ram_total_gb: 16 }
  }
];

// GPU Marketplace Data
const mockGPUs = [
  // RTX 4090 instances
  { id: '1', model: 'RTX 4090', vram: 24, location: 'São Paulo, Brazil', price: 10, rating: 4.9, available: true, provider: 'provider-1' },
  { id: '2', model: 'RTX 4090', vram: 24, location: 'Miami, US', price: 11, rating: 4.8, available: true, provider: 'provider-2' },
  { id: '3', model: 'RTX 4090', vram: 24, location: 'London, UK', price: 12, rating: 4.7, available: false, provider: 'provider-3' },
  { id: '4', model: 'RTX 4090', vram: 24, location: 'Tokyo, Japan', price: 13, rating: 4.9, available: true, provider: 'provider-4' },
  
  // RTX 3090 instances
  { id: '5', model: 'RTX 3090', vram: 24, location: 'New York, US', price: 7, rating: 4.6, available: true, provider: 'provider-5' },
  { id: '6', model: 'RTX 3090', vram: 24, location: 'Frankfurt, Germany', price: 8, rating: 4.7, available: true, provider: 'provider-6' },
  { id: '7', model: 'RTX 3090', vram: 24, location: 'Singapore', price: 9, rating: 4.5, available: false, provider: 'provider-7' },
  
  // A100 instances
  { id: '8', model: 'A100', vram: 80, location: 'Virginia, US', price: 50, rating: 5.0, available: true, provider: 'provider-8' },
  { id: '9', model: 'A100', vram: 80, location: 'Oregon, US', price: 48, rating: 4.9, available: true, provider: 'provider-9' },
  { id: '10', model: 'A100', vram: 80, location: 'Ireland', price: 52, rating: 5.0, available: false, provider: 'provider-10' },
  { id: '11', model: 'A100', vram: 40, location: 'Sydney, Australia', price: 35, rating: 4.8, available: true, provider: 'provider-11' },
  
  // RTX 4080 instances
  { id: '12', model: 'RTX 4080', vram: 16, location: 'Los Angeles, US', price: 8, rating: 4.7, available: true, provider: 'provider-12' },
  { id: '13', model: 'RTX 4080', vram: 16, location: 'Paris, France', price: 9, rating: 4.6, available: true, provider: 'provider-13' },
  { id: '14', model: 'RTX 4080', vram: 16, location: 'Toronto, Canada', price: 8.5, rating: 4.8, available: false, provider: 'provider-14' },
  
  // H100 instances (premium)
  { id: '15', model: 'H100', vram: 80, location: 'Virginia, US', price: 80, rating: 5.0, available: true, provider: 'provider-15' },
  { id: '16', model: 'H100', vram: 80, location: 'Oregon, US', price: 78, rating: 5.0, available: false, provider: 'provider-16' },
  
  // RTX 3080 instances
  { id: '17', model: 'RTX 3080', vram: 10, location: 'Chicago, US', price: 5, rating: 4.4, available: true, provider: 'provider-17' },
  { id: '18', model: 'RTX 3080', vram: 10, location: 'Amsterdam, Netherlands', price: 6, rating: 4.5, available: true, provider: 'provider-18' },
  
  // A10 instances
  { id: '19', model: 'A10', vram: 24, location: 'Seoul, South Korea', price: 15, rating: 4.7, available: true, provider: 'provider-19' },
  { id: '20', model: 'A10', vram: 24, location: 'Mumbai, India', price: 12, rating: 4.6, available: true, provider: 'provider-20' },
  
  // V100 instances
  { id: '21', model: 'V100', vram: 32, location: 'Hong Kong', price: 25, rating: 4.8, available: true, provider: 'provider-21' },
  { id: '22', model: 'V100', vram: 16, location: 'Dubai, UAE', price: 20, rating: 4.7, available: false, provider: 'provider-22' },
];

const mockModels = [
  // GPT Models (5 models)
  {
    id: '1',
    name: 'Fine-tuned GPT-2 for Code',
    description: 'GPT-2 model fine-tuned on programming code',
    modelType: 'gpt2',
    price: 25,
    downloads: 245,
    owner: 'demo_user_1',
    category: 'code',
    size: '117M parameters'
  },
  {
    id: '2',
    name: 'GPT-2 Creative Writing',
    description: 'GPT-2 specialized in creative writing and storytelling',
    modelType: 'gpt2',
    price: 22,
    downloads: 189,
    owner: 'demo_user_2',
    category: 'creative',
    size: '117M parameters'
  },
  {
    id: '3',
    name: 'GPT-2 Legal Document Assistant',
    description: 'Fine-tuned for legal document analysis and generation',
    modelType: 'gpt2',
    price: 35,
    downloads: 156,
    owner: 'demo_user_3',
    category: 'legal',
    size: '117M parameters'
  },
  {
    id: '4',
    name: 'GPT-2 Medical Text Analyzer',
    description: 'Specialized in medical text understanding and summarization',
    modelType: 'gpt2',
    price: 40,
    downloads: 98,
    owner: 'demo_user_4',
    category: 'medical',
    size: '117M parameters'
  },
  {
    id: '5',
    name: 'GPT-2 Financial Analyst',
    description: 'Fine-tuned for financial text analysis and market insights',
    modelType: 'gpt2',
    price: 38,
    downloads: 134,
    owner: 'demo_user_5',
    category: 'finance',
    size: '117M parameters'
  },

  // BERT Models (4 models)
  {
    id: '6',
    name: 'BERT Sentiment Analyzer',
    description: 'BERT model for sentiment analysis',
    modelType: 'bert',
    price: 30,
    downloads: 189,
    owner: 'demo_user_6',
    category: 'nlp',
    size: '110M parameters'
  },
  {
    id: '7',
    name: 'BERT Named Entity Recognition',
    description: 'Advanced NER model for extracting entities from text',
    modelType: 'bert',
    price: 28,
    downloads: 267,
    owner: 'demo_user_7',
    category: 'nlp',
    size: '110M parameters'
  },
  {
    id: '8',
    name: 'BERT Question Answering',
    description: 'SOTA question answering model based on BERT',
    modelType: 'bert',
    price: 32,
    downloads: 203,
    owner: 'demo_user_8',
    category: 'nlp',
    size: '110M parameters'
  },
  {
    id: '9',
    name: 'BERT Text Classification',
    description: 'Multi-class text classification with high accuracy',
    modelType: 'bert',
    price: 26,
    downloads: 345,
    owner: 'demo_user_9',
    category: 'classification',
    size: '110M parameters'
  },

  // Stable Diffusion Models (4 models)
  {
    id: '10',
    name: 'Stable Diffusion Art Generator',
    description: 'Custom Stable Diffusion for artistic images',
    modelType: 'stable-diffusion',
    price: 50,
    downloads: 512,
    owner: 'demo_user_10',
    category: 'art',
    size: '860M parameters'
  },
  {
    id: '11',
    name: 'Stable Diffusion Anime Style',
    description: 'Fine-tuned for high-quality anime and manga generation',
    modelType: 'stable-diffusion',
    price: 45,
    downloads: 678,
    owner: 'demo_user_11',
    category: 'anime',
    size: '860M parameters'
  },
  {
    id: '12',
    name: 'Stable Diffusion Realistic Photos',
    description: 'Specialized in photorealistic image generation',
    modelType: 'stable-diffusion',
    price: 55,
    downloads: 423,
    owner: 'demo_user_12',
    category: 'photorealistic',
    size: '860M parameters'
  },
  {
    id: '13',
    name: 'Stable Diffusion Architectural Design',
    description: 'Trained on architectural designs and blueprints',
    modelType: 'stable-diffusion',
    price: 48,
    downloads: 289,
    owner: 'demo_user_13',
    category: 'architecture',
    size: '860M parameters'
  },

  // LLaMA Models (3 models)
  {
    id: '14',
    name: 'LLaMA Code Assistant',
    description: 'LLaMA model fine-tuned for programming assistance',
    modelType: 'llama',
    price: 75,
    downloads: 567,
    owner: 'demo_user_14',
    category: 'code',
    size: '7B parameters'
  },
  {
    id: '15',
    name: 'LLaMA Conversational AI',
    description: 'Advanced conversational AI with personality',
    modelType: 'llama',
    price: 70,
    downloads: 734,
    owner: 'demo_user_15',
    category: 'chat',
    size: '7B parameters'
  },
  {
    id: '16',
    name: 'LLaMA Research Assistant',
    description: 'Specialized in academic research and analysis',
    modelType: 'llama',
    price: 72,
    downloads: 456,
    owner: 'demo_user_16',
    category: 'research',
    size: '7B parameters'
  },

  // Other Models (2 models)
  {
    id: '17',
    name: 'CLIP Image Encoder',
    description: 'OpenAI CLIP model for image-text matching',
    modelType: 'clip',
    price: 20,
    downloads: 892,
    owner: 'demo_user_17',
    category: 'multimodal',
    size: '151M parameters'
  },
  {
    id: '18',
    name: 'DALL-E Mini Alternative',
    description: 'Compact text-to-image generation model',
    modelType: 'dalle-mini',
    price: 35,
    downloads: 634,
    owner: 'demo_user_18',
    category: 'text-to-image',
    size: '420M parameters'
  }
];

// ============================================
// AUTH ROUTES
// ============================================

// Register endpoint
app.post('/api/auth/register', (req, res) => {
  console.log('📝 Register request received:', req.body);
  try {
    const { name, email, password, type, username, role } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists
    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create user
    const newUser = {
      id: Date.now().toString(),
      name: name || username || email.split('@')[0],
      email,
      password, // In production, hash this!
      type: type || role || 'CONSUMER',
      role: role || type || 'CONSUMER',
      qubicIdentity: generateQubicAddress(),
      qubicSeed: generateQubicSeed(),
      createdAt: new Date().toISOString()
    };

    mockUsers.push(newUser);

    // Generate token
    const token = Buffer.from(JSON.stringify({
      userId: newUser.id,
      email: newUser.email,
      qubicAddress: newUser.qubicIdentity
    })).toString('base64');

    console.log('✅ User registered:', newUser.email);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        type: newUser.type,
        role: newUser.role,
        qubicIdentity: newUser.qubicIdentity,
        qubicAddress: newUser.qubicIdentity
      },
      wallet: {
        identity: newUser.qubicIdentity,
        seed: newUser.qubicSeed
      },
      warning: '⚠️ IMPORTANT: Save your seed phrase!'
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  console.log('🔐 Login request received:', req.body);
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user (simple password check - in production use proper auth)
    const user = mockUsers.find(u => u.email === email && u.password === password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = Buffer.from(JSON.stringify({
      userId: user.id,
      email: user.email,
      qubicAddress: user.qubicIdentity
    })).toString('base64');

    console.log('✅ User logged in:', user.email);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        type: user.type,
        role: user.role,
        qubicIdentity: user.qubicIdentity,
        qubicAddress: user.qubicIdentity
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
app.get('/api/auth/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());

    const user = mockUsers.find(u => u.id === decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      type: user.type,
      role: user.role,
      qubicIdentity: user.qubicIdentity
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Helper functions for auth
function generateQubicAddress() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return Array.from({ length: 60 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

function generateQubicSeed() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  return Array.from({ length: 55 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/stats', (req, res) => {
  res.json(mockStats);
});

app.get('/api/jobs/user/:userId', (req, res) => {
  res.json(mockJobs);
});

app.post('/api/jobs/submit', (req, res) => {
  const newJob = {
    id: Date.now().toString(),
    userId: req.headers['x-user-id'] || req.body.userId || 'anonymous',
    modelType: req.body.modelType || 'llm-inference',
    status: 'PENDING',
    progress: 0,
    estimatedCost: req.body.estimatedCost || 10,
    computeNeeded: req.body.computeNeeded || 2,
    inputData: req.body.inputData || {},
    maxPrice: req.body.maxPrice || 5,
    providerId: req.body.providerId || null,
    createdAt: new Date().toISOString()
  };

  mockJobs.push(newJob);
  console.log(`📥 New job submitted: ${newJob.id} (${newJob.modelType})`);

  // Return the format that frontend expects
  res.json({
    success: true,
    job: newJob,
    jobId: newJob.id,
    message: 'Job submitted successfully'
  });
});

app.get('/api/providers', (req, res) => {
  res.json(mockProviders);
});

app.post('/api/providers/register', (req, res) => {
  const { worker_id } = req.body;
  
  // Check if provider already exists (by worker_id)
  const existingIndex = mockProviders.findIndex(p => p.worker_id === worker_id);
  
  if (existingIndex >= 0) {
    // Update existing provider
    mockProviders[existingIndex] = {
      ...mockProviders[existingIndex],
      ...req.body,
      isActive: true,
      lastSeen: new Date().toISOString()
    };
    console.log(`🔄 Provider ${worker_id} reconnected`);
    res.json({ success: true, provider: mockProviders[existingIndex] });
  } else {
    // Create new provider
    const newProvider = {
      id: Date.now().toString(),
      ...req.body,
      reputation: 0,
      totalJobs: 0,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    mockProviders.push(newProvider);
    console.log(`✅ New provider registered: ${worker_id}`);
    res.json({ success: true, provider: newProvider });
  }
});

// Quick register provider (for auto-detection)
app.post('/api/providers/quick-register', (req, res) => {
  console.log('🚀 Quick register request:', req.body);
  
  const { type, workerId, qubicAddress, gpu, cpu, ram, location, pricePerHour } = req.body;
  
  // Validate required fields
  if (!workerId || !qubicAddress) {
    return res.status(400).json({ 
      success: false, 
      error: 'workerId and qubicAddress are required' 
    });
  }
  
  // Check if provider already exists
  const existingIndex = mockProviders.findIndex(p => p.worker_id === workerId);
  
  const gpuModel = gpu?.model || gpu?.renderer || 'Browser GPU';
  const gpuVram = gpu?.vram || 0;
  const cpuCores = cpu?.cores || 4;
  const ramTotal = ram?.total || 8;
  const defaultPrice = pricePerHour || (gpuVram >= 8 ? 1.0 : 0.5);
  
  if (existingIndex >= 0) {
    // Update existing provider
    mockProviders[existingIndex] = {
      ...mockProviders[existingIndex],
      isActive: true,
      lastSeen: new Date().toISOString(),
      specs: {
        gpu_model: gpuModel,
        gpu_vram_gb: gpuVram,
        cpu_cores: cpuCores,
        ram_total_gb: ramTotal,
        gpu_available: true
      }
    };
    
    console.log(`🔄 Provider ${workerId} updated via quick-register`);
    
    return res.json({ 
      success: true, 
      provider: mockProviders[existingIndex],
      isNew: false
    });
  }
  
  // Create new provider
  const newProvider = {
    id: Date.now().toString(),
    worker_id: workerId,
    qubicAddress,
    type: type || 'browser',
    name: gpuModel,
    specs: {
      gpu_model: gpuModel,
      gpu_vram_gb: gpuVram,
      cpu_cores: cpuCores,
      ram_total_gb: ramTotal,
      gpu_available: true
    },
    location: location || 'Local',
    pricePerHour: defaultPrice,
    reputation: 5.0,
    totalJobs: 0,
    totalEarnings: 0,
    isActive: true,
    createdAt: new Date().toISOString()
  };
  
  mockProviders.push(newProvider);
  
  console.log(`✅ New provider registered via quick-register: ${workerId}`);
  console.log(`   GPU: ${gpuModel}`);
  console.log(`   CPU: ${cpuCores} cores`);
  console.log(`   RAM: ${ramTotal}GB`);
  
  res.json({ 
    success: true, 
    provider: newProvider,
    isNew: true
  });
});

// Delete provider
app.delete('/api/providers/:id', (req, res) => {
  const { id } = req.params;
  const index = mockProviders.findIndex(p => p.id === id);
  
  if (index >= 0) {
    mockProviders.splice(index, 1);
    console.log(`🗑️ Provider ${id} removed`);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Provider not found' });
  }
});

// Toggle provider online/offline
app.post('/api/providers/:id/toggle', (req, res) => {
  const { id } = req.params;
  const { online } = req.body;
  const provider = mockProviders.find(p => p.id === id);
  
  if (provider) {
    provider.isActive = online;
    console.log(`🔄 Provider ${id} is now ${online ? 'online' : 'offline'}`);
    res.json({ success: true, online });
  } else {
    res.status(404).json({ error: 'Provider not found' });
  }
});

// GPU Marketplace endpoint
app.get('/api/gpus', (req, res) => {
  const { priceRange, model, location, status } = req.query;
  
  // Combine static GPUs with dynamically registered providers
  const dynamicGPUs = mockProviders
    .filter(p => p.specs && p.specs.gpu_available)
    .map(p => ({
      id: `dynamic-${p.id}`,
      model: p.specs.gpu_model || 'Unknown GPU',
      vram: p.specs.gpu_vram_gb || 0,
      location: `${p.specs.hostname || 'Local'}, Provider Network`,
      price: p.pricePerHour || 5,
      rating: 5.0, // New providers start with 5.0
      available: p.isActive,
      provider: p.worker_id || p.id,
      isLocal: true, // Flag to identify local providers
      specs: p.specs
    }));
  
  let filtered = [...mockGPUs, ...dynamicGPUs];
  
  // Filter by price range
  if (priceRange && priceRange !== 'any') {
    const [min, max] = priceRange.split('-').map(Number);
    if (max) {
      filtered = filtered.filter(gpu => gpu.price >= min && gpu.price <= max);
    } else {
      filtered = filtered.filter(gpu => gpu.price >= min);
    }
  }
  
  // Filter by model
  if (model && model !== 'all') {
    filtered = filtered.filter(gpu => gpu.model === model);
  }
  
  // Filter by location
  if (location && location !== 'any') {
    filtered = filtered.filter(gpu => gpu.location.includes(location));
  }
  
  // Filter by status
  if (status === 'available') {
    filtered = filtered.filter(gpu => gpu.available);
  }
  
  res.json(filtered);
});

app.get('/api/models', (req, res) => {
  res.json(mockModels);
});

app.post('/api/models/:id/download', (req, res) => {
  const model = mockModels.find(m => m.id === req.params.id);
  if (model) {
    model.downloads++;
    res.json({ success: true, downloadUrl: `ipfs://Qm${model.id}` });
  } else {
    res.status(404).json({ error: 'Model not found' });
  }
});

// ============================================
// PAYMENT & RENTAL ROUTES
// ============================================

// Active rentals storage
const activeRentals = [];

// Process payment for GPU rental
app.post('/api/payments/process', (req, res) => {
  console.log('💳 Processing payment:', req.body);
  
  const { userIdentity, providerIdentity, amount, gpuId, duration, durationHours } = req.body;
  
  // Simulate payment processing
  const txHash = `QBX${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  console.log(`✅ Payment processed: ${amount} QUBIC`);
  console.log(`   TX Hash: ${txHash}`);
  
  res.json({
    success: true,
    txHash,
    amount,
    from: userIdentity,
    to: providerIdentity,
    message: `Payment of ${amount} QUBIC processed successfully`
  });
});

// Create rental
app.post('/api/rentals', (req, res) => {
  console.log('🖥️ Creating rental:', req.body);
  
  const { gpuId, gpuModel, duration, durationHours, totalCost, environment, txHash, providerId } = req.body;
  
  const now = new Date();
  const endTime = new Date(now.getTime() + durationHours * 3600000);
  const instanceId = `gpu-${Math.random().toString(36).substr(2, 9)}`;
  
  // Access URL is no longer external - we use internal job submission
  // Keep for display purposes only
  const accessUrl = `/app/jobs/submit?providerId=${providerId || gpuId}&instanceId=${instanceId}`;
  
  const rental = {
    instanceId,
    gpuId,
    providerId: providerId || gpuId,
    gpuModel,
    duration,
    durationHours,
    totalCost,
    startTime: now.toISOString(),
    endTime: endTime.toISOString(),
    status: 'active',
    environment,
    accessUrl,
    txHash
  };
  
  activeRentals.push(rental);
  
  console.log(`✅ Rental created: ${instanceId}`);
  console.log(`   GPU: ${gpuModel}`);
  console.log(`   Duration: ${duration}`);
  console.log(`   Provider: ${rental.providerId}`);
  
  res.json(rental);
});

// Get active rentals
app.get('/api/rentals/active', (req, res) => {
  const now = new Date();
  const active = activeRentals.filter(r => new Date(r.endTime) > now);
  res.json(active);
});

// ============================================
// WORKER/PROVIDER ROUTES
// ============================================

// Online workers storage
const onlineWorkers = new Map();

// Metrics history storage (for graphs)
const metricsHistory = new Map(); // workerId -> array of metrics
const MAX_HISTORY_POINTS = 60; // Keep last 60 data points (5 min at 5s intervals)

// Função para gerar métricas simuladas realistas
function generateSimulatedMetrics(gpuModel = '') {
  const time = Date.now();
  const wave1 = Math.sin(time / 5000) * 0.5 + 0.5;
  const wave2 = Math.sin(time / 2000) * 0.3 + 0.5;
  const noise = Math.random() * 0.1;
  
  const gpuUsage = Math.min(95, Math.max(5, 25 + wave1 * 40 + wave2 * 15 + noise * 10));
  const cpuUsage = Math.min(90, Math.max(8, 15 + wave2 * 30 + wave1 * 20 + noise * 15));
  const ramUsage = Math.min(85, Math.max(30, 40 + wave1 * 15 + noise * 5));
  const temperature = Math.min(85, Math.max(35, 45 + (gpuUsage / 100) * 30 + noise * 5));
  
  // VRAM baseado no modelo
  const model = gpuModel.toLowerCase();
  let vramTotal = 4096;
  if (model.includes('4090') || model.includes('a100')) vramTotal = 24576;
  else if (model.includes('4080') || model.includes('3090')) vramTotal = 16384;
  else if (model.includes('3080') || model.includes('4070')) vramTotal = 12288;
  else if (model.includes('3070') || model.includes('4060')) vramTotal = 8192;
  else if (model.includes('mx') || model.includes('intel')) vramTotal = 2048;
  
  const vramUsed = Math.round(vramTotal * (0.3 + wave1 * 0.3 + noise * 0.1));
  
  return {
    cpu_percent: Math.round(cpuUsage * 10) / 10,
    ram_percent: Math.round(ramUsage * 10) / 10,
    gpu_percent: Math.round(gpuUsage * 10) / 10,
    gpu_temp: Math.round(temperature),
    gpu_mem_used_mb: vramUsed,
    gpu_mem_total_mb: vramTotal,
    timestamp: new Date().toISOString()
  };
}

// Get pending jobs for a worker
app.get('/api/jobs/pending/:workerId', (req, res) => {
  console.log(`📋 Worker ${req.params.workerId} checking for pending jobs...`);
  const pendingJobs = mockJobs.filter(j => j.status === 'PENDING' && !j.provider);
  console.log(`   Found ${pendingJobs.length} pending jobs`);
  res.json(pendingJobs);
});

// Report job progress
app.post('/api/jobs/:jobId/progress', (req, res) => {
  const { jobId } = req.params;
  const { progress, worker_id } = req.body;
  
  const job = mockJobs.find(j => j.id === jobId);
  if (job) {
    job.progress = progress;
    job.status = 'RUNNING';
    job.provider = { id: worker_id, address: `QUBIC_${worker_id.toUpperCase()}` };
    console.log(`📊 Job ${jobId} progress: ${progress}%`);
  }
  
  res.json({ success: true });
});

// Report job completion
app.post('/api/jobs/:jobId/complete', (req, res) => {
  const { jobId } = req.params;
  const { status, result_url, metrics, error } = req.body;
  
  const job = mockJobs.find(j => j.id === jobId);
  if (job) {
    job.status = status === 'completed' ? 'COMPLETED' : 'FAILED';
    job.result_url = result_url;
    job.metrics = metrics;
    job.error = error;
    job.completedAt = new Date().toISOString();
    console.log(`✅ Job ${jobId} ${status}`);
  }
  
  res.json({ success: true });
});

// Worker heartbeat
app.post('/api/providers/:workerId/heartbeat', (req, res) => {
  const { workerId } = req.params;
  const { usage, status, current_job } = req.body;
  
  const timestamp = new Date().toISOString();
  
  onlineWorkers.set(workerId, {
    lastSeen: new Date(),
    usage,
    status,
    current_job
  });
  
  // Store metrics history for graphs
  if (usage) {
    if (!metricsHistory.has(workerId)) {
      metricsHistory.set(workerId, []);
    }
    const history = metricsHistory.get(workerId);
    history.push({
      timestamp,
      cpu_percent: usage.cpu_percent || 0,
      ram_percent: usage.ram_percent || 0,
      ram_used_gb: usage.ram_used_gb || 0,
      ram_total_gb: usage.ram_total_gb || 0,
      gpu_percent: usage.gpu_percent || 0,
      gpu_temp: usage.gpu_temp || 0,
      gpu_mem_used_mb: usage.gpu_mem_used_mb || 0,
      gpu_mem_total_mb: usage.gpu_mem_total_mb || 0
    });
    // Keep only last N points
    if (history.length > MAX_HISTORY_POINTS) {
      history.shift();
    }
  }
  
  // Also update provider's real-time metrics
  const provider = mockProviders.find(p => p.worker_id === workerId);
  if (provider) {
    provider.realTimeMetrics = {
      cpu_percent: usage?.cpu_percent || 0,
      ram_percent: usage?.ram_percent || 0,
      gpu_percent: usage?.gpu_percent || 0,
      gpu_temp: usage?.gpu_temp || 0,
      gpu_mem_used_mb: usage?.gpu_mem_used_mb || 0,
      gpu_mem_total_mb: usage?.gpu_mem_total_mb || 0,
      timestamp
    };
    provider.status = status;
    provider.currentJob = current_job;
  }
  
  res.json({ success: true });
});

// Get real-time metrics for a specific provider
app.get('/api/providers/:workerId/metrics', (req, res) => {
  const { workerId } = req.params;
  const workerData = onlineWorkers.get(workerId);
  const provider = mockProviders.find(p => p.worker_id === workerId);
  
  if (!workerData && !provider) {
    return res.status(404).json({ error: 'Provider not found' });
  }
  
  const isOnline = workerData ? (new Date() - workerData.lastSeen) < 60000 : provider?.isActive;
  const gpuModel = provider?.specs?.gpu_model || provider?.name || 'Unknown GPU';
  
  // Gerar métricas simuladas se não houver métricas reais
  let metrics = provider?.realTimeMetrics || workerData?.usage;
  if (!metrics && isOnline) {
    metrics = generateSimulatedMetrics(gpuModel);
  }
  
  res.json({
    workerId,
    online: isOnline,
    lastSeen: workerData?.lastSeen || null,
    metrics: metrics,
    currentJob: provider?.currentJob || workerData?.current_job || null,
    specs: provider?.specs || null
  });
});

// Get metrics history for graphs
app.get('/api/providers/:workerId/metrics/history', (req, res) => {
  const { workerId } = req.params;
  const { limit } = req.query;
  const limitNum = parseInt(limit) || MAX_HISTORY_POINTS;
  
  let history = metricsHistory.get(workerId) || [];
  
  // Se não há histórico, gerar histórico simulado
  if (history.length === 0) {
    const provider = mockProviders.find(p => p.worker_id === workerId);
    const gpuModel = provider?.specs?.gpu_model || provider?.name || 'Unknown GPU';
    
    // Gerar últimos 30 pontos de dados simulados
    const now = Date.now();
    for (let i = 29; i >= 0; i--) {
      const timestamp = new Date(now - i * 5000); // 5 segundos entre cada ponto
      const baseTime = timestamp.getTime();
      const wave1 = Math.sin(baseTime / 5000) * 0.5 + 0.5;
      const wave2 = Math.sin(baseTime / 2000) * 0.3 + 0.5;
      const noise = Math.random() * 0.1;
      
      history.push({
        timestamp: timestamp.toISOString(),
        cpu_percent: Math.round((15 + wave2 * 30 + wave1 * 20 + noise * 15) * 10) / 10,
        ram_percent: Math.round((40 + wave1 * 15 + noise * 5) * 10) / 10,
        gpu_percent: Math.round((25 + wave1 * 40 + wave2 * 15 + noise * 10) * 10) / 10,
        gpu_temp: Math.round(45 + wave1 * 20 + noise * 5)
      });
    }
    
    // Salvar para próximas requisições
    metricsHistory.set(workerId, history);
  }
  
  res.json({
    workerId,
    history: history.slice(-limitNum),
    count: history.length
  });
});

// Get provider earnings
app.get('/api/providers/my/earnings', (req, res) => {
  const totalEarnings = mockProviders.reduce((sum, p) => sum + (p.totalEarnings || 0), 0);
  
  // Generate mock history for last 30 days
  const history = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    history.push({
      date: date.toISOString().split('T')[0],
      amount: Math.random() * 10
    });
  }
  
  res.json({
    total: totalEarnings,
    today: Math.random() * 5,
    thisWeek: Math.random() * 30,
    thisMonth: Math.random() * 100,
    pending: Math.random() * 20,
    history
  });
});

// Get provider jobs history
app.get('/api/providers/my/jobs', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  
  // Return mock jobs
  const jobs = mockJobs.slice(0, limit).map(job => ({
    ...job,
    provider: {
      workerId: 'worker-demo',
      gpuModel: 'NVIDIA GeForce MX150'
    },
    consumer: {
      qubicAddress: 'DEMO_CONSUMER_ADDRESS',
      username: 'demo_user'
    }
  }));
  
  res.json(jobs);
});

// Get user's own providers (for dashboard)
app.get('/api/providers/my', (req, res) => {
  // Return all providers (both registered via worker and quick-register)
  const myProviders = mockProviders
    .filter(p => p.worker_id || p.specs) // Include providers with worker_id OR specs (from quick-register)
    .map(p => {
      const workerData = p.worker_id ? onlineWorkers.get(p.worker_id) : null;
      const isOnline = workerData ? (new Date() - workerData.lastSeen) < 60000 : p.isActive;
      const gpuModel = p.specs?.gpu_model || p.name || 'Unknown GPU';
      
      // Gerar métricas simuladas se não houver métricas reais e o provider estiver online
      let metrics = p.realTimeMetrics;
      if (!metrics && isOnline) {
        metrics = generateSimulatedMetrics(gpuModel);
        // Salvar para consistência
        p.realTimeMetrics = metrics;
      }
      
      return {
        id: p.id,
        workerId: p.worker_id || p.id,
        name: gpuModel,
        online: isOnline,
        status: isOnline ? (p.currentJob ? 'rented' : 'available') : 'offline',
        specs: p.specs || {
          gpu_model: gpuModel,
          gpu_vram_gb: 0,
          cpu_cores: 4,
          ram_total_gb: 8
        },
        metrics: metrics,
        pricePerHour: p.pricePerHour || 1.0,
        totalEarnings: p.totalEarnings || 0,
        totalJobs: p.totalJobs || 0,
        createdAt: p.createdAt || new Date().toISOString()
      };
    });
  
  res.json(myProviders);
});

// Get all online providers with real-time metrics
app.get('/api/providers/realtime', (req, res) => {
  const now = new Date();
  const realtime = mockProviders
    .filter(p => p.worker_id && p.isActive)
    .map(p => {
      const workerData = onlineWorkers.get(p.worker_id);
      const isOnline = workerData && (now - workerData.lastSeen) < 60000;
      return {
        id: p.id,
        workerId: p.worker_id,
        name: p.name,
        online: isOnline,
        specs: p.specs,
        metrics: p.realTimeMetrics || null,
        currentJob: p.currentJob || null,
        pricePerHour: p.pricePerHour
      };
    });
  
  res.json(realtime);
});

// Get online workers
app.get('/api/workers/online', (req, res) => {
  const now = new Date();
  const online = [];
  
  onlineWorkers.forEach((data, workerId) => {
    // Consider online if heartbeat within last 60 seconds
    if ((now - data.lastSeen) < 60000) {
      online.push({
        workerId,
        ...data
      });
    }
  });
  
  res.json(online);
});

// Cancel rental
app.post('/api/rentals/:instanceId/cancel', (req, res) => {
  const { instanceId } = req.params;
  const rental = activeRentals.find(r => r.instanceId === instanceId);
  
  if (!rental) {
    return res.status(404).json({ success: false, error: 'Rental not found' });
  }
  
  rental.status = 'cancelled';
  
  // Calculate refund (50% of remaining time)
  const now = new Date();
  const endTime = new Date(rental.endTime);
  const remainingHours = Math.max(0, (endTime.getTime() - now.getTime()) / 3600000);
  const refundAmount = (remainingHours / rental.durationHours) * rental.totalCost * 0.5;
  
  console.log(`❌ Rental cancelled: ${instanceId}`);
  console.log(`   Refund: ${refundAmount.toFixed(2)} QUBIC`);
  
  res.json({ success: true, refundAmount });
});

// ============================================
// WALLET ROUTES
// ============================================

// Balance cache
const balanceCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

app.get('/api/wallet/balance/:identity', async (req, res) => {
  const { identity } = req.params;

  // Check cache
  const cached = balanceCache.get(identity);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    console.log(`✅ Balance cache hit for ${identity.slice(0, 10)}...`);
    return res.json({ balance: cached.balance });
  }

  console.log(`🔄 Fetching balance for ${identity.slice(0, 10)}...`);

  let balance = 0;

  // For demo purposes, always give a substantial balance
  // This ensures the wallet shows meaningful data for demonstration
  balance = 1000000; // 1M QUBIC demo balance for all wallets

  console.log(`🎁 Demo balance granted: ${balance} QUBIC for wallet`);

  // Save to cache
  balanceCache.set(identity, {
    balance,
    timestamp: now
  });

  res.json({ balance });
});

// Keep the old qubic balance endpoint for compatibility but redirect to wallet
app.get('/api/qubic/balance/:identity', async (req, res) => {
  const { identity } = req.params;

  console.log(`🔄 Qubic balance request for ${identity.slice(0, 10)}..., redirecting to wallet`);

  // Always return demo balance for Qubic wallet integration
  const balance = 1000000; // 1M QUBIC

  res.json({
    success: true,
    balance,
    message: 'Demo balance for Qubic integration'
  });
});

// ============================================
// AUTH ROUTES
// ============================================

// Helper functions for auth
function generateQubicAddress() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return Array.from({ length: 60 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

function generateQubicSeed() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  return Array.from({ length: 55 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

// Unified register endpoint (accepts both legacy and new formats)
app.post('/api/auth/register', (req, res) => {
  console.log('📝 Register request received:', req.body);
  try {
    // Accept BOTH formats (legacy and new)
    const {
      name,
      email,
      password,
      type,
      username,
      role
    } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    // Password validation (minimum 8 characters)
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return res.status(400).json({
        error: 'Password must contain uppercase, lowercase, and number'
      });
    }

    // Check if user already exists
    if (mockUsers.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Generate Qubic wallet
    const wallet = generateQubicWallet();

    // Create user (compatible with both formats)
    const user = {
      id: Date.now().toString(),
      name: name || username || email.split('@')[0], // Fallback for username
      email,
      username: username || name || email.split('@')[0],
      password, // ⚠️ In production: use bcrypt for hashing!
      type: type || role || 'CONSUMER', // Compatibility
      role: role || type || 'CONSUMER',
      qubicIdentity: wallet.identity,
      qubicSeed: wallet.seed,
      createdAt: new Date().toISOString()
    };

    mockUsers.push(user);

    // Generate token (mock JWT)
    const token = Buffer.from(JSON.stringify({
      userId: user.id,
      email: user.email,
      qubicAddress: user.qubicIdentity
    })).toString('base64');

    console.log('✅ User created successfully:', user.email);

    // Response compatible with frontend
    res.status(201).json({
      success: true,
      message: 'User created and wallet generated successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        type: user.type,
        role: user.role,
        qubicIdentity: user.qubicIdentity,
        qubicAddress: user.qubicIdentity
      },
      wallet: {
        identity: wallet.identity,
        seed: wallet.seed
      },
      warning: '⚠️ IMPORTANT: Save your seed phrase! This is the only time it will be shown.'
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      error: 'Registration failed',
      details: error.message
    });
  }
});

// Also support register-email endpoint for compatibility
app.post('/api/auth/register-email', (req, res) => {
  // Just redirect to the unified register endpoint
  console.log('📝 Register-email redirect:', req.body);
  req.url = '/api/auth/register';
  app._router.handle(req, res);
});

// Login
app.post('/api/auth/login', (req, res) => {
  console.log('🔐 Login request received:', req.body);
  try {
    const { email, password } = req.body;
    
    // Validate
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user
    const user = mockUsers.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate token (mock)
    const token = Buffer.from(JSON.stringify({ userId: user.id, email: user.email })).toString('base64');
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        type: user.type,
        qubicIdentity: user.qubicIdentity,
        qubicAddress: user.qubicIdentity // Also include as qubicAddress for compatibility
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
app.get('/api/auth/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    
    const user = mockUsers.find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      type: user.type,
      qubicIdentity: user.qubicIdentity
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

const { spawn } = require('child_process');
const path = require('path');

// Hardware detection endpoint
app.get('/api/hardware/detect', async (req, res) => {
  console.log('🔍 Hardware detection requested...');

  try {
    // Execute Python GPU detector
    const pythonPath = process.platform === 'win32' ? 'python' : 'python3';
    const scriptPath = path.join(__dirname, 'gpu-detector.py');

    console.log(`   Executing: ${pythonPath} ${scriptPath}`);

    const pythonProcess = spawn(pythonPath, [scriptPath, '--json-only'], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          // Try to parse JSON output from Python script
          const lines = stdout.trim().split('\n');
          let jsonData = null;

          // Look for JSON output (the script should output JSON when --json-only is used)
          for (const line of lines.reverse()) {
            if (line.trim().startsWith('{') && line.trim().endsWith('}')) {
              try {
                jsonData = JSON.parse(line.trim());
                break;
              } catch (e) {
                continue;
              }
            }
          }

          if (jsonData) {
            console.log('✅ Hardware detected successfully');
            console.log(`   GPU: ${jsonData.gpu?.model || 'Unknown'}`);
            console.log(`   VRAM: ${jsonData.gpu?.vram_gb || 0}GB`);
            console.log(`   CPU: ${jsonData.cpu?.cores || 0} cores`);
            console.log(`   RAM: ${jsonData.ram?.total || 0}GB`);

            res.json({
              success: true,
              detected: jsonData.gpu?.detected || false,
              hardware: jsonData
            });
          } else {
            // Fallback: parse output manually
            console.log('⚠️ No JSON found, parsing output manually...');

            const gpuMatch = stdout.match(/GPU: (.+)/);
            const vramMatch = stdout.match(/VRAM: (.+)/);
            const cpuMatch = stdout.match(/CPU: (.+)/);
            const ramMatch = stdout.match(/RAM: (.+)/);

            const hardware = {
              gpu: {
                model: gpuMatch ? gpuMatch[1].trim() : 'Unknown GPU',
                vram_gb: vramMatch ? parseFloat(vramMatch[1].replace('GB', '').trim()) || 0 : 0,
                detected: !stdout.includes('No GPU detected')
              },
              cpu: {
                cores: cpuMatch ? parseInt(cpuMatch[1].match(/(\d+)/)?.[1] || '4') : 4,
                model: cpuMatch ? cpuMatch[1].trim() : 'Unknown CPU'
              },
              ram: {
                total: ramMatch ? parseFloat(ramMatch[1].replace('GB', '').trim()) || 8 : 8
              },
              os: 'detected'
            };

            console.log('✅ Hardware parsed manually');
            res.json({
              success: true,
              detected: hardware.gpu.detected,
              hardware
            });
          }
        } catch (parseError) {
          console.error('❌ Error parsing Python output:', parseError);
          res.status(500).json({
            success: false,
            error: 'Failed to parse detection results',
            details: stdout.substring(0, 500)
          });
        }
      } else {
        console.error(`❌ Python script exited with code ${code}`);
        console.error('STDERR:', stderr);
        res.status(500).json({
          success: false,
          error: `Detection failed (exit code ${code})`,
          details: stderr.substring(0, 500)
        });
      }
    });

    pythonProcess.on('error', (err) => {
      console.error('❌ Failed to start Python process:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to start hardware detection',
        details: err.message
      });
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      pythonProcess.kill();
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Hardware detection timed out'
        });
      }
    }, 30000);

  } catch (error) {
    console.error('❌ Hardware detection error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during detection',
      details: error.message
    });
  }
});

// Auto-start GPU detector on server startup
function startGPUDetector() {
  console.log('\n🚀 Starting GPU Detector...\n');

  const pythonPath = process.platform === 'win32' ? 'python' : 'python3';
  const scriptPath = path.join(__dirname, 'gpu-detector.py');

  const detector = spawn(pythonPath, [scriptPath], {
    cwd: __dirname,
    stdio: 'inherit'
  });

  detector.on('error', (err) => {
    console.error('❌ Failed to start GPU detector:', err.message);
    console.log('   Make sure Python and dependencies are installed:');
    console.log('   pip install -r requirements-gpu.txt');
  });

  detector.on('exit', (code) => {
    if (code !== 0) {
      console.log(`\n⚠️  GPU detector exited with code ${code}`);
    }
  });

  return detector;
}

const PORT = 3006;
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   🎯 QUBIX MOCK SERVER                ║
║   Port: ${PORT}                         ║
║   Status: Running ✅                  ║
╚═══════════════════════════════════════╝

📊 Mock Data Available:
   - Jobs: ${mockJobs.length}
   - Providers: ${mockProviders.length}
   - Models: ${mockModels.length}

🌐 Endpoints:
   - GET  /health
   - POST /api/auth/register
   - POST /api/auth/login
   - GET  /api/auth/me
   - GET  /api/stats
   - GET  /api/jobs/user/:userId
   - POST /api/jobs/submit
   - GET  /api/providers
   - POST /api/providers/register
   - GET  /api/models
   - POST /api/models/:id/download
   - GET  /api/gpus

🚀 Ready for demo!
   Frontend: http://localhost:3004
   Backend:  http://localhost:3006
  `);
  
  // Auto-start GPU detector after 2 seconds
  setTimeout(() => {
    startGPUDetector();
  }, 2000);
});
