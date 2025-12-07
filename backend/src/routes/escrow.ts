/**
 * Escrow Payment API Routes
 * 
 * Comprehensive escrow endpoints for job payments:
 * - POST /api/escrow/lock - Lock funds in escrow
 * - POST /api/escrow/release - Release payment to provider
 * - POST /api/escrow/refund - Refund consumer on failure
 * - GET /api/escrow/status/:jobId - Get escrow status
 * - GET /api/escrow/pending - Get all pending escrows
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 8.1, 8.2, 8.3, 8.4
 */

import { Router, Request, Response } from 'express';
import { escrowService } from '../services/escrow.service';

const router = Router();

/**
 * POST /api/escrow/lock
 * Lock funds in escrow when job is created
 * Requirements 6.1, 6.2, 6.6: Lock payment with metadata, wait for confirmations
 */
router.post('/lock', async (req: Request, res: Response) => {
  try {
    const { jobId, consumerSeed, providerAddress, amount, duration } = req.body;

    // Validate required fields
    if (!jobId || !consumerSeed || !providerAddress || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: jobId, consumerSeed, providerAddress, amount'
      });
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number'
      });
    }

    // Validate provider address format
    if (typeof providerAddress !== 'string' || providerAddress.length !== 60) {
      return res.status(400).json({
        success: false,
        error: 'Invalid provider address format (must be 60 characters)'
      });
    }

    // Validate consumer seed format
    if (typeof consumerSeed !== 'string' || consumerSeed.length !== 55) {
      return res.status(400).json({
        success: false,
        error: 'Invalid consumer seed format (must be 55 characters)'
      });
    }

    // Lock escrow
    const result = await escrowService.lockEscrow({
      jobId,
      consumerSeed,
      providerAddress,
      amount,
      duration: duration || 24 // Default 24 hours
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      escrowId: result.escrowId,
      txHash: result.txHash,
      explorerUrl: result.explorerUrl,
      confirmations: result.confirmations,
      message: 'Escrow locked successfully. Waiting for confirmations...'
    });
  } catch (error: any) {
    console.error('Error locking escrow:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to lock escrow'
    });
  }
});

/**
 * POST /api/escrow/release
 * Release payment to provider on job completion
 * Requirement 6.4: Release funds when job completes successfully
 */
router.post('/release', async (req: Request, res: Response) => {
  try {
    const { jobId, providerAddress, amount } = req.body;

    // Validate required fields
    if (!jobId || !providerAddress || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: jobId, providerAddress, amount'
      });
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number'
      });
    }

    // Validate provider address format
    if (typeof providerAddress !== 'string' || providerAddress.length !== 60) {
      return res.status(400).json({
        success: false,
        error: 'Invalid provider address format (must be 60 characters)'
      });
    }

    // Release escrow
    const result = await escrowService.releaseEscrow({
      jobId,
      providerAddress,
      amount
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      txHash: result.txHash,
      explorerUrl: result.explorerUrl,
      releasedAmount: result.releasedAmount,
      message: 'Payment released to provider successfully'
    });
  } catch (error: any) {
    console.error('Error releasing escrow:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to release escrow'
    });
  }
});

/**
 * POST /api/escrow/refund
 * Refund consumer if job fails
 * Requirement 6.5: Refund consumer automatically if job fails
 */
router.post('/refund', async (req: Request, res: Response) => {
  try {
    const { jobId, consumerAddress, amount } = req.body;

    // Validate required fields
    if (!jobId || !consumerAddress || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: jobId, consumerAddress, amount'
      });
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number'
      });
    }

    // Validate consumer address format
    if (typeof consumerAddress !== 'string' || consumerAddress.length !== 60) {
      return res.status(400).json({
        success: false,
        error: 'Invalid consumer address format (must be 60 characters)'
      });
    }

    // Refund escrow
    const result = await escrowService.refundEscrow({
      jobId,
      consumerAddress,
      amount
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      txHash: result.txHash,
      explorerUrl: result.explorerUrl,
      refundedAmount: result.refundedAmount,
      message: 'Escrow refunded to consumer successfully'
    });
  } catch (error: any) {
    console.error('Error refunding escrow:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to refund escrow'
    });
  }
});

/**
 * GET /api/escrow/status/:jobId
 * Get escrow status for a job
 * Requirements 6.3, 6.7: Check if funds are locked, display confirmation count
 */
router.get('/status/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      });
    }

    const status = await escrowService.getEscrowStatus(jobId);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'No escrow found for this job'
      });
    }

    // Format confirmation text (0/3, 1/3, 2/3, 3/3)
    const confirmationText = status.status === 'pending' 
      ? `${status.confirmations}/3`
      : status.status === 'locked'
      ? '3/3'
      : null;

    res.json({
      success: true,
      escrow: {
        ...status,
        confirmationText,
        explorerUrl: status.txHash ? `https://explorer.qubic.org/tx/${status.txHash}` : null
      }
    });
  } catch (error: any) {
    console.error('Error getting escrow status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get escrow status'
    });
  }
});

/**
 * GET /api/escrow/pending
 * Get all pending escrows (for monitoring/admin)
 */
router.get('/pending', async (req: Request, res: Response) => {
  try {
    const pendingEscrows = await escrowService.getPendingEscrows();

    res.json({
      success: true,
      escrows: pendingEscrows.map(escrow => ({
        ...escrow,
        confirmationText: `${escrow.confirmations}/3`,
        explorerUrl: escrow.txHash ? `https://explorer.qubic.org/tx/${escrow.txHash}` : null
      })),
      count: pendingEscrows.length
    });
  } catch (error: any) {
    console.error('Error getting pending escrows:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get pending escrows'
    });
  }
});

export default router;
