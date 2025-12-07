/**
 * Structured Logging Service using Pino
 * 
 * Provides enterprise-grade logging with:
 * - Structured JSON logs for production
 * - Pretty printing for development
 * - Request/response logging middleware
 * - Blockchain transaction logging
 * - Performance monitoring
 * 
 * Requirements: 3.5 - Monitoring and logging
 */

import pino from 'pino';

// Determine environment
const isDevelopment = process.env.NODE_ENV !== 'production';

// Create base logger configuration
const loggerConfig: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  base: {
    service: 'qubix-backend',
    version: process.env.npm_package_version || '1.0.0',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
};

// Use pretty printing in development
const transport = isDevelopment
  ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    }
  : undefined;

// Create the logger instance
export const logger = pino(loggerConfig, transport ? pino.transport(transport) : undefined);

// Child loggers for different components
export const dbLogger = logger.child({ component: 'database' });
export const apiLogger = logger.child({ component: 'api' });
export const wsLogger = logger.child({ component: 'websocket' });
export const blockchainLogger = logger.child({ component: 'blockchain' });
export const jobLogger = logger.child({ component: 'jobs' });
export const providerLogger = logger.child({ component: 'providers' });

/**
 * Log a blockchain transaction
 */
export function logBlockchainTransaction(data: {
  type: 'send' | 'receive' | 'escrow_lock' | 'escrow_release' | 'refund';
  txHash?: string;
  from?: string;
  to?: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  jobId?: string;
  error?: string;
}) {
  const logData = {
    ...data,
    timestamp: new Date().toISOString(),
  };

  if (data.status === 'failed') {
    blockchainLogger.error(logData, `Blockchain transaction failed: ${data.type}`);
  } else {
    blockchainLogger.info(logData, `Blockchain transaction: ${data.type} - ${data.status}`);
  }
}

/**
 * Log API request performance
 */
export function logApiPerformance(data: {
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  requestId?: string;
}) {
  const level = data.statusCode >= 500 ? 'error' : data.statusCode >= 400 ? 'warn' : 'info';
  
  apiLogger[level](
    {
      ...data,
      slow: data.responseTime > 1000,
    },
    `${data.method} ${data.path} ${data.statusCode} - ${data.responseTime}ms`
  );
}

/**
 * Log database operations
 */
export function logDbOperation(data: {
  operation: 'query' | 'insert' | 'update' | 'delete' | 'connect' | 'disconnect';
  table?: string;
  duration?: number;
  success: boolean;
  error?: string;
}) {
  if (data.success) {
    dbLogger.debug(data, `DB ${data.operation}${data.table ? ` on ${data.table}` : ''}`);
  } else {
    dbLogger.error(data, `DB ${data.operation} failed: ${data.error}`);
  }
}

/**
 * Log job lifecycle events
 */
export function logJobEvent(data: {
  event: 'created' | 'assigned' | 'started' | 'progress' | 'completed' | 'failed' | 'cancelled';
  jobId: string;
  providerId?: string;
  userId?: string;
  progress?: number;
  error?: string;
  duration?: number;
}) {
  const level = data.event === 'failed' ? 'error' : 'info';
  jobLogger[level](data, `Job ${data.event}: ${data.jobId}`);
}

/**
 * Log provider events
 */
export function logProviderEvent(data: {
  event: 'registered' | 'online' | 'offline' | 'heartbeat' | 'timeout';
  workerId: string;
  providerId?: string;
  gpuModel?: string;
  error?: string;
}) {
  const level = data.event === 'timeout' ? 'warn' : 'info';
  providerLogger[level](data, `Provider ${data.event}: ${data.workerId}`);
}

export default logger;
