/**
 * Provider Dashboard - Simplified with Python Auto-detect
 */
import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Briefcase, Server, Cpu, Settings, Pause, Trash2, Play, RefreshCw } from 'lucide-react';

export default function ProviderDashboardSimple() {
  const [stats, setStats] = useState({
    totalEarnings: 0,
    activeJobs: 0,
    hardwareOnline: 0
  });
  
  const [gpus, setGpus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [detectStatus, setDetectStatus] = useState('');
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    fetchData();
    fetchMetrics();
    
    // Poll metrics every 3 seconds
    const metricsInterval = setInterval(fetchMetrics, 3000);
    
    return () => clearInterval(metricsInterval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/hardware/metrics');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMetrics(data.metrics);
        }
      }
    } catch (e) {
      console.error('Failed to fetch metrics:', e);
    }
  };

  const fetchData = async () => {
    try {
      const qubicAddress = localStorage.getItem('qubicAddress') || 'QUBICTESTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
      
      const res = await fetch(`/api/providers/my?qubicAddress=${qubicAddress}`);
      if (res.ok) {
        const data = await res.json();
        const providers = data.providers || data || [];
        setGpus(providers);
        
        const totalEarnings = providers.reduce((sum: number, p: any) => sum + (p.totalEarnings || 0), 0);
        const hardwareOnline = providers.filter((p: any) => p.isOnline).length;
        
        setStats({
          totalEarnings,
          activeJobs: 0,
          hardwareOnline
        });
      }
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Auto-detect using Python script via backend
  const handleAutoDetect = async () => {
    setDetecting(true);
    setDetectStatus('🔍 Detecting GPU with Python...');
    
    try {
      const res = await fetch('/api/hardware/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await res.json();
      
      if (data.success) {
        setDetectStatus('✅ GPU detected and registered!');
        await fetchData();
        setTimeout(() => {
          setDetectStatus('');
          setDetecting(false);
        }, 2000);
      } else {
        setDetectStatus(`❌ Error: ${data.error}`);
        setTimeout(() => {
          setDetectStatus('');
          setDetecting(false);
        }, 3000);
      }
    } catch (error: any) {
      setDetectStatus(`❌ Error: ${error.message}`);
      setTimeout(() => {
        setDetectStatus('');
        setDetecting(false);
      }, 3000);
    }
  };

  const handleToggle = async (id: string, online: boolean) => {
    try {
      await fetch(`/api/providers/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ online: !online })
      });
      await fetchData();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this hardware?')) return;
    
    try {
      await fetch(`/api/providers/${id}`, { method: 'DELETE' });
      await fetchData();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Provider Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400">Total Earnings</span>
            <DollarSign className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-green-400">
            {stats.totalEarnings.toFixed(2)} QUBIC
          </div>
          <div className="text-sm text-slate-500 mt-1">
            <TrendingUp className="w-4 h-4 inline mr-1" />
            From all hardware
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400">Active Jobs</span>
            <Briefcase className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold">{stats.activeJobs}</div>
          <div className="text-sm text-slate-500 mt-1">Currently running</div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400">Hardware Online</span>
            <Server className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-bold">{stats.hardwareOnline}</div>
          <div className="text-sm text-slate-500 mt-1">of {gpus.length} total</div>
        </div>
      </div>

      {/* Real-time GPU Metrics */}
      {metrics && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Cpu className="w-6 h-6 text-cyan-400" />
                Live GPU Metrics
              </h3>
              <p className="text-sm text-slate-400 mt-1">{metrics.gpu_model}</p>
            </div>
            <div className="flex items-center gap-2 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Live</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* GPU Load */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-2">GPU Load</div>
              <div className="text-2xl font-bold text-cyan-400">{metrics.gpu_load.toFixed(1)}%</div>
              <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                  style={{ width: `${metrics.gpu_load}%` }}
                ></div>
              </div>
            </div>

            {/* Temperature */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-2">Temperature</div>
              <div className="text-2xl font-bold text-orange-400">{metrics.gpu_temp.toFixed(0)}°C</div>
              <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    metrics.gpu_temp > 80 ? 'bg-red-500' : 
                    metrics.gpu_temp > 70 ? 'bg-orange-500' : 
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(metrics.gpu_temp, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Memory Used */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-2">Memory Used</div>
              <div className="text-2xl font-bold text-purple-400">
                {(metrics.gpu_memory_used / 1024).toFixed(1)} GB
              </div>
              <div className="text-xs text-slate-500 mt-1">
                of {(metrics.gpu_memory_total / 1024).toFixed(1)} GB
              </div>
            </div>

            {/* Memory % */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-2">Memory Usage</div>
              <div className="text-2xl font-bold text-pink-400">{metrics.gpu_memory_percent}%</div>
              <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${metrics.gpu_memory_percent}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-500 text-center">
            Updates every 3 seconds • Powered by Python GPUtil
          </div>
        </div>
      )}

      {/* Add GPU (if empty) */}
      {gpus.length === 0 && !loading && (
        <div className="bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/50 rounded-xl p-8 text-center">
          <Cpu className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Add Your First GPU</h3>
          <p className="text-slate-400 mb-6">
            Start earning by sharing your GPU compute power
          </p>
          
          {detectStatus && (
            <div className={`mb-4 p-3 rounded-lg ${
              detectStatus.includes('❌') 
                ? 'bg-red-500/20 text-red-400' 
                : 'bg-green-500/20 text-green-400'
            }`}>
              {detectStatus}
            </div>
          )}
          
          <button 
            onClick={handleAutoDetect}
            disabled={detecting}
            className="bg-green-500 hover:bg-green-600 px-8 py-3 rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            {detecting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Detecting...
              </>
            ) : (
              <>
                <Cpu className="w-5 h-5" />
                Auto-Detect GPU (Python)
              </>
            )}
          </button>
          
          <p className="text-xs text-slate-500 mt-4">
            Requires Python, nvidia-smi, and backend running
          </p>
        </div>
      )}

      {/* Hardware List */}
      {gpus.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">My Hardware ({gpus.length})</h2>
            <button
              onClick={handleAutoDetect}
              disabled={detecting}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg font-medium disabled:opacity-50"
            >
              {detecting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Detecting...
                </>
              ) : (
                <>
                  <Cpu className="w-5 h-5" />
                  Add More
                </>
              )}
            </button>
          </div>

          {detectStatus && (
            <div className={`p-3 rounded-lg ${
              detectStatus.includes('❌') 
                ? 'bg-red-500/20 text-red-400' 
                : 'bg-green-500/20 text-green-400'
            }`}>
              {detectStatus}
            </div>
          )}
          
          {gpus.map(gpu => (
            <div key={gpu.id} className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    gpu.isOnline ? 'bg-green-500/20' : 'bg-slate-500/20'
                  }`}>
                    <Server className={`w-7 h-7 ${gpu.isOnline ? 'text-green-400' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">
                        {gpu.specs?.gpu_model || gpu.gpuModel || 'Unknown GPU'}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        gpu.isOnline ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                      }`}>
                        {gpu.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      {gpu.specs?.gpu_vram_gb || gpu.gpuVram || 0}GB VRAM • 
                      {gpu.specs?.cpu_cores || gpu.cpuCores || 0} cores • 
                      {(gpu.specs?.ram_total_gb || gpu.ramTotal || 0).toFixed(1)}GB RAM
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {gpu.pricePerHour} QUBIC/hour • {gpu.location || 'Unknown'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-2xl font-bold text-green-400">
                      <DollarSign className="w-6 h-6" />
                      {(gpu.totalEarnings || 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-slate-400">
                      {gpu.totalJobs || 0} jobs
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg">
                      <Settings className="w-5 h-5" />
                    </button>
                    {gpu.isOnline ? (
                      <button 
                        onClick={() => handleToggle(gpu.id, gpu.isOnline)}
                        className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30"
                      >
                        <Pause className="w-5 h-5" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleToggle(gpu.id, gpu.isOnline)}
                        className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
                      >
                        <Play className="w-5 h-5" />
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(gpu.id)}
                      className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

