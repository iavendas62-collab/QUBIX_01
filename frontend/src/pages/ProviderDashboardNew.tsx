/**
 * Provider Dashboard - Focado no USUÁRIO Provider
 * - Minhas GPUs (hardware que estou oferecendo)
 * - Meus Ganhos (histórico, sacar)
 * - Minha Conta (perfil, configurações)
 * - Gráficos de métricas REAIS da GPU
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Server, DollarSign, LogOut, TrendingUp, Activity,
  Plus, Pause, Play, Trash2, Clock, Wallet, User,
  ChevronRight, RefreshCw, Copy, Check, Thermometer, Cpu, HardDrive
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import LanguageSelector from '../components/LanguageSelector';
import { useLanguage } from '../i18n/LanguageContext';

const texts = {
  en: {
    myDashboard: 'My Dashboard',
    myHardware: 'My Hardware',
    myEarnings: 'My Earnings',
    myAccount: 'My Account',
    addHardware: 'Add Hardware',
    totalEarnings: 'Total Earnings',
    thisMonth: 'This Month',
    activeGpus: 'Active GPUs',
    totalRentals: 'Total Rentals',
    withdraw: 'Withdraw',
    pause: 'Pause',
    resume: 'Resume',
    remove: 'Remove',
    online: 'Online',
    offline: 'Offline',
    rented: 'Rented',
    available: 'Available',
    noHardware: 'No hardware registered yet',
    addFirst: 'Add your first GPU to start earning',
    installWorker: 'Install Worker',
    earnings24h: 'Last 24h',
    earningsWeek: 'This Week',
    earningsMonth: 'This Month',
    pendingPayout: 'Pending Payout',
    switchToConsumer: 'Switch to Consumer',
    logout: 'Logout',
    copied: 'Copied!',
    pricePerHour: 'Price/Hour',
    gpuUsage: 'GPU Usage',
    cpuUsage: 'CPU Usage',
    ramUsage: 'RAM Usage',
    temperature: 'Temperature',
    realTimeMetrics: 'Real-Time Metrics',
    noMetrics: 'Waiting for metrics...',
    connectWorker: 'Connect your worker to see real-time metrics'
  },
  pt: {
    myDashboard: 'Meu Painel',
    myHardware: 'Meu Hardware',
    myEarnings: 'Meus Ganhos',
    myAccount: 'Minha Conta',
    addHardware: 'Adicionar Hardware',
    totalEarnings: 'Ganhos Totais',
    thisMonth: 'Este Mês',
    activeGpus: 'GPUs Ativas',
    totalRentals: 'Total de Aluguéis',
    withdraw: 'Sacar',
    pause: 'Pausar',
    resume: 'Retomar',
    remove: 'Remover',
    online: 'Online',
    offline: 'Offline',
    rented: 'Alugada',
    available: 'Disponível',
    noHardware: 'Nenhum hardware registrado ainda',
    addFirst: 'Adicione sua primeira GPU para começar a ganhar',
    installWorker: 'Instalar Worker',
    earnings24h: 'Últimas 24h',
    earningsWeek: 'Esta Semana',
    earningsMonth: 'Este Mês',
    pendingPayout: 'Pagamento Pendente',
    switchToConsumer: 'Mudar para Consumidor',
    logout: 'Sair',
    copied: 'Copiado!',
    pricePerHour: 'Preço/Hora',
    gpuUsage: 'Uso da GPU',
    cpuUsage: 'Uso da CPU',
    ramUsage: 'Uso da RAM',
    temperature: 'Temperatura',
    realTimeMetrics: 'Métricas em Tempo Real',
    noMetrics: 'Aguardando métricas...',
    connectWorker: 'Conecte seu worker para ver métricas em tempo real'
  },
  es: {
    myDashboard: 'Mi Panel',
    myHardware: 'Mi Hardware',
    myEarnings: 'Mis Ganancias',
    myAccount: 'Mi Cuenta',
    addHardware: 'Agregar Hardware',
    totalEarnings: 'Ganancias Totales',
    thisMonth: 'Este Mes',
    activeGpus: 'GPUs Activas',
    totalRentals: 'Total de Alquileres',
    withdraw: 'Retirar',
    pause: 'Pausar',
    resume: 'Reanudar',
    remove: 'Eliminar',
    online: 'En línea',
    offline: 'Desconectado',
    rented: 'Alquilada',
    available: 'Disponible',
    noHardware: 'Ningún hardware registrado aún',
    addFirst: 'Agrega tu primera GPU para empezar a ganar',
    installWorker: 'Instalar Worker',
    earnings24h: 'Últimas 24h',
    earningsWeek: 'Esta Semana',
    earningsMonth: 'Este Mes',
    pendingPayout: 'Pago Pendiente',
    switchToConsumer: 'Cambiar a Consumidor',
    logout: 'Salir',
    copied: '¡Copiado!',
    pricePerHour: 'Precio/Hora',
    gpuUsage: 'Uso de GPU',
    cpuUsage: 'Uso de CPU',
    ramUsage: 'Uso de RAM',
    temperature: 'Temperatura',
    realTimeMetrics: 'Métricas en Tiempo Real',
    noMetrics: 'Esperando métricas...',
    connectWorker: 'Conecta tu worker para ver métricas en tiempo real'
  }
};


interface MyGPU {
  id: string;
  workerId: string;
  name: string;
  online: boolean;
  status: 'online' | 'offline' | 'rented' | 'available';
  specs: {
    gpu_model: string;
    gpu_vram_gb: number;
    cpu_model: string;
    cpu_cores: number;
    ram_total_gb: number;
  };
  metrics: {
    cpu_percent: number;
    ram_percent: number;
    gpu_percent: number;
    gpu_temp: number;
    gpu_mem_used_mb: number;
    gpu_mem_total_mb: number;
  } | null;
  pricePerHour: number;
  totalEarnings: number;
  totalJobs: number;
}

interface MetricsHistory {
  timestamp: string;
  cpu_percent: number;
  ram_percent: number;
  gpu_percent: number;
  gpu_temp: number;
}

interface EarningsData {
  total: number;
  thisMonth: number;
  thisWeek: number;
  last24h: number;
  pending: number;
  history: { date: string; amount: number }[];
}

export default function ProviderDashboardNew() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = texts[language];
  
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'hardware' | 'earnings' | 'account' | 'add-hardware'>('dashboard');
  const [myGpus, setMyGpus] = useState<MyGPU[]>([]);
  const [metricsHistory, setMetricsHistory] = useState<MetricsHistory[]>([]);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedGpu, setSelectedGpu] = useState<string | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    fetchData();
    
    // Auto-refresh every 5 seconds for real-time metrics
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedGpu) {
      fetchMetricsHistory(selectedGpu);
    }
  }, [selectedGpu]);

  const fetchData = async () => {
    try {
      // Fetch my providers (real data from backend)
      const response = await fetch('/api/api/providers/my');
      if (response.ok) {
        const data = await response.json();
        setMyGpus(data);
        
        // Auto-select first GPU if none selected
        if (data.length > 0 && !selectedGpu) {
          setSelectedGpu(data[0].workerId);
        }
      }
      
      // Calculate earnings from providers
      const totalEarnings = myGpus.reduce((sum, g) => sum + (g.totalEarnings || 0), 0);
      setEarnings({
        total: totalEarnings,
        thisMonth: Math.floor(totalEarnings * 0.2),
        thisWeek: Math.floor(totalEarnings * 0.05),
        last24h: Math.floor(totalEarnings * 0.01),
        pending: Math.floor(totalEarnings * 0.03),
        history: []
      });
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetricsHistory = async (workerId: string) => {
    try {
      const response = await fetch(`/api/api/providers/${workerId}/metrics/history?limit=30`);
      if (response.ok) {
        const data = await response.json();
        // Format timestamps for display
        const formatted = data.history.map((m: any) => ({
          ...m,
          time: new Date(m.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }));
        setMetricsHistory(formatted);
      }
    } catch (error) {
      console.error('Error fetching metrics history:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userProfile');
    navigate('/');
  };

  const switchToConsumer = () => {
    localStorage.setItem('userProfile', 'consumer');
    navigate('/consumer');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': case 'available': return 'text-green-400 bg-green-500/20';
      case 'rented': return 'text-cyan-400 bg-cyan-500/20';
      case 'offline': return 'text-slate-400 bg-slate-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getStatusText = (gpu: MyGPU) => {
    if (!gpu.online) return t.offline;
    if (gpu.status === 'rented') return t.rented;
    return t.available;
  };

  // Get current GPU metrics
  const currentGpu = myGpus.find(g => g.workerId === selectedGpu);
  const currentMetrics = currentGpu?.metrics;


  // Sidebar Component
  const Sidebar = () => (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900 border-r border-slate-700 flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <div className="text-2xl font-bold text-green-400">QUBIX</div>
        <div className="text-xs text-slate-500 mt-1">Compute Provider</div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <button onClick={() => setCurrentPage('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentPage === 'dashboard' ? 'bg-green-500/20 text-green-400' : 'text-slate-300 hover:bg-slate-800'}`}>
          <Activity className="w-5 h-5" />{t.myDashboard}
        </button>
        <button onClick={() => setCurrentPage('hardware')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentPage === 'hardware' ? 'bg-green-500/20 text-green-400' : 'text-slate-300 hover:bg-slate-800'}`}>
          <Server className="w-5 h-5" />{t.myHardware}
        </button>
        <button onClick={() => setCurrentPage('earnings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentPage === 'earnings' ? 'bg-green-500/20 text-green-400' : 'text-slate-300 hover:bg-slate-800'}`}>
          <DollarSign className="w-5 h-5" />{t.myEarnings}
        </button>
        <button onClick={() => setCurrentPage('account')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentPage === 'account' ? 'bg-green-500/20 text-green-400' : 'text-slate-300 hover:bg-slate-800'}`}>
          <User className="w-5 h-5" />{t.myAccount}
        </button>
        <div className="pt-4 border-t border-slate-700 mt-4">
          <button onClick={() => setCurrentPage('add-hardware')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-colors">
            <Plus className="w-5 h-5" />{t.addHardware}
          </button>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-700 space-y-2">
        <button onClick={switchToConsumer} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors">
          <ChevronRight className="w-4 h-4" />{t.switchToConsumer}
        </button>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-400 hover:text-red-400 transition-colors">
          <LogOut className="w-4 h-4" />{t.logout}
        </button>
      </div>
    </aside>
  );

  // Real-Time Metrics Cards
  const MetricsCards = () => (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <span className="text-sm text-slate-400">{t.gpuUsage}</span>
        </div>
        <div className="text-2xl font-bold text-cyan-400">{currentMetrics?.gpu_percent || 0}%</div>
        <div className="mt-2 bg-slate-700 rounded-full h-2">
          <div className="bg-cyan-400 h-2 rounded-full transition-all" style={{ width: `${currentMetrics?.gpu_percent || 0}%` }} />
        </div>
      </div>
      
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-5 h-5 text-blue-400" />
          <span className="text-sm text-slate-400">{t.cpuUsage}</span>
        </div>
        <div className="text-2xl font-bold text-blue-400">{currentMetrics?.cpu_percent?.toFixed(1) || 0}%</div>
        <div className="mt-2 bg-slate-700 rounded-full h-2">
          <div className="bg-blue-400 h-2 rounded-full transition-all" style={{ width: `${currentMetrics?.cpu_percent || 0}%` }} />
        </div>
      </div>
      
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <HardDrive className="w-5 h-5 text-purple-400" />
          <span className="text-sm text-slate-400">{t.ramUsage}</span>
        </div>
        <div className="text-2xl font-bold text-purple-400">{currentMetrics?.ram_percent?.toFixed(1) || 0}%</div>
        <div className="mt-2 bg-slate-700 rounded-full h-2">
          <div className="bg-purple-400 h-2 rounded-full transition-all" style={{ width: `${currentMetrics?.ram_percent || 0}%` }} />
        </div>
      </div>
      
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Thermometer className="w-5 h-5 text-orange-400" />
          <span className="text-sm text-slate-400">{t.temperature}</span>
        </div>
        <div className="text-2xl font-bold text-orange-400">{currentMetrics?.gpu_temp || 0}°C</div>
        <div className="mt-2 bg-slate-700 rounded-full h-2">
          <div className={`h-2 rounded-full transition-all ${(currentMetrics?.gpu_temp || 0) > 80 ? 'bg-red-400' : 'bg-orange-400'}`} style={{ width: `${Math.min((currentMetrics?.gpu_temp || 0), 100)}%` }} />
        </div>
      </div>
    </div>
  );


  // Real-Time Charts
  const MetricsCharts = () => (
    <div className="grid grid-cols-2 gap-6 mb-6">
      {/* GPU & CPU Usage Chart */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <h3 className="text-sm font-medium text-slate-400 mb-4">GPU & CPU Usage (%)</h3>
        <ResponsiveContainer width="100%" height={200}>
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
            <Area type="monotone" dataKey="gpu_percent" name="GPU" stroke="#22d3ee" fillOpacity={1} fill="url(#colorGpu)" />
            <Area type="monotone" dataKey="cpu_percent" name="CPU" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCpu)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Temperature Chart */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <h3 className="text-sm font-medium text-slate-400 mb-4">GPU Temperature (°C)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={metricsHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
            <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
            <Line type="monotone" dataKey="gpu_temp" name="Temp" stroke="#f97316" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  // Dashboard Overview with Real Metrics
  const DashboardPage = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.myDashboard}</h1>
        {myGpus.length > 1 && (
          <select 
            value={selectedGpu || ''} 
            onChange={(e) => setSelectedGpu(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm"
          >
            {myGpus.map(gpu => (
              <option key={gpu.workerId} value={gpu.workerId}>
                {gpu.specs?.gpu_model || gpu.name}
              </option>
            ))}
          </select>
        )}
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign className="w-8 h-8 text-green-400" />
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-green-400">{earnings?.total || 0} QUBIC</div>
          <div className="text-sm text-slate-400">{t.totalEarnings}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <Clock className="w-8 h-8 text-cyan-400 mb-3" />
          <div className="text-3xl font-bold text-cyan-400">{earnings?.thisMonth || 0} QUBIC</div>
          <div className="text-sm text-slate-400">{t.thisMonth}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <Server className="w-8 h-8 text-blue-400 mb-3" />
          <div className="text-3xl font-bold text-blue-400">{myGpus.filter(g => g.online).length}</div>
          <div className="text-sm text-slate-400">{t.activeGpus}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <Activity className="w-8 h-8 text-purple-400 mb-3" />
          <div className="text-3xl font-bold text-purple-400">{myGpus.filter(g => g.status === 'rented').length}</div>
          <div className="text-sm text-slate-400">{t.totalRentals}</div>
        </div>
      </div>

      {/* Real-Time Metrics Section */}
      {currentGpu ? (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t.realTimeMetrics}: {currentGpu.specs?.gpu_model}</h2>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${currentGpu.online ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>
              <div className={`w-2 h-2 rounded-full ${currentGpu.online ? 'bg-green-400 animate-pulse' : 'bg-slate-400'}`} />
              {currentGpu.online ? t.online : t.offline}
            </div>
          </div>
          <MetricsCards />
          {metricsHistory.length > 0 && <MetricsCharts />}
        </>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
          <Server className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t.noMetrics}</h3>
          <p className="text-slate-400 mb-6">{t.connectWorker}</p>
          <button onClick={() => setCurrentPage('add-hardware')} className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg font-medium transition-colors">
            {t.addHardware}
          </button>
        </div>
      )}

      {/* My GPUs Quick View */}
      {myGpus.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="font-semibold">{t.myHardware}</h2>
            <button onClick={() => setCurrentPage('hardware')} className="text-sm text-green-400 hover:text-green-300">View All →</button>
          </div>
          <div className="divide-y divide-slate-700">
            {myGpus.slice(0, 3).map(gpu => (
              <div key={gpu.id} className="p-4 flex items-center justify-between hover:bg-slate-700/50 cursor-pointer" onClick={() => setSelectedGpu(gpu.workerId)}>
                <div className="flex items-center gap-4">
                  <Server className="w-10 h-10 text-slate-400" />
                  <div>
                    <div className="font-medium">{gpu.specs?.gpu_model || 'Unknown GPU'}</div>
                    <div className="text-sm text-slate-400">{gpu.specs?.gpu_vram_gb || 0}GB VRAM • {gpu.pricePerHour} QUBIC/h</div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(gpu.online ? (gpu.status || 'available') : 'offline')}`}>
                  {getStatusText(gpu)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );


  // My Hardware Page
  const HardwarePage = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.myHardware}</h1>
        <button onClick={() => setCurrentPage('add-hardware')} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg font-medium transition-colors">
          <Plus className="w-5 h-5" />{t.addHardware}
        </button>
      </div>

      {myGpus.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
          <Server className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t.noHardware}</h3>
          <p className="text-slate-400 mb-6">{t.addFirst}</p>
          <button onClick={() => setCurrentPage('add-hardware')} className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg font-medium transition-colors">{t.addHardware}</button>
        </div>
      ) : (
        <div className="space-y-4">
          {myGpus.map(gpu => (
            <div key={gpu.id} className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-700 rounded-xl flex items-center justify-center">
                    <Server className="w-7 h-7 text-green-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{gpu.specs?.gpu_model || 'Unknown GPU'}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(gpu.online ? (gpu.status || 'available') : 'offline')}`}>
                        {getStatusText(gpu)}
                      </span>
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      {gpu.specs?.gpu_vram_gb || 0}GB VRAM • {gpu.specs?.cpu_cores || 0} CPU cores • {gpu.specs?.ram_total_gb?.toFixed(1) || 0}GB RAM
                    </div>
                    {gpu.metrics && (
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <span className="text-cyan-400">GPU: {gpu.metrics.gpu_percent}%</span>
                        <span className="text-blue-400">CPU: {gpu.metrics.cpu_percent?.toFixed(1)}%</span>
                        <span className="text-orange-400">Temp: {gpu.metrics.gpu_temp}°C</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-400">{gpu.pricePerHour} QUBIC</div>
                    <div className="text-sm text-slate-400">{t.pricePerHour}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {gpu.online ? (
                      <button className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors" title={t.pause}><Pause className="w-5 h-5" /></button>
                    ) : (
                      <button className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors" title={t.resume}><Play className="w-5 h-5" /></button>
                    )}
                    <button className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors" title={t.remove}><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Earnings Page
  const EarningsPage = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.myEarnings}</h1>
        <button className="flex items-center gap-2 bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg font-medium transition-colors">
          <Wallet className="w-5 h-5" />{t.withdraw}
        </button>
      </div>
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="text-sm text-slate-400 mb-2">{t.earnings24h}</div>
          <div className="text-2xl font-bold text-green-400">{earnings?.last24h || 0} QUBIC</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="text-sm text-slate-400 mb-2">{t.earningsWeek}</div>
          <div className="text-2xl font-bold text-green-400">{earnings?.thisWeek || 0} QUBIC</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="text-sm text-slate-400 mb-2">{t.earningsMonth}</div>
          <div className="text-2xl font-bold text-green-400">{earnings?.thisMonth || 0} QUBIC</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="text-sm text-slate-400 mb-2">{t.pendingPayout}</div>
          <div className="text-2xl font-bold text-yellow-400">{earnings?.pending || 0} QUBIC</div>
        </div>
      </div>
    </div>
  );

  // Account Page
  const AccountPage = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.myAccount}</h1>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="font-semibold mb-4">Profile</h2>
        <div className="space-y-4">
          <div><label className="text-sm text-slate-400">Name</label><div className="text-lg">{user?.name || 'User'}</div></div>
          <div><label className="text-sm text-slate-400">Email</label><div className="text-lg">{user?.email || 'user@example.com'}</div></div>
          <div>
            <label className="text-sm text-slate-400">Qubic Identity</label>
            <div className="flex items-center gap-2">
              <code className="text-sm text-cyan-400 bg-slate-900 px-3 py-2 rounded">{user?.qubicIdentity?.slice(0, 30) || 'QUBIC...'}...</code>
              <button className="p-2 hover:bg-slate-700 rounded" onClick={() => toast.success(t.copied)}><Copy className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Add Hardware Page
  const AddHardwarePage = () => {
    const [copied, setCopied] = useState(false);
    const [instanceName, setInstanceName] = useState('');
    const [location, setLocation] = useState('');
    const [pricePerHour, setPricePerHour] = useState('5.0');
    
    const locations = [
      { value: 'us-east', label: 'US East (Virginia)' },
      { value: 'us-west', label: 'US West (Oregon)' },
      { value: 'eu-west', label: 'EU West (Ireland)' },
      { value: 'eu-central', label: 'EU Central (Frankfurt)' },
      { value: 'sa-east', label: 'South America (São Paulo)' },
      { value: 'ap-east', label: 'Asia Pacific (Tokyo)' },
      { value: 'ap-south', label: 'Asia Pacific (Singapore)' },
      { value: 'custom', label: 'Custom Location' },
    ];
    
    const installCommand = `python worker/qubix_worker_simple.py --backend /api --price ${pricePerHour}${instanceName ? ` --name "${instanceName}"` : ''}${location ? ` --location "${location}"` : ''}`;
    
    const copyCommand = () => { 
      navigator.clipboard.writeText(installCommand); 
      setCopied(true); 
      toast.success(t.copied); 
      setTimeout(() => setCopied(false), 2000); 
    };

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t.addHardware}</h1>
        
        {/* Configuration Form */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Instance Configuration</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Instance Name (optional)</label>
              <input
                type="text"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                placeholder="My Gaming PC"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Location / Region</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-green-500 focus:outline-none"
              >
                <option value="">Select location...</option>
                {locations.map(loc => (
                  <option key={loc.value} value={loc.label}>{loc.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">{t.pricePerHour} (QUBIC)</label>
              <input
                type="number"
                value={pricePerHour}
                onChange={(e) => setPricePerHour(e.target.value)}
                min="0.1"
                step="0.1"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Estimated Earnings</label>
              <div className="bg-slate-900 border border-slate-600 rounded-lg px-4 py-3">
                <span className="text-green-400 font-bold">{(parseFloat(pricePerHour) * 24 * 30).toFixed(0)} QUBIC</span>
                <span className="text-slate-400 text-sm ml-2">/ month (24/7)</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Install Command */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">{t.installWorker}</h2>
          <p className="text-slate-400 mb-4">Run this command on your machine to connect your GPU and start earning:</p>
          <div className="bg-slate-900 border border-slate-600 rounded-lg p-4">
            <code className="text-green-400 text-sm break-all">{installCommand}</code>
          </div>
          <button onClick={copyCommand} className="mt-4 flex items-center gap-2 bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg font-medium transition-colors">
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copied ? t.copied : 'Copy Command'}
          </button>
        </div>
        
        {/* Requirements */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="font-semibold mb-4">Requirements:</h3>
          <ul className="space-y-2 text-slate-400">
            <li className="flex items-center gap-2"><div className="w-2 h-2 bg-green-400 rounded-full" />Python 3.8+</li>
            <li className="flex items-center gap-2"><div className="w-2 h-2 bg-green-400 rounded-full" />NVIDIA GPU (optional, works with CPU too)</li>
            <li className="flex items-center gap-2"><div className="w-2 h-2 bg-green-400 rounded-full" />pip install psutil requests</li>
          </ul>
        </div>
      </div>
    );
  };

  // Main Render
  return (
    <div className="min-h-screen bg-black text-white">
      <Toaster position="top-right" />
      <Sidebar />
      <div className="fixed top-0 left-64 right-0 h-16 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-6 z-40">
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="p-2 hover:bg-slate-800 rounded-lg transition-colors"><RefreshCw className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSelector />
          <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-lg">
            <Wallet className="w-5 h-5 text-green-400" /><span className="font-medium">{earnings?.total || 0} QUBIC</span>
          </div>
        </div>
      </div>
      <main className="ml-64 pt-16 p-8">
        {loading ? (
          <div className="flex items-center justify-center h-64"><RefreshCw className="w-8 h-8 text-green-400 animate-spin" /></div>
        ) : (
          <>
            {currentPage === 'dashboard' && <DashboardPage />}
            {currentPage === 'hardware' && <HardwarePage />}
            {currentPage === 'earnings' && <EarningsPage />}
            {currentPage === 'account' && <AccountPage />}
            {currentPage === 'add-hardware' && <AddHardwarePage />}
          </>
        )}
      </main>
    </div>
  );
}
