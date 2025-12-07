/**
 * Transaction Service - Escrow Payment System
 * 
 * Handles escrow lock, release, and refund operations for job payments.
 * Integrates with Qubic blockchain for actual transfers.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 2.4, 2.5, 4.6
 */

import { PrismaClient, TransactionType, TransactionStatus, JobStatus } from '@prisma/client';
import { qubicReal } from './qubic-real';
import { logBlockchainTransaction, dbLogger } from './logger';

const prisma = new PrismaClient();

export interface EscrowLockResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  lockedAmount?: number;
}

export interface EscrowReleaseResult {
  success: boolean;
  transactionId?: string;
  qubicTxHash?: string;
  error?: string;
  releasedAmount?: number;
}

export interface RefundResult {
  success: boolean;
  transactionId?: string;
  qubicTxHash?: string;
  error?: string;
  refundedAmount?: number;
}

export interface TransactionHistoryItem {
  id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  qubicTxHash: string | null;
  createdAt: Date;
  completedAt: Date | null;
  job?: {
    id: string;
    modelType: string;
    status: JobStatus;
  } | null;
}

export class TransactionService {
  /**
   * Lock funds in escrow when a job is created
   * Requirement 8.1: Lock payment amount in escrow when consumer rents GPU time
   * 
   * @param userId - Consumer's user ID
   * @param jobId - Job ID to associate with escrow
   * @param amount - Amount to lock in escrow
   * @returns EscrowLockResult
   */
  async lockEscrow(userId: string, jobId: string, amount: number): Promise<EscrowLockResult> {
    try {
      logBlockchainTransaction({
        type: 'escrow_lock',
        amount,
        status: 'pending',
        jobId,
      });

      // Validate amount
      if (amount <= 0) {
        return {
          success: false,
          error: 'Escrow amount must be positive'
        };
      }

      // Get user and validate balance
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      if (user.balance < amount) {
        return {
          success: false,
          error: `Insufficient balance. Required: ${amount} QUBIC, Available: ${user.balance} QUBIC`
        };
      }

      // Check if escrow already exists for this job
      const existingEscrow = await prisma.transaction.findUnique({
        where: { jobId }
      });

      if (existingEscrow && existingEscrow.type === TransactionType.ESCROW_LOCK) {
        return {
          success: false,
          error: 'Escrow already locked for this job'
        };
      }

      // Use transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx) => {
        // Deduct from user balance
        await tx.user.update({
          where: { id: userId },
          data: { balance: { decrement: amount } }
        });

        // Create escrow lock transaction
        const transaction = await tx.transaction.create({
          data: {
            userId,
            jobId,
            type: TransactionType.ESCROW_LOCK,
            amount,
            status: TransactionStatus.PENDING
          }
        });

        return transaction;
      });

      logBlockchainTransaction({
        type: 'escrow_lock',
        amount,
        status: 'completed',
        jobId,
      });

