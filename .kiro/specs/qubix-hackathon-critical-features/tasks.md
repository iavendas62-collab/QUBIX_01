# Implementation Plan

- [x] 1. Setup job file analysis backend service





  - Create file upload endpoint with multipart/form-data support
  - Implement Python script parser to detect imports (PyTorch, TensorFlow, JAX)
  - Implement Jupyter notebook parser to analyze cells
  - Implement Docker config parser to extract requirements
  - Create job type detection logic with confidence scoring
  - Calculate GPU requirements (VRAM, compute, RAM) based on detected type
  - _Requirements: 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 1.1 Write property test for job type detection
  - **Property 3: Job Type Detection Accuracy**
  - **Validates: Requirements 1.5, 2.1, 2.2, 2.4**

- [ ]* 1.2 Write property test for GPU requirements extraction
  - **Property 4: GPU Requirements Extraction**
  - **Validates: Requirements 1.6, 2.5**

- [x] 2. Create JobUploader React component with drag-and-drop





  - Install react-dropzone library
  - Create JobUploader component with drag-and-drop zone
  - Implement drag enter/leave visual feedback (border highlighting)
  - Add file validation (type and size checks)
  - Implement upload progress bar with percentage display
  - Add file preview showing name, size, and type
  - Call backend analysis endpoint and display results
  - Handle validation errors with clear messages
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.7, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

- [ ]* 2.1 Write property test for file validation performance
  - **Property 1: File Validation Performance**
  - **Validates: Requirements 1.3**

- [ ]* 2.2 Write property test for file preview completeness
  - **Property 2: File Preview Completeness**
  - **Validates: Requirements 1.4**

- [ ]* 2.3 Write property test for batch file processing
  - **Property 6: Batch File Processing**
  - **Validates: Requirements 1.8**

- [x] 3. Implement GPU matching algorithm backend





  - Create benchmark database with job types and GPU models
  - Implement compatibility calculation logic (VRAM, compute comparison)
  - Create GPU filtering endpoint that accepts job requirements
  - Calculate estimated duration using benchmarks
  - Calculate estimated cost (duration × hourly rate)
  - Compute cost-benefit score for each GPU
  - Sort GPUs by cost-benefit, price, or performance
  - Return top 3 recommendations
  - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6, 3.7, 12.1, 12.3, 14.2, 14.3_

- [ ]* 3.1 Write property test for GPU compatibility filtering
  - **Property 7: GPU Compatibility Filtering**
  - **Validates: Requirements 3.1, 3.2, 3.4**

- [ ]* 3.2 Write property test for cost-benefit sorting
  - **Property 8: Cost-Benefit Sorting**
  - **Validates: Requirements 3.5**

- [ ]* 3.3 Write property test for duration estimation
  - **Property 41: Duration Estimation from Benchmarks**
  - **Validates: Requirements 12.1**

- [ ]* 3.4 Write property test for cost calculation
  - **Property 43: Cost Calculation Formula**
  - **Validates: Requirements 12.3**

- [x] 4. Create SmartMatcher React component





  - Create SmartMatcher component accepting job requirements and GPU list
  - Implement GPU card display with compatibility badges (green/yellow/red)
  - Show estimated completion time and cost on each card
  - Add sorting controls (cost-benefit, price, performance)
  - Display top 3 recommendations in comparison view
  - Show warnings for borderline GPUs
  - Disable selection for insufficient GPUs
  - Handle GPU selection callback
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [ ]* 4.1 Write property test for GPU card information completeness
  - **Property 9: GPU Card Information Completeness**
  - **Validates: Requirements 3.6, 3.7**

- [x] 5. Build JobWizard 4-step component





  - Create JobWizard component with step state management
  - Implement Step 1: Upload & Analysis (integrate JobUploader)
  - Implement Step 2: GPU Selection (integrate SmartMatcher)
  - Implement Step 3: Advanced Config (env vars, Docker image, output destination)
  - Implement Step 4: Payment & Launch (cost breakdown, wallet confirmation)
  - Add progress indicator showing current step (1/4, 2/4, etc)
  - Implement step validation before allowing next
  - Add Back/Next navigation with data persistence
  - Add Skip button for Step 3 (advanced config)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 12.4_

