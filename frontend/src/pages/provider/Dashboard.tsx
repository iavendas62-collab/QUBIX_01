/**
 * Provider Dashboard - Enterprise-grade analytics dashboard
 * 
 * Requirements:
 * - 10.1: Display total earnings in QUBIC
 * - 10.2: Show daily, weekly, and monthly breakdowns
 * - 10.3: Display historical utilization charts
 * - 10.4: List job history with timestamps and payments
 * - 10.5: Show current status and active job details
 * - 5.4: Display current GPU metrics
 * - 5.5: Show real-time progress and resource usage
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Server, DollarSign, Activity, TrendingUp, ChevronRight, Plus, Clock,
  Cpu, HardDrive, Thermometer, RefreshCw, Zap, CheckCircle, XCircle, Loader2, Scan
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useHardwareDetection } from '../../hooks/useHardwareDetection';

// Types
interface GPUMetrics {
  cpu_percent: number;
  ram_percent: number;
  gpu_percent: number | null;
  gpu_temp: number | null;
  gpu_mem_used_mb: number | null;
  gpu_mem_total_mb: number | null;
}

interface Provider {
  id: string;
  workerId: string;
  name: string;
  online: boolean;
  status: 'online' | 'offline' | 'available' | 'rented';
  specs: {
    gpu_model: string;
    gpu_vram_gb: number;
    cpu_model: string;
    cpu_cores: number;
    ram_total_gb: number;
  };
  metrics: GPUMetrics | null;
  pricePerHour: number;
  totalEarnings: number;
  totalJobs: number;
  location: string | null;
  lastHeartbeat: string | null;
}

interface EarningsData {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  pending: number;
  history: { date: string; amount: number }[];
}

interface JobHistory {
  id: string;
  modelType: string;
  status: string;
  progress: number;
  estimatedCost: number;
  actualCost: number | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  provider: {
    workerId: string;
    gpuModel: string;
  } | null;
  consumer: {
    qubicAddress: string;
    username: string | null;
  } | null;
}

interface MetricsHistory {
  timestamp: string;
  cpu_percent: number;
  ram_percent: number;
  gpu_percent: number | null;
  gpu_temp: number | null;
}

const API_BASE = '/api';

export default function ProviderDashboard() {
  const navigate = useNavigate();
  
  // Hardware detection hook
  const { 
    status: detectionStatus, 
    hardware: detectedHardware, 
    autoRegisterProvider,
    reset: resetDetection,
    metrics: simulatedMetrics,
    workerId: detectedWorkerId
  } = useHardwareDetection();
  
  // State
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [jobHistory, setJobHistory] = useState<JobHistory[]>([]);
  const [metricsHistory, setMetricsHistory] = useState<MetricsHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState<any>(null);

  // Fetch all dashboard data
  const fetchData = useCallback(async () => {
    try {
      console.log('📊 Fetching provider dashboard data...');
      
      // Get qubicAddress from localStorage
      const qubicAddress = localStorage.getItem('qubicAddress') || 'QUBICTESTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
      
      // Fetch providers
      const providersRes = await fetch(`${API_BASE}/providers/my?qubicAddress=${qubicAddress}`);
      if (providersRes.ok) {
        const data = await providersRes.json();
        console.log('✅ Providers loaded:', data);
        setProviders(data.providers || data || []);
        if ((data.providers || data).length > 0 && !selectedProvider) {
          setSelectedProvider((data.providers || data)[0].workerId);
        }
      } else {
        console.log('⚠️ No providers found, using empty array');
        setProviders([]);
      }

      // Fetch earnings
      const earningsRes = await fetch(`${API_BASE}/providers/my/earnings?qubicAddress=${qubicAddress}`);
      if (earningsRes.ok) {
        const data = await earningsRes.json();
        console.log('✅ Earnings loaded:', data);
        setEarnings(data);
      }

      // Fetch job history
      const jobsRes = await fetch(`${API_BASE}/providers/my/jobs?qubicAddress=${qubicAddress}&limit=20`);
      if (jobsRes.ok) {
        const data = await jobsRes.json();
        console.log('✅ Jobs loaded:', data);
        setJobHistory(data.jobs || data || []);
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedProvider]);

  // Fetch metrics history for selected provider
  const fetchMetricsHistory = useCallback(async (workerId: string) => {
    try {
      const res = await fetch(`${API_BASE}/providers/${workerId}/metrics/history?limit=30`);
      if (res.ok) {
        const data = await res.json();
        const formatted = (data.history || []).map((m: MetricsHistory) => ({
          ...m,
          time: new Date(m.timestamp).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        }));
        setMetricsHistory(formatted);
      }
    } catch (error) {
      console.error('Error fetching metrics history:', error);
    }
  }, []);

  // Fetch live GPU metrics
  const fetchLiveMetrics = async () => {
    try {
      const res = await fetch('/api/hardware/metrics');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLiveMetrics(data.metrics);
        }
      }
    } catch (e) {
      console.error('Failed to fetch live metrics:', e);
    }
  };

  // Initial load and auto-refresh
  useEffect(() => {
    fetchData();
    fetchLiveMetrics();
    
    const dataInterval = setInterval(fetchData, 10000); // Refresh every 10 seconds
    const metricsInterval = setInterval(fetchLiveMetrics, 3000); // Metrics every 3 seconds
    
    return () => {
      clearInterval(dataInterval);
      clearInterval(metricsInterval);
    };
  }, [fetchData]);

  // Fetch metrics when provider changes
  useEffect(() => {
    if (selectedProvider) {
      fetchMetricsHistory(selectedProvider);
    }
  }, [selectedProvider, fetchMetricsHistory]);

  // Manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
    if (selectedProvider) {
      fetchMetricsHistory(selectedProvider);
    }
  };

  // Auto-detect and register hardware
  const handleAutoDetect = async () => {
    setAutoDetecting(true);
    resetDetection();
    const success = await autoRegisterProvider();
    if (success) {
      // Refresh data after successful registration
      await fetchData();
    }
    setAutoDetecting(false);
  };

  // Get current provider
  const currentProvider = providers.find(p => p.workerId === selectedProvider);
  
  // Use simulated metrics from hook if available, otherwise use backend metrics
  const currentMetrics = simulatedMetrics && detectedWorkerId === selectedProvider
    ? {
        cpu_percent: simulatedMetrics.cpuUsage,
        ram_percent: simulatedMetrics.ramUsage,
        gpu_percent: simulatedMetrics.gpuUsage,
        gpu_temp: simulatedMetrics.temperature,
        gpu_mem_used_mb: simulatedMetrics.vramUsed,
        gpu_mem_total_mb: simulatedMetrics.vramTotal
      }
    : currentProvider?.metrics;

  // Calculate stats
  const stats = {
    totalEarnings: earnings?.total || 0,
    thisMonth: earnings?.thisMonth || 0,
    activeGpus: providers.filter(p => p.online).length,
    totalJobs: providers.reduce((sum, p) => sum + (p.totalJobs || 0), 0),
    pendingEarnings: earnings?.pending || 0
  };

  // Get active job (if any) - only for current provider
  const activeJob = jobHistory.find(j => 
    (j.status === 'RUNNING' || j.status === 'ASSIGNED') && 
    j.provider?.workerId === selectedProvider
  );

  // Status helpers
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': case 'available': return 'bg-green-500/20 text-green-400';
      case 'rented': return 'bg-cyan-500/20 text-cyan-400';
      case 'offline': return 'bg-slate-500/20 text-slate-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-400';
      case 'RUNNING': return 'text-cyan-400';
      case 'ASSIGNED': return 'text-yellow-400';
      case 'FAILED': return 'text-red-400';
      case 'PENDING': return 'text-slate-400';
      default: return 'text-slate-400';
    }
  };

  const getJobStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
      case 'RUNNING': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'FAILED': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-green-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Provider Dashboard</h1>
        <div className="flex items-center gap-4">
          {providers.length > 1 && (
            <select
              value={selectedProvider || ''}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm"
            >
              {providers.map(p => (
                <option key={p.workerId} value={p.workerId}>
                  {p.specs?.gpu_model || p.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards - Requirements 10.1, 10.2 */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-6 h-6 text-green-400" />
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-green-400">{stats.totalEarnings.toFixed(2)} QUBIC</div>
          <div className="text-sm text-slate-400">Total Earnings</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <Clock className="w-6 h-6 text-cyan-400 mb-2" />
          <div className="text-2xl font-bold text-cyan-400">{stats.thisMonth.toFixed(2)} QUBIC</div>
          <div className="text-sm text-slate-400">This Month</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <Server className="w-6 h-6 text-blue-400 mb-2" />
          <div className="text-2xl font-bold text-blue-400">{stats.activeGpus} / {providers.length}</div>
          <div className="text-sm text-slate-400">Active GPUs</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <Activity className="w-6 h-6 text-purple-400 mb-2" />
          <div className="text-2xl font-bold text-purple-400">{stats.totalJobs}</div>
          <div className="text-sm text-slate-400">Total Jobs</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <Zap className="w-6 h-6 text-yellow-400 mb-2" />
          <div className="text-2xl font-bold text-yellow-400">{stats.pendingEarnings.toFixed(2)} QUBIC</div>
          <div className="text-sm text-slate-400">Pending</div>
        </div>
      </div>

      {/* Live GPU Metrics */}
      {liveMetrics && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Cpu className="w-6 h-6 text-cyan-400" />
                Live GPU Metrics
              </h3>
              <p className="text-sm text-slate-400 mt-1">{liveMetrics.gpu_model}</p>
            </div>
            <div className="flex items-center gap-2 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Live</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-2">GPU Load</div>
              <div className="text-2xl font-bold text-cyan-400">{liveMetrics.gpu_load.toFixed(1)}%</div>
              <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                  style={{ width: `${liveMetrics.gpu_load}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-2">Temperature</div>
              <div className="text-2xl font-bold text-orange-400">{liveMetrics.gpu_temp.toFixed(0)}°C</div>
              <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    liveMetrics.gpu_temp > 80 ? 'bg-red-500' : 
                    liveMetrics.gpu_temp > 70 ? 'bg-orange-500' : 
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(liveMetrics.gpu_temp, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-2">Memory Used</div>
              <div className="text-2xl font-bold text-purple-400">
                {(liveMetrics.gpu_memory_used / 1024).toFixed(1)} GB
              </div>
              <div className="text-xs text-slate-500 mt-1">
                of {(liveMetrics.gpu_memory_total / 1024).toFixed(1)} GB
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-2">Memory Usage</div>
              <div className="text-2xl font-bold text-pink-400">{liveMetrics.gpu_memory_percent}%</div>
              <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${liveMetrics.gpu_memory_percent}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-500 text-center">
            Updates every 3 seconds • Powered by Python GPUtil
          </div>
        </div>
      )}



      {/* Current Status & Active Job - Requirements 10.5, 5.5 */}
      {currentProvider && (
        <div className="grid grid-cols-3 gap-6">
          {/* Current Status */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Current Status</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(currentProvider.status)}`}>
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${currentProvider.online ? 'bg-green-400 animate-pulse' : 'bg-slate-400'}`}></span>
                {currentProvider.online ? (currentProvider.status === 'rented' ? 'Busy' : 'Online') : 'Offline'}
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Server className="w-8 h-8 text-green-400" />
                <div>
                  <div className="font-medium">{currentProvider.specs?.gpu_model || 'Unknown GPU'}</div>
                  <div className="text-sm text-slate-400">{currentProvider.specs?.gpu_vram_gb || 0}GB VRAM</div>
                </div>
              </div>
              <div className="text-sm text-slate-400">
                <div>Price: {currentProvider.pricePerHour} QUBIC/hour</div>
                <div>Location: {currentProvider.location || 'Not set'}</div>
                {currentProvider.lastHeartbeat && (
                  <div>Last seen: {new Date(currentProvider.lastHeartbeat).toLocaleTimeString()}</div>
                )}
              </div>
            </div>
          </div>

          {/* Active Job Details */}
          <div className="col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="font-semibold mb-4">Active Job</h2>
            {activeJob ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                    <div>
                      <div className="font-medium">{activeJob.modelType}</div>
                      <div className="text-sm text-slate-400">Job ID: {activeJob.id.slice(0, 8)}...</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-cyan-400">{activeJob.progress}%</div>
                    <div className="text-sm text-slate-400">Progress</div>
                  </div>
                </div>
                <div className="bg-slate-700 rounded-full h-3">
                  <div 
                    className="bg-cyan-400 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${activeJob.progress}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-slate-400">Started</div>
                    <div>{activeJob.startedAt ? new Date(activeJob.startedAt).toLocaleTimeString() : 'Pending'}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Estimated Cost</div>
                    <div className="text-green-400">{(activeJob.estimatedCost || 0).toFixed(2)} QUBIC</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Consumer</div>
                    <div className="truncate">{activeJob.consumer?.qubicAddress?.slice(0, 12)}...</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No active job running</p>
                <p className="text-sm">Your GPU is available for new jobs</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Real-Time Metrics - Requirements 5.4 */}
      {currentProvider && currentMetrics && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <span className="text-sm text-slate-400">GPU Usage</span>
            </div>
            <div className="text-2xl font-bold text-cyan-400">{currentMetrics.gpu_percent || 0}%</div>
            <div className="mt-2 bg-slate-700 rounded-full h-2">
              <div className="bg-cyan-400 h-2 rounded-full transition-all" style={{ width: `${currentMetrics.gpu_percent || 0}%` }} />
            </div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-slate-400">CPU Usage</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">{currentMetrics.cpu_percent?.toFixed(1) || 0}%</div>
            <div className="mt-2 bg-slate-700 rounded-full h-2">
              <div className="bg-blue-400 h-2 rounded-full transition-all" style={{ width: `${currentMetrics.cpu_percent || 0}%` }} />
            </div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-slate-400">RAM Usage</span>
            </div>
            <div className="text-2xl font-bold text-purple-400">{currentMetrics.ram_percent?.toFixed(1) || 0}%</div>
            <div className="mt-2 bg-slate-700 rounded-full h-2">
              <div className="bg-purple-400 h-2 rounded-full transition-all" style={{ width: `${currentMetrics.ram_percent || 0}%` }} />
            </div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Thermometer className="w-5 h-5 text-orange-400" />
              <span className="text-sm text-slate-400">Temperature</span>
            </div>
            <div className="text-2xl font-bold text-orange-400">{currentMetrics.gpu_temp || 0}°C</div>
            <div className="mt-2 bg-slate-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${(currentMetrics.gpu_temp || 0) > 80 ? 'bg-red-400' : 'bg-orange-400'}`} 
                style={{ width: `${Math.min(currentMetrics.gpu_temp || 0, 100)}%` }} 
              />
            </div>
          </div>
        </div>
      )}


      {/* Charts Section - Requirements 10.3 */}
      <div className="grid grid-cols-2 gap-6">
        {/* Earnings History Chart */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="font-semibold mb-4">Earnings History (30 Days)</h2>
          {earnings && earnings.history.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={earnings.history}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number) => [`${value.toFixed(2)} QUBIC`, 'Earnings']}
                />
                <Area type="monotone" dataKey="amount" stroke="#22c55e" fillOpacity={1} fill="url(#colorEarnings)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-400">
              No earnings data yet
            </div>
          )}
        </div>

        {/* GPU Metrics History Chart */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="font-semibold mb-4">GPU & CPU Usage History</h2>
          {metricsHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={metricsHistory}>
                <defs>
                  <linearGradient id="colorGpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="gpu_percent" name="GPU %" stroke="#22d3ee" fillOpacity={1} fill="url(#colorGpu)" />
                <Area type="monotone" dataKey="cpu_percent" name="CPU %" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCpu)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-400">
              No metrics data yet. Connect a worker to see real-time metrics.
            </div>
          )}
        </div>
      </div>

      {/* Job History Table - Requirement 10.4 */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="font-semibold">Job History</h2>
          <span className="text-sm text-slate-400">{jobHistory.length} jobs</span>
        </div>
        {jobHistory.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No jobs completed yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900 text-sm text-slate-400">
                <tr>
                  <th className="px-6 py-3 text-left">Job ID</th>
                  <th className="px-6 py-3 text-left">Model</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-center">Progress</th>
                  <th className="px-6 py-3 text-left">Started</th>
                  <th className="px-6 py-3 text-left">Completed</th>
                  <th className="px-6 py-3 text-right">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {jobHistory.map(job => (
                  <tr key={job.id} className="hover:bg-slate-700/50">
                    <td className="px-6 py-4">
                      <code className="text-xs bg-slate-900 px-2 py-1 rounded">
                        {job.id.slice(0, 8)}...
                      </code>
                    </td>
                    <td className="px-6 py-4">{job.modelType}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 ${getJobStatusColor(job.status)}`}>
                        {getJobStatusIcon(job.status)}
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-700 rounded-full h-2 max-w-[80px]">
                          <div 
                            className={`h-2 rounded-full ${job.status === 'COMPLETED' ? 'bg-green-400' : 'bg-cyan-400'}`}
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">{job.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {job.startedAt ? new Date(job.startedAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {job.completedAt ? new Date(job.completedAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-medium ${job.status === 'COMPLETED' ? 'text-green-400' : 'text-slate-400'}`}>
                        {job.status === 'COMPLETED' 
                          ? `+${(job.actualCost || job.estimatedCost || 0).toFixed(2)} QUBIC`
                          : `~${(job.estimatedCost || 0).toFixed(2)} QUBIC`
                        }
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


    </div>
  );
}

