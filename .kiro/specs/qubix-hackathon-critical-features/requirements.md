# Requirements Document

## Introduction

This document outlines the critical features required for QUBIX to win the "Qubic: Hack the Future" hackathon ($44,550 in prizes). The platform is 80% complete and needs these final differentiating features: drag-and-drop job submission, intelligent GPU matching, real Qubic blockchain integration with escrow, and impressive real-time monitoring. These features will demonstrate production-ready functionality that is 70% cheaper than AWS while providing a superior user experience.

## Glossary

- **QUBIX Platform**: The decentralized GPU marketplace competing in the Qubic hackathon
- **Job**: A compute workload (ML training, inference, rendering) submitted by a consumer
- **Drag-and-Drop Upload**: Browser-based file upload interface allowing users to drag files into a drop zone
- **Smart Matching**: Automated algorithm that analyzes job requirements and recommends compatible GPUs
- **GPU Compatibility**: Whether a GPU has sufficient VRAM, compute power, and features for a job
- **Qubic Blockchain**: The blockchain network used for all payments and escrow transactions
- **Escrow**: A smart contract or multi-signature mechanism that locks payment until job completion
- **Real-time Monitoring**: Live updates of job progress, GPU metrics, and earnings displayed via WebSocket
- **Provider**: A user sharing GPU hardware to earn QUBIC tokens
- **Consumer**: A user renting GPU compute power
- **Worker**: Python software running on provider hardware that executes jobs
- **QUBIC Token**: The native cryptocurrency of the Qubic blockchain
- **Transaction Hash**: Unique identifier for blockchain transactions
- **Explorer**: Web interface for viewing blockchain transactions (explorer.qubic.org)
- **Marketplace**: Interface where consumers browse available GPUs
- **Cost-Benefit Ratio**: Performance per dollar metric for comparing GPU options

## Requirements

### Requirement 1: Drag-and-Drop Job Upload Interface

**User Story:** As a consumer, I want to drag and drop my dataset or script files to submit a job, so that I can quickly start compute workloads without complex forms.

#### Acceptance Criteria

1. WHEN a consumer visits the job submission page THEN the system SHALL display a prominent drag-and-drop zone
2. WHEN a user drags a file over the drop zone THEN the system SHALL provide visual feedback with border highlighting
3. WHEN a user drops a file THEN the system SHALL validate file type and size within 1 second
4. WHEN file validation succeeds THEN the system SHALL display file preview with name, size, and type
5. WHEN the system analyzes the file THEN the system SHALL detect job type automatically (ML training, inference, rendering)
6. WHEN job type is detected THEN the system SHALL extract or estimate GPU requirements (VRAM, compute)
7. IF file validation fails THEN the system SHALL display clear error message with supported formats
8. WHEN multiple files are dropped THEN the system SHALL accept all valid files and reject invalid ones

### Requirement 2: Automatic Job Analysis and Requirement Extraction

**User Story:** As a consumer, I want the system to automatically analyze my uploaded files and determine GPU requirements, so that I don't need to manually specify technical details.

#### Acceptance Criteria

1. WHEN a Python script is uploaded THEN the system SHALL parse import statements to detect frameworks (PyTorch, TensorFlow, JAX)
2. WHEN a Jupyter notebook is uploaded THEN the system SHALL analyze cells to estimate memory usage
3. WHEN a dataset is uploaded THEN the system SHALL calculate size and infer data type (images, text, tabular)
4. WHEN a Docker config is uploaded THEN the system SHALL read requirements to determine compute needs
5. WHEN analysis completes THEN the system SHALL display minimum GPU requirements (VRAM, TFLOPS, RAM)
6. WHEN requirements are calculated THEN the system SHALL show estimated job duration based on benchmarks
7. WHEN cost estimation is needed THEN the system SHALL calculate price range before GPU selection

### Requirement 3: Smart GPU Matching and Recommendation

**User Story:** As a consumer, I want the system to recommend the best GPUs for my job based on compatibility and cost-benefit, so that I can make informed decisions quickly.

#### Acceptance Criteria

1. WHEN job requirements are determined THEN the system SHALL filter marketplace GPUs by compatibility
2. WHEN filtering GPUs THEN the system SHALL mark compatible GPUs with green badges
3. WHEN a GPU is borderline compatible THEN the system SHALL mark it yellow with performance warnings
4. WHEN a GPU is insufficient THEN the system SHALL mark it red and disable selection
5. WHEN displaying compatible GPUs THEN the system SHALL sort by cost-benefit ratio by default
6. WHEN showing GPU cards THEN the system SHALL display estimated completion time for each GPU
7. WHEN showing GPU cards THEN the system SHALL display total cost estimate for each GPU
8. WHEN a consumer views recommendations THEN the system SHALL show side-by-side comparison of top 3 GPUs

