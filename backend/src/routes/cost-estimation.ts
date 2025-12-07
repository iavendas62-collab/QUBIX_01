/**
 * Cost Estimation API Routes
 * Provides endpoints for cost and duration estimation
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6
 */

import * as express from 'express';
import {
  calculateCostEstimate,
  calculateCostEstimateRange,
  getBenchmarksForJobType,
  EstimationParameters,
} from '../services/cost-estimation.service';

const router = express.Router();

/**
 * POST /api/cost-estimation/calculate
 * Calculate cost estimate for a job
 * Requirements: 12.1, 12.3, 12.4
 */
router.post('/calculate', async (req, res) => {
  try {
    const { jobType, gpuModel, pricePerHour, parameters } = req.body;
    
    // Validate required fields
    if (!jobType || !gpuModel || pricePerHour === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: jobType, gpuModel, pricePerHour',
      });
    }
    
    // Calculate estimate
    const estimate = await calculateCostEstimate(
      jobType,
      gpuModel,
      pricePerHour,
      parameters as EstimationParameters
    );
    
    res.json({
      success: true,
      estimate,
    });
  } catch (error) {
    console.error('Error calculating cost estimate:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate cost estimate',
    });
  }
});

/**
 * POST /api/cost-estimation/calculate-range
 * Calculate cost estimate range for uncertain estimates
 * Requirements: 12.6
 */
router.post('/calculate-range', async (req, res) => {
  try {
    const { jobType, gpuModel, pricePerHour, parameters } = req.body;
    
    // Validate required fields
    if (!jobType || !gpuModel || pricePerHour === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: jobType, gpuModel, pricePerHour',
      });
    }
    
    // Calculate estimate range
    const estimateRange = await calculateCostEstimateRange(
      jobType,
      gpuModel,
      pricePerHour,
      parameters as EstimationParameters
    );
    
    res.json({
      success: true,
      ...estimateRange,
    });
  } catch (error) {
    console.error('Error calculating cost estimate range:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate cost estimate range',
    });
  }
});

/**
 * GET /api/cost-estimation/benchmarks/:jobType
 * Get all benchmarks for a specific job type
 * Requirements: 14.2
 */
router.get('/benchmarks/:jobType', async (req, res) => {
  try {
    const { jobType } = req.params;
    
    const benchmarks = await getBenchmarksForJobType(jobType);
    
    res.json({
      success: true,
      jobType,
      benchmarks,
    });
  } catch (error) {
    console.error('Error fetching benchmarks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch benchmarks',
    });
  }
});

export default router;
