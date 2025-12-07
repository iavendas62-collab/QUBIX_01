/**
 * Instance Details - Status, acesso, métricas, controles
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Server, ArrowLeft, Terminal, ExternalLink, Clock, Square, RefreshCw, Activity, Cpu, HardDrive, Send, Play } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function InstanceDetails() {
  const { instanceId } = useParams();
  const navigate = useNavigate();
  const [instance, setInstance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstance();
    const interval = setInterval(fetchInstance, 10000);
    return () => clearInterval(interval);
  }, [instanceId]);

  const fetchInstance = async () => {
    try {
      const res = await fetch('/api/api/rentals/active');
      if (res.ok) {
        const data = await res.json();
        const found = data.find((r: any) => r.instanceId === instanceId);
        setInstance(found);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleStop = async () => {
    try {
      await fetch(`/api/api/rentals/${instanceId}/cancel`, { method: 'POST' });
      toast.success('Instance stopped');
      navigate('/app/instances');
    } catch (e) {
      toast.error('Failed to stop instance');
    }
  };

  const getTimeRemaining = (endTime: string) => {
    const diff = new Date(endTime).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${mins}m`;
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!instance) return <div className="text-center py-12">Instance not found</div>;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/app/instances')} className="flex items-center gap-2 text-slate-400 hover:text-white">
        <ArrowLeft className="w-5 h-5" /> Back to Instances
      </button>

      {/* Header */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-cyan-500/20 rounded-xl flex items-center justify-center">
              <Server className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{instance.gpuModel}</h1>
              <div className="flex items-center gap-4 text-slate-400 mt-1">
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {getTimeRemaining(instance.endTime)} remaining</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  instance.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                }`}>
                  {instance.status === 'active' ? 'Running' : instance.status}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleStop}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-medium"
          >
            <Square className="w-5 h-5" /> Stop Instance
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Access */}
        <div className="col-span-2 space-y-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="font-semibold mb-4">Access</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">Environment</label>
                <div className="text-lg font-medium capitalize">{instance.environment}</div>
              </div>
              
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate(`/app/jobs/submit?providerId=${instance.providerId}&instanceId=${instanceId}`)}
                  className="bg-cyan-500 hover:bg-cyan-600 px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" /> Submit Job
                </button>
                <button
                  onClick={() => navigate('/app/jobs')}
                  className="bg-slate-700 hover:bg-slate-600 px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" /> View Jobs
                </button>
              </div>

              {/* Info about access */}
              <div className="bg-slate-900 rounded-lg p-4">
                <p className="text-sm text-slate-400 mb-2">
                  <strong className="text-white">How to use your GPU:</strong>
                </p>
                <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
                  <li>Click "Submit Job" to run AI inference tasks</li>
                  <li>Supported models: LLaMA, Stable Diffusion, Whisper</li>
                  <li>Jobs are processed on the rented GPU</li>
                  <li>View results in the Jobs page</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><Activity className="w-5 h-5" /> Metrics</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-2"><Cpu className="w-4 h-4" /> GPU Usage</div>
                <div className="text-2xl font-bold text-cyan-400">45%</div>
              </div>
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-2"><Activity className="w-4 h-4" /> CPU Usage</div>
                <div className="text-2xl font-bold text-blue-400">23%</div>
              </div>
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-2"><HardDrive className="w-4 h-4" /> Memory</div>
                <div className="text-2xl font-bold text-purple-400">8.2 GB</div>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="font-semibold mb-4">Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Instance ID</span><span className="font-mono">{instance.instanceId}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Duration</span><span>{instance.duration}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Total Cost</span><span className="text-cyan-400">{instance.totalCost} QUBIC</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Started</span><span>{new Date(instance.startTime).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Ends</span><span>{new Date(instance.endTime).toLocaleString()}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
