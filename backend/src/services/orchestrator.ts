// ============================================
// QUBIX ORCHESTRATOR
// Sistema central que gerencia workers e jobs
// ============================================

import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// TYPES
// ============================================

interface WorkerSpecs {
  worker_id: string;
  hostname: string;
  cpu_cores_logical: number;
  ram_total_gb: number;
  gpu_count: number;
  gpu_models: Array<{
    name: string;
    vram_gb: number;
  }>;
  storage_free_gb: number;
}

interface WorkerRegistration {
  worker_id: string;
  specs: WorkerSpecs;
  pricing: {
    price_per_hour: number;
    minimum_duration: number;
  };
  availability: {
    hours_per_day: number;
    timezone: string;
  };
  connected_at: Date;
  last_heartbeat: Date;
}

interface Worker extends WorkerRegistration {
  ws: WebSocket;
  current_job_id?: string;
  reputation_score: number;
  total_jobs_completed: number;
  total_earnings: number;
  average_rating: number;
}

interface Job {
  id: string;
  consumer_id: string;
  job_type: 'training' | 'inference' | 'fine-tuning' | 'evaluation';
  model_type: string;
  dataset_url?: string;
  requirements: {
    min_cpu_cores: number;
    min_ram_gb: number;
    min_gpu_vram_gb: number;
    estimated_hours: number;
  };
  pricing: {
    max_price_per_hour: number;
    total_budget: number;
  };
  status: 'pending' | 'matched' | 'running' | 'completed' | 'failed' | 'cancelled';
  assigned_worker_id?: string;
  progress: number;
  created_at: Date;
  started_at?: Date;
  completed_at?: Date;
  result_url?: string;
  error?: string;
}

// ============================================
// ORCHESTRATOR CLASS
// ============================================

export class QubixOrchestrator {
  private wss: WebSocketServer;
  private redis: Redis;
  private workers: Map<string, Worker> = new Map();
  private jobs: Map<string, Job> = new Map();
  private jobQueue: Job[] = [];

