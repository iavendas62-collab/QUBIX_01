/**
 * Job Details Page - View detailed job information and progress
 * 
 * Requirements: 11.4, 11.5
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Cpu, Clock, CheckCircle, AlertCircle, Loader2,
  Zap, RefreshCw, FileCode
} from 'lucide-react';
import { useWebSocket, useJobUpdates } from '../../hooks/useWebSocket';
import { Skeleton } from '../../components/ui/Skeleton';

interface Job {
  id: string;
  modelType: string;
  computeNeeded: number;
  inputData: any;
  status: string;
  progress: number;
  estimatedCost: number;
  actualCost?: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  result?: any;
  provider?: {
    workerId: string;
    gpuModel: string;
    gpuVram: number;
    pricePerHour: number;
  };
  user?: {
    qubicAddress: string;
    username?: string;
  };
}

export default function JobDetails() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { isConnected } = useWebSocket();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch job details
  const fetchJob = useCallback(async () => {
    if (!jobId) {
      console.error('❌ No jobId provided');
      setLoading(false);
      return;
    }
    
    try {
      console.log('🔍 Fetching job details for:', jobId);
      const res = await fetch(`/api/jobs/${jobId}`);
      console.log('📡 Response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Job loaded:', data);
        setJob(data);
      } else {
        const errorText = await res.text();
        console.error('❌ Job not found:', jobId, 'Error:', errorText);
      }
    } catch (e) {
      console.error('❌ Failed to fetch job:', e);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  // Handle real-time updates
  const handleJobUpdate = useCallback((data: any) => {
    if (data.jobId === jobId) {
      setJob(prev => prev ? {
        ...prev,
        progress: data.progress ?? prev.progress,
        status: data.status ?? prev.status,
        completedAt: data.completedAt ?? prev.completedAt,
        result: data.result ?? prev.result,
        error: data.error ?? prev.error
      } : null);
    }
  }, [jobId]);

  useJobUpdates(jobId || null, handleJobUpdate);

  // Get status display
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'PENDING': return { color: 'bg-yellow-500/20 text-yellow-400', label: 'Pending', icon: Clock };
      case 'ASSIGNED': return { color: 'bg-blue-500/20 text-blue-400', label: 'Assigned', icon: Cpu };
      case 'RUNNING': return { color: 'bg-cyan-500/20 text-cyan-400', label: 'Running', icon: Loader2 };
      case 'COMPLETED': return { color: 'bg-green-500/20 text-green-400', label: 'Completed', icon: CheckCircle };
      case 'FAILED': return { color: 'bg-red-500/20 text-red-400', label: 'Failed', icon: AlertCircle };
      default: return { color: 'bg-slate-500/20 text-slate-400', label: status, icon: Clock };
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  // Calculate duration
  const getDuration = () => {
    if (!job) return '-';
    const start = job.startedAt ? new Date(job.startedAt) : new Date(job.createdAt);
    const end = job.completedAt ? new Date(job.completedAt) : new Date();
    const diff = end.getTime() - start.getTime();
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="w-32 h-8" />
        <Skeleton className="w-full h-48" />
        <Skeleton className="w-full h-32" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Job Not Found</h2>
        <p className="text-slate-400 mb-6">The job you're looking for doesn't exist.</p>
        <button onClick={() => navigate('/app/jobs')} className="bg-cyan-500 hover:bg-cyan-600 px-6 py-2 rounded-lg">
          View All Jobs
        </button>
      </div>
    );
  }

  const statusDisplay = getStatusDisplay(job.status);
  const StatusIcon = statusDisplay.icon;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/app/jobs')} className="flex items-center gap-2 text-slate-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" /> Back to Jobs
        </button>
        <div className="flex items-center gap-3">
          {isConnected && ['PENDING', 'ASSIGNED', 'RUNNING'].includes(job.status) && (
            <span className="flex items-center gap-2 text-sm text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Live Updates
            </span>
          )}
          <button onClick={fetchJob} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
              <Zap className="w-7 h-7 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{job.modelType}</h1>
              <p className="text-sm text-slate-400">Job ID: {job.id.slice(0, 8)}...</p>
            </div>
          </div>
          <span className={`flex items-center gap-2 px-4 py-2 rounded-full ${statusDisplay.color}`}>
            <StatusIcon className={`w-5 h-5 ${job.status === 'RUNNING' ? 'animate-spin' : ''}`} />
            {statusDisplay.label}
          </span>
        </div>

        {/* Progress Bar */}
        {['PENDING', 'ASSIGNED', 'RUNNING'].includes(job.status) && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Progress</span>
              <span className="text-cyan-400 font-medium">{job.progress}%</span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                style={{ width: `${job.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">Compute Hours</div>
            <div className="font-medium">{job.computeNeeded}h</div>
          </div>
          <div className="bg-slate-900 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">Cost</div>
            <div className="font-medium text-cyan-400">
              {(job.actualCost || job.estimatedCost).toFixed(2)} QUBIC
            </div>
          </div>
          <div className="bg-slate-900 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">Duration</div>
            <div className="font-medium">{getDuration()}</div>
          </div>
          <div className="bg-slate-900 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">Created</div>
            <div className="font-medium text-sm">{formatDate(job.createdAt)}</div>
          </div>
        </div>
      </div>

      {/* Provider Info */}
      {job.provider && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" /> Assigned Provider
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Cpu className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="flex-1">
              <div className="font-medium">{job.provider.gpuModel}</div>
              <div className="text-sm text-slate-400">{job.provider.gpuVram}GB VRAM</div>
            </div>
            <div className="text-right">
              <div className="text-cyan-400 font-medium">{job.provider.pricePerHour.toFixed(2)} QUBIC/h</div>
              <div className="text-xs text-slate-400">Worker: {job.provider.workerId.slice(0, 8)}...</div>
            </div>
          </div>
        </div>
      )}

      {/* Input Data */}
      {job.inputData && Object.keys(job.inputData).length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <FileCode className="w-5 h-5 text-cyan-400" /> Input Data
          </h2>
          <pre className="bg-slate-900 rounded-lg p-4 text-sm overflow-auto max-h-48 font-mono">
            {JSON.stringify(job.inputData, null, 2)}
          </pre>
        </div>
      )}

      {/* Error */}
      {job.error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <h2 className="font-semibold mb-2 flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" /> Error
          </h2>
          <p className="text-slate-300">{job.error}</p>
        </div>
      )}

      {/* Result */}
      {job.result && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-green-400">
            <CheckCircle className="w-5 h-5" /> Result
          </h2>
          <pre className="bg-slate-900 rounded-lg p-4 text-sm overflow-auto max-h-64 font-mono">
            {JSON.stringify(job.result, null, 2)}
          </pre>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-400" /> Timeline
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <div className="flex-1">
              <div className="font-medium">Created</div>
              <div className="text-sm text-slate-400">{formatDate(job.createdAt)}</div>
            </div>
          </div>
          {job.startedAt && (
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-cyan-400" />
              <div className="flex-1">
                <div className="font-medium">Started</div>
                <div className="text-sm text-slate-400">{formatDate(job.startedAt)}</div>
              </div>
            </div>
          )}
          {job.completedAt && (
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${job.status === 'COMPLETED' ? 'bg-green-400' : 'bg-red-400'}`} />
              <div className="flex-1">
                <div className="font-medium">{job.status === 'COMPLETED' ? 'Completed' : 'Failed'}</div>
                <div className="text-sm text-slate-400">{formatDate(job.completedAt)}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate('/app/jobs/submit')}
          className="flex-1 bg-cyan-500 hover:bg-cyan-600 py-3 rounded-lg font-medium"
        >
          Submit New Job
        </button>
        <button
          onClick={() => navigate('/app/jobs')}
          className="flex-1 bg-slate-700 hover:bg-slate-600 py-3 rounded-lg font-medium"
        >
          View All Jobs
        </button>
      </div>
    </div>
  );
}
