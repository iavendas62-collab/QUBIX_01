/**
 * Health Check Routes
 * 
 * Provides endpoints for:
 * - Basic health check (for load balancers)
 * - Detailed health status (for monitoring)
 * - Readiness check (for Kubernetes)
 * - Liveness check (for Kubernetes)
 * 
 * Requirements: 3.5 - Monitoring and logging
 */

import { Router, Request, Response } from 'express';
import { getHealthStatus, checkDatabase, getSystemMetrics } from '../services/health';
import { logger } from '../services/logger';

export function healthRoutes(services: any) {
  const router = Router();

  /**
   * Basic health check
   * Used by load balancers for quick health verification
   * GET /health
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const health = await getHealthStatus(
        services.wsManager?.getConnectionCount?.() || 0,
        services.qubicClient
      );

      const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

      res.status(statusCode).json({
        status: health.status,
        timestamp: health.timestamp,
        uptime: health.uptime,
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Health check failed');
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  });

  /**
   * Detailed health status
   * Provides comprehensive health information for monitoring dashboards
   * GET /health/detailed
   */
  router.get('/detailed', async (req: Request, res: Response) => {
    try {
      const health = await getHealthStatus(
        services.wsManager?.getConnectionCount?.() || 0,
        services.qubicClient
      );

      const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

      res.status(statusCode).json(health);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Detailed health check failed');
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  });

  /**
   * Kubernetes readiness probe
   * Returns 200 only when the service is ready to accept traffic
   * GET /health/ready
   */
  router.get('/ready', async (req: Request, res: Response) => {
    try {
      const dbHealth = await checkDatabase();

      if (dbHealth.status === 'down') {
        res.status(503).json({
          ready: false,
          reason: 'Database not available',
        });
        return;
      }

      res.status(200).json({
        ready: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(503).json({
        ready: false,
        reason: error.message,
      });
    }
  });

  /**
   * Kubernetes liveness probe
   * Returns 200 if the service is alive (even if degraded)
   * GET /health/live
   */
  router.get('/live', (req: Request, res: Response) => {
    res.status(200).json({
      alive: true,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * System metrics endpoint
   * GET /health/metrics
   */
  router.get('/metrics', async (req: Request, res: Response) => {
    try {
      const metrics = await getSystemMetrics();
      res.json(metrics);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to get metrics');
      res.status(500).json({ error: 'Failed to get metrics' });
    }
  });

  return router;
}

export default healthRoutes;
