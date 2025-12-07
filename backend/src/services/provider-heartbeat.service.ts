/**
 * Provider Heartbeat Service
 * 
 * Manages provider heartbeat processing and timeout detection.
 * Requirements: 5.1, 5.2, 5.3
 * 
 * - Heartbeat interval: 30 seconds (expected from workers)
 * - Timeout threshold: 3 missed heartbeats (90 seconds)
 * - Marks providers offline after timeout
 * - Broadcasts status changes via WebSocket
 */

import { PrismaClient, Provider, ProviderMetric } from '@prisma/client';
import { logProviderEvent, providerLogger } from './logger';

const prisma = new PrismaClient();

// Configuration
const HEARTBEAT_INTERVAL_MS = 30 * 1000; // 30 seconds expected heartbeat interval
const MISSED_HEARTBEATS_THRESHOLD = 3; // Mark offline after 3 missed heartbeats
const TIMEOUT_MS = HEARTBEAT_INTERVAL_MS * MISSED_HEARTBEATS_THRESHOLD; // 90 seconds
const CHECK_INTERVAL_MS = 30 * 1000; // Check for timeouts every 30 seconds

// Resource usage interface matching worker heartbeat data
export interface ResourceUsage {
  cpuPercent: number;
  ramPercent: number;
  ramUsedGb?: number;
  ramTotalGb?: number;
  gpuPercent?: number;
  gpuTemp?: number;
  gpuMemUsedMb?: number;
  gpuMemTotalMb?: number;
  timestamp?: string;
}

// Heartbeat request interface
export interface HeartbeatRequest {
  workerId: string;
  usage?: ResourceUsage;
  status?: 'online' | 'offline' | 'busy';
  currentJob?: string;
}

// Heartbeat response interface
export interface HeartbeatResponse {
  success: boolean;
  pendingJobs: any[];
  error?: string;
}

export class ProviderHeartbeatService {
  private wsManager: any;
  private timeoutCheckInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(wsManager?: any) {
    this.wsManager = wsManager;
  }

  /**
   * Set the WebSocket manager for broadcasting updates
   */
  setWsManager(wsManager: any) {
    this.wsManager = wsManager;
  }

  /**
   * Start the timeout detection background process
   */
  start() {
    if (this.isRunning) {
      providerLogger.warn('Provider heartbeat service already running');
      return;
    }

    this.isRunning = true;
    providerLogger.info({
      heartbeatIntervalMs: HEARTBEAT_INTERVAL_MS,
      timeoutMs: TIMEOUT_MS,
      missedHeartbeatsThreshold: MISSED_HEARTBEATS_THRESHOLD,
    }, 'Provider heartbeat service started');

    // Start periodic timeout check
    this.timeoutCheckInterval = setInterval(() => {
      this.checkForTimeouts();
    }, CHECK_INTERVAL_MS);

    // Run initial check
    this.checkForTimeouts();
  }

  /**
   * Stop the timeout detection background process
   */
  stop() {
    if (this.timeoutCheckInterval) {
      clearInterval(this.timeoutCheckInterval);
      this.timeoutCheckInterval = null;
    }
    this.isRunning = false;
    providerLogger.info('Provider heartbeat service stopped');
  }

  /**
   * Process a heartbeat from a worker
   * Requirements: 5.1, 5.2
   */
  async processHeartbeat(request: HeartbeatRequest): Promise<HeartbeatResponse> {
    const { workerId, usage, status, currentJob } = request;

    try {
      // Find provider by workerId
      const provider = await prisma.provider.findUnique({
        where: { workerId }
      });

      if (!provider) {
        return {
          success: false,
          pendingJobs: [],
          error: 'Provider not found'
        };
      }

      // Determine new status
      const wasOnline = provider.isOnline;
      const isOnline = status !== 'offline';
      const isAvailable = status === 'online' && !currentJob;
      const isBusy = status === 'busy' || !!currentJob;

      // Update provider status and last heartbeat
      const updatedProvider = await prisma.provider.update({
        where: { workerId },
        data: {
          isOnline,
          isAvailable: isOnline && !isBusy,
          lastHeartbeat: new Date(),
          currentJobId: currentJob || null
        }
      });

      // Store metrics if provided (Requirements: 5.1, 5.2)
      if (usage) {
        await this.storeMetrics(provider.id, usage);
      }

      // Broadcast status change if status changed
      if (!wasOnline && isOnline) {
        // Provider came online
        this.broadcastStatusChange(provider.id, {
          isOnline: true,
          isAvailable: updatedProvider.isAvailable,
          lastHeartbeat: updatedProvider.lastHeartbeat,
          event: 'PROVIDER_ONLINE'
        });
      } else if (wasOnline && !isOnline) {
        // Provider went offline
        this.broadcastStatusChange(provider.id, {
          isOnline: false,
          isAvailable: false,
          lastHeartbeat: updatedProvider.lastHeartbeat,
          event: 'PROVIDER_OFFLINE'
        });
      }

      // Broadcast metrics update via WebSocket
      if (this.wsManager && usage) {
        this.wsManager.broadcastGPUMetricsUpdate(provider.id, usage);
      }

      // Get pending jobs for this worker
      const pendingJobs = await prisma.job.findMany({
        where: {
          providerId: provider.id,
          status: { in: ['ASSIGNED', 'PENDING'] }
        },
        orderBy: { createdAt: 'asc' },
        take: 5 // Limit to 5 pending jobs
      });

      return {
        success: true,
        pendingJobs
      };
    } catch (error: any) {
      providerLogger.error({ error: error.message, workerId }, 'Error processing heartbeat');
      return {
        success: false,
        pendingJobs: [],
        error: error.message || 'Internal server error'
      };
    }
  }

