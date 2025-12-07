/**
 * GPU Details - Especificações, preço, provider, benchmark
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Cpu, Star, MapPin, Play, ArrowLeft, Zap, Clock, Shield } from 'lucide-react';

export default function GPUDetails() {
  const { gpuId } = useParams();
  const navigate = useNavigate();
  const [gpu, setGpu] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGpu();
  }, [gpuId]);

  const fetchGpu = async () => {
    try {
      const res = await fetch('/api/api/gpus');
      if (res.ok) {
        const data = await res.json();
        const found = data.find((g: any) => g.id === gpuId);
        setGpu(found || null);
      }
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!gpu) return <div className="text-center py-12">GPU not found</div>;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white">
        <ArrowLeft className="w-5 h-5" /> Back to Marketplace
      </button>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="col-span-2 space-y-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center">
                <Cpu className="w-12 h-12 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{gpu.model}</h1>
                <div className="flex items-center gap-4 text-slate-400">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {gpu.location}</span>
                  <span className="flex items-center gap-1 text-yellow-400"><Star className="w-4 h-4 fill-current" /> {gpu.rating}</span>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm ${gpu.available ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {gpu.available ? 'Available' : 'In Use'}
              </div>
            </div>
          </div>

          {/* Specs */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Specifications</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="text-sm text-slate-400">VRAM</div>
                <div className="text-xl font-bold">{gpu.vram} GB</div>
              </div>
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="text-sm text-slate-400">Performance</div>
                <div className="text-xl font-bold flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-400" /> High</div>
              </div>
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="text-sm text-slate-400">Uptime</div>
                <div className="text-xl font-bold">99.9%</div>
              </div>
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="text-sm text-slate-400">Provider</div>
                <div className="text-xl font-bold">{gpu.provider?.slice(0, 12)}...</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="space-y-6">
          <div className="bg-slate-800 border border-cyan-500/30 rounded-xl p-6">
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-cyan-400">{gpu.price} QUBIC</div>
              <div className="text-slate-400">per hour</div>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Clock className="w-4 h-4 text-cyan-400" /> Instant provisioning
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Shield className="w-4 h-4 text-cyan-400" /> Secure payment via Qubic
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Zap className="w-4 h-4 text-cyan-400" /> SSH, Jupyter, VS Code access
              </div>
            </div>
            <button
              onClick={() => navigate(`/app/rent/${gpu.id}`)}
              disabled={!gpu.available}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-colors ${
                gpu.available ? 'bg-cyan-500 hover:bg-cyan-600' : 'bg-slate-600 cursor-not-allowed'
              }`}
            >
              <Play className="w-5 h-5" />
              {gpu.available ? 'Rent Now' : 'Not Available'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
