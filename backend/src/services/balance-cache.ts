/**
 * Balance Cache Service
 * 
 * Cacheia saldos de carteiras Qubic para evitar requisições lentas
 */

interface CacheEntry {
  balance: number;
  timestamp: number;
}

class BalanceCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL = 30000; // 30 segundos

  async getBalance(
    identity: string,
    fetchFn: () => Promise<number>
  ): Promise<number> {
    const cached = this.cache.get(identity);
    const now = Date.now();

    // Se tem cache válido, retorna
    if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
      console.log(`✅ Cache hit for ${identity.slice(0, 10)}...`);
      return cached.balance;
    }

    // Busca novo saldo
    console.log(`🔄 Fetching balance for ${identity.slice(0, 10)}...`);
    try {
      const balance = await fetchFn();
      
      // Salva no cache
      this.cache.set(identity, {
        balance,
        timestamp: now
      });

      return balance;
    } catch (error) {
      console.error('Error fetching balance:', error);
      
      // Se falhar mas tem cache antigo, retorna ele
      if (cached) {
        console.log('⚠️ Using stale cache due to error');
        return cached.balance;
      }
      
      throw error;
    }
  }

  clearCache(identity?: string) {
    if (identity) {
      this.cache.delete(identity);
    } else {
      this.cache.clear();
    }
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

export default new BalanceCache();
