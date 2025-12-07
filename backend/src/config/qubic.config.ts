/**
 * Qubic Configuration
 * 
 * IMPORTANT: Update these values based on actual Qubic documentation
 * Current values are placeholders and need to be verified
 */

export const QUBIC_CONFIG = {
  // Network configuration
  network: process.env.QUBIC_NETWORK || 'testnet',
  
  // RPC endpoints (VERIFY THESE URLs)
  rpcEndpoint: process.env.QUBIC_RPC_URL || 'https://testnet-rpc.qubic.org',
  wsEndpoint: process.env.QUBIC_WS_URL || 'wss://testnet-ws.qubic.org',
  
  // Explorer URLs (VERIFY THESE URLs)
  explorerUrl: process.env.QUBIC_EXPLORER_URL || 'https://testnet.qubic.org',
  
  // Admin public key for verification
  adminPublicKey: process.env.QUBIC_ADMIN_PUBLIC_KEY || '97CC65D1E59351EEFC776BCFF197533F148A8105DA84129C051F70DD9CA0FF82',
  
  // Platform wallet (for escrow)
  platformSeed: process.env.QUBIC_PLATFORM_SEED || '',
  platformAddress: process.env.QUBIC_PLATFORM_ADDRESS || '',
  
  // Transaction settings
  confirmations: parseInt(process.env.QUBIC_CONFIRMATIONS || '3'),
  gasLimit: parseInt(process.env.QUBIC_GAS_LIMIT || '1000000'),
  
  // Fee structure
  platformFeePercent: 5, // 5% platform fee
  
  // Timeouts
  transactionTimeout: 60000, // 60 seconds
  confirmationTimeout: 120000, // 2 minutes
};

// Validate configuration
export function validateQubicConfig(): void {
  const required = [
    'rpcEndpoint',
    'platformSeed',
    'platformAddress'
  ];
  
  const missing = required.filter(key => !QUBIC_CONFIG[key as keyof typeof QUBIC_CONFIG]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required Qubic configuration: ${missing.join(', ')}`);
  }
}

// Helper to get explorer URL for transaction
export function getExplorerUrl(txHash: string): string {
  return `${QUBIC_CONFIG.explorerUrl}/tx/${txHash}`;
}

// Helper to get explorer URL for address
export function getAddressExplorerUrl(address: string): string {
  return `${QUBIC_CONFIG.explorerUrl}/address/${address}`;
}
