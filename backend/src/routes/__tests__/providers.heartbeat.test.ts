/**
 * Provider Heartbeat System Tests
 * 
 * Tests for the provider heartbeat endpoint and timeout detection.
 * Requirements: 5.1, 5.2, 5.3
 */

import { describe, it, expect, beforeAll, beforeEach, jest } from '@jest/globals';

// Mock PrismaClient
const mockPrismaProvider = {
  findUnique: jest.fn<any>(),
  findMany: jest.fn<any>(),
  update: jest.fn<any>(),
  count: jest.fn<any>()
};

const mockPrismaProviderMetric = {
  create: jest.fn<any>(),
  findMany: jest.fn<any>()
};

const mockPrismaJob = {
  findUnique: jest.fn<any>(),
  findMany: jest.fn<any>(),
  update: jest.fn<any>()
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    provider: mockPrismaProvider,
    providerMetric: mockPrismaProviderMetric,
    job: mockPrismaJob
  }))
}));

// Import after mocking
import { ProviderHeartbeatService, HeartbeatRequest, ResourceUsage } from '../../services/provider-heartbeat.service';

describe('Provider Heartbeat System', () => {
  let heartbeatService: ProviderHeartbeatService;
  let mockWsManager: any;

  beforeAll(() => {
    mockWsManager = {
      broadcastProviderStatusChanged: jest.fn(),
      broadcastGPUMetricsUpdate: jest.fn(),
      broadcastJobProgress: jest.fn()
    };
    heartbeatService = new ProviderHeartbeatService(mockWsManager);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processHeartbeat', () => {
    it('should return error for non-existent provider', async () => {
      mockPrismaProvider.findUnique.mockResolvedValue(null);

      const request: HeartbeatRequest = {
        workerId: 'non-existent-worker',
        status: 'online'
      };

      const result = await heartbeatService.processHeartbeat(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Provider not found');
      expect(result.pendingJobs).toEqual([]);
    });

    it('should update provider status on heartbeat', async () => {
      const mockProvider = {
        id: 'provider-123',
        workerId: 'worker-123',
        isOnline: true,
        isAvailable: true,
        lastHeartbeat: new Date()
      };

      mockPrismaProvider.findUnique.mockResolvedValue(mockProvider);
      mockPrismaProvider.update.mockResolvedValue({
        ...mockProvider,
        lastHeartbeat: new Date()
      });
      mockPrismaJob.findMany.mockResolvedValue([]);

      const request: HeartbeatRequest = {
        workerId: 'worker-123',
        status: 'online'
      };

      const result = await heartbeatService.processHeartbeat(request);

      expect(result.success).toBe(true);
      expect(mockPrismaProvider.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { workerId: 'worker-123' },
          data: expect.objectContaining({
            isOnline: true,
            lastHeartbeat: expect.any(Date)
          })
        })
      );
    });

    it('should store metrics when provided', async () => {
      const mockProvider = {
        id: 'provider-123',
        workerId: 'worker-123',
        isOnline: true,
        isAvailable: true,
        lastHeartbeat: new Date()
      };

      mockPrismaProvider.findUnique.mockResolvedValue(mockProvider);
      mockPrismaProvider.update.mockResolvedValue(mockProvider);
      mockPrismaProviderMetric.create.mockResolvedValue({});
      mockPrismaJob.findMany.mockResolvedValue([]);

      const usage: ResourceUsage = {
        cpuPercent: 45.5,
        ramPercent: 60.2,
        gpuPercent: 80.0,
        gpuTemp: 65.0,
        gpuMemUsedMb: 4096
      };

      const request: HeartbeatRequest = {
        workerId: 'worker-123',
        status: 'online',
        usage
      };

      const result = await heartbeatService.processHeartbeat(request);

      expect(result.success).toBe(true);
      expect(mockPrismaProviderMetric.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            providerId: 'provider-123',
            cpuPercent: 45.5,
            ramPercent: 60.2,
            gpuPercent: 80.0,
            gpuTemp: 65.0
          })
        })
      );
    });

    it('should broadcast metrics update via WebSocket', async () => {
      const mockProvider = {
        id: 'provider-123',
        workerId: 'worker-123',
        isOnline: true,
        isAvailable: true,
        lastHeartbeat: new Date()
      };

      mockPrismaProvider.findUnique.mockResolvedValue(mockProvider);
      mockPrismaProvider.update.mockResolvedValue(mockProvider);
      mockPrismaProviderMetric.create.mockResolvedValue({});
      mockPrismaJob.findMany.mockResolvedValue([]);

      const usage: ResourceUsage = {
        cpuPercent: 45.5,
        ramPercent: 60.2
      };

      const request: HeartbeatRequest = {
        workerId: 'worker-123',
        status: 'online',
        usage
      };

      await heartbeatService.processHeartbeat(request);

      expect(mockWsManager.broadcastGPUMetricsUpdate).toHaveBeenCalledWith(
        'provider-123',
        usage
      );
    });

    it('should return pending jobs in response', async () => {
      const mockProvider = {
        id: 'provider-123',
        workerId: 'worker-123',
        isOnline: true,
        isAvailable: true,
        lastHeartbeat: new Date()
      };

      const mockPendingJobs = [
        { id: 'job-1', status: 'ASSIGNED', modelType: 'inference' },
        { id: 'job-2', status: 'PENDING', modelType: 'training' }
      ];

      mockPrismaProvider.findUnique.mockResolvedValue(mockProvider);
      mockPrismaProvider.update.mockResolvedValue(mockProvider);
      mockPrismaJob.findMany.mockResolvedValue(mockPendingJobs);

      const request: HeartbeatRequest = {
        workerId: 'worker-123',
        status: 'online'
      };

      const result = await heartbeatService.processHeartbeat(request);

      expect(result.success).toBe(true);
      expect(result.pendingJobs).toEqual(mockPendingJobs);
    });

    it('should mark provider as busy when currentJob is provided', async () => {
      const mockProvider = {
        id: 'provider-123',
        workerId: 'worker-123',
        isOnline: true,
        isAvailable: true,
        lastHeartbeat: new Date()
      };

      mockPrismaProvider.findUnique.mockResolvedValue(mockProvider);
      mockPrismaProvider.update.mockResolvedValue({
        ...mockProvider,
        isAvailable: false,
        currentJobId: 'job-123'
      });
      mockPrismaJob.findMany.mockResolvedValue([]);

      const request: HeartbeatRequest = {
        workerId: 'worker-123',
        status: 'busy',
        currentJob: 'job-123'
      };

      const result = await heartbeatService.processHeartbeat(request);

      expect(result.success).toBe(true);
      expect(mockPrismaProvider.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isOnline: true,
            isAvailable: false,
            currentJobId: 'job-123'
          })
        })
      );
    });

    it('should broadcast status change when provider comes online', async () => {
      const mockProvider = {
        id: 'provider-123',
        workerId: 'worker-123',
        isOnline: false, // Was offline
        isAvailable: false,
        lastHeartbeat: new Date(Date.now() - 120000) // 2 minutes ago
      };

      mockPrismaProvider.findUnique.mockResolvedValue(mockProvider);
      mockPrismaProvider.update.mockResolvedValue({
        ...mockProvider,
        isOnline: true,
        isAvailable: true,
        lastHeartbeat: new Date()
      });
      mockPrismaJob.findMany.mockResolvedValue([]);

      const request: HeartbeatRequest = {
        workerId: 'worker-123',
        status: 'online'
      };

      await heartbeatService.processHeartbeat(request);

      expect(mockWsManager.broadcastProviderStatusChanged).toHaveBeenCalledWith(
        'provider-123',
        expect.objectContaining({
          isOnline: true,
          event: 'PROVIDER_ONLINE'
        })
      );
    });
  });

  describe('getStats', () => {
    it('should return heartbeat service statistics', async () => {
      mockPrismaProvider.count
        .mockResolvedValueOnce(10) // totalProviders
        .mockResolvedValueOnce(5)  // onlineProviders
        .mockResolvedValueOnce(4); // recentHeartbeats

      const stats = await heartbeatService.getStats();

      expect(stats).toEqual(expect.objectContaining({
        totalProviders: 10,
        onlineProviders: 5,
        recentHeartbeats: 4,
        timeoutThresholdSeconds: 90,
        heartbeatIntervalSeconds: 30
      }));
    });
  });
});
