/**
 * Consumer Dashboard - Focado no USUÁRIO Consumer
 * - Marketplace (ver GPUs disponíveis para alugar)
 * - Minhas Instâncias (o que estou usando)
 * - Meus Pagamentos (histórico)
 * - Minha Conta
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Cpu, DollarSign, LogOut, Activity, ShoppingCart,
  Play, Square, Clock, Wallet, User, ChevronRight, RefreshCw,
  Server, Star, MapPin, Terminal, ExternalLink, Copy
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import LanguageSelector from '../components/LanguageSelector';
import { useLanguage } from '../i18n/LanguageContext';

const texts = {
  en: {
    myDashboard: 'My Dashboard',
    marketplace: 'GPU Marketplace',
    myInstances: 'My Instances',
    myPayments: 'My Payments',
    myAccount: 'My Account',
    activeInstances: 'Active Instances',
    totalSpent: 'Total Spent',
    hoursUsed: 'Hours Used',
    availableGpus: 'Available GPUs',
    rent: 'Rent Now',
    stop: 'Stop',
    connect: 'Connect',
    noInstances: 'No active instances',
    rentFirst: 'Rent a GPU to get started',
    browseGpus: 'Browse GPUs',
    perHour: '/hour',
    vram: 'VRAM',
    location: 'Location',
    rating: 'Rating',
    switchToProvider: 'Switch to Provider',
    logout: 'Logout',
    filters: 'Filters',
    allGpus: 'All GPUs',
    highEnd: 'High-End',
    midRange: 'Mid-Range',
    budget: 'Budget',
    sortBy: 'Sort by',
    price: 'Price',
    performance: 'Performance'
  },
  pt: {
    myDashboard: 'Meu Painel',
    marketplace: 'Marketplace de GPUs',
    myInstances: 'Minhas Instâncias',
    myPayments: 'Meus Pagamentos',
    myAccount: 'Minha Conta',
    activeInstances: 'Instâncias Ativas',
    totalSpent: 'Total Gasto',
    hoursUsed: 'Horas Usadas',
    availableGpus: 'GPUs Disponíveis',
    rent: 'Alugar Agora',
    stop: 'Parar',
    connect: 'Conectar',
    noInstances: 'Nenhuma instância ativa',
    rentFirst: 'Alugue uma GPU para começar',
    browseGpus: 'Ver GPUs',
    perHour: '/hora',
    vram: 'VRAM',
    location: 'Localização',
    rating: 'Avaliação',
    switchToProvider: 'Mudar para Provedor',
    logout: 'Sair',
    filters: 'Filtros',
    allGpus: 'Todas GPUs',
    highEnd: 'Alto Desempenho',
    midRange: 'Intermediário',
    budget: 'Econômico',
    sortBy: 'Ordenar por',
    price: 'Preço',
    performance: 'Performance'
  },
  es: {
    myDashboard: 'Mi Panel',
    marketplace: 'Marketplace de GPUs',
    myInstances: 'Mis Instancias',
    myPayments: 'Mis Pagos',
    myAccount: 'Mi Cuenta',
    activeInstances: 'Instancias Activas',
    totalSpent: 'Total Gastado',
    hoursUsed: 'Horas Usadas',
    availableGpus: 'GPUs Disponibles',
    rent: 'Alquilar Ahora',
    stop: 'Detener',
    connect: 'Conectar',
    noInstances: 'Sin instancias activas',
    rentFirst: 'Alquila una GPU para empezar',
    browseGpus: 'Ver GPUs',
    perHour: '/hora',
    vram: 'VRAM',
    location: 'Ubicación',
    rating: 'Calificación',
    switchToProvider: 'Cambiar a Proveedor',
    logout: 'Salir',
    filters: 'Filtros',
    allGpus: 'Todas las GPUs',
    highEnd: 'Alto Rendimiento',
    midRange: 'Gama Media',
    budget: 'Económico',
    sortBy: 'Ordenar por',
    price: 'Precio',
    performance: 'Rendimiento'
  }
};


interface AvailableGPU {
  id: string;
  model: string;
  vram: number;
  location: string;
  pricePerHour: number;
  rating: number;
  provider: string;
  tflops: number;
}

interface MyInstance {
  id: string;
  gpuModel: string;
  vram: number;
  status: 'running' | 'stopped';
  startedAt: string;
  costSoFar: number;
  accessUrl: string;
  sshCommand: string;
}

interface PaymentHistory {
  id: string;
  date: string;
  amount: number;
  description: string;
  status: 'completed' | 'pending';
}

export default function ConsumerDashboard() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = texts[language];
  
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'marketplace' | 'instances' | 'payments' | 'account'>('dashboard');
  const [availableGpus, setAvailableGpus] = useState<AvailableGPU[]>([]);
  const [myInstances, setMyInstances] = useState<MyInstance[]>([]);
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Simulated data - replace with real API
      setAvailableGpus([
        { id: '1', model: 'NVIDIA H100', vram: 80, location: 'US-East', pricePerHour: 4.5, rating: 4.9, provider: 'provider_1', tflops: 1979 },
        { id: '2', model: 'NVIDIA A100', vram: 80, location: 'EU-West', pricePerHour: 3.2, rating: 4.8, provider: 'provider_2', tflops: 312 },
        { id: '3', model: 'NVIDIA RTX 4090', vram: 24, location: 'US-West', pricePerHour: 1.5, rating: 4.7, provider: 'provider_3', tflops: 83 },
        { id: '4', model: 'NVIDIA RTX 4080', vram: 16, location: 'Asia-East', pricePerHour: 1.0, rating: 4.6, provider: 'provider_4', tflops: 49 },
        { id: '5', model: 'NVIDIA RTX 3090', vram: 24, location: 'EU-Central', pricePerHour: 0.8, rating: 4.5, provider: 'provider_5', tflops: 36 },
        { id: '6', model: 'NVIDIA A6000', vram: 48, location: 'US-Central', pricePerHour: 2.0, rating: 4.7, provider: 'provider_6', tflops: 38 },
      ]);
      setMyInstances([
        { id: 'inst_1', gpuModel: 'NVIDIA RTX 4090', vram: 24, status: 'running', startedAt: '2024-01-15T10:30:00Z', costSoFar: 12.5, accessUrl: 'https://jupyter.qubix.io/inst_1', sshCommand: 'ssh user@gpu1.qubix.io' },
      ]);
      setPayments([
        { id: 'pay_1', date: '2024-01-15', amount: 25.5, description: 'RTX 4090 - 17 hours', status: 'completed' },
        { id: 'pay_2', date: '2024-01-12', amount: 48.0, description: 'A100 - 15 hours', status: 'completed' },
        { id: 'pay_3', date: '2024-01-10', amount: 12.0, description: 'RTX 3090 - 15 hours', status: 'completed' },
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userProfile');
    navigate('/');
  };

  const switchToProvider = () => {
    localStorage.setItem('userProfile', 'provider');
    navigate('/provider');
  };

  const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);
  const activeInstances = myInstances.filter(i => i.status === 'running').length;


  // Sidebar Component
  const Sidebar = () => (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900 border-r border-slate-700 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="text-2xl font-bold text-cyan-400">QUBIX</div>
        <div className="text-xs text-slate-500 mt-1">Compute Consumer</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <button
          onClick={() => setCurrentPage('dashboard')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            currentPage === 'dashboard' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Activity className="w-5 h-5" />
          {t.myDashboard}
        </button>
        
        <button
          onClick={() => setCurrentPage('marketplace')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            currentPage === 'marketplace' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          {t.marketplace}
        </button>
        
        <button
          onClick={() => setCurrentPage('instances')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            currentPage === 'instances' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Server className="w-5 h-5" />
          {t.myInstances}
          {activeInstances > 0 && (
            <span className="ml-auto bg-cyan-500 text-white text-xs px-2 py-0.5 rounded-full">
              {activeInstances}
            </span>
          )}
        </button>
        
        <button
          onClick={() => setCurrentPage('payments')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            currentPage === 'payments' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-5 h-5" />
          {t.myPayments}
        </button>
        
        <button
          onClick={() => setCurrentPage('account')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            currentPage === 'account' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <User className="w-5 h-5" />
          {t.myAccount}
        </button>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-700 space-y-2">
        <button
          onClick={switchToProvider}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-400 hover:text-green-400 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
          {t.switchToProvider}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-400 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {t.logout}
        </button>
      </div>
    </aside>
  );


  // Dashboard Overview
  const DashboardPage = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.myDashboard}</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Server className="w-8 h-8 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold text-cyan-400">{activeInstances}</div>
          <div className="text-sm text-slate-400">{t.activeInstances}</div>
        </div>
        
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign className="w-8 h-8 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-green-400">{totalSpent.toFixed(1)} QUBIC</div>
          <div className="text-sm text-slate-400">{t.totalSpent}</div>
        </div>
        
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-400">47</div>
          <div className="text-sm text-slate-400">{t.hoursUsed}</div>
        </div>
        
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Cpu className="w-8 h-8 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-purple-400">{availableGpus.length}</div>
          <div className="text-sm text-slate-400">{t.availableGpus}</div>
        </div>
      </div>

      {/* Active Instances Quick View */}
      {myInstances.length > 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="font-semibold">{t.myInstances}</h2>
            <button onClick={() => setCurrentPage('instances')} className="text-sm text-cyan-400 hover:text-cyan-300">
              View All →
            </button>
          </div>
          <div className="divide-y divide-slate-700">
            {myInstances.map(instance => (
              <div key={instance.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                    <Cpu className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="font-medium">{instance.gpuModel}</div>
                    <div className="text-sm text-slate-400">{instance.vram}GB • Running • {instance.costSoFar} QUBIC</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                    <Terminal className="w-4 h-4" />
                    {t.connect}
                  </button>
                  <button className="flex items-center gap-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                    <Square className="w-4 h-4" />
                    {t.stop}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
          <Cpu className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t.noInstances}</h3>
          <p className="text-slate-400 mb-6">{t.rentFirst}</p>
          <button
            onClick={() => setCurrentPage('marketplace')}
            className="bg-cyan-500 hover:bg-cyan-600 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {t.browseGpus}
          </button>
        </div>
      )}

      {/* Quick Access to Marketplace */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">{t.marketplace}</h3>
            <p className="text-slate-400">{availableGpus.length} GPUs available for rent</p>
          </div>
          <button
            onClick={() => setCurrentPage('marketplace')}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {t.browseGpus}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );


  // Marketplace Page - ALL available GPUs (List Layout)
  const MarketplacePage = () => {
    const filteredGpus = filter === 'all' ? availableGpus : 
      filter === 'high' ? availableGpus.filter(g => g.pricePerHour >= 3) :
      filter === 'mid' ? availableGpus.filter(g => g.pricePerHour >= 1 && g.pricePerHour < 3) :
      availableGpus.filter(g => g.pricePerHour < 1);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t.marketplace}</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
              {[
                { key: 'all', label: t.allGpus },
                { key: 'high', label: t.highEnd },
                { key: 'mid', label: t.midRange },
                { key: 'low', label: t.budget },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    filter === f.key ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Header */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-900 border-b border-slate-700 text-sm text-slate-400 font-medium">
            <div className="col-span-3">GPU Model</div>
            <div className="col-span-1 text-center">{t.vram}</div>
            <div className="col-span-2">{t.location}</div>
            <div className="col-span-1 text-center">TFLOPS</div>
            <div className="col-span-1 text-center">{t.rating}</div>
            <div className="col-span-2 text-right">{t.price}</div>
            <div className="col-span-2 text-center">Action</div>
          </div>
          
          {/* GPU Rows */}
          <div className="divide-y divide-slate-700">
            {filteredGpus.map(gpu => (
              <div key={gpu.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-700/50 transition-colors">
                <div className="col-span-3 flex items-center gap-3">
                  <Cpu className="w-8 h-8 text-cyan-400" />
                  <span className="font-medium">{gpu.model}</span>
                </div>
                <div className="col-span-1 text-center text-slate-300">{gpu.vram}GB</div>
                <div className="col-span-2 flex items-center gap-1 text-slate-400 text-sm">
                  <MapPin className="w-3 h-3" />
                  {gpu.location}
                </div>
                <div className="col-span-1 text-center text-slate-300">{gpu.tflops}</div>
                <div className="col-span-1 text-center">
                  <span className="flex items-center justify-center gap-1 text-yellow-400">
                    <Star className="w-4 h-4 fill-current" />
                    {gpu.rating}
                  </span>
                </div>
                <div className="col-span-2 text-right">
                  <span className="text-xl font-bold text-cyan-400">{gpu.pricePerHour}</span>
                  <span className="text-sm text-slate-400 ml-1">QUBIC{t.perHour}</span>
                </div>
                <div className="col-span-2 text-center">
                  <button
                    onClick={() => toast.success(`Renting ${gpu.model}...`)}
                    className="flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors mx-auto"
                  >
                    <Play className="w-4 h-4" />
                    {t.rent}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };


  // My Instances Page
  const InstancesPage = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.myInstances}</h1>
        <button
          onClick={() => setCurrentPage('marketplace')}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Play className="w-5 h-5" />
          {t.rent}
        </button>
      </div>

      {myInstances.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
          <Server className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t.noInstances}</h3>
          <p className="text-slate-400 mb-6">{t.rentFirst}</p>
          <button
            onClick={() => setCurrentPage('marketplace')}
            className="bg-cyan-500 hover:bg-cyan-600 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {t.browseGpus}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {myInstances.map(instance => (
            <div key={instance.id} className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                    <Cpu className="w-7 h-7 text-cyan-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{instance.gpuModel}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        instance.status === 'running' ? 'text-green-400 bg-green-500/20' : 'text-slate-400 bg-slate-500/20'
                      }`}>
                        {instance.status === 'running' ? 'Running' : 'Stopped'}
                      </span>
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      {instance.vram}GB VRAM • Cost so far: {instance.costSoFar} QUBIC
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(instance.sshCommand);
                      toast.success('SSH command copied!');
                    }}
                    className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg text-sm transition-colors"
                  >
                    <Terminal className="w-4 h-4" />
                    SSH
                  </button>
                  <a
                    href={instance.accessUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Jupyter
                  </a>
                  <button className="flex items-center gap-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                    <Square className="w-4 h-4" />
                    {t.stop}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Payments Page
  const PaymentsPage = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.myPayments}</h1>
      
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
        <div className="text-sm text-slate-400 mb-2">{t.totalSpent}</div>
        <div className="text-3xl font-bold text-cyan-400">{totalSpent.toFixed(2)} QUBIC</div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h2 className="font-semibold">Payment History</h2>
        </div>
        <div className="divide-y divide-slate-700">
          {payments.map(payment => (
            <div key={payment.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{payment.description}</div>
                <div className="text-sm text-slate-400">{payment.date}</div>
              </div>
              <div className="text-right">
                <div className="text-cyan-400 font-medium">-{payment.amount} QUBIC</div>
                <div className={`text-xs ${payment.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {payment.status}
                </div>
              </div>
            </div>
          ))}
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
          <div>
            <label className="text-sm text-slate-400">Name</label>
            <div className="text-lg">{user?.name || 'User'}</div>
          </div>
          <div>
            <label className="text-sm text-slate-400">Email</label>
            <div className="text-lg">{user?.email || 'user@example.com'}</div>
          </div>
          <div>
            <label className="text-sm text-slate-400">Qubic Identity</label>
            <div className="flex items-center gap-2">
              <code className="text-sm text-cyan-400 bg-slate-900 px-3 py-2 rounded">
                {user?.qubicIdentity?.slice(0, 30) || 'QUBIC...'}...
              </code>
              <button className="p-2 hover:bg-slate-700 rounded" onClick={() => toast.success('Copied!')}>
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );


  // Main Render
  return (
    <div className="min-h-screen bg-black text-white">
      <Toaster position="top-right" />
      <Sidebar />
      
      {/* Top Bar */}
      <div className="fixed top-0 left-64 right-0 h-16 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-6 z-40">
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <RefreshCw className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSelector />
          <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-lg">
            <Wallet className="w-5 h-5 text-cyan-400" />
            <span className="font-medium">1,250 QUBIC</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="ml-64 pt-16 p-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : (
          <>
            {currentPage === 'dashboard' && <DashboardPage />}
            {currentPage === 'marketplace' && <MarketplacePage />}
            {currentPage === 'instances' && <InstancesPage />}
            {currentPage === 'payments' && <PaymentsPage />}
            {currentPage === 'account' && <AccountPage />}
          </>
        )}
      </main>
    </div>
  );
}

