/**
 * Provider Monitor - Monitoramento em tempo real de todas as máquinas
 */
import { useState, useEffect, useRef } from 'react';
import { Server, Activity, Cpu, HardDrive, Thermometer, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useHardwareDetection } from '../../hooks/useHardwareDetection';

export default function ProviderMonitor() {
  const [gpus, setGpus] = useState<any[]>([]);
  const [selectedGpu, setSelectedGpu] = useState<string | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Hook para métricas simuladas
  const { metrics: simulatedMetrics, workerId: detectedWorkerId } = useHardwareDetection();
  const localHistoryRef = useRef<any[]>([]);

  useEffect(() => {
    fetchGpus();
    const interval = setInterval(fetchGpus, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedGpu) fetchHistory(selectedGpu);
  }, [selectedGpu]);

  const fetchGpus = async () => {
    try {
      const res = await fetch('/api/providers/my');
      if (res.ok) {
        const data = await res.json();
        setGpus(data);
        if (data.length > 0 && !selectedGpu) setSelectedGpu(data[0].workerId);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchHistory = async (workerId: string) => {
    try {
      const res = await fetch(`/api/providers/${workerId}/metrics/history?limit=60`);
      if (res.ok) {
        const data = await res.json();
        setMetricsHistory(data.history.map((m: any) => ({
          ...m,
          time: new Date(m.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        })));
      }
    } catch (e) { console.error(e); }
  };

  const currentGpu = gpus.find(g => g.workerId === selectedGpu);
  
  // Use métricas simuladas se disponíveis para o provider selecionado
  const metrics = simulatedMetrics && detectedWorkerId === selectedGpu
    ? {
        cpu_percent: simulatedMetrics.cpuUsage,
        ram_percent: simulatedMetrics.ramUsage,
        gpu_percent: simulatedMetrics.gpuUsage,
        gpu_temp: simulatedMetrics.temperature,
        gpu_mem_used_mb: simulatedMetrics.vramUsed,
        gpu_mem_total_mb: simulatedMetrics.vramTotal
      }
    : currentGpu?.metrics || {};
  
  // Adicionar métricas simuladas ao histórico local
  useEffect(() => {
    if (simulatedMetrics && detectedWorkerId === selectedGpu) {
      const newPoint = {
        timestamp: new Date().toISOString(),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        cpu_percent: simulatedMetrics.cpuUsage,
        ram_percent: simulatedMetrics.ramUsage,
        gpu_percent: simulatedMetrics.gpuUsage,
        gpu_temp: simulatedMetrics.temperature
      };
      
      localHistoryRef.current = [...localHistoryRef.current.slice(-59), newPoint];
      setMetricsHistory(localHistoryRef.current);
    }
  }, [simulatedMetrics, detectedWorkerId, selectedGpu]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Real-Time Monitor</h1>
        {gpus.length > 1 && (
          <select
            value={selectedGpu || ''}
            onChange={(e) => setSelectedGpu(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2"
          >
            {gpus.map(gpu => (
              <option key={gpu.workerId} value={gpu.workerId}>{gpu.specs?.gpu_model || gpu.name}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : gpus.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
          <Server className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Hardware Connected</h3>
          <p className="text-slate-400">Connect a worker to see real-time metrics</p>
        </div>
      ) : (
        <>
          {/* Status */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Server className="w-10 h-10 text-green-400" />
              <div>
                <div className="font-semibold">{currentGpu?.specs?.gpu_model || 'Unknown'}</div>
                <div className="text-sm text-slate-400">{currentGpu?.specs?.gpu_vram_gb || 0}GB VRAM</div>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${currentGpu?.online ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>
              <div className={`w-2 h-2 rounded-full ${currentGpu?.online ? 'bg-green-400 animate-pulse' : 'bg-slate-400'}`} />
              {currentGpu?.online ? 'Online' : 'Offline'}
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3"><Cpu className="w-6 h-6 text-cyan-400" /><span className="text-slate-400">GPU Usage</span></div>
              <div className="text-4xl font-bold text-cyan-400">{metrics.gpu_percent || 0}%</div>
              <div className="mt-3 bg-slate-700 rounded-full h-3"><div className="bg-cyan-400 h-3 rounded-full transition-all" style={{ width: `${metrics.gpu_percent || 0}%` }} /></div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3"><Activity className="w-6 h-6 text-blue-400" /><span className="text-slate-400">CPU Usage</span></div>
              <div className="text-4xl font-bold text-blue-400">{metrics.cpu_percent?.toFixed(1) || 0}%</div>
              <div className="mt-3 bg-slate-700 rounded-full h-3"><div className="bg-blue-400 h-3 rounded-full transition-all" style={{ width: `${metrics.cpu_percent || 0}%` }} /></div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3"><HardDrive className="w-6 h-6 text-purple-400" /><span className="text-slate-400">RAM Usage</span></div>
              <div className="text-4xl font-bold text-purple-400">{metrics.ram_percent?.toFixed(1) || 0}%</div>
              <div className="mt-3 bg-slate-700 rounded-full h-3"><div className="bg-purple-400 h-3 rounded-full transition-all" style={{ width: `${metrics.ram_percent || 0}%` }} /></div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3"><Thermometer className="w-6 h-6 text-orange-400" /><span className="text-slate-400">Temperature</span></div>
              <div className="text-4xl font-bold text-orange-400">{metrics.gpu_temp || 0}°C</div>
              <div className="mt-3 bg-slate-700 rounded-full h-3"><div className={`h-3 rounded-full transition-all ${(metrics.gpu_temp || 0) > 80 ? 'bg-red-400' : 'bg-orange-400'}`} style={{ width: `${Math.min(metrics.gpu_temp || 0, 100)}%` }} /></div>
            </div>
          </div>

          {/* Charts */}
          {metricsHistory.length > 0 && (
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h3 className="font-semibold mb-4">GPU & CPU Usage Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metricsHistory}>
                    <defs>
                      <linearGradient id="gpuGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="gpu_percent" name="GPU" stroke="#22d3ee" fillOpacity={1} fill="url(#gpuGrad)" />
                    <Area type="monotone" dataKey="cpu_percent" name="CPU" stroke="#3b82f6" fillOpacity={1} fill="url(#cpuGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h3 className="font-semibold mb-4">Temperature Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metricsHistory}>
                    <defs>
                      <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="gpu_temp" name="Temp °C" stroke="#f97316" fillOpacity={1} fill="url(#tempGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

