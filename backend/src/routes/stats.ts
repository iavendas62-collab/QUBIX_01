import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function statsRoutes(services: any) {
  const router = Router();

  router.get('/', async (req, res) => {
    try {
      const [
        totalJobs,
        activeJobs,
        totalProviders,
        activeProviders
      ] = await Promise.all([
        prisma.job.count(),
        prisma.job.count({ where: { status: { in: ['RUNNING', 'ASSIGNED'] } } }),
        prisma.provider.count(),
        prisma.provider.count({ where: { isOnline: true } })
      ]);

      // Get network stats from qubic client if available
      let networkStats = { tick: 0, epoch: 0 };
      try {
        if (services.qubicClient?.getNetworkStats) {
          networkStats = await services.qubicClient.getNetworkStats();
        }
      } catch {
        // Ignore network stats errors
      }

      res.json({
        jobs: { total: totalJobs, active: activeJobs },
        providers: { total: totalProviders, active: activeProviders },
        models: { total: 3 }, // Mock count for demo
        network: networkStats
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
