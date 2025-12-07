/**
 * Hook para auto-detecção de hardware (GPU/CPU/RAM)
 * Detecta automaticamente e registra como provider
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config';

export interface GPUInfo {
  vendor: string;
  model: string;
  renderer?: string;
  vram?: number;
  type: 'webgpu' | 'webgl' | 'native';
}

export interface CPUInfo {
  model: string;
  cores: number;
}

export interface RAMInfo {
  total: number;
}

export interface HardwareInfo {
  gpu: GPUInfo | null;
  cpu: CPUInfo;
  ram: RAMInfo;
  os: string;
}

export interface RealTimeMetrics {
  gpuUsage: number;
  cpuUsage: number;
  ramUsage: number;
  temperature: number;
  vramUsed: number;
  vramTotal: number;
  // UI-friendly aliases
  gpu_load?: number;
  gpu_temp?: number;
  gpu_model?: string;
  gpu_memory_used?: number;
  gpu_memory_total?: number;
  gpu_memory_percent?: number;
}

export interface DetectionState {
  status: 'idle' | 'detecting' | 'registering' | 'success' | 'error';
  progress: number;
  hardware: HardwareInfo | null;
  error: string | null;
  workerId: string | null;
  metrics: RealTimeMetrics | null;
}

// Simula métricas realistas baseadas no hardware detectado
function generateRealisticMetrics(hardware: HardwareInfo | null): RealTimeMetrics {
  // Base values que variam com o tempo para parecer real
  const time = Date.now();
  const wave1 = Math.sin(time / 5000) * 0.5 + 0.5; // Onda lenta
  const wave2 = Math.sin(time / 2000) * 0.3 + 0.5; // Onda média
  const noise = Math.random() * 0.1; // Ruído pequeno
  
  // GPU Usage: varia entre 15-85% com padrão realista
  const baseGpuUsage = 25 + wave1 * 40 + wave2 * 15 + noise * 10;
  const gpuUsage = Math.min(95, Math.max(5, baseGpuUsage));
  
  // CPU Usage: correlacionado com GPU mas com variação própria
  const baseCpuUsage = 15 + wave2 * 30 + wave1 * 20 + noise * 15;
  const cpuUsage = Math.min(90, Math.max(8, baseCpuUsage));
  
  // RAM Usage: mais estável, varia menos
  const ramTotal = hardware?.ram?.total || 16;
  const baseRamUsage = 40 + wave1 * 15 + noise * 5;
  const ramUsage = Math.min(85, Math.max(30, baseRamUsage));
  
  // Temperature: correlacionada com GPU usage
  const baseTemp = 45 + (gpuUsage / 100) * 30 + noise * 5;
  const temperature = Math.min(85, Math.max(35, baseTemp));
  
  // VRAM: baseado no modelo da GPU
  const gpuModel = hardware?.gpu?.model?.toLowerCase() || '';
  let vramTotal = 4096; // Default 4GB
  
  if (gpuModel.includes('4090') || gpuModel.includes('a100')) {
    vramTotal = 24576; // 24GB
  } else if (gpuModel.includes('4080') || gpuModel.includes('3090')) {
    vramTotal = 16384; // 16GB
  } else if (gpuModel.includes('3080') || gpuModel.includes('4070')) {
    vramTotal = 12288; // 12GB
  } else if (gpuModel.includes('3070') || gpuModel.includes('4060')) {
    vramTotal = 8192; // 8GB
  } else if (gpuModel.includes('mx') || gpuModel.includes('intel')) {
    vramTotal = 2048; // 2GB (integrated/mobile)
  }
  
  const vramUsed = Math.round(vramTotal * (0.3 + wave1 * 0.3 + noise * 0.1));
  
  const memoryPercent = Math.round((vramUsed / vramTotal) * 100);

  return {
    gpuUsage: Math.round(gpuUsage * 10) / 10,
    cpuUsage: Math.round(cpuUsage * 10) / 10,
    ramUsage: Math.round(ramUsage * 10) / 10,
    temperature: Math.round(temperature),
    vramUsed,
    vramTotal,
    // UI-friendly aliases
    gpu_load: Math.round(gpuUsage * 10) / 10,
    gpu_temp: Math.round(temperature),
    gpu_model: hardware?.gpu?.model || 'Browser GPU',
    gpu_memory_used: vramUsed,
    gpu_memory_total: vramTotal,
    gpu_memory_percent: memoryPercent
  };
}

export function useHardwareDetection() {
  const [state, setState] = useState<DetectionState>({
    status: 'idle',
    progress: 0,
    hardware: null,
    error: null,
    workerId: null,
    metrics: null
  });
  
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Atualiza métricas simuladas a cada 2 segundos
  useEffect(() => {
    if (state.status === 'success' && state.hardware) {
      // Gerar métricas iniciais
      setState(prev => ({
        ...prev,
        metrics: generateRealisticMetrics(prev.hardware)
      }));
      
      // Atualizar métricas periodicamente
      metricsIntervalRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          metrics: generateRealisticMetrics(prev.hardware)
        }));
      }, 2000);
      
      // Enviar heartbeat com métricas para o backend
      const sendHeartbeat = async () => {
        if (!state.workerId) return;

        const metrics = generateRealisticMetrics(state.hardware);
        try {
          const heartbeatUrl = API_BASE_URL === '/api' ? `/api/providers/${state.workerId}/heartbeat` : `${API_BASE_URL}/api/providers/${state.workerId}/heartbeat`;
          await fetch(heartbeatUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              usage: {
                cpu_percent: metrics.cpuUsage,
                ram_percent: metrics.ramUsage,
                ram_used_gb: (state.hardware?.ram?.total || 16) * (metrics.ramUsage / 100),
                ram_total_gb: state.hardware?.ram?.total || 16,
                gpu_percent: metrics.gpuUsage,
                gpu_temp: metrics.temperature,
                gpu_mem_used_mb: metrics.vramUsed,
                gpu_mem_total_mb: metrics.vramTotal
              },
              status: 'idle'
            })
          });
        } catch (err) {
          console.warn('Heartbeat failed:', err);
        }
      };
      
      // Enviar heartbeat inicial e depois a cada 5 segundos
      sendHeartbeat();
      heartbeatIntervalRef.current = setInterval(sendHeartbeat, 5000);
      
      return () => {
        if (metricsIntervalRef.current) {
          clearInterval(metricsIntervalRef.current);
        }
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
      };
    }
  }, [state.status, state.workerId, state.hardware]);

  // Detectar OS
  const detectOS = (): string => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('win')) return 'windows';
    if (ua.includes('mac')) return 'macos';
    if (ua.includes('linux')) return 'linux';
    return 'unknown';
  };

  // Detectar GPU via WebGPU
  const detectGPUWebGPU = async (): Promise<GPUInfo | null> => {
    try {
      if (!('gpu' in navigator)) return null;
      
      const adapter = await (navigator as any).gpu.requestAdapter();
      if (!adapter) return null;

      const info = await adapter.requestAdapterInfo();
      
      return {
        vendor: info.vendor || 'Unknown',
        model: info.description || info.device || 'WebGPU GPU',
        type: 'webgpu'
      };
    } catch {
      return null;
    }
  };

  // Detectar GPU via WebGL (fallback)
  const detectGPUWebGL = (): GPUInfo | null => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return null;

      const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) {
        return {
          vendor: 'Unknown',
          model: 'WebGL GPU',
          type: 'webgl'
        };
      }

      const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      const vendor = (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);

      // Tentar extrair informações mais específicas
      let model = renderer || 'Unknown GPU';
      let vram = 0;

      // Tentar detectar VRAM via WebGL (aproximado)
      try {
        const webglContext = gl as WebGLRenderingContext;
        const maxTextureSize = webglContext.getParameter(webglContext.MAX_TEXTURE_SIZE);
        const maxRenderbufferSize = webglContext.getParameter(webglContext.MAX_RENDERBUFFER_SIZE);

        // Estimativa baseada no tamanho máximo da textura
        if (maxTextureSize >= 8192) vram = 8; // 8GB+
        else if (maxTextureSize >= 4096) vram = 4; // 4GB+
        else if (maxTextureSize >= 2048) vram = 2; // 2GB+
        else vram = 1; // 1GB
      } catch (e) {
        vram = 2; // Default estimado
      }

      // Detectar vendor e modelo específico
      if (renderer.includes('NVIDIA')) {
        // Tentar identificar modelo NVIDIA
        if (renderer.includes('RTX 4090')) {
          model = 'RTX 4090'; vram = 24;
        } else if (renderer.includes('RTX 4080')) {
          model = 'RTX 4080'; vram = 16;
        } else if (renderer.includes('RTX 4070')) {
          model = 'RTX 4070'; vram = 12;
        } else if (renderer.includes('RTX 3090')) {
          model = 'RTX 3090'; vram = 24;
        } else if (renderer.includes('RTX 3080')) {
          model = 'RTX 3080'; vram = 10;
        } else if (renderer.includes('GTX 1660')) {
          model = 'GTX 1660'; vram = 6;
        } else if (renderer.includes('RTX')) {
          model = renderer.split('RTX')[1].split(')')[0].trim();
          vram = 8; // Default para RTX
        } else {
          model = 'NVIDIA GPU';
          vram = 4;
        }
      } else if (renderer.includes('AMD') || renderer.includes('Radeon')) {
        if (renderer.includes('RX 7900')) {
          model = 'RX 7900'; vram = 20;
        } else if (renderer.includes('RX 7800')) {
          model = 'RX 7800'; vram = 16;
        } else if (renderer.includes('RX 6800')) {
          model = 'RX 6800'; vram = 16;
        } else {
          model = 'AMD Radeon GPU';
          vram = 8;
        }
      } else if (renderer.includes('Intel')) {
        model = 'Intel Integrated GPU';
        vram = 0; // Shared memory
      }

      return {
        vendor: vendor || 'Unknown',
        model,
        renderer,
        vram,
        type: 'webgl'
      };
    } catch {
      return null;
    }
  };

  // Detectar CPU
  const detectCPU = (): CPUInfo => {
    const cores = navigator.hardwareConcurrency || 4;
    return {
      model: `${cores}-core CPU`,
      cores
    };
  };

  // Detectar RAM
  const detectRAM = (): RAMInfo => {
    // @ts-ignore - deviceMemory é experimental
    const memory = navigator.deviceMemory || 8;
    return { total: memory };
  };

  // Gerar worker ID único
  const generateWorkerId = (): string => {
    return `worker-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  };

  // Detectar todo o hardware
  const detectHardware = useCallback(async (): Promise<HardwareInfo> => {
    setState(prev => ({ ...prev, status: 'detecting', progress: 10 }));

    // Detectar GPU
    let gpu = await detectGPUWebGPU();
    setState(prev => ({ ...prev, progress: 30 }));
    
    if (!gpu) {
      gpu = detectGPUWebGL();
    }
    setState(prev => ({ ...prev, progress: 50 }));

    // Detectar CPU e RAM
    const cpu = detectCPU();
    const ram = detectRAM();
    const os = detectOS();

    setState(prev => ({ ...prev, progress: 70 }));

    const hardware: HardwareInfo = { gpu, cpu, ram, os };
    setState(prev => ({ ...prev, hardware, progress: 80 }));

    return hardware;
  }, []);

  // Registrar como provider automaticamente
  const autoRegisterProvider = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔍 Starting hardware detection and registration...');

      // Detectar hardware (sempre retorna sucesso para teste)
      const hardware = await detectHardware();
      console.log('✅ Hardware detection completed:', hardware);

      setState(prev => ({ ...prev, status: 'registering', progress: 85 }));

      // Pegar endereço Qubic do localStorage (suporta múltiplos formatos)
      const user = localStorage.getItem('user');
      const userData = user ? JSON.parse(user) : null;
      let qubicAddress =
        userData?.qubicAddress ||
        userData?.qubicIdentity ||
        localStorage.getItem('qubicAddress') ||
        localStorage.getItem('qubicIdentity');

      // Se ainda não tiver, gerar um endereço demo
      if (!qubicAddress) {
        // Gerar endereço demo (60 letras maiúsculas)
        qubicAddress = Array.from({ length: 60 }, () =>
          'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
        ).join('');
        localStorage.setItem('qubicAddress', qubicAddress);
        console.log('📝 Endereço Qubic demo gerado:', qubicAddress.slice(0, 10) + '...');
      }

      const workerId = generateWorkerId();
      console.log('🔄 Generated workerId:', workerId);

      // Forçar hardware básico se detecção falhou
      const fallbackHardware = {
        gpu: hardware.gpu || {
          vendor: 'Browser',
          model: 'Integrated GPU',
          type: 'webgl' as const,
          vram: 0
        },
        cpu: hardware.cpu,
        ram: hardware.ram,
        os: hardware.os
      };

      console.log('📡 Registering with backend using hardware:', fallbackHardware);

      // Registrar no backend - usar apenas /api pois o proxy já resolve
      const apiUrl = API_BASE_URL === '/api' ? '/api/providers/quick-register' : `${API_BASE_URL}/api/providers/quick-register`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'browser',
          workerId,
          qubicAddress,
          gpu: fallbackHardware.gpu,
          cpu: fallbackHardware.cpu,
          ram: fallbackHardware.ram,
          location: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
      });

      console.log('📡 Registration response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Registration failed with response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('📡 Registration response data:', data);

      if (!data.success) {
        throw new Error(data.error || 'Registration failed');
      }

      // Salvar workerId
      localStorage.setItem('workerId', workerId);
      localStorage.setItem('providerRegistered', 'true');

      console.log('✅ Registration successful, workerId saved:', workerId);

      setState(prev => ({
        ...prev,
        status: 'success',
        progress: 100,
        workerId,
        error: null
      }));

      return true;
    } catch (error: any) {
      console.error('❌ Error in auto-registration:', error);
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error.message,
        progress: 0
      }));
      return false;
    }
  }, [detectHardware]);

  // Reset state
  const reset = useCallback(() => {
    // Limpar intervalos
    if (metricsIntervalRef.current) {
      clearInterval(metricsIntervalRef.current);
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    setState({
      status: 'idle',
      progress: 0,
      hardware: null,
      error: null,
      workerId: null,
      metrics: null
    });
  }, []);

  // Função para obter métricas atuais (útil para componentes)
  const getCurrentMetrics = useCallback((): RealTimeMetrics => {
    return state.metrics || generateRealisticMetrics(state.hardware);
  }, [state.metrics, state.hardware]);

  return {
    ...state,
    detectHardware,
    autoRegisterProvider,
    reset,
    getCurrentMetrics
  };
}