- [ ]* 5.1 Write property test for wizard step validation
  - **Property 10: Wizard Step Validation**
  - **Validates: Requirements 4.6**

- [ ]* 5.2 Write property test for wizard data persistence
  - **Property 11: Wizard Data Persistence**
  - **Validates: Requirements 4.7**

- [x] 6. Implement Qubic blockchain integration service





  - Research Qubic RPC API documentation
  - Create QubicService class with wallet connection method
  - Implement balance query with caching (30s TTL)
  - Create transaction creation with Qubic format and signing
  - Implement transaction broadcasting to Qubic network
  - Add transaction verification and confirmation polling
  - Generate Qubic explorer URLs for transactions
  - Implement error handling and retry logic
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 10.3_

- [ ]* 6.1 Write property test for Qubic balance query
  - **Property 12: Qubic Balance Query**
  - **Validates: Requirements 5.2**

- [ ]* 6.2 Write property test for transaction format
  - **Property 13: Qubic Transaction Format**
  - **Validates: Requirements 5.3**

- [ ]* 6.3 Write property test for transaction hash and explorer link
  - **Property 14: Transaction Hash and Explorer Link**
  - **Validates: Requirements 5.5**

- [ ]* 6.4 Write property test for balance caching
  - **Property 15: Balance Caching**
  - **Validates: Requirements 5.7**

- [x] 7. Create escrow payment system





  - Create escrow lock endpoint accepting job ID, amount, provider address, duration
  - Implement escrow transaction creation with job metadata in memo field
  - Add confirmation polling (wait for 3 confirmations)
  - Create escrow release endpoint for job completion
  - Create refund endpoint for job failure
  - Store escrow transactions in database with status tracking
  - Broadcast escrow status updates via WebSocket
  - Display confirmation count in UI (0/3, 1/3, 2/3, 3/3)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 8.1, 8.2, 8.3, 8.4_

- [ ]* 7.1 Write property test for escrow before execution
  - **Property 16: Escrow Before Execution**
  - **Validates: Requirements 6.1, 6.6**

- [ ]* 7.2 Write property test for escrow metadata inclusion
  - **Property 17: Escrow Metadata Inclusion**
  - **Validates: Requirements 6.2**

- [ ]* 7.3 Write property test for funds locked during execution
  - **Property 18: Funds Locked During Execution**
  - **Validates: Requirements 6.3**

- [ ]* 7.4 Write property test for payment release on success
  - **Property 19: Payment Release on Success**
  - **Validates: Requirements 6.4**

- [ ]* 7.5 Write property test for refund on failure
  - **Property 20: Refund on Failure**
  - **Validates: Requirements 6.5**

- [ ]* 7.6 Write property test for confirmation count display
  - **Property 21: Confirmation Count Display**
  - **Validates: Requirements 6.7**
-

- [x] 8. Integrate escrow into job launch flow



  - Update job creation endpoint to require escrow transaction hash
  - Modify JobWizard Step 4 to create escrow before job creation
  - Show escrow transaction status with confirmation polling
  - Display transaction hash with Qubic explorer link
  - Show estimated confirmation time (15s per confirmation)
  - Handle escrow failures with clear error messages
  - Only create job in database after 3 confirmations
  - Notify worker after job is created
  - _Requirements: 6.1, 6.6, 6.7_


- [x] 9. Create JobMonitor real-time dashboard component





  - Create JobMonitor component with 3-column layout
  - Implement left column: Job info (ID, status, GPU, times, cost)
  - Implement center column: Live metrics with charts (GPU util, memory, temp, power)
  - Implement right column: Log stream with auto-scroll and filtering
  - Add WebSocket subscription for job progress updates
  - Display progress bar and time remaining
  - Show current operation string
  - Add bottom section with timeline and action buttons
  - Install Recharts for data visualization
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6, 7.7, 8.1, 8.2, 8.3, 8.4_

- [ ]* 9.1 Write property test for job info completeness
  - **Property 22: Job Info Completeness**
  - **Validates: Requirements 7.2**

