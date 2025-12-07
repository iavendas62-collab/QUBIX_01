/**
 * Transaction Routes
 * 
 * API endpoints for transaction history and escrow management
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 2.4, 2.5
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { transactionService } from '../services/transaction.service';

const prisma = new PrismaClient();

export function transactionRoutes(services: any) {
  const router = Router();

  /**
   * GET /api/transactions/history/:qubicAddress
   * Get transaction history for a user with pagination and filtering
   * Query params:
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 50)
   * - type: Filter by transaction type (PAYMENT, EARNING, REFUND, ESCROW_LOCK, ESCROW_RELEASE)
   * - status: Filter by status (PENDING, COMPLETED, FAILED)
   * - startDate: Filter by start date (ISO string)
   * - endDate: Filter by end date (ISO string)
   */
  router.get('/history/:qubicAddress', async (req, res) => {
    try {
      const { qubicAddress } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const type = req.query.type as string;
      const status = req.query.status as string;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      // Find user by qubic address
      const user = await prisma.user.findUnique({
        where: { qubicAddress }
      });

      if (!user) {
        return res.json({ 
          success: true, 
          transactions: [],
          total: 0,
          page: 1,
          totalPages: 0
        });
      }

      const result = await transactionService.getTransactionHistory(user.id, {
        page,
        limit,
        type: type as any,
        status: status as any,
        startDate,
        endDate
      });

      res.json({
        success: true,
        ...result
      });
    } catch (error: any) {
      console.error('Error fetching transaction history:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/transactions/:transactionId
   * Get transaction details by ID
   */
  router.get('/:transactionId', async (req, res) => {
    try {
      const { transactionId } = req.params;

      const transaction = await transactionService.getTransaction(transactionId);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found'
        });
      }

      res.json({
        success: true,
        transaction
      });
    } catch (error: any) {
      console.error('Error fetching transaction:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/transactions/escrow/:jobId
   * Get escrow status for a job
   * Requirement 8.2: Check if funds are held in escrow
   */
  router.get('/escrow/:jobId', async (req, res) => {
    try {
      const { jobId } = req.params;

      const escrowStatus = await transactionService.getEscrowStatus(jobId);

      res.json({
        success: true,
        ...escrowStatus
      });
    } catch (error: any) {
      console.error('Error fetching escrow status:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/transactions/pending-escrows
   * Get all pending escrows (admin endpoint)
   */
  router.get('/admin/pending-escrows', async (req, res) => {
    try {
      const pendingEscrows = await transactionService.getPendingEscrows();

      res.json({
        success: true,
        escrows: pendingEscrows,
        count: pendingEscrows.length
      });
    } catch (error: any) {
      console.error('Error fetching pending escrows:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/transactions/provider/:providerId/earnings
   * Get earnings summary for a provider
   */
  router.get('/provider/:providerId/earnings', async (req, res) => {
    try {
      const { providerId } = req.params;

      const earnings = await transactionService.getProviderEarnings(providerId);

      res.json({
        success: true,
        earnings
      });
    } catch (error: any) {
      console.error('Error fetching provider earnings:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/transactions/escrow/lock
   * Manually lock escrow (for testing/admin)
   */
  router.post('/escrow/lock', async (req, res) => {
    try {
      const { userId, jobId, amount } = req.body;

      if (!userId || !jobId || !amount) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: userId, jobId, amount'
        });
      }

      const result = await transactionService.lockEscrow(userId, jobId, amount);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error: any) {
      console.error('Error locking escrow:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/transactions/escrow/release
   * Manually release escrow (for testing/admin)
   */
  router.post('/escrow/release', async (req, res) => {
    try {
      const { jobId } = req.body;

      if (!jobId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: jobId'
        });
      }

      const result = await transactionService.releaseEscrow(jobId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error: any) {
      console.error('Error releasing escrow:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/transactions/escrow/refund
   * Manually refund escrow (for testing/admin)
   */
  router.post('/escrow/refund', async (req, res) => {
    try {
      const { jobId } = req.body;

      if (!jobId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: jobId'
        });
      }

      const result = await transactionService.refundEscrow(jobId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error: any) {
      console.error('Error refunding escrow:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
}