      return {
        success: true,
        transactionId: result.id,
        lockedAmount: amount
      };
    } catch (error: any) {
      logBlockchainTransaction({
        type: 'escrow_lock',
        amount,
        status: 'failed',
        jobId,
        error: error.message,
      });
      return {
        success: false,
        error: `Failed to lock escrow: ${error.message}`
      };
    }
  }


  /**
   * Release escrow funds to provider on job completion
   * Requirement 8.3: Release payment to provider when job completes successfully
   * Requirement 4.6: Transfer QUBIC payment to provider when job completes
   * 
   * @param jobId - Job ID to release escrow for
   * @param providerSeed - Provider's wallet seed for receiving payment (optional for blockchain tx)
   * @returns EscrowReleaseResult
   */
  async releaseEscrow(jobId: string, providerSeed?: string): Promise<EscrowReleaseResult> {
    try {
      dbLogger.info({ jobId }, 'Releasing escrow for job');

      // Get job with provider and escrow transaction
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: {
          provider: {
            include: { user: true }
          },
          user: true,
          transaction: true
        }
      });

      if (!job) {
        return {
          success: false,
          error: 'Job not found'
        };
      }

      if (!job.provider) {
        return {
          success: false,
          error: 'Job has no assigned provider'
        };
      }

      // Find the escrow lock transaction
      const escrowLock = await prisma.transaction.findFirst({
        where: {
          jobId,
          type: TransactionType.ESCROW_LOCK,
          status: TransactionStatus.PENDING
        }
      });

      if (!escrowLock) {
        return {
          success: false,
          error: 'No pending escrow found for this job'
        };
      }

      // Calculate actual payment amount (use actual cost if available, otherwise estimated)
      const paymentAmount = job.actualCost || job.estimatedCost;

      // Use transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx) => {
        // Mark escrow lock as completed
        await tx.transaction.update({
          where: { id: escrowLock.id },
          data: {
            status: TransactionStatus.COMPLETED,
            completedAt: new Date()
          }
        });

        // Create escrow release transaction
        const releaseTransaction = await tx.transaction.create({
          data: {
            userId: job.provider!.userId,
            jobId,
            type: TransactionType.ESCROW_RELEASE,
            amount: paymentAmount,
            status: TransactionStatus.PENDING
          }
        });

        // Credit provider's balance
        await tx.user.update({
          where: { id: job.provider!.userId },
          data: { balance: { increment: paymentAmount } }
        });

        // Update provider earnings
        await tx.provider.update({
          where: { id: job.providerId! },
          data: { totalEarnings: { increment: paymentAmount } }
        });

        // If there's a difference between locked and actual, refund the consumer
        const refundAmount = escrowLock.amount - paymentAmount;
        if (refundAmount > 0) {
          await tx.user.update({
            where: { id: job.userId },
            data: { balance: { increment: refundAmount } }
          });
          dbLogger.info({ refundAmount, jobId }, 'Refunded QUBIC difference to consumer');
        }

        return releaseTransaction;
      });

      // Attempt blockchain transfer (non-blocking)
      let qubicTxHash: string | undefined;
      try {
        if (providerSeed && job.provider.qubicAddress) {
          const txResult = await qubicReal.sendTransaction(
            providerSeed,
            job.provider.qubicAddress,
            Math.floor(paymentAmount)
          );
          if (txResult.success) {
            qubicTxHash = txResult.txId;
            // Update transaction with blockchain hash
            await prisma.transaction.update({
              where: { id: result.id },
              data: {
                qubicTxHash,
                status: TransactionStatus.COMPLETED,
                completedAt: new Date()
              }
            });

            logBlockchainTransaction({
              type: 'escrow_release',
              txHash: qubicTxHash,
              to: job.provider.qubicAddress,
              amount: paymentAmount,
              status: 'completed',
              jobId,
            });
          }
        } else {
          // Mark as completed without blockchain tx (internal transfer)
          await prisma.transaction.update({
            where: { id: result.id },
            data: {
              status: TransactionStatus.COMPLETED,
              completedAt: new Date()
            }
          });

          logBlockchainTransaction({
            type: 'escrow_release',
            amount: paymentAmount,
            status: 'completed',
            jobId,
          });
        }
      } catch (blockchainError: any) {
        logBlockchainTransaction({
          type: 'escrow_release',
          amount: paymentAmount,
          status: 'failed',
          jobId,
          error: blockchainError.message,
        });
        // Still mark as completed since internal balance was updated
        await prisma.transaction.update({
          where: { id: result.id },
          data: {
            status: TransactionStatus.COMPLETED,
            completedAt: new Date()
          }
        });
      }

      dbLogger.info({ paymentAmount, workerId: job.provider.workerId }, 'Escrow released to provider');

      return {
        success: true,
        transactionId: result.id,
        qubicTxHash,
        releasedAmount: paymentAmount
      };
    } catch (error: any) {
      logBlockchainTransaction({
        type: 'escrow_release',
        amount: 0,
        status: 'failed',
        jobId,
        error: error.message,
      });
      return {
        success: false,
        error: `Failed to release escrow: ${error.message}`
      };
    }
  }


  /**
   * Refund escrow to consumer on job failure
   * Requirement 8.4: Refund consumer automatically if job fails
   * 
   * @param jobId - Job ID to refund escrow for
   * @returns RefundResult
   */
  async refundEscrow(jobId: string): Promise<RefundResult> {
    try {
      dbLogger.info({ jobId }, 'Refunding escrow for failed job');

      // Get job with consumer info
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

      // Find the escrow lock transaction
      const escrowLock = await prisma.transaction.findFirst({
        where: {
          jobId,
          type: TransactionType.ESCROW_LOCK,
          status: TransactionStatus.PENDING
        }
      });

      if (!escrowLock) {
        return {
          success: false,
          error: 'No pending escrow found for this job'
        };
      }

      // Use transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx) => {
        // Mark escrow lock as completed (processed)
        await tx.transaction.update({
          where: { id: escrowLock.id },
          data: {
            status: TransactionStatus.COMPLETED,
            completedAt: new Date()
          }
        });

        // Create refund transaction
        const refundTransaction = await tx.transaction.create({
          data: {
            userId: job.userId,
            jobId,
            type: TransactionType.REFUND,
            amount: escrowLock.amount,
            status: TransactionStatus.COMPLETED,
            completedAt: new Date()
          }
        });

        // Credit consumer's balance back
        await tx.user.update({
          where: { id: job.userId },
          data: { balance: { increment: escrowLock.amount } }
        });

        return refundTransaction;
      });

      logBlockchainTransaction({
        type: 'refund',
        to: job.user.qubicAddress,
        amount: escrowLock.amount,
        status: 'completed',
        jobId,
      });

      return {
        success: true,
        transactionId: result.id,
        refundedAmount: escrowLock.amount
      };
    } catch (error: any) {
      logBlockchainTransaction({
        type: 'refund',
        amount: 0,
        status: 'failed',
        jobId,
        error: error.message,
      });
      return {
        success: false,
        error: `Failed to refund escrow: ${error.message}`
      };
    }
  }

  /**
   * Get escrow status for a job
   * Requirement 8.2: Hold funds until completion or failure
   * 
   * @param jobId - Job ID to check escrow status
   * @returns Escrow status information
   */
  async getEscrowStatus(jobId: string): Promise<{
    hasEscrow: boolean;
    status: TransactionStatus | null;
    amount: number;
    lockedAt: Date | null;
  }> {
    try {
      const escrowLock = await prisma.transaction.findFirst({
        where: {
          jobId,
          type: TransactionType.ESCROW_LOCK
        }
      });

      if (!escrowLock) {
        return {
          hasEscrow: false,
          status: null,
          amount: 0,
          lockedAt: null
        };
      }

      return {
        hasEscrow: true,
        status: escrowLock.status,
        amount: escrowLock.amount,
        lockedAt: escrowLock.createdAt
      };
    } catch (error) {
      console.error('Error getting escrow status:', error);
      return {
        hasEscrow: false,
        status: null,
        amount: 0,
        lockedAt: null
      };
    }
  }


  /**
   * Get transaction history for a user with pagination and filtering
   * 
   * @param userId - User ID
   * @param options - Query options (pagination, filtering)
   * @returns Paginated transaction history
   */
  async getTransactionHistory(
    userId: string, 
    options: {
      page?: number;
      limit?: number;
      type?: TransactionType;
      status?: TransactionStatus;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{
    transactions: TransactionHistoryItem[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 50;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = { userId };
      
      if (options.type) {
        where.type = options.type;
      }
      
      if (options.status) {
        where.status = options.status;
      }
      
      if (options.startDate || options.endDate) {
        where.createdAt = {};
        if (options.startDate) {
          where.createdAt.gte = options.startDate;
        }
        if (options.endDate) {
          where.createdAt.lte = options.endDate;
        }
      }

      // Get total count
      const total = await prisma.transaction.count({ where });

      // Get transactions
      const transactions = await prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          job: {
            select: {
              id: true,
              modelType: true,
              status: true
            }
          }
        }
      });

      const items = transactions.map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        status: tx.status,
        qubicTxHash: tx.qubicTxHash,
        createdAt: tx.createdAt,
        completedAt: tx.completedAt,
        job: tx.job
      }));

      return {
        transactions: items,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return {
        transactions: [],
        total: 0,
        page: 1,
        totalPages: 0
      };
    }
  }

  /**
   * Get transaction by ID
   * 
   * @param transactionId - Transaction ID
   * @returns Transaction details or null
   */
  async getTransaction(transactionId: string) {
    try {
      return await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          job: true,
          user: {
            select: {
              id: true,
              qubicAddress: true,
              username: true
            }
          }
        }
      });
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return null;
    }
  }

  /**
   * Get pending escrows (for monitoring/admin)
   * 
   * @returns Array of pending escrow transactions
   */
  async getPendingEscrows() {
    try {
      return await prisma.transaction.findMany({
        where: {
          type: TransactionType.ESCROW_LOCK,
          status: TransactionStatus.PENDING
        },
        include: {
          job: {
            select: {
              id: true,
              status: true,
              modelType: true,
              createdAt: true
            }
          },
          user: {
            select: {
              qubicAddress: true,
              username: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });
    } catch (error) {
      console.error('Error fetching pending escrows:', error);
      return [];
    }
  }

  /**
   * Calculate total earnings for a provider
   * 
   * @param providerId - Provider ID
   * @returns Total earnings amount
   */
  async getProviderEarnings(providerId: string): Promise<{
    total: number;
    pending: number;
    completed: number;
  }> {
    try {
      const provider = await prisma.provider.findUnique({
        where: { id: providerId },
        include: { user: true }
      });

      if (!provider) {
        return { total: 0, pending: 0, completed: 0 };
      }

      const transactions = await prisma.transaction.findMany({
        where: {
          userId: provider.userId,
          type: { in: [TransactionType.EARNING, TransactionType.ESCROW_RELEASE] }
        }
      });

      const completed = transactions
        .filter(tx => tx.status === TransactionStatus.COMPLETED)
        .reduce((sum, tx) => sum + tx.amount, 0);

      const pending = transactions
        .filter(tx => tx.status === TransactionStatus.PENDING)
        .reduce((sum, tx) => sum + tx.amount, 0);

      return {
        total: completed + pending,
        pending,
        completed
      };
    } catch (error) {
      console.error('Error calculating provider earnings:', error);
      return { total: 0, pending: 0, completed: 0 };
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
export const transactionService = new TransactionService();
