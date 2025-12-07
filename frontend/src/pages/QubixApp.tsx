import React, { useState, useEffect } from 'react';
import { 
  Search, Bell, Settings, ChevronRight, ChevronDown, ExternalLink, 
  RefreshCw, LayoutDashboard, Cpu, HardDrive, DollarSign, 
  BookOpen, MessageCircle, TrendingUp, Activity, Zap, Target,
  Server, MapPin, Star, Circle, Loader2, Copy, Plus, Play
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton, SkeletonCard, SkeletonTable } from '../components/ui/Skeleton';
import { qubicApi } from '../services/qubicApi';
import BecomeProvider from './BecomeProvider';
import UseGPU from './UseGPU';
import ProviderMonitor from './ProviderMonitor';
import CallerMonitor from './CallerMonitor';
import MyHardware from './MyHardware';
import LanguageSelector from '../components/LanguageSelector';
import { useLanguage } from '../i18n/LanguageContext';

// Copy Button Component
function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <button
      onClick={handleCopy}
      className="border border-slate-700 hover:bg-slate-800 px-3 py-1.5 rounded text-sm transition-colors"
    >
      {label}
    </button>
  );
}

// Types
interface WalletState {
  connected: boolean;
  address: string;
  fullAddress: string;
  balance: string;
}

interface GPU {
  id: string;
  model: string;
  vram: number;
  location: string;
  price: number;
  rating: number;
  available: boolean;
  provider: string;
}

interface Instance {
  id: string;
  model: string;
  vram: number;
  status: string;
  uptime: string;
  cost: number;
  gpuUsage: number;
  memoryUsage: number;
  temperature: number;
  environment: string;
  url: string;
}

interface Job {
  id: string;
  userId: string;
  modelType: string;
  status: string;
  computeNeeded: number;
  budget: number;
  createdAt: string;
  provider?: {
    id: string;
    address: string;
  };
}

interface Stats {
  jobs: { total: number; active: number };
  providers: { total: number; active: number };
  models: { total: number };
  network: {
    totalComputors: number;
    availableCompute: number;
    averagePrice: number;
  };
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

// ============================================
// COMPONENTS
// ============================================

function TopNavbar({ wallet, onConnectWallet, onDisconnectWallet, onNavigate }: { 
  wallet: WalletState; 
  onConnectWallet: () => void; 
  onDisconnectWallet: () => void;
  onNavigate: (page: string) => void;
}) {
  const { t } = useLanguage();
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const searchItems = [
    { title: 'GPU Instances', page: 'gpu', keywords: ['gpu', 'rtx', '4090', 'a100', 'h100', 'graphics'] },
    { title: 'CPU Instances', page: 'cpu', keywords: ['cpu', 'processor', 'epyc', 'xeon'] },
    { title: 'My Instances', page: 'my-instances', keywords: ['instances', 'running', 'active'] },
    { title: 'Datasets', page: 'datasets', keywords: ['data', 'dataset', 'storage', 'upload'] },
    { title: 'Models', page: 'models', keywords: ['model', 'ai', 'ml', 'hub'] },
    { title: 'Billing', page: 'billing', keywords: ['billing', 'cost', 'payment', 'invoice'] },
    { title: 'Settings', page: 'settings', keywords: ['settings', 'config', 'preferences'] },
  ];

  const filteredResults = searchQuery.length > 0
    ? searchItems.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.keywords.some(k => k.includes(searchQuery.toLowerCase()))
      )
    : [];

