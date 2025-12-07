/**
 * Qubic Escrow Service - Smart contract integration for secure payments
 * Handles escrow creation, release, and refund operations
 */

import { z } from 'zod';
import { qubicWallet, QubicWalletService } from './qubic-wallet.service';

// Validation schemas
const EscrowIdSchema = z.string().length(64).regex(/^[A-Z0-9]+$/);

// Types
export interface EscrowData {
  escrowId: string;
  consumerAddress: string;
  providerAddress: string;
  amount: number;
  jobId: string;
  status: 'pending' | 'active' | 'released' | 'refunded' | 'disputed';
  createdTick: number;
  expiryTick: number;
  txHash: string;
}

export interface EscrowCreationResult {
  escrowId: string;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface EscrowReleaseResult {
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  amountReleased: number;
}

export interface EscrowRefundResult {
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  amountRefunded: number;
}

/**
 * Qubic Escrow Service Class
 * Handles smart contract interactions for job payments
 */
export class QubicEscrowService {
  private readonly walletService: QubicWalletService;
  private readonly escrowContractAddress: string;

  // Mock storage for demo (in production would be on-chain)
  private escrows: Map<string, EscrowData> = new Map();

  constructor(walletService = qubicWallet) {
    this.walletService = walletService;
    // In production, this would be the deployed escrow contract address
    this.escrowContractAddress = 'QUBIC_ESCROW_CONTRACT_ADDRESS_PLACEHOLDER';
  }

