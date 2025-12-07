/**
 * HTTP Request Logging Middleware
 * 
 * Provides structured logging for all HTTP requests with:
 * - Request/response timing
 * - Request ID tracking
 * - Error logging
 * - Performance monitoring
 * 
 * Requirements: 3.5 - Monitoring and logging
 */

import { Request, Response, NextFunction } from 'express';
import { apiLogger, logApiPerformance } from '../services/logger';
import { randomUUID } from 'crypto';

// Extend Express Request to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
    }
  }
}

/**
 * Request logging middleware
 * Logs incoming requests and outgoing responses with timing
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  // Generate unique request ID
  req.requestId = req.headers['x-request-id'] as string || randomUUID();
  req.startTime = Date.now();

  // Add request ID to response headers
  res.setHeader('X-Request-ID', req.requestId);

  // Log incoming request
  apiLogger.debug(
    {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    },
    `Incoming request: ${req.method} ${req.path}`
  );

  // Capture response finish
  res.on('finish', () => {
    const responseTime = Date.now() - (req.startTime || Date.now());

    logApiPerformance({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime,
      requestId: req.requestId,
    });
  });

  next();
}

/**
 * Error logging middleware
 * Must be registered after all routes
 */
export function errorLogger(err: Error, req: Request, res: Response, next: NextFunction) {
  const responseTime = Date.now() - (req.startTime || Date.now());

  apiLogger.error(
    {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode || 500,
      responseTime,
      error: {
        name: err.name,
        message: err.message,
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
      },
    },
    `Request error: ${err.message}`
  );

  next(err);
}

/**
 * Performance monitoring middleware
 * Tracks slow requests and logs warnings
 */
export function performanceMonitor(slowThreshold: number = 1000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
      const duration = Number(process.hrtime.bigint() - start) / 1e6; // Convert to ms

      if (duration > slowThreshold) {
        apiLogger.warn(
          {
            requestId: req.requestId,
            method: req.method,
            path: req.path,
            duration: Math.round(duration),
            threshold: slowThreshold,
          },
          `Slow request detected: ${req.method} ${req.path} took ${Math.round(duration)}ms`
        );
      }
    });

    next();
  };
}
