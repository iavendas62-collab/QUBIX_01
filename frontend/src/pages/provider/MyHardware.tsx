/**
 * My Hardware - Lista de máquinas do provider
 * Com auto-detecção de hardware
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, Plus, Pause, Play, Trash2, DollarSign, RefreshCw, Cpu, HardDrive } from 'lucide-react';
import { useHardwareDetection } from '../../hooks/useHardwareDetection';

export default function MyHardware() {
  const navigate = useNavigate();
  const [gpus, setGpus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const {
    status: detectionStatus,
    hardware,
    autoRegisterProvider,
    reset: resetDetection,
    metrics
  } = useHardwareDetection();

  useEffect(() => {
    fetchGpus();
  }, []);

  const fetchGpus = async () => {
    try {
      console.log('📊 Fetching my hardware...');

      // Get qubicAddress from localStorage
      const qubicAddress = localStorage.getItem('qubicAddress') || 'QUBICTESTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

      const url = `/api/providers/my?qubicAddress=${qubicAddress}`;
      console.log('🔍 Fetching from:', url);

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Hardware loaded:', data);
        setGpus(data.providers || data || []);
      } else {
        console.log('⚠️ No hardware found, status:', res.status);
        setGpus([]);
      }
    } catch (e) {
      console.error('❌ Error fetching hardware:', e);
      setGpus([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Auto-detectar e registrar hardware (versão simplificada para teste)
  const handleAutoDetect = async () => {
    console.log('🎯 Auto-detect button clicked!');
    setRefreshing(true);

    try {
      console.log('🔄 Starting auto-register provider...');

      // Simplesmente chamar o hook - ele já tem logs detalhados
      const success = await autoRegisterProvider();

      if (success) {
        console.log('✅ SUCCESS: Hardware registered successfully!');
        await fetchGpus();
      } else {
        console.log('❌ FAILED: autoRegisterProvider returned false');
        throw new Error('Registration failed');
      }

    } catch (error: any) {
      console.error('❌ EXCEPTION in handleAutoDetect:', error);
      alert(`Erro na detecção automática: ${error.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  // Refresh lista
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchGpus();
    setRefreshing(false);
  };

  // Delete hardware
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja remover este hardware?')) return;
    
    try {
      console.log('🗑️ Deleting hardware:', id);
      const res = await fetch(`/api/providers/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        console.log('✅ Hardware deleted');
        setGpus(gpus.filter(g => g.id !== id));
      } else {
        console.error('❌ Delete failed:', await res.text());
      }
    } catch (err) {
      console.error('❌ Error deleting:', err);
    }
  };

  // Toggle online/offline
  const handleToggle = async (id: string, online: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      console.log('🔄 Toggling hardware:', id, 'to', !online);
      await fetch(`/api/providers/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ online: !online })
      });
      await fetchGpus();
    } catch (err) {
      console.error('❌ Error toggling:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Hardware</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleAutoDetect}
            disabled={refreshing || detectionStatus === 'detecting' || detectionStatus === 'registering'}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-lg font-medium disabled:opacity-50"
          >
            <Cpu className="w-5 h-5" /> 
            {detectionStatus === 'detecting' ? 'Detectando...' : 
             detectionStatus === 'registering' ? 'Registrando...' : 
             'Auto-Detectar'}
          </button>
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
              <p className="text-sm text-slate-400 mt-1">{metrics.gpu_model || 'Browser GPU'}</p>
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
              <div className="text-2xl font-bold text-cyan-400">{(metrics.gpu_load || 0).toFixed(1)}%</div>
              <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                  style={{ width: `${metrics.gpu_load || 0}%` }}
                ></div>
              </div>
            </div>

            {/* Temperature */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-2">Temperature</div>
              <div className="text-2xl font-bold text-orange-400">{(metrics.gpu_temp || 0).toFixed(0)}°C</div>
              <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    (metrics.gpu_temp || 0) > 80 ? 'bg-red-500' :
                    (metrics.gpu_temp || 0) > 70 ? 'bg-orange-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(metrics.gpu_temp || 0, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Memory Used */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-2">Memory Used</div>
              <div className="text-2xl font-bold text-purple-400">
                {((metrics.gpu_memory_used || 0) / 1024).toFixed(1)} GB
              </div>
              <div className="text-xs text-slate-500 mt-1">
                of {((metrics.gpu_memory_total || 0) / 1024).toFixed(1)} GB
              </div>
            </div>

            {/* Memory % */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-2">Memory Usage</div>
              <div className="text-2xl font-bold text-pink-400">{metrics.gpu_memory_percent || 0}%</div>
              <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${metrics.gpu_memory_percent || 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-500 text-center">
            Updates every 2 seconds • Browser-based detection
          </div>
        </div>
      )}

      {/* Status da detecção */}
      {(detectionStatus === 'detecting' || detectionStatus === 'registering') && (
        <div className="bg-cyan-500/10 border border-cyan-500/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <div>
              <p className="text-cyan-400 font-medium">
                {detectionStatus === 'detecting' ? 'Detectando hardware...' : 'Registrando GPU...'}
              </p>
              {hardware && (
                <p className="text-sm text-slate-400">
                  GPU: {hardware.gpu?.model || 'Detectando...'} | CPU: {hardware.cpu.cores} cores | RAM: ~{hardware.ram.total}GB
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {detectionStatus === 'success' && (
        <div className="bg-green-500/10 border border-green-500/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-green-400 font-medium">Hardware registrado com sucesso!</p>
              {hardware && (
                <p className="text-sm text-slate-400">
                  GPU: {hardware.gpu?.model || 'Browser GPU'} | CPU: {hardware.cpu.cores} cores | RAM: ~{hardware.ram.total}GB
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {detectionStatus === 'error' && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4">
          <p className="text-red-400">Erro ao detectar hardware. Tente novamente ou adicione manualmente.</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : gpus.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
          <Cpu className="w-16 h-16 text-cyan-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Hardware Registered</h3>
          <p className="text-slate-400 mb-6">Click Auto-Detectar to register your GPU</p>
          <button
            onClick={handleAutoDetect}
            disabled={detectionStatus === 'detecting' || detectionStatus === 'registering'}
            className="bg-cyan-500 hover:bg-cyan-600 px-6 py-3 rounded-lg font-medium disabled:opacity-50"
          >
            {detectionStatus === 'detecting' ? 'Detectando...' : 
             detectionStatus === 'registering' ? 'Registrando...' : 
             'Auto-Detectar GPU'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {gpus.map(gpu => (
            <div
              key={gpu.id}
              className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-green-500/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <Server className="w-7 h-7 text-green-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{gpu.specs?.gpu_model || gpu.name || 'Unknown GPU'}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        gpu.online ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                      }`}>
                        {gpu.online ? 'Online' : 'Offline'}
                      </span>
                      {gpu.isAvailable && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-400">
                          Available
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      {gpu.specs?.gpu_vram_gb || 0}GB VRAM • {gpu.specs?.cpu_cores || 0} CPU cores • {gpu.specs?.ram_total_gb?.toFixed(1) || 0}GB RAM
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Worker ID: {gpu.workerId || gpu.id}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-400">{gpu.pricePerHour} QUBIC</div>
                    <div className="text-sm text-slate-400">/hour</div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-lg font-semibold">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      {gpu.totalEarnings || 0}
                    </div>
                    <div className="text-sm text-slate-400">earned</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {gpu.online ? (
                      <button 
                        onClick={(e) => handleToggle(gpu.id, gpu.online, e)}
                        className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30"
                        title="Pausar"
                      >
                        <Pause className="w-5 h-5" />
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => handleToggle(gpu.id, gpu.online, e)}
                        className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
                        title="Ativar"
                      >
                        <Play className="w-5 h-5" />
                      </button>
                    )}
                    <button 
                      onClick={(e) => handleDelete(gpu.id, e)}
                      className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                      title="Remover"
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
