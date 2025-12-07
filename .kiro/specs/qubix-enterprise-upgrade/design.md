# Design Document

## Overview

The QUBIX Enterprise Upgrade transforms the platform from a prototype into a production-ready GPU marketplace. The design implements a hybrid architecture combining browser-based GPU detection (WebGPU) with native worker installation fallback, real Qubic blockchain integration, PostgreSQL persistence, and WebSocket-based real-time updates. The system prioritizes user experience with one-click provider onboarding while maintaining enterprise-grade reliability and security.

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Landing     │  │  Marketplace │  │  Dashboards  │      │
│  │  Page        │  │  (Consumer)  │  │  (Provider)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                   ┌────────▼────────┐                        │
│                   │  QuickProvider  │                        │
│                   │  Component      │                        │
│                   └────────┬────────┘                        │
│                            │                                 │
│              ┌─────────────┴─────────────┐                  │
│              │                           │                  │
│         WebGPU API              Auto-download               │
│         Detection               Installer                   │
└──────────────┬──────────────────────────┬──────────────────┘
               │                          │
               │                          │
┌──────────────▼──────────────────────────▼──────────────────┐
│                    Backend (Node.js)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  REST API    │  │  WebSocket   │  │  Qubic       │     │
│  │  Endpoints   │  │  Server      │  │  Integration │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                            │                                │
│                   ┌────────▼────────┐                       │
│                   │  Prisma ORM     │                       │
│                   └────────┬────────┘                       │
└────────────────────────────┬────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  PostgreSQL     │
                    │  Database       │
                    └─────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                Provider Workers (Python)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Worker 1    │  │  Worker 2    │  │  Worker N    │      │
│  │  (GPU A)     │  │  (GPU B)     │  │  (GPU X)     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                   Heartbeat & Job Polling                    │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Lucide React for icons
- React Hot Toast for notifications
- WebSocket client for real-time updates
- WebGPU API for browser-based GPU detection

**Backend:**
- Node.js with Express
- TypeScript for type safety
- Prisma ORM for database access
- PostgreSQL for data persistence
- WebSocket (ws library) for real-time communication
- Qubic SDK for blockchain integration

**Worker:**
- Python 3.8+
- psutil for hardware metrics
- requests for HTTP communication
- CUDA/OpenCL for GPU compute (optional)
- nvidia-smi for GPU detection

**Infrastructure:**
- Docker for containerization
- PostgreSQL 14+
- Redis for caching (optional)

## Components and Interfaces

### Frontend Components

#### QuickProvider Component

The main component for one-click provider registration.

**Props:**
```typescript
interface QuickProviderProps {
  onSuccess?: (provider: Provider) => void;
  onError?: (error: Error) => void;
}
```

**State:**
```typescript
interface QuickProviderState {
  status: 'idle' | 'detecting' | 'downloading' | 'installing' | 'registering' | 'online';
  progress: number; // 0-100
  gpuInfo: GPUInfo | null;
  error: string | null;
}
```

**Methods:**
- `detectGPUBrowser()`: Attempts WebGPU/WebGL detection
- `registerBrowserGPU()`: Registers browser-based provider
- `downloadAndInstallWorker()`: Triggers native worker installation
- `detectOS()`: Identifies user's operating system

#### Marketplace Component

Displays available GPUs with filtering and real-time updates.

**Props:**
```typescript
interface MarketplaceProps {
  userType: 'consumer' | 'provider';
}
```

**State:**
```typescript
interface MarketplaceState {
  gpus: Provider[];
  filters: MarketplaceFilters;
  sortBy: 'price' | 'performance' | 'availability';
  loading: boolean;
}
```

#### ProviderDashboard Component

Shows provider analytics and earnings.

**State:**
```typescript
interface ProviderDashboardState {
  earnings: EarningsData;
  gpuMetrics: GPUMetrics[];
  jobHistory: Job[];
  currentStatus: 'online' | 'offline' | 'busy';
}
```

### Backend API Endpoints