  /**
   * Store metrics in ProviderMetric table
   * Requirements: 5.1, 5.2
   */
  private async storeMetrics(providerId: string, usage: ResourceUsage): Promise<ProviderMetric> {
    return prisma.providerMetric.create({
      data: {
        providerId,
        cpuPercent: usage.cpuPercent || 0,
        ramPercent: usage.ramPercent || 0,
        gpuPercent: usage.gpuPercent ?? null,
        gpuTemp: usage.gpuTemp ?? null,
        gpuMemUsed: usage.gpuMemUsedMb ? usage.gpuMemUsedMb / 1024 : null // Convert MB to GB
      }
    });
  }

  /**
   * Check for providers that have timed out (missed 3+ heartbeats)
   * Requirements: 5.3 - Mark offline after 3 missed heartbeats
   */
  private async checkForTimeouts() {
    try {
      const timeoutThreshold = new Date(Date.now() - TIMEOUT_MS);

      // Find online providers that haven't sent a heartbeat within the timeout period
      const timedOutProviders = await prisma.provider.findMany({
        where: {
          isOnline: true,
          lastHeartbeat: {
            lt: timeoutThreshold
          }
        }
      });

      if (timedOutProviders.length === 0) {
        return;
      }

      providerLogger.warn({ count: timedOutProviders.length }, 'Found timed out providers');

      // Mark each timed out provider as offline
      for (const provider of timedOutProviders) {
        await this.markProviderOffline(provider);
      }
    } catch (error: any) {
      providerLogger.error({ error: error.message }, 'Error checking for provider timeouts');
    }
  }

  /**
   * Mark a provider as offline due to timeout
   */
  private async markProviderOffline(provider: Provider) {
    const timeSinceLastHeartbeat = provider.lastHeartbeat 
      ? Math.round((Date.now() - provider.lastHeartbeat.getTime()) / 1000)
      : 'unknown';

    logProviderEvent({
      event: 'timeout',
      workerId: provider.workerId,
      providerId: provider.id,
    });

    // Update provider status
    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        isOnline: false,
        isAvailable: false
      }
    });

    // Broadcast status change via WebSocket
    this.broadcastStatusChange(provider.id, {
      isOnline: false,
      isAvailable: false,
      lastHeartbeat: provider.lastHeartbeat,
      event: 'PROVIDER_TIMEOUT',
      reason: `No heartbeat for ${timeSinceLastHeartbeat} seconds`
    });

    // If provider had an active job, handle job reassignment
    if (provider.currentJobId) {
      await this.handleJobReassignment(provider.currentJobId, provider.id);
    }
  }

  /**
   * Handle job reassignment when a provider times out
   */
  private async handleJobReassignment(jobId: string, providerId: string) {
    try {
      const job = await prisma.job.findUnique({
        where: { id: jobId }
      });

      if (job && (job.status === 'RUNNING' || job.status === 'ASSIGNED')) {
        providerLogger.info({ jobId, providerId }, 'Reassigning job due to provider timeout');

        // Mark job as pending for reassignment
        await prisma.job.update({
          where: { id: jobId },
          data: {
            status: 'PENDING',
            providerId: null,
            error: `Provider ${providerId} timed out, job queued for reassignment`
          }
        });

        // Broadcast job status change
        if (this.wsManager) {
          this.wsManager.broadcastJobProgress(jobId, job.progress, {
            status: 'PENDING',
            reason: 'Provider timeout - awaiting reassignment'
          });
        }
      }
    } catch (error: any) {
      providerLogger.error({ error: error.message, jobId }, 'Error handling job reassignment');
    }
  }

  /**
   * Broadcast provider status change via WebSocket
   */
  private broadcastStatusChange(providerId: string, status: any) {
    if (this.wsManager) {
      this.wsManager.broadcastProviderStatusChanged(providerId, status);
    }
  }

  /**
   * Get service statistics
   */
  async getStats() {
    const now = new Date();
    const recentThreshold = new Date(now.getTime() - HEARTBEAT_INTERVAL_MS * 2);

    const [totalProviders, onlineProviders, recentHeartbeats] = await Promise.all([
      prisma.provider.count(),
      prisma.provider.count({ where: { isOnline: true } }),
      prisma.provider.count({
        where: {
          lastHeartbeat: { gte: recentThreshold }
        }
      })
    ]);

    return {
      totalProviders,
      onlineProviders,
      recentHeartbeats,
      timeoutThresholdSeconds: TIMEOUT_MS / 1000,
      heartbeatIntervalSeconds: HEARTBEAT_INTERVAL_MS / 1000,
      isRunning: this.isRunning
    };
  }
}

// Singleton instance
let heartbeatServiceInstance: ProviderHeartbeatService | null = null;

export function getHeartbeatService(wsManager?: any): ProviderHeartbeatService {
  if (!heartbeatServiceInstance) {
    heartbeatServiceInstance = new ProviderHeartbeatService(wsManager);
  } else if (wsManager) {
    heartbeatServiceInstance.setWsManager(wsManager);
  }
  return heartbeatServiceInstance;
}

export function startHeartbeatService(wsManager?: any): ProviderHeartbeatService {
  const service = getHeartbeatService(wsManager);
  service.start();
  return service;
}
