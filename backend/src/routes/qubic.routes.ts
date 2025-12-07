/**
 * Qubic Blockchain API Routes
 * Real integration with Qubic network for hackathon demo
 */

import { Router } from 'express';
import { z } from 'zod';
import { qubicWallet } from '../services/qubic-wallet.service';
import { qubicEscrow } from '../services/qubic-escrow.service';

// Validation schemas
const BalanceQuerySchema = z.object({
  address: z.string().length(60).regex(/^[A-Z]+$/)
});

const TransferSchema = z.object({
  fromAddress: z.string().length(60).regex(/^[A-Z]+$/),
  fromSeed: z.string().length(55).regex(/^[a-z]+$/),
  toAddress: z.string().length(60).regex(/^[A-Z]+$/),
  amount: z.number().positive()
});

const EscrowCreateSchema = z.object({
  consumerAddress: z.string().length(60).regex(/^[A-Z]+$/),
  consumerSeed: z.string().length(55).regex(/^[a-z]+$/),
  providerAddress: z.string().length(60).regex(/^[A-Z]+$/),
  amount: z.number().positive(),
  jobId: z.string(),
  expiryHours: z.number().min(1).max(168).optional() // Max 1 week
});

const EscrowActionSchema = z.object({
  escrowId: z.string(),
  consumerAddress: z.string().length(60).regex(/^[A-Z]+$/),
  consumerSeed: z.string().length(55).regex(/^[a-z]+$/)
});

const router = Router();

/**
 * GET /api/qubic/network
 * Get network information
 */
router.get('/network', async (req, res) => {
  try {
    console.log('🌐 Getting Qubic network info...');

    const networkInfo = await qubicWallet.getNetworkInfo();

    res.json({
      success: true,
      network: networkInfo
    });
  } catch (error: any) {
    console.error('Network info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get network information',
      details: error.message
    });
  }
});

/**
 * GET /api/qubic/balance/:address
 * Get balance for Qubic address
 */
router.get('/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;

    console.log(`💰 Getting balance for ${address.slice(0, 10)}...`);

    // Validate address
    BalanceQuerySchema.parse({ address });

    const balance = await qubicWallet.getBalance(address);

    res.json({
      success: true,
      balance: balance.balance,
      tick: balance.tick,
      latest: balance.latest,
      address
    });
  } catch (error: any) {
    console.error('Balance error:', error);

    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid address format',
        details: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to get balance',
      details: error.message
    });
  }
});

/**
 * POST /api/qubic/transfer
 * Send QUBIC between addresses
 */
router.post('/transfer', async (req, res) => {
  try {
    const { fromAddress, fromSeed, toAddress, amount } = req.body;

    console.log(`💸 Transfer request: ${amount} QUBIC from ${fromAddress.slice(0, 10)}... to ${toAddress.slice(0, 10)}...`);

    // Validate input
    TransferSchema.parse({ fromAddress, fromSeed, toAddress, amount });

    const result = await qubicWallet.sendTransaction(fromAddress, fromSeed, toAddress, amount);

    res.json({
      success: true,
      transaction: result,
      message: `Successfully transferred ${amount} QUBIC`
    });
  } catch (error: any) {
    console.error('Transfer error:', error);

    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid transfer data',
        details: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Transfer failed',
      details: error.message
    });
  }
});

/**
 * POST /api/qubic/escrow/create
 * Create escrow for job payment
 */
router.post('/escrow/create', async (req, res) => {
  try {
    const { consumerAddress, consumerSeed, providerAddress, amount, jobId, expiryHours = 24 } = req.body;

    console.log(`🔐 Creating escrow for job ${jobId}: ${amount} QUBIC`);

    // Validate input
    EscrowCreateSchema.parse({ consumerAddress, consumerSeed, providerAddress, amount, jobId, expiryHours });

    const result = await qubicEscrow.createEscrow(
      consumerAddress,
      consumerSeed,
      providerAddress,
      amount,
      jobId,
      expiryHours
    );

    res.json({
      success: true,
      escrow: result,
      message: `Escrow created for ${amount} QUBIC`
    });
  } catch (error: any) {
    console.error('Escrow creation error:', error);

    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid escrow data',
        details: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Escrow creation failed',
      details: error.message
    });
  }
});

/**
 * POST /api/qubic/escrow/release
 * Release escrow payment to provider
 */
router.post('/escrow/release', async (req, res) => {
  try {
    const { escrowId, consumerAddress, consumerSeed } = req.body;

    console.log(`💰 Releasing escrow ${escrowId}`);

    // Validate input
    EscrowActionSchema.parse({ escrowId, consumerAddress, consumerSeed });

    const result = await qubicEscrow.releaseEscrow(escrowId, consumerAddress, consumerSeed);

    res.json({
      success: true,
      escrow: result,
      message: `Escrow released: ${result.amountReleased} QUBIC`
    });
  } catch (error: any) {
    console.error('Escrow release error:', error);

    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid escrow data',
        details: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Escrow release failed',
      details: error.message
    });
  }
});

/**
 * POST /api/qubic/escrow/refund
 * Refund escrow to consumer
 */
router.post('/escrow/refund', async (req, res) => {
  try {
    const { escrowId, consumerAddress, consumerSeed } = req.body;

    console.log(`↩️ Refunding escrow ${escrowId}`);

    // Validate input
    EscrowActionSchema.parse({ escrowId, consumerAddress, consumerSeed });

    const result = await qubicEscrow.refundEscrow(escrowId, consumerAddress, consumerSeed);

    res.json({
      success: true,
      escrow: result,
      message: `Escrow refunded: ${result.amountRefunded} QUBIC`
    });
  } catch (error: any) {
    console.error('Escrow refund error:', error);

    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid escrow data',
        details: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Escrow refund failed',
      details: error.message
    });
  }
});

/**
 * GET /api/qubic/escrow/:escrowId
 * Get escrow status
 */
router.get('/escrow/:escrowId', async (req, res) => {
  try {
    const { escrowId } = req.params;

    console.log(`📋 Getting escrow status: ${escrowId}`);

    const escrow = await qubicEscrow.getEscrowStatus(escrowId);

    if (!escrow) {
      return res.status(404).json({
        success: false,
        error: 'Escrow not found'
      });
    }

    res.json({
      success: true,
      escrow
    });
  } catch (error: any) {
    console.error('Get escrow error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get escrow status',
      details: error.message
    });
  }
});

/**
 * GET /api/qubic/escrow/user/:address
 * Get all escrows for a user
 */
router.get('/escrow/user/:address', async (req, res) => {
  try {
    const { address } = req.params;

    console.log(`👤 Getting escrows for ${address.slice(0, 10)}...`);

    // Validate address
    BalanceQuerySchema.parse({ address });

    const escrows = await qubicEscrow.getUserEscrows(address);

    res.json({
      success: true,
      escrows,
      count: escrows.length
    });
  } catch (error: any) {
    console.error('Get user escrows error:', error);

    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid address format',
        details: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to get user escrows',
      details: error.message
    });
  }
});

/**
 * GET /api/qubic/escrow/stats
 * Get escrow statistics
 */
router.get('/escrow/stats', async (req, res) => {
  try {
    console.log('📊 Getting escrow statistics...');

    const stats = await qubicEscrow.getEscrowStats();

    res.json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error('Escrow stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get escrow statistics',
      details: error.message
    });
  }
});

export default router;