#### Provider Endpoints

**POST /api/providers/quick-register**
```typescript
Request: {
  type: 'browser' | 'native';
  gpu: GPUInfo;
  workerId: string;
  qubicAddress: string;
}

Response: {
  success: boolean;
  provider: Provider;
}
```

**POST /api/providers/:workerId/heartbeat**
```typescript
Request: {
  workerId: string;
  usage: ResourceUsage;
  status: 'online' | 'offline' | 'busy';
  currentJob?: string;
}

Response: {
  success: boolean;
  pendingJobs: Job[];
}
```

**GET /api/providers/check-new**
```typescript
Response: {
  newProvider: Provider | null;
}
```

#### Job Endpoints

**POST /api/jobs/create**
```typescript
Request: {
  modelType: string;
  computeNeeded: number;
  inputData: any;
  maxPrice: number;
  qubicAddress: string;
}

Response: {
  success: boolean;
  job: Job;
  estimatedCost: number;
}
```

**GET /api/jobs/pending/:workerId**
```typescript
Response: Job[]
```

**POST /api/jobs/:jobId/progress**
```typescript
Request: {
  workerId: string;
  progress: number;
  timestamp: string;
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
  metrics: JobMetrics;
}

Response: {
  success: boolean;
  payment: PaymentInfo;
}
```

#### Wallet Endpoints

**POST /api/wallet/connect**
```typescript
Request: {
  qubicAddress: string;
  signature: string;
}

Response: {
  success: boolean;
  balance: number;
  user: User;
}
```

**GET /api/wallet/:address/balance**
```typescript
Response: {
  balance: number;
  pendingEarnings: number;
}
```

### WebSocket Events

**Client → Server:**
- `subscribe:marketplace` - Subscribe to marketplace updates
- `subscribe:provider:{workerId}` - Subscribe to provider metrics
- `subscribe:job:{jobId}` - Subscribe to job progress

**Server → Client:**
- `PROVIDER_REGISTERED` - New provider available
- `PROVIDER_STATUS_CHANGED` - Provider online/offline
- `GPU_METRICS_UPDATE` - Real-time GPU metrics
- `JOB_PROGRESS` - Job execution progress
- `JOB_COMPLETED` - Job finished
- `MARKETPLACE_UPDATE` - General marketplace changes

## Data Models

### Database Schema (Prisma)

```prisma
model User {
  id            String    @id @default(uuid())
  qubicAddress  String    @unique
  email         String?   @unique
  username      String?
  role          Role      @default(CONSUMER)
  balance       Float     @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  providers     Provider[]
  jobs          Job[]
  transactions  Transaction[]
}

enum Role {
  CONSUMER
  PROVIDER
  BOTH
}

model Provider {
  id              String    @id @default(uuid())
  workerId        String    @unique
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  
  qubicAddress    String
  name            String?
  type            ProviderType
  
  // Hardware specs
  gpuModel        String
  gpuVram         Float
  cpuModel        String
  cpuCores        Int
  ramTotal        Float
  
  // Location and pricing
  location        String?
  pricePerHour    Float
  
  // Status
  isOnline        Boolean   @default(false)
  isAvailable     Boolean   @default(true)
  currentJobId    String?
  
  // Metrics
  totalEarnings   Float     @default(0)
  totalJobs       Int       @default(0)
  uptime          Int       @default(0)
  
  registeredAt    DateTime  @default(now())
  lastHeartbeat   DateTime?
  
  jobs            Job[]
  metrics         ProviderMetric[]
}

enum ProviderType {
  BROWSER
  NATIVE
}

model Job {
  id              String    @id @default(uuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  providerId      String?
  provider        Provider? @relation(fields: [providerId], references: [id])
  
  modelType       String
  computeNeeded   Float
  inputData       Json
  
  status          JobStatus @default(PENDING)
  progress        Int       @default(0)
  
  result          Json?
  error           String?
  
  estimatedCost   Float
  actualCost      Float?
  
  createdAt       DateTime  @default(now())
  startedAt       DateTime?
  completedAt     DateTime?
  
  transaction     Transaction?
}

enum JobStatus {
  PENDING
  ASSIGNED
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}

model Transaction {
  id              String    @id @default(uuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  jobId           String?   @unique
  job             Job?      @relation(fields: [jobId], references: [id])
  
  type            TransactionType
  amount          Float
  status          TransactionStatus
  
  qubicTxHash     String?
  
  createdAt       DateTime  @default(now())
  completedAt     DateTime?
}

enum TransactionType {
  PAYMENT
  EARNING
  REFUND
  ESCROW_LOCK
  ESCROW_RELEASE
}

enum TransactionStatus {
  PENDING
  COMPLETED
  FAILED
}

model ProviderMetric {
  id              String    @id @default(uuid())
  providerId      String
  provider        Provider  @relation(fields: [providerId], references: [id])
  
  cpuPercent      Float
  ramPercent      Float
  gpuPercent      Float?
  gpuTemp         Float?
  gpuMemUsed      Float?
  
  timestamp       DateTime  @default(now())
  
  @@index([providerId, timestamp])
}
```