### Requirement 4: Multi-Step Job Configuration Wizard

**User Story:** As a consumer, I want a guided wizard to configure my job step-by-step, so that I don't miss important settings and can review before launching.

#### Acceptance Criteria

1. WHEN job submission starts THEN the system SHALL display a 4-step wizard with progress indicator
2. WHEN in Step 1 THEN the system SHALL show upload interface and auto-analysis results
3. WHEN in Step 2 THEN the system SHALL show only compatible GPUs with comparison table
4. WHEN in Step 3 THEN the system SHALL allow optional advanced configuration (environment variables, Docker image, output destination)
5. WHEN in Step 4 THEN the system SHALL display complete cost breakdown and payment confirmation
6. WHEN navigating steps THEN the system SHALL validate current step before allowing next
7. WHEN user clicks Back THEN the system SHALL preserve previously entered data
8. WHEN user reaches Step 4 THEN the system SHALL show prominent Launch button

### Requirement 5: Real Qubic Blockchain Integration

**User Story:** As a platform user, I want all payments processed through the real Qubic blockchain, so that transactions are transparent, secure, and verifiable.

#### Acceptance Criteria

1. WHEN a user connects wallet THEN the system SHALL use Qubic wallet API (not MetaMask or other chains)
2. WHEN wallet connects THEN the system SHALL query real balance from Qubic RPC endpoint
3. WHEN creating a transaction THEN the system SHALL use Qubic transaction format and signing
4. WHEN broadcasting transaction THEN the system SHALL submit to Qubic network via RPC
5. WHEN transaction is submitted THEN the system SHALL return transaction hash linking to Qubic explorer
6. WHEN verifying transaction THEN the system SHALL poll Qubic network for confirmation status
7. WHEN displaying balance THEN the system SHALL cache for 30 seconds to avoid rate limiting

### Requirement 6: Escrow Payment Flow with Job Lifecycle

**User Story:** As a consumer and provider, I want payments held in escrow until job completion, so that both parties are protected from fraud.

#### Acceptance Criteria

1. WHEN a consumer launches a job THEN the system SHALL lock payment amount in escrow before job starts
2. WHEN escrow is created THEN the system SHALL generate on-chain transaction with job metadata
3. WHILE a job executes THEN the system SHALL keep funds locked in escrow
4. WHEN job completes successfully THEN the system SHALL release funds to provider's Qubic address
5. IF job fails THEN the system SHALL refund consumer's Qubic address automatically
6. WHEN escrow transaction occurs THEN the system SHALL wait for 3 blockchain confirmations
7. WHEN displaying payment status THEN the system SHALL show confirmation count (0/3, 1/3, 2/3, 3/3)

### Requirement 7: Real-Time Job Monitoring Dashboard

**User Story:** As a consumer, I want to see live progress of my running job with GPU metrics, so that I can monitor execution and troubleshoot issues.

#### Acceptance Criteria

1. WHEN a job starts THEN the system SHALL display monitoring dashboard with 3-column layout
2. WHEN displaying job info THEN the system SHALL show job ID, status, GPU assigned, start time, and cost
3. WHEN showing live metrics THEN the system SHALL display GPU utilization, memory, temperature, and power usage
4. WHEN streaming logs THEN the system SHALL show real-time stdout/stderr with auto-scroll
5. WHEN metrics update THEN the system SHALL refresh display every 2 seconds via WebSocket
6. WHEN job progresses THEN the system SHALL show progress percentage and current operation
7. WHEN displaying timeline THEN the system SHALL show visual progress bar with time remaining
8. WHEN job completes THEN the system SHALL display completion status and download results button

### Requirement 8: Live GPU Metrics Visualization

**User Story:** As a consumer monitoring a job, I want to see GPU metrics as animated charts, so that I can understand resource utilization at a glance.

#### Acceptance Criteria

1. WHEN displaying GPU utilization THEN the system SHALL show animated line graph with last 60 seconds
2. WHEN showing GPU memory THEN the system SHALL display bar chart with used/total ratio
3. WHEN displaying temperature THEN the system SHALL show gauge visualization with color coding
4. WHEN showing power usage THEN the system SHALL display wattage with historical trend
5. WHEN metrics exceed thresholds THEN the system SHALL highlight in warning colors (yellow/red)
6. WHEN hovering over charts THEN the system SHALL show exact values with timestamps

### Requirement 9: Provider Earnings Real-Time Dashboard

**User Story:** As a provider, I want to see my earnings update in real-time as jobs execute, so that I can track income and optimize my hardware sharing.

#### Acceptance Criteria

