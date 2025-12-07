/**
 * Consumer Jobs List - View all submitted jobs with status and progress
 * 
 * Requirements: 11.4, 11.5
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Cpu, Clock, CheckCircle, AlertCircle, Loader2, Plus, 
  RefreshCw, Zap, DollarSign, Play
} from 'lucide-react';
import { useWebSocket, useJobUpdates } from '../../hooks/useWebSocket';
import { useRefresh, formatTimeSince } from '../../hooks/useRefresh';
import { Skeleton } from '../../components/ui/Skeleton';

interface Job {
  id: string;
  modelType: string;
  computeNeeded: number;
  status: string;
  progress: number;
  estimatedCost: number;
  actualCost?: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  provider?: {
    workerId: string;
    gpuModel: string;
    pricePerHour: number;
  };
}

export default function Jobs() {
  const navigate = useNavigate();
  const { isConnected } = useWebSocket();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const qubicAddress = user.qubicIdentity || user.qubicAddress;

  // Fetch jobs
  const fetchJobs = useCallback(async () => {
    if (!qubicAddress) {
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch(`/api/jobs/user/${qubicAddress}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      } else {
        throw new Error('Failed to fetch jobs');
      }
    } catch (e) {
      console.error('Failed to fetch jobs:', e);
      throw e; // Let useRefresh handle the error
    } finally {
      setLoading(false);
    }
  }, [qubicAddress]);

  // Use refresh hook with auto-refresh every 30 seconds
  const { isRefreshing, lastUpdated, secondsSinceUpdate, refresh, setLastUpdated } = useRefresh({
    onRefresh: fetchJobs,
    autoRefreshInterval: 30000,
    enableAutoRefresh: true,
    showSuccessToast: false,
    showErrorToast: true
  });

  useEffect(() => {
    fetchJobs().then(() => {
      setLastUpdated(new Date());
    });
  }, [fetchJobs, setLastUpdated]);

  // Handle real-time job updates
  const handleJobUpdate = useCallback((data: any) => {
    setJobs(prev => prev.map(job => {
      if (job.id === data.jobId) {
        return {
          ...job,
          progress: data.progress ?? job.progress,
          status: data.status ?? job.status,
          completedAt: data.completedAt ?? job.completedAt,
          error: data.error ?? job.error
        };
      }
      return job;
    }));
    setLastUpdated(new Date());
  }, [setLastUpdated]);

  // Subscribe to updates for all active jobs
  const activeJobIds = jobs.filter(j => ['PENDING', 'ASSIGNED', 'RUNNING'].includes(j.status)).map(j => j.id);
  useJobUpdates(activeJobIds.length > 0 ? activeJobIds[0] : null, handleJobUpdate);

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    if (filter === 'active') return ['PENDING', 'ASSIGNED', 'RUNNING'].includes(job.status);
    if (filter === 'completed') return ['COMPLETED', 'FAILED', 'CANCELLED'].includes(job.status);
    return true;
  });

  // Get status display
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'PENDING': return { color: 'bg-yellow-500/20 text-yellow-400', icon: Clock };
      case 'ASSIGNED': return { color: 'bg-blue-500/20 text-blue-400', icon: Cpu };
      case 'RUNNING': return { color: 'bg-cyan-500/20 text-cyan-400', icon: Loader2 };
      case 'COMPLETED': return { color: 'bg-green-500/20 text-green-400', icon: CheckCircle };
      case 'FAILED': return { color: 'bg-red-500/20 text-red-400', icon: AlertCircle };
      default: return { color: 'bg-slate-500/20 text-slate-400', icon: Clock };
    }
  };

  // Format time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Jobs</h1>
          <p className="text-slate-400 text-sm mt-1">
            {filteredJobs.length} jobs {filter !== 'all' && `(${filter})`}
            {lastUpdated && (
              <span className="ml-2">
                • Last updated: {formatTimeSince(secondsSinceUpdate)}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isConnected && (
            <span className="flex items-center gap-2 text-sm text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Live
            </span>
          )}
          <button
            onClick={refresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => navigate('/app/jobs/submit')}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-lg font-medium"
          >
            <Plus className="w-5 h-5" /> New Job
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'active', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f 
                ? 'bg-cyan-500 text-white' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Jobs List */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-700">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 flex items-center gap-4">
                <Skeleton variant="circle" className="w-12 h-12" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="w-48 h-4" />
                  <Skeleton className="w-32 h-3" />
                </div>
                <Skeleton className="w-20 h-6" />
              </div>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-12 text-center">
            <Zap className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Jobs Found</h3>
            <p className="text-slate-400 mb-6">
              {filter === 'all' 
                ? "You haven't submitted any jobs yet" 
                : `No ${filter} jobs`}
            </p>
            <button
              onClick={() => navigate('/app/jobs/submit')}
              className="bg-cyan-500 hover:bg-cyan-600 px-6 py-3 rounded-lg font-medium"
            >
              Submit Your First Job
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {filteredJobs.map(job => {
              const statusDisplay = getStatusDisplay(job.status);
              const StatusIcon = statusDisplay.icon;
              
              return (
                <div
                  key={job.id}
                  className="p-4 hover:bg-slate-700/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/app/jobs/${job.id}`)}
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-cyan-400" />
                    </div>
                    
                    {/* Job Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{job.modelType}</span>
                        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs ${statusDisplay.color}`}>
                          <StatusIcon className={`w-3 h-3 ${job.status === 'RUNNING' ? 'animate-spin' : ''}`} />
                          {job.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(job.createdAt)}
                        </span>
                        {job.provider && (
                          <span className="flex items-center gap-1">
                            <Cpu className="w-3 h-3" />
                            {job.provider.gpuModel}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {(job.actualCost || job.estimatedCost).toFixed(2)} QUBIC
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress */}
                    {['RUNNING', 'ASSIGNED'].includes(job.status) && (
                      <div className="w-32">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">Progress</span>
                          <span className="text-cyan-400">{job.progress}%</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-cyan-500 transition-all duration-500"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Action */}
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/app/jobs/${job.id}`); }}
                      className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

