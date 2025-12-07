/**
 * Qubic Wallet Service
 * 
 * Real implementation using @qubic-lib/qubic-ts-library
 * Handles wallet creation, transactions, and balance queries
 */

import { QubicHelper } from '@qubic-lib/qubic-ts-library/dist/qubicHelper';
import { QubicConnector } from '@qubic-lib/qubic-ts-library/dist/QubicConnector';
import { QubicTransaction } from '@qubic-lib/qubic-ts-library/dist/qubic-types/QubicTransaction';
import { PublicKey } from '@qubic-lib/qubic-ts-library/dist/qubic-types/PublicKey';
import { QubicEntityResponse } from '@qubic-lib/qubic-ts-library/dist/qubic-communication/QubicEntityResponse';
import { QUBIC_CONFIG } from '../config/qubic.config';

export interface WalletInfo {
  seed: string;
  identity: string;
  index: number;
}

export interface TransactionResult {
  hash: string;
  from: string;
  to: string;
  amount: bigint;
}

export interface BalanceInfo {
  identity: string;
  energy: bigint;
  energyQubic: number;
}

class QubicWalletService {
  private helper: QubicHelper;
  private connector: QubicConnector | null = null;
  private currentTick: number = 0;

  constructor() {
    this.helper = new QubicHelper();
  }

  /**
   * ETAPA 4: Create a new wallet (seed + identity)
   * 
   * @param index - Identity index (default: 0)
   * @returns Wallet information with seed and identity
   */
  async createWallet(index: number = 0): Promise<WalletInfo> {
    try {
      console.log('🔑 Creating new Qubic wallet...');

      // Generate random seed (55 lowercase latin chars)
      const seed = this.generateSeed();

      // Create identity package using QubicHelper
      const idPackage = await this.helper.createIdPackage(seed);

      const wallet: WalletInfo = {
        seed,
        identity: idPackage.publicId,
        index
      };

      console.log('✅ Wallet created successfully!');
      console.log(`   Identity: ${wallet.identity}`);
      console.log(`   Seed: ${wallet.seed.substring(0, 20)}...`);
      console.log(`   Index: ${wallet.index}`);

      return wallet;
    } catch (error) {
      console.error('❌ Failed to create wallet:', error);
      throw error;
    }
  }

  /**
   * Import wallet from seed phrase
   * 
   * @param seed - 55-character lowercase seed phrase
   * @param index - Identity index (default: 0)
   * @returns Wallet information
   */
  async importWallet(seed: string, index: number = 0): Promise<WalletInfo> {
    try {
      console.log('📥 Importing wallet from seed...');

      // Validate seed format
      if (!this.validateSeed(seed)) {
        throw new Error('Invalid seed format. Must be 55 lowercase latin characters.');
      }

      // Create identity package from seed
      const idPackage = await this.helper.createIdPackage(seed);

      // Verify identity checksum
      const isValid = await this.helper.verifyIdentity(idPackage.publicId);
      if (!isValid) {
        throw new Error('Invalid identity checksum');
      }

      const wallet: WalletInfo = {
        seed,
        identity: idPackage.publicId,
        index
      };

      console.log('✅ Wallet imported successfully!');
      console.log(`   Identity: ${wallet.identity}`);

      return wallet;
    } catch (error) {
      console.error('❌ Failed to import wallet:', error);
      throw error;
    }
  }

  /**
   * Initialize Qubic client for transactions
   * 
   * @param nodeIp - Qubic node IP address (optional, uses config default)
   */
  async initializeClient(nodeIp?: string): Promise<void> {
    try {
      console.log('🔌 Initializing Qubic connector...');

      const bridgeAddress = nodeIp || QUBIC_CONFIG.rpcEndpoint;
      this.connector = new QubicConnector(bridgeAddress);

      // Setup event listeners
      this.connector.onReady = () => {
        console.log('✅ Connector ready');
      };

      this.connector.onPeerConnected = () => {
        console.log('🔗 Peer connected');
      };

      this.connector.onPeerDisconnected = () => {
        console.log('⚠️  Peer disconnected');
      };

      this.connector.onTick = (tick: number) => {
        this.currentTick = tick;
        console.log(`📊 Current tick: ${tick}`);
      };

      this.connector.onBalance = (entity: QubicEntityResponse) => {
        const balance = entity.getEntity().getBalance();
        console.log(`💰 Balance received: ${balance / 1e9} QUBIC`);
      };

      // Start connector
      this.connector.start();

      // Connect to node (use IP address for now)
      // TODO: Update with actual Qubic node addresses
      const nodeAddress = nodeIp || '127.0.0.1'; // Localhost for testing
      console.log(`🔗 Connecting to node: ${nodeAddress}`);
      
      // Only connect if not localhost (avoid connection errors in testing)
      if (nodeAddress !== '127.0.0.1') {
        this.connector.connect(nodeAddress);
      } else {
        console.log('⚠️  Skipping connection (localhost mode)');
      }

      console.log('✅ Client initialized');
    } catch (error) {
      console.error('❌ Failed to initialize client:', error);
      throw error;
    }
  }

