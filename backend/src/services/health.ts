/**
 * Health Check and Monitoring Service
 * 
 * Provides comprehensive health checks for:
 * - Database connectivity
 * - WebSocket server status
 * - Qubic blockchain connection
 * - System resources
 * 
 * Requirements: 3.5 - Monitoring and logging
 */

import { PrismaClient } from '@prisma/client';
import { dbLogger, logger } from './logger';

const prisma = new PrismaClient();

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: ComponentHealth;
    websocket: ComponentHealth;
    blockchain: ComponentHealth;
  };
  metrics?: SystemMetrics;
}

export interface ComponentHealth {
  status: 'up' | 'down' | 'degraded';
  latency?: number;
  message?: string;
  lastCheck: string;
}

export interface SystemMetrics {
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  cpuUsage?: NodeJS.CpuUsage;
  activeConnections?: number;
  pendingJobs?: number;
  onlineProviders?: number;
}

// Track server start time
const serverStartTime = Date.now();

// Track component health states
let lastDbCheck: ComponentHealth = {
  status: 'down',
  lastCheck: new Date().toISOString(),
};

let lastWsCheck: ComponentHealth = {
  status: 'down',
  lastCheck: new Date().toISOString(),
};

let lastBlockchainCheck: ComponentHealth = {
  status: 'down',
  lastCheck: new Date().toISOString(),
};

/**
 * Check database connectivity
 */
export async function checkDatabase(): Promise<ComponentHealth> {
  const start = Date.now();
  
  try {
    // Simple query to check connectivity
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;

    lastDbCheck = {
      status: latency > 1000 ? 'degraded' : 'up',
      latency,
      message: latency > 1000 ? 'High latency detected' : 'Connected',
      lastCheck: new Date().toISOString(),
    };

    dbLogger.debug({ latency }, 'Database health check passed');
  } catch (error: any) {
    lastDbCheck = {
      status: 'down',
      message: error.message,
      lastCheck: new Date().toISOString(),
    };

    dbLogger.error({ error: error.message }, 'Database health check failed');
  }

  return lastDbCheck;
}

/**
 * Check WebSocket server status
 */
export function checkWebSocket(activeConnections: number): ComponentHealth {
  lastWsCheck = {
    status: 'up',
    message: `${activeConnections} active connections`,
    lastCheck: new Date().toISOString(),
  };

  return lastWsCheck;
}

/**
 * Check blockchain connectivity
 */
export async function checkBlockchain(qubicClient: any): Promise<ComponentHealth> {
  const start = Date.now();

  try {
    // Try to get tick info or similar lightweight call
    if (qubicClient && typeof qubicClient.getTickInfo === 'function') {
      await qubicClient.getTickInfo();
    }
    
    const latency = Date.now() - start;

    lastBlockchainCheck = {
      status: latency > 5000 ? 'degraded' : 'up',
      latency,
      message: 'Connected to Qubic network',
      lastCheck: new Date().toISOString(),
    };
  } catch (error: any) {
    lastBlockchainCheck = {
      status: 'degraded', // Not critical, platform can work without blockchain
      message: `Blockchain unavailable: ${error.message}`,
      lastCheck: new Date().toISOString(),
    };
  }

  return lastBlockchainCheck;
}

/**
 * Get system metrics
 */
export async function getSystemMetrics(): Promise<SystemMetrics> {
  const memoryUsage = process.memoryUsage();

  // Get job and provider counts from database
  let pendingJobs = 0;
  let onlineProviders = 0;

  try {
    const [jobCount, providerCount] = await Promise.all([
      prisma.job.count({ where: { status: 'PENDING' } }),
      prisma.provider.count({ where: { isOnline: true } }),
    ]);
    pendingJobs = jobCount;
    onlineProviders = providerCount;
  } catch (error) {
    // Ignore errors, metrics are optional
  }

  return {
    memoryUsage: {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
    },
    cpuUsage: process.cpuUsage(),
    pendingJobs,
    onlineProviders,
  };
}

/**
 * Get comprehensive health status
 */
export async function getHealthStatus(
  wsConnections: number = 0,
  qubicClient?: any
): Promise<HealthStatus> {
  // Run all health checks in parallel
  const [dbHealth, blockchainHealth, metrics] = await Promise.all([
    checkDatabase(),
    qubicClient ? checkBlockchain(qubicClient) : Promise.resolve(lastBlockchainCheck),
    getSystemMetrics(),
  ]);

  const wsHealth = checkWebSocket(wsConnections);

  // Determine overall status
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  if (dbHealth.status === 'down') {
    overallStatus = 'unhealthy';
  } else if (
    dbHealth.status === 'degraded' ||
    wsHealth.status === 'degraded' ||
    blockchainHealth.status === 'degraded'
  ) {
    overallStatus = 'degraded';
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.round((Date.now() - serverStartTime) / 1000),
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: dbHealth,
      websocket: wsHealth,
      blockchain: blockchainHealth,
    },
    metrics,
  };
}

/**
 * Start periodic health monitoring
 */
export function startHealthMonitoring(
  interval: number = 30000,
  qubicClient?: any
): NodeJS.Timeout {
  logger.info({ interval }, 'Starting health monitoring');

  return setInterval(async () => {
    try {
      const health = await getHealthStatus(0, qubicClient);
      
      if (health.status !== 'healthy') {
        logger.warn({ health }, 'System health degraded');
      }
    } catch (error: any) {
      logger.error({ error: error.message }, 'Health monitoring error');
    }
  }, interval);
}

/**
 * Database connection monitoring
 */
export async function monitorDatabaseConnection(): Promise<void> {
  try {
    await prisma.$connect();
    dbLogger.info('Database connection established');
  } catch (error: any) {
    dbLogger.error({ error: error.message }, 'Failed to connect to database');
    throw error;
  }
}

export default {
  checkDatabase,
  checkWebSocket,
  checkBlockchain,
  getHealthStatus,
  getSystemMetrics,
  startHealthMonitoring,
  monitorDatabaseConnection,
};
