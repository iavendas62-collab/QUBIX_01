import { Router } from 'express';
import { PrismaClient, JobStatus } from '@prisma/client';
import { transactionService } from '../services/transaction.service';
import multer from 'multer';
import { analyzeJobFile } from '../services/job-analysis.service';

const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max file size
  }
});

// Job assignment timeout in milliseconds (30 seconds as per requirements)
const JOB_ASSIGNMENT_TIMEOUT = 30000;

// Maximum number of reassignment attempts for failed jobs
const MAX_REASSIGNMENT_ATTEMPTS = 3;

export function jobRoutes(services: any) {
  const router = Router();

  /**
   * POST /api/jobs/analyze
   * Analyze uploaded file to detect job type and extract GPU requirements
   * Requirements: 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5
   */
  router.post('/analyze', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      const fileName = req.file.originalname;
      const content = req.file.buffer.toString('utf-8');

      console.log(`📄 Analyzing file: ${fileName} (${req.file.size} bytes)`);

      // Analyze the file
      const analysis = analyzeJobFile(fileName, content);

      console.log(`✅ Analysis complete: ${analysis.jobType} (${analysis.confidence} confidence)`);

      res.json({
        success: true,
        analysis,
        fileName
      });
    } catch (error: any) {
      console.error('Error analyzing file:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/jobs/create
   * Create a new job and attempt to assign it to an available provider
   * Requirements: 4.1, 6.1, 6.6, 11.1, 11.2, 11.3, 11.4
   * 
   * IMPORTANT: This endpoint requires a confirmed escrow transaction hash.
   * The escrow must have 3 confirmations before the job is created.
   */
  router.post('/create', async (req, res) => {
    // If using mock data, return mock job creation
    if (process.env.USE_MOCK_DATA === 'true') {
      const { modelType, computeNeeded, inputData, maxPrice, providerId } = req.body;
      
      if (!modelType || !computeNeeded) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields: modelType, computeNeeded' 
        });
      }

      const estimatedCost = computeNeeded * (maxPrice || 1.0);
      const mockJob = {
        id: String(Math.floor(Math.random() * 10000)),
        userId: 'demo_user',
        modelType,
        status: 'PENDING',
        computeNeeded,
        inputData: inputData || {},
        estimatedCost,
        progress: 0,
        createdAt: new Date().toISOString(),
        providerId: providerId || null
      };

      console.log('✅ Mock job created:', mockJob.id);
      return res.json({ 
        success: true, 
        job: mockJob,
        estimatedCost,
        message: 'Job created successfully (mock mode)'
      });
    }

    try {
      const { 
        modelType, 
        computeNeeded, 
        inputData, 
        maxPrice, 
        qubicAddress,
        escrowTxHash,
        providerId,
        jobAnalysis,
        advancedConfig
      } = req.body;

      // Validate required fields
      if (!modelType || !computeNeeded) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields: modelType, computeNeeded' 
        });
      }

      // Use qubicAddress from body or default for mock data
      const userAddress = qubicAddress || 'DEMO_CONSUMER_ADDRESS_QUBIC_HACKATHON_2024_LABLAB';

      // Requirement 6.1, 6.6: Escrow transaction hash is required (skip for mock data)
      if (!escrowTxHash && process.env.USE_MOCK_DATA !== 'true') {
        return res.status(400).json({
          success: false,
          error: 'Escrow transaction hash is required. Please create escrow first.'
        });
      }

      // Validate computeNeeded is positive
      if (computeNeeded <= 0) {
        return res.status(400).json({
          success: false,
          error: 'computeNeeded must be a positive number'
        });
      }

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { qubicAddress: userAddress }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            qubicAddress: userAddress,
            role: 'CONSUMER'
          }
        });
      }

      // Calculate estimated cost (compute hours * price per hour)
      const estimatedCost = computeNeeded * (maxPrice || 1.0);

      // Validate user has sufficient balance (if balance checking is enabled)
      if (user.balance < estimatedCost) {
        console.warn(`User ${user.id} has insufficient balance: ${user.balance} < ${estimatedCost}`);
        // Note: Not blocking job creation, just logging warning
      }

      console.log(`📋 Creating job for user ${user.qubicAddress}`);
      console.log(`   Escrow TX: ${escrowTxHash || 'MOCK (no escrow)'}`);
      console.log(`   Estimated cost: ${estimatedCost} QUBIC`);

      // Requirement 6.6: Verify escrow has 3 confirmations before creating job (skip for mock data)
      if (escrowTxHash && process.env.USE_MOCK_DATA !== 'true') {
        // Check if escrow transaction exists in database
        const escrowTransaction = await prisma.transaction.findUnique({
          where: { qubicTxHash: escrowTxHash }
        });

        if (!escrowTransaction) {
          return res.status(400).json({
            success: false,
            error: 'Escrow transaction not found. Please ensure escrow is created first.'
          });
        }

        if (escrowTransaction.status !== 'COMPLETED') {
          return res.status(400).json({
            success: false,
            error: 'Escrow transaction not confirmed yet. Please wait for 3 confirmations.',
            confirmations: escrowTransaction.confirmations || 0,
            requiredConfirmations: 3
          });
        }
      }

      // Create job in PENDING status with escrow hash
      const job = await prisma.job.create({
        data: {
          userId: user.id,
          providerId: providerId || null,
          modelType,
          computeNeeded,
          inputData: inputData || {},
          estimatedCost,
          status: JobStatus.PENDING,
          progress: 0,
          escrowTxHash: escrowTxHash,
          // Store job analysis if provided
          jobType: jobAnalysis?.jobType || modelType,
          framework: jobAnalysis?.detectedFramework || null,
          fileName: jobAnalysis?.fileName || 'unknown',
          fileUrl: jobAnalysis?.fileUrl || '',
          requiredVRAM: jobAnalysis?.estimatedVRAM || 0,
          requiredCompute: jobAnalysis?.estimatedCompute || 0,
          requiredRAM: jobAnalysis?.estimatedRAM || 0,
          advancedConfig: advancedConfig || null
        }
      });

      console.log(`✅ Job created: ${job.id}`);
      console.log(`   Escrow confirmed with 3 confirmations`);

      // Attempt to assign job to available provider
      const assignedJob = await assignJobToProvider(job.id, maxPrice, services);

      // Broadcast job creation via WebSocket to notify workers
      if (services.wsManager && assignedJob) {
        services.wsManager.broadcastMarketplaceUpdate({
          type: 'job_created',
          jobId: job.id,
          providerId: assignedJob.providerId
        });
      }

      res.json({ 
        success: true, 
        job: assignedJob || job,
        estimatedCost,
        escrowTxHash: escrowTxHash,
        message: 'Job created successfully and assigned to provider'
      });
    } catch (error: any) {
      console.error('Error creating job:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  /**
   * GET /api/jobs/pending/:workerId
   * Get pending jobs assigned to a specific worker
   * Requirements: 4.2
   */
  router.get('/pending/:workerId', async (req, res) => {
    try {
      const { workerId } = req.params;

      // Find provider by workerId
      const provider = await prisma.provider.findUnique({
        where: { workerId }
      });

      if (!provider) {
        return res.json([]);
      }

      // Get assigned jobs for this provider that haven't started yet
      const jobs = await prisma.job.findMany({
        where: {
          providerId: provider.id,
          status: { in: [JobStatus.ASSIGNED, JobStatus.RUNNING] }
        },
        orderBy: {
          createdAt: 'asc'
        },
        take: 5,
        include: {
          user: {
            select: {
              qubicAddress: true,
              username: true
            }
          }
        }
      });

      console.log(`📋 Worker ${workerId} fetched ${jobs.length} pending jobs`);

      res.json(jobs);
    } catch (error: any) {
      console.error('Error fetching pending jobs:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  });

  /**
   * POST /api/jobs/:jobId/progress
   * Update job progress during execution with metrics and logs
   * Requirements: 7.5, 11.2, 11.3
   * 
   * This endpoint accepts progress updates from workers including:
   * - Progress percentage (0-100)
   * - Current operation string
   * - GPU metrics (utilization, memory, temperature, power)
   * - Log lines
   */
  router.post('/:jobId/progress', async (req, res) => {
    try {
      const { jobId } = req.params;
      const { 
        workerId, 
        progress, 
        currentOperation,
        metrics,
        logLines 
      } = req.body;

      // Validate progress is between 0 and 100
      const validProgress = Math.min(100, Math.max(0, progress || 0));

      // Determine status based on progress
      let newStatus: JobStatus | undefined;
      if (validProgress > 0 && validProgress < 100) {
        newStatus = JobStatus.RUNNING;
      }

      // Get current job to calculate time remaining and cost
      const currentJob = await prisma.job.findUnique({
        where: { id: jobId },
        include: { provider: true }
      });

      if (!currentJob) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      // Calculate time remaining based on progress and elapsed time
      let timeRemaining: number | undefined;
      let costSoFar: number | undefined;
      
      if (currentJob.startedAt && validProgress > 0) {
        const elapsedMs = Date.now() - currentJob.startedAt.getTime();
        const elapsedSeconds = elapsedMs / 1000;
        
        // Estimate total time based on current progress
        const estimatedTotalSeconds = (elapsedSeconds / validProgress) * 100;
        timeRemaining = Math.max(0, estimatedTotalSeconds - elapsedSeconds);
        
        // Calculate cost so far based on elapsed time and hourly rate
        if (currentJob.provider) {
          const elapsedHours = elapsedSeconds / 3600;
          costSoFar = elapsedHours * currentJob.provider.pricePerHour;
        }
      }

      // Update job progress, status, and current operation
      const job = await prisma.job.update({
        where: { id: jobId },
        data: {
          progress: validProgress,
          status: newStatus,
          currentOperation: currentOperation || undefined,
          startedAt: newStatus === JobStatus.RUNNING && !currentJob.startedAt ? new Date() : undefined
        }
      });

      // Store GPU metrics if provided (Requirement 7.5, 11.3)
      if (metrics) {
        await prisma.jobMetric.create({
          data: {
            jobId,
            gpuUtilization: metrics.gpuUtilization,
            gpuMemoryUsed: metrics.gpuMemoryUsed,
            gpuMemoryTotal: metrics.gpuMemoryTotal,
            gpuTemperature: metrics.gpuTemperature,
            powerUsage: metrics.powerUsage
          }
        });
      }

      // Store log lines if provided (Requirement 11.3)
      let storedLogs: any[] = [];
      if (logLines && Array.isArray(logLines)) {
        const logEntries = logLines.map((log: any) => ({
          jobId,
          level: log.level || 'info',
          message: log.message || String(log),
          timestamp: log.timestamp ? new Date(log.timestamp) : new Date()
        }));

        if (logEntries.length > 0) {
          await prisma.jobLog.createMany({
            data: logEntries
          });
          storedLogs = logEntries;
        }
      }

      console.log(`📊 Job ${jobId} progress: ${validProgress}% - ${currentOperation || 'processing'}`);
      if (metrics) {
        console.log(`   GPU: ${metrics.gpuUtilization?.toFixed(1)}% util, ${metrics.gpuTemperature?.toFixed(1)}°C`);
      }

      // Broadcast progress update via WebSocket (Requirement 7.5)
      if (services.wsManager) {
        services.wsManager.broadcastJobProgress(jobId, validProgress, {
          currentOperation,
          metrics,
          timeRemaining,
          costSoFar,
          timestamp: new Date().toISOString()
        });

        // Broadcast logs separately if any were added
        if (storedLogs.length > 0) {
          services.wsManager.broadcastJobLogs(jobId, storedLogs);
        }
      }

      res.json({ 
        success: true,
        timeRemaining,
        costSoFar
      });
    } catch (error: any) {
      console.error('Error updating job progress:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  /**
   * POST /api/jobs/:jobId/complete
   * Mark job as completed or failed, handle payments
   * Requirements: 4.4, 4.5, 4.6, 6.4, 6.5, 11.4
   * 
   * This endpoint:
   * - Accepts job completion status and results from worker
   * - Updates job status to completed or failed in database
   * - Calls escrow release endpoint to send payment to provider (on success)
   * - Calls escrow refund endpoint to refund consumer (on failure)
   * - Updates provider total earnings and job count
   * - Stores final metrics and results
   * - Broadcasts job completion via WebSocket
   * - Sends completion notification to consumer
   */
  router.post('/:jobId/complete', async (req, res) => {
    try {
      const { jobId } = req.params;
      const { workerId, status, result, error, metrics, finalMetrics } = req.body;

      console.log(`📋 Completing job ${jobId} with status: ${status}`);

      // Determine final job status
      const jobStatus = status === 'failed' ? JobStatus.FAILED : JobStatus.COMPLETED;

      // Get current job to check provider
      const currentJob = await prisma.job.findUnique({
        where: { id: jobId },
        include: { 
          provider: true,
          user: true
        }
      });

      if (!currentJob) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      // Verify worker is authorized to complete this job
      if (workerId && currentJob.provider?.workerId !== workerId) {
        return res.status(403).json({
          success: false,
          error: 'Worker not authorized to complete this job'
        });
      }

      // Calculate actual cost based on processing time
      // Requirement 11.4: Calculate actual cost from execution time
      let actualCost: number | undefined;
      let actualDuration: number | undefined;
      
      if (currentJob.startedAt) {
        const completedAt = new Date();
        actualDuration = Math.floor((completedAt.getTime() - currentJob.startedAt.getTime()) / 1000);
        
        if (currentJob.provider && actualDuration !== undefined) {
          const processingHours = actualDuration / 3600;
          actualCost = processingHours * currentJob.provider.pricePerHour;
        }
      } else if (metrics?.processingTimeSeconds && currentJob.provider) {
        actualDuration = metrics.processingTimeSeconds;
        if (actualDuration !== undefined) {
          const processingHours = actualDuration / 3600;
          actualCost = processingHours * currentJob.provider.pricePerHour;
        }
      }
      
      // Ensure actualDuration is set
      if (actualDuration === undefined) {
        actualDuration = 0;
      }

      // Store final metrics if provided
      // Requirement 11.4: Store final metrics and results
      if (finalMetrics) {
        await prisma.jobMetric.create({
          data: {
            jobId,
            gpuUtilization: finalMetrics.gpuUtilization,
            gpuMemoryUsed: finalMetrics.gpuMemoryUsed,
            gpuMemoryTotal: finalMetrics.gpuMemoryTotal,
            gpuTemperature: finalMetrics.gpuTemperature,
            powerUsage: finalMetrics.powerUsage
          }
        });
      }

      // Update job with completion data
      const job = await prisma.job.update({
        where: { id: jobId },
        data: {
          status: jobStatus,
          progress: jobStatus === JobStatus.COMPLETED ? 100 : currentJob.progress,
          result: result || undefined,
          error: error || undefined,
          completedAt: new Date(),
          actualCost: actualCost,
          actualDuration: actualDuration
        },
        include: {
          provider: true,
          user: true
        }
      });

      console.log(`✅ Job ${jobId} ${jobStatus}: ${error || 'success'}`);
      if (actualCost) {
        console.log(`   Actual cost: ${actualCost.toFixed(4)} QUBIC`);
      }
      if (actualDuration) {
        console.log(`   Duration: ${actualDuration}s`);
      }

      // Update provider availability and stats
      // Requirement 6.4: Update provider total earnings and job count
      if (job.providerId) {
        const providerUpdate: any = {
          isAvailable: true,
          currentJobId: null
        };

        // Only increment stats for completed jobs
        if (jobStatus === JobStatus.COMPLETED) {
          providerUpdate.totalJobs = { increment: 1 };
          if (actualCost) {
            providerUpdate.totalEarnings = { increment: actualCost };
          }
        }

        await prisma.provider.update({
          where: { id: job.providerId },
          data: providerUpdate
        });

        console.log(`📊 Provider ${job.provider?.workerId} stats updated`);
      }

      // Handle escrow payment transactions
      let paymentInfo: any = undefined;
      let releaseTxHash: string | undefined;

      if (jobStatus === JobStatus.COMPLETED) {
        // Requirement 6.4: Release escrow to provider on job completion
        console.log(`💰 Releasing escrow to provider...`);
        const releaseResult = await transactionService.releaseEscrow(jobId);
        
        if (releaseResult.success) {
          releaseTxHash = releaseResult.qubicTxHash;
          paymentInfo = {
            amount: releaseResult.releasedAmount,
            status: 'completed',
            transactionId: releaseResult.transactionId,
            qubicTxHash: releaseResult.qubicTxHash
          };
          console.log(`✅ Escrow released: ${releaseResult.releasedAmount} QUBIC to provider`);
          if (releaseTxHash) {
            console.log(`   TX Hash: ${releaseTxHash}`);
          }
        } else {
          console.error(`⚠️ Failed to release escrow: ${releaseResult.error}`);
          // Still mark job as completed, but log the payment issue
          paymentInfo = {
            amount: actualCost || job.estimatedCost,
            status: 'pending',
            error: releaseResult.error
          };
        }
      } else if (jobStatus === JobStatus.FAILED) {
        // Requirement 6.5: Refund escrow to consumer on job failure
        console.log(`🔄 Refunding escrow to consumer...`);
        const refundResult = await transactionService.refundEscrow(jobId);
        
        if (refundResult.success) {
          console.log(`✅ Escrow refunded: ${refundResult.refundedAmount} QUBIC to consumer`);
          paymentInfo = {
            amount: refundResult.refundedAmount,
            status: 'refunded',
            transactionId: refundResult.transactionId,
            qubicTxHash: refundResult.qubicTxHash
          };
        } else {
          console.error(`⚠️ Failed to refund escrow: ${refundResult.error}`);
          paymentInfo = {
            amount: job.estimatedCost,
            status: 'refund_pending',
            error: refundResult.error
          };
        }
        
        // Handle job failure - attempt reassignment
        console.log(`❌ Job ${jobId} failed, attempting reassignment...`);
        await handleJobFailure(job, services);
      }

      // Requirement 11.4: Broadcast job completion via WebSocket
      if (services.wsManager) {
        // Broadcast to job subscribers (consumer monitoring the job)
        services.wsManager.broadcastJobCompleted(jobId, jobStatus, {
          result,
          error,
          actualCost,
          actualDuration,
          releaseTxHash,
          completedAt: job.completedAt
        });

        // Send completion notification to consumer
        // Requirement 11.4: Send completion notification to consumer
        if (job.user) {
          services.wsManager.broadcastToSubscription(`user:${job.userId}`, {
            type: 'JOB_COMPLETION_NOTIFICATION',
            data: {
              jobId: job.id,
              status: jobStatus,
              jobType: job.jobType,
              modelType: job.modelType,
              actualCost,
              actualDuration,
              completedAt: job.completedAt,
              result: jobStatus === JobStatus.COMPLETED ? result : undefined,
              error: jobStatus === JobStatus.FAILED ? error : undefined,
              payment: paymentInfo,
              timestamp: new Date().toISOString()
            }
          });
          console.log(`📬 Completion notification sent to consumer ${job.user.qubicAddress}`);
        }

        // Update provider earnings dashboard if job completed successfully
        if (jobStatus === JobStatus.COMPLETED && job.providerId) {
          services.wsManager.broadcastEarningsUpdate(job.providerId, {
            type: 'job_completed',
            jobId: job.id,
            earnings: actualCost || job.estimatedCost,
            totalEarnings: job.provider?.totalEarnings || 0
          });
        }
      }

      res.json({ 
        success: true,
        job: {
          id: job.id,
          status: job.status,
          completedAt: job.completedAt,
          actualCost,
          actualDuration
        },
        payment: paymentInfo,
        releaseTxHash
      });
    } catch (error: any) {
      console.error('Error completing job:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  /**
   * GET /api/jobs/user/:qubicAddress
   * List jobs for a specific user
   * IMPORTANT: This route must come BEFORE /:jobId to avoid conflicts
   */
  router.get('/user/:qubicAddress', async (req, res) => {
    // Check if mock data should be used
    if (process.env.USE_MOCK_DATA === 'true') {
      console.log('✅ Using mock data (USE_MOCK_DATA=true)');
      const { MOCK_JOBS } = await import('../data/mockData');
      return res.json(MOCK_JOBS);
    }

    try {
      const user = await prisma.user.findUnique({
        where: { qubicAddress: req.params.qubicAddress }
      });

      if (!user) {
        return res.json([]);
      }

      const jobs = await prisma.job.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          provider: {
            select: {
              workerId: true,
              gpuModel: true,
              pricePerHour: true
            }
          }
        }
      });

      res.json(jobs);
    } catch (error: any) {
      // Fallback to mock data if database is not available
      console.log('⚠️ Database error, using mock data for user jobs');
      
      const { MOCK_JOBS } = await import('../data/mockData');
      console.log('✅ Returning', MOCK_JOBS.length, 'mock jobs');
      
      res.json(MOCK_JOBS);
    }
  });

  /**
   * GET /api/jobs/:jobId
   * Get job details by ID
   * IMPORTANT: This route must come AFTER specific routes like /user/:qubicAddress
   */
  router.get('/:jobId', async (req, res) => {
    // Check if mock data should be used
    if (process.env.USE_MOCK_DATA === 'true') {
      console.log('✅ Using mock data (USE_MOCK_DATA=true)');
      const { MOCK_JOBS } = await import('../data/mockData');
      const mockJob = MOCK_JOBS.find(j => j.id === req.params.jobId);
      
      if (mockJob) {
        return res.json(mockJob);
      }
      
      return res.status(404).json({ 
        success: false,
        error: 'Job not found in mock data' 
      });
    }

    try {
      const job = await prisma.job.findUnique({
        where: { id: req.params.jobId },
        include: { 
          provider: true,
          user: {
            select: {
              qubicAddress: true,
              username: true
            }
          }
        }
      });

      if (!job) {
        return res.status(404).json({ 
          success: false,
          error: 'Job not found' 
        });
      }

      res.json(job);
    } catch (error: any) {
      // Fallback to mock data if database is not available
      console.log('⚠️ Database error, using mock data:', error.message);
      
      const { MOCK_JOBS } = await import('../data/mockData');
      const mockJob = MOCK_JOBS.find(j => j.id === req.params.jobId);
      
      if (mockJob) {
        console.log('✅ Returning mock job:', mockJob.id);
        return res.json(mockJob);
      }
      
      res.status(404).json({ 
        success: false,
        error: 'Job not found (database unavailable, mock data not found)' 
      });
    }
  });

  /**
   * GET /api/jobs/:jobId/monitor
   * Get real-time monitoring data for a job including metrics and logs
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
   * 
   * Returns:
   * - Job details (status, progress, current operation)
   * - Latest GPU metrics
   * - Recent log entries
   * - Time remaining and cost so far
   */
  router.get('/:jobId/monitor', async (req, res) => {
    try {
      const { jobId } = req.params;

      // Get job with provider details
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: {
          provider: {
            select: {
              id: true,
              workerId: true,
              gpuModel: true,
              pricePerHour: true
            }
          },
          user: {
            select: {
              qubicAddress: true,
              username: true
            }
          }
        }
      });

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      // Get latest metrics (last 60 seconds for charts)
      const sixtySecondsAgo = new Date(Date.now() - 60000);
      const metrics = await prisma.jobMetric.findMany({
        where: {
          jobId,
          timestamp: { gte: sixtySecondsAgo }
        },
        orderBy: { timestamp: 'desc' },
        take: 30 // ~2 second intervals
      });

      // Get recent logs (last 100 entries)
      const logs = await prisma.jobLog.findMany({
        where: { jobId },
        orderBy: { timestamp: 'desc' },
        take: 100
      });

      // Calculate time remaining and cost so far
      let timeRemaining: number | undefined;
      let costSoFar: number | undefined;

      if (job.startedAt && job.progress > 0 && job.status === JobStatus.RUNNING) {
        const elapsedMs = Date.now() - job.startedAt.getTime();
        const elapsedSeconds = elapsedMs / 1000;
        
        // Estimate total time based on current progress
        const estimatedTotalSeconds = (elapsedSeconds / job.progress) * 100;
        timeRemaining = Math.max(0, estimatedTotalSeconds - elapsedSeconds);
        
        // Calculate cost so far
        if (job.provider) {
          const elapsedHours = elapsedSeconds / 3600;
          costSoFar = elapsedHours * job.provider.pricePerHour;
        }
      }

      // Get latest metric for current values
      const latestMetric = metrics[0];

      res.json({
        success: true,
        job: {
          id: job.id,
          status: job.status,
          progress: job.progress,
          currentOperation: job.currentOperation,
          estimatedCost: job.estimatedCost,
          actualCost: job.actualCost,
          createdAt: job.createdAt,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
          provider: job.provider,
          user: job.user
        },
        metrics: {
          latest: latestMetric || null,
          history: metrics.reverse() // Oldest to newest for charts
        },
        logs: logs.reverse(), // Oldest to newest
        timeRemaining,
        costSoFar
      });
    } catch (error: any) {
      console.error('Error fetching job monitor data:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/jobs/:jobId/metrics
   * Get aggregated metrics for charts (last 60 seconds)
   * Requirements: 7.3, 8.1, 8.2, 8.3, 8.4
   * 
   * Returns metrics aggregated for visualization
   */
  router.get('/:jobId/metrics', async (req, res) => {
    try {
      const { jobId } = req.params;
      const { timeRange = 60 } = req.query; // Default 60 seconds

      const timeRangeMs = parseInt(timeRange as string) * 1000;
      const startTime = new Date(Date.now() - timeRangeMs);

      const metrics = await prisma.jobMetric.findMany({
        where: {
          jobId,
          timestamp: { gte: startTime }
        },
        orderBy: { timestamp: 'asc' }
      });

      res.json({
        success: true,
        metrics,
        timeRange: parseInt(timeRange as string)
      });
    } catch (error: any) {
      console.error('Error fetching job metrics:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/jobs/:jobId/logs
   * Get job logs with optional filtering
   * Requirements: 7.4
   */
  router.get('/:jobId/logs', async (req, res) => {
    try {
      const { jobId } = req.params;
      const { level, limit = 100, offset = 0 } = req.query;

      const where: any = { jobId };
      if (level) {
        where.level = level;
      }

      const logs = await prisma.jobLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string)
      });

      const total = await prisma.jobLog.count({ where });

      res.json({
        success: true,
        logs: logs.reverse(), // Return oldest to newest
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });
    } catch (error: any) {
      console.error('Error fetching job logs:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Route /user/:qubicAddress moved above to avoid conflicts with /:jobId

  /**
   * POST /api/jobs/estimate
   * Calculate estimated cost for a job
   * Requirements: 11.2
   */
  router.post('/estimate', async (req, res) => {
    try {
      const { modelType, computeNeeded, maxPrice, providerId } = req.body;

      // Validate required fields
      if (!computeNeeded || computeNeeded <= 0) {
        return res.status(400).json({
          success: false,
          error: 'computeNeeded must be a positive number'
        });
      }

      // Model type multipliers for cost estimation
      const modelMultipliers: Record<string, number> = {
        'llm-inference': 1.0,
        'image-generation': 1.5,
        'fine-tuning': 2.0,
        'training': 3.0,
        'custom': 1.0
      };

      const multiplier = modelMultipliers[modelType] || 1.0;

      // Get price per hour
      let pricePerHour = maxPrice || 1.0;

      // If specific provider is selected, use their price
      if (providerId) {
        const provider = await prisma.provider.findUnique({
          where: { id: providerId }
        });
        if (provider) {
          pricePerHour = provider.pricePerHour;
        }
      } else if (!maxPrice) {
        // Get average price from available providers
        const avgPrice = await prisma.provider.aggregate({
          where: { isOnline: true, isAvailable: true },
          _avg: { pricePerHour: true }
        });
        pricePerHour = avgPrice._avg.pricePerHour || 1.0;
      }

      // Calculate estimated cost
      const estimatedCost = computeNeeded * pricePerHour * multiplier;

      // Calculate estimated completion time
      const estimatedCompletionTime = new Date(Date.now() + computeNeeded * 60 * 60 * 1000);

      res.json({
        success: true,
        estimate: {
          computeHours: computeNeeded,
          pricePerHour,
          modelMultiplier: multiplier,
          estimatedCost,
          estimatedCompletionTime: estimatedCompletionTime.toISOString()
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
}

/**
 * Assign a job to an available provider
 * Implements job assignment algorithm matching requirements to providers
 * Requirements: 4.1, 11.4
 */
async function assignJobToProvider(jobId: string, maxPrice: number | undefined, services: any) {
  try {
    // Find available providers that meet the criteria
    const availableProvider = await prisma.provider.findFirst({
      where: {
        isOnline: true,
        isAvailable: true,
        pricePerHour: maxPrice ? { lte: maxPrice } : undefined
      },
      orderBy: [
        { pricePerHour: 'asc' }, // Prefer cheaper providers
        { totalJobs: 'asc' }     // Then prefer less busy providers
      ]
    });

    if (availableProvider) {
      // Assign job to provider
      const updatedJob = await prisma.job.update({
        where: { id: jobId },
        data: {
          providerId: availableProvider.id,
          status: JobStatus.ASSIGNED
        },
        include: {
          provider: true,
          user: true
        }
      });

      // Mark provider as busy
      await prisma.provider.update({
        where: { id: availableProvider.id },
        data: {
          isAvailable: false,
          currentJobId: jobId
        }
      });

      console.log(`✅ Job ${jobId} assigned to provider ${availableProvider.workerId}`);

      // Broadcast marketplace update
      if (services.wsManager) {
        services.wsManager.broadcastMarketplaceUpdate({
          type: 'provider_busy',
          providerId: availableProvider.id
        });
      }

      return updatedJob;
    } else {
      console.log(`⏳ No available provider for job ${jobId}, will retry on next heartbeat`);
      
      // Set a timeout to mark job as unassignable if not assigned within 30 seconds
      setTimeout(async () => {
        const job = await prisma.job.findUnique({ where: { id: jobId } });
        if (job && job.status === JobStatus.PENDING) {
          console.warn(`⚠️ Job ${jobId} could not be assigned within timeout`);
          // Job remains in PENDING state for manual intervention or future assignment
        }
      }, JOB_ASSIGNMENT_TIMEOUT);

      // Return job in pending state
      return prisma.job.findUnique({
        where: { id: jobId },
        include: { provider: true, user: true }
      });
    }
  } catch (error) {
    console.error('Error assigning job to provider:', error);
    throw error;
  }
}

/**
 * Handle job failure by attempting reassignment to another provider
 * Requirements: 4.5, 11.4
 */
async function handleJobFailure(job: any, services: any) {
  try {
    // Check if we've already tried reassigning too many times
    // We track this by counting how many times the job has been assigned
    const failureCount = await prisma.job.count({
      where: {
        id: job.id,
        status: JobStatus.FAILED
      }
    });

    // For now, we'll use a simple approach: check the error field for reassignment attempts
    const reassignmentAttempts = job.error?.match(/Reassignment attempt (\d+)/)?.[1] || 0;

    if (reassignmentAttempts >= MAX_REASSIGNMENT_ATTEMPTS) {
      console.error(`❌ Job ${job.id} exceeded max reassignment attempts (${MAX_REASSIGNMENT_ATTEMPTS})`);
      return;
    }

    // Reset job to PENDING status for reassignment
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: JobStatus.PENDING,
        providerId: null,
        progress: 0,
        error: `Reassignment attempt ${parseInt(reassignmentAttempts) + 1} after failure: ${job.error || 'Unknown error'}`
      }
    });

    console.log(`🔄 Attempting to reassign job ${job.id} (attempt ${parseInt(reassignmentAttempts) + 1})`);

    // Try to assign to a different provider
    // Extract maxPrice from estimatedCost (rough approximation)
    const maxPrice = job.estimatedCost / job.computeNeeded;
    await assignJobToProvider(job.id, maxPrice, services);

  } catch (error) {
    console.error('Error handling job failure:', error);
  }
}