  constructor(port: number = 8080) {
    // WebSocket server
    const server = createServer();
    this.wss = new WebSocketServer({ server });

    // Redis for distributed state
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });

    this.setupWebSocketHandlers();
    this.startHeartbeatChecker();
    this.startJobMatcher();

    server.listen(port, () => {
      console.log(`╔═══════════════════════════════════════╗`);
      console.log(`║   🎯 QUBIX ORCHESTRATOR              ║`);
      console.log(`║   Port: ${port}                         ║`);
      console.log(`║   Status: Running ✅                  ║`);
      console.log(`╚═══════════════════════════════════════╝`);
    });
  }

  // ============================================
  // WEBSOCKET HANDLERS
  // ============================================

  private setupWebSocketHandlers() {
    this.wss.on('connection', (ws: WebSocket, req) => {
      console.log('🔌 New WebSocket connection');

      ws.on('message', async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleMessage(ws, message);
        } catch (error) {
          console.error('❌ Error handling message:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        this.handleWorkerDisconnect(ws);
      });

      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
      });
    });
  }

  private async handleMessage(ws: WebSocket, message: any) {
    const { type } = message;

    switch (type) {
      case 'register':
        await this.handleWorkerRegistration(ws, message);
        break;
      case 'heartbeat':
        await this.handleHeartbeat(ws, message);
        break;
      case 'job_accepted':
        await this.handleJobAccepted(message);
        break;
      case 'job_status':
        await this.handleJobStatus(message);
        break;
      case 'job_result':
        await this.handleJobResult(message);
        break;
      default:
        console.warn(`⚠️  Unknown message type: ${type}`);
    }
  }

  // ============================================
  // WORKER MANAGEMENT
  // ============================================

  private async handleWorkerRegistration(ws: WebSocket, message: any) {
    const { worker_id, specs, pricing, availability } = message;

    console.log(`✅ Registering worker: ${worker_id}`);

    const worker: Worker = {
      worker_id,
      specs,
      pricing,
      availability,
      ws,
      connected_at: new Date(),
      last_heartbeat: new Date(),
      reputation_score: 1000,
      total_jobs_completed: 0,
      total_earnings: 0,
      average_rating: 5.0,
    };

    this.workers.set(worker_id, worker);

    // Store in Redis for persistence
    await this.redis.hset('workers', worker_id, JSON.stringify({
      specs,
      pricing,
      availability,
      reputation_score: worker.reputation_score,
    }));

    // Send confirmation
    this.send(ws, {
      type: 'registration_response',
      status: 'registered',
      worker_id,
      message: 'Successfully registered with QUBIX Orchestrator',
    });

    console.log(`📊 Total workers online: ${this.workers.size}`);

    // Try to match pending jobs
    await this.matchPendingJobs();
  }

  private async handleHeartbeat(ws: WebSocket, message: any) {
    const { worker_id, usage } = message;
    const worker = this.workers.get(worker_id);

    if (worker) {
      worker.last_heartbeat = new Date();

      // Store usage metrics in Redis
      await this.redis.hset(`worker:${worker_id}:usage`, {
        cpu: usage.cpu_usage_percent,
        ram: usage.ram_usage_percent,
        gpu: usage.gpu_usage_percent,
        timestamp: usage.timestamp,
      });
    }
  }

  private handleWorkerDisconnect(ws: WebSocket) {
    // Find worker by WebSocket
    for (const [worker_id, worker] of this.workers.entries()) {
      if (worker.ws === ws) {
        console.log(`🔌 Worker disconnected: ${worker_id}`);

        // If worker had a running job, mark it as failed
        if (worker.current_job_id) {
          const job = this.jobs.get(worker.current_job_id);
          if (job && job.status === 'running') {
            job.status = 'failed';
            job.error = 'Worker disconnected unexpectedly';
            this.jobQueue.push(job); // Re-queue job
          }
        }

        this.workers.delete(worker_id);
        console.log(`📊 Total workers online: ${this.workers.size}`);
        break;
      }
    }
  }

  private startHeartbeatChecker() {
    setInterval(() => {
      const now = Date.now();
      const timeout = 60000; // 60 seconds

      for (const [worker_id, worker] of this.workers.entries()) {
        const timeSinceHeartbeat = now - worker.last_heartbeat.getTime();

        if (timeSinceHeartbeat > timeout) {
          console.log(`⚠️  Worker ${worker_id} missed heartbeat, removing...`);
          this.workers.delete(worker_id);
          worker.ws.close();
        }
      }
    }, 30000); // Check every 30 seconds
  }

  // ============================================
  // JOB MANAGEMENT
  // ============================================

  async submitJob(jobRequest: Omit<Job, 'id' | 'status' | 'progress' | 'created_at'>): Promise<Job> {
    const job: Job = {
      ...jobRequest,
      id: uuidv4(),
      status: 'pending',
      progress: 0,
      created_at: new Date(),
    };

    this.jobs.set(job.id, job);
    this.jobQueue.push(job);

    console.log(`📝 New job submitted: ${job.id} (${job.job_type})`);

    // Store in Redis
    await this.redis.hset('jobs', job.id, JSON.stringify(job));

    // Try immediate matching
    await this.matchPendingJobs();

    return job;
  }

  private async matchPendingJobs() {
    console.log(`🔍 Matching ${this.jobQueue.length} pending jobs...`);

    const jobsToRemove: number[] = [];

    for (let i = 0; i < this.jobQueue.length; i++) {
      const job = this.jobQueue[i];
      const worker = this.findBestWorkerForJob(job);

      if (worker) {
        await this.assignJobToWorker(job, worker);
        jobsToRemove.push(i);
      }
    }

    // Remove matched jobs from queue
    jobsToRemove.reverse().forEach(index => {
      this.jobQueue.splice(index, 1);
    });
  }

  private findBestWorkerForJob(job: Job): Worker | null {
    const { requirements, pricing } = job;

    // Filter workers by requirements
    const suitableWorkers = Array.from(this.workers.values()).filter(worker => {
      // Check if worker is available
      if (worker.current_job_id) return false;

      // Check hardware requirements
      if (worker.specs.cpu_cores_logical < requirements.min_cpu_cores) return false;
      if (worker.specs.ram_total_gb < requirements.min_ram_gb) return false;

      // Check GPU requirements
      if (requirements.min_gpu_vram_gb > 0) {
        const totalVram = worker.specs.gpu_models.reduce((sum, gpu) => sum + gpu.vram_gb, 0);
        if (totalVram < requirements.min_gpu_vram_gb) return false;
      }

      // Check pricing
      if (worker.pricing.price_per_hour > pricing.max_price_per_hour) return false;

      return true;
    });

    if (suitableWorkers.length === 0) {
      return null;
    }

    // Rank workers by score (price + reputation)
    suitableWorkers.sort((a, b) => {
      const scoreA = this.calculateWorkerScore(a, job);
      const scoreB = this.calculateWorkerScore(b, job);
      return scoreB - scoreA; // Higher score is better
    });

    return suitableWorkers[0];
  }

  private calculateWorkerScore(worker: Worker, job: Job): number {
    // Lower price is better (inverted)
    const priceScore = (job.pricing.max_price_per_hour - worker.pricing.price_per_hour) * 10;

    // Higher reputation is better
    const reputationScore = worker.reputation_score / 100;

    // Higher rating is better
    const ratingScore = worker.average_rating * 20;

    // More completed jobs is better (experience)
    const experienceScore = Math.min(worker.total_jobs_completed / 10, 10);

    return priceScore + reputationScore + ratingScore + experienceScore;
  }

  private async assignJobToWorker(job: Job, worker: Worker) {
    console.log(`✅ Matching job ${job.id} to worker ${worker.worker_id}`);

    job.status = 'matched';
    job.assigned_worker_id = worker.worker_id;
    worker.current_job_id = job.id;

    // Send job to worker
    this.send(worker.ws, {
      type: 'job_assigned',
      job: {
        id: job.id,
        type: job.job_type,
        model_type: job.model_type,
        dataset_url: job.dataset_url,
        requirements: job.requirements,
        total_payment: job.pricing.total_budget,
      },
    });

    // Update Redis
    await this.redis.hset('jobs', job.id, JSON.stringify(job));
  }

  private async handleJobAccepted(message: any) {
    const { job_id, worker_id } = message;
    const job = this.jobs.get(job_id);

    if (job) {
      job.status = 'running';
      job.started_at = new Date();

      console.log(`🚀 Job ${job_id} started by worker ${worker_id}`);

      await this.redis.hset('jobs', job_id, JSON.stringify(job));
    }
  }

  private async handleJobStatus(message: any) {
    const { job_id, status, progress, error } = message;
    const job = this.jobs.get(job_id);

    if (job) {
      job.status = status;
      job.progress = progress;
      if (error) job.error = error;

      console.log(`📊 Job ${job_id} status: ${status} (${progress}%)`);

      await this.redis.hset('jobs', job_id, JSON.stringify(job));

      // Notify consumer via webhook or WebSocket
      // TODO: Implement consumer notification
    }
  }

  private async handleJobResult(message: any) {
    const { job_id, result_url, metrics } = message;
    const job = this.jobs.get(job_id);
    if (!job) return;

    const worker = this.workers.get(job.assigned_worker_id!);
    if (!worker) return;

    job.status = 'completed';
    job.completed_at = new Date();
    job.result_url = result_url;
    job.progress = 100;

    console.log(`✅ Job ${job_id} completed! Result: ${result_url}`);

    // Update worker stats
    worker.current_job_id = undefined;
    worker.total_jobs_completed++;
    worker.total_earnings += job.pricing.total_budget;

    // Store result
    await this.redis.hset('jobs', job_id, JSON.stringify(job));
    await this.redis.hset(`job:${job_id}:result`, {
      url: result_url,
      metrics: JSON.stringify(metrics),
      completed_at: job.completed_at.toISOString(),
    });

    // Process payment (integrate with Qubic smart contract)
    await this.processPayment(job, worker);

    // Try to match more pending jobs
    await this.matchPendingJobs();
  }

  private async processPayment(job: Job, worker: Worker) {
    console.log(`💰 Processing payment for job ${job.id}`);
    console.log(`   Amount: ${job.pricing.total_budget} QUBIC`);
    console.log(`   To: ${worker.worker_id}`);

    // TODO: Integrate with Qubic smart contract
    // Release escrow to worker
    // Deduct platform fee (5%)
    // Record transaction
  }

  private startJobMatcher() {
    // Periodically try to match pending jobs
    setInterval(async () => {
      if (this.jobQueue.length > 0) {
        await this.matchPendingJobs();
      }
    }, 10000); // Every 10 seconds
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  private send(ws: WebSocket, data: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  private sendError(ws: WebSocket, error: string) {
    this.send(ws, {
      type: 'error',
      error,
      timestamp: new Date().toISOString(),
    });
  }

  // ============================================
  // PUBLIC API
  // ============================================

  getWorkerStats() {
    return {
      total_workers: this.workers.size,
      workers_with_jobs: Array.from(this.workers.values()).filter(w => w.current_job_id).length,
      total_compute_available: Array.from(this.workers.values()).reduce(
        (sum, w) => sum + (w.current_job_id ? 0 : w.specs.cpu_cores_logical), 0
      ),
    };
  }

  getJobStats() {
    return {
      total_jobs: this.jobs.size,
      pending: this.jobQueue.length,
      running: Array.from(this.jobs.values()).filter(j => j.status === 'running').length,
      completed: Array.from(this.jobs.values()).filter(j => j.status === 'completed').length,
      failed: Array.from(this.jobs.values()).filter(j => j.status === 'failed').length,
    };
  }
}

// ============================================
// START ORCHESTRATOR
// ============================================

const orchestrator = new QubixOrchestrator(8080);

export { orchestrator };
