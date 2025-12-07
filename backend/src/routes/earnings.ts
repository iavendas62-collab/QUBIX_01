import { Router } from 'express';
import { 
  getProviderEarnings, 
  getLiveEarningsUpdate,
  calculateProviderEarnings,
  calculateActiveJobsEarnings
} from '../services/earnings.service';

export function earningsRoutes(services: any) {
  const router = Router();

  /**
   * Get complete provider earnings data
   * GET /api/earnings/:providerId
   * Requirements: 9.1, 9.2, 9.6
   */
  router.get('/:providerId', async (req, res) => {
    try {
      const { providerId } = req.params;
      
      const earningsData = await getProviderEarnings(providerId);
      
      res.json({
        success: true,
        ...earningsData
      });
    } catch (error: any) {
      console.error('Error fetching provider earnings:', error);
      res.status(error.message === 'Provider not found' ? 404 : 500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  /**
   * Get live earnings update (lightweight for frequent polling)
   * GET /api/earnings/:providerId/live
   * Requirements: 9.2 - Update every 5 seconds
   */
  router.get('/:providerId/live', async (req, res) => {
    try {
      const { providerId } = req.params;
      
      const liveUpdate = await getLiveEarningsUpdate(providerId);
      
      res.json({
        success: true,
        ...liveUpdate
      });
    } catch (error: any) {
      console.error('Error fetching live earnings:', error);
      res.status(error.message === 'Provider not found' ? 404 : 500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  /**
   * Get earnings summary only (no transactions or active jobs)
   * GET /api/earnings/:providerId/summary
   * Requirements: 9.1, 9.6
   */
  router.get('/:providerId/summary', async (req, res) => {
    try {
      const { providerId } = req.params;
      
      const earnings = await calculateProviderEarnings(providerId);
      
      res.json({
        success: true,
        earnings
      });
    } catch (error: any) {
      console.error('Error fetching earnings summary:', error);
      res.status(error.message === 'Provider not found' ? 404 : 500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  /**
   * Get active jobs with live earnings
   * GET /api/earnings/:providerId/active-jobs
   * Requirements: 9.2, 9.4
   */
  router.get('/:providerId/active-jobs', async (req, res) => {
    try {
      const { providerId } = req.params;
      
      const activeJobs = await calculateActiveJobsEarnings(providerId);
      
      res.json({
        success: true,
        activeJobs
      });
    } catch (error: any) {
      console.error('Error fetching active jobs:', error);
      res.status(error.message === 'Provider not found' ? 404 : 500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  return router;
}
