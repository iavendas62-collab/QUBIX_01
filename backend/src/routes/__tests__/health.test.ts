/**
 * Health Check Routes Tests
 * 
 * Tests for the health check endpoints
 * Requirements: 3.5 - Monitoring and logging
 */

import { healthRoutes } from '../health';
import express, { Express } from 'express';
import request from 'supertest';

// Mock the health service
jest.mock('../../services/health', () => ({
  getHealthStatus: jest.fn().mockResolvedValue({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: 100,
    version: '1.0.0',
    checks: {
      database: { status: 'up', latency: 5, lastCheck: new Date().toISOString() },
      websocket: { status: 'up', message: '10 active connections', lastCheck: new Date().toISOString() },
      blockchain: { status: 'up', latency: 100, lastCheck: new Date().toISOString() },
    },
    metrics: {
      memoryUsage: { heapUsed: 50, heapTotal: 100, external: 10, rss: 150 },
      pendingJobs: 5,
      onlineProviders: 3,
    },
  }),
  checkDatabase: jest.fn().mockResolvedValue({
    status: 'up',
    latency: 5,
    lastCheck: new Date().toISOString(),
  }),
  getSystemMetrics: jest.fn().mockResolvedValue({
    memoryUsage: { heapUsed: 50, heapTotal: 100, external: 10, rss: 150 },
    pendingJobs: 5,
    onlineProviders: 3,
  }),
}));

// Mock the logger
jest.mock('../../services/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Health Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use('/health', healthRoutes({ wsManager: { getConnectionCount: () => 10 } }));
  });

  describe('GET /health', () => {
    it('should return basic health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health status', async () => {
      const response = await request(app).get('/health/detailed');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('checks');
      expect(response.body.checks).toHaveProperty('database');
      expect(response.body.checks).toHaveProperty('websocket');
      expect(response.body.checks).toHaveProperty('blockchain');
    });
  });

  describe('GET /health/ready', () => {
    it('should return readiness status', async () => {
      const response = await request(app).get('/health/ready');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ready', true);
    });
  });

  describe('GET /health/live', () => {
    it('should return liveness status', async () => {
      const response = await request(app).get('/health/live');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('alive', true);
    });
  });

  describe('GET /health/metrics', () => {
    it('should return system metrics', async () => {
      const response = await request(app).get('/health/metrics');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('memoryUsage');
    });
  });
});
