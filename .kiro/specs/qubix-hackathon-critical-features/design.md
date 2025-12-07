# Design Document

## Overview

The QUBIX Hackathon Critical Features design implements the final 20% of functionality needed to win the "Qubic: Hack the Future" hackathon. The design focuses on creating a production-ready, visually impressive platform with drag-and-drop job submission, intelligent GPU matching, real Qubic blockchain integration with escrow, and real-time monitoring that rivals AWS and RunPod. The system prioritizes user experience with minimal friction while demonstrating technical excellence through property-based testing and robust error handling.

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React + TypeScript)                │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │  JobUploader     │  │  SmartMatcher    │  │  JobWizard    │ │
│  │  (Drag & Drop)   │  │  (GPU Matching)  │  │  (4 Steps)    │ │
│  └────────┬─────────┘  └────────┬─────────┘  └───────┬───────┘ │
│           │                     │                     │          │
│           └─────────────────────┴─────────────────────┘          │
│                                 │                                │
│  ┌──────────────────────────────▼──────────────────────────────┐│
│  │              JobMonitor (Real-time Dashboard)                ││
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   ││
│  │  │  Job Info   │  │ Live Metrics │  │  Logs Stream     │   ││
│  │  │  & Status   │  │ (GPU Charts) │  │  (WebSocket)     │   ││
│  │  └─────────────┘  └──────────────┘  └──────────────────┘   ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │         ProviderEarnings (Real-time Dashboard)               ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  ││
│  │  │  Earnings    │  │  Active Jobs │  │  TX History      │  ││
│  │  │  Summary     │  │  (Live)      │  │  (Blockchain)    │  ││
│  │  └──────────────┘  └──────────────┘  └──────────────────┘  ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │              QubicService (Blockchain Integration)           ││
│  │  • Wallet Connection  • Balance Query  • TX Creation         ││
│  │  • Escrow Lock       • Escrow Release  • TX Verification     ││
│  └──────────────────────────────────────────────────────────────┘│
└───────────────────────────────┬─────────────────────────────────┘
                                │
                    WebSocket + REST API
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                    Backend (Node.js + Express)                   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │                    Job Management System                     ││
│  │  • Job Analysis    • GPU Matching    • Cost Estimation      ││
│  │  • Job Assignment  • Progress Track  • Completion Handler   ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │              Qubic Blockchain Integration Service            ││
│  │  • RPC Client      • Escrow Manager   • TX Broadcaster      ││
│  │  • Balance Cache   • Confirmation Poll • Explorer Links     ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │                  WebSocket Server (ws)                       ││
│  │  • Job Progress    • GPU Metrics      • Earnings Updates    ││
│  │  • TX Status       • Marketplace      • Provider Status     ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │              Prisma ORM + PostgreSQL                         ││
│  │  • Jobs  • Providers  • Transactions  • Metrics  • Users    ││
│  └──────────────────────────────────────────────────────────────┘│
└───────────────────────────────┬─────────────────────────────────┘
                                │
                    Job Assignment + Heartbeat
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                  Provider Workers (Python)                       │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │                    JobExecutor Class                         ││
│  │  • Job Polling     • GPU Execution    • Progress Reporting  ││
│  │  • Metrics Collection • Result Upload • Error Handling      ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │              Supported Job Types                             ││
│  │  • MNIST Training  • Stable Diffusion  • Custom Scripts     ││
│  │  • PyTorch Models  • TensorFlow Models • Jupyter Notebooks  ││
│  └──────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘

External Services:
┌──────────────────────────────────────────────────────────────────┐
│                    Qubic Blockchain Network                      │
│  • RPC: https://rpc.qubic.org/v1/                               │
│  • Explorer: https://explorer.qubic.org                         │
│  • Endpoints: /balances, /transactions, /broadcast-transaction  │
└──────────────────────────────────────────────────────────────────┘
```


### Technology Stack

**Frontend:**
- React 18 with TypeScript (strict mode)
- Vite for build tooling and HMR
- TailwindCSS for styling
- React DnD (react-dropzone) for drag-and-drop
- Recharts for data visualization
- Framer Motion for animations
- React Hot Toast for notifications
- Lucide React for icons
- WebSocket client for real-time updates

**Backend:**
- Node.js 18+ with Express
- TypeScript for type safety
- Prisma ORM for database access
- PostgreSQL 14+ for persistence
- ws library for WebSocket server
- axios for HTTP requests to Qubic RPC
- winston for structured logging

**Worker:**
- Python 3.8+
- PyTorch for ML workloads
- GPUtil for GPU metrics
- psutil for system metrics
- requests for HTTP communication
- nvidia-smi for NVIDIA GPU detection

**Blockchain:**
- Qubic Network (mainnet)
- Qubic RPC API (https://rpc.qubic.org/v1/)
- Qubic Explorer (https://explorer.qubic.org)

**Testing:**
- Jest for unit tests
- React Testing Library for component tests
- fast-check for property-based testing (TypeScript)
- Hypothesis for property-based testing (Python)
- Supertest for API testing

## Components and Interfaces

### Frontend Components

#### JobUploader Component

Drag-and-drop interface for file upload with validation and preview.

**Props:**
```typescript
interface JobUploaderProps {
  onFileAnalyzed: (analysis: JobAnalysis) => void;
  onError: (error: Error) => void;
  maxFileSize?: number; // bytes, default 500MB
  acceptedTypes?: string[]; // default: ['.py', '.ipynb', '.csv', '.json', 'Dockerfile']
}
```

**State:**
```typescript
interface JobUploaderState {
  isDragging: boolean;
  uploadProgress: number; // 0-100
  uploadedFile: File | null;
  validationStatus: 'idle' | 'validating' | 'valid' | 'invalid';
  validationError: string | null;
  analysis: JobAnalysis | null;
}