### TypeScript Interfaces

```typescript
interface GPUInfo {
  vendor?: string;
  model?: string;
  renderer?: string;
  architecture?: string;
  device?: string;
  description?: string;
  vram?: number;
  type: 'webgpu' | 'webgl' | 'native';
}

interface ResourceUsage {
  cpuPercent: number;
  ramPercent: number;
  ramUsedGb: number;
  ramTotalGb: number;
  gpuPercent?: number;
  gpuTemp?: number;
  gpuMemUsedMb?: number;
  gpuMemTotalMb?: number;
  timestamp: string;
}

interface MarketplaceFilters {
  gpuModel?: string[];
  minVram?: number;
  maxPrice?: number;
  location?: string[];
  availability?: 'available' | 'all';
}

interface EarningsData {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  history: EarningEntry[];
}

interface EarningEntry {
  date: string;
  amount: number;
  jobCount: number;
}

interface JobMetrics {
  processingTimeSeconds: number;
  cpuUsageAvg: number;
  ramUsageAvg: number;
  gpuUsageAvg?: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: GPU Detection Completeness
*For any* provider registration attempt, the system should successfully detect GPU specifications or provide a clear fallback mechanism
**Validates: Requirements 1.1, 1.5, 1.6**

### Property 2: Registration Idempotency
*For any* provider with a given workerId, multiple registration attempts should result in the same provider record without duplicates
**Validates: Requirements 1.2**

### Property 3: Marketplace Consistency
*For any* provider registration or status change, all connected marketplace clients should receive the update within 2 seconds
**Validates: Requirements 1.3, 7.2, 7.3**

### Property 4: Wallet Balance Integrity
*For any* sequence of transactions, the sum of all credits minus debits should equal the current wallet balance
**Validates: Requirements 2.3, 2.4, 2.5**

### Property 5: Database Persistence
*For any* data write operation, a subsequent read should return the same data even after server restart
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 6: Job Assignment Fairness
*For any* pending job, the system should assign it to an available provider within 30 seconds or mark it as unassignable
**Validates: Requirements 4.1**

### Property 7: Job Execution Progress
*For any* running job, progress updates should be monotonically increasing from 0 to 100
**Validates: Requirements 4.3**

### Property 8: Payment Escrow Safety
*For any* job payment, funds should remain in escrow until job completion or failure, never lost
**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

### Property 9: Metrics Freshness
*For any* online provider, GPU metrics should be no older than 60 seconds
**Validates: Requirements 5.1, 5.2**

### Property 10: WebSocket Reconnection
*For any* WebSocket disconnection, the client should automatically reconnect within 5 seconds
**Validates: Requirements 7.5**

### Property 11: Filter Correctness
*For any* marketplace filter combination, all returned results should match the filter criteria
**Validates: Requirements 12.2, 12.3**

### Property 12: Worker Installation Success
*For any* operating system (Windows, macOS, Linux), the installer should complete successfully or provide clear error messages
**Validates: Requirements 9.2, 9.3, 9.4**

## Error Handling

### Frontend Error Handling

**Network Errors:**
- Display toast notification with retry option
- Implement exponential backoff for retries
- Show offline indicator when backend unreachable

**GPU Detection Failures:**
- Fallback to native worker installation
- Provide manual configuration option
- Display clear error messages with troubleshooting steps

**WebSocket Disconnections:**
- Automatic reconnection with exponential backoff
- Queue messages during disconnection
- Visual indicator of connection status

### Backend Error Handling

**Database Errors:**
- Log errors with full context
- Retry transient failures (connection timeouts)
- Return 500 status with sanitized error message
- Implement circuit breaker for database connections

**Qubic Blockchain Errors:**
- Retry failed transactions up to 3 times
- Queue transactions for later processing if blockchain unavailable
- Notify users of payment delays
- Implement fallback to manual verification

**Worker Communication Errors:**
- Mark provider as offline after 3 missed heartbeats
- Reassign jobs from unresponsive workers
- Notify consumers of job reassignment

### Worker Error Handling

**Job Execution Failures:**
- Report failure to backend with error details
- Clean up resources (GPU memory, temp files)
- Mark worker as available for new jobs
- Log errors for debugging

**Hardware Errors:**
- Detect GPU overheating and pause jobs
- Report hardware issues to backend
- Gracefully shut down on critical errors

## Testing Strategy

### Unit Testing

**Frontend:**
- Component rendering tests (React Testing Library)
- State management tests
- API client tests with mocked responses
- WebSocket client tests with mock server

**Backend:**
- API endpoint tests with supertest
- Database operations with test database
- Qubic integration with mocked blockchain
- WebSocket server tests

**Worker:**
- GPU detection tests with mocked nvidia-smi
- Job execution tests with sample workloads
- Heartbeat mechanism tests
- Error handling tests

### Property-Based Testing

Use **fast-check** (JavaScript/TypeScript) and **Hypothesis** (Python) for property-based tests.

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with format: `**Feature: qubix-enterprise-upgrade, Property {number}: {property_text}**`

**Property Tests:**

1. **GPU Detection Completeness** - Generate random hardware configurations, verify detection succeeds or provides fallback
2. **Registration Idempotency** - Generate random workerIds, verify multiple registrations create single record
3. **Marketplace Consistency** - Generate provider updates, verify all clients receive updates
4. **Wallet Balance Integrity** - Generate transaction sequences, verify balance calculations
5. **Database Persistence** - Generate random data, write, restart, verify reads match
6. **Job Assignment Fairness** - Generate jobs and providers, verify assignment within timeout
7. **Job Execution Progress** - Generate progress updates, verify monotonic increase
8. **Payment Escrow Safety** - Generate job lifecycles, verify funds never lost
9. **Metrics Freshness** - Generate metric updates, verify timestamps within bounds
10. **WebSocket Reconnection** - Simulate disconnections, verify reconnection timing
11. **Filter Correctness** - Generate filter combinations, verify all results match
12. **Worker Installation Success** - Test installers on all OS platforms

### Integration Testing

**End-to-End Flows:**
- Complete provider registration flow (browser and native)
- Job submission, execution, and payment flow
- Wallet connection and balance updates
- Real-time marketplace updates
- Provider dashboard with live metrics

**Performance Testing:**
- Load test with 1000 concurrent providers
- Stress test WebSocket with 10,000 connections
- Database query performance under load
- Job assignment latency measurements

### Manual Testing

**UI/UX Testing:**
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- Responsive design on mobile, tablet, desktop
- Accessibility compliance (WCAG 2.1 AA)
- Visual regression testing

**Hardware Testing:**
- Test on various GPU models (NVIDIA, AMD, Intel)
- Test on different operating systems
- Test with different network conditions
- Test worker installation on clean systems