1. WHEN a provider views dashboard THEN the system SHALL display total earnings, today's earnings, and pending payouts
2. WHEN a job is running THEN the system SHALL update earnings-so-far every 5 seconds
3. WHEN displaying earnings chart THEN the system SHALL show line graph of last 30 days
4. WHEN showing active jobs THEN the system SHALL display table with live duration and earnings columns
5. WHEN transaction completes THEN the system SHALL add entry to transaction history with explorer link
6. WHEN calculating hourly rate THEN the system SHALL show average across all completed jobs
7. WHEN displaying performance metrics THEN the system SHALL show uptime percentage and jobs completed

### Requirement 10: Transaction History with Blockchain Verification

**User Story:** As a platform user, I want to see all my transactions with links to blockchain explorer, so that I can verify payments independently.

#### Acceptance Criteria

1. WHEN viewing transaction history THEN the system SHALL display all payments, earnings, and refunds
2. WHEN showing a transaction THEN the system SHALL include date, amount, type, and status
3. WHEN displaying transaction hash THEN the system SHALL provide clickable link to Qubic explorer
4. WHEN transaction is pending THEN the system SHALL show pending status with estimated confirmation time
5. WHEN transaction confirms THEN the system SHALL update status to confirmed automatically
6. WHEN filtering transactions THEN the system SHALL support filtering by type and date range

### Requirement 11: Worker Job Execution with Progress Reporting

**User Story:** As a provider, I want my worker to execute jobs and report progress automatically, so that consumers see live updates and I earn payments.

#### Acceptance Criteria

1. WHEN worker receives a job THEN the system SHALL start execution within 5 seconds
2. WHILE job executes THEN the system SHALL report progress updates every 10 seconds
3. WHEN reporting progress THEN the system SHALL include percentage, current operation, and GPU metrics
4. WHEN job completes THEN the system SHALL upload results and notify backend
5. IF job fails THEN the system SHALL report error details and clean up resources
6. WHEN collecting metrics THEN the system SHALL use nvidia-smi or equivalent for accurate GPU data

### Requirement 12: Estimated Time and Cost Calculation

**User Story:** As a consumer, I want to see estimated completion time and total cost before launching a job, so that I can budget and plan accordingly.

#### Acceptance Criteria

1. WHEN job requirements are known THEN the system SHALL calculate estimated duration using benchmark data
2. WHEN displaying estimates THEN the system SHALL show time in human-readable format (5 minutes 30 seconds)
3. WHEN calculating cost THEN the system SHALL multiply estimated duration by GPU hourly rate
4. WHEN showing cost breakdown THEN the system SHALL display per-minute rate and total estimated cost
5. WHEN job config changes THEN the system SHALL recalculate estimates in real-time
6. WHEN estimates are uncertain THEN the system SHALL show range (5-8 minutes) instead of exact value

### Requirement 13: Refresh Functionality Across All Views

**User Story:** As a platform user, I want refresh buttons that actually update data, so that I can see the latest information without page reload.

#### Acceptance Criteria

1. WHEN a user clicks refresh button THEN the system SHALL fetch latest data from backend
2. WHILE refreshing THEN the system SHALL show loading spinner on the refresh button
3. WHEN refresh completes THEN the system SHALL update displayed data and show success toast
4. WHEN refresh fails THEN the system SHALL show error toast with retry option
5. WHEN data is stale THEN the system SHALL display "Last updated: X seconds ago" timestamp
6. WHILE user is on a page THEN the system SHALL auto-refresh data every 30 seconds
7. WHEN displaying lists THEN the system SHALL implement refresh in marketplace, jobs, and earnings pages

### Requirement 14: Job Type Detection and Benchmarking

**User Story:** As a system, I want to detect job types and use benchmarks to estimate resource needs, so that recommendations are accurate and helpful.

#### Acceptance Criteria

1. WHEN analyzing Python script THEN the system SHALL detect Stable Diffusion, MNIST training, or custom workloads
2. WHEN job type is known THEN the system SHALL look up benchmark data for different GPU models
3. WHEN calculating estimates THEN the system SHALL adjust benchmarks based on job parameters (epochs, resolution, dataset size)
4. WHEN benchmarks are unavailable THEN the system SHALL use conservative estimates with wider ranges
5. WHEN displaying estimates THEN the system SHALL show confidence level (high, medium, low)

### Requirement 15: File Upload Progress and Validation

**User Story:** As a consumer uploading large files, I want to see upload progress and validation feedback, so that I know the system is processing my files.

#### Acceptance Criteria

1. WHEN uploading a file THEN the system SHALL display progress bar showing percentage uploaded
2. WHEN upload completes THEN the system SHALL show checkmark and "Upload complete" message
3. WHEN validating file THEN the system SHALL show "Analyzing..." status with spinner
4. WHEN validation completes THEN the system SHALL show detected job type and requirements
5. IF file is too large THEN the system SHALL reject with message showing size limit
6. IF file format is unsupported THEN the system SHALL show list of supported formats

