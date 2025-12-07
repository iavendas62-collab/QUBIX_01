import { Activity, Server, Target, Zap } from 'lucide-react';

export function DashboardFast() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-cyan-400">QUBIX</h1>
            <p className="text-slate-400 text-sm">Compute Hub Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium">{user.name || 'User'}</div>
              <div className="text-xs text-slate-400">{user.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Welcome back, {user.name}! 👋</h2>
          <p className="text-slate-400">Your decentralized AI compute platform is ready.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 hover:border-cyan-500 transition-colors">
            <Activity className="w-8 h-8 text-cyan-400 mb-3" />
            <div className="text-3xl font-bold text-cyan-400 mb-1">1,234</div>
            <div className="text-sm text-slate-400">Total Jobs</div>
            <div className="text-xs text-slate-500 mt-1">45 active</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 hover:border-cyan-500 transition-colors">
            <Server className="w-8 h-8 text-cyan-400 mb-3" />
            <div className="text-3xl font-bold text-cyan-400 mb-1">89</div>
            <div className="text-sm text-slate-400">Active Providers</div>
            <div className="text-xs text-slate-500 mt-1">156 total</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 hover:border-cyan-500 transition-colors">
            <Target className="w-8 h-8 text-cyan-400 mb-3" />
            <div className="text-3xl font-bold text-cyan-400 mb-1">342</div>
            <div className="text-sm text-slate-400">AI Models</div>
            <div className="text-xs text-slate-500 mt-1">Available</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 hover:border-cyan-500 transition-colors">
            <Zap className="w-8 h-8 text-cyan-400 mb-3" />
            <div className="text-3xl font-bold text-cyan-400 mb-1">4,500</div>
            <div className="text-sm text-slate-400">TFLOPS Available</div>
            <div className="text-xs text-slate-500 mt-1">676 computors</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-6">
            <button className="bg-slate-900 border border-slate-800 hover:border-cyan-500 hover:bg-slate-800 rounded-lg p-6 text-left transition-all group">
              <div className="text-lg font-semibold mb-2 group-hover:text-cyan-400 transition-colors">
                🚀 Submit a Job
              </div>
              <div className="text-sm text-slate-400">
                Train or run inference on AI models
              </div>
            </button>
            
            <button className="bg-slate-900 border border-slate-800 hover:border-cyan-500 hover:bg-slate-800 rounded-lg p-6 text-left transition-all group">
              <div className="text-lg font-semibold mb-2 group-hover:text-cyan-400 transition-colors">
                💻 Browse GPUs
              </div>
              <div className="text-sm text-slate-400">
                Find the perfect GPU for your workload
              </div>
            </button>
            
            <button className="bg-slate-900 border border-slate-800 hover:border-cyan-500 hover:bg-slate-800 rounded-lg p-6 text-left transition-all group">
              <div className="text-lg font-semibold mb-2 group-hover:text-cyan-400 transition-colors">
                🤖 Explore Models
              </div>
              <div className="text-sm text-slate-400">
                Discover pre-trained AI models
              </div>
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8">
          <h3 className="text-xl font-semibold mb-6">Platform Features</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-cyan-400 text-xl">⚡</span>
              </div>
              <div>
                <div className="font-semibold mb-1">Decentralized Computing</div>
                <div className="text-sm text-slate-400">
                  Leverage Qubic's distributed network for AI workloads
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-cyan-400 text-xl">🔒</span>
              </div>
              <div>
                <div className="font-semibold mb-1">Secure Payments</div>
                <div className="text-sm text-slate-400">
                  Smart contract escrow for safe transactions
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-cyan-400 text-xl">🌐</span>
              </div>
              <div>
                <div className="font-semibold mb-1">Global Network</div>
                <div className="text-sm text-slate-400">
                  Access compute resources from around the world
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-cyan-400 text-xl">💰</span>
              </div>
              <div>
                <div className="font-semibold mb-1">Competitive Pricing</div>
                <div className="text-sm text-slate-400">
                  Market-driven rates for optimal value
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Info */}
        <div className="mt-8 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-400 mb-1">Your Qubic Wallet</div>
              <div className="font-mono text-sm text-cyan-400">
                {user.qubicIdentity ? `${user.qubicIdentity.slice(0, 20)}...` : 'Not available'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400 mb-1">Balance</div>
              <div className="text-2xl font-bold text-cyan-400">0 QUBIC</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