interface JobAnalysis {
  jobType: 'mnist_training' | 'stable_diffusion' | 'custom_script' | 'inference' | 'rendering';
  detectedFramework: 'pytorch' | 'tensorflow' | 'jax' | 'none';
  estimatedVRAM: number; // GB
  estimatedCompute: number; // TFLOPS
  estimatedRAM: number; // GB
  estimatedStorage: number; // GB
  confidence: 'high' | 'medium' | 'low';
}
```

**Methods:**
- `handleDragEnter()`: Visual feedback on drag enter
- `handleDragLeave()`: Remove feedback on drag leave
- `handleDrop(files)`: Process dropped files
- `validateFile(file)`: Check size and type
- `analyzeFile(file)`: Extract requirements
- `uploadFile(file)`: Upload to backend with progress


#### SmartMatcher Component

Intelligent GPU matching and recommendation engine.

**Props:**
```typescript
interface SmartMatcherProps {
  jobRequirements: JobAnalysis;
  availableGPUs: Provider[];
  onGPUSelected: (gpu: Provider) => void;
}
```

**State:**
```typescript
interface SmartMatcherState {
  compatibleGPUs: CompatibleGPU[];
  sortBy: 'cost_benefit' | 'price_low' | 'performance' | 'availability';
  selectedGPU: Provider | null;
}

interface CompatibleGPU {
  provider: Provider;
  compatibility: 'recommended' | 'compatible' | 'borderline' | 'insufficient';
  estimatedDuration: number; // seconds
  estimatedCost: number; // QUBIC
  costBenefitScore: number; // 0-100
  warnings: string[];
}
```

**Methods:**
- `filterGPUs(requirements, gpus)`: Filter by compatibility
- `calculateCompatibility(gpu, requirements)`: Determine compatibility level
- `estimateDuration(gpu, jobType)`: Use benchmarks
- `calculateCostBenefit(gpu, duration)`: Score GPUs
- `sortGPUs(gpus, sortBy)`: Apply sorting

#### JobWizard Component

4-step wizard for job configuration and launch.

**Props:**
```typescript
interface JobWizardProps {
  onJobLaunched: (job: Job) => void;
  onCancel: () => void;
}
```

**State:**
```typescript
interface JobWizardState {
  currentStep: 1 | 2 | 3 | 4;
  jobAnalysis: JobAnalysis | null;
  selectedGPU: Provider | null;
  advancedConfig: AdvancedConfig;
  estimatedCost: number;
  walletBalance: number;
  launchStatus: 'idle' | 'creating_escrow' | 'confirming_tx' | 'provisioning' | 'launched';
}

interface AdvancedConfig {
  environmentVars: Record<string, string>;
  dockerImage?: string;
  entryPoint?: string;
  outputDestination: 'ipfs' | 's3' | 'local';
  maxDuration: number; // hours
}
```

**Steps:**
1. Upload & Analysis (JobUploader)
2. GPU Selection (SmartMatcher)
3. Advanced Config (optional)
4. Payment & Launch (QubicService)

#### JobMonitor Component

Real-time job monitoring dashboard with 3-column layout.

**Props:**
```typescript
interface JobMonitorProps {
  jobId: string;
}
```

**State:**
```typescript
interface JobMonitorState {
  job: Job;
  liveMetrics: GPUMetrics;
  logs: LogEntry[];
  progress: number; // 0-100
  currentOperation: string;
  timeRemaining: number; // seconds
  costSoFar: number; // QUBIC
}

interface GPUMetrics {
  gpuUtilization: number; // 0-100
  gpuMemoryUsed: number; // MB
  gpuMemoryTotal: number; // MB
  gpuTemperature: number; // Celsius
  powerUsage: number; // Watts
  timestamp: Date;
}

interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
}
```

**Layout:**
- Left: Job info (ID, status, GPU, times, cost)
- Center: Live metrics (charts and gauges)
- Right: Log stream (auto-scroll, filterable)
- Bottom: Progress timeline, actions (pause, stop, extend)


#### ProviderEarnings Component

Real-time earnings dashboard for providers.

**Props:**
```typescript
interface ProviderEarningsProps {
  providerId: string;
}
```

**State:**
```typescript
interface ProviderEarningsState {
  earnings: EarningsData;
  activeJobs: ActiveJob[];
  transactionHistory: Transaction[];
  performanceMetrics: PerformanceMetrics;
}

interface EarningsData {
  totalEarned: number; // all time
  todayEarnings: number; // live update
  weekEarnings: number;
  monthEarnings: number;
  pendingPayouts: number; // in escrow
  averageHourlyRate: number;
  earningsHistory: EarningEntry[]; // last 30 days
}

interface ActiveJob {
  jobId: string;
  clientAddress: string;
  gpuUsed: string;
  durationSoFar: number; // seconds
  earningsSoFar: number; // QUBIC, live
  estimatedTotal: number; // QUBIC
  status: 'running' | 'paused';
}

