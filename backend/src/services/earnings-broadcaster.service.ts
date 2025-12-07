import { PrismaClient } from '@prisma/client';
import { getLiveEarningsUpdate } from './earnings.service';
import { WebSocketManager } from '../websocket';

const prisma = new PrismaClient();

/**
 * Service to broadcast live earnings updates via WebSocket
 * Requirements: 9.2 - Broadcast earnings updates every 5 seconds
 */
export class EarningsBroadcaster {
  private wsManager: WebSocketManager;
  private intervalId: NodeJS.Timeout | null = null;
  private broadcastInterval: number = 5000; // 5 seconds
  private isRunning: boolean = false;

  constructor(wsManager: WebSocketManager) {
    this.wsManager = wsManager;
  }

  /**
   * Start broadcasting earnings updates
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Earnings broadcaster already running');
      return;
    }

    console.log('📊 Starting earnings broadcaster (5 second interval)');
    this.isRunning = true;

    this.intervalId = setInterval(async () => {
      await this.broadcastAllActiveProviderEarnings();
    }, this.broadcastInterval);
  }

  /**
   * Stop broadcasting earnings updates
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('📊 Earnings broadcaster stopped');
    }
  }

  /**
   * Broadcast earnings for all providers with active jobs or subscribers
   */
  private async broadcastAllActiveProviderEarnings() {
    try {
      // Skip if database is not available (Railway deployment)
      if (!process.env.DATABASE_URL) {
        console.log('⚠️ Database not configured, skipping earnings broadcast');
        return;
      }

      // Get all providers with running jobs
      const providersWithActiveJobs = await prisma.provider.findMany({
        where: {
          jobs: {
            some: {
              status: 'RUNNING'
            }
          }
        },
        select: {
          id: true
        }
      });

      // Broadcast earnings for each provider
      for (const provider of providersWithActiveJobs) {
        await this.broadcastProviderEarnings(provider.id);
      }
    } catch (error) {
      console.error('Error broadcasting earnings:', error);
    }
  }

  /**
   * Broadcast earnings for a specific provider
   */
  async broadcastProviderEarnings(providerId: string) {
    try {
      const liveUpdate = await getLiveEarningsUpdate(providerId);
      
      this.wsManager.broadcastEarningsUpdate(providerId, liveUpdate);
    } catch (error) {
      console.error(`Error broadcasting earnings for provider ${providerId}:`, error);
    }
  }

  /**
   * Get broadcaster status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      broadcastInterval: this.broadcastInterval
    };
  }
}

// Singleton instance
let broadcasterInstance: EarningsBroadcaster | null = null;

/**
 * Get or create earnings broadcaster instance
 */
export function getEarningsBroadcaster(wsManager: WebSocketManager): EarningsBroadcaster {
  if (!broadcasterInstance) {
    broadcasterInstance = new EarningsBroadcaster(wsManager);
  }
  return broadcasterInstance;
}
