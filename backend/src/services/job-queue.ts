import Queue from 'bull';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class JobQueue {
  private queue: Queue.Queue;
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    
    this.queue = new Queue('compute-jobs', {
      redis: {
        host: process.env.REDIS_URL?.split('://')[1]?.split(':')[0] || 'localhost',
        port: parseInt(process.env.REDIS_URL?.split(':')[2] || '6379')
      }
    });

    this.setupProcessors();
  }

  private setupProcessors() {
    this.queue.process('compute', async (job) => {
      console.log(`Processing job ${job.id}:`, job.data);
      
      // Update job status
      await prisma.job.update({
        where: { id: job.data.jobId },
        data: { status: 'RUNNING', startedAt: new Date() }
      });

      // Simulate compute work
      await this.simulateCompute(job.data);

      // Update completion
      await prisma.job.update({
        where: { id: job.data.jobId },
        data: { 
          status: 'COMPLETED', 
          completedAt: new Date(),
          result: 'model_output.pt'
        }
      });

      return { success: true };
    });

    this.queue.on('completed', (job) => {
      console.log(`✅ Job ${job.id} completed`);
    });

    this.queue.on('failed', (job, err) => {
      console.error(`❌ Job ${job.id} failed:`, err);
    });
  }

  private async simulateCompute(data: any): Promise<void> {
    // Simulate AI training/inference
    return new Promise(resolve => setTimeout(resolve, 5000));
  }

  async addJob(jobData: any): Promise<string> {
    const job = await this.queue.add('compute', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });

    return job.id.toString();
  }

  async getJobStatus(jobId: string): Promise<any> {
    const job = await this.queue.getJob(jobId);
    if (!job) return null;

    return {
      id: job.id,
      status: await job.getState(),
      progress: job.progress(),
      data: job.data
    };
  }

  async matchJobWithProvider(jobId: string): Promise<string | null> {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return null;

    // Find best available provider based on VRAM and price
    const provider = await prisma.provider.findFirst({
      where: {
        isOnline: true,
        isAvailable: true,
        gpuVram: { gte: job.computeNeeded }
      },
      orderBy: [
        { totalJobs: 'desc' },
        { pricePerHour: 'asc' }
      ]
    });

    if (provider) {
      await prisma.job.update({
        where: { id: jobId },
        data: { 
          providerId: provider.id,
          status: 'ASSIGNED'
        }
      });
      return provider.id;
    }

    return null;
  }
}
