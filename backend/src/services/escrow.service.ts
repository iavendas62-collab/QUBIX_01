/**
 * Escrow Payment Service
 * 
 * Comprehensive escrow system for job payments with:
 * - Escrow lock with job metadata
 * - Confirmation polling (wait for 3 confirmations)
 * - Escrow release on job completion
 * - Refund on job failure
 * - Database tracking with status updates
 * - WebSocket broadcasting for real-time updates
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 8.1, 8.2, 8.3, 8.4
 */

import { PrismaClient, TransactionType, TransactionStatus } from '@prisma/client';
import qubicService from './qubic.service';
import { logBlockchainTransaction } from './logger';

const prisma = new PrismaClient();

export interface EscrowLockRequest {
  jobId: string;
  consumerSeed: string;
  providerAddress: string;
  amount: number;
  duration: number; // hours
}

export interface EscrowLockResult {
  success: boolean;
  escrowId?: string;
  txHash?: string;
  explorerUrl?: string;
  confirmations?: number;
  error?: string;
}

export interface EscrowReleaseRequest {
  jobId: string;
  providerAddress: string;
  amount: number;
}

export interface EscrowReleaseResult {
  success: boolean;
  txHash?: string;
  explorerUrl?: string;
  releasedAmount?: number;
  error?: string;
}

export interface EscrowRefundRequest {
  jobId: string;
  consumerAddress: string;
  amount: number;
}

export interface EscrowRefundResult {
  success: boolean;
  txHash?: string;
  explorerUrl?: string;
  refundedAmount?: number;
  error?: string;
}

export interface EscrowStatus {
  escrowId: string;
  jobId: string;
  status: 'locked' | 'released' | 'refunded' | 'pending';
  amount: number;
  confirmations: number;
  txHash: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

class EscrowService {
  private wsManager: any = null;

  /**
   * Set WebSocket manager for broadcasting updates
   */
  setWebSocketManager(wsManager: any): void {
    this.wsManager = wsManager;
  }

