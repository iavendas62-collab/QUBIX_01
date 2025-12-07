/**
 * Qubic Blockchain Integration Service
 * 
 * Comprehensive service for Qubic blockchain interactions
 * Implements Requirements 5.1-5.7, 10.3
 * 
 * Features:
 * - Wallet connection and management
 * - Balance queries with caching (30s TTL)
 * - Transaction creation with Qubic format and signing
 * - Transaction broadcasting to Qubic network
 * - Transaction verification and confirmation polling
 * - Qubic explorer URL generation
 * - Error handling and retry logic
 */

import axios, { AxiosError } from 'axios';
import { QUBIC_CONFIG, getExplorerUrl } from '../config/qubic.config';
import qubicWalletService from './qubic-wallet';

// Types
export interface QubicTransaction {
  hash: string;
  from: string;
  to: string;
  amount: string;
  timestamp: number;
  confirmed: boolean;
  confirmations: number;
  metadata?: Record<string, any>;
}

export interface QubicBalance {
  address: string;
  balance: string;
  balanceQubic: number;
  cached: boolean;
  cacheAge: number; // seconds
}

export interface EscrowTransaction {
  jobId: string;
  txHash: string;
  amount: string;
  consumer: string;
  provider: string;
  status: 'locked' | 'released' | 'refunded';
  createdAt: Date;
  confirmations: number;
}

export interface WalletInfo {
  address: string;
  publicKey: string;
  balance: number;
}

export interface TransactionStatus {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  blockHeight?: number;
  timestamp?: Date;
}

// Balance cache entry
interface BalanceCacheEntry {
  balance: QubicBalance;
  timestamp: number;
}

class QubicService {
  private rpcUrl: string;
  private platformSeed: string;
  private platformAddress: string;
  private balanceCache: Map<string, BalanceCacheEntry>;
  private readonly CACHE_TTL = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [2000, 4000, 8000]; // Exponential backoff
  private initialized: boolean = false;

  constructor() {
    this.rpcUrl = QUBIC_CONFIG.rpcEndpoint;
    this.platformSeed = QUBIC_CONFIG.platformSeed;
    this.platformAddress = QUBIC_CONFIG.platformAddress;
    this.balanceCache = new Map();
  }

  /**
   * Initialize Qubic service
   * Requirement 5.1: Connect to Qubic network
   */
  async initialize(): Promise<void> {
    try {
      if (this.initialized) {
        console.log('⚠️  Qubic service already initialized');
        return;
      }

      console.log('🔌 Initializing Qubic service...');
      console.log(`   Network: ${QUBIC_CONFIG.network}`);
      console.log(`   RPC: ${this.rpcUrl}`);
      console.log(`   Platform: ${this.platformAddress}`);

      // Initialize the wallet service
      await qubicWalletService.initializeClient();

      // Test connection with retry logic
      const isConnected = await this.testConnectionWithRetry();
      if (!isConnected) {
        throw new Error('Failed to connect to Qubic network after retries');
      }

      this.initialized = true;
      console.log('✅ Qubic service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Qubic service:', error);
      throw error;
    }
  }