interface PerformanceMetrics {
  uptimePercent: number;
  jobsCompleted: number;
  averageRating: number;
  responseTime: number; // ms
}
```

**Features:**
- Auto-refresh earnings every 5 seconds
- Line chart of last 30 days
- Bar chart by GPU
- Pie chart by job type
- Transaction polling until confirmation

#### QubicService

Service for all Qubic blockchain interactions.

**Interface:**
```typescript
class QubicService {
  // Wallet Management
  async connectWallet(): Promise<WalletInfo>;
  async getBalance(address: string): Promise<number>;
  
  // Transaction Creation
  async createTransaction(
    from: string,
    to: string,
    amount: number,
    memo?: string
  ): Promise<Transaction>;
  
  // Escrow Operations
  async lockFundsEscrow(
    jobId: string,
    amount: number,
    providerAddress: string,
    duration: number
  ): Promise<EscrowTransaction>;
  
  async releaseFunds(
    escrowId: string,
    providerAddress: string,
    amount: number
  ): Promise<ReleaseTransaction>;
  
  // Verification
  async verifyTransaction(txHash: string): Promise<TransactionStatus>;
  async waitForConfirmation(txHash: string, confirmations: number): Promise<void>;
  
  // History
  async getTransactions(address: string): Promise<Transaction[]>;
}

interface WalletInfo {
  address: string;
  balance: number;
  publicKey: string;
}

interface TransactionStatus {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  blockHeight?: number;
  timestamp?: Date;
}
```

**Qubic RPC Endpoints:**
- `GET /v1/balances/{address}` - Query balance
- `POST /v1/transactions` - Create transaction
- `POST /v1/broadcast-transaction` - Broadcast to network
- `GET /v1/transactions/{hash}` - Get transaction status

### Backend API Endpoints

#### Job Management Endpoints

**POST /api/jobs/analyze**
```typescript
Request: {
  file: File; // multipart/form-data
  fileName: string;
}

Response: {
  success: boolean;
  analysis: JobAnalysis;
}
```

**POST /api/jobs/create**
```typescript
Request: {
  userId: string;
  jobAnalysis: JobAnalysis;
  selectedGPU: string; // providerId
  advancedConfig: AdvancedConfig;
  escrowTxHash: string;
}

Response: {
  success: boolean;
  job: Job;
}
```

**GET /api/jobs/:jobId/monitor**
```typescript
Response: {
  job: Job;
  metrics: GPUMetrics;
  logs: LogEntry[];
  progress: number;
}
```

**POST /api/jobs/:jobId/progress**
```typescript
Request: {
  workerId: string;
  progress: number;
  currentOperation: string;
  metrics: GPUMetrics;
  logLines: string[];
}

Response: {
  success: boolean;
}
```

**POST /api/jobs/:jobId/complete**
```typescript
Request: {
  workerId: string;
  status: 'completed' | 'failed';
  result?: any;
  error?: string;
  finalMetrics: JobMetrics;
}

Response: {
  success: boolean;
  releaseTxHash: string;
}
```


#### GPU Matching Endpoints

**POST /api/gpus/match**
```typescript
Request: {
  jobRequirements: JobAnalysis;
}

Response: {
  compatibleGPUs: CompatibleGPU[];
  recommendations: Provider[]; // top 3
}
```

**GET /api/gpus/benchmarks/:jobType**
```typescript
Response: {
  benchmarks: Record<string, number>; // gpuModel -> seconds
}
```

#### Qubic Integration Endpoints

**POST /api/qubic/wallet/connect**
```typescript
Request: {
  address: string;
  signature: string;
}

Response: {
  success: boolean;
  balance: number;
  user: User;
}
```

**GET /api/qubic/balance/:address**
```typescript
Response: {
  balance: number;
  cached: boolean;
  cacheAge: number; // seconds
}
```

**POST /api/qubic/escrow/lock**
```typescript
Request: {
  jobId: string;
  amount: number;
  providerAddress: string;
  duration: number;
}

Response: {
  success: boolean;
  txHash: string;
  escrowId: string;
  explorerUrl: string;
}
```

**POST /api/qubic/escrow/release**
```typescript
Request: {
  escrowId: string;
  providerAddress: string;
  amount: number;
}

