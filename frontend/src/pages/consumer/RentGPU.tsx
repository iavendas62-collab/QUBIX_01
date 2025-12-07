/**
 * Rent GPU - Seleção de ambiente, tempo, confirmação
 * Requirements: 6.3, 6.4, 6.6 - Toast notifications, confirmation dialogs, accessibility
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Cpu, ArrowLeft, Terminal, Code, Globe, Clock, Check } from 'lucide-react';
import { notify, ConfirmDialog, SkeletonCard } from '../../components/ui';

const durations = [
  { id: '1h', label: '1 Hour', hours: 1, discount: 0 },
  { id: '4h', label: '4 Hours', hours: 4, discount: 5 },
  { id: '8h', label: '8 Hours', hours: 8, discount: 10 },
  { id: '24h', label: '1 Day', hours: 24, discount: 15 },
  { id: '72h', label: '3 Days', hours: 72, discount: 20 },
  { id: '168h', label: '1 Week', hours: 168, discount: 30 },
];

const environments = [
  { id: 'jupyter', label: 'Jupyter Notebook', icon: Globe, desc: 'Web-based Python environment' },
  { id: 'ssh', label: 'SSH Access', icon: Terminal, desc: 'Full terminal access' },
  { id: 'vscode', label: 'VS Code Server', icon: Code, desc: 'Remote VS Code in browser' },
];

export default function RentGPU() {
  const { gpuId } = useParams();
  const navigate = useNavigate();
  const [gpu, setGpu] = useState<any>(null);
  const [duration, setDuration] = useState(durations[0]);
  const [environment, setEnvironment] = useState('jupyter');
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    fetchGpu();
  }, [gpuId]);

  const fetchGpu = async () => {
    try {
      console.log('🔍 Loading GPU details for:', gpuId);
      
      // Try to get specific GPU first
      let res = await fetch(`/api/providers/${gpuId}`);
      if (res.ok) {
        const data = await res.json();
        console.log('✅ GPU loaded:', data);
        setGpu(data);
        setPageLoading(false);
        return;
      }
      
      // Fallback: get all GPUs and find by ID
      res = await fetch('/api/gpus');
      if (res.ok) {
        const data = await res.json();
        const foundGpu = data.find((g: any) => g.id === gpuId || g.id === `dynamic-${gpuId}`);
        console.log('✅ GPU found in list:', foundGpu);
        setGpu(foundGpu);
      }
    } catch (e) { 
      console.error('❌ Error loading GPU:', e);
      notify.error('Failed to load GPU details');
    } finally {
      setPageLoading(false);
    }
  };

  const basePrice = gpu ? gpu.price * duration.hours : 0;
  const discount = basePrice * (duration.discount / 100);
  const totalPrice = basePrice - discount;

  const handleRentClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmRent = async () => {
    setShowConfirmDialog(false);
    setLoading(true);
    
    const loadingToast = notify.loading('Processing your rental...');
    
    try {
      console.log('💳 Processing rental for GPU:', gpu.id);
      
      // For MVP: Redirect directly to job submission
      // In production, this would create escrow and rental record
      
      notify.dismiss(loadingToast);
      notify.success(`GPU reserved! Now submit your job.`);
      
      // Redirect to job submission with GPU pre-selected
      navigate(`/app/jobs/submit?gpuId=${gpu.id}`);
      
    } catch (e) {
      console.error('❌ Rental error:', e);
      notify.dismiss(loadingToast);
      notify.error('Failed to rent GPU. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6" role="status" aria-label="Loading GPU details">
        <SkeletonCard />
        <SkeletonCard />
        <span className="sr-only">Loading GPU rental page...</span>
      </div>
    );
  }

  if (!gpu) {
    return (
      <div className="text-center py-12" role="alert">
        <p className="text-slate-400">GPU not found</p>
        <button 
          onClick={() => navigate('/app/marketplace')}
          className="mt-4 text-cyan-400 hover:text-cyan-300"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmRent}
        title="Confirm GPU Rental"
        message={`You are about to rent ${gpu.model} for ${duration.label}. This will charge ${totalPrice.toFixed(2)} QUBIC from your wallet. Do you want to proceed?`}
        confirmText="Confirm & Pay"
        cancelText="Cancel"
        variant="warning"
        isLoading={loading}
      />

      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-slate-400 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-500 rounded px-2 py-1"
        aria-label="Go back to previous page"
      >
        <ArrowLeft className="w-5 h-5" aria-hidden="true" /> Back
      </button>

      <h1 className="text-2xl font-bold" id="rent-gpu-title">Rent {gpu.model}</h1>

      {/* GPU Summary */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-4">
        <Cpu className="w-12 h-12 text-cyan-400" />
        <div>
          <div className="font-semibold">{gpu.model}</div>
          <div className="text-sm text-slate-400">{gpu.vram}GB VRAM • {gpu.location}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-xl font-bold text-cyan-400">{gpu.price} QUBIC</div>
          <div className="text-sm text-slate-400">/hour</div>
        </div>
      </div>

      {/* Duration */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Clock className="w-5 h-5" /> Duration</h2>
        <div className="grid grid-cols-3 gap-3">
          {durations.map(d => (
            <button
              key={d.id}
              onClick={() => setDuration(d)}
              className={`p-4 rounded-lg border-2 transition-colors ${
                duration.id === d.id ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-600 hover:border-slate-500'
              }`}
            >
              <div className="font-semibold">{d.label}</div>
              {d.discount > 0 && <div className="text-sm text-green-400">-{d.discount}% off</div>}
            </button>
          ))}
        </div>
      </div>

      {/* Environment */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="font-semibold mb-4">Environment</h2>
        <div className="grid grid-cols-3 gap-3">
          {environments.map(env => (
            <button
              key={env.id}
              onClick={() => setEnvironment(env.id)}
              className={`p-4 rounded-lg border-2 transition-colors text-left ${
                environment === env.id ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-600 hover:border-slate-500'
              }`}
            >
              <env.icon className="w-6 h-6 text-cyan-400 mb-2" />
              <div className="font-semibold">{env.label}</div>
              <div className="text-sm text-slate-400">{env.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Summary & Confirm */}
      <section className="bg-slate-800 border border-cyan-500/30 rounded-xl p-6" aria-labelledby="order-summary-heading">
        <h2 id="order-summary-heading" className="font-semibold mb-4">Order Summary</h2>
        <dl className="space-y-2 mb-4">
          <div className="flex justify-between">
            <dt className="text-slate-400">Base Price</dt>
            <dd>{basePrice.toFixed(2)} QUBIC</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-400">
              <dt>Discount ({duration.discount}%)</dt>
              <dd>-{discount.toFixed(2)} QUBIC</dd>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-700">
            <dt>Total</dt>
            <dd className="text-cyan-400">{totalPrice.toFixed(2)} QUBIC</dd>
          </div>
        </dl>
        <button
          onClick={handleRentClick}
          disabled={loading}
          aria-label={`Confirm and pay ${totalPrice.toFixed(2)} QUBIC for ${gpu.model} rental`}
          className="w-full bg-cyan-500 hover:bg-cyan-600 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 transition-colors"
        >
          {loading ? (
            <>
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" aria-hidden="true" />
              Processing...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" aria-hidden="true" /> Confirm & Pay
            </>
          )}
        </button>
      </section>
    </div>
  );
}