  /**
   * Create escrow for job payment
   */
  async createEscrow(
    consumerAddress: string,
    consumerSeed: string,
    providerAddress: string,
    amount: number,
    jobId: string,
    expiryHours = 24
  ): Promise<EscrowCreationResult> {
    try {
      console.log(`🔐 Creating escrow for job ${jobId}: ${amount} QUBIC`);

      // Validate addresses
      if (!this.walletService.isValidAddress(consumerAddress)) {
        throw new Error('Invalid consumer address format');
      }
      if (!this.walletService.isValidAddress(providerAddress)) {
        throw new Error('Invalid provider address format');
      }
      if (!this.walletService.isValidSeed(consumerSeed)) {
        throw new Error('Invalid consumer seed format');
      }

      // Check consumer balance
      const balance = await this.walletService.getBalance(consumerAddress);
      if (balance.balance < amount) {
        throw new Error('Insufficient balance for escrow creation');
      }

      // Get current tick and calculate expiry
      const currentTick = await this.walletService.getCurrentTick();
      const expiryTick = currentTick + (expiryHours * 720); // ~720 ticks per hour

      // Generate unique escrow ID
      const escrowId = `ESCROW_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // For hackathon demo: simulate escrow creation
      // In production, would call Qubic smart contract

      // "Transfer" funds to escrow contract (simulate)
      const transferResult = await this.walletService.sendTransaction(
        consumerAddress,
        consumerSeed,
        this.escrowContractAddress,
        amount
      );

      // Store escrow data (in production would be on-chain)
      const escrowData: EscrowData = {
        escrowId,
        consumerAddress,
        providerAddress,
        amount,
        jobId,
        status: 'active',
        createdTick: currentTick,
        expiryTick,
        txHash: transferResult.txHash
      };

      this.escrows.set(escrowId, escrowData);

      console.log(`✅ Escrow created: ${escrowId}`);
      console.log(`   Amount: ${amount} QUBIC`);
      console.log(`   Consumer: ${consumerAddress.slice(0, 10)}...`);
      console.log(`   Provider: ${providerAddress.slice(0, 10)}...`);
      console.log(`   TX Hash: ${transferResult.txHash}`);

      return {
        escrowId,
        txHash: transferResult.txHash,
        status: transferResult.status
      };

    } catch (error) {
      console.error('Failed to create escrow:', error);
      throw error;
    }
  }

  /**
   * Release escrow payment to provider (on job completion)
   */
  async releaseEscrow(
    escrowId: string,
    consumerAddress: string,
    consumerSeed: string
  ): Promise<EscrowReleaseResult> {
    try {
      console.log(`💰 Releasing escrow ${escrowId}`);

      // Validate escrow exists
      const escrow = this.escrows.get(escrowId);
      if (!escrow) {
        throw new Error('Escrow not found');
      }

      // Validate caller is consumer
      if (escrow.consumerAddress !== consumerAddress) {
        throw new Error('Only consumer can release escrow');
      }

      // Check escrow status
      if (escrow.status !== 'active') {
        throw new Error(`Escrow is ${escrow.status}, cannot release`);
      }

      // For hackathon demo: simulate fund release
      // In production, would call smart contract release function

      const releaseTx = await this.walletService.sendTransaction(
        this.escrowContractAddress,
        'escrowcontractseedplaceholder123456789', // Contract seed (would be stored securely)
        escrow.providerAddress,
        escrow.amount
      );

      // Update escrow status
      escrow.status = 'released';
      this.escrows.set(escrowId, escrow);

      console.log(`✅ Escrow released: ${escrowId}`);
      console.log(`   Amount: ${escrow.amount} QUBIC to ${escrow.providerAddress.slice(0, 10)}...`);
      console.log(`   TX Hash: ${releaseTx.txHash}`);

      return {
        txHash: releaseTx.txHash,
        status: releaseTx.status,
        amountReleased: escrow.amount
      };

    } catch (error) {
      console.error('Failed to release escrow:', error);
      throw error;
    }
  }

  /**
   * Refund escrow to consumer (on job failure/cancellation)
   */
  async refundEscrow(
    escrowId: string,
    consumerAddress: string,
    consumerSeed: string
  ): Promise<EscrowRefundResult> {
    try {
      console.log(`↩️ Refunding escrow ${escrowId}`);

      // Validate escrow exists
      const escrow = this.escrows.get(escrowId);
      if (!escrow) {
        throw new Error('Escrow not found');
      }

      // Validate caller is consumer
      if (escrow.consumerAddress !== consumerAddress) {
        throw new Error('Only consumer can refund escrow');
      }

      // Check escrow status
      if (escrow.status !== 'active') {
        throw new Error(`Escrow is ${escrow.status}, cannot refund`);
      }

      // Check if expired (optional: allow refunds after expiry)
      const currentTick = await this.walletService.getCurrentTick();
      const expired = currentTick > escrow.expiryTick;

      if (!expired) {
        // For demo, allow refunds even before expiry
        console.log('⚠️ Refunding before expiry (demo mode)');
      }

      // For hackathon demo: simulate fund refund
      // In production, would call smart contract refund function

      const refundTx = await this.walletService.sendTransaction(
        this.escrowContractAddress,
        'escrowcontractseedplaceholder123456789', // Contract seed
        escrow.consumerAddress,
        escrow.amount
      );

      // Update escrow status
      escrow.status = 'refunded';
      this.escrows.set(escrowId, escrow);

      console.log(`✅ Escrow refunded: ${escrowId}`);
      console.log(`   Amount: ${escrow.amount} QUBIC to ${escrow.consumerAddress.slice(0, 10)}...`);
      console.log(`   TX Hash: ${refundTx.txHash}`);

      return {
        txHash: refundTx.txHash,
        status: refundTx.status,
        amountRefunded: escrow.amount
      };

    } catch (error) {
      console.error('Failed to refund escrow:', error);
      throw error;
    }
  }

  /**
   * Get escrow status and details
   */
  async getEscrowStatus(escrowId: string): Promise<EscrowData | null> {
    try {
      const escrow = this.escrows.get(escrowId);
      if (!escrow) {
        return null;
      }

      // Check if expired
      const currentTick = await this.walletService.getCurrentTick();
      if (currentTick > escrow.expiryTick && escrow.status === 'active') {
        escrow.status = 'disputed'; // Could be refunded after expiry
        this.escrows.set(escrowId, escrow);
      }

      return escrow;
    } catch (error) {
      console.error('Failed to get escrow status:', error);
      return null;
    }
  }

  /**
   * Get all escrows for a user
   */
  async getUserEscrows(userAddress: string): Promise<EscrowData[]> {
    try {
      const userEscrows: EscrowData[] = [];

      for (const escrow of this.escrows.values()) {
        if (escrow.consumerAddress === userAddress || escrow.providerAddress === userAddress) {
          userEscrows.push(escrow);
        }
      }

      return userEscrows;
    } catch (error) {
      console.error('Failed to get user escrows:', error);
      return [];
    }
  }

  /**
   * Get escrow statistics
   */
  async getEscrowStats(): Promise<{
    totalEscrows: number;
    activeEscrows: number;
    totalValue: number;
    releasedValue: number;
    refundedValue: number;
  }> {
    try {
      let totalEscrows = 0;
      let activeEscrows = 0;
      let totalValue = 0;
      let releasedValue = 0;
      let refundedValue = 0;

      for (const escrow of this.escrows.values()) {
        totalEscrows++;
        totalValue += escrow.amount;

        if (escrow.status === 'active') {
          activeEscrows++;
        } else if (escrow.status === 'released') {
          releasedValue += escrow.amount;
        } else if (escrow.status === 'refunded') {
          refundedValue += escrow.amount;
        }
      }

      return {
        totalEscrows,
        activeEscrows,
        totalValue,
        releasedValue,
        refundedValue
      };
    } catch (error) {
      console.error('Failed to get escrow stats:', error);
      return {
        totalEscrows: 0,
        activeEscrows: 0,
        totalValue: 0,
        releasedValue: 0,
        refundedValue: 0
      };
    }
  }

  /**
   * Validate escrow ID format
   */
  isValidEscrowId(escrowId: string): boolean {
    try {
      EscrowIdSchema.parse(escrowId);
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const qubicEscrow = new QubicEscrowService();
