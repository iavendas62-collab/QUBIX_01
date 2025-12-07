import React, { useState, useEffect } from 'react';
import { 
  Cpu, HardDrive, Thermometer, Activity, Zap, DollarSign,
  Clock, TrendingUp, Server, Wifi, WifiOff, Play, Pause
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';

interface ProviderMonitorProps {
  onBack: () => void;
}

// Translations
const texts = {
  en: {
    back: '← Back to Dashboard',
    providerMonitor: 'Provider Monitor',
    online: 'Online',
    offline: 'Offline',
    currentPrice: 'Current price',
    executingJob: 'Executing Job',
    earning: 'Earning',
    cpu: 'CPU',
    gpu: 'GPU',
    cpuUsage: 'CPU Usage',
    gpuUsage: 'GPU Usage',
    cores: 'Cores',
    current: 'Current',
    vram: 'VRAM',
    usage: 'Usage',
    temp: 'Temp',
    ramMemory: 'RAM Memory',
    usedOf: 'used of',
    earnings: 'Earnings',
    today: 'Today',
    total: 'Total',
    jobsCompleted: 'Jobs Completed',
    jobs: 'jobs',
    noHardware: 'No hardware connected',
    runWorker: 'Run the worker to start monitoring',
    connecting: 'Connecting to your hardware...'
  },
  pt: {
    back: '← Voltar ao Painel',
    providerMonitor: 'Monitor do Provedor',
    online: 'Online',
    offline: 'Offline',
    currentPrice: 'Preço atual',
    executingJob: 'Executando Job',
    earning: 'Ganhando',
    cpu: 'CPU',
    gpu: 'GPU',
    cpuUsage: 'Uso da CPU',
    gpuUsage: 'Uso da GPU',
    cores: 'Núcleos',
    current: 'Atual',
    vram: 'VRAM',
    usage: 'Uso',
    temp: 'Temp',
    ramMemory: 'Memória RAM',
    usedOf: 'usado de',
    earnings: 'Ganhos',
    today: 'Hoje',
    total: 'Total',
    jobsCompleted: 'Jobs Completados',
    jobs: 'jobs',
    noHardware: 'Nenhum hardware conectado',
    runWorker: 'Execute o worker para começar a monitorar',
    connecting: 'Conectando ao seu hardware...'
  },
  es: {
    back: '← Volver al Panel',
    providerMonitor: 'Monitor del Proveedor',
    online: 'Online',
    offline: 'Offline',
    currentPrice: 'Precio actual',
    executingJob: 'Ejecutando Job',
    earning: 'Ganando',
    cpu: 'CPU',
    gpu: 'GPU',
    cpuUsage: 'Uso de CPU',
    gpuUsage: 'Uso de GPU',
    cores: 'Núcleos',
    current: 'Actual',
    vram: 'VRAM',
    usage: 'Uso',
    temp: 'Temp',
    ramMemory: 'Memoria RAM',
    usedOf: 'usado de',
    earnings: 'Ganancias',
    today: 'Hoy',
    total: 'Total',
    jobsCompleted: 'Jobs Completados',
    jobs: 'jobs',
    noHardware: 'Ningún hardware conectado',
    runWorker: 'Ejecuta el worker para empezar a monitorear',
    connecting: 'Conectando a tu hardware...'
  }
};

interface Metrics {
  cpu_percent: number;
  ram_percent: number;
  ram_used_gb: number;
  ram_total_gb: number;
  gpu_percent: number;
  gpu_temp: number;
  gpu_mem_used_mb: number;
  gpu_mem_total_mb: number;
  timestamp: string;
}

interface ProviderData {
  workerId: string;
  name: string;
  online: boolean;
  specs: {
    cpu_model: string;
    cpu_cores: number;
    ram_total_gb: number;
    gpu_model: string;
    gpu_vram_gb: number;
    hostname: string;
  };
  metrics: Metrics | null;
  currentJob: string | null;
  pricePerHour: number;
}

// Progress Bar Component
function ProgressBar({ 
  value, 
  max = 100, 
  label, 
  color = 'cyan',
  showValue = true,
  size = 'md'
}: { 
  value: number; 
  max?: number; 
  label: string;
  color?: 'cyan' | 'green' | 'yellow' | 'red' | 'purple';
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const percent = Math.min((value / max) * 100, 100);
  
  const colorClasses = {
    cyan: 'from-cyan-500 to-blue-500',
    green: 'from-green-500 to-emerald-500',
    yellow: 'from-yellow-500 to-orange-500',
    red: 'from-red-500 to-pink-500',
    purple: 'from-purple-500 to-pink-500'
  };
  
  const heightClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        {showValue && (
          <span className="text-white font-mono">
            {value.toFixed(1)}{max === 100 ? '%' : ` / ${max}`}
          </span>
        )}
      </div>
      <div className={`bg-slate-700 rounded-full ${heightClasses[size]} overflow-hidden`}>
        <div 
          className={`bg-gradient-to-r ${colorClasses[color]} ${heightClasses[size]} rounded-full transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  unit,
  trend,
  color = 'cyan'
}: { 
  icon: any; 
  label: string; 
  value: string | number;
  unit?: string;
  trend?: string;
  color?: string;
}) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`w-5 h-5 text-${color}-400`} />
        <span className="text-slate-400 text-sm">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-white">{value}</span>
        {unit && <span className="text-slate-400 text-sm">{unit}</span>}
      </div>
      {trend && (
        <div className="text-green-400 text-xs mt-1 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          {trend}
        </div>
      )}
    </div>
  );
}

export default function ProviderMonitor({ onBack }: ProviderMonitorProps) {
  const { language } = useLanguage();
  const t = texts[language];
  
  const [provider, setProvider] = useState<ProviderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<Metrics[]>([]);
  const [earnings, setEarnings] = useState({ today: 0, total: 0, jobs: 0 });

  // Fetch real-time metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/api/providers/realtime');
        const data = await response.json();
        
        // Find local provider (the one with specs)
        const localProvider = data.find((p: ProviderData) => p.specs?.gpu_model);
        
        if (localProvider) {
          setProvider(localProvider);
          
          // Add to history for charts
          if (localProvider.metrics) {
            setHistory(prev => [...prev.slice(-30), localProvider.metrics]);
          }
          
          // Simulate earnings
          setEarnings(prev => ({
            today: prev.today + (localProvider.currentJob ? 0.01 : 0),
            total: prev.total + (localProvider.currentJob ? 0.01 : 0),
            jobs: prev.jobs + (localProvider.currentJob && Math.random() > 0.95 ? 1 : 0)
          }));
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 2000); // Update every 2 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">{t.connecting}</p>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8">
        <button onClick={onBack} className="text-slate-400 hover:text-white mb-8">
          {t.back}
        </button>
        <div className="text-center py-20">
          <WifiOff className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t.noHardware}</h2>
          <p className="text-slate-400 mb-6">{t.runWorker}</p>
          <code className="bg-slate-800 px-4 py-2 rounded text-cyan-400">
            python qubix_worker_simple.py
          </code>
        </div>
      </div>
    );
  }

  const metrics = provider.metrics || {
    cpu_percent: 0,
    ram_percent: 0,
    ram_used_gb: 0,
    ram_total_gb: provider.specs?.ram_total_gb || 16,
    gpu_percent: 0,
    gpu_temp: 0,
    gpu_mem_used_mb: 0,
    gpu_mem_total_mb: (provider.specs?.gpu_vram_gb || 4) * 1024
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <button onClick={onBack} className="text-slate-400 hover:text-white mb-6 flex items-center gap-2">
        {t.back}
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t.providerMonitor}</h1>
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              provider.online 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              {provider.online ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {provider.online ? t.online : t.offline}
            </span>
            <span className="text-slate-400">{provider.specs?.hostname}</span>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-slate-400">{t.currentPrice}</div>
          <div className="text-2xl font-bold text-cyan-400">
            {provider.pricePerHour} <span className="text-sm">QUBIC/hour</span>
          </div>
        </div>
      </div>

      {/* Current Job Status */}
      {provider.currentJob && (
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <Play className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-cyan-400">{t.executingJob}</div>
              <div className="text-sm text-slate-400">ID: {provider.currentJob}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">{t.earning}</div>
              <div className="text-lg font-bold text-green-400">+{provider.pricePerHour} QUBIC/h</div>
            </div>
          </div>
        </div>
      )}

      {/* Hardware Info */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* CPU Card */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Cpu className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="font-semibold">{t.cpu}</div>
              <div className="text-sm text-slate-400">{provider.specs?.cpu_model?.split(' ').slice(0, 4).join(' ')}</div>
            </div>
          </div>
          
          <ProgressBar 
            value={metrics.cpu_percent} 
            label={t.cpuUsage} 
            color={metrics.cpu_percent > 80 ? 'red' : metrics.cpu_percent > 50 ? 'yellow' : 'cyan'}
            size="lg"
          />
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center p-3 bg-slate-800/50 rounded-lg">
              <div className="text-2xl font-bold text-white">{provider.specs?.cpu_cores}</div>
              <div className="text-xs text-slate-400">{t.cores}</div>
            </div>
            <div className="text-center p-3 bg-slate-800/50 rounded-lg">
              <div className="text-2xl font-bold text-white">{metrics.cpu_percent.toFixed(0)}%</div>
              <div className="text-xs text-slate-400">{t.current}</div>
            </div>
          </div>
        </div>

        {/* GPU Card */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <div className="font-semibold">{t.gpu}</div>
              <div className="text-sm text-slate-400">{provider.specs?.gpu_model}</div>
            </div>
          </div>
          
          <ProgressBar 
            value={metrics.gpu_percent} 
            label={t.gpuUsage} 
            color="green"
            size="lg"
          />
          
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="text-center p-3 bg-slate-800/50 rounded-lg">
              <div className="text-xl font-bold text-white">{provider.specs?.gpu_vram_gb}GB</div>
              <div className="text-xs text-slate-400">{t.vram}</div>
            </div>
            <div className="text-center p-3 bg-slate-800/50 rounded-lg">
              <div className="text-xl font-bold text-white">{metrics.gpu_percent}%</div>
              <div className="text-xs text-slate-400">{t.usage}</div>
            </div>
            <div className="text-center p-3 bg-slate-800/50 rounded-lg">
              <div className="text-xl font-bold text-white">{metrics.gpu_temp}°C</div>
              <div className="text-xs text-slate-400">{t.temp}</div>
            </div>
          </div>
        </div>
      </div>

      {/* RAM & Storage */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <HardDrive className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <div className="font-semibold">{t.ramMemory}</div>
            <div className="text-sm text-slate-400">
              {metrics.ram_used_gb?.toFixed(1) || '0'} GB {t.usedOf} {metrics.ram_total_gb?.toFixed(1) || provider.specs?.ram_total_gb} GB
            </div>
          </div>
        </div>
        
        <ProgressBar 
          value={metrics.ram_percent} 
          label={t.ramMemory} 
          color="purple"
          size="lg"
        />
      </div>

      {/* Earnings Summary */}
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-400" />
          {t.earnings}
        </h3>
        
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-slate-400 mb-1">{t.today}</div>
            <div className="text-3xl font-bold text-green-400">{earnings.today.toFixed(2)}</div>
            <div className="text-sm text-slate-500">QUBIC</div>
          </div>
          <div>
            <div className="text-sm text-slate-400 mb-1">{t.total}</div>
            <div className="text-3xl font-bold text-white">{earnings.total.toFixed(2)}</div>
            <div className="text-sm text-slate-500">QUBIC</div>
          </div>
          <div>
            <div className="text-sm text-slate-400 mb-1">{t.jobsCompleted}</div>
            <div className="text-3xl font-bold text-white">{earnings.jobs}</div>
            <div className="text-sm text-slate-500">{t.jobs}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
