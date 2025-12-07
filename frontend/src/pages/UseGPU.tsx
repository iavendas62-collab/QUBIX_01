import React, { useState, useEffect } from 'react';
import { 
  Gamepad2, Film, Brain, Code, ArrowRight, Loader2, 
  Monitor, Zap, Clock, DollarSign, Play, ExternalLink,
  CheckCircle, Copy, Download
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';

interface UseGPUProps {
  onBack: () => void;
  onSelectGPU: (useCase: string) => void;
}

// Translations
const texts = {
  en: {
    back: '← Back to Dashboard',
    whatToDo: 'What do you want to',
    do: 'do',
    chooseUseCase: 'Choose your use case and connect to a GPU in seconds',
    gaming: 'Gaming',
    gamingDesc: 'Play AAA games in high quality',
    rendering: '3D Rendering',
    renderingDesc: 'Blender, Cinema 4D, After Effects',
    ai: 'AI & Machine Learning',
    aiDesc: 'Train models, run LLMs',
    dev: 'Development',
    devDesc: 'Compilation, CI/CD, testing',
    minVram: 'Min.',
    select: 'Select',
    availableGpus: 'Available GPUs for',
    recommended: 'Recommended',
    changeUseCase: '← Change use case',
    perHour: 'per hour',
    confirmConnection: 'Confirm connection',
    chargedPerHour: 'You will be charged per hour of use',
    connectionMethod: 'Connection method',
    lowLatency: 'Low latency stream',
    alternative: 'Alternative',
    webEnv: 'Web environment',
    terminalAccess: 'Terminal access',
    connectNow: 'Connect Now',
    connecting: 'Connecting...',
    agreeTerms: 'By connecting, you agree to the terms of use. Billing starts immediately.',
    connected: 'Connected! 🎉',
    gpuReady: 'Your GPU is ready to use. Use the information below to connect.',
    openMoonlight: 'Open Moonlight and connect:',
    noMoonlight: "Don't have Moonlight?",
    downloadAt: 'Download at moonlight-stream.org',
    jupyterLab: 'Jupyter Lab (browser)',
    sshTerminal: 'SSH (terminal)',
    viewDashboard: 'View Dashboard',
    rentAnother: 'Rent another GPU',
    copied: 'Copied!',
    errorLoading: 'Error loading GPUs'
  },
  pt: {
    back: '← Voltar ao Painel',
    whatToDo: 'O que você quer',
    do: 'fazer',
    chooseUseCase: 'Escolha seu caso de uso e conecte a uma GPU em segundos',
    gaming: 'Gaming',
    gamingDesc: 'Jogue jogos AAA em alta qualidade',
    rendering: 'Renderização 3D',
    renderingDesc: 'Blender, Cinema 4D, After Effects',
    ai: 'IA & Machine Learning',
    aiDesc: 'Treine modelos, rode LLMs',
    dev: 'Desenvolvimento',
    devDesc: 'Compilação, CI/CD, testes',
    minVram: 'Mín.',
    select: 'Selecionar',
    availableGpus: 'GPUs disponíveis para',
    recommended: 'Recomendado',
    changeUseCase: '← Mudar caso de uso',
    perHour: 'por hora',
    confirmConnection: 'Confirmar conexão',
    chargedPerHour: 'Você será cobrado por hora de uso',
    connectionMethod: 'Método de conexão',
    lowLatency: 'Stream de baixa latência',
    alternative: 'Alternativa',
    webEnv: 'Ambiente web',
    terminalAccess: 'Acesso terminal',
    connectNow: 'Conectar Agora',
    connecting: 'Conectando...',
    agreeTerms: 'Ao conectar, você concorda com os termos de uso. A cobrança começa imediatamente.',
    connected: 'Conectado! 🎉',
    gpuReady: 'Sua GPU está pronta. Use as informações abaixo para conectar.',
    openMoonlight: 'Abra o Moonlight e conecte:',
    noMoonlight: 'Não tem o Moonlight?',
    downloadAt: 'Baixe em moonlight-stream.org',
    jupyterLab: 'Jupyter Lab (navegador)',
    sshTerminal: 'SSH (terminal)',
    viewDashboard: 'Ver Painel',
    rentAnother: 'Alugar outra GPU',
    copied: 'Copiado!',
    errorLoading: 'Erro ao carregar GPUs'
  },
  es: {
    back: '← Volver al Panel',
    whatToDo: '¿Qué quieres',
    do: 'hacer',
    chooseUseCase: 'Elige tu caso de uso y conéctate a una GPU en segundos',
    gaming: 'Gaming',
    gamingDesc: 'Juega juegos AAA en alta calidad',
    rendering: 'Renderizado 3D',
    renderingDesc: 'Blender, Cinema 4D, After Effects',
    ai: 'IA & Machine Learning',
    aiDesc: 'Entrena modelos, ejecuta LLMs',
    dev: 'Desarrollo',
    devDesc: 'Compilación, CI/CD, pruebas',
    minVram: 'Mín.',
    select: 'Seleccionar',
    availableGpus: 'GPUs disponibles para',
    recommended: 'Recomendado',
    changeUseCase: '← Cambiar caso de uso',
    perHour: 'por hora',
    confirmConnection: 'Confirmar conexión',
    chargedPerHour: 'Se te cobrará por hora de uso',
    connectionMethod: 'Método de conexión',
    lowLatency: 'Stream de baja latencia',
    alternative: 'Alternativa',
    webEnv: 'Ambiente web',
    terminalAccess: 'Acceso terminal',
    connectNow: 'Conectar Ahora',
    connecting: 'Conectando...',
    agreeTerms: 'Al conectar, aceptas los términos de uso. La facturación comienza inmediatamente.',
    connected: '¡Conectado! 🎉',
    gpuReady: 'Tu GPU está lista. Usa la información de abajo para conectar.',
    openMoonlight: 'Abre Moonlight y conecta:',
    noMoonlight: '¿No tienes Moonlight?',
    downloadAt: 'Descarga en moonlight-stream.org',
    jupyterLab: 'Jupyter Lab (navegador)',
    sshTerminal: 'SSH (terminal)',
    viewDashboard: 'Ver Panel',
    rentAnother: 'Alquilar otra GPU',
    copied: '¡Copiado!',
    errorLoading: 'Error al cargar GPUs'
  }
};

interface GPU {
  id: string;
  model: string;
  vram: number;
  location: string;
  price: number;
  rating: number;
  available: boolean;
}

// Use cases with recommended specs
const USE_CASES = [
  {
    id: 'gaming',
    icon: Gamepad2,
    title: 'Gaming',
    description: 'Play AAA games in high quality',
    examples: ['Cyberpunk 2077', 'GTA V', 'Fortnite', 'CS2'],
    minVram: 8,
    recommended: ['RTX 4090', 'RTX 4080', 'RTX 3090'],
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'rendering',
    icon: Film,
    title: '3D Rendering',
    description: 'Blender, Cinema 4D, After Effects',
    examples: ['Blender Cycles', 'Octane', 'V-Ray', 'Arnold'],
    minVram: 12,
    recommended: ['RTX 4090', 'A100', 'RTX 3090'],
    color: 'from-orange-500 to-red-500'
  },
  {
    id: 'ai',
    icon: Brain,
    title: 'AI & Machine Learning',
    description: 'Train models, run LLMs',
    examples: ['Stable Diffusion', 'LLaMA', 'PyTorch', 'TensorFlow'],
    minVram: 16,
    recommended: ['A100', 'H100', 'RTX 4090'],
    color: 'from-cyan-500 to-blue-500'
  },
  {
    id: 'dev',
    icon: Code,
    title: 'Development',
    description: 'Compilation, CI/CD, testing',
    examples: ['CUDA Dev', 'Docker builds', 'Unreal Engine'],
    minVram: 8,
    recommended: ['RTX 4080', 'RTX 3080', 'A10'],
    color: 'from-green-500 to-emerald-500'
  }
];

export default function UseGPU({ onBack, onSelectGPU }: UseGPUProps) {
  const { language } = useLanguage();
  const t = texts[language];
  
  const [selectedUseCase, setSelectedUseCase] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [gpus, setGpus] = useState<GPU[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGPU, setSelectedGPU] = useState<GPU | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);
  
  // Use cases with translations
  const USE_CASES_TRANSLATED = [
    { ...USE_CASES[0], title: t.gaming, description: t.gamingDesc },
    { ...USE_CASES[1], title: t.rendering, description: t.renderingDesc },
    { ...USE_CASES[2], title: t.ai, description: t.aiDesc },
    { ...USE_CASES[3], title: t.dev, description: t.devDesc },
  ];

  // Fetch GPUs when use case is selected
  useEffect(() => {
    if (selectedUseCase && step === 2) {
      fetchGPUs();
    }
  }, [selectedUseCase, step]);

  const fetchGPUs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/gpus?status=available');
      const data = await response.json();
      
      const useCase = USE_CASES.find(u => u.id === selectedUseCase);
      // Filter by minimum VRAM and sort by recommendation
      const filtered = data
        .filter((gpu: GPU) => gpu.available && gpu.vram >= (useCase?.minVram || 0))
        .sort((a: GPU, b: GPU) => {
          const aRecommended = useCase?.recommended.includes(a.model) ? 1 : 0;
          const bRecommended = useCase?.recommended.includes(b.model) ? 1 : 0;
          return bRecommended - aRecommended || a.price - b.price;
        });
      
      setGpus(filtered);
    } catch (error) {
      toast.error(t.errorLoading);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!selectedGPU) return;
    
    setConnecting(true);
    
    // Simulate connection process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setConnectionInfo({
      instanceId: `gpu-${Math.random().toString(36).substr(2, 9)}`,
      accessUrl: selectedUseCase === 'gaming' 
        ? 'moonlight://connect/qubix-gpu-123'
        : `https://jupyter-${selectedGPU.id}.qubix.network`,
      sshCommand: `ssh root@${selectedGPU.id}.qubix.network`,
      apiEndpoint: `https://api.qubix.network/v1/gpu/${selectedGPU.id}`
    });
    
    setConnecting(false);
    setConnected(true);
    setStep(4);
    toast.success('Connected successfully!');
  };

  const useCase = USE_CASES.find(u => u.id === selectedUseCase);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <button 
          onClick={onBack}
          className="text-slate-400 hover:text-white mb-8 flex items-center gap-2"
        >
          {t.back}
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            {t.whatToDo} <span className="text-cyan-400">{t.do}</span>?
          </h1>
          <p className="text-xl text-slate-400">
            {t.chooseUseCase}
          </p>
        </div>

        {/* Step 1: Choose Use Case */}
        {step === 1 && (
          <div className="grid grid-cols-2 gap-6">
            {USE_CASES_TRANSLATED.map((uc) => (
              <button
                key={uc.id}
                onClick={() => { setSelectedUseCase(uc.id); setStep(2); }}
                className="group relative bg-slate-900 border border-slate-700 rounded-2xl p-8 text-left hover:border-cyan-500/50 transition-all overflow-hidden"
              >
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${uc.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                
                <div className="relative">
                  <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${uc.color} rounded-xl mb-4`}>
                    <uc.icon className="w-7 h-7 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-2">{uc.title}</h3>
                  <p className="text-slate-400 mb-4">{uc.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {uc.examples.map((ex) => (
                      <span key={ex} className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">
                        {ex}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">{t.minVram} {uc.minVram}GB VRAM</span>
                    <span className="text-cyan-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                      {t.select} <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Select GPU */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{t.availableGpus} {USE_CASES_TRANSLATED.find(u => u.id === selectedUseCase)?.title}</h2>
                <p className="text-slate-400">{t.recommended}: {useCase?.recommended.join(', ')}</p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-slate-400 hover:text-white"
              >
                {t.changeUseCase}
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              </div>
            ) : (
              <div className="space-y-4">
                {gpus.map((gpu) => {
                  const isRecommended = useCase?.recommended.includes(gpu.model);
                  return (
                    <button
                      key={gpu.id}
                      onClick={() => { setSelectedGPU(gpu); setStep(3); }}
                      className={`w-full bg-slate-900 border rounded-xl p-6 text-left transition-all ${
                        isRecommended 
                          ? 'border-cyan-500/50 hover:border-cyan-400' 
                          : 'border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            isRecommended ? 'bg-cyan-500/20' : 'bg-slate-800'
                          }`}>
                            <Monitor className={`w-6 h-6 ${isRecommended ? 'text-cyan-400' : 'text-slate-400'}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-bold">{gpu.model}</span>
                              {isRecommended && (
                                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">
                                  {t.recommended}
                                </span>
                              )}
                            </div>
                            <div className="text-slate-400 text-sm">
                              {gpu.vram}GB VRAM • {gpu.location}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-cyan-400">{gpu.price} QUBIC</div>
                          <div className="text-slate-500 text-sm">{t.perHour}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Confirm & Connect */}
        {step === 3 && selectedGPU && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 p-6 border-b border-slate-700">
                <h2 className="text-2xl font-bold">{t.confirmConnection}</h2>
                <p className="text-slate-400">{t.chargedPerHour}</p>
              </div>
              
              <div className="p-6 space-y-6">
                {/* GPU Info */}
                <div className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl">
                  <div className="w-16 h-16 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                    <Monitor className="w-8 h-8 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xl font-bold">{selectedGPU.model}</div>
                    <div className="text-slate-400">{selectedGPU.vram}GB VRAM • {selectedGPU.location}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-cyan-400">{selectedGPU.price}</div>
                    <div className="text-slate-500 text-sm">QUBIC/hour</div>
                  </div>
                </div>

                {/* Use Case */}
                <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl">
                  {useCase && <useCase.icon className="w-6 h-6 text-cyan-400" />}
                  <div>
                    <div className="font-semibold">{useCase?.title}</div>
                    <div className="text-sm text-slate-400">{useCase?.description}</div>
                  </div>
                </div>

                {/* Connection Method */}
                <div>
                  <div className="text-sm text-slate-400 mb-3">{t.connectionMethod}</div>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedUseCase === 'gaming' ? (
                      <>
                        <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                          <div className="font-semibold text-cyan-400">Moonlight</div>
                          <div className="text-xs text-slate-400">{t.lowLatency}</div>
                        </div>
                        <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg">
                          <div className="font-semibold">Parsec</div>
                          <div className="text-xs text-slate-400">{t.alternative}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                          <div className="font-semibold text-cyan-400">Jupyter Lab</div>
                          <div className="text-xs text-slate-400">{t.webEnv}</div>
                        </div>
                        <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg">
                          <div className="font-semibold">SSH</div>
                          <div className="text-xs text-slate-400">{t.terminalAccess}</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Connect Button */}
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t.connecting}
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      {t.connectNow}
                    </>
                  )}
                </button>

                <p className="text-xs text-slate-500 text-center">
                  {t.agreeTerms}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Connected */}
        {step === 4 && connectionInfo && (
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(34,197,94,0.4)]">
              <CheckCircle className="w-12 h-12" />
            </div>
            
            <h2 className="text-3xl font-bold mb-4">{t.connected}</h2>
            <p className="text-slate-400 mb-8">
              {t.gpuReady}
            </p>

            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 text-left space-y-4">
              {selectedUseCase === 'gaming' ? (
                <>
                  <div>
                    <div className="text-sm text-slate-400 mb-2">{t.openMoonlight}</div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-slate-800 px-4 py-3 rounded-lg text-cyan-400">
                        {connectionInfo.accessUrl}
                      </code>
                      <button 
                        onClick={() => { navigator.clipboard.writeText(connectionInfo.accessUrl); toast.success(t.copied); }}
                        className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                    <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-2">
                      <Download className="w-5 h-5" />
                      {t.noMoonlight}
                    </div>
                    <a 
                      href="https://moonlight-stream.org" 
                      target="_blank"
                      className="text-sm text-slate-300 hover:text-white flex items-center gap-1"
                    >
                      {t.downloadAt} <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="text-sm text-slate-400 mb-2">{t.jupyterLab}</div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-slate-800 px-4 py-3 rounded-lg text-cyan-400 text-sm">
                        {connectionInfo.accessUrl}
                      </code>
                      <a 
                        href={connectionInfo.accessUrl}
                        target="_blank"
                        className="p-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400 mb-2">{t.sshTerminal}</div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-slate-800 px-4 py-3 rounded-lg text-green-400 text-sm">
                        {connectionInfo.sshCommand}
                      </code>
                      <button 
                        onClick={() => { navigator.clipboard.writeText(connectionInfo.sshCommand); toast.success(t.copied); }}
                        className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-8 flex gap-4 justify-center">
              <button
                onClick={onBack}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold transition-colors"
              >
                {t.viewDashboard}
              </button>
              <button
                onClick={() => { setStep(1); setSelectedGPU(null); setConnected(false); }}
                className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-xl font-semibold transition-colors"
              >
                {t.rentAnother}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

