/**
 * Wallet Routes
 * 
 * API endpoints for Qubic wallet operations
 * Requirements: 2.1, 2.2, 2.3
 */

import { Router, Request, Response } from 'express';
import { walletService } from '../services/wallet.service';

export function walletRoutes() {
  const router = Router();

  /**
   * POST /api/wallet/connect
   * Connect Qubic wallet
   * 
   * Requirement 2.1: Provide wallet connection option
   * Requirement 2.2: Verify wallet address format
   * Requirement 2.3: Display user's QUBIC balance
   */
  router.post('/connect', async (req: Request, res: Response) => {
    try {
      const { qubicAddress, signature, email, username } = req.body;

      // Validate required fields
      if (!qubicAddress) {
        return res.status(400).json({
          success: false,
          message: 'Qubic address is required'
        });
      }

      // Connect wallet
      const result = await walletService.connectWallet({
        qubicAddress,
        signature,
        email,
        username
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  });

  /**
   * GET /api/wallet/:address/balance
   * Get balance for a Qubic address
   * 
   * Requirement 2.3: Display user's QUBIC balance
   */
  router.get('/:address/balance', async (req: Request, res: Response) => {
    try {
      const { address } = req.params;

      // Validate address format
      if (!walletService.validateAddress(address)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Qubic address format'
        });
      }

      // Get balance
      const balance = await walletService.getBalance(address);

      return res.status(200).json({
        success: true,
        ...balance
      });
    } catch (error: any) {
      console.error('Balance query error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch balance'
      });
    }
  });

  /**
   * POST /api/wallet/validate
   * Validate Qubic address format
   * 
   * Requirement 2.2: Verify wallet address format
   */
  router.post('/validate', async (req: Request, res: Response) => {
    try {
      const { address } = req.body;

      if (!address) {
        return res.status(400).json({
          success: false,
          valid: false,
          message: 'Address is required'
        });
      }

      const isValid = walletService.validateAddress(address);

      return res.status(200).json({
        success: true,
        valid: isValid,
        message: isValid 
          ? 'Valid Qubic address' 
          : 'Invalid Qubic address format. Must be 60 uppercase characters.'
      });
    } catch (error: any) {
      console.error('Address validation error:', error);
      return res.status(500).json({
        success: false,
        valid: false,
        message: error.message || 'Validation failed'
      });
    }
  });

  /**
   * GET /api/wallet/:address/transactions
   * Get transaction history for an address
   */
  router.get('/:address/transactions', async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      // Validate address
      if (!walletService.validateAddress(address)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Qubic address format'
        });
      }

      // Get transaction history
      const transactions = await walletService.getTransactionHistory(address, limit);

      return res.status(200).json({
        success: true,
        transactions,
        count: transactions.length
      });
    } catch (error: any) {
      console.error('Transaction history error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch transaction history'
      });
    }
  });

  /**
   * POST /api/wallet/disconnect
   * Disconnect wallet (cleanup)
   */
  router.post('/disconnect', async (req: Request, res: Response) => {
    try {
      // Perform any necessary cleanup
      // For now, this is mostly a placeholder for future session management
      
      return res.status(200).json({
        success: true,
        message: 'Wallet disconnected successfully'
      });
    } catch (error: any) {
      console.error('Wallet disconnect error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to disconnect wallet'
      });
    }
  });

  return router;
}

