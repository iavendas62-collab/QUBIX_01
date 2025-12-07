import { Router } from 'express';

export function websocketRoutes(services: any) {
  const router = Router();

  // Get WebSocket statistics
  router.get('/stats', (req, res) => {
    try {
      const stats = services.wsManager?.getStats() || {
        totalClients: 0,
        totalSubscriptions: 0,
        subscriptionDetails: []
      };

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Error getting WebSocket stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get WebSocket statistics'
      });
    }
  });

  return router;
}
