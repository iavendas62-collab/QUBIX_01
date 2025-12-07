/**
 * Frontend Configuration - URLs CORRETAS
 * ATENÇÃO: Evitar duplicação de /api/api
 */

// Backend API Base URL
// Em desenvolvimento: usa proxy do Vite (/api é proxy para localhost:3006)
// Em produção (Railway): usa string vazia pois frontend/backend estão no mesmo domínio
export const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : '/api');

// WebSocket URL
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3006';

// Qubic Network
export const QUBIC_NETWORK = import.meta.env.VITE_QUBIC_NETWORK || 'testnet';
export const QUBIC_RPC_URL = QUBIC_NETWORK === 'mainnet'
  ? 'https://rpc.qubic.org'
  : 'https://testnet-rpc.qubic.org';

// Helper to build API URLs (SIMPLIFICADO)
export const apiUrl = (path: string) => {
  // Remove leading slash
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Remove /api se já estiver no path
  const pathWithoutApi = cleanPath.startsWith('api/') ? cleanPath.slice(4) : cleanPath;
  
  // Sempre retorna /api/path
  return `/api/${pathWithoutApi}`;
};

// Example usage:
// apiUrl('auth/login') -> http://localhost:3006/api/auth/login
// apiUrl('/api/auth/login') -> http://localhost:3006/api/auth/login (sem duplicar)
// apiUrl('jobs') -> http://localhost:3006/api/jobs

console.log('🔧 Frontend Config:', {
  API_BASE_URL,
  WS_URL,
  QUBIC_NETWORK,
  QUBIC_RPC_URL
});

