/**
 * JobMonitor Demo Page
 * 
 * Demonstrates the JobMonitor component with a sample job
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity } from 'lucide-react';
import JobMonitor from '../components/JobMonitor';

export default function JobMonitorDemo() {
  const navigate = useNavigate();
  const [jobId, setJobId] = useState('');
  const [showMonitor, setShowMonitor] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (jobId.trim()) {
      setShowMonitor(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Activity className="w-8 h-8 text-cyan-400" />
                JobMonitor Demo
              </h1>
              <p className="text-slate-400 mt-1">
                Real-time job monitoring dashboard with live metrics
              </p>
            </div>
          </div>
        </div>

        {!showMonitor ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
              <h2 className="text-xl font-bold mb-4">Enter Job ID</h2>
              <p className="text-slate-400 mb-6">
                Enter a job ID to monitor its progress in real-time. The dashboard will show
                live GPU metrics, log streaming, and progress updates via WebSocket.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Job ID
                  </label>
                  <input
                    type="text"
                    value={jobId}
                    onChange={(e) => setJobId(e.target.value)}
                    placeholder="Enter job ID (e.g., abc123...)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 py-3 rounded-lg font-medium"
                >
                  Start Monitoring
                </button>
              </form>

              <div className="mt-8 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                <h3 className="font-semibold text-cyan-400 mb-2">Features:</h3>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• 3-column layout: Job info | Live metrics | Log stream</li>
                  <li>• Real-time GPU metrics with animated charts</li>
                  <li>• Live log streaming with auto-scroll</li>
                  <li>• Progress bar and time remaining</li>
                  <li>• WebSocket subscription for updates</li>
                  <li>• Action buttons (pause, stop, extend)</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={() => setShowMonitor(false)}
                className="flex items-center gap-2 text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Job Selection
              </button>
            </div>

            <JobMonitor jobId={jobId} />
          </div>
        )}
      </div>
    </div>
  );
}
