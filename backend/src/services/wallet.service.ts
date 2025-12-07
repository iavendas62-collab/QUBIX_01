/**
 * Wallet Service
 * 
 * Unified service for Qubic wallet operations
 * Handles wallet connection, validation, and balance queries
 * 
 * Requirements: 2.1, 2.2, 2.3
 */

import { PrismaClient } from '@prisma/client';
import qubicWalletService from './qubic-wallet';
import { qubicReal } from './qubic-real';

const prisma = new PrismaClient();

export interface WalletConnectionRequest {
  qubicAddress: string;
  signature?: string;
  email?: string;
  username?: string;
}

export interface WalletConnectionResponse {
  success: boolean;
  user: {
    id: string;
    qubicAddress: string;
    email?: string;
    username?: string;
    role: string;
    balance: number;
  };
  balance: number;
  message?: string;
}

export interface BalanceResponse {
  qubicAddress: string;
  balance: number;
  pendingEarnings: number;
  lastUpdated: Date;
}

export class WalletService {
  /**
   * Validate Qubic address format
   * Requirement 2.2: Verify wallet address format
   * 
   * @param address - Qubic address to validate
   * @returns True if valid, false otherwise
   */
  validateAddress(address: string): boolean {
    try {
      // Qubic identities are 60 uppercase characters
      const isValidFormat = /^[A-Z]{60}$/.test(address);
      
      if (!isValidFormat) {
        return false;
      }

      // Use qubic-wallet service for additional validation
      return qubicWalletService.validateIdentity(address);
    } catch (error) {
      console.error('Address validation error:', error);
      return false;
    }
  }

  /**
   * Connect wallet and create/retrieve user
   * Requirement 2.1: Provide wallet connection option
   * Requirement 2.3: Display user's QUBIC balance
   * 
   * @param request - Wallet connection request
   * @returns Connection response with user and balance
   */
  async connectWallet(request: WalletConnectionRequest): Promise<WalletConnectionResponse> {
    try {
      console.log(`🔗 Connecting wallet: ${request.qubicAddress}`);

      // Validate address format
      if (!this.validateAddress(request.qubicAddress)) {
        return {
          success: false,
          user: null as any,
          balance: 0,
          message: 'Invalid Qubic address format. Address must be 60 uppercase characters.'
        };
      }

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { qubicAddress: request.qubicAddress }
      });

      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            qubicAddress: request.qubicAddress,
            email: request.email,
            username: request.username,
            role: 'CONSUMER',
            balance: 0
          }
        });
        console.log(`✅ New user created: ${user.id}`);
      } else {
        // Update existing user if email/username provided
        if (request.email || request.username) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              email: request.email || user.email,
              username: request.username || user.username
            }
          });
        }
        console.log(`✅ Existing user found: ${user.id}`);
      }

      // Fetch balance from blockchain
      const balance = await this.getBalance(request.qubicAddress);

      // Update user balance in database
      await prisma.user.update({
        where: { id: user.id },
        data: { balance: balance.balance }
      });

      return {
        success: true,
        user: {
          id: user.id,
          qubicAddress: user.qubicAddress,
          email: user.email || undefined,
          username: user.username || undefined,
          role: user.role,
          balance: balance.balance
        },
        balance: balance.balance,
        message: 'Wallet connected successfully'
      };
    } catch (error: any) {
      console.error('❌ Wallet connection failed:', error);
      return {
        success: false,
        user: null as any,
        balance: 0,
        message: `Wallet connection failed: ${error.message}`
      };
    }
  }

  /**
   * Get balance for a Qubic address
   * Requirement 2.3: Display user's QUBIC balance
   * 
   * @param address - Qubic address
   * @returns Balance information
   */
  async getBalance(address: string): Promise<BalanceResponse> {
    try {
      console.log(`💰 Fetching balance for ${address}`);

      // Validate address
      if (!this.validateAddress(address)) {
        throw new Error('Invalid Qubic address format');
      }

      // Try to get balance from qubic-real service
      let balance = 0;
      try {
        balance = await qubicReal.getBalance(address);
      } catch (error) {
        console.warn('Failed to fetch balance from qubic-real, trying alternative method');
        
        // Fallback: try qubic-wallet service if connector is initialized
        try {
          const balanceInfo = await qubicWalletService.getBalance(address);
          balance = balanceInfo.energyQubic;
        } catch (walletError) {
          console.warn('Failed to fetch balance from qubic-wallet, using database value');
          
          // Final fallback: get from database
          const user = await prisma.user.findUnique({
            where: { qubicAddress: address }
          });
          balance = user?.balance || 0;
        }
      }

      // Calculate pending earnings from completed jobs
      const user = await prisma.user.findUnique({
        where: { qubicAddress: address },
        include: {
          providers: {
            include: {
              jobs: {
                where: {
                  status: 'COMPLETED',
                  transaction: {
                    status: 'PENDING'
                  }
                }
              }
            }
          }
        }
      });

      let pendingEarnings = 0;
      if (user) {
        for (const provider of user.providers) {
          for (const job of provider.jobs) {
            pendingEarnings += job.actualCost || job.estimatedCost;
          }
        }
      }

      return {
        qubicAddress: address,
        balance,
        pendingEarnings,
        lastUpdated: new Date()
      };
    } catch (error: any) {
      console.error('❌ Failed to fetch balance:', error);
      throw new Error(`Failed to fetch balance: ${error.message}`);
    }
  }

  /**
   * Update user balance after transaction
   * Requirement 2.4: Update wallet balance in real-time (provider earnings)
   * Requirement 2.5: Deduct QUBIC tokens (consumer spending)
   * 
   * @param userId - User ID
   * @param amount - Amount to add (positive) or deduct (negative)
   * @param transactionType - Type of transaction
   * @returns Updated balance
   */
  async updateBalance(
    userId: string,
    amount: number,
    transactionType: 'EARNING' | 'PAYMENT' | 'REFUND'
  ): Promise<number> {
    try {
      console.log(`💸 Updating balance for user ${userId}: ${amount > 0 ? '+' : ''}${amount} QUBIC`);

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Calculate new balance
      const newBalance = user.balance + amount;

      if (newBalance < 0) {
        throw new Error('Insufficient balance');
      }

      // Update user balance
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { balance: newBalance }
      });

      console.log(`✅ Balance updated: ${user.balance} → ${newBalance} QUBIC`);

      return updatedUser.balance;
    } catch (error: any) {
      console.error('❌ Failed to update balance:', error);
      throw error;
    }
  }

  /**
   * Verify wallet signature (for future authentication)
   * 
   * @param address - Qubic address
   * @param signature - Signature to verify
   * @param message - Original message that was signed
   * @returns True if signature is valid
   */
  async verifySignature(
    address: string,
    signature: string,
    message: string
  ): Promise<boolean> {
    try {
      // TODO: Implement signature verification using Qubic SDK
      // This would verify that the signature was created by the private key
      // corresponding to the public address
      
      console.log('⚠️  Signature verification not yet implemented');
      return true; // Placeholder
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Get wallet transaction history
   * 
   * @param address - Qubic address
   * @param limit - Maximum number of transactions to return
   * @returns Transaction history
   */
  async getTransactionHistory(address: string, limit: number = 50) {
    try {
      const user = await prisma.user.findUnique({
        where: { qubicAddress: address },
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
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
          }
        }
      });

      if (!user) {
        return [];
      }

      return user.transactions;
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
      throw error;
    }
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}

// Export singleton instance
export const walletService = new WalletService();