- [ ]* 9.2 Write property test for live metrics display
  - **Property 23: Live Metrics Display**
  - **Validates: Requirements 7.3**

- [ ]* 9.3 Write property test for progress information
  - **Property 25: Progress Information**
  - **Validates: Requirements 7.6**

- [ ]* 9.4 Write property test for timeline visualization
  - **Property 26: Timeline Visualization**
  - **Validates: Requirements 7.7**

- [x] 10. Implement real-time metrics streaming backend





  - Create job progress update endpoint accepting metrics from worker
  - Store metrics in JobMetric table with timestamps
  - Store log lines in JobLog table
  - Broadcast progress updates via WebSocket to subscribed clients
  - Calculate time remaining based on progress and elapsed time
  - Calculate cost-so-far based on elapsed time and hourly rate
  - Update job progress and current operation in database
  - Implement metrics aggregation for charts (last 60 seconds)
  - _Requirements: 7.5, 11.2, 11.3_

- [ ]* 10.1 Write property test for metrics update frequency
  - **Property 24: Metrics Update Frequency**
  - **Validates: Requirements 7.5**

- [ ]* 10.2 Write property test for progress report completeness
  - **Property 39: Progress Report Completeness**
  - **Validates: Requirements 11.3**

- [x] 11. Add metrics visualization with Recharts





  - Create GPU utilization line chart (last 60 seconds)
  - Create GPU memory bar chart (used/total)
  - Create temperature gauge with color coding (green <70°C, yellow 70-80°C, red >80°C)
  - Create power usage display with trend
  - Implement threshold warnings (highlight yellow/red when exceeded)
  - Add hover tooltips showing exact values and timestamps
  - Animate chart updates smoothly
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ]* 11.1 Write property test for metrics threshold warnings
  - **Property 27: Metrics Threshold Warnings**
  - **Validates: Requirements 8.5**

- [ ]* 11.2 Write property test for chart hover information
  - **Property 28: Chart Hover Information**
  - **Validates: Requirements 8.6**
-

- [x] 12. Create ProviderEarnings dashboard component




  - Create ProviderEarnings component with earnings summary cards
  - Display total earnings, today's earnings, week, month, pending payouts
  - Show average hourly rate calculation
  - Create earnings history line chart (last 30 days)
  - Create active jobs table with live duration and earnings columns
  - Add transaction history table with explorer links
  - Display performance metrics (uptime, jobs completed, rating)
  - Add WebSocket subscription for live earnings updates
  - _Requirements: 9.1, 9.3, 9.4, 9.5, 9.6, 9.7, 10.1, 10.2, 10.3_

- [ ]* 12.1 Write property test for earnings dashboard completeness
  - **Property 29: Earnings Dashboard Completeness**
  - **Validates: Requirements 9.1**

- [ ]* 12.2 Write property test for active jobs table completeness
  - **Property 31: Active Jobs Table Completeness**
  - **Validates: Requirements 9.4**

- [ ]* 12.3 Write property test for average hourly rate calculation
  - **Property 33: Average Hourly Rate Calculation**
  - **Validates: Requirements 9.6**

- [x] 13. Implement live earnings calculation backend





  - Create provider earnings query endpoint
  - Calculate today's earnings from completed jobs
  - Calculate earnings-so-far for active jobs (elapsed time × hourly rate)
  - Aggregate earnings by day for last 30 days
  - Calculate average hourly rate from all completed jobs
  - Query pending payouts from escrow transactions
  - Broadcast earnings updates via WebSocket every 5 seconds
  - _Requirements: 9.1, 9.2, 9.6_

- [ ]* 13.1 Write property test for live earnings updates
  - **Property 30: Live Earnings Updates**
  - **Validates: Requirements 9.2**

- [x] 14. Create transaction history display





  - Query transactions from database with pagination
  - Display transaction table with date, amount, type, status columns
  - Generate Qubic explorer links for each transaction hash
  - Show pending status with estimated confirmation time
  - Implement auto-update when transaction confirms
  - Add filtering by transaction type (escrow lock, release, refund)
  - Add date range filtering
  - Show transaction details on row click
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [ ]* 14.1 Write property test for transaction display completeness
  - **Property 34: Transaction Display Completeness**
  - **Validates: Requirements 10.2**