  /**
   * ETAPA 8: Get balance for an identity
   * 
   * @param identity - Qubic identity (uppercase hex)
   * @returns Balance information
   */
  async getBalance(identity: string): Promise<BalanceInfo> {
    try {
      if (!this.connector) {
        throw new Error('Connector not initialized. Call initializeClient() first.');
      }

      console.log(`💰 Fetching balance for ${identity}...`);

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Balance request timeout'));
        }, 30000);

        // Setup balance callback
        this.connector!.onBalance = (entityResponse: QubicEntityResponse) => {
          clearTimeout(timeout);
          
          const entity = entityResponse.getEntity();
          const balance = entity.getBalance();
          
          const balanceInfo: BalanceInfo = {
            identity: identity,
            energy: BigInt(balance),
            energyQubic: balance / 1e9
          };

          console.log(`✅ Balance: ${balanceInfo.energyQubic} QUBIC`);
          resolve(balanceInfo);
        };

        // Convert identity to PublicKey and request balance
        const publicKey = new PublicKey(identity);
        
        this.connector!.requestBalance(publicKey);
      });
    } catch (error) {
      console.error('❌ Failed to fetch balance:', error);
      throw error;
    }
  }

  /**
   * ETAPA 5: Send transaction
   * 
   * @param fromSeed - Sender's seed phrase
   * @param toIdentity - Recipient's identity
   * @param amount - Amount in smallest unit (1 QUBIC = 1e9 units)
   * @param tick - Current tick (optional, uses current if not provided)
   * @returns Transaction result
   */
  async sendTransaction(
    fromSeed: string,
    toIdentity: string,
    amount: bigint,
    tick?: number
  ): Promise<TransactionResult> {
    try {
      console.log('📤 Preparing transaction...');
      console.log(`   To: ${toIdentity}`);
      console.log(`   Amount: ${Number(amount) / 1e9} QUBIC`);

      // Import sender wallet
      const senderWallet = await this.importWallet(fromSeed);

      // Initialize connector if not already done
      if (!this.connector) {
        await this.initializeClient();
      }

      // Get sender's current balance
      const senderBalance = await this.getBalance(senderWallet.identity);

      console.log(`   From: ${senderWallet.identity}`);
      console.log(`   Current balance: ${senderBalance.energyQubic} QUBIC`);

      // Check sufficient balance
      if (senderBalance.energy < amount) {
        throw new Error(`Insufficient balance. Have: ${senderBalance.energyQubic} QUBIC, Need: ${Number(amount) / 1e9} QUBIC`);
      }

      // Use current tick if not provided
      const txTick = tick || this.currentTick + 5; // Add buffer for processing

      // Create transaction using QubicHelper
      const txData = await this.helper.createTransaction(
        fromSeed,
        toIdentity,
        Number(amount),
        txTick
      );

      console.log('📝 Transaction created, sending to network...');

      // Send transaction package
      const sent = this.connector!.sendPackage(txData);
      
      if (!sent) {
        throw new Error('Failed to send transaction to network');
      }

      // Generate transaction hash (simplified)
      const txHash = `QBX${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

      const result: TransactionResult = {
        hash: txHash,
        from: senderWallet.identity,
        to: toIdentity,
        amount
      };

      console.log('✅ Transaction sent successfully!');
      console.log(`   TX Hash: ${result.hash}`);

      return result;
    } catch (error) {
      console.error('❌ Failed to send transaction:', error);
      throw error;
    }
  }

  /**
   * Get transaction status
   * 
   * @param txHash - Transaction hash
   * @returns Transaction status
   */
  async getTransactionStatus(txHash: string): Promise<any> {
    try {
      if (!this.connector) {
        throw new Error('Connector not initialized');
      }

      console.log(`🔍 Checking transaction ${txHash}...`);

      // TODO: Implement transaction status query when available in library
      // For now, return basic status
      const status = {
        hash: txHash,
        status: 'pending',
        message: 'Transaction status query not yet implemented in qubic-ts-library'
      };

      console.log('⚠️  Transaction status query not fully implemented');
      return status;
    } catch (error) {
      console.error('❌ Failed to get transaction status:', error);
      throw error;
    }
  }

  /**
   * Close connector
   */
  async close(): Promise<void> {
    if (this.connector) {
      this.connector.stop();
      this.connector.destroy();
      this.connector = null;
      console.log('✅ Connector closed');
    }
  }

  /**
   * Generate random seed (55 lowercase latin chars)
   */
  private generateSeed(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let seed = '';
    for (let i = 0; i < 55; i++) {
      seed += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return seed;
  }

  /**
   * Validate seed format
   */
  private validateSeed(seed: string): boolean {
    return seed.length === 55 && /^[a-z]+$/.test(seed);
  }

  /**
   * Validate identity format
   */
  validateIdentity(identity: string): boolean {
    // Qubic identities are 60 characters uppercase
    return identity.length === 60 && /^[A-Z]+$/.test(identity);
  }



  /**
   * Convert QUBIC to smallest unit
   */
  toSmallestUnit(qubic: number): bigint {
    return BigInt(Math.floor(qubic * 1e9));
  }

  /**
   * Convert smallest unit to QUBIC
   */
  toQubic(units: bigint): number {
    return Number(units) / 1e9;
  }
}

// Export singleton instance
export default new QubicWalletService();
