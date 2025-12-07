import { useState } from 'react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Cpu, HardDrive, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { notify } from './ui';

// TypeScript interfaces
export interface GPUInfo {
  vendor?: string;
  model?: string;
  renderer?: string;
  architecture?: string;
  device?: string;
  description?: string;
  vram?: number;
  type: 'webgpu' | 'webgl' | 'native';
}

export interface CPUInfo {
  model?: string;
  cores?: number;
}

export interface RAMInfo {
  total?: number;
}

export interface QuickProviderProps {
  onSuccess?: (provider: any) => void;
  onError?: (error: Error) => void;
}

type ProviderStatus = 'idle' | 'detecting' | 'downloading' | 'installing' | 'registering' | 'online' | 'error';

interface QuickProviderState {
  status: ProviderStatus;
  progress: number;
  gpuInfo: GPUInfo | null;
  cpuInfo: CPUInfo | null;
  ramInfo: RAMInfo | null;
  error: string | null;
  workerId: string | null;
}

const API_BASE = '/api';

export function QuickProvider({ onSuccess, onError }: QuickProviderProps) {
  const [state, setState] = useState<QuickProviderState>({
    status: 'idle',
    progress: 0,
    gpuInfo: null,
    cpuInfo: null,
    ramInfo: null,
    error: null,
    workerId: null
  });

  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Generate unique worker ID
  const generateWorkerId = (): string => {
    return `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Detect operating system
  const detectOS = (): 'windows' | 'macos' | 'linux' | 'unknown' => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('win')) return 'windows';
    if (userAgent.includes('mac')) return 'macos';
    if (userAgent.includes('linux')) return 'linux';
    return 'unknown';
  };

  // Detect GPU using WebGPU API
  const detectGPUWebGPU = async (): Promise<GPUInfo | null> => {
    try {
      if (!('gpu' in navigator)) {
        console.log('WebGPU not supported');
        return null;
      }

      const adapter = await (navigator as any).gpu.requestAdapter();
      if (!adapter) {
        console.log('No WebGPU adapter found');
        return null;
      }

      const info = await adapter.requestAdapterInfo();
      
      return {
        vendor: info.vendor || 'Unknown',
        architecture: info.architecture || 'Unknown',
        device: info.device || 'Unknown',
        description: info.description || 'Unknown',
        model: info.description || info.device || 'Unknown GPU',
        type: 'webgpu'
      };
    } catch (error) {
      console.error('WebGPU detection error:', error);
      return null;
    }
  };

  // Fallback: Detect GPU using WebGL
  const detectGPUWebGL = (): GPUInfo | null => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) {
        console.log('WebGL not supported');
        return null;
      }

      const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) {
        return {
          renderer: 'WebGL Supported',
          model: 'WebGL GPU',
          type: 'webgl'
        };
      }

      const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      const vendor = (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);

      return {
        vendor: vendor || 'Unknown',
        renderer: renderer || 'Unknown',
        model: renderer || 'Unknown GPU',
        type: 'webgl'
      };
    } catch (error) {
      console.error('WebGL detection error:', error);
      return null;
    }
  };

  // Detect CPU information (limited in browser)
  const detectCPU = (): CPUInfo => {
    const cores = navigator.hardwareConcurrency || 1;
    return {
      cores,
      model: `${cores}-core CPU`
    };
  };

  // Detect RAM information (limited in browser)
  const detectRAM = (): RAMInfo => {
    // @ts-ignore - deviceMemory is experimental
    const memory = navigator.deviceMemory;
    return {
      total: memory || undefined
    };
  };

  // Attempt browser-based GPU detection
  const detectGPUBrowser = async (): Promise<GPUInfo | null> => {
    setState(prev => ({ ...prev, status: 'detecting', progress: 20 }));

    // Try WebGPU first
    let gpuInfo = await detectGPUWebGPU();
    
    if (!gpuInfo) {
      // Fallback to WebGL
      setState(prev => ({ ...prev, progress: 40 }));
      gpuInfo = detectGPUWebGL();
    }

    if (gpuInfo) {
      setState(prev => ({ ...prev, progress: 60, gpuInfo }));
    }

    return gpuInfo;
  };

  // Register browser-based provider
  const registerBrowserGPU = async (gpuInfo: GPUInfo, cpuInfo: CPUInfo, ramInfo: RAMInfo): Promise<void> => {
    setState(prev => ({ ...prev, status: 'registering', progress: 70 }));

    const workerId = generateWorkerId();
    
    // Get Qubic address from localStorage (set during login/registration)
    // For MVP testing, generate a mock address if not found
    let qubicAddress = localStorage.getItem('qubicAddress');
    if (!qubicAddress) {
      // Generate mock Qubic address for testing (60 uppercase letters)
      // Format: QUBICTEST + random uppercase letters to make 60 chars total
      const randomPart = Array.from({ length: 50 }, () => 
        String.fromCharCode(65 + Math.floor(Math.random() * 26))
      ).join('');
      qubicAddress = 'QUBICTEST' + randomPart; // 10 + 50 = 60 chars
      console.log('⚠️ Using mock Qubic address for testing:', qubicAddress);
      // Store it for future use
      localStorage.setItem('qubicAddress', qubicAddress);
    }

    try {
      console.log('📤 Sending registration request...');
      console.log('   Worker ID:', workerId);
      console.log('   Qubic Address:', qubicAddress);
      console.log('   GPU:', gpuInfo);
      console.log('   CPU:', cpuInfo);
      console.log('   RAM:', ramInfo);

      const requestBody = {
        type: 'browser',
        workerId,
        qubicAddress,
        gpu: gpuInfo,
        cpu: cpuInfo,
        ram: ramInfo,
        location: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      console.log('   Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${API_BASE}/api/providers/quick-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Registration error:', errorData);
        throw new Error(errorData.error || `Registration failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Registration response:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Registration failed');
      }

      setState(prev => ({ 
        ...prev, 
        status: 'online', 
        progress: 100,
        workerId,
        error: null
      }));

      // Store workerId for future use
      localStorage.setItem('workerId', workerId);

      notify.success('Successfully registered as GPU provider!');
      
      if (onSuccess) {
        onSuccess(data.provider);
      }
    } catch (error: any) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  };

  // Download and install native worker
  const downloadAndInstallWorker = async (): Promise<void> => {
    setState(prev => ({ ...prev, status: 'downloading', progress: 30 }));

    const os = detectOS();
    
    if (os === 'unknown') {
      throw new Error('Unable to detect operating system');
    }

    // Determine installer filename based on OS
    const installerMap = {
      windows: 'qubix-worker-installer.bat',
      macos: 'qubix-worker-installer.sh',
      linux: 'qubix-worker-installer.sh'
    };

    const installerFile = installerMap[os];
    
    try {
      // Download installer from backend with embedded worker code
      const backendUrl = encodeURIComponent(API_BASE);
      const response = await fetch(`${API_BASE}/api/installer/${os}?backend=${backendUrl}`);
      
      if (!response.ok) {
        throw new Error(`Failed to download installer: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = installerFile;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setState(prev => ({ ...prev, status: 'installing', progress: 60 }));

      // Show instructions to user
      const instructions = os === 'windows' 
        ? `Installer downloaded! Please run ${installerFile} to complete setup.`
        : `Installer downloaded! Open terminal, run: chmod +x ${installerFile} && ./${installerFile}`;
      
      notify.success(instructions, { duration: 15000 });

      // Poll for worker registration
      await pollForWorkerRegistration();
    } catch (error: any) {
      throw new Error(`Worker installation failed: ${error.message}`);
    }
  };

  // Poll for worker registration confirmation
  const pollForWorkerRegistration = async (): Promise<void> => {
    const maxAttempts = 60; // 5 minutes (5 second intervals)
    let attempts = 0;

    const poll = async (): Promise<boolean> => {
      try {
        const response = await fetch(`${API_BASE}/api/providers/check-new`);
        if (response.ok) {
          const data = await response.json();
          if (data.newProvider) {
            setState(prev => ({ 
              ...prev, 
              status: 'online', 
              progress: 100,
              workerId: data.newProvider.workerId
            }));
            
            localStorage.setItem('workerId', data.newProvider.workerId);
            notify.success('Worker successfully registered!');
            
            if (onSuccess) {
              onSuccess(data.newProvider);
            }
            
            return true;
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
      return false;
    };

    const interval = setInterval(async () => {
      attempts++;
      
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setState(prev => ({ 
          ...prev, 
          status: 'error',
          error: 'Worker registration timeout. Please check if the installer ran successfully.'
        }));
        return;
      }

      const registered = await poll();
      if (registered) {
        clearInterval(interval);
      }
    }, 5000);
  };

  // Main registration flow
  const handleShareGPU = async () => {
    try {
      setRetryCount(0);
      setState(prev => ({ ...prev, error: null, progress: 0 }));

      // Detect CPU and RAM
      const cpuInfo = detectCPU();
      const ramInfo = detectRAM();
      
      setState(prev => ({ ...prev, cpuInfo, ramInfo, progress: 10 }));

      // Try browser-based detection first
      const gpuInfo = await detectGPUBrowser();

      if (gpuInfo) {
        // Register with browser-detected GPU
        await registerBrowserGPU(gpuInfo, cpuInfo, ramInfo);
      } else {
        // Fallback to native worker installation
        notify.info('Browser GPU detection unavailable. Downloading native worker...', {
          duration: 4000
        });
        await downloadAndInstallWorker();
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      setState(prev => ({ 
        ...prev, 
        status: 'error',
        error: error.message,
        progress: 0
      }));

      notify.error(error.message);
      
      if (onError) {
        onError(error);
      }
    }
  };

  // Retry registration
  const handleRetry = () => {
    if (retryCount < MAX_RETRIES) {
      setRetryCount(prev => prev + 1);
      handleShareGPU();
    } else {
      notify.error('Maximum retry attempts reached. Please try again later.');
    }
  };

  // Status icon component
  const StatusIcon = () => {
    switch (state.status) {
      case 'detecting':
      case 'downloading':
      case 'installing':
      case 'registering':
        return <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />;
      case 'online':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Cpu className="w-6 h-6 text-cyan-500" />;
    }
  };

  // Status message
  const getStatusMessage = (): string => {
    switch (state.status) {
      case 'idle':
        return 'Ready to share your GPU';
      case 'detecting':
        return 'Detecting GPU hardware...';
      case 'downloading':
        return 'Downloading native worker...';
      case 'installing':
        return 'Installing worker (please run the downloaded file)...';
      case 'registering':
        return 'Registering provider...';
      case 'online':
        return 'Your GPU is now online and earning!';
      case 'error':
        return state.error || 'An error occurred';
      default:
        return '';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <StatusIcon />
          <span>Quick Provider Registration</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status Message */}
        <div className="text-center">
          <p className="text-lg text-gray-300">{getStatusMessage()}</p>
        </div>

        {/* Progress Bar */}
        {state.status !== 'idle' && state.status !== 'error' && (
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${state.progress}%` }}
            />
          </div>
        )}

        {/* Hardware Info Display */}
        {(state.gpuInfo || state.cpuInfo || state.ramInfo) && (
          <div className="space-y-3 bg-gray-900/50 rounded-lg p-4 border border-cyan-500/30">
            <h4 className="text-sm font-semibold text-cyan-400 mb-2">Detected Hardware</h4>
            
            {state.gpuInfo && (
              <div className="flex items-start gap-2">
                <HardDrive className="w-4 h-4 text-cyan-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-300">
                    <span className="font-medium">GPU:</span> {state.gpuInfo.model || state.gpuInfo.renderer || 'Unknown'}
                  </p>
                  {state.gpuInfo.vendor && (
                    <p className="text-xs text-gray-400">Vendor: {state.gpuInfo.vendor}</p>
                  )}
                  <p className="text-xs text-gray-400">Detection: {state.gpuInfo.type.toUpperCase()}</p>
                </div>
              </div>
            )}

            {state.cpuInfo && (
              <div className="flex items-start gap-2">
                <Cpu className="w-4 h-4 text-cyan-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-300">
                    <span className="font-medium">CPU:</span> {state.cpuInfo.cores} cores
                  </p>
                </div>
              </div>
            )}

            {state.ramInfo?.total && (
              <div className="flex items-start gap-2">
                <HardDrive className="w-4 h-4 text-cyan-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-300">
                    <span className="font-medium">RAM:</span> ~{state.ramInfo.total} GB
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {state.status === 'error' && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-300">{state.error}</p>
                {retryCount < MAX_RETRIES && (
                  <p className="text-xs text-gray-400 mt-2">
                    Retry attempt {retryCount + 1} of {MAX_RETRIES}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          {state.status === 'idle' && (
            <Button
              size="lg"
              onClick={handleShareGPU}
              className="min-w-[200px]"
            >
              Share My GPU
            </Button>
          )}

          {state.status === 'error' && retryCount < MAX_RETRIES && (
            <Button
              size="lg"
              onClick={handleRetry}
              variant="secondary"
              className="min-w-[200px]"
            >
              Retry Registration
            </Button>
          )}

          {state.status === 'online' && (
            <Button
              size="lg"
              variant="secondary"
              onClick={() => window.location.href = '/provider/dashboard'}
              className="min-w-[200px]"
            >
              View Dashboard
            </Button>
          )}
        </div>

        {/* Benefits Section (shown when idle) */}
        {state.status === 'idle' && (
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-cyan-500/30">
            <div className="text-center">
              <div className="text-2xl mb-1">⚡</div>
              <p className="text-xs text-gray-400">Instant Setup</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">💰</div>
              <p className="text-xs text-gray-400">Earn QUBIC</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🔒</div>
              <p className="text-xs text-gray-400">Secure</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