- [ ]* 14.2 Write property test for explorer link validity
  - **Property 35: Explorer Link Validity**
  - **Validates: Requirements 10.3**

- [ ]* 14.3 Write property test for transaction status updates
  - **Property 36: Transaction Status Updates**
  - **Validates: Requirements 10.5**

- [x] 15. Enhance Python worker for job execution





  - Update worker to poll for assigned jobs every 5 seconds
  - Implement JobExecutor class with execute_job method
  - Add MNIST training implementation with PyTorch
  - Add Stable Diffusion implementation
  - Add custom script execution with subprocess
  - Report progress every 10 seconds with percentage and operation
  - Collect GPU metrics using nvidia-smi (utilization, memory, temp, power)
  - Upload results to backend on completion
  - Report errors with details on failure
  - Clean up GPU memory after job
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ]* 15.1 Write property test for worker execution timing
  - **Property 37: Worker Execution Timing**
  - **Validates: Requirements 11.1**

- [ ]* 15.2 Write property test for progress report frequency
  - **Property 38: Progress Report Frequency**
  - **Validates: Requirements 11.2**

- [ ]* 15.3 Write property test for job completion notification
  - **Property 40: Job Completion Notification**
  - **Validates: Requirements 11.4**

- [x] 16. Implement job completion and payment release




  - Create job completion endpoint accepting status and results
  - Update job status to completed or failed in database
  - Call escrow release endpoint to send payment to provider
  - Update provider total earnings and job count
  - Broadcast job completion via WebSocket
  - Send completion notification to consumer
  - Handle failure case with refund
  - Store final metrics and results
  - _Requirements: 6.4, 6.5, 11.4_

- [x] 17. Add cost estimation with benchmarks





  - Create benchmarks table with job types and GPU models
  - Populate with benchmark data (MNIST: RTX 4090 = 120s, RTX 3090 = 180s, etc)
  - Implement estimation algorithm with parameter adjustments
  - Adjust for epochs (multiply by epochs/5)
  - Adjust for resolution (multiply by (resolution/512)^2)
  - Adjust for dataset size (multiply by size/10000)
  - Format time as human-readable (5 minutes 30 seconds)
  - Show confidence level based on benchmark availability
  - Display cost breakdown (per-minute rate + total)
  - Recalculate on config changes within 500ms
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ]* 17.1 Write property test for human-readable time format
  - **Property 42: Human-Readable Time Format**
  - **Validates: Requirements 12.2**

- [ ]* 17.2 Write property test for cost breakdown display
  - **Property 44: Cost Breakdown Display**
  - **Validates: Requirements 12.4**

- [ ]* 17.3 Write property test for reactive estimate recalculation
  - **Property 45: Reactive Estimate Recalculation**
  - **Validates: Requirements 12.5**

- [ ]* 17.4 Write property test for parameter-based adjustment
  - **Property 53: Parameter-Based Adjustment**
  - **Validates: Requirements 14.3**

- [x] 18. Implement refresh functionality across all views





  - Add refresh button to marketplace page
  - Add refresh button to jobs list page
  - Add refresh button to earnings page
  - Show loading spinner on button during refresh
  - Fetch latest data from backend on click
  - Update displayed data after successful refresh
  - Show success toast after refresh
  - Show error toast with retry on failure
  - Display "Last updated: X seconds ago" timestamp
  - Implement auto-refresh every 30 seconds
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

- [ ]* 18.1 Write property test for refresh data fetch
  - **Property 46: Refresh Data Fetch**
  - **Validates: Requirements 13.1**

- [ ]* 18.2 Write property test for refresh loading state
  - **Property 47: Refresh Loading State**
  - **Validates: Requirements 13.2**

- [ ]* 18.3 Write property test for refresh success feedback
  - **Property 48: Refresh Success Feedback**
  - **Validates: Requirements 13.3**

