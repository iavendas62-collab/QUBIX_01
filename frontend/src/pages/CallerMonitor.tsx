import { useState, useEffect } from 'react';
import { Cpu, Zap, DollarSign, Clock, TrendingDown, Play, Square, ExternalLink, Copy, Wifi, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';

interface CallerMonitorProps {
  onBack: () => void;
}

// Translations
const texts = {
  en: {
    back: '← Back to Dashboard',
    myInstances: 'My Instances',
    manageInstances: 'Manage your running GPU instances',
    activeInstances: 'Active Instances',
    usageTime: 'Usage Time',
    totalCost: 'Total Cost',
    avgGpuUsage: 'Avg GPU Usage',
    noGpuRented: 'No GPU rented',
    rentGpuToStart: 'Rent a GPU to get started',
    rentGpu: 'Rent GPU',
    timeRemaining: 'Time remaining',
    active: 'Active',
    gpuUsage: 'GPU Usage',
    gpuUtilization: 'GPU Utilization',
    vramMemory: 'VRAM Memory',
    temperature: 'Temperature',
    costAccess: 'Cost & Access',
    duration: 'Duration',
    environment: 'Environment',
    accessUrl: 'Access URL',
    stop: 'Stop',
    connect: 'Connect',
    copied: 'Copied!',
    cancelled: 'Cancelled! Refund:',
    error: 'Error',
    loading: 'Loading...',
    expired: 'Expired',
    remaining: 'remaining'
  },
  pt: {
    back: '← Voltar ao Painel',
    myInstances: 'Minhas Instâncias',
    manageInstances: 'Gerencie suas instâncias GPU em execução',
    activeInstances: 'Instâncias Ativas',
    usageTime: 'Tempo de Uso',
    totalCost: 'Custo Total',
    avgGpuUsage: 'Uso Médio GPU',
    noGpuRented: 'Nenhuma GPU alugada',
    rentGpuToStart: 'Alugue uma GPU para começar',
    rentGpu: 'Alugar GPU',
    timeRemaining: 'Tempo restante',
    active: 'Ativo',
    gpuUsage: 'Uso da GPU',
    gpuUtilization: 'Utilização GPU',
    vramMemory: 'Memória VRAM',
    temperature: 'Temperatura',
    costAccess: 'Custo & Acesso',
    duration: 'Duração',
    environment: 'Ambiente',
    accessUrl: 'URL de Acesso',
    stop: 'Parar',
    connect: 'Conectar',
    copied: 'Copiado!',
    cancelled: 'Cancelado! Reembolso:',
    error: 'Erro',
    loading: 'Carregando...',
    expired: 'Expirado',
    remaining: 'restantes'
  },
  es: {
    back: '← Volver al Panel',
    myInstances: 'Mis Instancias',
    manageInstances: 'Administra tus instancias GPU en ejecución',
    activeInstances: 'Instancias Activas',
    usageTime: 'Tiempo de Uso',
    totalCost: 'Costo Total',
    avgGpuUsage: 'Uso Promedio GPU',
    noGpuRented: 'Ninguna GPU alquilada',
    rentGpuToStart: 'Alquila una GPU para empezar',
    rentGpu: 'Alquilar GPU',
    timeRemaining: 'Tiempo restante',
    active: 'Activo',
    gpuUsage: 'Uso de GPU',
    gpuUtilization: 'Utilización GPU',
    vramMemory: 'Memoria VRAM',
    temperature: 'Temperatura',
    costAccess: 'Costo & Acceso',
    duration: 'Duración',
    environment: 'Ambiente',
    accessUrl: 'URL de Acceso',
    stop: 'Detener',
    connect: 'Conectar',
    copied: '¡Copiado!',
    cancelled: '¡Cancelado! Reembolso:',
    error: 'Error',
    loading: 'Cargando...',
    expired: 'Expirado',
    remaining: 'restantes'
  }
};

interface RentalInstance {
  instanceId: string;
  gpuModel: string;
  duration: string;
  durationHours: number;
  totalCost: number;
  startTime: string;
  endTime: string;
  status: string;
  environment: string;
  accessUrl: string;
  metrics?: { gpu_percent: number; gpu_temp: number; gpu_mem_used_mb: number; gpu_mem_total_mb: number; };
}

function ProgressBar({ value, max = 100, label, color = 'cyan', size = 'md' }: { value: number; max?: number; label: string; color?: string; size?: string; }) {
  const percent = Math.min((value / max) * 100, 100);
  const colors: Record<string, string> = { cyan: 'from-cyan-500 to-blue-500', green: 'from-green-500 to-emerald-500', yellow: 'from-yellow-500 to-orange-500', red: 'from-red-500 to-pink-500', purple: 'from-purple-500 to-pink-500' };
  const heights: Record<string, string> = { sm: 'h-2', md: 'h-3', lg: 'h-4' };
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm"><span className="text-slate-400">{label}</span><span className="text-white font-mono">{value.toFixed(1)}{max === 100 ? '%' : ` / ${max}`}</span></div>
      <div className={`bg-slate-700 rounded-full ${heights[size]} overflow-hidden`}><div className={`bg-gradient-to-r ${colors[color]} ${heights[size]} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} /></div>
    </div>
  );
}

export default function CallerMonitor({ onBack }: CallerMonitorProps) {
  const { language } = useLanguage();
  const t = texts[language];
  
  const [rentals, setRentals] = useState<RentalInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);
  const [activeTime, setActiveTime] = useState(0);

  useEffect(() => {
    const fetchRentals = async () => {
      try {
        const response = await fetch('/api/api/rentals/active');
        const data = await response.json();
        const withMetrics = data.map((r: RentalInstance) => ({ ...r, metrics: { gpu_percent: Math.floor(Math.random() * 60) + 20, gpu_temp: Math.floor(Math.random() * 20) + 50, gpu_mem_used_mb: Math.floor(Math.random() * 8000) + 2000, gpu_mem_total_mb: 24000 } }));
        setRentals(withMetrics);
        setTotalSpent(withMetrics.reduce((a: number, r: RentalInstance) => a + r.totalCost, 0));
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchRentals();
    const interval = setInterval(fetchRentals, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { const i = setInterval(() => setActiveTime(p => p + 1), 1000); return () => clearInterval(i); }, []);

  const formatTime = (s: number) => `${Math.floor(s/3600).toString().padStart(2,'0')}:${Math.floor((s%3600)/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
  const getTimeRemaining = (e: string) => { const r = new Date(e).getTime() - Date.now(); if (r <= 0) return t.expired; return `${Math.floor(r/3600000)}h ${Math.floor((r%3600000)/60000)}m ${t.remaining}`; };
  const handleCancel = async (id: string) => { try { const r = await fetch(`/api/api/rentals/${id}/cancel`, { method: 'POST' }); const d = await r.json(); if (d.success) { toast.success(`${t.cancelled} ${d.refundAmount.toFixed(2)} QUBIC`); setRentals(p => p.filter(x => x.instanceId !== id)); } } catch { toast.error(t.error); } };

  if (loading) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center"><div className="text-center"><div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="text-slate-400">{t.loading}</p></div></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <button onClick={onBack} className="text-slate-400 hover:text-white mb-6">{t.back}</button>
      <div className="mb-8"><h1 className="text-3xl font-bold mb-2">{t.myInstances}</h1><p className="text-slate-400">{t.manageInstances}</p></div>
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4"><div className="flex items-center gap-2 text-slate-400 text-sm mb-2"><Zap className="w-4 h-4" />{t.activeInstances}</div><div className="text-3xl font-bold text-cyan-400">{rentals.length}</div></div>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4"><div className="flex items-center gap-2 text-slate-400 text-sm mb-2"><Clock className="w-4 h-4" />{t.usageTime}</div><div className="text-3xl font-bold text-white font-mono">{formatTime(activeTime)}</div></div>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4"><div className="flex items-center gap-2 text-slate-400 text-sm mb-2"><DollarSign className="w-4 h-4" />{t.totalCost}</div><div className="text-3xl font-bold text-cyan-400">{totalSpent.toFixed(2)}</div><div className="text-xs text-slate-500">QUBIC</div></div>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4"><div className="flex items-center gap-2 text-slate-400 text-sm mb-2"><TrendingDown className="w-4 h-4" />{t.avgGpuUsage}</div><div className="text-3xl font-bold text-green-400">{rentals.length > 0 ? Math.floor(rentals.reduce((a, r) => a + (r.metrics?.gpu_percent || 0), 0) / rentals.length) : 0}%</div></div>
      </div>
      {rentals.length === 0 ? (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-12 text-center"><AlertCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" /><h2 className="text-xl font-bold mb-2">{t.noGpuRented}</h2><p className="text-slate-400 mb-6">{t.rentGpuToStart}</p><button onClick={onBack} className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-xl font-semibold">{t.rentGpu}</button></div>
      ) : (
        <div className="space-y-6">{rentals.map((rental) => (
          <div key={rental.instanceId} className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
              <div className="flex items-center gap-4"><div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center"><Zap className="w-6 h-6 text-cyan-400" /></div><div><div className="font-bold text-lg">{rental.gpuModel}</div><div className="text-sm text-slate-400">ID: {rental.instanceId}</div></div></div>
              <div className="flex items-center gap-4"><div className="text-right"><div className="text-sm text-slate-400">{t.timeRemaining}</div><div className="font-semibold text-yellow-400">{getTimeRemaining(rental.endTime)}</div></div><span className="flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm"><Wifi className="w-4 h-4" />{t.active}</span></div>
            </div>
            <div className="p-6"><div className="grid grid-cols-2 gap-6">
              <div className="space-y-4"><h3 className="font-semibold flex items-center gap-2"><Cpu className="w-5 h-5 text-cyan-400" />{t.gpuUsage}</h3><ProgressBar value={rental.metrics?.gpu_percent || 0} label={t.gpuUtilization} color={rental.metrics?.gpu_percent! > 80 ? 'red' : 'cyan'} size="lg" /><ProgressBar value={rental.metrics?.gpu_mem_used_mb || 0} max={rental.metrics?.gpu_mem_total_mb || 24000} label={t.vramMemory} color="purple" size="md" /><div className="flex items-center gap-4 text-sm"><span className="text-slate-400">{t.temperature}:</span><span className={`font-mono ${rental.metrics?.gpu_temp! > 70 ? 'text-red-400' : 'text-green-400'}`}>{rental.metrics?.gpu_temp}°C</span></div></div>
              <div className="space-y-4"><h3 className="font-semibold flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-400" />{t.costAccess}</h3><div className="bg-slate-800 rounded-xl p-4 space-y-3"><div className="flex justify-between"><span className="text-slate-400">{t.duration}</span><span className="font-semibold">{rental.duration}</span></div><div className="flex justify-between"><span className="text-slate-400">{t.totalCost}</span><span className="font-semibold text-cyan-400">{rental.totalCost} QUBIC</span></div><div className="flex justify-between"><span className="text-slate-400">{t.environment}</span><span className="font-semibold capitalize">{rental.environment}</span></div></div><div className="bg-slate-800 rounded-xl p-3"><div className="text-xs text-slate-400 mb-2">{t.accessUrl}</div><div className="flex items-center gap-2"><code className="flex-1 text-cyan-400 text-sm truncate">{rental.accessUrl}</code><button onClick={() => { navigator.clipboard.writeText(rental.accessUrl); toast.success(t.copied); }} className="p-2 bg-slate-700 hover:bg-slate-600 rounded"><Copy className="w-4 h-4" /></button><a href={rental.accessUrl} target="_blank" className="p-2 bg-cyan-500 hover:bg-cyan-600 rounded"><ExternalLink className="w-4 h-4" /></a></div></div></div>
            </div><div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700"><button onClick={() => handleCancel(rental.instanceId)} className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg flex items-center gap-2"><Square className="w-4 h-4" />{t.stop}</button><a href={rental.accessUrl} target="_blank" className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg flex items-center gap-2"><Play className="w-4 h-4" />{t.connect}</a></div></div>
          </div>
        ))}</div>
      )}
    </div>
  );
}
