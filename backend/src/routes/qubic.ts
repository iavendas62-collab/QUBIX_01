/**
 * Qubic Blockchain API Routes
 * 
 * Implements Requirements 5.1-5.7, 10.3
 * 
 * Endpoints:
 * - POST /api/qubic/wallet/connect - Connect wallet
 * - GET /api/qubic/balance/:address - Get balance with caching
 * - POST /api/qubic/transaction - Create and broadcast transaction
 * - GET /api/qubic/transaction/:hash - Get transaction status
 * - POST /api/qubic/escrow/lock - Create escrow transaction
 * - POST /api/qubic/escrow/release - Release payment to provider
 * - POST /api/qubic/escrow/refund - Refund consumer
 * - GET /api/qubic/explorer/:hash - Get explorer URL
 */

import { Router, Request, Response } from 'express';
import qubicService from '../services/qubic.service';

const router = Router();

// Simple validation helper
function validateRequest(rules: Record<string, (value: any) => string | null>) {
  return (req: Request, res: Response, next: Function) => {
    const errors: string[] = [];
    
    for (const [field, validator] of Object.entries(rules)) {
      const value = req.body[field] || req.params[field];
      const error = validator(value);
      if (error) {
        errors.push(`${field}: ${error}`);
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }
    
    next();
  };
}

/**
 * POST /api/qubic/wallet/connect
 * Connect wallet (create new or import existing)
 * Requirement 5.1: Wallet connection
 */
router.post(
  '/wallet/connect',
  validateRequest({
    seed: (value) => {
      if (value && (typeof value !== 'string' || value.length !== 55)) {
        return 'Seed must be 55 characters';
      }
      return null;
    }
  }),
  async (req: Request, res: Response) => {
    try {
      const { seed } = req.body;

      const wallet = await qubicService.connectWallet(seed);

      res.json({
        success: true,
        wallet: {
          address: wallet.address,
          balance: wallet.balance
        }
      });
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to connect wallet'
      });
    }
  }
);

/**
 * GET /api/qubic/balance/:address
 * Get balance for address with caching
 * Requirements 5.2, 5.7: Balance query with 30s TTL
 */
router.get(
  '/balance/:address',
  async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      
      if (!address || address.length !== 60) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Qubic identity format (must be 60 characters)'
        });
      }

      // Validate identity format
      if (!qubicService.validateIdentity(address)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Qubic identity format'
        });
      }

      const balance = await qubicService.getBalance(address);

      res.json({
        success: true,
        balance: balance.balanceQubic,
        balanceRaw: balance.balance,
        cached: balance.cached,
        cacheAge: balance.cacheAge
      });
    } catch (error: any) {
      console.error('Error fetching balance:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch balance'
      });
    }
  }
);

/**
 * POST /api/qubic/transaction
 * Create and broadcast transaction
 * Requirements 5.3, 5.4: Transaction creation and broadcasting
 */
router.post(
  '/transaction',
  validateRequest({
    fromSeed: (value) => {
      if (!value || typeof value !== 'string' || value.length !== 55) {
        return 'Invalid seed format (must be 55 characters)';
      }
      return null;
    },
    toAddress: (value) => {
      if (!value || typeof value !== 'string' || value.length !== 60) {
        return 'Invalid recipient identity (must be 60 characters)';
      }
      return null;
    },
    amount: (value) => {
      if (!value || typeof value !== 'number' || value <= 0) {
        return 'Amount must be positive';
      }
      return null;
    }
  }),
  async (req: Request, res: Response) => {
    try {
      const { fromSeed, toAddress, amount, metadata } = req.body;

      const transaction = await qubicService.createTransaction(
        fromSeed,
        toAddress,
        amount,
        metadata
      );

      res.json({
        success: true,
        txHash: transaction.hash,
        explorerUrl: qubicService.getExplorerUrl(transaction.hash),
        transaction: {
          hash: transaction.hash,
          from: transaction.from,
          to: transaction.to,
          amount: transaction.amount,
          timestamp: transaction.timestamp
        }
      });
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create transaction'
      });
    }
  }
);

/**
 * GET /api/qubic/transaction/:hash
 * Get transaction status
 * Requirement 5.6: Transaction verification
 */
router.get(
  '/transaction/:hash',
  async (req: Request, res: Response) => {
    try {
      const { hash } = req.params;
      
      if (!hash) {
        return res.status(400).json({
          success: false,
          error: 'Transaction hash is required'
        });
      }

      const status = await qubicService.verifyTransaction(hash);

      res.json({
        success: true,
        status: status.status,
        confirmations: status.confirmations,
        blockHeight: status.blockHeight,
        timestamp: status.timestamp,
        explorerUrl: qubicService.getExplorerUrl(hash)
      });
    } catch (error: any) {
      console.error('Error verifying transaction:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to verify transaction'
      });
    }
  }
);

/**
 * POST /api/qubic/escrow/lock
 * Create escrow transaction for job
 */
