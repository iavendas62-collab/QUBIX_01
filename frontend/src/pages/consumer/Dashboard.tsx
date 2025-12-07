/**
 * Consumer Dashboard - Resumo de instâncias, alertas, sugestões
 * Requirements: 6.1, 6.3, 6.6 - Enterprise UI with accessibility
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, Cpu, Clock, DollarSign, ChevronRight, Play, Zap } from 'lucide-react';
import { SkeletonStats, SkeletonCard } from '../../components/ui';

export default function ConsumerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ activeInstances: 0, totalSpent: 0, hoursUsed: 0 });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [suggestedGpus, setSuggestedGpus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('📊 Fetching consumer dashboard data...');
      
      // Get user's qubic address
      const qubicAddress = localStorage.getItem('qubicAddress') || 'QUBICTESTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
      
      // Fetch user's jobs
      const jobsRes = await fetch(`/api/jobs/user/${qubicAddress}`);
      if (jobsRes.ok) {
        const jobs = await jobsRes.json();
        console.log('✅ Jobs loaded:', jobs);
        
        // Calculate stats from jobs
        const activeJobs = jobs.filter((j: any) => j.status === 'RUNNING' || j.status === 'ASSIGNED');
        const completedJobs = jobs.filter((j: any) => j.status === 'COMPLETED');
        const totalSpent = completedJobs.reduce((sum: number, j: any) => sum + (j.actualCost || 0), 0);
        const totalHours = completedJobs.reduce((sum: number, j: any) => {
          if (j.startedAt && j.completedAt) {
            const hours = (new Date(j.completedAt).getTime() - new Date(j.startedAt).getTime()) / (1000 * 60 * 60);
            return sum + hours;
          }
          return sum;
        }, 0);
        
        setStats({
          activeInstances: activeJobs.length,
          totalSpent: Math.round(totalSpent * 100) / 100,
          hoursUsed: Math.round(totalHours * 10) / 10
        });
        
        // Set recent jobs
        setRecentJobs(jobs.slice(0, 5));
      }
      
      // Fetch suggested GPUs
      const gpusRes = await fetch('/api/gpus?limit=3');
      if (gpusRes.ok) {
        const gpus = await gpusRes.json();
        setSuggestedGpus(gpus.slice(0, 3));
      }
      
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading dashboard">
        <div className="h-8 w-48 skeleton-shimmer rounded" />
        <SkeletonStats count={3} />
        <div className="grid grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <span className="sr-only">Loading dashboard content...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" id="dashboard-title">Dashboard</h1>

      {/* Stats */}
      <section aria-labelledby="stats-heading" className="grid grid-cols-3 gap-6">
        <h2 id="stats-heading" className="sr-only">Dashboard Statistics</h2>
        <article className="bg-slate-800 border border-slate-700 rounded-xl p-6" aria-label="Active instances">
          <Server className="w-8 h-8 text-cyan-400 mb-3" aria-hidden="true" />
          <div className="text-3xl font-bold text-cyan-400">{stats.activeInstances}</div>
          <div className="text-sm text-slate-400">Active Instances</div>
        </article>
        <article className="bg-slate-800 border border-slate-700 rounded-xl p-6" aria-label="Total spent">
          <DollarSign className="w-8 h-8 text-green-400 mb-3" aria-hidden="true" />
          <div className="text-3xl font-bold text-green-400">{stats.totalSpent} QUBIC</div>
          <div className="text-sm text-slate-400">Total Spent</div>
        </article>
        <article className="bg-slate-800 border border-slate-700 rounded-xl p-6" aria-label="Hours used">
          <Clock className="w-8 h-8 text-blue-400 mb-3" aria-hidden="true" />
          <div className="text-3xl font-bold text-blue-400">{stats.hoursUsed}h</div>
          <div className="text-sm text-slate-400">Hours Used</div>
        </article>
      </section>

      {/* Quick Actions */}
      <section aria-labelledby="actions-heading" className="grid grid-cols-3 gap-6">
        <h2 id="actions-heading" className="sr-only">Quick Actions</h2>
        <button
          onClick={() => navigate('/app/marketplace')}
          aria-label="Rent a GPU - Browse available GPUs"
          className="group bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-6 text-left hover:border-cyan-400 transition-all focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center">
              <Play className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Launch Instance</h3>
              <p className="text-sm text-slate-400">Browse available GPUs</p>
            </div>
            <ChevronRight className="w-5 h-5 ml-auto text-cyan-400 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </div>
        </button>
        <button
          onClick={() => navigate('/app/jobs/submit')}
          aria-label="Submit Job - Run AI compute tasks"
          className="group bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6 text-left hover:border-green-400 transition-all focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Submit Job</h3>
              <p className="text-sm text-slate-400">Run AI compute tasks</p>
            </div>
            <ChevronRight className="w-5 h-5 ml-auto text-green-400 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </div>
        </button>
        <button
          onClick={() => navigate('/app/instances')}
          aria-label="My Instances - Manage running instances"
          className="group bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6 text-left hover:border-purple-400 transition-all focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <Server className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">My Instances</h3>
              <p className="text-sm text-slate-400">Manage running instances</p>
            </div>
            <ChevronRight className="w-5 h-5 ml-auto text-purple-400 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </div>
        </button>
      </section>

      {/* Suggested GPUs */}
      <section aria-labelledby="suggested-gpus-heading" className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h2 id="suggested-gpus-heading" className="font-semibold">Suggested GPUs</h2>
          <button 
            onClick={() => navigate('/app/marketplace')} 
            className="text-sm text-cyan-400 hover:text-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-500 rounded px-2 py-1"
            aria-label="View all GPUs in marketplace"
          >
            View All →
          </button>
        </div>
        <ul className="divide-y divide-slate-700" role="list" aria-label="Suggested GPU list">
          {suggestedGpus.map(gpu => (
            <li key={gpu.id}>
              <button 
                className="w-full p-4 flex items-center justify-between hover:bg-slate-700/50 cursor-pointer text-left focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500" 
                onClick={() => navigate(`/app/jobs/submit/${gpu.id}`)}
                aria-label={`${gpu.model} - ${gpu.vram}GB VRAM - ${gpu.price} QUBIC per hour - ${gpu.location}`}
              >
                <div className="flex items-center gap-4">
                  <Cpu className="w-10 h-10 text-cyan-400" aria-hidden="true" />
                  <div>
                    <div className="font-medium">{gpu.model}</div>
                    <div className="text-sm text-slate-400">{gpu.vram}GB • {gpu.location}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-cyan-400">{gpu.price} QUBIC</div>
                  <div className="text-sm text-slate-400">/hour</div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

