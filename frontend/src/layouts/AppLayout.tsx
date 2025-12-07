/**
 * App Layout - Layout principal com Sidebar dinâmica
 * Requirements: 6.1, 6.6 - Enterprise UI with accessibility
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Server, Plus, Activity, DollarSign,
  CreditCard, User, LogOut, ChevronRight, RefreshCw, Wallet, Monitor,
  HardDrive, Menu, X
} from 'lucide-react';
import LanguageSelector from '../components/LanguageSelector';
import { useLanguage } from '../i18n/LanguageContext';

const texts = {
  en: {
    dashboard: 'Dashboard', marketplace: 'GPU Marketplace', myInstances: 'My Instances',
    providerDash: 'Provider Dashboard', myHardware: 'My Hardware', addHardware: 'Add Hardware',
    monitor: 'Monitor', earnings: 'Earnings', wallet: 'Qubic Wallet', payments: 'Payments', account: 'Account',
    switchProfile: 'Switch Profile', logout: 'Logout', consumer: 'Consumer', provider: 'Provider'
  },
  pt: {
    dashboard: 'Painel', marketplace: 'Marketplace', myInstances: 'Minhas Instâncias',
    providerDash: 'Painel Provider', myHardware: 'Meu Hardware', addHardware: 'Adicionar Hardware',
    monitor: 'Monitor', earnings: 'Ganhos', wallet: 'Carteira Qubic', payments: 'Pagamentos', account: 'Conta',
    switchProfile: 'Trocar Perfil', logout: 'Sair', consumer: 'Consumidor', provider: 'Provedor'
  },
  es: {
    dashboard: 'Panel', marketplace: 'Marketplace', myInstances: 'Mis Instancias',
    providerDash: 'Panel Provider', myHardware: 'Mi Hardware', addHardware: 'Agregar Hardware',
    monitor: 'Monitor', earnings: 'Ganancias', wallet: 'Billetera Qubic', payments: 'Pagos', account: 'Cuenta',
    switchProfile: 'Cambiar Perfil', logout: 'Salir', consumer: 'Consumidor', provider: 'Proveedor'
  }
};

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const t = texts[language];

  const [profile, setProfile] = useState<'consumer' | 'provider'>(() => {
    const savedProfile = localStorage.getItem('userProfile') as 'consumer' | 'provider';
    return savedProfile || 'consumer';
  });
  const [user, setUser] = useState<any>(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });
  const [balance, setBalance] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchBalance();
  }, []);

  // Reset loading state when location changes
  useEffect(() => {
    setIsLoading(false);
  }, [location.pathname]);

  const fetchBalance = useCallback(async () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const u = JSON.parse(userData);
        const res = await fetch(`/api/wallet/balance/${u.qubicIdentity}`);
        if (res.ok) setBalance((await res.json()).balance);
      }
    } catch (e) { console.error('Failed to fetch balance:', e); }
  }, []);

  const switchProfile = useCallback(() => {
    const newProfile = profile === 'consumer' ? 'provider' : 'consumer';
    setProfile(newProfile);
    localStorage.setItem('userProfile', newProfile);
    navigate(newProfile === 'consumer' ? '/app/dashboard' : '/app/provider');
  }, [profile, navigate]);

  const handleLogout = useCallback(() => {
    localStorage.clear();
    navigate('/');
  }, [navigate]);

  const handleNavigation = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const isActive = useCallback((path: string) => location.pathname === path || location.pathname.startsWith(path + '/'), [location.pathname]);
  const accent = profile === 'provider' ? 'green' : 'cyan';

  const NavItem = ({ icon: Icon, label, path }: { icon: any; label: string; path: string }) => {
    const isCurrentPage = location.pathname === path || location.pathname.startsWith(path + '/');
    const activeClass = profile === 'provider' 
      ? 'bg-green-500/20 text-green-400' 
      : 'bg-cyan-500/20 text-cyan-400';

    return (
      <button
        onClick={() => navigate(path)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
          isCurrentPage
            ? activeClass
            : 'text-slate-300 hover:bg-slate-800'
        }`}
      >
        <Icon className="w-5 h-5" />
        {sidebarOpen && <span>{label}</span>}
      </button>
    );
  };

  // Memoize navigation items to prevent unnecessary re-renders
  const navigationItems = useMemo(() => {
    return profile === 'consumer' ? (
      <>
        <NavItem icon={LayoutDashboard} label={t.dashboard} path="/app/dashboard" />
        <NavItem icon={ShoppingCart} label={t.marketplace} path="/app/marketplace" />
        <NavItem icon={Monitor} label={t.myInstances} path="/app/instances" />
      </>
    ) : (
      <>
        <NavItem icon={LayoutDashboard} label={t.providerDash} path="/app/provider" />
        <NavItem icon={HardDrive} label={t.myHardware} path="/app/provider/hardware" />
        <NavItem icon={DollarSign} label={t.earnings} path="/app/provider/earnings" />
      </>
    );
  }, [profile, t, NavItem]);

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Skip link for accessibility */}
      <a 
        href="#main-content" 
        className="skip-link"
        tabIndex={0}
      >
        Skip to main content
      </a>
      
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 ${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 border-r border-slate-700 flex flex-col z-50`}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div className={`flex items-center gap-2 ${!sidebarOpen && 'justify-center w-full'}`}>
            <span className={profile === 'provider'
              ? 'text-2xl font-bold text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]'
              : 'text-2xl font-bold text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]'
            }>Q</span>
            {sidebarOpen && <span className="text-xl font-bold">UBIX</span>}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-slate-800 rounded">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Profile Badge */}
        {sidebarOpen && (
          <div className="p-4 border-b border-slate-700">
            <div className={profile === 'provider' 
              ? 'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-green-500/20 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
              : 'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
            }>
              {profile === 'provider' ? <Server className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
              {profile === 'provider' ? t.provider : t.consumer}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto" aria-label="Primary navigation">
          {navigationItems}
          <div className="pt-4 mt-4 border-t border-slate-700 space-y-1">
            <NavItem icon={Wallet} label={t.wallet} path="/app/wallet" />
            <NavItem icon={CreditCard} label={t.payments} path="/app/payments" />
            <NavItem icon={User} label={t.account} path="/app/account" />
          </div>
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-slate-700 space-y-2">
          <button 
            onClick={switchProfile} 
            className={profile === 'provider'
              ? 'w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg text-cyan-400 hover:bg-slate-800 transition-colors'
              : 'w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg text-green-400 hover:bg-slate-800 transition-colors'
            }
          >
            <ChevronRight className="w-4 h-4" />
            {sidebarOpen && `→ ${profile === 'provider' ? t.consumer : t.provider}`}
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-slate-800 rounded-lg">
            <LogOut className="w-4 h-4" />
            {sidebarOpen && t.logout}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 h-16 bg-slate-900/80 backdrop-blur border-b border-slate-700 flex items-center justify-between px-6 z-40">
          <button onClick={fetchBalance} className="p-2 hover:bg-slate-800 rounded-lg"><RefreshCw className="w-5 h-5 text-slate-400" /></button>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <button 
              onClick={() => navigate('/app/wallet')}
              className={profile === 'provider'
                ? 'flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-lg border border-green-500/30 hover:bg-slate-700 transition-colors cursor-pointer'
                : 'flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-lg border border-cyan-500/30 hover:bg-slate-700 transition-colors cursor-pointer'
              }
              title="Open Qubic Wallet"
            >
              <Wallet className={profile === 'provider' ? 'w-5 h-5 text-green-400' : 'w-5 h-5 text-cyan-400'} />
              <span className="font-medium">{balance.toLocaleString()} QUBIC</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center"><User className="w-4 h-4" /></div>
              {user?.name && <span className="text-sm">{user.name}</span>}
            </div>
          </div>
        </header>
        <main id="main-content" className="p-8 min-h-[calc(100vh-4rem)]" role="main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
