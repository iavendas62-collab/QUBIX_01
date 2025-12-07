import { useState, useEffect } from 'react';
import { 
  Server, Cpu, HardDrive, Zap, Trash2, Power, PowerOff, 
  DollarSign, Clock, Activity, RefreshCw, Plus, Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';

interface MyHardwareProps {
  onBack: () => void;
  onAddHardware: () => void;
}

interface HardwareItem {
  id: string;
  workerId: string;
  name: string;
  online: boolean;
  specs: {
    gpu_model: string;
    gpu_vram_gb: number;
    cpu_model: string;
    cpu_cores: number;
    ram_total_gb: number;
    hostname: string;
  };
  pricePerHour: number;
  totalEarnings: number;
  totalJobs: number;
  registeredAt: string;
}

const texts = {
  en: {
    title: 'My Hardware',
    subtitle: 'Manage your GPUs and CPUs on the marketplace',
    noHardware: 'No hardware registered',
    noHardwareDesc: 'Add your first GPU/CPU to start earning QUBIC',
    addHardware: 'Add Hardware',
    online: 'Online',
    offline: 'Offline',
    perHour: '/hour',
    totalEarnings: 'Total Earnings',
    jobsCompleted: 'Jobs Completed',
    registered: 'Registered',
    actions: 'Actions',
    pause: 'Pause',
    resume: 'Resume',
    remove: 'Remove',
    confirmRemove: 'Are you sure you want to remove this hardware?',
    removed: 'Hardware removed successfully',
    paused: 'Hardware paused',
    resumed: 'Hardware resumed',
    refresh: 'Refresh'
  },
  pt: {
    title: 'Meu Hardware',
    subtitle: 'Gerencie suas GPUs e CPUs no marketplace',
    noHardware: 'Nenhum hardware registrado',
    noHardwareDesc: 'Adicione sua primeira GPU/CPU para começar a ganhar QUBIC',
    addHardware: 'Adicionar Hardware',
    online: 'Online',
    offline: 'Offline',
    perHour: '/hora',
    totalEarnings: 'Ganhos Totais',
    jobsCompleted: 'Jobs Completados',
    registered: 'Registrado',
    actions: 'Ações',
    pause: 'Pausar',
    resume: 'Retomar',
    remove: 'Remover',
    confirmRemove: 'Tem certeza que deseja remover este hardware?',
    removed: 'Hardware removido com sucesso',
    paused: 'Hardware pausado',
    resumed: 'Hardware retomado',
    refresh: 'Atualizar'
  },
  es: {
    title: 'Mi Hardware',
    subtitle: 'Administra tus GPUs y CPUs en el marketplace',
    noHardware: 'Ningún hardware registrado',
    noHardwareDesc: 'Agrega tu primera GPU/CPU para empezar a ganar QUBIC',
    addHardware: 'Agregar Hardware',
    online: 'Online',
    offline: 'Offline',
    perHour: '/hora',
    totalEarnings: 'Ganancias Totales',
    jobsCompleted: 'Jobs Completados',
    registered: 'Registrado',
    actions: 'Acciones',
    pause: 'Pausar',
    resume: 'Reanudar',
    remove: 'Eliminar',
    confirmRemove: '¿Estás seguro de que deseas eliminar este hardware?',
    removed: 'Hardware eliminado exitosamente',
    paused: 'Hardware pausado',
    resumed: 'Hardware reanudado',
    refresh: 'Actualizar'
  }
};

export default function MyHardware({ onBack, onAddHardware }: MyHardwareProps) {
  const { language } = useLanguage();
  const t = texts[language];
  
  const [hardware, setHardware] = useState<HardwareItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHardware = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/api/providers/realtime');
      const data = await response.json();
      
      // Transform data to our format
      const items: HardwareItem[] = data.map((p: any) => ({
        id: p.id,
        workerId: p.workerId,
        name: p.name,
        online: p.online,
        specs: p.specs || {},
        pricePerHour: p.pricePerHour || 5,
        totalEarnings: Math.random() * 1000, // Demo
        totalJobs: Math.floor(Math.random() * 50), // Demo
        registeredAt: new Date().toISOString()
      }));
      
      setHardware(items);
    } catch (error) {
      console.error('Error fetching hardware:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHardware();
    const interval = setInterval(fetchHardware, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRemove = async (id: string) => {
    if (!confirm(t.confirmRemove)) return;
    
    try {
      await fetch(`/api/api/providers/${id}`, {
        method: 'DELETE'
      });
      setHardware(prev => prev.filter(h => h.id !== id));
      toast.success(t.removed);
    } catch (error) {
      toast.error('Error removing hardware');
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/api/providers/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ online: !currentStatus })
      });
      
      setHardware(prev => prev.map(h => 
        h.id === id ? { ...h, online: !currentStatus } : h
      ));
      
      toast.success(currentStatus ? t.paused : t.resumed);
    } catch (error) {
      toast.error('Error toggling hardware');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <button onClick={onBack} className="text-slate-400 hover:text-white mb-6">
        ← Back to Dashboard
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t.title}</h1>
          <p className="text-slate-400">{t.subtitle}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchHardware}
            className="flex items-center gap-2 px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg"
          >
            <RefreshCw className="w-4 h-4" />
            {t.refresh}
          </button>
          <button
            onClick={onAddHardware}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold"
          >
            <Plus className="w-4 h-4" />
            {t.addHardware}
          </button>
        </div>
      </div>

      {/* Hardware List */}
      {hardware.length === 0 ? (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-12 text-center">
          <Server className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{t.noHardware}</h2>
          <p className="text-slate-400 mb-6">{t.noHardwareDesc}</p>
          <button
            onClick={onAddHardware}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-xl font-semibold"
          >
            {t.addHardware}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {hardware.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden"
            >
              {/* Header */}
              <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    item.online ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    <Zap className={`w-6 h-6 ${item.online ? 'text-green-400' : 'text-red-400'}`} />
                  </div>
                  <div>
                    <div className="font-bold text-lg">{item.specs.gpu_model || 'Unknown GPU'}</div>
                    <div className="text-sm text-slate-400">
                      {item.specs.hostname} • {item.workerId.slice(0, 8)}...
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                    item.online 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {item.online ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                    {item.online ? t.online : t.offline}
                  </span>
                  <div className="text-right">
                    <div className="text-xl font-bold text-cyan-400">{item.pricePerHour} QUBIC</div>
                    <div className="text-xs text-slate-500">{t.perHour}</div>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="p-6">
                <div className="grid grid-cols-4 gap-6 mb-6">
                  {/* Specs */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Cpu className="w-4 h-4" />
                      {item.specs.cpu_cores} cores
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <HardDrive className="w-4 h-4" />
                      {item.specs.ram_total_gb} GB RAM
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Zap className="w-4 h-4" />
                      {item.specs.gpu_vram_gb} GB VRAM
                    </div>
                  </div>

                  {/* Earnings */}
                  <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                    <DollarSign className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-400">
                      {item.totalEarnings.toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-500">{t.totalEarnings}</div>
                  </div>

                  {/* Jobs */}
                  <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                    <Activity className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{item.totalJobs}</div>
                    <div className="text-xs text-slate-500">{t.jobsCompleted}</div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleToggle(item.id, item.online)}
                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm ${
                        item.online
                          ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      }`}
                    >
                      {item.online ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      {item.online ? t.pause : t.resume}
                    </button>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t.remove}
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
