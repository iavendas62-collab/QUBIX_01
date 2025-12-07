/**
 * Hardware Details - Especificações, status, ganhos da máquina
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Server, ArrowLeft, Activity, Cpu, HardDrive, Thermometer, DollarSign, Pause, Play, Trash2 } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function HardwareDetails() {
  const { machineId } = useParams();
  const navigate = useNavigate();
  const [gpu, setGpu] = useState<any>(null);
  const [metricsHistory, setMetricsHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [machineId]);

  const fetchData = async () => {
    try {
      const [gpuRes, historyRes] = await Promise.all([
        fetch(`/api/api/providers/${machineId}/metrics`),
        fetch(`/api/api/providers/${machineId}/metrics/history?limit=30`)
      ]);
      
      if (gpuRes.ok) setGpu(await gpuRes.json());
      if (historyRes.ok) {
        const data = await historyRes.json();
        setMetricsHistory(data.history.map((m: any) => ({
          ...m,
          time: new Date(m.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        })));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!gpu) return <div className="text-center py-12">Hardware not found</div>;

  const metrics = gpu.metrics || {};

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/app/provider/hardware')} className="flex items-center gap-2 text-slate-400 hover:text-white">
        <ArrowLeft className="w-5 h-5" /> Back to Hardware
      </button>

      {/* Header */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center">
              <Server className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{gpu.specs?.gpu_model || 'Unknown GPU'}</h1>
              <div className="flex items-center gap-4 text-slate-400 mt-1">
                <span>{gpu.specs?.gpu_vram_gb || 0}GB VRAM</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  gpu.online ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                }`}>
                  {gpu.online ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {gpu.online ? (
              <button className="flex items-center gap-2 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 px-4 py-2 rounded-lg">
                <Pause className="w-5 h-5" /> Pause
              </button>
            ) : (
              <button className="flex items-center gap-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 px-4 py-2 rounded-lg">
                <Play className="w-5 h-5" /> Resume
              </button>
            )}
            <button className="flex items-center gap-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 px-4 py-2 rounded-lg">
              <Trash2 className="w-5 h-5" /> Remove
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><Cpu className="w-5 h-5 text-cyan-400" /><span className="text-sm text-slate-400">GPU Usage</span></div>
          <div className="text-2xl font-bold text-cyan-400">{metrics.gpu_percent || 0}%</div>
          <div className="mt-2 bg-slate-700 rounded-full h-2"><div className="bg-cyan-400 h-2 rounded-full" style={{ width: `${metrics.gpu_percent || 0}%` }} /></div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><Activity className="w-5 h-5 text-blue-400" /><span className="text-sm text-slate-400">CPU Usage</span></div>
          <div className="text-2xl font-bold text-blue-400">{metrics.cpu_percent?.toFixed(1) || 0}%</div>
          <div className="mt-2 bg-slate-700 rounded-full h-2"><div className="bg-blue-400 h-2 rounded-full" style={{ width: `${metrics.cpu_percent || 0}%` }} /></div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><HardDrive className="w-5 h-5 text-purple-400" /><span className="text-sm text-slate-400">RAM Usage</span></div>
          <div className="text-2xl font-bold text-purple-400">{metrics.ram_percent?.toFixed(1) || 0}%</div>
          <div className="mt-2 bg-slate-700 rounded-full h-2"><div className="bg-purple-400 h-2 rounded-full" style={{ width: `${metrics.ram_percent || 0}%` }} /></div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><Thermometer className="w-5 h-5 text-orange-400" /><span className="text-sm text-slate-400">Temperature</span></div>
          <div className="text-2xl font-bold text-orange-400">{metrics.gpu_temp || 0}°C</div>
          <div className="mt-2 bg-slate-700 rounded-full h-2"><div className={`h-2 rounded-full ${(metrics.gpu_temp || 0) > 80 ? 'bg-red-400' : 'bg-orange-400'}`} style={{ width: `${Math.min(metrics.gpu_temp || 0, 100)}%` }} /></div>
        </div>
      </div>

      {/* Charts */}
      {metricsHistory.length > 0 && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <h3 className="text-sm font-medium text-slate-400 mb-4">GPU & CPU Usage</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={metricsHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                <Area type="monotone" dataKey="gpu_percent" name="GPU" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.2} />
                <Area type="monotone" dataKey="cpu_percent" name="CPU" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <h3 className="text-sm font-medium text-slate-400 mb-4">Temperature</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={metricsHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                <Line type="monotone" dataKey="gpu_temp" name="Temp" stroke="#f97316" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Specs */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="font-semibold mb-4">Specifications</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-slate-900 rounded-lg p-4"><div className="text-sm text-slate-400">GPU</div><div className="font-semibold">{gpu.specs?.gpu_model || 'N/A'}</div></div>
          <div className="bg-slate-900 rounded-lg p-4"><div className="text-sm text-slate-400">VRAM</div><div className="font-semibold">{gpu.specs?.gpu_vram_gb || 0} GB</div></div>
          <div className="bg-slate-900 rounded-lg p-4"><div className="text-sm text-slate-400">CPU</div><div className="font-semibold">{gpu.specs?.cpu_cores || 0} cores</div></div>
          <div className="bg-slate-900 rounded-lg p-4"><div className="text-sm text-slate-400">RAM</div><div className="font-semibold">{gpu.specs?.ram_total_gb?.toFixed(1) || 0} GB</div></div>
        </div>
      </div>
    </div>
  );
}