Response: {
  success: boolean;
  txHash: string;
  explorerUrl: string;
}
```

**GET /api/qubic/transactions/:address**
```typescript
Response: {
  transactions: Transaction[];
}
```

#### Provider Earnings Endpoints

**GET /api/providers/:providerId/earnings**
```typescript
Response: {
  earnings: EarningsData;
  activeJobs: ActiveJob[];
  transactionHistory: Transaction[];
  performanceMetrics: PerformanceMetrics;
}
```

**GET /api/providers/:providerId/earnings/live**
```typescript
Response: {
  todayEarnings: number;
  activeJobsEarnings: ActiveJob[];
}
```

### WebSocket Events

**Client → Server:**
- `subscribe:job:{jobId}` - Subscribe to job progress
- `subscribe:provider:{providerId}` - Subscribe to provider earnings
- `subscribe:marketplace` - Subscribe to marketplace updates

**Server → Client:**
- `JOB_PROGRESS` - Job execution progress update
```typescript
{
  type: 'JOB_PROGRESS';
  jobId: string;
  progress: number;
  currentOperation: string;
  metrics: GPUMetrics;
  timeRemaining: number;
  costSoFar: number;
}
```

- `JOB_COMPLETED` - Job finished
```typescript
{
  type: 'JOB_COMPLETED';
  jobId: string;
  status: 'completed' | 'failed';
  result?: any;
  releaseTxHash: string;
}
```

- `EARNINGS_UPDATE` - Provider earnings changed
```typescript
{
  type: 'EARNINGS_UPDATE';
  providerId: string;
  todayEarnings: number;
  activeJobs: ActiveJob[];
}
```

- `TX_CONFIRMED` - Transaction confirmed
```typescript
{
  type: 'TX_CONFIRMED';
  txHash: string;
  confirmations: number;
  status: 'confirmed';
}
```

- `GPU_METRICS` - Real-time GPU metrics
```typescript
{
  type: 'GPU_METRICS';
  jobId: string;
  metrics: GPUMetrics;
}
```

## Data Models

### Extended Prisma Schema

```prisma
model Job {
  id              String    @id @default(uuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  providerId      String?
  provider        Provider? @relation(fields: [providerId], references: [id])
  
  // Job Details
  jobType         String    // mnist_training, stable_diffusion, etc
  framework       String?   // pytorch, tensorflow, jax
  fileName        String
  fileUrl         String
  
  // Requirements
  requiredVRAM    Float     // GB
  requiredCompute Float     // TFLOPS
  requiredRAM     Float     // GB
  
  // Configuration
  advancedConfig  Json?
  
  // Status
  status          JobStatus @default(PENDING)
  progress        Int       @default(0)
  currentOperation String?
  
  // Results
  result          Json?
  error           String?
  
  // Costs
  estimatedCost   Float
  estimatedDuration Int     // seconds
  actualCost      Float?
  actualDuration  Int?      // seconds
  
  // Blockchain
  escrowTxHash    String?
  releaseTxHash   String?
  
  // Timestamps
  createdAt       DateTime  @default(now())
  startedAt       DateTime?
  completedAt     DateTime?
  
  logs            JobLog[]
  metrics         JobMetric[]
}

model JobLog {
  id              String    @id @default(uuid())
  jobId           String
  job             Job       @relation(fields: [jobId], references: [id])
  
  timestamp       DateTime  @default(now())
  level           String    // info, warning, error
  message         String
  
  @@index([jobId, timestamp])
}

model JobMetric {
  id              String    @id @default(uuid())
  jobId           String
  job             Job       @relation(fields: [jobId], references: [id])
  
  timestamp       DateTime  @default(now())
  gpuUtilization  Float?
  gpuMemoryUsed   Float?
  gpuTemperature  Float?
  powerUsage      Float?
  
  @@index([jobId, timestamp])
}

model Transaction {
  id              String    @id @default(uuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  
  type            TransactionType
  amount          Float
  status          TransactionStatus
  
  qubicTxHash     String    @unique
  confirmations   Int       @default(0)
  
  jobId           String?
  providerId      String?
  
  createdAt       DateTime  @default(now())
  confirmedAt     DateTime?
  
  @@index([userId, createdAt])
  @@index([qubicTxHash])
}

enum TransactionType {
  ESCROW_LOCK
  ESCROW_RELEASE
  REFUND
  PAYMENT
  EARNING
}

enum TransactionStatus {
  PENDING
  CONFIRMED
  FAILED
}
```


### TypeScript Interfaces

```typescript
// Job Analysis
interface JobAnalysis {
  jobType: 'mnist_training' | 'stable_diffusion' | 'custom_script' | 'inference' | 'rendering';
  detectedFramework: 'pytorch' | 'tensorflow' | 'jax' | 'none';
  estimatedVRAM: number; // GB
  estimatedCompute: number; // TFLOPS
  estimatedRAM: number; // GB
  estimatedStorage: number; // GB
  confidence: 'high' | 'medium' | 'low';
}

// GPU Compatibility
interface CompatibleGPU {
  provider: Provider;
  compatibility: 'recommended' | 'compatible' | 'borderline' | 'insufficient';
  estimatedDuration: number; // seconds
  estimatedCost: number; // QUBIC
  costBenefitScore: number; // 0-100
  warnings: string[];
}

// Benchmarks
interface Benchmark {
  jobType: string;
  gpuModel: string;
  baseTimeSeconds: number;
  parameters: {
    epochs?: number;
    resolution?: number;
    datasetSize?: number;
  };
}

// Escrow
interface EscrowTransaction {
  escrowId: string;
  jobId: string;
  amount: number;
  providerAddress: string;
  consumerAddress: string;
  txHash: string;
  status: 'locked' | 'released' | 'refunded';
  confirmations: number;
  createdAt: Date;
}

// Real-time Metrics
interface GPUMetrics {
  gpuUtilization: number; // 0-100
  gpuMemoryUsed: number; // MB
  gpuMemoryTotal: number; // MB
  gpuTemperature: number; // Celsius
  powerUsage: number; // Watts
  timestamp: Date;
}

// Earnings
interface EarningsData {
  totalEarned: number;
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  pendingPayouts: number;
  averageHourlyRate: number;
  earningsHistory: EarningEntry[];
}

interface EarningEntry {
  date: string;
  amount: number;
  jobCount: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: File Validation Performance
*For any* uploaded file, validation (type and size check) should complete within 1 second
**Validates: Requirements 1.3**

### Property 2: File Preview Completeness
*For any* valid uploaded file, the preview should contain file name, size, and type
**Validates: Requirements 1.4**

### Property 3: Job Type Detection Accuracy
*For any* uploaded Python script, Jupyter notebook, or Docker config, the system should detect a valid job type or return 'custom_script'
**Validates: Requirements 1.5, 2.1, 2.2, 2.4**

### Property 4: GPU Requirements Extraction
*For any* detected job type, the system should calculate VRAM, compute, and RAM requirements with all values greater than zero
**Validates: Requirements 1.6, 2.5**

### Property 5: Invalid File Rejection
*For any* file that fails validation, the system should display an error message containing supported formats
**Validates: Requirements 1.7**

### Property 6: Batch File Processing
*For any* set of multiple dropped files, all valid files should be accepted and all invalid files should be rejected
**Validates: Requirements 1.8**

### Property 7: GPU Compatibility Filtering
*For any* job requirements and GPU list, the system should classify each GPU as recommended, compatible, borderline, or insufficient based on VRAM and compute capacity
**Validates: Requirements 3.1, 3.2, 3.4**

### Property 8: Cost-Benefit Sorting
*For any* list of compatible GPUs, the default sort order should be by cost-benefit score in descending order
**Validates: Requirements 3.5**

### Property 9: GPU Card Information Completeness
*For any* displayed GPU card, it should show estimated completion time and total cost estimate
**Validates: Requirements 3.6, 3.7**

### Property 10: Wizard Step Validation
*For any* wizard step transition, the system should validate current step data before allowing progression to next step
**Validates: Requirements 4.6**

### Property 11: Wizard Data Persistence
*For any* wizard navigation backward, previously entered data should be preserved and displayed when returning to that step
**Validates: Requirements 4.7**

### Property 12: Qubic Balance Query
*For any* wallet connection, the system should query balance from Qubic RPC endpoint and return a non-negative number
**Validates: Requirements 5.2**

### Property 13: Qubic Transaction Format
*For any* created transaction, it should conform to Qubic transaction format with valid signature
**Validates: Requirements 5.3**

### Property 14: Transaction Hash and Explorer Link
*For any* submitted transaction, the system should return a transaction hash and generate a valid Qubic explorer URL
**Validates: Requirements 5.5**

### Property 15: Balance Caching
*For any* balance query within 30 seconds of previous query for same address, the system should return cached value without RPC call
**Validates: Requirements 5.7**

### Property 16: Escrow Before Execution
*For any* job launch, the escrow lock transaction should complete with 3 confirmations before job status changes to 'running'
**Validates: Requirements 6.1, 6.6**

### Property 17: Escrow Metadata Inclusion
*For any* escrow transaction, the on-chain data should include job ID and provider address
**Validates: Requirements 6.2**

### Property 18: Funds Locked During Execution
*For any* running job, the associated escrow should remain in 'locked' status until job completes or fails
**Validates: Requirements 6.3**

### Property 19: Payment Release on Success
*For any* successfully completed job, a release transaction should be created sending funds to provider's address
**Validates: Requirements 6.4**

### Property 20: Refund on Failure
*For any* failed job, a refund transaction should be created sending funds back to consumer's address
**Validates: Requirements 6.5**

### Property 21: Confirmation Count Display
*For any* escrow or release transaction, the UI should display confirmation count in format "X/3" where X is 0-3
**Validates: Requirements 6.7**

### Property 22: Job Info Completeness
*For any* job monitoring dashboard, it should display job ID, status, GPU assigned, start time, and current cost
**Validates: Requirements 7.2**

### Property 23: Live Metrics Display
*For any* running job, the monitoring dashboard should display GPU utilization, memory, temperature, and power usage
**Validates: Requirements 7.3**

### Property 24: Metrics Update Frequency
*For any* running job, GPU metrics should update via WebSocket every 2 seconds (±0.5s tolerance)
**Validates: Requirements 7.5**

### Property 25: Progress Information
*For any* running job with progress > 0, the dashboard should show both progress percentage and current operation string
**Validates: Requirements 7.6**

### Property 26: Timeline Visualization
*For any* running job, the dashboard should display a progress bar and time remaining estimate
**Validates: Requirements 7.7**

### Property 27: Metrics Threshold Warnings
*For any* GPU metric that exceeds safe thresholds (>85% utilization, >80°C temperature), the display should highlight in yellow or red
**Validates: Requirements 8.5**

### Property 28: Chart Hover Information
*For any* metrics chart, hovering should display exact values with timestamps
**Validates: Requirements 8.6**

### Property 29: Earnings Dashboard Completeness
*For any* provider dashboard, it should display total earnings, today's earnings, and pending payouts
**Validates: Requirements 9.1**

### Property 30: Live Earnings Updates
*For any* active job, the earnings-so-far should update every 5 seconds (±1s tolerance)
**Validates: Requirements 9.2**

### Property 31: Active Jobs Table Completeness
*For any* active job in provider dashboard, the table row should include live duration and earnings columns that update
**Validates: Requirements 9.4**

### Property 32: Transaction History Entry
*For any* completed transaction, an entry should appear in transaction history with explorer link
**Validates: Requirements 9.5**

### Property 33: Average Hourly Rate Calculation
*For any* provider with completed jobs, the average hourly rate should equal total earnings divided by total hours worked
**Validates: Requirements 9.6**

### Property 34: Transaction Display Completeness
*For any* transaction in history, it should display date, amount, type, and status
**Validates: Requirements 10.2**

### Property 35: Explorer Link Validity
*For any* transaction with hash, the explorer link should be in format "https://explorer.qubic.org/tx/{hash}"
**Validates: Requirements 10.3**

### Property 36: Transaction Status Updates
*For any* pending transaction, when it receives 3 confirmations, status should automatically update to 'confirmed'
**Validates: Requirements 10.5**

### Property 37: Worker Execution Timing
*For any* job assigned to worker, execution should start within 5 seconds of job assignment
**Validates: Requirements 11.1**

### Property 38: Progress Report Frequency
*For any* executing job, worker should send progress updates every 10 seconds (±2s tolerance)
**Validates: Requirements 11.2**

### Property 39: Progress Report Completeness
*For any* progress update, it should include progress percentage, current operation string, and GPU metrics object
**Validates: Requirements 11.3**

### Property 40: Job Completion Notification
*For any* completed job, worker should upload results and send completion notification to backend
**Validates: Requirements 11.4**

### Property 41: Duration Estimation from Benchmarks
*For any* job with known type and selected GPU, estimated duration should be calculated using benchmark data for that GPU model
**Validates: Requirements 12.1**

### Property 42: Human-Readable Time Format
*For any* time estimate, it should be formatted as human-readable string (e.g., "5 minutes 30 seconds", "2 hours 15 minutes")
**Validates: Requirements 12.2**

### Property 43: Cost Calculation Formula
*For any* job estimate, total cost should equal (estimated duration in hours) × (GPU hourly rate)
**Validates: Requirements 12.3**

### Property 44: Cost Breakdown Display
*For any* cost estimate, the breakdown should show both per-minute rate and total estimated cost
**Validates: Requirements 12.4**

### Property 45: Reactive Estimate Recalculation
*For any* job configuration change (epochs, resolution, dataset size), estimates should recalculate within 500ms
**Validates: Requirements 12.5**

### Property 46: Refresh Data Fetch
*For any* refresh button click, the system should make API call to fetch latest data from backend
**Validates: Requirements 13.1**

### Property 47: Refresh Loading State
*For any* active refresh operation, the refresh button should display a loading spinner
**Validates: Requirements 13.2**

### Property 48: Refresh Success Feedback
*For any* successful refresh, the displayed data should update and a success toast should appear
**Validates: Requirements 13.3**

### Property 49: Staleness Timestamp
*For any* page with data, a "Last updated: X seconds ago" timestamp should be displayed and increment every second
**Validates: Requirements 13.5**

### Property 50: Auto-Refresh Interval
*For any* page with auto-refresh enabled, data should refresh every 30 seconds (±2s tolerance)
**Validates: Requirements 13.6**

### Property 51: Job Type Detection from Script
*For any* Python script with PyTorch, TensorFlow, or JAX imports, the system should detect the corresponding framework
**Validates: Requirements 14.1**

### Property 52: Benchmark Lookup
*For any* known job type, the system should retrieve benchmark data for available GPU models
**Validates: Requirements 14.2**

### Property 53: Parameter-Based Adjustment
*For any* job with parameters (epochs, resolution, dataset size), estimated duration should scale proportionally with parameter values
**Validates: Requirements 14.3**

### Property 54: Upload Progress Display
*For any* file upload in progress, a progress bar should display showing percentage from 0-100
**Validates: Requirements 15.1**

### Property 55: Upload Completion Indicator
*For any* completed file upload, a checkmark and "Upload complete" message should appear
**Validates: Requirements 15.2**

### Property 56: Validation Results Display
*For any* completed file validation, the detected job type and requirements should be displayed
**Validates: Requirements 15.4**

### Property 57: File Size Rejection
*For any* file exceeding maximum size limit, the system should reject it with error message showing the size limit
**Validates: Requirements 15.5**


## Error Handling

### Frontend Error Handling

**File Upload Errors:**
- File too large: Display error toast with size limit and suggest compression
- Unsupported format: Show list of supported formats (.py, .ipynb, .csv, .json, Dockerfile)
- Network error during upload: Retry with exponential backoff (3 attempts)
- Analysis failure: Fallback to manual configuration option

**GPU Matching Errors:**
- No compatible GPUs: Suggest reducing requirements or waiting for new providers
- Benchmark data missing: Use conservative estimates with wider ranges
- Calculation errors: Log to backend and show generic error to user

**Wallet Connection Errors:**
- Wallet not found: Provide link to Qubic wallet setup guide
- Insufficient balance: Show required amount and current balance, link to exchange
- Transaction signing failed: Retry option with clear error message
- Network timeout: Retry with exponential backoff

**Job Launch Errors:**
- Escrow creation failed: Refund any partial transactions, show detailed error
- Confirmation timeout: Continue polling in background, show estimated wait time
- Provider offline: Automatically reassign to different provider
- Validation errors: Highlight specific fields with clear messages

**WebSocket Errors:**
- Connection failed: Retry every 5 seconds with exponential backoff
- Message parsing error: Log error, continue with next message
- Subscription failed: Retry subscription after reconnection

### Backend Error Handling

**File Analysis Errors:**
- Parsing errors: Return generic job type with conservative requirements
- Timeout (>10s): Return partial analysis with low confidence
- Memory errors: Stream file processing instead of loading entirely

**Qubic RPC Errors:**
- Rate limiting: Implement exponential backoff and request queuing
- Network timeout: Retry up to 3 times with 2s, 4s, 8s delays
- Invalid response: Log error, return cached data if available
- Balance query failure: Return last known balance with staleness warning

**Escrow Errors:**
- Insufficient funds: Return clear error before creating transaction
- Transaction broadcast failure: Retry up to 3 times, then manual intervention
- Confirmation timeout: Continue polling for up to 10 minutes
- Release failure: Queue for retry, alert admin if persistent

**Job Assignment Errors:**
- No available providers: Queue job and notify when provider available
- Provider timeout: Reassign to different provider automatically
- Multiple assignment: Use database transaction locks to prevent

**Database Errors:**
- Connection failure: Retry with exponential backoff, circuit breaker after 5 failures
- Constraint violation: Return 400 error with specific constraint message
- Deadlock: Retry transaction up to 3 times
- Query timeout: Optimize query or increase timeout for specific operations

### Worker Error Handling

**Job Execution Errors:**
- GPU out of memory: Report error, suggest smaller batch size or different GPU
- Framework import error: Report missing dependencies with installation instructions
- Timeout: Report partial results if available, mark job as failed
- Crash: Clean up GPU memory, restart worker, report error to backend

**Metrics Collection Errors:**
- nvidia-smi unavailable: Fall back to alternative GPU monitoring tools
- Permission denied: Report error, continue without GPU metrics
- Parsing errors: Log error, send last known good metrics

**Network Errors:**
- Progress report failure: Queue reports and send in batch on reconnection
- Result upload failure: Retry with exponential backoff, store locally if persistent
- Heartbeat failure: Continue working, attempt reconnection

## Testing Strategy

### Unit Testing

**Frontend Components:**
- JobUploader: Test drag events, file validation, upload progress, error states
- SmartMatcher: Test filtering logic, sorting algorithms, compatibility calculation
- JobWizard: Test step navigation, validation, data persistence
- JobMonitor: Test metrics display, log streaming, progress updates
- ProviderEarnings: Test earnings calculations, chart rendering, transaction display
- QubicService: Test all methods with mocked RPC responses

**Backend Services:**
- Job analysis: Test file parsing for Python, Jupyter, Docker configs
- GPU matching: Test compatibility algorithm with various requirements
- Qubic integration: Test transaction creation, escrow logic, confirmation polling
- WebSocket: Test event broadcasting, subscription management, reconnection

**Worker:**
- Job execution: Test MNIST training, Stable Diffusion, custom scripts
- Metrics collection: Test GPU monitoring with mocked nvidia-smi
- Progress reporting: Test update frequency and data completeness

### Property-Based Testing

Use **fast-check** for TypeScript/JavaScript and **Hypothesis** for Python.

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with: `**Feature: qubix-hackathon-critical-features, Property {number}: {property_text}**`

**Property Test Implementation:**

1. **File Validation Performance (Property 1)** - Generate random files, measure validation time
2. **File Preview Completeness (Property 2)** - Generate valid files, verify preview contains all fields
3. **Job Type Detection (Property 3)** - Generate scripts with various imports, verify detection
4. **GPU Requirements Extraction (Property 4)** - Generate job types, verify all requirements > 0
5. **GPU Compatibility Filtering (Property 7)** - Generate requirements and GPU lists, verify classification
6. **Cost-Benefit Sorting (Property 8)** - Generate GPU lists, verify sort order
7. **Wizard Step Validation (Property 10)** - Generate invalid step data, verify progression blocked
8. **Wizard Data Persistence (Property 11)** - Navigate back/forward, verify data preserved
9. **Qubic Balance Query (Property 12)** - Generate addresses, verify balance >= 0
10. **Balance Caching (Property 15)** - Query same address twice within 30s, verify cache hit
11. **Escrow Before Execution (Property 16)** - Generate jobs, verify escrow completes before running
12. **Funds Locked During Execution (Property 18)** - Generate running jobs, verify escrow status
13. **Payment Release on Success (Property 19)** - Generate completed jobs, verify release transaction
14. **Refund on Failure (Property 20)** - Generate failed jobs, verify refund transaction
15. **Metrics Update Frequency (Property 24)** - Monitor updates, verify 2s interval ±0.5s
16. **Live Earnings Updates (Property 30)** - Monitor earnings, verify 5s interval ±1s
17. **Average Hourly Rate (Property 33)** - Generate completed jobs, verify calculation
18. **Transaction Status Updates (Property 36)** - Generate pending transactions, verify auto-update
19. **Progress Report Frequency (Property 38)** - Monitor worker reports, verify 10s interval ±2s
20. **Cost Calculation Formula (Property 43)** - Generate estimates, verify duration × rate
21. **Reactive Recalculation (Property 45)** - Change config, verify recalc within 500ms
22. **Auto-Refresh Interval (Property 50)** - Monitor refreshes, verify 30s interval ±2s
23. **Parameter-Based Adjustment (Property 53)** - Change parameters, verify proportional scaling
24. **Upload Progress Display (Property 54)** - Upload files, verify progress 0-100
25. **File Size Rejection (Property 57)** - Generate oversized files, verify rejection

### Integration Testing

**End-to-End Flows:**
1. Complete job submission flow:
   - Upload file → Analysis → GPU matching → Wizard → Escrow → Launch → Monitor → Complete
2. Provider earnings flow:
   - Job assigned → Execution → Progress updates → Completion → Payment release → Dashboard update
3. Real-time monitoring flow:
   - Job starts → WebSocket connection → Metrics stream → Log stream → Completion
4. Transaction verification flow:
   - Create escrow → Broadcast → Poll confirmations → Update UI → Explorer link

**Performance Testing:**
- File upload: Test with files up to 500MB
- GPU matching: Test with 1000+ providers
- WebSocket: Test with 100 concurrent job monitors
- Metrics streaming: Test continuous updates for 1 hour
- Database: Test with 10,000+ jobs and transactions

### Manual Testing Checklist

**UI/UX:**
- [ ] Drag-and-drop feels smooth and responsive
- [ ] File upload shows clear progress
- [ ] GPU cards are visually appealing and informative
- [ ] Wizard navigation is intuitive
- [ ] Charts and graphs animate smoothly
- [ ] Loading states are clear and not jarring
- [ ] Error messages are helpful and actionable
- [ ] Mobile responsive (test on phone/tablet)

**Blockchain Integration:**
- [ ] Wallet connects to real Qubic network
- [ ] Balance displays correctly
- [ ] Transactions appear in Qubic explorer
- [ ] Escrow locks funds on-chain
- [ ] Release sends funds to provider
- [ ] Refunds work correctly
- [ ] Confirmation polling works

**Real-time Features:**
- [ ] Job progress updates live
- [ ] GPU metrics update every 2 seconds
- [ ] Earnings update every 5 seconds
- [ ] Logs stream in real-time
- [ ] WebSocket reconnects automatically
- [ ] Multiple tabs stay in sync

**Worker Execution:**
- [ ] MNIST training completes successfully
- [ ] Stable Diffusion generates images
- [ ] Custom scripts execute
- [ ] Progress reports are accurate
- [ ] GPU metrics are collected
- [ ] Results upload correctly

## Deployment Considerations

### Frontend Deployment

**Build Optimization:**
- Code splitting for large components (JobMonitor, ProviderEarnings)
- Lazy loading for charts library (Recharts)
- Image optimization for GPU thumbnails
- Minification and compression

**Environment Variables:**
```
VITE_API_URL=https://api.qubix.io
VITE_WS_URL=wss://api.qubix.io
VITE_QUBIC_RPC=https://rpc.qubic.org/v1
VITE_QUBIC_EXPLORER=https://explorer.qubic.org
```

### Backend Deployment

**Environment Variables:**
```
DATABASE_URL=postgresql://user:pass@host:5432/qubix
QUBIC_RPC_URL=https://rpc.qubic.org/v1
QUBIC_EXPLORER_URL=https://explorer.qubic.org
WS_PORT=8080
API_PORT=3000
NODE_ENV=production
```

**Scaling Considerations:**
- Horizontal scaling for API servers (stateless)
- Redis for WebSocket pub/sub across instances
- Database connection pooling (max 20 connections per instance)
- Rate limiting for Qubic RPC (10 req/s per instance)

### Worker Deployment

**Requirements:**
- Python 3.8+
- NVIDIA GPU with CUDA support
- nvidia-smi installed
- 10GB+ free disk space

**Configuration:**
```
BACKEND_URL=https://api.qubix.io
WORKER_ID=<unique-id>
POLL_INTERVAL=5
GPU_INDEX=0
```

## Demo Video Script (5-7 minutes)

**Minute 0-1: Introduction**
- Show QUBIX landing page
- Explain problem: AWS GPU costs are too high
- Introduce solution: Decentralized GPU marketplace on Qubic

**Minute 1-2: Provider Onboarding**
- Click "Share My GPU" button
- Show automatic GPU detection
- Provider appears in marketplace instantly
- Highlight one-click simplicity

**Minute 2-4: Job Submission (The Wow Factor)**
- Drag MNIST training script into upload zone
- Show automatic analysis detecting PyTorch
- Display smart GPU matching with recommendations
- Show cost comparison (70% cheaper than AWS)
- Walk through 4-step wizard
- Show real Qubic wallet connection
- Display escrow transaction in Qubic explorer

**Minute 4-6: Real-Time Monitoring**
- Show job monitoring dashboard
- Highlight live GPU metrics with animated charts
- Show log streaming in real-time
- Display progress bar updating
- Show earnings updating on provider dashboard
- Highlight transaction confirmations (0/3, 1/3, 2/3, 3/3)

**Minute 6-7: Completion & Verification**
- Job completes successfully
- Show automatic payment release
- Display transaction in Qubic explorer
- Show provider earnings updated
- Highlight key differentiators:
  - One-click provider onboarding
  - Smart GPU matching
  - Real Qubic blockchain integration
  - Professional UI/UX
  - 70% cost savings

**Closing:**
- Show GitHub repo
- Mention property-based testing
- Thank judges and Qubic team