- [ ]* 18.4 Write property test for staleness timestamp
  - **Property 49: Staleness Timestamp**
  - **Validates: Requirements 13.5**

- [ ]* 18.5 Write property test for auto-refresh interval
  - **Property 50: Auto-Refresh Interval**
  - **Validates: Requirements 13.6**

- [x] 19. Add job type detection from script content





  - Implement Python script parser to extract imports
  - Detect PyTorch (import torch, from torch)
  - Detect TensorFlow (import tensorflow, from tensorflow)
  - Detect JAX (import jax, from jax)
  - Detect Stable Diffusion (diffusers, stable_diffusion keywords)
  - Detect MNIST (mnist, torchvision.datasets.MNIST keywords)
  - Return detected framework and job type
  - Set confidence level based on detection certainty
  - _Requirements: 14.1, 2.1_

- [ ]* 19.1 Write property test for job type detection from script
  - **Property 51: Job Type Detection from Script**
  - **Validates: Requirements 14.1**

- [x] 20. Implement upload progress tracking





  - Add upload progress callback to file upload
  - Update progress bar percentage (0-100) during upload
  - Show checkmark icon when upload completes
  - Display "Upload complete" message
  - Show "Analyzing..." status with spinner during validation
  - Display detected job type and requirements after validation
  - Handle file size rejection with size limit message
  - Handle format rejection with supported formats list
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

- [ ]* 20.1 Write property test for upload progress display
  - **Property 54: Upload Progress Display**
  - **Validates: Requirements 15.1**

- [ ]* 20.2 Write property test for upload completion indicator
  - **Property 55: Upload Completion Indicator**
  - **Validates: Requirements 15.2**

- [ ]* 20.3 Write property test for validation results display
  - **Property 56: Validation Results Display**
  - **Validates: Requirements 15.4**

- [ ]* 20.4 Write property test for file size rejection
  - **Property 57: File Size Rejection**
  - **Validates: Requirements 15.5**
-

- [x] 21. Polish UI/UX with animations and feedback









  - Install Framer Motion for animations
  - Add smooth transitions to wizard steps
  - Animate GPU cards on hover
  - Add loading skeletons for data fetching
  - Implement toast notifications for all actions
  - Add confirmation dialogs for critical actions (stop job, cancel)
  - Ensure responsive design on mobile and tablet
  - Add keyboard navigation support
  - Test cross-browser compatibility (Chrome, Firefox, Safari, Edge)
  - _Requirements: 6.1, 6.3, 6.4_

- [x] 22. Checkpoint - Test complete job flow end-to-end





  - Upload file and verify analysis
  - Select GPU and verify matching
  - Complete wizard and verify escrow creation
  - Monitor job and verify real-time updates
  - Verify job completion and payment release
  - Check provider earnings update
  - Verify transaction in Qubic explorer
  - Ensure all tests pass, ask the user if questions arise.

- [x] 23. Create demo video and presentation materials





  - Record 5-7 minute demo video following script
  - Show one-click provider onboarding
  - Demonstrate drag-and-drop job submission
  - Highlight smart GPU matching
  - Show real Qubic blockchain transactions
  - Display real-time monitoring dashboard
  - Show provider earnings updating live
  - Emphasize 70% cost savings vs AWS
  - Add captions and background music
  - Export in 1080p HD
  - _Requirements: All_

- [x] 24. Final polish and bug fixes





  - Fix any remaining bugs from testing
  - Optimize performance (lazy loading, code splitting)
  - Add error boundaries for graceful error handling
  - Ensure all loading states are smooth
  - Verify all error messages are helpful
  - Test with slow network conditions
  - Test with large files (500MB)
  - Test with many concurrent jobs
  - _Requirements: All_

- [x] 25. Final Checkpoint - Production readiness





  - Run all unit tests and verify passing
  - Run all property-based tests (100 iterations each)
  - Run integration tests
  - Test on multiple browsers and devices
  - Verify Qubic blockchain integration works
  - Test complete flow 10 times without errors
  - Ensure demo video is ready
  - Prepare submission materials
  - Ensure all tests pass, ask the user if questions arise.