  const handleSearch = (page: string) => {
    onNavigate(page);
    setSearchQuery('');
    setShowSearchResults(false);
    toast.success(`Navigating to ${searchItems.find(i => i.page === page)?.title}`);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-700 z-50">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold text-cyan-400">QUBIX</div>
          <span className="text-slate-400 text-sm">Compute Hub</span>
        </div>

        <div className="flex-1 max-w-2xl mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search services, resources... (Press / to focus)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(e.target.value.length > 0);
              }}
              onFocus={() => searchQuery.length > 0 && setShowSearchResults(true)}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-cyan-500"
            />
            
            {showSearchResults && filteredResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
                {filteredResults.map((result) => (
                  <button
                    key={result.page}
                    onClick={() => handleSearch(result.page)}
                    className="w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors flex items-center gap-3"
                  >
                    <Search className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm">{result.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <LanguageSelector />
          
          <button className="text-slate-400 hover:text-white relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          
          {wallet.connected ? (
            <div className="relative">
              <button
                onClick={() => setShowWalletMenu(!showWalletMenu)}
                className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors"
              >
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <div className="text-left">
                  <div className="text-xs text-slate-400">Balance</div>
                  <div className="text-sm font-semibold">{wallet.balance} QUBIC</div>
                </div>
                <div className="text-sm font-mono">{wallet.address}</div>
              </button>
              
              {showWalletMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
                  <div className="p-4 border-b border-slate-700">
                    <div className="text-xs text-slate-400 mb-1">Wallet Address</div>
                    <div className="font-mono text-sm">{wallet.fullAddress}</div>
                  </div>
                  <div className="p-4 border-b border-slate-700">
                    <div className="text-xs text-slate-400 mb-1">Balance</div>
                    <div className="text-2xl font-bold text-cyan-400">{wallet.balance} QUBIC</div>
                  </div>
                  <button
                    onClick={() => {
                      onDisconnectWallet();
                      setShowWalletMenu(false);
                    }}
                    className="w-full p-3 text-left text-red-400 hover:bg-slate-700 transition-colors"
                  >
                    {t('disconnectWallet')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onConnectWallet}
              className="bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {t('connectWallet')}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

function Sidebar({ currentPage, onNavigate }: { currentPage: string; onNavigate: (page: string) => void }) {
  const { t } = useLanguage();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ compute: true, storage: false });

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const SidebarItem = ({ icon: Icon, label, page, external = false }: { 
    icon: any; 
    label: string; 
    page: string; 
    external?: boolean;
  }) => (
    <button
      onClick={() => onNavigate(page)}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg w-full text-left transition-colors ${
        currentPage === page 
          ? 'bg-slate-800 text-white' 
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm">{label}</span>
      {external && <ExternalLink className="w-3 h-3 ml-auto" />}
    </button>
  );

  const SidebarGroup = ({ icon: Icon, label, groupKey, children }: { 
    icon: any; 
    label: string; 
    groupKey: string; 
    children: React.ReactNode;
  }) => (
    <div className="my-2">
      <button
        onClick={() => toggleGroup(groupKey)}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white w-full transition-colors"
      >
        <Icon className="w-4 h-4" />
        <span className="text-sm">{label}</span>
        {openGroups[groupKey] ? (
          <ChevronDown className="w-4 h-4 ml-auto" />
        ) : (
          <ChevronRight className="w-4 h-4 ml-auto" />
        )}
      </button>
      {openGroups[groupKey] && (
        <div className="ml-6 mt-1 space-y-1">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-slate-900 border-r border-slate-700 overflow-y-auto">
      <nav className="p-4">
        <SidebarItem icon={LayoutDashboard} label={t('dashboard')} page="dashboard" />
        
        <SidebarGroup icon={Cpu} label={t('compute')} groupKey="compute">
          <SidebarItem icon={Server} label={t('gpuInstances')} page="gpu" />
          <SidebarItem icon={Cpu} label={t('cpuInstances')} page="cpu" />
          <SidebarItem icon={Activity} label={t('myInstances')} page="my-instances" />
        </SidebarGroup>

        <SidebarGroup icon={Server} label={t('provider')} groupKey="provider">
          <SidebarItem icon={Activity} label={t('myHardware')} page="provider-monitor" />
          <SidebarItem icon={DollarSign} label={t('earnings')} page="provider-earnings" />
          <SidebarItem icon={Plus} label={t('addHardware')} page="become-provider" />
        </SidebarGroup>

        <SidebarGroup icon={HardDrive} label={t('storage')} groupKey="storage">
          <SidebarItem icon={HardDrive} label={t('datasets')} page="datasets" />
          <SidebarItem icon={Target} label={t('models')} page="models" />
          <SidebarItem icon={Circle} label={t('snapshots')} page="snapshots" />
        </SidebarGroup>

        <SidebarItem icon={DollarSign} label={t('billingUsage')} page="billing" />
        <SidebarItem icon={Settings} label={t('settings')} page="settings" />
        
        <div className="my-4 border-t border-slate-700" />
        
        <SidebarItem icon={BookOpen} label={t('documentation')} page="docs" external />
        <SidebarItem icon={MessageCircle} label={t('support')} page="support" />
      </nav>
    </aside>
  );
}

function Breadcrumb({ items }: { items: string[] }) {
  return (
    <nav className="mb-6 text-sm flex items-center gap-2">
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="text-slate-600">/</span>}
          <span className={i === items.length - 1 ? 'text-white' : 'text-slate-400'}>
            {item}
          </span>
        </React.Fragment>
      ))}
    </nav>
  );
}

function PageHeader({ title, description, actions }: { 
  title: string; 
  description: string; 
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
        <p className="text-slate-400">{description}</p>
      </div>
      {actions && <div className="flex gap-3">{actions}</div>}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subtitle, trend }: { 
  icon: any; 
  label: string; 
  value: string; 
  subtitle?: string; 
  trend?: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-8 h-8 text-cyan-400" />
        {trend && (
          <span className="text-green-400 text-sm font-medium flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            {trend}
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-cyan-400 mb-1">{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
      {subtitle && <div className="text-xs text-slate-500 mt-1">{subtitle}</div>}
    </div>
  );
}

// ============================================
// PAGES
// ============================================

function Dashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<Stats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, jobsRes] = await Promise.all([
          fetch('/api/api/stats'),
          fetch('/api/api/jobs/user/demo_user')
        ]);
        const statsData = await statsRes.json();
        const jobsData = await jobsRes.json();
        setStats(statsData);
        setJobs(jobsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 120000); // Auto-refresh every 2 minutes (optimized)
    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={['Dashboard']} />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton variant="text" className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-400 bg-green-500/20';
      case 'RUNNING': return 'text-cyan-400 bg-cyan-500/20';
      case 'PENDING': return 'text-yellow-400 bg-yellow-500/20';
      case 'FAILED': return 'text-red-400 bg-red-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${minutes}m ago`;
    return `${minutes}m ago`;
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[t('dashboard')]} />
      <PageHeader
        title={t('dashboard')}
        description={t('overview')}
        actions={
          <button className="flex items-center gap-2 border border-slate-700 hover:bg-slate-800 px-4 py-2 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
            {t('refresh')}
          </button>
        }
      />

      {/* Quick Actions - Main CTAs */}
      <div className="grid grid-cols-2 gap-6">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'gpu' }))}
          className="group relative bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-6 text-left hover:border-cyan-400 transition-all overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-10 transition-opacity" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <Play className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-1">{t('rentGpu')}</h3>
              <p className="text-slate-400 text-sm">{t('rentGpuDesc')}</p>
            </div>
            <ChevronRight className="w-6 h-6 text-cyan-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        <button
          onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'become-provider' }))}
          className="group relative bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6 text-left hover:border-green-400 transition-all overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 group-hover:opacity-10 transition-opacity" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.3)]">
              <Plus className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-1">{t('becomeProvider')}</h3>
              <p className="text-slate-400 text-sm">{t('becomeProviderDesc')}</p>
            </div>
            <ChevronRight className="w-6 h-6 text-green-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <StatCard 
          icon={Activity} 
          label={t('totalJobs')} 
          value={stats.jobs.total.toLocaleString()} 
          subtitle={`${stats.jobs.active} ${t('active')}`} 
          trend="+12%" 
        />
        <StatCard 
          icon={Server} 
          label={t('activeProviders')} 
          value={stats.providers.active.toString()} 
          subtitle={`${stats.providers.total} ${t('total')}`} 
          trend="+5%" 
        />
        <StatCard 
          icon={Target} 
          label={t('aiModels')} 
          value={stats.models.total.toString()} 
          subtitle={t('available')} 
          trend="+18%" 
        />
        <StatCard 
          icon={Zap} 
          label={t('networkCompute')} 
          value={`${stats.network.availableCompute.toLocaleString()} TFLOPS`} 
          subtitle={`${stats.network.totalComputors} ${t('computors')}`}
          trend="+23%" 
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Job Activity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={Array.from({ length: 12 }).map((_, i) => ({
              hour: `${i}h`,
              jobs: Math.floor(20 + Math.random() * 80)
            }))}>
              <defs>
                <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="hour" stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155',
                  borderRadius: '8px'
                }}
              />
              <Area type="monotone" dataKey="jobs" stroke="#22d3ee" fillOpacity={1} fill="url(#colorJobs)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Network Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Total Computors</span>
              <span className="text-lg font-semibold">{stats.network.totalComputors}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Available Compute</span>
              <span className="text-lg font-semibold text-cyan-400">{stats.network.availableCompute} TFLOPS</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Average Price</span>
              <span className="text-lg font-semibold">{stats.network.averagePrice} QUBIC/hour</span>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-700">
              <div className="text-xs text-slate-400 mb-2">Network Utilization</div>
              <div className="bg-slate-800 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 h-3 rounded-full"
                  style={{ width: '67%' }}
                />
              </div>
              <div className="text-xs text-slate-500 mt-1">67% utilized</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
        <div className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center justify-between">
          <h3 className="font-semibold">Recent Jobs</h3>
          <button className="text-sm text-cyan-400 hover:text-cyan-300">View All</button>
        </div>
        <div className="divide-y divide-slate-700">
          {jobs.slice(0, 5).map((job) => (
            <div key={job.id} className="px-6 py-4 hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Target className="w-5 h-5 text-cyan-400" />
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{job.modelType}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      Job #{job.id} • Budget: {job.budget} QUBIC • Compute: {job.computeNeeded} units
                      {job.provider && ` • Provider: ${job.provider.address.slice(0, 20)}...`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-400">{getTimeAgo(job.createdAt)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Rental duration options with discounts
const RENTAL_OPTIONS = [
  { id: '1h', label: '1 Hour', hours: 1, discount: 0 },
  { id: '4h', label: '4 Hours', hours: 4, discount: 5 },
  { id: '8h', label: '8 Hours', hours: 8, discount: 10 },
  { id: '24h', label: '1 Day', hours: 24, discount: 15 },
  { id: '72h', label: '3 Days', hours: 72, discount: 20 },
  { id: '168h', label: '1 Week', hours: 168, discount: 30 },
];

function LaunchInstanceWizard({ gpu, onClose, onComplete }: { 
  gpu: GPU; 
  onClose: () => void; 
  onComplete: () => void;
}) {
  const [step, setStep] = useState(1);
  const [selectedDuration, setSelectedDuration] = useState(RENTAL_OPTIONS[0]);
  const [config, setConfig] = useState({
    environment: 'jupyter',
    dataset: null as File | null,
    redundancy: false,
  });

  // Calculate price with discount
  const basePrice = gpu.price * selectedDuration.hours;
  const discountAmount = basePrice * (selectedDuration.discount / 100);
  const finalPrice = basePrice - discountAmount;

  const [rentalInfo, setRentalInfo] = useState<any>(null);

  const handleLaunch = async () => {
    const totalCost = finalPrice * (config.redundancy ? 2 : 1);
    toast.loading(`Processing payment of ${totalCost.toFixed(2)} QUBIC...`, { id: 'launch' });
    setStep(2);
    
    try {
      // Get user info from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Process payment
      const payment = await qubicApi.processPayment({
        userIdentity: user.qubicIdentity || 'DEMO_USER',
        providerIdentity: gpu.provider,
        amount: totalCost,
        gpuId: gpu.id,
        duration: selectedDuration.label,
        durationHours: selectedDuration.hours
      });

      if (!payment.success) {
        throw new Error('Payment failed');
      }

      toast.loading('Payment confirmed! Provisioning GPU...', { id: 'launch' });

      // Create rental
      const rental = await qubicApi.createRental({
        gpuId: gpu.id,
        gpuModel: gpu.model,
        duration: selectedDuration.label,
        durationHours: selectedDuration.hours,
        totalCost,
        environment: config.environment,
        txHash: payment.txHash
      });

      setRentalInfo(rental);
      setStep(3);
      toast.success(`Instance launched for ${selectedDuration.label}!`, { id: 'launch' });
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to launch instance', { id: 'launch' });
      setStep(1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold">Launch GPU Instance</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <p className="text-slate-400">
            {gpu.model} • {gpu.vram}GB VRAM • {gpu.location}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="border-b border-slate-700 p-6">
          <div className="flex items-center justify-between">
            {['Configure', 'Provisioning', 'Ready'].map((label, i) => (
              <div key={i} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step > i + 1 ? 'bg-green-500' : step === i + 1 ? 'bg-cyan-500' : 'bg-slate-700'
                }`}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className="ml-2 text-sm">{label}</span>
                {i < 2 && <div className="w-16 h-0.5 bg-slate-700 mx-4" />}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Environment</label>
                <div className="grid grid-cols-2 gap-3">
                  {['jupyter', 'ssh', 'vscode', 'api'].map(env => (
                    <button
                      key={env}
                      onClick={() => setConfig(prev => ({ ...prev, environment: env }))}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        config.environment === env
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="font-medium capitalize">{env}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {env === 'jupyter' && 'Interactive notebooks'}
                        {env === 'ssh' && 'Direct terminal access'}
                        {env === 'vscode' && 'Remote development'}
                        {env === 'api' && 'REST API endpoint'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Dataset (Optional)</label>
                <input
                  type="file"
                  onChange={(e) => setConfig(prev => ({ ...prev, dataset: e.target.files?.[0] || null }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">Upload training data or select from storage</p>
              </div>

              {/* Duration Selection */}
              <div>
                <label className="block text-sm font-medium mb-3">Rental Duration</label>
                <div className="grid grid-cols-3 gap-3">
                  {RENTAL_OPTIONS.map(option => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedDuration(option)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedDuration.id === option.id
                          ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="font-bold text-lg">{option.label}</div>
                      <div className="text-cyan-400 font-semibold mt-1">
                        {(gpu.price * option.hours * (1 - option.discount/100)).toFixed(1)} QUBIC
                      </div>
                      {option.discount > 0 && (
                        <div className="text-xs text-green-400 mt-1">
                          🎉 {option.discount}% OFF
                        </div>
                      )}
                      <div className="text-xs text-slate-500 mt-1">
                        {(gpu.price * (1 - option.discount/100)).toFixed(2)} QUBIC/hour
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.redundancy}
                    onChange={(e) => setConfig(prev => ({ ...prev, redundancy: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="font-medium">Enable Redundancy</div>
                    <div className="text-xs text-slate-400">Run on 2 GPUs for fault tolerance (2x cost)</div>
                  </div>
                </label>
              </div>

              {/* Price Summary */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-800/50 rounded-lg p-5 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-400">Duration</span>
                  <span className="font-semibold">{selectedDuration.label}</span>
                </div>
                
                {selectedDuration.discount > 0 && (
                  <div className="flex items-center justify-between mb-3 text-sm">
                    <span className="text-slate-400">Original Price</span>
                    <span className="text-slate-500 line-through">{basePrice.toFixed(2)} QUBIC</span>
                  </div>
                )}
                
                {selectedDuration.discount > 0 && (
                  <div className="flex items-center justify-between mb-3 text-sm">
                    <span className="text-green-400">Discount ({selectedDuration.discount}%)</span>
                    <span className="text-green-400">-{discountAmount.toFixed(2)} QUBIC</span>
                  </div>
                )}
                
                {config.redundancy && (
                  <div className="flex items-center justify-between mb-3 text-sm">
                    <span className="text-slate-400">Redundancy (2x)</span>
                    <span className="text-slate-300">+{finalPrice.toFixed(2)} QUBIC</span>
                  </div>
                )}
                
                <div className="border-t border-slate-700 pt-3 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-cyan-400">
                        {(finalPrice * (config.redundancy ? 2 : 1)).toFixed(2)}
                      </span>
                      <span className="text-cyan-400 ml-1">QUBIC</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 text-right mt-1">
                    ≈ ${((finalPrice * (config.redundancy ? 2 : 1)) * 0.001).toFixed(4)} USD
                  </div>
                </div>
              </div>

              {/* Launch Button */}
              <button
                onClick={handleLaunch}
                className="relative w-full py-4 bg-cyan-500 text-white font-bold rounded-lg overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 shadow-[0_0_20px_rgba(6,182,212,0.5)] group-hover:shadow-[0_0_30px_rgba(6,182,212,0.8)] transition-all duration-300"></div>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Zap className="w-5 h-5" />
                  LAUNCH INSTANCE
                </span>
              </button>
              
              <p className="text-xs text-slate-500 text-center">
                Payment will be processed in QUBIC. You can cancel anytime.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="text-center py-12">
              <Loader2 className="w-16 h-16 text-cyan-400 animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Provisioning Instance...</h3>
              <p className="text-slate-400">Setting up your GPU environment</p>
              <div className="mt-6 space-y-2 text-sm text-slate-500">
                <div>✓ Allocating GPU resources</div>
                <div>✓ Installing environment</div>
                <div className="text-cyan-400">⟳ Configuring network...</div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center py-6">
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(34,197,94,0.5)]">
                  <span className="text-4xl">✓</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">Instance Ready!</h3>
                <p className="text-slate-400">Your {gpu.model} is now running</p>
              </div>

              {/* Rental Summary */}
              <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-slate-400">Duration</div>
                    <div className="font-semibold text-cyan-400">{rentalInfo?.duration || selectedDuration.label}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Total Paid</div>
                    <div className="font-semibold text-cyan-400">{rentalInfo?.totalCost?.toFixed(2) || (finalPrice * (config.redundancy ? 2 : 1)).toFixed(2)} QUBIC</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Expires</div>
                    <div className="font-semibold">{rentalInfo?.endTime ? new Date(rentalInfo.endTime).toLocaleString() : 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Environment</div>
                    <div className="font-semibold capitalize">{rentalInfo?.environment || config.environment}</div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 space-y-3">
                <div>
                  <div className="text-xs text-slate-400 mb-1">Instance ID</div>
                  <div className="font-mono text-sm text-cyan-400">{rentalInfo?.instanceId || 'N/A'}</div>
                </div>
                
                {rentalInfo?.accessUrl && (
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Access URL</div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-slate-900 px-3 py-2 rounded text-sm text-cyan-400 overflow-x-auto">
                        {rentalInfo.accessUrl}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(rentalInfo.accessUrl);
                          toast.success('URL copied!');
                        }}
                        className="p-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                
                {config.environment === 'jupyter' && (
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Jupyter URL</div>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value="https://jupyter.qubix.network/abc123"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm font-mono"
                      />
                      <button className="bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded text-sm">
                        Open
                      </button>
                    </div>
                  </div>
                )}

                {config.environment === 'ssh' && (
                  <div>
                    <div className="text-xs text-slate-400 mb-1">SSH Connection</div>
                    <div className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm font-mono">
                      ssh user@gpu-abc123.qubix.network
                    </div>
                  </div>
                )}

                {config.environment === 'vscode' && (
                  <div>
                    <div className="text-xs text-slate-400 mb-1">VSCode Remote</div>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value="vscode-remote://gpu-abc123.qubix.network"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm font-mono"
                      />
                      <button className="bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded text-sm">
                        Connect
                      </button>
                    </div>
                  </div>
                )}

                {config.environment === 'api' && (
                  <div>
                    <div className="text-xs text-slate-400 mb-1">API Endpoint</div>
                    <div className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm font-mono">
                      https://api.qubix.network/v1/instances/abc123
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-xs text-slate-400 mb-1">API Token</div>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      type="password"
                      value="qbx_1234567890abcdef"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm font-mono"
                    />
                    <button className="border border-slate-700 hover:bg-slate-800 px-4 py-2 rounded text-sm">
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => { onComplete(); onClose(); }}
                className="w-full bg-cyan-500 hover:bg-cyan-600 py-3 rounded-lg font-medium transition-colors"
              >
                Go to My Instances
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GPUInstancesPage() {
  const { t } = useLanguage();
  const [gpus, setGpus] = useState<GPU[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    priceRange: 'any',
    model: 'all',
    location: 'any',
    status: 'all'
  });
  const [sortBy, setSortBy] = useState('price');
  const [launchingGpu, setLaunchingGpu] = useState<GPU | null>(null);

  const fetchGPUs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.priceRange !== 'any') params.append('priceRange', filters.priceRange);
      if (filters.model !== 'all') params.append('model', filters.model);
      if (filters.location !== 'any') params.append('location', filters.location);
      if (filters.status === 'available') params.append('status', 'available');
      
      const response = await fetch(`/api/api/gpus?${params}`);
      const data = await response.json();
      
      // Sort GPUs
      const sorted = [...data].sort((a, b) => {
        if (sortBy === 'price') return a.price - b.price;
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'vram') return b.vram - a.vram;
        return 0;
      });
      
      setGpus(sorted);
      if (sorted.length === 0) {
        toast('No GPUs match your filters', { icon: 'ℹ️' });
      }
    } catch (error) {
      console.error('Error fetching GPUs:', error);
      toast.error('Failed to load GPUs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce: wait 300ms before fetching (prevents excessive requests)
    const timeoutId = setTimeout(() => {
      fetchGPUs();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [filters, sortBy]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[t('compute'), t('gpuInstances')]} />
      <PageHeader
        title={t('gpuInstances')}
        description="Browse and launch GPU compute instances for AI training"
        actions={
          <>
            <button 
              onClick={fetchGPUs}
              className="flex items-center gap-2 border border-slate-700 hover:bg-slate-800 px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {t('refresh')}
            </button>
          </>
        }
      />

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Filters</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Sort by:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm"
            >
              <option value="price">Price (Low to High)</option>
              <option value="rating">Rating (High to Low)</option>
              <option value="vram">VRAM (High to Low)</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Price per hour</label>
            <select 
              value={filters.priceRange}
              onChange={(e) => handleFilterChange('priceRange', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
            >
              <option value="any">Any price</option>
              <option value="0-10">0-10 QUBIC</option>
              <option value="10-20">10-20 QUBIC</option>
              <option value="20-50">20-50 QUBIC</option>
              <option value="50">50+ QUBIC</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">GPU Model</label>
            <select 
              value={filters.model}
              onChange={(e) => handleFilterChange('model', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
            >
              <option value="all">All models</option>
              <option value="RTX 4090">RTX 4090</option>
              <option value="RTX 3090">RTX 3090</option>
              <option value="RTX 3080">RTX 3080</option>
              <option value="RTX 4080">RTX 4080</option>
              <option value="A100">A100</option>
              <option value="H100">H100</option>
              <option value="A10">A10</option>
              <option value="V100">V100</option>
              <option value="NVIDIA GeForce MX150">MX150 (Local)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Location</label>
            <select 
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
            >
              <option value="any">Any location</option>
              <option value="Brazil">Brazil</option>
              <option value="US">United States</option>
              <option value="UK">United Kingdom</option>
              <option value="Germany">Germany</option>
              <option value="Japan">Japan</option>
              <option value="Singapore">Singapore</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Status</label>
            <select 
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="available">Available only</option>
            </select>
          </div>
        </div>
      </div>

      {/* GPU Table */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
        <div className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center justify-between">
          <h3 className="font-semibold">Available GPU Instances</h3>
          <span className="text-sm text-slate-400">
            {loading ? 'Loading...' : `${gpus.length} instances found`}
          </span>
        </div>
        {loading ? (
          <div className="p-6">
            <SkeletonTable />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
            <thead className="bg-slate-800/50 border-b border-slate-700">
              <tr className="text-left text-sm text-slate-400">
                <th className="px-6 py-3 font-medium">GPU Model</th>
                <th className="px-6 py-3 font-medium">VRAM</th>
                <th className="px-6 py-3 font-medium">Location</th>
                <th className="px-6 py-3 font-medium">Price/hour</th>
                <th className="px-6 py-3 font-medium">Rating</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {gpus.map((gpu, i) => (
                <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-cyan-400" />
                      <span className="font-medium">{gpu.model}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{gpu.vram}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-300">
                      <MapPin className="w-3 h-3" />
                      {gpu.location}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-cyan-400 font-semibold">{gpu.price} QUBIC</span>
                    <span className="text-slate-500 text-sm">/hour</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-yellow-400">{gpu.rating}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {gpu.available ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-medium">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        Available
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-orange-500/20 text-orange-400 text-xs font-medium">
                        <span className="w-2 h-2 bg-orange-400 rounded-full" />
                        In Use
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {gpu.available ? (
                      <button 
                        onClick={() => setLaunchingGpu(gpu)}
                        className="bg-cyan-500 hover:bg-cyan-600 px-4 py-1.5 rounded text-sm font-medium transition-colors"
                      >
                        Launch
                      </button>
                    ) : (
                      <button className="bg-slate-700 text-slate-500 px-4 py-1.5 rounded text-sm cursor-not-allowed">
                        Unavailable
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Launch Instance Wizard */}
      {launchingGpu && (
        <LaunchInstanceWizard
          gpu={launchingGpu}
          onClose={() => setLaunchingGpu(null)}
          onComplete={() => {
            // Navigate to my instances
            window.location.hash = 'my-instances';
          }}
        />
      )}
    </div>
  );
}

function MyInstancesPage() {
  const [instances, setInstances] = useState<Instance[]>([
    { 
      id: 'gpu-abc123', 
      model: 'RTX 4090', 
      vram: 24,
      status: 'running', 
      uptime: '2h 15m', 
      cost: 22.5,
      gpuUsage: 87,
      memoryUsage: 18.5,
      temperature: 72,
      environment: 'jupyter',
      url: 'https://jupyter.qubix.network/abc123'
    },
    { 
      id: 'gpu-def456', 
      model: 'A100', 
      vram: 80,
      status: 'running', 
      uptime: '0h 45m', 
      cost: 37.5,
      gpuUsage: 45,
      memoryUsage: 32.0,
      temperature: 65,
      environment: 'ssh',
      url: 'ssh user@gpu-def456.qubix.network'
    },
  ]);
  const [expandedInstance, setExpandedInstance] = useState<string | null>(null);
  const [logs] = useState([
    '[2024-01-15 10:23:45] Instance started',
    '[2024-01-15 10:23:50] Environment initialized',
    '[2024-01-15 10:24:00] Training job started',
    '[2024-01-15 10:24:15] Epoch 1/100 - Loss: 0.523',
    '[2024-01-15 10:24:30] Epoch 2/100 - Loss: 0.487',
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setInstances(prev => prev.map(inst => ({
        ...inst,
        gpuUsage: Math.max(20, Math.min(100, inst.gpuUsage + (Math.random() - 0.5) * 10)),
        temperature: Math.max(50, Math.min(85, inst.temperature + (Math.random() - 0.5) * 3)),
      })));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleConnect = (instance: Instance) => {
    if (instance.environment === 'jupyter') {
      window.open(instance.url, '_blank');
      toast.success('Opening Jupyter in new tab');
    } else {
      navigator.clipboard.writeText(instance.url);
      toast.success('Connection command copied to clipboard!');
    }
  };

  const handleStop = (instanceId: string) => {
    if (confirm('Are you sure you want to stop this instance? All unsaved data will be lost.')) {
      toast.loading('Stopping instance...', { id: 'stop' });
      setTimeout(() => {
        setInstances(prev => prev.filter(inst => inst.id !== instanceId));
        toast.success('Instance stopped', { id: 'stop' });
      }, 1000);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={['Compute', 'My Instances']} />
      <PageHeader
        title="My Instances"
        description="Manage your running GPU instances"
        actions={
          <button className="flex items-center gap-2 border border-slate-700 hover:bg-slate-800 px-4 py-2 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-cyan-400">{instances.length}</div>
              <div className="text-sm text-slate-400">Active Instances</div>
            </div>
            <Activity className="w-8 h-8 text-cyan-400" />
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-cyan-400">
                {instances.reduce((sum, inst) => sum + inst.cost, 0).toFixed(2)} QUBIC
              </div>
              <div className="text-sm text-slate-400">Total Cost</div>
            </div>
            <DollarSign className="w-8 h-8 text-cyan-400" />
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-cyan-400">
                {Math.round(instances.reduce((sum, inst) => sum + inst.gpuUsage, 0) / instances.length)}%
              </div>
              <div className="text-sm text-slate-400">Avg GPU Usage</div>
            </div>
            <Zap className="w-8 h-8 text-cyan-400" />
          </div>
        </div>
      </div>

      {/* Instances List */}
      <div className="space-y-4">
        {instances.map((instance) => (
          <div key={instance.id} className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
            {/* Instance Header */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Server className="w-8 h-8 text-cyan-400" />
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-mono font-semibold">{instance.id}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-medium">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        {instance.status}
                      </span>
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      {instance.model} • {instance.vram}GB VRAM • Uptime: {instance.uptime}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setExpandedInstance(expandedInstance === instance.id ? null : instance.id)}
                    className="border border-slate-700 hover:bg-slate-800 px-4 py-2 rounded text-sm transition-colors"
                  >
                    {expandedInstance === instance.id ? 'Hide Details' : 'Show Details'}
                  </button>
                  <button 
                    onClick={() => handleConnect(instance)}
                    className="bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded text-sm font-medium transition-colors"
                  >
                    Connect
                  </button>
                  <button 
                    onClick={() => handleStop(instance.id)}
                    className="border border-red-500/20 text-red-400 hover:bg-red-500/10 px-4 py-2 rounded text-sm transition-colors"
                  >
                    Stop
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">GPU Usage</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-cyan-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${instance.gpuUsage}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold">{Math.round(instance.gpuUsage)}%</span>
                  </div>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Memory</div>
                  <div className="text-sm font-semibold">{instance.memoryUsage.toFixed(1)} / {instance.vram} GB</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Temperature</div>
                  <div className="text-sm font-semibold">{Math.round(instance.temperature)}°C</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Cost</div>
                  <div className="text-sm font-semibold text-cyan-400">{instance.cost.toFixed(2)} QUBIC</div>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedInstance === instance.id && (
              <div className="border-t border-slate-700 p-6 bg-slate-800/50">
                <div className="grid grid-cols-2 gap-6">
                  {/* Monitoring Graphs */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">GPU Usage (Last 5 min)</h4>
                    <div className="bg-slate-900 rounded-lg p-4 h-48 flex items-end gap-1">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div 
                          key={i}
                          className="flex-1 bg-cyan-400 rounded-t transition-all duration-300"
                          style={{ 
                            height: `${Math.random() * 80 + 20}%`,
                            opacity: 0.3 + (i / 20) * 0.7
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Logs */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Recent Logs</h4>
                    <div className="bg-slate-900 rounded-lg p-4 h-48 overflow-y-auto font-mono text-xs space-y-1">
                      {logs.map((log, i) => (
                        <div key={i} className="text-slate-400">{log}</div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Connection Details */}
                <div className="mt-6 bg-slate-900 rounded-lg p-4">
                  <h4 className="text-sm font-semibold mb-3">Connection Details</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-24">Environment:</span>
                      <span className="text-sm font-mono capitalize">{instance.environment}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-24">URL:</span>
                      <input
                        readOnly
                        value={instance.url}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm font-mono"
                      />
                      <CopyButton text={instance.url} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {instances.length === 0 && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-12 text-center">
          <Server className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Active Instances</h3>
          <p className="text-slate-400 mb-6">Launch a GPU instance to get started</p>
          <button className="bg-cyan-500 hover:bg-cyan-600 px-6 py-3 rounded-lg font-medium transition-colors">
            Browse GPU Marketplace
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// ADDITIONAL PAGES
// ============================================

function CPUInstancesPage() {
  const [cpus] = useState([
    { id: '1', model: 'AMD EPYC 7763', cores: 64, ram: 256, location: 'Virginia, US', price: 3, rating: 4.8, available: true },
    { id: '2', model: 'Intel Xeon Platinum 8380', cores: 40, ram: 512, location: 'Frankfurt, Germany', price: 4, rating: 4.9, available: true },
    { id: '3', model: 'AMD EPYC 7713', cores: 64, ram: 128, location: 'Tokyo, Japan', price: 2.5, rating: 4.7, available: false },
    { id: '4', model: 'Intel Xeon Gold 6348', cores: 28, ram: 256, location: 'São Paulo, Brazil', price: 2, rating: 4.6, available: true },
  ]);

  return (
    <div className="space-y-6">
      <Breadcrumb items={['Compute', 'CPU Instances']} />
      <PageHeader
        title="CPU Instances"
        description="High-performance CPU compute for general workloads"
        actions={
          <button className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 px-6 py-2 rounded-lg transition-colors">
            <Server className="w-4 h-4" />
            Launch CPU Instance
          </button>
        }
      />

      <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
        <div className="bg-slate-800 border-b border-slate-700 px-6 py-3">
          <h3 className="font-semibold">Available CPU Instances</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50 border-b border-slate-700">
              <tr className="text-left text-sm text-slate-400">
                <th className="px-6 py-3 font-medium">CPU Model</th>
                <th className="px-6 py-3 font-medium">Cores</th>
                <th className="px-6 py-3 font-medium">RAM</th>
                <th className="px-6 py-3 font-medium">Location</th>
                <th className="px-6 py-3 font-medium">Price/hour</th>
                <th className="px-6 py-3 font-medium">Rating</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {cpus.map((cpu) => (
                <tr key={cpu.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-cyan-400" />
                      <span className="font-medium">{cpu.model}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{cpu.cores}</td>
                  <td className="px-6 py-4 text-slate-300">{cpu.ram}GB</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-300">
                      <MapPin className="w-3 h-3" />
                      {cpu.location}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-cyan-400 font-semibold">{cpu.price} QUBIC</span>
                    <span className="text-slate-500 text-sm">/hour</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-yellow-400">{cpu.rating}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {cpu.available ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-medium">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        Available
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-orange-500/20 text-orange-400 text-xs font-medium">
                        <span className="w-2 h-2 bg-orange-400 rounded-full" />
                        In Use
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {cpu.available ? (
                      <button className="bg-cyan-500 hover:bg-cyan-600 px-4 py-1.5 rounded text-sm font-medium transition-colors">
                        Launch
                      </button>
                    ) : (
                      <button className="bg-slate-700 text-slate-500 px-4 py-1.5 rounded text-sm cursor-not-allowed">
                        Unavailable
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DatasetsPage() {
  const [datasets] = useState([
    { id: '1', name: 'ImageNet-1K', size: '150 GB', type: 'Images', files: 1281167, uploaded: '2024-01-10', public: true },
    { id: '2', name: 'Common Crawl', size: '2.5 TB', type: 'Text', files: 1, uploaded: '2024-01-08', public: true },
    { id: '3', name: 'My Training Data', size: '45 GB', type: 'Mixed', files: 50000, uploaded: '2024-01-15', public: false },
  ]);

  return (
    <div className="space-y-6">
      <Breadcrumb items={['Storage', 'Datasets']} />
      <PageHeader
        title="Datasets"
        description="Manage your training datasets and access public datasets"
        actions={
          <button className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 px-6 py-2 rounded-lg transition-colors">
            <HardDrive className="w-4 h-4" />
            Upload Dataset
          </button>
        }
      />

      <div className="grid grid-cols-3 gap-6">
        {datasets.map((dataset) => (
          <div key={dataset.id} className="bg-slate-900 border border-slate-700 rounded-lg p-6 hover:border-cyan-500/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <HardDrive className="w-8 h-8 text-cyan-400" />
              {dataset.public ? (
                <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs">Public</span>
              ) : (
                <span className="px-2 py-1 rounded bg-slate-700 text-slate-400 text-xs">Private</span>
              )}
            </div>
            <h3 className="text-lg font-semibold mb-2">{dataset.name}</h3>
            <div className="space-y-2 text-sm text-slate-400">
              <div className="flex justify-between">
                <span>Size:</span>
                <span className="text-white">{dataset.size}</span>
              </div>
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="text-white">{dataset.type}</span>
              </div>
              <div className="flex justify-between">
                <span>Files:</span>
                <span className="text-white">{dataset.files.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Uploaded:</span>
                <span className="text-white">{dataset.uploaded}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700 flex gap-2">
              <button className="flex-1 bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded text-sm transition-colors">
                Use Dataset
              </button>
              <button className="border border-slate-700 hover:bg-slate-800 px-4 py-2 rounded text-sm transition-colors">
                Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModelsPage() {
  const [models] = useState([
    { id: '1', name: 'GPT-2 Fine-tuned', type: 'Language Model', size: '1.5 GB', downloads: 1234, price: 25, rating: 4.8 },
    { id: '2', name: 'BERT Sentiment', type: 'Classification', size: '420 MB', downloads: 856, price: 15, rating: 4.6 },
    { id: '3', name: 'Stable Diffusion Custom', type: 'Image Generation', size: '4.2 GB', downloads: 2341, price: 50, rating: 4.9 },
    { id: '4', name: 'ResNet-50 Transfer', type: 'Computer Vision', size: '98 MB', downloads: 567, price: 10, rating: 4.5 },
  ]);

  return (
    <div className="space-y-6">
      <Breadcrumb items={['Storage', 'Models']} />
      <PageHeader
        title="Model Hub"
        description="Browse, download, and share AI models"
        actions={
          <button className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 px-6 py-2 rounded-lg transition-colors">
            <Target className="w-4 h-4" />
            Upload Model
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-6">
        {models.map((model) => (
          <div key={model.id} className="bg-slate-900 border border-slate-700 rounded-lg p-6 hover:border-cyan-500/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Target className="w-10 h-10 text-cyan-400" />
                <div>
                  <h3 className="text-lg font-semibold">{model.name}</h3>
                  <p className="text-sm text-slate-400">{model.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-yellow-400 font-semibold">{model.rating}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">{model.size}</div>
                <div className="text-xs text-slate-400">Size</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">{model.downloads}</div>
                <div className="text-xs text-slate-400">Downloads</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">{model.price}</div>
                <div className="text-xs text-slate-400">QUBIC</div>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded text-sm transition-colors">
                Download
              </button>
              <button className="border border-slate-700 hover:bg-slate-800 px-4 py-2 rounded text-sm transition-colors">
                Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SnapshotsPage() {
  const [snapshots] = useState([
    { id: '1', name: 'Training Checkpoint - Epoch 50', instance: 'gpu-abc123', size: '12 GB', created: '2024-01-15 14:30' },
    { id: '2', name: 'Model Backup v2', instance: 'gpu-def456', size: '8.5 GB', created: '2024-01-14 09:15' },
    { id: '3', name: 'Experiment Results', instance: 'gpu-abc123', size: '3.2 GB', created: '2024-01-13 18:45' },
  ]);

  return (
    <div className="space-y-6">
      <Breadcrumb items={['Storage', 'Snapshots']} />
      <PageHeader
        title="Snapshots"
        description="Instance snapshots and backups"
        actions={
          <button className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 px-6 py-2 rounded-lg transition-colors">
            <Circle className="w-4 h-4" />
            Create Snapshot
          </button>
        }
      />

      <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
        <div className="divide-y divide-slate-700">
          {snapshots.map((snapshot) => (
            <div key={snapshot.id} className="p-6 hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Circle className="w-8 h-8 text-cyan-400" />
                  <div>
                    <h3 className="font-semibold mb-1">{snapshot.name}</h3>
                    <div className="text-sm text-slate-400">
                      Instance: {snapshot.instance} • Size: {snapshot.size} • Created: {snapshot.created}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded text-sm transition-colors">
                    Restore
                  </button>
                  <button className="border border-slate-700 hover:bg-slate-800 px-4 py-2 rounded text-sm transition-colors">
                    Download
                  </button>
                  <button className="border border-red-500/20 text-red-400 hover:bg-red-500/10 px-4 py-2 rounded text-sm transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BillingPage() {
  const [usage] = useState({
    currentMonth: 245.50,
    lastMonth: 189.30,
    gpuHours: 42,
    cpuHours: 18,
    storage: 150
  });

  return (
    <div className="space-y-6">
      <Breadcrumb items={['Billing & Usage']} />
      <PageHeader
        title="Billing & Usage"
        description="Track your spending and resource usage"
      />

      <div className="grid grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <DollarSign className="w-8 h-8 text-cyan-400 mb-2" />
          <div className="text-2xl font-bold text-cyan-400 mb-1">{usage.currentMonth} QUBIC</div>
          <div className="text-sm text-slate-400">Current Month</div>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <Activity className="w-8 h-8 text-cyan-400 mb-2" />
          <div className="text-2xl font-bold text-cyan-400 mb-1">{usage.gpuHours}h</div>
          <div className="text-sm text-slate-400">GPU Hours</div>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <Cpu className="w-8 h-8 text-cyan-400 mb-2" />
          <div className="text-2xl font-bold text-cyan-400 mb-1">{usage.cpuHours}h</div>
          <div className="text-sm text-slate-400">CPU Hours</div>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <HardDrive className="w-8 h-8 text-cyan-400 mb-2" />
          <div className="text-2xl font-bold text-cyan-400 mb-1">{usage.storage} GB</div>
          <div className="text-sm text-slate-400">Storage Used</div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Usage Over Time</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={Array.from({ length: 30 }).map((_, i) => ({
            day: i + 1,
            cost: Math.floor(5 + Math.random() * 15)
          }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="day" stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #334155',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="cost" fill="#22d3ee" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="text-center text-xs text-slate-500 mt-2">Last 30 days</div>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
        <div className="bg-slate-800 border-b border-slate-700 px-6 py-3">
          <h3 className="font-semibold">Recent Transactions</h3>
        </div>
        <div className="divide-y divide-slate-700">
          {[
            { date: '2024-01-15', description: 'GPU Instance - RTX 4090', amount: 45.50, status: 'Completed' },
            { date: '2024-01-14', description: 'Dataset Storage', amount: 12.00, status: 'Completed' },
            { date: '2024-01-13', description: 'CPU Instance - EPYC 7763', amount: 18.30, status: 'Completed' },
          ].map((tx, i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-800/50">
              <div>
                <div className="font-medium">{tx.description}</div>
                <div className="text-sm text-slate-400">{tx.date}</div>
              </div>
              <div className="text-right">
                <div className="text-cyan-400 font-semibold">{tx.amount} QUBIC</div>
                <div className="text-xs text-green-400">{tx.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb items={['Settings']} />
      <PageHeader
        title="Settings"
        description="Manage your account and preferences"
      />

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Account Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Email</label>
              <input
                type="email"
                defaultValue="user@example.com"
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Username</label>
              <input
                type="text"
                defaultValue="qubix_user"
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
              />
            </div>
            <button className="bg-cyan-500 hover:bg-cyan-600 px-6 py-2 rounded transition-colors">
              Save Changes
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">API Keys</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">API Key</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  defaultValue="qbx_1234567890abcdef"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm font-mono"
                  readOnly
                />
                <CopyButton text="qbx_1234567890abcdef" />
              </div>
            </div>
            <button className="border border-slate-700 hover:bg-slate-800 px-6 py-2 rounded transition-colors">
              Generate New Key
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Notifications</h3>
          <div className="space-y-3">
            {[
              { label: 'Instance Started', checked: true },
              { label: 'Instance Stopped', checked: true },
              { label: 'Low Balance Alert', checked: true },
              { label: 'Weekly Summary', checked: false },
            ].map((item, i) => (
              <label key={i} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked={item.checked} className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Preferences</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Default Region</label>
              <select className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm">
                <option>US East (Virginia)</option>
                <option>US West (Oregon)</option>
                <option>EU (Frankfurt)</option>
                <option>Asia (Tokyo)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Currency</label>
              <select className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm">
                <option>QUBIC</option>
                <option>USD</option>
                <option>EUR</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentationPage() {
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: BookOpen },
    { id: 'gpu-instances', title: 'GPU Instances', icon: Server },
    { id: 'api-reference', title: 'API Reference', icon: Target },
    { id: 'pricing', title: 'Pricing', icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={['Documentation']} />
      <PageHeader
        title="Documentation"
        description="Learn how to use QUBIX platform"
      />

      <div className="grid grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 h-fit">
          <h3 className="font-semibold mb-4">Contents</h3>
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-colors ${
                  activeSection === section.id
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <section.icon className="w-4 h-4" />
                <span className="text-sm">{section.title}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="col-span-3 bg-slate-900 border border-slate-700 rounded-lg p-8">
          {activeSection === 'getting-started' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Getting Started with QUBIX</h2>
                <p className="text-slate-300 mb-4">
                  QUBIX is a decentralized AI compute marketplace built on the Qubic blockchain. 
                  This guide will help you get started with launching your first GPU instance.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">1. Connect Your Wallet</h3>
                <div className="bg-slate-800 rounded-lg p-4 mb-4">
                  <p className="text-slate-300 mb-2">Click "Connect Wallet" in the top navigation bar.</p>
                  <ul className="list-disc list-inside text-slate-400 space-y-1 ml-4">
                    <li>MetaMask will prompt you to connect</li>
                    <li>Approve the connection request</li>
                    <li>Your wallet address and balance will appear</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">2. Browse GPU Marketplace</h3>
                <div className="bg-slate-800 rounded-lg p-4 mb-4">
                  <p className="text-slate-300 mb-2">Navigate to "GPU Instances" in the sidebar.</p>
                  <ul className="list-disc list-inside text-slate-400 space-y-1 ml-4">
                    <li>View 22+ available GPU instances</li>
                    <li>Filter by price, model, location, and status</li>
                    <li>Sort by price, rating, or VRAM</li>
                    <li>Compare specifications and pricing</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">3. Launch an Instance</h3>
                <div className="bg-slate-800 rounded-lg p-4 mb-4">
                  <p className="text-slate-300 mb-2">Click "Launch" on any available GPU.</p>
                  <div className="space-y-3 mt-3">
                    <div>
                      <div className="font-medium text-cyan-400 mb-1">Step 1: Configuration</div>
                      <ul className="list-disc list-inside text-slate-400 space-y-1 ml-4">
                        <li>Choose environment (Jupyter, SSH, VSCode, API)</li>
                        <li>Upload dataset (optional)</li>
                        <li>Set duration (1-24 hours)</li>
                        <li>Enable redundancy for fault tolerance</li>
                      </ul>
                    </div>
                    <div>
                      <div className="font-medium text-cyan-400 mb-1">Step 2: Provisioning</div>
                      <ul className="list-disc list-inside text-slate-400 space-y-1 ml-4">
                        <li>Wait 2-3 seconds for instance allocation</li>
                        <li>GPU resources are being prepared</li>
                      </ul>
                    </div>
                    <div>
                      <div className="font-medium text-cyan-400 mb-1">Step 3: Connection</div>
                      <ul className="list-disc list-inside text-slate-400 space-y-1 ml-4">
                        <li>Receive instance ID and connection details</li>
                        <li>Copy API token for authentication</li>
                        <li>Access via Jupyter, SSH, or API</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">4. Monitor Your Instances</h3>
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-slate-300 mb-2">Go to "My Instances" to manage running instances.</p>
                  <ul className="list-disc list-inside text-slate-400 space-y-1 ml-4">
                    <li>View real-time GPU usage and temperature</li>
                    <li>Monitor memory consumption</li>
                    <li>Stream logs in real-time</li>
                    <li>Connect or stop instances</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'gpu-instances' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">GPU Instances Guide</h2>
                <p className="text-slate-300 mb-4">
                  Learn about GPU instance types, specifications, and best practices.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Available GPU Models</h3>
                <div className="space-y-3">
                  {[
                    { model: 'NVIDIA H100', vram: '80GB', use: 'Large language models, advanced AI research', price: '~80 QUBIC/hour' },
                    { model: 'NVIDIA A100', vram: '40-80GB', use: 'Deep learning training, inference at scale', price: '~35-50 QUBIC/hour' },
                    { model: 'NVIDIA RTX 4090', vram: '24GB', use: 'AI training, 3D rendering, gaming', price: '~10-13 QUBIC/hour' },
                    { model: 'NVIDIA RTX 3090', vram: '24GB', use: 'ML training, content creation', price: '~7-9 QUBIC/hour' },
                    { model: 'NVIDIA V100', vram: '16-32GB', use: 'Scientific computing, HPC', price: '~20-25 QUBIC/hour' },
                  ].map((gpu, i) => (
                    <div key={i} className="bg-slate-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-cyan-400">{gpu.model}</h4>
                        <span className="text-sm text-slate-400">{gpu.price}</span>
                      </div>
                      <div className="text-sm text-slate-400 mb-1">VRAM: {gpu.vram}</div>
                      <div className="text-sm text-slate-300">Best for: {gpu.use}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Environment Options</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: 'Jupyter Notebook', desc: 'Interactive Python notebooks for data science and ML', port: '8888' },
                    { name: 'SSH Access', desc: 'Direct terminal access for custom configurations', port: '22' },
                    { name: 'VSCode Remote', desc: 'Full IDE experience with remote development', port: '8080' },
                    { name: 'REST API', desc: 'HTTP API endpoint for programmatic access', port: '443' },
                  ].map((env, i) => (
                    <div key={i} className="bg-slate-800 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">{env.name}</h4>
                      <p className="text-sm text-slate-400 mb-2">{env.desc}</p>
                      <div className="text-xs text-slate-500">Port: {env.port}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'api-reference' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">API Reference</h2>
                <p className="text-slate-300 mb-4">
                  Complete API documentation for programmatic access to QUBIX.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Authentication</h3>
                <div className="bg-slate-800 rounded-lg p-4 mb-4">
                  <p className="text-slate-300 mb-3">Include your API token in the Authorization header:</p>
                  <div className="bg-slate-950 rounded p-3 font-mono text-sm text-cyan-400">
                    Authorization: Bearer qbx_your_api_token_here
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Endpoints</h3>
                <div className="space-y-4">
                  {[
                    { method: 'GET', path: '/api/gpus', desc: 'List available GPU instances', params: 'priceRange, model, location, status' },
                    { method: 'POST', path: '/api/instances/launch', desc: 'Launch a new GPU instance', params: 'gpuId, environment, duration' },
                    { method: 'GET', path: '/api/instances', desc: 'List your active instances', params: 'none' },
                    { method: 'POST', path: '/api/instances/:id/stop', desc: 'Stop a running instance', params: 'none' },
                    { method: 'GET', path: '/api/stats', desc: 'Get network statistics', params: 'none' },
                  ].map((endpoint, i) => (
                    <div key={i} className="bg-slate-800 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-mono ${
                          endpoint.method === 'GET' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                        }`}>
                          {endpoint.method}
                        </span>
                        <span className="font-mono text-sm text-cyan-400">{endpoint.path}</span>
                      </div>
                      <p className="text-sm text-slate-300 mb-2">{endpoint.desc}</p>
                      <div className="text-xs text-slate-500">Parameters: {endpoint.params}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Example Request</h3>
                <div className="bg-slate-950 rounded-lg p-4 font-mono text-sm">
                  <div className="text-green-400">curl -X POST https://api.qubix.network/v1/instances/launch \</div>
                  <div className="text-cyan-400 ml-4">-H "Authorization: Bearer qbx_token" \</div>
                  <div className="text-cyan-400 ml-4">-H "Content-Type: application/json" \</div>
                  <div className="text-cyan-400 ml-4">-d '&#123;"gpuId": "1", "environment": "jupyter", "duration": 4&#125;'</div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'pricing' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Pricing Guide</h2>
                <p className="text-slate-300 mb-4">
                  Transparent, pay-as-you-go pricing for GPU and CPU compute.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">How Pricing Works</h3>
                <div className="bg-slate-800 rounded-lg p-4 mb-4">
                  <ul className="space-y-2 text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">•</span>
                      <span>Pay only for the time your instance is running</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">•</span>
                      <span>Pricing is per hour, billed per second</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">•</span>
                      <span>No upfront costs or long-term commitments</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">•</span>
                      <span>Redundancy option doubles the cost (2x GPUs)</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">GPU Pricing Tiers</h3>
                <div className="space-y-3">
                  {[
                    { tier: 'Entry', models: 'RTX 3080, RTX 4080', range: '5-9 QUBIC/hour', use: 'Learning, small projects' },
                    { tier: 'Professional', models: 'RTX 3090, RTX 4090', range: '10-13 QUBIC/hour', use: 'Production training' },
                    { tier: 'Enterprise', models: 'A100, V100', range: '20-50 QUBIC/hour', use: 'Large-scale training' },
                    { tier: 'Premium', models: 'H100', range: '78-80 QUBIC/hour', use: 'Cutting-edge AI research' },
                  ].map((tier, i) => (
                    <div key={i} className="bg-slate-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-cyan-400">{tier.tier}</h4>
                        <span className="text-sm font-mono text-slate-300">{tier.range}</span>
                      </div>
                      <div className="text-sm text-slate-400 mb-1">Models: {tier.models}</div>
                      <div className="text-sm text-slate-300">Best for: {tier.use}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Example Costs</h3>
                <div className="bg-slate-800 rounded-lg p-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                      <span className="text-slate-300">RTX 4090 × 4 hours</span>
                      <span className="font-mono text-cyan-400">40 QUBIC</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                      <span className="text-slate-300">A100 × 8 hours (with redundancy)</span>
                      <span className="font-mono text-cyan-400">800 QUBIC</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                      <span className="text-slate-300">H100 × 2 hours</span>
                      <span className="font-mono text-cyan-400">160 QUBIC</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-300 font-semibold">Storage (per GB/month)</span>
                      <span className="font-mono text-cyan-400">0.1 QUBIC</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SupportPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb items={['Support']} />
      <PageHeader
        title="Support"
        description="Get help with QUBIX platform"
      />

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 hover:border-cyan-500/50 transition-colors cursor-pointer">
          <BookOpen className="w-12 h-12 text-cyan-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Documentation</h3>
          <p className="text-sm text-slate-400 mb-4">
            Browse our comprehensive guides and API documentation
          </p>
          <button className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">
            View Docs →
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 hover:border-cyan-500/50 transition-colors cursor-pointer">
          <MessageCircle className="w-12 h-12 text-cyan-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Community</h3>
          <p className="text-sm text-slate-400 mb-4">
            Join our Discord community for discussions and support
          </p>
          <button className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">
            Join Discord →
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 hover:border-cyan-500/50 transition-colors cursor-pointer">
          <Target className="w-12 h-12 text-cyan-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Contact Us</h3>
          <p className="text-sm text-slate-400 mb-4">
            Reach out to our support team for assistance
          </p>
          <button className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">
            Send Message →
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Frequently Asked Questions</h3>
        <div className="space-y-4">
          {[
            { q: 'How do I launch a GPU instance?', a: 'Navigate to GPU Instances, select a GPU, and click Launch. Follow the 3-step wizard to configure your instance.' },
            { q: 'What payment methods are accepted?', a: 'We accept QUBIC tokens through your connected wallet. You can also use MetaMask for payments.' },
            { q: 'How is pricing calculated?', a: 'Pricing is per hour of usage. You only pay for the time your instance is running.' },
            { q: 'Can I stop an instance and resume later?', a: 'Yes, you can create snapshots before stopping and restore them when you resume.' },
          ].map((faq, i) => (
            <div key={i} className="border-b border-slate-700 pb-4 last:border-0">
              <h4 className="font-medium mb-2">{faq.q}</h4>
              <p className="text-sm text-slate-400">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN APP
// ============================================

export default function QubixApp() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: '',
    fullAddress: '',
    balance: '0'
  });
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Navigation event listener (for Dashboard quick actions)
  useEffect(() => {
    const handleNavigate = (e: CustomEvent) => {
      setCurrentPage(e.detail);
    };
    window.addEventListener('navigate', handleNavigate as EventListener);
    return () => window.removeEventListener('navigate', handleNavigate as EventListener);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
        toast('Command palette (coming soon!)', { icon: '⌨️' });
      }
      
      // / for search focus
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        searchInput?.focus();
        toast('Search focused', { icon: '🔍', duration: 1000 });
      }
      
      // Esc to close modals
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleConnectWallet = async () => {
    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum !== 'undefined') {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const address = accounts[0];
        
        // Mock balance for demo (in production, fetch from Qubic network)
        const balance = (Math.random() * 10000).toFixed(2);
        
        setWallet({
          connected: true,
          address: `${address.slice(0, 6)}...${address.slice(-4)}`,
          fullAddress: address,
          balance: balance.toString()
        });
        toast.success('Wallet connected successfully!');
      } else {
        alert('Please install MetaMask to connect your wallet!\n\nFor demo purposes, connecting with mock wallet...');
        // Mock wallet for demo
        const mockAddress = '0x' + Math.random().toString(16).slice(2, 42);
        setWallet({
          connected: true,
          address: `${mockAddress.slice(0, 6)}...${mockAddress.slice(-4)}`,
          fullAddress: mockAddress,
          balance: (Math.random() * 10000).toFixed(2).toString()
        });
        toast.success('Mock wallet connected!');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet. Please try again.');
    }
  };

  const handleDisconnectWallet = () => {
    setWallet({
      connected: false,
      address: '',
      fullAddress: '',
      balance: '0'
    });
    toast.success('Wallet disconnected');
  };

  const { language } = useLanguage();
  
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard key={language} />;
      case 'gpu': return <GPUInstancesPage />;
      case 'cpu': return <CPUInstancesPage />;
      case 'my-instances': return <CallerMonitor key={language} onBack={() => setCurrentPage('dashboard')} />;
      case 'datasets': return <DatasetsPage />;
      case 'models': return <ModelsPage />;
      case 'snapshots': return <SnapshotsPage />;
      case 'billing': return <BillingPage />;
      case 'settings': return <SettingsPage />;
      case 'docs': 
        return <DocumentationPage />;
      case 'support':
        return <SupportPage />;
      case 'become-provider':
        return <BecomeProvider key={language} onBack={() => setCurrentPage('dashboard')} />;
      case 'use-gpu':
        return <UseGPU key={language} onBack={() => setCurrentPage('dashboard')} onSelectGPU={() => setCurrentPage('gpu')} />;
      case 'provider-monitor':
        return <MyHardware key={language} onBack={() => setCurrentPage('dashboard')} onAddHardware={() => setCurrentPage('become-provider')} />;
      case 'provider-earnings':
        return <ProviderMonitor key={language} onBack={() => setCurrentPage('dashboard')} />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid #334155',
          },
          success: {
            iconTheme: {
              primary: '#22d3ee',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <TopNavbar 
        wallet={wallet}
        onConnectWallet={handleConnectWallet}
        onDisconnectWallet={handleDisconnectWallet}
        onNavigate={setCurrentPage}
      />
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="ml-64 mt-16 min-h-screen p-8">
        {renderPage()}
        
        {/* Keyboard Shortcuts Helper */}
        <div className="fixed bottom-4 right-4 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-xs text-slate-400 flex items-center gap-4">
          <span className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-600">/</kbd>
            Focus search
          </span>
          <span className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-600">⌘K</kbd>
            Command palette
          </span>
        </div>
      </main>
    </div>
  );
}