router.post(
  '/escrow/lock',
  validateRequest({
    jobId: (value) => !value ? 'Job ID is required' : null,
    consumerSeed: (value) => {
      if (!value || typeof value !== 'string' || value.length !== 55) {
        return 'Invalid consumer seed (must be 55 characters)';
      }
      return null;
    },
    providerAddress: (value) => {
      if (!value || typeof value !== 'string' || value.length !== 60) {
        return 'Invalid provider identity (must be 60 characters)';
      }
      return null;
    },
    amount: (value) => {
      if (!value || typeof value !== 'number' || value <= 0) {
        return 'Amount must be positive';
      }
      return null;
    }
  }),
  async (req: Request, res: Response) => {
    try {
      const { jobId, consumerSeed, providerAddress, amount } = req.body;

      const txHash = await qubicService.createEscrow(
        jobId,
        consumerSeed,
        providerAddress,
        amount
      );

      res.json({
        success: true,
        txHash,
        explorerUrl: qubicService.getExplorerUrl(txHash),
        jobId,
        amount
      });
    } catch (error: any) {
      console.error('Error creating escrow:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create escrow'
      });
    }
  }
);

/**
 * POST /api/qubic/escrow/release
 * Release payment to provider after job completion
 */
router.post(
  '/escrow/release',
  validateRequest({
    jobId: (value) => !value ? 'Job ID is required' : null,
    providerAddress: (value) => {
      if (!value || typeof value !== 'string' || value.length !== 60) {
        return 'Invalid provider identity (must be 60 characters)';
      }
      return null;
    },
    amount: (value) => {
      if (!value || typeof value !== 'number' || value <= 0) {
        return 'Amount must be positive';
      }
      return null;
    }
  }),
  async (req: Request, res: Response) => {
    try {
      const { jobId, providerAddress, amount } = req.body;

      const txHash = await qubicService.releasePayment(
        jobId,
        providerAddress,
        amount
      );

      res.json({
        success: true,
        txHash,
        explorerUrl: qubicService.getExplorerUrl(txHash),
        jobId,
        providerAddress,
        amount
      });
    } catch (error: any) {
      console.error('Error releasing payment:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to release payment'
      });
    }
  }
);

/**
 * POST /api/qubic/escrow/refund
 * Refund consumer if job fails
 */
router.post(
  '/escrow/refund',
  validateRequest({
    jobId: (value) => !value ? 'Job ID is required' : null,
    consumerAddress: (value) => {
      if (!value || typeof value !== 'string' || value.length !== 60) {
        return 'Invalid consumer identity (must be 60 characters)';
      }
      return null;
    },
    amount: (value) => {
      if (!value || typeof value !== 'number' || value <= 0) {
        return 'Amount must be positive';
      }
      return null;
    }
  }),
  async (req: Request, res: Response) => {
    try {
      const { jobId, consumerAddress, amount } = req.body;

      const txHash = await qubicService.refundEscrow(
        jobId,
        consumerAddress,
        amount
      );

      res.json({
        success: true,
        txHash,
        explorerUrl: qubicService.getExplorerUrl(txHash),
        jobId,
        consumerAddress,
        amount
      });
    } catch (error: any) {
      console.error('Error refunding escrow:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to refund escrow'
      });
    }
  }
);

/**
 * GET /api/qubic/explorer/:hash
 * Get explorer URL for transaction
 * Requirement 10.3: Explorer URL generation
 */
router.get(
  '/explorer/:hash',
  async (req: Request, res: Response) => {
    try {
      const { hash } = req.params;
      
      if (!hash) {
        return res.status(400).json({
          success: false,
          error: 'Transaction hash is required'
        });
      }

      const explorerUrl = qubicService.getExplorerUrl(hash);

      res.json({
        success: true,
        hash,
        explorerUrl
      });
    } catch (error: any) {
      console.error('Error generating explorer URL:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate explorer URL'
      });
    }
  }
);

/**
 * POST /api/qubic/wait-confirmation
 * Wait for transaction confirmation (long-polling endpoint)
 */
router.post(
  '/wait-confirmation',
  validateRequest({
    txHash: (value) => !value ? 'Transaction hash is required' : null,
    requiredConfirmations: (value) => {
      if (value && (typeof value !== 'number' || value < 1 || value > 10)) {
        return 'Required confirmations must be between 1 and 10';
      }
      return null;
    }
  }),
  async (req: Request, res: Response) => {
    try {
      const { txHash, requiredConfirmations = 3 } = req.body;

      // Set timeout for long-polling
      req.setTimeout(120000); // 2 minutes

      const confirmed = await qubicService.waitForConfirmation(
        txHash,
        requiredConfirmations
      );

      res.json({
        success: true,
        confirmed,
        txHash,
        confirmations: requiredConfirmations,
        explorerUrl: qubicService.getExplorerUrl(txHash)
      });
    } catch (error: any) {
      console.error('Error waiting for confirmation:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to wait for confirmation'
      });
    }
  }
);

export default router;
