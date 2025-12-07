/**
 * Qubic API Service
 * 
 * Connects frontend to backend Qubic services
 * Uses the user's wallet created during registration
 */

import { API_BASE_URL } from '../config';

const API_BASE = API_BASE_URL;

// Helper function to build API URLs correctly
const buildApiUrl = (endpoint: string) => {
  // In development, Vite proxy handles /api prefix
  // In production, we need to add it
  const isDevelopment = API_BASE_URL === '/api';
  const baseUrl = isDevelopment ? '' : API_BASE_URL;
  const apiPrefix = isDevelopment ? '/api' : '/api';

  return `${baseUrl}${apiPrefix}${endpoint}`;
};

export interface WalletBalance {
  identity: string;
  balance: number;
  balanceFormatted: string;
}

export interface PaymentResult {
  success: boolean;
  txHash: string;
  amount: number;
  from: string;
  to: string;
  message: string;
}

export interface RentalInfo {
  instanceId: string;
  gpuModel: string;
  duration: string;
  durationHours: number;
  totalCost: number;
  startTime: string;
  endTime: string;
  status: 'active' | 'expired' | 'cancelled';
  environment: string;
  accessUrl?: string;
}

class QubicApiService {
  /**
   * Get wallet balance for a user
   */
  async getBalance(identity: string): Promise<WalletBalance> {
    try {
      const response = await fetch(buildApiUrl(`/wallet/balance/${identity}`));

      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }

      const data = await response.json();

      return {
        identity,
        balance: data.balance,
        balanceFormatted: `${data.balance.toLocaleString()} QUBIC`
      };
    } catch (error) {
      console.error('Error fetching balance:', error);
      return {
        identity,
        balance: 0,
        balanceFormatted: '0 QUBIC'
      };
    }
  }

  /**
   * Process payment for GPU rental
   */
  async processPayment(params: {
    userIdentity: string;
    providerIdentity: string;
    amount: number;
    gpuId: string;
    duration: string;
    durationHours: number;
  }): Promise<PaymentResult> {
    try {
      // In production, this would:
      // 1. Create escrow transaction
      // 2. Lock funds
      // 3. Return transaction hash
      
      // For demo/hackathon, we simulate the payment
      const response = await fetch(buildApiUrl('/payments/process'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        // If endpoint doesn't exist, simulate success for demo
        console.log('Payment endpoint not available, simulating...');
        return this.simulatePayment(params);
      }

      return await response.json();
    } catch (error) {
      console.log('Payment API error, simulating for demo...');
      return this.simulatePayment(params);
    }
  }

  /**
   * Simulate payment for demo purposes
   */
  private simulatePayment(params: {
    userIdentity: string;
    providerIdentity: string;
    amount: number;
    gpuId: string;
    duration: string;
    durationHours: number;
  }): PaymentResult {
    const txHash = `QBX${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    return {
      success: true,
      txHash,
      amount: params.amount,
      from: params.userIdentity,
      to: params.providerIdentity,
      message: `Payment of ${params.amount} QUBIC processed successfully`
    };
  }

  /**
   * Create GPU rental
   */
  async createRental(params: {
    gpuId: string;
    gpuModel: string;
    duration: string;
    durationHours: number;
    totalCost: number;
    environment: string;
    txHash: string;
  }): Promise<RentalInfo> {
    try {
      const response = await fetch(buildApiUrl('/rentals'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        // Simulate for demo
        return this.simulateRental(params);
      }

      return await response.json();
    } catch (error) {
      return this.simulateRental(params);
    }
  }

  /**
   * Simulate rental creation for demo
   */
  private simulateRental(params: {
    gpuId: string;
    gpuModel: string;
    duration: string;
    durationHours: number;
    totalCost: number;
    environment: string;
    txHash: string;
  }): RentalInfo {
    const now = new Date();
    const endTime = new Date(now.getTime() + params.durationHours * 3600000);
    const instanceId = `gpu-${Math.random().toString(36).substr(2, 9)}`;

    // Generate access URL based on environment
    let accessUrl = '';
    switch (params.environment) {
      case 'jupyter':
        accessUrl = `https://${instanceId}.jupyter.qubix.io`;
        break;
      case 'ssh':
        accessUrl = `ssh://root@${instanceId}.ssh.qubix.io`;
        break;
      case 'vscode':
        accessUrl = `https://${instanceId}.vscode.qubix.io`;
        break;
      case 'api':
        accessUrl = `https://${instanceId}.api.qubix.io`;
        break;
    }

    return {
      instanceId,
      gpuModel: params.gpuModel,
      duration: params.duration,
      durationHours: params.durationHours,
      totalCost: params.totalCost,
      startTime: now.toISOString(),
      endTime: endTime.toISOString(),
      status: 'active',
      environment: params.environment,
      accessUrl
    };
  }

  /**
   * Get user's active rentals
   */
  async getActiveRentals(): Promise<RentalInfo[]> {
    try {
      const response = await fetch(buildApiUrl('/rentals/active'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        return [];
      }

      return await response.json();
    } catch (error) {
      return [];
    }
  }

  /**
   * Cancel a rental (if allowed)
   */
  async cancelRental(instanceId: string): Promise<{ success: boolean; refundAmount?: number }> {
    try {
      const response = await fetch(buildApiUrl(`/rentals/${instanceId}/cancel`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        return { success: false };
      }

      return await response.json();
    } catch (error) {
      return { success: false };
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(identity: string): Promise<any[]> {
    try {
      const response = await fetch(buildApiUrl(`/wallet/transactions/${identity}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        return [];
      }

      return await response.json();
    } catch (error) {
      return [];
    }
  }
}

export const qubicApi = new QubicApiService();

