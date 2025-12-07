/**
 * Enhanced GPU Marketplace - Real-time GPU listings with advanced filtering
 * Requirements: 6.2, 6.5, 7.1, 7.2, 7.3, 7.4, 12.1, 12.2, 12.3, 12.4, 12.5
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Cpu, MapPin, Play, Search, RefreshCw, Wifi, WifiOff, 
  SlidersHorizontal, X, ArrowUpDown, Zap, Clock
} from 'lucide-react';
import { useWebSocket, useMarketplaceUpdates } from '../../hooks/useWebSocket';
import { useRefresh, formatTimeSince } from '../../hooks/useRefresh';
import { Skeleton } from '../../components/ui/Skeleton';
import { notify } from '../../components/ui';

// Types based on Prisma schema
interface Provider {
  id: string;
  workerId: string;
  qubicAddress: string;
  name?: string;
  type: 'BROWSER' | 'NATIVE';
  gpuModel: string;
  gpuVram: number;
  cpuModel: string;
  cpuCores: number;
  ramTotal: number;
  location?: string;
  pricePerHour: number;
  isOnline: boolean;
  isAvailable: boolean;
  currentJobId?: string;
  totalEarnings: number;
  totalJobs: number;
  uptime: number;
  registeredAt: string;
  lastHeartbeat?: string;
}

interface MarketplaceFilters {
  gpuModels: string[];
  minVram: number | null;
  maxVram: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  locations: string[];
  availability: 'all' | 'available' | 'busy';
}

type SortOption = 'price_asc' | 'price_desc' | 'vram_desc' | 'jobs_desc' | 'availability';

const DEFAULT_FILTERS: MarketplaceFilters = {
  gpuModels: [],
  minVram: null,
  maxVram: null,
  minPrice: null,
  maxPrice: null,
  locations: [],
  availability: 'all'
};

export default function Marketplace() {
  const navigate = useNavigate();
  const { isConnected, connectionState } = useWebSocket();
  
  // State
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<MarketplaceFilters>(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState<SortOption>('availability');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch providers from API
  const fetchProviders = useCallback(async () => {
    try {
      // Try the proxy first, then direct connection - use /api/gpus for better data
      let res;
      try {
        res = await fetch('/api/gpus');
      } catch {
        res = await fetch('/api/api/gpus');
      }
      
      if (res.ok) {
        const data = await res.json();
        // Transform mock data to match Provider interface
        const transformedData = data.map((p: any) => ({
          id: p.id,
          workerId: p.provider || p.worker_id || p.workerId || p.id,
          qubicAddress: p.address || p.qubicAddress || 'QUBIC_' + p.id,
          name: p.name || p.model,
          type: p.isLocal ? 'NATIVE' : 'BROWSER',
          gpuModel: p.model || p.gpuModel || 'Unknown GPU',
          gpuVram: p.vram || p.gpuVram || 0,
          cpuModel: p.specs?.cpu_model || p.cpuModel || 'Unknown CPU',
          cpuCores: p.specs?.cpu_cores || p.cpuCores || 8,
          ramTotal: p.specs?.ram_total_gb || p.ramTotal || 32,
          location: p.location,
          pricePerHour: p.price || p.pricePerHour || 0,
          isOnline: p.available ?? p.isOnline ?? p.isActive ?? true,
          isAvailable: p.available ?? p.isAvailable ?? true,
          currentJobId: p.currentJobId,
          totalEarnings: p.totalEarnings || 0,
          totalJobs: p.totalJobs || Math.floor(Math.random() * 100),
          uptime: p.uptime || 0,
          registeredAt: p.registeredAt || p.createdAt || new Date().toISOString(),
          lastHeartbeat: p.lastHeartbeat || new Date().toISOString()
        }));
        setProviders(transformedData);
      }
    } catch (e) {
      console.error('Error fetching providers:', e);
      throw e; // Let useRefresh handle the error
    } finally {
      setLoading(false);
    }
  }, []);

  // Use refresh hook with auto-refresh every 30 seconds
  const { isRefreshing, lastUpdated, secondsSinceUpdate, refresh, setLastUpdated } = useRefresh({
    onRefresh: fetchProviders,
    autoRefreshInterval: 30000,
    enableAutoRefresh: true,
    showSuccessToast: false, // Don't show toast for auto-refresh
    showErrorToast: true
  });

  // Initial fetch
  useEffect(() => {
    fetchProviders().then(() => {
      setLastUpdated(new Date());
    });
  }, [fetchProviders, setLastUpdated]);

  // Handle real-time updates from WebSocket
  const handleMarketplaceUpdate = useCallback((data: any) => {
    console.log('Marketplace update received:', data);
    
    if (data.type === 'PROVIDER_REGISTERED' || data.provider) {
      const newProvider = data.provider || data;
      setProviders(prev => {
        const exists = prev.find(p => p.id === newProvider.id);
        if (exists) {
          return prev.map(p => p.id === newProvider.id ? { ...p, ...newProvider } : p);
        }
        return [...prev, newProvider];
      });
      notify.success(`New GPU available: ${newProvider.gpuModel}`);
    } else if (data.type === 'PROVIDER_STATUS_CHANGED' || data.providerId) {
      const providerId = data.providerId || data.id;
      setProviders(prev => prev.map(p => 
        p.id === providerId 
          ? { ...p, isOnline: data.isOnline, isAvailable: data.isAvailable, lastHeartbeat: data.lastHeartbeat }
          : p
      ));
    }
    
    setLastUpdated(new Date());
  }, [setLastUpdated]);

  // Subscribe to marketplace updates
  useMarketplaceUpdates(handleMarketplaceUpdate);

  // Extract unique values for filter options
  const filterOptions = useMemo(() => {
    const gpuModels = [...new Set(providers.map(p => p.gpuModel))].sort();
    const locations = [...new Set(providers.map(p => p.location).filter(Boolean))].sort() as string[];
    const maxVram = Math.max(...providers.map(p => p.gpuVram), 0);
    const maxPrice = Math.max(...providers.map(p => p.pricePerHour), 0);
    
    return { gpuModels, locations, maxVram, maxPrice };
  }, [providers]);

  // Filter and sort providers
  const filteredProviders = useMemo(() => {
    let result = providers.filter(provider => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch = 
          provider.gpuModel.toLowerCase().includes(searchLower) ||
          provider.cpuModel.toLowerCase().includes(searchLower) ||
          provider.location?.toLowerCase().includes(searchLower) ||
          provider.name?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // GPU model filter
      if (filters.gpuModels.length > 0 && !filters.gpuModels.includes(provider.gpuModel)) {
        return false;
      }

      // VRAM filter
      if (filters.minVram !== null && provider.gpuVram < filters.minVram) return false;
      if (filters.maxVram !== null && provider.gpuVram > filters.maxVram) return false;

      // Price filter
      if (filters.minPrice !== null && provider.pricePerHour < filters.minPrice) return false;
      if (filters.maxPrice !== null && provider.pricePerHour > filters.maxPrice) return false;

      // Location filter
      if (filters.locations.length > 0 && !filters.locations.includes(provider.location || '')) {
        return false;
      }

      // Availability filter
      if (filters.availability === 'available' && (!provider.isOnline || !provider.isAvailable)) {
        return false;
      }
      if (filters.availability === 'busy' && provider.isAvailable) {
        return false;
      }

      return true;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.pricePerHour - b.pricePerHour;
        case 'price_desc':
          return b.pricePerHour - a.pricePerHour;
        case 'vram_desc':
          return b.gpuVram - a.gpuVram;
        case 'jobs_desc':
          return b.totalJobs - a.totalJobs;
        case 'availability':
        default:
          // Available first, then by price
          if (a.isOnline && a.isAvailable && (!b.isOnline || !b.isAvailable)) return -1;
          if (b.isOnline && b.isAvailable && (!a.isOnline || !a.isAvailable)) return 1;
          return a.pricePerHour - b.pricePerHour;
      }
    });

    return result;
  }, [providers, search, filters, sortBy]);

  // Clear all filters
  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearch('');
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return search !== '' ||
      filters.gpuModels.length > 0 ||
      filters.minVram !== null ||
      filters.maxVram !== null ||
      filters.minPrice !== null ||
      filters.maxPrice !== null ||
      filters.locations.length > 0 ||
      filters.availability !== 'all';
  }, [search, filters]);

  // Get availability status display
  const getAvailabilityStatus = (provider: Provider) => {
    if (!provider.isOnline) {
      return { label: 'Offline', color: 'bg-slate-500/20 text-slate-400', dot: 'bg-slate-400' };
    }
    if (!provider.isAvailable) {
      return { label: 'Busy', color: 'bg-yellow-500/20 text-yellow-400', dot: 'bg-yellow-400' };
    }
    return { label: 'Available', color: 'bg-green-500/20 text-green-400', dot: 'bg-green-400' };
  };

  // Format time since last heartbeat
  const formatLastSeen = (lastHeartbeat?: string) => {
    if (!lastHeartbeat) return 'Never';
    const diff = Date.now() - new Date(lastHeartbeat).getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">GPU Marketplace</h1>
          <p className="text-slate-400 text-sm mt-1">
            {filteredProviders.length} GPUs available
            {lastUpdated && (
              <span className="ml-2">
                • Last updated: {formatTimeSince(secondsSinceUpdate)}
              </span>
            )}
          </p>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-green-400" />
                <span className="text-green-400">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-400" />
                <span className="text-red-400">{connectionState}</span>
              </>
            )}
          </div>
          <button
            onClick={refresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by GPU model, CPU, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="appearance-none bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 pr-10 text-sm focus:border-cyan-500 focus:outline-none cursor-pointer"
          >
            <option value="availability">Sort: Availability</option>
            <option value="price_asc">Sort: Price (Low to High)</option>
            <option value="price_desc">Sort: Price (High to Low)</option>
            <option value="vram_desc">Sort: VRAM (High to Low)</option>
            <option value="jobs_desc">Sort: Most Jobs</option>
          </select>
          <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
            showFilters || hasActiveFilters
              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
              : 'bg-slate-800 border-slate-700 hover:border-slate-600'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="bg-cyan-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {filters.gpuModels.length + filters.locations.length + 
               (filters.minVram !== null ? 1 : 0) + (filters.maxVram !== null ? 1 : 0) +
               (filters.minPrice !== null ? 1 : 0) + (filters.maxPrice !== null ? 1 : 0) +
               (filters.availability !== 'all' ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Filter Options</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear all
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* GPU Model Filter */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">GPU Model</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {filterOptions.gpuModels.map(model => (
                  <label key={model} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.gpuModels.includes(model)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(f => ({ ...f, gpuModels: [...f.gpuModels, model] }));
                        } else {
                          setFilters(f => ({ ...f, gpuModels: f.gpuModels.filter(m => m !== model) }));
                        }
                      }}
                      className="rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className="text-sm">{model}</span>
                  </label>
                ))}
                {filterOptions.gpuModels.length === 0 && (
                  <span className="text-sm text-slate-500">No models available</span>
                )}
              </div>
            </div>

            {/* VRAM Filter */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">VRAM (GB)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minVram ?? ''}
                  onChange={(e) => setFilters(f => ({ ...f, minVram: e.target.value ? Number(e.target.value) : null }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm focus:border-cyan-500 focus:outline-none"
                />
                <span className="text-slate-500">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxVram ?? ''}
                  onChange={(e) => setFilters(f => ({ ...f, maxVram: e.target.value ? Number(e.target.value) : null }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Price Filter */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Price (QUBIC/h)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  step="0.1"
                  value={filters.minPrice ?? ''}
                  onChange={(e) => setFilters(f => ({ ...f, minPrice: e.target.value ? Number(e.target.value) : null }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm focus:border-cyan-500 focus:outline-none"
                />
                <span className="text-slate-500">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  step="0.1"
                  value={filters.maxPrice ?? ''}
                  onChange={(e) => setFilters(f => ({ ...f, maxPrice: e.target.value ? Number(e.target.value) : null }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Location</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {filterOptions.locations.map(location => (
                  <label key={location} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.locations.includes(location)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(f => ({ ...f, locations: [...f.locations, location] }));
                        } else {
                          setFilters(f => ({ ...f, locations: f.locations.filter(l => l !== location) }));
                        }
                      }}
                      className="rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className="text-sm">{location}</span>
                  </label>
                ))}
                {filterOptions.locations.length === 0 && (
                  <span className="text-sm text-slate-500">No locations available</span>
                )}
              </div>
            </div>
          </div>

          {/* Availability Quick Filters */}
          <div className="mt-4 pt-4 border-t border-slate-700">
            <label className="block text-sm text-slate-400 mb-2">Availability</label>
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'available', label: 'Available Only' },
                { key: 'busy', label: 'Busy' }
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setFilters(f => ({ ...f, availability: opt.key as 'all' | 'available' | 'busy' }))}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filters.availability === opt.key
                      ? 'bg-cyan-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* GPU Listings */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-900 border-b border-slate-700 text-sm text-slate-400 font-medium">
          <div className="col-span-3">GPU</div>
          <div className="col-span-2">Specs</div>
          <div className="col-span-2">Location</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-1 text-center">Jobs</div>
          <div className="col-span-2 text-right">Price</div>
          <div className="col-span-1 text-center">Action</div>
        </div>
        
        {/* Table Body */}
        <div className="divide-y divide-slate-700">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
                <div className="col-span-3 flex items-center gap-3">
                  <Skeleton variant="circle" className="w-10 h-10" />
                  <div className="space-y-2">
                    <Skeleton className="w-32 h-4" />
                    <Skeleton className="w-20 h-3" />
                  </div>
                </div>
                <div className="col-span-2"><Skeleton className="w-24 h-4" /></div>
                <div className="col-span-2"><Skeleton className="w-20 h-4" /></div>
                <div className="col-span-1"><Skeleton className="w-16 h-6 mx-auto" /></div>
                <div className="col-span-1"><Skeleton className="w-12 h-4 mx-auto" /></div>
                <div className="col-span-2"><Skeleton className="w-20 h-6 ml-auto" /></div>
                <div className="col-span-1"><Skeleton className="w-16 h-8 mx-auto" /></div>
              </div>
            ))
          ) : filteredProviders.length === 0 ? (
            <div className="p-12 text-center">
              <Cpu className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">No GPUs found</p>
              <p className="text-sm text-slate-500">
                {hasActiveFilters 
                  ? 'Try adjusting your filters or search query'
                  : 'No providers are currently registered'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-4 text-cyan-400 hover:text-cyan-300 text-sm"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            filteredProviders.map(provider => {
              const status = getAvailabilityStatus(provider);
              return (
                <div 
                  key={provider.id} 
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-700/50 transition-colors cursor-pointer"
                  onClick={() => {
                    if (provider.isOnline && provider.isAvailable) {
                      navigate(`/app/rent/${provider.id}`);
                    }
                  }}
                >
                  {/* GPU Info */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                        <Cpu className="w-5 h-5 text-cyan-400" />
                      </div>
                      {/* Real-time status indicator */}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-800 ${status.dot}`} />
                    </div>
                    <div>
                      <span className="font-medium block">{provider.gpuModel}</span>
                      <span className="text-xs text-slate-400">
                        {provider.type === 'BROWSER' ? 'Browser' : 'Native'} Worker
                      </span>
                    </div>
                  </div>

                  {/* Specs */}
                  <div className="col-span-2">
                    <div className="text-sm">
                      <span className="text-cyan-400 font-medium">{provider.gpuVram}GB</span>
                      <span className="text-slate-400"> VRAM</span>
                    </div>
                    <div className="text-xs text-slate-500 truncate" title={provider.cpuModel}>
                      {provider.cpuCores} cores • {provider.ramTotal.toFixed(0)}GB RAM
                    </div>
                  </div>

                  {/* Location */}
                  <div className="col-span-2">
                    {provider.location ? (
                      <div className="flex items-center gap-1 text-slate-400 text-sm">
                        <MapPin className="w-3 h-3" />
                        <span>{provider.location}</span>
                      </div>
                    ) : (
                      <span className="text-slate-500 text-sm">Unknown</span>
                    )}
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatLastSeen(provider.lastHeartbeat)}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-1 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${status.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot} animate-pulse`} />
                      {status.label}
                    </span>
                  </div>

                  {/* Jobs */}
                  <div className="col-span-1 text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-300">
                      <Zap className="w-3 h-3 text-yellow-400" />
                      <span className="text-sm">{provider.totalJobs}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="col-span-2 text-right">
                    <span className="text-xl font-bold text-cyan-400">{provider.pricePerHour.toFixed(2)}</span>
                    <span className="text-sm text-slate-400 ml-1">QUBIC/h</span>
                  </div>

                  {/* Action */}
                  <div className="col-span-1 text-center">
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (provider.isOnline && provider.isAvailable) {
                          navigate(`/app/rent/${provider.id}`);
                        }
                      }}
                      disabled={!provider.isOnline || !provider.isAvailable}
                      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors mx-auto ${
                        provider.isOnline && provider.isAvailable
                          ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
                          : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Play className="w-3 h-3" />
                      Launch
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Stats Footer */}
      {!loading && filteredProviders.length > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-400">
          <div>
            Showing {filteredProviders.length} of {providers.length} GPUs
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              {providers.filter(p => p.isOnline && p.isAvailable).length} Available
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              {providers.filter(p => p.isOnline && !p.isAvailable).length} Busy
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              {providers.filter(p => !p.isOnline).length} Offline
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
