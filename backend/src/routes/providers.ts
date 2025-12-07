import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { getHeartbeatService, HeartbeatRequest } from '../services/provider-heartbeat.service';
import { 
  matchGPUs, 
  getTopRecommendations, 
  getBenchmarksForJobType,
  formatDuration,
  Provider as MatchingProvider,
  CompatibleGPU
} from '../services/gpu-matching.service';
import { JobAnalysis } from '../services/job-analysis.service';

const prisma = new PrismaClient();

// Schema for quick registration
const QuickRegisterSchema = z.object({
  type: z.enum(['browser', 'native']),
  workerId: z.string().min(1),
  qubicAddress: z.string().min(1),
  gpu: z.object({
    vendor: z.string().optional(),
    model: z.string().optional(),
    renderer: z.string().optional(),
    architecture: z.string().optional(),
    device: z.string().optional(),
    description: z.string().optional(),
    vram: z.number().optional(),
    type: z.enum(['webgpu', 'webgl', 'native'])
  }),
  cpu: z.object({
    model: z.string().optional(),
    cores: z.number().optional()
  }).optional(),
  ram: z.object({
    total: z.number().optional()
  }).optional(),
  location: z.string().optional(),
  pricePerHour: z.number().positive().optional()
});

export function providerRoutes(services: any) {
  const router = Router();

  // Quick registration endpoint for one-click provider onboarding
  router.post('/quick-register', async (req, res) => {
    try {
      const data = QuickRegisterSchema.parse(req.body);
      
      // Validate Qubic address format (basic validation)
      if (!isValidQubicAddress(data.qubicAddress)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid Qubic address format' 
        });
      }

      // Extract GPU information
      const gpuModel = data.gpu.model || data.gpu.renderer || data.gpu.description || 'Unknown GPU';
      const gpuVram = data.gpu.vram || 0;
      
      // Extract CPU information
      const cpuModel = data.cpu?.model || 'Unknown CPU';
      const cpuCores = data.cpu?.cores || 1;
      
      // Extract RAM information
      const ramTotal = data.ram?.total || 0;
      
      // Default pricing if not provided
      const pricePerHour = data.pricePerHour || calculateDefaultPrice(gpuVram);

      // MOCK MODE: If using mock data, return success without database
      if (process.env.USE_MOCK_DATA === 'true') {
        const mockProvider = {
          id: `mock-${Date.now()}`,
          workerId: data.workerId,
          qubicAddress: data.qubicAddress,
          type: data.type.toUpperCase(),
          gpuModel,
          gpuVram,
          cpuModel,
          cpuCores,
          ramTotal,
          location: data.location || 'Unknown',
          pricePerHour,
          isOnline: true,
          isAvailable: true,
          totalEarnings: 0,
          totalJobs: 0,
          lastHeartbeat: new Date(),
          createdAt: new Date(),
          specs: {
            gpu_model: gpuModel,
            gpu_vram_gb: gpuVram,
            cpu_model: cpuModel,
            cpu_cores: cpuCores,
            ram_total_gb: ramTotal
          }
        };

        console.log('✅ Provider registered (MOCK MODE):', mockProvider.workerId);
        
        return res.json({
          success: true,
          provider: mockProvider,
          isNew: true,
          mode: 'mock'
        });
      }

      // Check if provider already exists (deduplication by workerId)
      const existingProvider = await prisma.provider.findUnique({
        where: { workerId: data.workerId }
      });

      if (existingProvider) {
        // Update existing provider
        const updatedProvider = await prisma.provider.update({
          where: { workerId: data.workerId },
          data: {
            isOnline: true,
            isAvailable: true,
            lastHeartbeat: new Date(),
            gpuModel,
            gpuVram,
            cpuModel,
            cpuCores,
            ramTotal,
            pricePerHour,
            location: data.location || existingProvider.location
          },
          include: {
            user: {
              select: {
                id: true,
                qubicAddress: true,
                username: true,
                role: true
              }
            }
          }
        });

        // Broadcast provider status change via WebSocket
        if (services.wsManager) {
          services.wsManager.broadcastProviderStatusChanged(updatedProvider.id, {
            isOnline: true,
            isAvailable: true,
            lastHeartbeat: updatedProvider.lastHeartbeat
          });
        }

        return res.json({ 
          success: true, 
          provider: updatedProvider,
          isNew: false
        });
      }

      // Create or get user
      let user = await prisma.user.findUnique({
        where: { qubicAddress: data.qubicAddress }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            qubicAddress: data.qubicAddress,
            role: 'PROVIDER'
          }
        });
      } else if (user.role === 'CONSUMER') {
        // Upgrade to BOTH if user was only a consumer
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: 'BOTH' }
        });
      }

      // Create new provider
      const newProvider = await prisma.provider.create({
        data: {
          workerId: data.workerId,
          userId: user.id,
          qubicAddress: data.qubicAddress,
          type: data.type.toUpperCase() as 'BROWSER' | 'NATIVE',
          gpuModel,
          gpuVram,
          cpuModel,
          cpuCores,
          ramTotal,
          location: data.location,
          pricePerHour,
          isOnline: true,
          isAvailable: true,
          lastHeartbeat: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              qubicAddress: true,
              username: true,
              role: true
            }
          }
        }
      });

      // Broadcast new provider registration via WebSocket
      if (services.wsManager) {
        services.wsManager.broadcastProviderRegistered(newProvider);
      }

      res.json({ 
        success: true, 
        provider: newProvider,
        isNew: true
      });
    } catch (error: any) {
      console.error('Error in quick-register:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid request data',
          details: error.errors 
        });
      }
      
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Internal server error' 
      });
    }
  });

  // Legacy register endpoint - redirects to quick-register
  router.post('/register', async (req, res) => {
    res.status(301).json({ 
      error: 'This endpoint is deprecated. Use POST /api/providers/quick-register instead.',
      redirect: '/api/providers/quick-register'
    });
  });

  // List providers for marketplace
  router.get('/', async (req, res) => {
    // Check if mock data should be used
    if (process.env.USE_MOCK_DATA === 'true') {
      console.log('✅ Using mock providers (USE_MOCK_DATA=true)');
      const { MOCK_PROVIDERS } = await import('../data/mockData');
      return res.json(MOCK_PROVIDERS);
    }

    try {
      // Parse query parameters for filtering
      const { 
        gpuModel, 
        minVram, 
        maxVram, 
        minPrice, 
        maxPrice, 
        location, 
        availability 
      } = req.query;

      // Build where clause
      const where: any = {};
      
      if (gpuModel) {
        where.gpuModel = { contains: gpuModel as string, mode: 'insensitive' };
      }
      
      if (minVram || maxVram) {
        where.gpuVram = {};
        if (minVram) where.gpuVram.gte = parseFloat(minVram as string);
        if (maxVram) where.gpuVram.lte = parseFloat(maxVram as string);
      }
      
      if (minPrice || maxPrice) {
        where.pricePerHour = {};
        if (minPrice) where.pricePerHour.gte = parseFloat(minPrice as string);
        if (maxPrice) where.pricePerHour.lte = parseFloat(maxPrice as string);
      }
      
      if (location) {
        where.location = { contains: location as string, mode: 'insensitive' };
      }
      
      if (availability === 'available') {
        where.isOnline = true;
        where.isAvailable = true;
      } else if (availability === 'busy') {
        where.isOnline = true;
        where.isAvailable = false;
      }

      const providers = await prisma.provider.findMany({
        where,
        orderBy: [
          { isOnline: 'desc' },
          { isAvailable: 'desc' },
          { pricePerHour: 'asc' }
        ],
        include: {
          user: {
            select: {
              id: true,
              qubicAddress: true,
              username: true
            }
          }
        }
      });

      res.json(providers);
    } catch (error: any) {
      console.error('Error listing providers:', error);
      
      // Fallback to mock data if database is not available
      console.log('⚠️ Database error, using mock providers');
      const { MOCK_PROVIDERS } = await import('../data/mockData');
      console.log('✅ Returning', MOCK_PROVIDERS.length, 'mock providers');
      
      res.json(MOCK_PROVIDERS);
    }
  });

  // Get providers for current user (my providers) - MUST BE BEFORE /:id
  // Used by Provider Dashboard to show user's registered hardware
  router.get('/my', async (req, res) => {
    try {
      // Get qubicAddress from query or header
      const qubicAddress = req.query.qubicAddress as string || req.headers['x-qubic-address'] as string;
      
      // Check if mock data should be used
      if (process.env.USE_MOCK_DATA === 'true') {
        console.log('📊 Using mock data for /my providers, qubicAddress:', qubicAddress);
        
        // Filter mock providers by qubicAddress if provided
        const { MOCK_PROVIDERS } = await import('../data/mockData');
        let providers = MOCK_PROVIDERS;
        // Note: Mock providers don't have qubicAddress, so we return all for demo
        if (qubicAddress) {
          console.log(`⚠️ Mock mode: ignoring qubicAddress filter for demo`);
        }
        
        console.log(`✅ Found ${providers.length} providers for address`);
        
        return res.json({ 
          providers,
          mode: 'mock'
        });
      }
      
      // Database query for production
      let providers;
      
      if (qubicAddress) {
        providers = await prisma.provider.findMany({
          where: { qubicAddress },
          orderBy: { registeredAt: 'desc' },
          include: {
            metrics: {
              orderBy: { timestamp: 'desc' },
              take: 1
            }
          }
        });
      } else {
        providers = await prisma.provider.findMany({
          orderBy: { registeredAt: 'desc' },
          include: {
            metrics: {
              orderBy: { timestamp: 'desc' },
              take: 1
            }
          }
        });
      }

      // Transform to match frontend expected format
      const transformed = providers.map(p => ({
        id: p.id,
        workerId: p.workerId,
        name: p.name || p.gpuModel,
        online: p.isOnline,
        status: p.isOnline ? (p.isAvailable ? 'available' : 'rented') : 'offline',
        specs: {
          gpu_model: p.gpuModel,
          gpu_vram_gb: p.gpuVram,
          cpu_model: p.cpuModel,
          cpu_cores: p.cpuCores,
          ram_total_gb: p.ramTotal
        },
        metrics: p.metrics[0] ? {
          cpu_percent: p.metrics[0].cpuPercent,
          ram_percent: p.metrics[0].ramPercent,
          gpu_percent: p.metrics[0].gpuPercent,
          gpu_temp: p.metrics[0].gpuTemp,
          gpu_mem_used_mb: p.metrics[0].gpuMemUsed ? p.metrics[0].gpuMemUsed * 1024 : null,
          gpu_mem_total_mb: p.gpuVram * 1024
        } : null,
        pricePerHour: p.pricePerHour,
        totalEarnings: p.totalEarnings,
        totalJobs: p.totalJobs,
        location: p.location,
        registeredAt: p.registeredAt,
        lastHeartbeat: p.lastHeartbeat
      }));

      res.json(transformed);
    } catch (error: any) {
      console.error('Error fetching my providers:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get provider details by ID
  router.get('/:id', async (req, res) => {
    // Check if mock data should be used
    if (process.env.USE_MOCK_DATA === 'true') {
      console.log('✅ Using mock data for provider (USE_MOCK_DATA=true)');
      const { MOCK_PROVIDERS } = await import('../data/mockData');
      const provider = MOCK_PROVIDERS.find(p => p.id === req.params.id);
      
      if (provider) {
        return res.json(provider);
      }
      
      return res.status(404).json({ error: 'Provider not found in mock data' });
    }

    try {
      const provider = await prisma.provider.findUnique({
        where: { id: req.params.id },
        include: {
          user: {
            select: {
              id: true,
              qubicAddress: true,
              username: true
            }
          },
          jobs: {
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          metrics: {
            orderBy: { timestamp: 'desc' },
            take: 1
          }
        }
      });

      if (!provider) {
        return res.status(404).json({ error: 'Provider not found' });
      }

      res.json(provider);
    } catch (error: any) {
      console.error('Error getting provider:', error);
      
      // Fallback to mock data
      console.log('⚠️ Database error, using mock provider');
      const { MOCK_PROVIDERS } = await import('../data/mockData');
      const provider = MOCK_PROVIDERS.find(p => p.id === req.params.id);
      
      if (provider) {
        return res.json(provider);
      }
      
      res.status(404).json({ error: 'Provider not found' });
    }
  });

  // Update provider status
  router.patch('/:id/status', async (req, res) => {
    try {
      const { isOnline, isAvailable } = req.body;

      const provider = await prisma.provider.update({
        where: { id: req.params.id },
        data: { 
          isOnline: isOnline !== undefined ? isOnline : undefined,
          isAvailable: isAvailable !== undefined ? isAvailable : undefined
        }
      });

      // Broadcast status change via WebSocket
      if (services.wsManager) {
        services.wsManager.broadcastProviderStatusChanged(provider.id, {
          isOnline: provider.isOnline,
          isAvailable: provider.isAvailable,
          lastHeartbeat: provider.lastHeartbeat
        });
      }

      res.json({ success: true, provider });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Check for newly registered providers (for polling after installer download)
  router.get('/check-new', async (req, res) => {
    try {
      // Get the most recently registered provider (within last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const newProvider = await prisma.provider.findFirst({
        where: {
          registeredAt: {
            gte: fiveMinutesAgo
          }
        },
        orderBy: {
          registeredAt: 'desc'
        },
        include: {
          user: {
            select: {
              id: true,
              qubicAddress: true,
              username: true,
              role: true
            }
          }
        }
      });

      res.json({ 
        newProvider: newProvider || null 
      });
    } catch (error: any) {
      console.error('Error checking for new providers:', error);
      res.status(500).json({ 
        error: error.message || 'Internal server error' 
      });
    }
  });

  // Get job history for a provider
  // Requirements: 10.4 - List job history with timestamps and payments
  router.get('/my/jobs', async (req, res) => {
    try {
      const qubicAddress = req.query.qubicAddress as string || req.headers['x-qubic-address'] as string;
      const limit = parseInt(req.query.limit as string) || 50;
      
      // Find user's providers
      const providers = await prisma.provider.findMany({
        where: qubicAddress ? { qubicAddress } : {},
        select: { id: true }
      });

      const providerIds = providers.map(p => p.id);

      // Get jobs for these providers
      const jobs = await prisma.job.findMany({
        where: {
          providerId: { in: providerIds }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          provider: {
            select: {
              workerId: true,
              gpuModel: true
            }
          },
          user: {
            select: {
              qubicAddress: true,
              username: true
            }
          }
        }
      });

      // Transform to match frontend expected format
      const transformed = jobs.map(job => ({
        id: job.id,
        modelType: job.modelType,
        status: job.status,
        progress: job.progress,
        estimatedCost: job.estimatedCost,
        actualCost: job.actualCost,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        provider: job.provider ? {
          workerId: job.provider.workerId,
          gpuModel: job.provider.gpuModel
        } : null,
        consumer: job.user ? {
          qubicAddress: job.user.qubicAddress,
          username: job.user.username
        } : null
      }));

      res.json(transformed);
    } catch (error: any) {
      console.error('Error fetching provider jobs:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get earnings summary for provider dashboard
  // Requirements: 10.1, 10.2, 10.3 - Display earnings with breakdowns
  router.get('/my/earnings', async (req, res) => {
    try {
      const qubicAddress = req.query.qubicAddress as string || req.headers['x-qubic-address'] as string;
      
      // Find user's providers
      const providers = await prisma.provider.findMany({
        where: qubicAddress ? { qubicAddress } : {},
        select: { id: true, totalEarnings: true, userId: true }
      });

      if (providers.length === 0) {
        return res.json({
          total: 0,
          today: 0,
          thisWeek: 0,
          thisMonth: 0,
          pending: 0,
          history: []
        });
      }

      const providerIds = providers.map(p => p.id);
      const userIds = Array.from(new Set(providers.map(p => p.userId)));
      const totalFromProviders = providers.reduce((sum, p) => sum + p.totalEarnings, 0);

      // Get date ranges
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 7);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get completed jobs for earnings calculation
      const completedJobs = await prisma.job.findMany({
        where: {
          providerId: { in: providerIds },
          status: 'COMPLETED'
        },
        select: {
          actualCost: true,
          estimatedCost: true,
          completedAt: true
        }
      });

      // Calculate earnings by period
      let today = 0, thisWeek = 0, thisMonth = 0;
      const dailyEarnings: { [key: string]: number } = {};

      completedJobs.forEach(job => {
        const amount = job.actualCost || job.estimatedCost;
        const completedAt = job.completedAt || new Date();
        
        if (completedAt >= todayStart) today += amount;
        if (completedAt >= weekStart) thisWeek += amount;
        if (completedAt >= monthStart) thisMonth += amount;

        // Group by date for history chart
        const dateKey = completedAt.toISOString().split('T')[0];
        dailyEarnings[dateKey] = (dailyEarnings[dateKey] || 0) + amount;
      });

      // Get pending earnings from transactions
      const pendingTransactions = await prisma.transaction.findMany({
        where: {
          userId: { in: userIds },
          type: 'ESCROW_RELEASE',
          status: 'PENDING'
        },
        select: { amount: true }
      });

      const pending = pendingTransactions.reduce((sum, tx) => sum + tx.amount, 0);

      // Build history array (last 30 days)
      const history = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        history.push({
          date: dateKey,
          amount: dailyEarnings[dateKey] || 0
        });
      }

      res.json({
        total: totalFromProviders,
        today,
        thisWeek,
        thisMonth,
        pending,
        history
      });
    } catch (error: any) {
      console.error('Error fetching provider earnings:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get metrics history for a provider
  // Requirements: 5.4, 5.5 - Display historical utilization charts
  router.get('/:workerId/metrics/history', async (req, res) => {
    try {
      const { workerId } = req.params;
      const limit = parseInt(req.query.limit as string) || 30;

      // Find provider by workerId
      const provider = await prisma.provider.findUnique({
        where: { workerId }
      });

      if (!provider) {
        return res.status(404).json({ error: 'Provider not found' });
      }

      // Get metrics history
      const metrics = await prisma.providerMetric.findMany({
        where: { providerId: provider.id },
        orderBy: { timestamp: 'desc' },
        take: limit
      });

      // Transform and reverse to chronological order
      const history = metrics.reverse().map(m => ({
        timestamp: m.timestamp,
        cpu_percent: m.cpuPercent,
        ram_percent: m.ramPercent,
        gpu_percent: m.gpuPercent,
        gpu_temp: m.gpuTemp,
        gpu_mem_used: m.gpuMemUsed
      }));

      res.json({ history });
    } catch (error: any) {
      console.error('Error fetching metrics history:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Heartbeat endpoint for workers to report status
  // Requirements: 5.1, 5.2, 5.3
  // - Collects GPU metrics every 30 seconds
  // - Includes GPU utilization, temperature, and memory usage
  // - Broadcasts updates via WebSocket
  router.post('/:workerId/heartbeat', async (req, res) => {
    try {
      const { workerId } = req.params;
      const { usage, status, currentJob } = req.body;

      // Get heartbeat service with WebSocket manager
      const heartbeatService = getHeartbeatService(services.wsManager);

      // Process heartbeat using the service
      const heartbeatRequest: HeartbeatRequest = {
        workerId,
        usage: usage ? {
          cpuPercent: usage.cpuPercent || usage.cpu_percent || 0,
          ramPercent: usage.ramPercent || usage.ram_percent || 0,
          ramUsedGb: usage.ramUsedGb || usage.ram_used_gb,
          ramTotalGb: usage.ramTotalGb || usage.ram_total_gb,
          gpuPercent: usage.gpuPercent ?? usage.gpu_percent,
          gpuTemp: usage.gpuTemp ?? usage.gpu_temp,
          gpuMemUsedMb: usage.gpuMemUsedMb ?? usage.gpu_mem_used_mb,
          gpuMemTotalMb: usage.gpuMemTotalMb ?? usage.gpu_mem_total_mb,
          timestamp: usage.timestamp
        } : undefined,
        status: status || 'online',
        currentJob
      };

      const result = await heartbeatService.processHeartbeat(heartbeatRequest);

      if (!result.success) {
        return res.status(result.error === 'Provider not found' ? 404 : 500).json(result);
      }

      res.json(result);
    } catch (error: any) {
      console.error('Error processing heartbeat:', error);
      res.status(500).json({ 
        success: false, 
        pendingJobs: [],
        error: error.message || 'Internal server error' 
      });
    }
  });

  // Get heartbeat service statistics
  router.get('/heartbeat/stats', async (req, res) => {
    try {
      const heartbeatService = getHeartbeatService(services.wsManager);
      const stats = await heartbeatService.getStats();
      res.json(stats);
    } catch (error: any) {
      console.error('Error getting heartbeat stats:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Toggle provider online/offline status
  router.post('/:id/toggle', async (req, res) => {
    try {
      const { id } = req.params;
      const { online } = req.body;

      const provider = await prisma.provider.update({
        where: { id },
        data: { 
          isOnline: online,
          isAvailable: online // If going offline, also mark as unavailable
        }
      });

      // Broadcast status change via WebSocket
      if (services.wsManager) {
        services.wsManager.broadcastProviderStatusChanged(provider.id, {
          isOnline: provider.isOnline,
          isAvailable: provider.isAvailable,
          lastHeartbeat: provider.lastHeartbeat
        });
      }

      res.json({ success: true, provider });
    } catch (error: any) {
      console.error('Error toggling provider:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete provider
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;

      // First check if provider exists
      const provider = await prisma.provider.findUnique({
        where: { id }
      });

      if (!provider) {
        return res.status(404).json({ error: 'Provider not found' });
      }

      // Delete associated metrics first (foreign key constraint)
      await prisma.providerMetric.deleteMany({
        where: { providerId: id }
      });

      // Delete the provider
      await prisma.provider.delete({
        where: { id }
      });

      // Broadcast provider removal via WebSocket
      if (services.wsManager && services.wsManager.broadcastProviderRemoved) {
        services.wsManager.broadcastProviderRemoved(id);
      }

      res.json({ success: true, message: 'Provider deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting provider:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // GPU Matching endpoint - match GPUs based on job requirements
  // Requirements: 3.1, 3.2, 3.4, 3.5, 3.6, 3.7
  router.post('/match', async (req, res) => {
    try {
      const { jobRequirements, sortBy, parameters } = req.body;

      // Validate job requirements
      if (!jobRequirements || !jobRequirements.jobType) {
        return res.status(400).json({ 
          error: 'Invalid job requirements. Must include jobType.' 
        });
      }

      // Get all available providers
      const providers = await prisma.provider.findMany({
        where: {
          isOnline: true,
          isAvailable: true
        },
        include: {
          user: {
            select: {
              id: true,
              qubicAddress: true,
              username: true
            }
          }
        }
      });

      // Convert Prisma providers to matching service format
      const matchingProviders: MatchingProvider[] = providers.map(p => ({
        id: p.id,
        workerId: p.workerId,
        qubicAddress: p.qubicAddress,
        name: p.name || undefined,
        gpuModel: p.gpuModel,
        gpuVram: p.gpuVram,
        cpuModel: p.cpuModel,
        cpuCores: p.cpuCores,
        ramTotal: p.ramTotal,
        location: p.location || undefined,
        pricePerHour: p.pricePerHour,
        isOnline: p.isOnline,
        isAvailable: p.isAvailable,
        totalEarnings: p.totalEarnings,
        totalJobs: p.totalJobs,
        uptime: p.uptime
      }));

      // Perform GPU matching
      const compatibleGPUs = matchGPUs(
        jobRequirements as JobAnalysis,
        matchingProviders,
        sortBy || 'cost_benefit',
        parameters
      );

      // Get top 3 recommendations
      const recommendations = getTopRecommendations(
        jobRequirements as JobAnalysis,
        matchingProviders,
        parameters
      );

      // Format response with human-readable durations
      const formattedGPUs = compatibleGPUs.map(gpu => ({
        ...gpu,
        estimatedDurationFormatted: formatDuration(gpu.estimatedDuration)
      }));

      const formattedRecommendations = recommendations.map(gpu => ({
        ...gpu,
        estimatedDurationFormatted: formatDuration(gpu.estimatedDuration)
      }));

      res.json({
        success: true,
        compatibleGPUs: formattedGPUs,
        recommendations: formattedRecommendations,
        totalAvailable: providers.length,
        totalCompatible: compatibleGPUs.filter(g => g.compatibility !== 'insufficient').length
      });
    } catch (error: any) {
      console.error('Error matching GPUs:', error);
      res.status(500).json({ 
        success: false,
        error: error.message || 'Internal server error' 
      });
    }
  });

  // Get benchmarks for a specific job type
  // Requirements: 14.2
  router.get('/benchmarks/:jobType', async (req, res) => {
    try {
      const { jobType } = req.params;
      
      const benchmarks = getBenchmarksForJobType(jobType);
      
      res.json({
        success: true,
        jobType,
        benchmarks
      });
    } catch (error: any) {
      console.error('Error getting benchmarks:', error);
      res.status(500).json({ 
        success: false,
        error: error.message || 'Internal server error' 
      });
    }
  });

  return router;
}

// Helper function to validate Qubic address format
function isValidQubicAddress(address: string): boolean {
  // Basic validation: Qubic addresses are typically 60 uppercase letters
  // This is a simplified check - adjust based on actual Qubic address format
  if (!address || address.length !== 60) {
    return false;
  }
  
  // Check if all characters are uppercase letters A-Z
  return /^[A-Z]+$/.test(address);
}

// Helper function to calculate default price based on GPU VRAM
function calculateDefaultPrice(vram: number): number {
  // Default pricing tiers based on VRAM
  if (vram >= 24) return 2.0; // High-end GPUs (24GB+)
  if (vram >= 16) return 1.5; // Mid-high GPUs (16-24GB)
  if (vram >= 8) return 1.0;  // Mid-range GPUs (8-16GB)
  if (vram >= 4) return 0.5;  // Entry-level GPUs (4-8GB)
  return 0.25; // Low-end or unknown GPUs
}