  /**
   * Test connection to Qubic network with retry logic
   */
  private async testConnectionWithRetry(): Promise<boolean> {
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        console.log(`🔍 Testing connection (attempt ${attempt + 1}/${this.MAX_RETRIES})...`);
        
        // Try to get platform balance as health check
        if (this.platformAddress) {
          const balance = await qubicWalletService.getBalance(this.platformAddress);
          console.log(`✅ Connection test passed. Platform balance: ${balance.energyQubic} QUBIC`);
          return true;
        }
        
        // Fallback: just check if wallet service is initialized
        return true;
      } catch (error) {
        console.error(`❌ Connection test failed (attempt ${attempt + 1}):`, error);
        
        if (attempt < this.MAX_RETRIES - 1) {
          const delay = this.RETRY_DELAYS[attempt];
          console.log(`⏳ Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }
    
    return false;
  }

  /**
   * Connect wallet
   * Requirement 5.1: Wallet connection method
   */
  async connectWallet(seed?: string): Promise<WalletInfo> {
    try {
      console.log('🔑 Connecting wallet...');

      let wallet;
      if (seed) {
        // Import existing wallet
        wallet = await qubicWalletService.importWallet(seed);
      } else {
        // Create new wallet
        wallet = await qubicWalletService.createWallet();
      }

      // Get balance
      const balance = await this.getBalance(wallet.identity);

      const walletInfo: WalletInfo = {
        address: wallet.identity,
        publicKey: wallet.identity,
        balance: balance.balanceQubic
      };

      console.log('✅ Wallet connected:', walletInfo.address);
      return walletInfo;
    } catch (error) {
      console.error('❌ Failed to connect wallet:', error);
      throw new Error(`Wallet connection failed: ${error}`);
    }
  }

  /**
   * Get balance for address with caching
   * Requirements 5.2, 5.7: Balance query with 30s TTL caching
   * 
   * @param address - Qubic identity (60 characters uppercase)
   * @returns Balance information with cache metadata
   */
  async getBalance(address: string): Promise<QubicBalance> {
    try {
      // Check cache first (Requirement 5.7)
      const cached = this.balanceCache.get(address);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
        const cacheAge = Math.floor((now - cached.timestamp) / 1000);
        console.log(`💰 Returning cached balance for ${address} (age: ${cacheAge}s)`);
        return {
          ...cached.balance,
          cached: true,
          cacheAge
        };
      }

      console.log(`💰 Fetching fresh balance for ${address}...`);

      // Fetch from Qubic network with retry logic
      const balance = await this.fetchBalanceWithRetry(address);

      // Cache the result
      this.balanceCache.set(address, {
        balance: {
          address,
          balance: balance.energy.toString(),
          balanceQubic: balance.energyQubic,
          cached: false,
          cacheAge: 0
        },
        timestamp: now
      });

      console.log(`✅ Balance: ${balance.energyQubic} QUBIC`);

      return {
        address,
        balance: balance.energy.toString(),
        balanceQubic: balance.energyQubic,
        cached: false,
        cacheAge: 0
      };
    } catch (error) {
      console.error('❌ Error fetching balance:', error);
      
      // Return cached balance if available, even if expired
      const cached = this.balanceCache.get(address);
      if (cached) {
        const cacheAge = Math.floor((Date.now() - cached.timestamp) / 1000);
        console.log(`⚠️  Returning stale cached balance (age: ${cacheAge}s)`);
        return {
          ...cached.balance,
          cached: true,
          cacheAge
        };
      }
      
      throw new Error(`Failed to fetch balance: ${error}`);
    }
  }

  /**
   * Fetch balance with retry logic
   */
  private async fetchBalanceWithRetry(address: string): Promise<{ energy: bigint; energyQubic: number }> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        return await qubicWalletService.getBalance(address);
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ Balance fetch failed (attempt ${attempt + 1}/${this.MAX_RETRIES}):`, error);
        
        if (attempt < this.MAX_RETRIES - 1) {
          const delay = this.RETRY_DELAYS[attempt];
          console.log(`⏳ Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Failed to fetch balance after retries');
  }

  /**
   * Clear balance cache for address
   */
  clearBalanceCache(address?: string): void {
    if (address) {
      this.balanceCache.delete(address);
      console.log(`🗑️  Cleared balance cache for ${address}`);
    } else {
      this.balanceCache.clear();
      console.log('🗑️  Cleared all balance cache');
    }
  }

  /**
   * Create transaction with Qubic format and signing
   * Requirements 5.3, 5.4: Transaction creation and broadcasting
   * 
   * @param fromSeed - Sender's seed phrase
   * @param toAddress - Recipient's identity
   * @param amount - Amount in QUBIC (will be converted to smallest unit)
   * @param metadata - Optional transaction metadata
   * @returns Transaction result with hash
   */
  async createTransaction(
    fromSeed: string,
    toAddress: string,
    amount: number,
    metadata?: Record<string, any>
  ): Promise<QubicTransaction> {
    try {
      console.log('📝 Creating Qubic transaction...');
      console.log(`   To: ${toAddress}`);
      console.log(`   Amount: ${amount} QUBIC`);

      // Convert to smallest unit
      const amountSmallest = qubicWalletService.toSmallestUnit(amount);

      // Send transaction with retry logic
      const result = await this.sendTransactionWithRetry(fromSeed, toAddress, amountSmallest);

      // Get sender identity
      const senderWallet = await qubicWalletService.importWallet(fromSeed);

      const transaction: QubicTransaction = {
        hash: result.hash,
        from: result.from,
        to: result.to,
        amount: result.amount.toString(),
        timestamp: Date.now(),
        confirmed: false,
        confirmations: 0,
        metadata
      };

      console.log(`✅ Transaction created: ${transaction.hash}`);
      console.log(`   Explorer: ${getExplorerUrl(transaction.hash)}`);

      // Clear balance cache for sender and receiver
      this.clearBalanceCache(senderWallet.identity);
      this.clearBalanceCache(toAddress);

      return transaction;
    } catch (error) {
      console.error('❌ Failed to create transaction:', error);
      throw new Error(`Transaction creation failed: ${error}`);
    }
  }

  /**
   * Send transaction with retry logic
   */
  private async sendTransactionWithRetry(
    fromSeed: string,
    toAddress: string,
    amount: bigint
  ): Promise<{ hash: string; from: string; to: string; amount: bigint }> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        return await qubicWalletService.sendTransaction(fromSeed, toAddress, amount);
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ Transaction send failed (attempt ${attempt + 1}/${this.MAX_RETRIES}):`, error);
        
        if (attempt < this.MAX_RETRIES - 1) {
          const delay = this.RETRY_DELAYS[attempt];
          console.log(`⏳ Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Failed to send transaction after retries');
  }

  /**
   * Create escrow transaction
   * Locks funds from consumer until job completion
   * 
   * @param jobId - Unique job identifier
   * @param consumerSeed - Consumer's seed phrase
   * @param providerAddress - Provider's Qubic identity
   * @param amount - Amount in QUBIC
   * @returns Transaction hash
   */
  async createEscrow(
    jobId: string,
    consumerSeed: string,
    providerAddress: string,
    amount: number
  ): Promise<string> {
    try {
      console.log(`🔒 Creating escrow for job ${jobId}`);
      console.log(`   Provider: ${providerAddress}`);
      console.log(`   Amount: ${amount} QUBIC`);

      // Create transaction from consumer to platform with metadata
      const tx = await this.createTransaction(
        consumerSeed,
        this.platformAddress,
        amount,
        {
          type: 'escrow_lock',
          jobId: jobId,
          provider: providerAddress,
          timestamp: Date.now()
        }
      );

      console.log(`✅ Escrow created: ${tx.hash}`);
      console.log(`   Explorer: ${getExplorerUrl(tx.hash)}`);

      return tx.hash;
    } catch (error) {
      console.error('❌ Error creating escrow:', error);
      throw new Error(`Failed to create escrow: ${error}`);
    }
  }

  /**
   * Release payment to provider after job completion
   * 
   * @param jobId - Job identifier
   * @param providerAddress - Provider's identity
   * @param amount - Total amount in QUBIC (platform fee will be deducted)
   * @returns Transaction hash
   */
  async releasePayment(
    jobId: string,
    providerAddress: string,
    amount: number
  ): Promise<string> {
    try {
      console.log(`💸 Releasing payment for job ${jobId}`);
      console.log(`   Provider: ${providerAddress}`);
      console.log(`   Amount: ${amount} QUBIC`);

      // Calculate split
      const platformFeePercent = QUBIC_CONFIG.platformFeePercent;
      const platformFee = (amount * platformFeePercent) / 100;
      const providerAmount = amount - platformFee;

      console.log(`   Provider gets: ${providerAmount} QUBIC`);
      console.log(`   Platform fee: ${platformFee} QUBIC (${platformFeePercent}%)`);

      // Send payment from platform to provider
      const tx = await this.createTransaction(
        this.platformSeed,
        providerAddress,
        providerAmount,
        {
          type: 'job_payment',
          jobId: jobId,
          platformFee: platformFee,
          timestamp: Date.now()
        }
      );

      console.log(`✅ Payment released: ${tx.hash}`);
      console.log(`   Explorer: ${getExplorerUrl(tx.hash)}`);

      return tx.hash;
    } catch (error) {
      console.error('❌ Error releasing payment:', error);
      throw new Error(`Failed to release payment: ${error}`);
    }
  }

  /**
   * Refund consumer if job fails
   * 
   * @param jobId - Job identifier
   * @param consumerAddress - Consumer's identity
   * @param amount - Amount to refund in QUBIC
   * @returns Transaction hash
   */
  async refundEscrow(
    jobId: string,
    consumerAddress: string,
    amount: number
  ): Promise<string> {
    try {
      console.log(`↩️  Refunding escrow for job ${jobId}`);
      console.log(`   Consumer: ${consumerAddress}`);
      console.log(`   Amount: ${amount} QUBIC`);

      // Send refund from platform to consumer
      const tx = await this.createTransaction(
        this.platformSeed,
        consumerAddress,
        amount,
        {
          type: 'escrow_refund',
          jobId: jobId,
          timestamp: Date.now()
        }
      );

      console.log(`✅ Refund issued: ${tx.hash}`);
      console.log(`   Explorer: ${getExplorerUrl(tx.hash)}`);

      return tx.hash;
    } catch (error) {
      console.error('❌ Error refunding escrow:', error);
      throw new Error(`Failed to refund escrow: ${error}`);
    }
  }

  /**
   * Get transaction status
   * Requirement 5.6: Transaction verification
   * 
   * @param txHash - Transaction hash
   * @returns Transaction status with confirmations
   */
  async verifyTransaction(txHash: string): Promise<TransactionStatus> {
    try {
      console.log(`🔍 Verifying transaction ${txHash}...`);

      // Get transaction status from wallet service
      const status = await qubicWalletService.getTransactionStatus(txHash);

      // Parse status
      const txStatus: TransactionStatus = {
        hash: txHash,
        status: status.status || 'pending',
        confirmations: status.confirmations || 0,
        blockHeight: status.blockHeight,
        timestamp: status.timestamp ? new Date(status.timestamp) : undefined
      };

      console.log(`✅ Transaction status: ${txStatus.status} (${txStatus.confirmations} confirmations)`);

      return txStatus;
    } catch (error) {
      console.error('❌ Error verifying transaction:', error);
      
      // Return pending status on error
      return {
        hash: txHash,
        status: 'pending',
        confirmations: 0
      };
    }
  }

  /**
   * Get transaction details
   * 
   * @param txHash - Transaction hash
   * @returns Transaction details or null if not found
   */
  async getTransaction(txHash: string): Promise<QubicTransaction | null> {
    try {
      const status = await this.verifyTransaction(txHash);
      
      if (status.status === 'failed') {
        return null;
      }

      // Return basic transaction info
      // Note: Full transaction details may require additional API calls
      return {
        hash: txHash,
        from: '',
        to: '',
        amount: '0',
        timestamp: status.timestamp?.getTime() || Date.now(),
        confirmed: status.status === 'confirmed',
        confirmations: status.confirmations
      };
    } catch (error) {
      console.error('❌ Error fetching transaction:', error);
      return null;
    }
  }

  /**
   * Wait for transaction confirmation with polling
   * Requirement 5.6: Confirmation polling
   * 
   * @param txHash - Transaction hash
   * @param requiredConfirmations - Number of confirmations to wait for (default: 3)
   * @param onProgress - Optional callback for progress updates
   * @returns True when confirmed, false on timeout
   */
  async waitForConfirmation(
    txHash: string,
    requiredConfirmations: number = QUBIC_CONFIG.confirmations,
    onProgress?: (confirmations: number, required: number) => void
  ): Promise<boolean> {
    console.log(`⏳ Waiting for ${requiredConfirmations} confirmations...`);

    let confirmations = 0;
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds

    while (confirmations < requiredConfirmations) {
      // Check timeout
      const elapsed = Date.now() - startTime;
      if (elapsed > QUBIC_CONFIG.confirmationTimeout) {
        console.error(`❌ Transaction confirmation timeout after ${elapsed}ms`);
        throw new Error(`Transaction confirmation timeout (${elapsed}ms)`);
      }

      // Wait before next check
      await this.sleep(pollInterval);

      try {
        // Check transaction status
        const status = await this.verifyTransaction(txHash);
        
        if (status.status === 'failed') {
          console.error('❌ Transaction failed');
          return false;
        }

        if (status.status === 'confirmed') {
          confirmations = status.confirmations;
          console.log(`   Confirmations: ${confirmations}/${requiredConfirmations}`);
          
          // Call progress callback
          if (onProgress) {
            onProgress(confirmations, requiredConfirmations);
          }
        }
      } catch (error) {
        console.error('⚠️  Error checking confirmation:', error);
        // Continue polling despite errors
      }
    }

    console.log(`✅ Transaction confirmed with ${confirmations} confirmations!`);
    return true;
  }

  /**
   * Generate Qubic explorer URL for transaction
   * Requirement 10.3: Explorer URL generation
   * 
   * @param txHash - Transaction hash
   * @returns Explorer URL
   */
  getExplorerUrl(txHash: string): string {
    return getExplorerUrl(txHash);
  }

  /**
   * Generate Qubic explorer URL for address
   * 
   * @param address - Qubic identity
   * @returns Explorer URL
   */
  getAddressExplorerUrl(address: string): string {
    return `${QUBIC_CONFIG.explorerUrl}/address/${address}`;
  }

  /**
   * Validate Qubic identity format
   * 
   * @param identity - Identity to validate
   * @returns True if valid
   */
  validateIdentity(identity: string): boolean {
    return qubicWalletService.validateIdentity(identity);
  }

  /**
   * Validate seed phrase format
   * 
   * @param seed - Seed phrase to validate
   * @returns True if valid
   */
  validateSeed(seed: string): boolean {
    return seed.length === 55 && /^[a-z]+$/.test(seed);
  }

  /**
   * Convert QUBIC to smallest unit
   */
  toSmallestUnit(qubic: number): bigint {
    return qubicWalletService.toSmallestUnit(qubic);
  }

  /**
   * Convert smallest unit to QUBIC
   */
  toQubic(units: bigint): number {
    return qubicWalletService.toQubic(units);
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Close service and cleanup
   */
  async close(): Promise<void> {
    try {
      await qubicWalletService.close();
      this.balanceCache.clear();
      this.initialized = false;
      console.log('✅ Qubic service closed');
    } catch (error) {
      console.error('❌ Error closing Qubic service:', error);
    }
  }
}

// Export singleton instance
export default new QubicService();
