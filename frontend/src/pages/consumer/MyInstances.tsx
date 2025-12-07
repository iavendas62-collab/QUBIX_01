/**
 * My Instances Page
 * Shows user's jobs with correct information
 */
import React, { useState, useEffect } from 'react';
import { Server, Plus, RefreshCw, Eye } from 'lucide-react';

interface Job {
  id: string;
  modelType: string;
  status: string;
  progress: number;
  computeNeeded: number;
  estimatedCost: number;
  actualCost?: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  provider?: {
    id: string;
    workerId: string;
    gpuModel: string;
    gpuVram: number;
    pricePerHour: number;
  };
}

// Simple component without router hooks - navigation handled by window.location
export default function MyInstances() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get user Qubic address
  const qubicAddress = localStorage.getItem('qubicAddress') ||
    'DEMO_CONSUMER_ADDRESS_QUBIC_HACKATHON_2024_LABLAB';

  // Fetch jobs
  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📋 Fetching jobs for user:', qubicAddress.slice(0, 10) + '...');

      const res = await fetch(`/api/jobs/user/${qubicAddress}`);

      if (res.ok) {
        const data = await res.json();
        console.log('✅ Jobs loaded:', data);
        setJobs(Array.isArray(data) ? data : []);
      } else {
        console.error('❌ Failed to load jobs:', res.status);
        setError('Failed to load jobs');
      }
    } catch (error) {
      console.error('❌ Error fetching jobs:', error);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [qubicAddress]);

  // Navigation functions using window.location instead of useNavigate
  const handleNavigate = (path: string) => {
    window.location.href = path;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Instances</h1>
        </div>
        <div className="text-center py-12">
          <div className="text-slate-400">Loading instances...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Instances</h1>
        </div>
        <div className="text-center py-12">
          <div className="text-red-400 mb-4">{error}</div>
          <button
            onClick={fetchJobs}
            className="bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Instances</h1>
          <p className="text-slate-400 text-sm mt-1">
            {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchJobs}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => handleNavigate('/app/jobs/submit')}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Launch New Instance
          </button>
        </div>
      </div>

      {/* Jobs Grid */}
      {jobs.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
          <Server className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No instances yet</h3>
          <p className="text-slate-400 mb-6">
            Launch your first GPU instance to get started
          </p>
          <button
            onClick={() => handleNavigate('/app/jobs/submit')}
            className="bg-cyan-500 hover:bg-cyan-600 px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Launch Instance
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {jobs.map(job => (
            <div
              key={job.id}
              className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">{job.modelType}</h3>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  job.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                  job.status === 'RUNNING' ? 'bg-cyan-500/20 text-cyan-400' :
                  job.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {job.status}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="text-sm text-slate-400">
                  ID: {job.id.slice(0, 8)}...
                </div>
                <div className="text-sm">
                  <span className="text-slate-400">Compute:</span> {job.computeNeeded}h
                </div>
                <div className="text-sm">
                  <span className="text-slate-400">Cost:</span> {(job.actualCost || job.estimatedCost || 0).toFixed(2)} QUBIC
                </div>
                {job.provider && (
                  <div className="text-sm">
                    <span className="text-slate-400">GPU:</span> {job.provider.gpuModel}
                  </div>
                )}
              </div>

              <button
                onClick={() => handleNavigate(`/app/jobs/${job.id}`)}
                className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 py-2 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