  /**
   * Broadcast escrow status update via WebSocket
   * Requirement 6.7: Display confirmation count in UI
   */
  private broadcastEscrowUpdate(jobId: string, update: any): void {
    if (this.wsManager) {
      this.wsManager.broadcastToSubscription(`job:${jobId}`, {
        type: 'ESCROW_UPDATE',
        data: {
          jobId,
          ...update,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Lock funds in escrow for a job
   * Requirements 6.1, 6.2, 6.6: Lock payment before job starts with metadata
   * 
   * @param request - Escrow lock request
   * @returns Escrow lock result with transaction hash
   */
  async lockEscrow(request: EscrowLockRequest): Promise<EscrowLockResult> {
    const { jobId, consumerSeed, providerAddress, amount, duration } = request;

    try {
      console.log(`🔒 Locking escrow for job ${jobId}`);
      console.log(`   Amount: ${amount} QUBIC`);
      console.log(`   Provider: ${providerAddress}`);
      console.log(`   Duration: ${duration} hours`);

      // Validate inputs
      if (amount <= 0) {
        return {
          success: false,
          error: 'Escrow amount must be positive'
        };
      }

      if (!providerAddress || providerAddress.length !== 60) {
        return {
          success: false,
          error: 'Invalid provider address'
        };
      }

      // Check if escrow already exists for this job
      const existingEscrow = await prisma.transaction.findFirst({
        where: {
          jobId,
          type: TransactionType.ESCROW_LOCK
        }
      });

      if (existingEscrow) {
        return {
          success: false,
          error: 'Escrow already exists for this job'
        };
      }

      // Get job and consumer info
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: { user: true }
      });

      if (!job) {
        return {
          success: false,
          error: 'Job not found'
        };
      }

      // Broadcast initial status
      this.broadcastEscrowUpdate(jobId, {
        status: 'creating',
        confirmations: 0,
        requiredConfirmations: 3
      });

      // Create escrow transaction on Qubic blockchain
      // Requirement 6.2: Include job metadata in transaction
      const txHash = await qubicService.createEscrow(
        jobId,
        consumerSeed,
        providerAddress,
        amount
      );

      logBlockchainTransaction({
        type: 'escrow_lock',
        txHash,
        amount: amount,
        status: 'pending',
        jobId,
        to: providerAddress
      });

      // Create escrow record in database
      const escrow = await prisma.transaction.create({
        data: {
          userId: job.userId,
          jobId,
          type: TransactionType.ESCROW_LOCK,
          amount,
          status: TransactionStatus.PENDING,
          qubicTxHash: txHash
        }
      });

      console.log(`✅ Escrow transaction created: ${txHash}`);
      console.log(`   Escrow ID: ${escrow.id}`);

      // Broadcast transaction created
      this.broadcastEscrowUpdate(jobId, {
        status: 'pending',
        txHash,
        explorerUrl: qubicService.getExplorerUrl(txHash),
        confirmations: 0,
        requiredConfirmations: 3
      });

      // Start confirmation polling in background
      // Requirement 6.6: Wait for 3 confirmations
      this.pollConfirmations(escrow.id, txHash, jobId).catch(error => {
        console.error('Error polling confirmations:', error);
      });

      return {
        success: true,
        escrowId: escrow.id,
        txHash,
        explorerUrl: qubicService.getExplorerUrl(txHash),
        confirmations: 0
      };
    } catch (error: any) {
      console.error('❌ Error locking escrow:', error);
      
      logBlockchainTransaction({
        type: 'escrow_lock',
        amount,
        status: 'failed',
        jobId,
        error: error.message
      });

      this.broadcastEscrowUpdate(jobId, {
        status: 'failed',
        error: error.message
      });

      return {
        success: false,
        error: `Failed to lock escrow: ${error.message}`
      };
    }
  }

  /**
   * Poll for transaction confirmations
   * Requirement 6.6, 6.7: Wait for 3 confirmations and display count
   * 
   * @param escrowId - Database escrow ID
   * @param txHash - Blockchain transaction hash
   * @param jobId - Job ID for broadcasting updates
   */
  private async pollConfirmations(
    escrowId: string,
    txHash: string,
    jobId: string
  ): Promise<void> {
    try {
      console.log(`⏳ Polling confirmations for ${txHash}...`);

      const requiredConfirmations = 3;
      let currentConfirmations = 0;

      // Poll with progress callback
      const confirmed = await qubicService.waitForConfirmation(
        txHash,
        requiredConfirmations,
        (confirmations, required) => {
          currentConfirmations = confirmations;
          
          // Broadcast progress update
          // Requirement 6.7: Display confirmation count (0/3, 1/3, 2/3, 3/3)
          this.broadcastEscrowUpdate(jobId, {
            status: 'confirming',
            txHash,
            confirmations,
            requiredConfirmations: required,
            confirmationText: `${confirmations}/${required}`
          });

          console.log(`   Confirmations: ${confirmations}/${required}`);
        }
      );

      if (confirmed) {
        // Update escrow status to completed
        await prisma.transaction.update({
          where: { id: escrowId },
          data: {
            status: TransactionStatus.COMPLETED,
            completedAt: new Date()
          }
        });

        console.log(`✅ Escrow confirmed with ${requiredConfirmations} confirmations`);

        // Broadcast confirmed status
        this.broadcastEscrowUpdate(jobId, {
          status: 'confirmed',
          txHash,
          confirmations: requiredConfirmations,
          requiredConfirmations,
          confirmationText: `${requiredConfirmations}/${requiredConfirmations}`
        });

        logBlockchainTransaction({
          type: 'escrow_lock',
          txHash,
          amount: 0, // Amount already logged in initial transaction
          status: 'completed',
          jobId
        });
      } else {
        console.error('❌ Escrow confirmation failed');
        
        this.broadcastEscrowUpdate(jobId, {
          status: 'failed',
          error: 'Confirmation timeout'
        });
      }
    } catch (error: any) {
      console.error('❌ Error polling confirmations:', error);
      
      this.broadcastEscrowUpdate(jobId, {
        status: 'error',
        error: error.message
      });
    }
  }

  /**
   * Release escrow payment to provider on job completion
   * Requirement 6.4: Release funds to provider when job completes successfully
   * 
   * @param request - Escrow release request
   * @returns Release result with transaction hash
   */
  async releaseEscrow(request: EscrowReleaseRequest): Promise<EscrowReleaseResult> {
    const { jobId, providerAddress, amount } = request;

    try {
      console.log(`💸 Releasing escrow for job ${jobId}`);
      console.log(`   Provider: ${providerAddress}`);
      console.log(`   Amount: ${amount} QUBIC`);

      // Find the escrow lock transaction
      const escrowLock = await prisma.transaction.findFirst({
        where: {
          jobId,
          type: TransactionType.ESCROW_LOCK,
          status: TransactionStatus.COMPLETED // Must be confirmed
        }
      });

      if (!escrowLock) {
        return {
          success: false,
          error: 'No confirmed escrow found for this job'
        };
      }

      // Requirement 6.3: Verify funds are still locked
      const existingRelease = await prisma.transaction.findFirst({
        where: {
          jobId,
          type: { in: [TransactionType.ESCROW_RELEASE, TransactionType.REFUND] }
        }
      });

      if (existingRelease) {
        return {
          success: false,
          error: 'Escrow already released or refunded'
        };
      }

      // Broadcast release starting
      this.broadcastEscrowUpdate(jobId, {
        status: 'releasing',
        amount
      });

      // Release payment on blockchain
      const txHash = await qubicService.releasePayment(
        jobId,
        providerAddress,
        amount
      );

      logBlockchainTransaction({
        type: 'escrow_release',
        txHash,
        amount: amount,
        status: 'completed',
        jobId,
        to: providerAddress
      });

      // Create release transaction record
      const releaseTransaction = await prisma.transaction.create({
        data: {
          userId: escrowLock.userId,
          jobId,
          type: TransactionType.ESCROW_RELEASE,
          amount,
          status: TransactionStatus.COMPLETED,
          qubicTxHash: txHash,
          completedAt: new Date()
        }
      });

      console.log(`✅ Escrow released: ${txHash}`);

      // Broadcast release completed
      this.broadcastEscrowUpdate(jobId, {
        status: 'released',
        txHash,
        explorerUrl: qubicService.getExplorerUrl(txHash),
        amount
      });

      return {
        success: true,
        txHash,
        explorerUrl: qubicService.getExplorerUrl(txHash),
        releasedAmount: amount
      };
    } catch (error: any) {
      console.error('❌ Error releasing escrow:', error);
      
      logBlockchainTransaction({
        type: 'escrow_release',
        amount,
        status: 'failed',
        jobId,
        error: error.message
      });

      this.broadcastEscrowUpdate(jobId, {
        status: 'release_failed',
        error: error.message
      });

      return {
        success: false,
        error: `Failed to release escrow: ${error.message}`
      };
    }
  }

  /**
   * Refund escrow to consumer on job failure
   * Requirement 6.5: Refund consumer automatically if job fails
   * 
   * @param request - Escrow refund request
   * @returns Refund result with transaction hash
   */
  async refundEscrow(request: EscrowRefundRequest): Promise<EscrowRefundResult> {
    const { jobId, consumerAddress, amount } = request;

    try {
      console.log(`↩️  Refunding escrow for job ${jobId}`);
      console.log(`   Consumer: ${consumerAddress}`);
      console.log(`   Amount: ${amount} QUBIC`);

      // Find the escrow lock transaction
      const escrowLock = await prisma.transaction.findFirst({
        where: {
          jobId,
          type: TransactionType.ESCROW_LOCK,
          status: TransactionStatus.COMPLETED // Must be confirmed
        }
      });

      if (!escrowLock) {
        return {
          success: false,
          error: 'No confirmed escrow found for this job'
        };
      }

      // Verify funds haven't been released already
      const existingRelease = await prisma.transaction.findFirst({
        where: {
          jobId,
          type: { in: [TransactionType.ESCROW_RELEASE, TransactionType.REFUND] }
        }
      });

      if (existingRelease) {
        return {
          success: false,
          error: 'Escrow already released or refunded'
        };
      }

      // Broadcast refund starting
      this.broadcastEscrowUpdate(jobId, {
        status: 'refunding',
        amount
      });

      // Refund on blockchain
      const txHash = await qubicService.refundEscrow(
        jobId,
        consumerAddress,
        amount
      );

      logBlockchainTransaction({
        type: 'refund',
        txHash,
        amount: amount,
        status: 'completed',
        jobId,
        to: consumerAddress
      });

      // Create refund transaction record
      const refundTransaction = await prisma.transaction.create({
        data: {
          userId: escrowLock.userId,
          jobId,
          type: TransactionType.REFUND,
          amount,
          status: TransactionStatus.COMPLETED,
          qubicTxHash: txHash,
          completedAt: new Date()
        }
      });

      console.log(`✅ Escrow refunded: ${txHash}`);

      // Broadcast refund completed
      this.broadcastEscrowUpdate(jobId, {
        status: 'refunded',
        txHash,
        explorerUrl: qubicService.getExplorerUrl(txHash),
        amount
      });

      return {
        success: true,
        txHash,
        explorerUrl: qubicService.getExplorerUrl(txHash),
        refundedAmount: amount
      };
    } catch (error: any) {
      console.error('❌ Error refunding escrow:', error);
      
      logBlockchainTransaction({
        type: 'refund',
        amount,
        status: 'failed',
        jobId,
        error: error.message
      });

      this.broadcastEscrowUpdate(jobId, {
        status: 'refund_failed',
        error: error.message
      });

      return {
        success: false,
        error: `Failed to refund escrow: ${error.message}`
      };
    }
  }

  /**
   * Get escrow status for a job
   * Requirement 6.3: Check if funds are held in escrow
   * 
   * @param jobId - Job ID
   * @returns Escrow status information
   */
  async getEscrowStatus(jobId: string): Promise<EscrowStatus | null> {
    try {
      const escrowLock = await prisma.transaction.findFirst({
        where: {
          jobId,
          type: TransactionType.ESCROW_LOCK
        }
      });

      if (!escrowLock) {
        return null;
      }

      // Check if released or refunded
      const completion = await prisma.transaction.findFirst({
        where: {
          jobId,
          type: { in: [TransactionType.ESCROW_RELEASE, TransactionType.REFUND] }
        }
      });

      let status: 'locked' | 'released' | 'refunded' | 'pending';
      if (completion) {
        status = completion.type === TransactionType.ESCROW_RELEASE ? 'released' : 'refunded';
      } else if (escrowLock.status === TransactionStatus.COMPLETED) {
        status = 'locked';
      } else {
        status = 'pending';
      }

      // Get confirmation count if pending
      let confirmations = 0;
      if (escrowLock.qubicTxHash && status === 'pending') {
        try {
          const txStatus = await qubicService.verifyTransaction(escrowLock.qubicTxHash);
          confirmations = txStatus.confirmations;
        } catch (error) {
          console.error('Error getting confirmations:', error);
        }
      } else if (status === 'locked') {
        confirmations = 3; // Completed means 3 confirmations
      }

      return {
        escrowId: escrowLock.id,
        jobId,
        status,
        amount: escrowLock.amount,
        confirmations,
        txHash: escrowLock.qubicTxHash,
        createdAt: escrowLock.createdAt,
        completedAt: completion?.completedAt || escrowLock.completedAt
      };
    } catch (error) {
      console.error('Error getting escrow status:', error);
      return null;
    }
  }

  /**
   * Get all pending escrows (for monitoring)
   */
  async getPendingEscrows(): Promise<EscrowStatus[]> {
    try {
      const pendingEscrows = await prisma.transaction.findMany({
        where: {
          type: TransactionType.ESCROW_LOCK,
          status: TransactionStatus.PENDING
        },
        include: {
          job: true
        },
        orderBy: { createdAt: 'asc' }
      });

      return Promise.all(
        pendingEscrows.map(async (escrow) => {
          let confirmations = 0;
          if (escrow.qubicTxHash) {
            try {
              const txStatus = await qubicService.verifyTransaction(escrow.qubicTxHash);
              confirmations = txStatus.confirmations;
            } catch (error) {
              // Ignore errors
            }
          }

          return {
            escrowId: escrow.id,
            jobId: escrow.jobId!,
            status: 'pending' as const,
            amount: escrow.amount,
            confirmations,
            txHash: escrow.qubicTxHash,
            createdAt: escrow.createdAt,
            completedAt: null
          };
        })
      );
    } catch (error) {
      console.error('Error getting pending escrows:', error);
      return [];
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}

// Export singleton instance
export const escrowService = new EscrowService();
