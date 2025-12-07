import { QuickProvider } from '../components/QuickProvider';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function QuickProviderDemo() {
  const navigate = useNavigate();

  const handleSuccess = (provider: any) => {
    console.log('Provider registered successfully:', provider);
    // Navigate to provider dashboard after successful registration
    setTimeout(() => {
      navigate('/provider/dashboard');
    }, 2000);
  };

  const handleError = (error: Error) => {
    console.error('Provider registration error:', error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Share Your GPU & <span className="text-cyan-400">Earn QUBIC</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Join the QUBIX network in seconds. Our one-click registration automatically detects your hardware
            and gets you earning immediately.
          </p>
        </div>
      </div>

      {/* QuickProvider Component */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <QuickProvider onSuccess={handleSuccess} onError={handleError} />

        {/* Additional Info */}
        <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-slate-900/50 border border-cyan-500/30 rounded-lg p-6 text-center">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-semibold mb-2 text-cyan-400">Instant Setup</h3>
            <p className="text-sm text-gray-400">
              No complex configuration. Click once and you're ready to earn.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-cyan-500/30 rounded-lg p-6 text-center">
            <div className="text-3xl mb-2">💰</div>
            <h3 className="font-semibold mb-2 text-cyan-400">Earn While Idle</h3>
            <p className="text-sm text-gray-400">
              Your GPU earns QUBIC tokens automatically when not in use.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-cyan-500/30 rounded-lg p-6 text-center">
            <div className="text-3xl mb-2">🔒</div>
            <h3 className="font-semibold mb-2 text-cyan-400">Secure & Private</h3>
            <p className="text-sm text-gray-400">
              Your data stays private. Payments secured by Qubic blockchain.
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <details className="bg-slate-900/50 border border-cyan-500/30 rounded-lg p-6">
              <summary className="font-semibold cursor-pointer text-cyan-400">
                What hardware do I need?
              </summary>
              <p className="mt-3 text-gray-400 text-sm">
                Any modern GPU works! We support NVIDIA, AMD, and Intel GPUs. The more powerful your GPU,
                the more you can earn.
              </p>
            </details>

            <details className="bg-slate-900/50 border border-cyan-500/30 rounded-lg p-6">
              <summary className="font-semibold cursor-pointer text-cyan-400">
                How much can I earn?
              </summary>
              <p className="mt-3 text-gray-400 text-sm">
                Earnings depend on your GPU model and utilization. High-end GPUs (RTX 4090, A100) can earn
                2-5 QUBIC per hour, while mid-range GPUs earn 0.5-2 QUBIC per hour.
              </p>
            </details>

            <details className="bg-slate-900/50 border border-cyan-500/30 rounded-lg p-6">
              <summary className="font-semibold cursor-pointer text-cyan-400">
                Is it safe?
              </summary>
              <p className="mt-3 text-gray-400 text-sm">
                Yes! Jobs run in isolated environments and can't access your personal data. You can stop
                sharing at any time. All payments are secured by the Qubic blockchain.
              </p>
            </details>

            <details className="bg-slate-900/50 border border-cyan-500/30 rounded-lg p-6">
              <summary className="font-semibold cursor-pointer text-cyan-400">
                What if browser detection doesn't work?
              </summary>
              <p className="mt-3 text-gray-400 text-sm">
                If browser-based detection fails, we'll automatically download a lightweight native worker
                that provides full GPU access and better performance.
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}

