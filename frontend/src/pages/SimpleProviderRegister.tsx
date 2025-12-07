/**
 * Simple Provider Registration - Manual Form
 * No auto-detection, no complexity, just works
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { notify } from '../components/ui';
import { Cpu, HardDrive, DollarSign, MapPin, Loader2, CheckCircle } from 'lucide-react';

const API_BASE = '/api';

export default function SimpleProviderRegister() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    gpuModel: 'NVIDIA RTX 4090',
    gpuVram: '24',
    cpuCores: '16',
    ramTotal: '64',
    pricePerHour: '2.0',
    location: 'São Paulo, Brazil'
  });

  const handleAutoDetect = async () => {
    setDetecting(true);
    try {
      console.log('🔍 Auto-detecting hardware...');
      console.log('Calling: /api/hardware/detect');
      
      const response = await fetch('/api/hardware/detect');
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Detection failed');
      }

      if (!data.detected) {
        notify.error('No NVIDIA GPU detected. Please fill manually.');
        setDetecting(false);
        return;
      }

      console.log('✅ Hardware detected:', data.hardware);
      
      // Fill form with detected data
      setFormData(prev => ({
        ...prev,
        gpuModel: data.hardware.gpu_model,
        gpuVram: data.hardware.gpu_vram_gb.toString()
      }));

      notify.success(`Detected: ${data.hardware.gpu_model}`);

      // Auto-submit after detection
      setTimeout(() => {
        handleAutoSubmit(data.hardware);
      }, 1000);

    } catch (error: any) {
      console.error('❌ Detection error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      notify.error(`Erro ao detectar hardware. ${error.message || 'Tente novamente'}`);
      setDetecting(false);
    }
  };

  const handleAutoSubmit = async (hardware: any) => {
    try {
      const workerId = `provider-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      // Use real Qubic testnet address
      const qubicAddress = 'UAMAPGGABWCLVDPYOTPNZKAQTYCBBAATSSQKCCVQTARSGSJWFRFVPJYCZQDE';

      const requestBody = {
        type: 'browser',
        workerId,
        qubicAddress,
        gpu: {
          model: hardware.gpu_model,
          type: 'native',
          vram: hardware.gpu_vram_gb,
          vendor: 'NVIDIA'
        },
        cpu: {
          cores: 8,
          model: '8-core CPU'
        },
        ram: {
          total: 16
        },
        location: 'Local Machine',
        pricePerHour: 0.5
      };

      console.log('📤 Auto-registering provider:', requestBody);

      const response = await fetch('/api/providers/quick-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Registration failed');
      }

      console.log('✅ Provider registered:', data.provider);
      
      localStorage.setItem('providerId', data.provider.id);
      localStorage.setItem('workerId', workerId);
      localStorage.setItem('qubicAddress', qubicAddress);

      setSuccess(true);
      notify.success('GPU registered successfully!');

      // Redirect to provider dashboard
      setTimeout(() => {
        navigate('/app/provider/dashboard');
      }, 1500);

    } catch (error: any) {
      console.error('❌ Auto-registration error:', error);
      notify.error(error.message || 'Failed to register provider');
      setDetecting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate unique worker ID
      const workerId = `provider-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Use real Qubic testnet address
      const qubicAddress = 'UAMAPGGABWCLVDPYOTPNZKAQTYCBBAATSSQKCCVQTARSGSJWFRFVPJYCZQDE';

      const requestBody = {
        type: 'browser',
        workerId,
        qubicAddress,
        gpu: {
          model: formData.gpuModel,
          type: 'native',
          vram: parseFloat(formData.gpuVram),
          vendor: formData.gpuModel.includes('NVIDIA') ? 'NVIDIA' : 
                  formData.gpuModel.includes('AMD') ? 'AMD' : 'Unknown'
        },
        cpu: {
          cores: parseInt(formData.cpuCores),
          model: `${formData.cpuCores}-core CPU`
        },
        ram: {
          total: parseFloat(formData.ramTotal)
        },
        location: formData.location,
        pricePerHour: parseFloat(formData.pricePerHour)
      };

      console.log('📤 Registering provider:', requestBody);

      const response = await fetch(`${API_BASE}/api/providers/quick-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Registration failed');
      }

      console.log('✅ Provider registered:', data.provider);
      
      // Store provider info
      localStorage.setItem('providerId', data.provider.id);
      localStorage.setItem('workerId', workerId);
      localStorage.setItem('qubicAddress', qubicAddress);

      setSuccess(true);
      notify.success('GPU registered successfully!');

      // Redirect to marketplace after 2 seconds
      setTimeout(() => {
        navigate('/app/marketplace');
      }, 2000);

    } catch (error: any) {
      console.error('❌ Registration error:', error);
      notify.error(error.message || 'Failed to register provider');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Success!</h2>
              <p className="text-slate-400 mb-4">
                Your GPU has been registered and is now available in the marketplace.
              </p>
              <p className="text-sm text-slate-500">
                Redirecting to marketplace...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Share Your GPU
          </h1>
          <p className="text-slate-400 text-lg">
            List your hardware on the marketplace and start earning QUBIC tokens
          </p>
        </div>

        <Card className="border-slate-800 shadow-2xl">
          <CardHeader className="border-b border-slate-800">
            <CardTitle className="text-2xl text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              Hardware Details
            </CardTitle>
            <p className="text-slate-400 text-sm mt-2">
              Fill in your specifications below
            </p>
          </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* GPU Model */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                GPU Model
              </label>
              <select
                value={formData.gpuModel}
                onChange={(e) => handleChange('gpuModel', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                required
              >
                <option value="NVIDIA RTX 4090">NVIDIA RTX 4090</option>
                <option value="NVIDIA RTX 4080">NVIDIA RTX 4080</option>
                <option value="NVIDIA RTX 3090">NVIDIA RTX 3090</option>
                <option value="NVIDIA RTX 3080">NVIDIA RTX 3080</option>
                <option value="NVIDIA A100">NVIDIA A100</option>
                <option value="NVIDIA H100">NVIDIA H100</option>
                <option value="AMD Radeon RX 7900 XTX">AMD Radeon RX 7900 XTX</option>
                <option value="AMD Radeon RX 6900 XT">AMD Radeon RX 6900 XT</option>
              </select>
            </div>

            {/* GPU VRAM */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <HardDrive className="w-4 h-4 text-cyan-400" />
                GPU VRAM (GB)
              </label>
              <input
                type="number"
                value={formData.gpuVram}
                onChange={(e) => handleChange('gpuVram', e.target.value)}
                min="4"
                max="80"
                step="1"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>

            {/* CPU Cores */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                CPU Cores
              </label>
              <input
                type="number"
                value={formData.cpuCores}
                onChange={(e) => handleChange('cpuCores', e.target.value)}
                min="1"
                max="128"
                step="1"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>

            {/* RAM Total */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <HardDrive className="w-4 h-4 text-cyan-400" />
                Total RAM (GB)
              </label>
              <input
                type="number"
                value={formData.ramTotal}
                onChange={(e) => handleChange('ramTotal', e.target.value)}
                min="8"
                max="512"
                step="1"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>

            {/* Price Per Hour */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <DollarSign className="w-4 h-4 text-cyan-400" />
                Price Per Hour (QUBIC)
              </label>
              <input
                type="number"
                value={formData.pricePerHour}
                onChange={(e) => handleChange('pricePerHour', e.target.value)}
                min="0.1"
                max="100"
                step="0.1"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Recommended: $0.5 - $5.0 QUBIC/hour depending on GPU
              </p>
            </div>

            {/* Location */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="e.g., São Paulo, Brazil"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>

            {/* Auto-Detect Button */}
            <div className="pt-4">
              <Button
                type="button"
                onClick={handleAutoDetect}
                disabled={detecting || loading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {detecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Detecting & Registering...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Auto-Detect & Register
                  </>
                )}
              </Button>
              <p className="text-xs text-slate-500 text-center mt-2">
                Automatically detect your GPU and register it
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-500">Or fill manually</span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/app/marketplace')}
                className="flex-1"
                disabled={loading || detecting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || detecting}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Register Manually'
                )}
              </Button>
            </div>
          </form>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
            <p className="text-sm text-cyan-300">
              💡 <strong>Note:</strong> This is a simplified registration for MVP testing. 
              Your GPU will be listed in the marketplace immediately after registration.
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
