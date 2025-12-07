/**
 * Profile Selector - Choose Provider or Consumer after login
 * Auto-detects and registers hardware when Provider is selected
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, Cpu, ArrowRight, DollarSign, Zap, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';
import { useHardwareDetection } from '../hooks/useHardwareDetection';

const texts = {
  en: {
    welcome: 'Welcome to QUBIX',
    chooseProfile: 'How would you like to use the platform?',
    provider: 'Compute Provider',
    providerDesc: 'Monetize your hardware by renting out GPU/CPU power',
    providerFeatures: ['List your GPUs on the marketplace', 'Set your own pricing', 'Earn QUBIC automatically', 'Monitor performance & earnings'],
    consumer: 'Compute Consumer', 
    consumerDesc: 'Rent powerful GPUs for AI, ML, rendering and more',
    consumerFeatures: ['Access GPUs instantly', 'Pay only for what you use', 'SSH, Jupyter, VS Code access', 'Up to 70% cheaper than cloud'],
    select: 'Select',
    canSwitch: 'You can switch profiles anytime from settings',
    detecting: 'Detecting your hardware...',
    registering: 'Registering your GPU...',
    registered: 'Hardware registered!',
    errorDetecting: 'Error detecting hardware',
    retry: 'Retry'
  },
  pt: {
    welcome: 'Bem-vindo ao QUBIX',
    chooseProfile: 'Como você quer usar a plataforma?',
    provider: 'Provedor de Computação',
    providerDesc: 'Monetize seu hardware alugando poder de GPU/CPU',
    providerFeatures: ['Liste suas GPUs no marketplace', 'Defina seus próprios preços', 'Ganhe QUBIC automaticamente', 'Monitore performance e ganhos'],
    consumer: 'Consumidor de Computação',
    consumerDesc: 'Alugue GPUs poderosas para IA, ML, renderização e mais',
    consumerFeatures: ['Acesse GPUs instantaneamente', 'Pague apenas pelo que usar', 'Acesso SSH, Jupyter, VS Code', 'Até 70% mais barato que cloud'],
    select: 'Selecionar',
    canSwitch: 'Você pode trocar de perfil a qualquer momento nas configurações',
    detecting: 'Detectando seu hardware...',
    registering: 'Registrando sua GPU...',
    registered: 'Hardware registrado!',
    errorDetecting: 'Erro ao detectar hardware',
    retry: 'Tentar novamente'
  },
  es: {
    welcome: 'Bienvenido a QUBIX',
    chooseProfile: '¿Cómo quieres usar la plataforma?',
    provider: 'Proveedor de Cómputo',
    providerDesc: 'Monetiza tu hardware alquilando poder de GPU/CPU',
    providerFeatures: ['Lista tus GPUs en el marketplace', 'Define tus propios precios', 'Gana QUBIC automáticamente', 'Monitorea rendimiento y ganancias'],
    consumer: 'Consumidor de Cómputo',
    consumerDesc: 'Alquila GPUs potentes para IA, ML, renderizado y más',
    consumerFeatures: ['Accede a GPUs al instante', 'Paga solo por lo que uses', 'Acceso SSH, Jupyter, VS Code', 'Hasta 70% más barato que cloud'],
    select: 'Seleccionar',
    canSwitch: 'Puedes cambiar de perfil en cualquier momento desde configuración',
    detecting: 'Detectando tu hardware...',
    registering: 'Registrando tu GPU...',
    registered: '¡Hardware registrado!',
    errorDetecting: 'Error al detectar hardware',
    retry: 'Reintentar'
  }
};

export default function ProfileSelector() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = texts[language];
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { 
    status, 
    progress, 
    hardware, 
    error, 
    autoRegisterProvider, 
    reset 
  } = useHardwareDetection();

  const selectProfile = async (profile: 'provider' | 'consumer') => {
    localStorage.setItem('userProfile', profile);
    
    if (profile === 'provider') {
      // Auto-detectar e registrar hardware
      setIsProcessing(true);
      try {
        const success = await autoRegisterProvider();
        setIsProcessing(false);
        
        if (success) {
          // Aguardar um pouco para mostrar sucesso
          setTimeout(() => {
            navigate('/provider');
          }, 1500);
        } else {
          // Se falhar, navegar mesmo assim
          setTimeout(() => {
            navigate('/provider');
          }, 2000);
        }
      } catch (err) {
        console.error('Erro na auto-detecção:', err);
        setIsProcessing(false);
        // Navegar mesmo com erro
        navigate('/provider');
      }
    } else {
      navigate('/consumer');
    }
  };

  const handleRetry = async () => {
    reset();
    setIsProcessing(true);
    const success = await autoRegisterProvider();
    setIsProcessing(false);
    if (success) {
      setTimeout(() => navigate('/provider'), 1500);
    }
  };

  const skipToProvider = () => {
    navigate('/provider');
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] -top-20 -left-20" />
        <div className="absolute w-[400px] h-[400px] bg-green-500/10 rounded-full blur-[100px] bottom-20 right-20" />
      </div>

      {/* Language Selector */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageSelector />
      </div>

      <div className="relative max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{t.welcome}</h1>
          <p className="text-xl text-slate-400">{t.chooseProfile}</p>
        </div>

        {/* Profile Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Provider Card */}
          <button
            onClick={() => selectProfile('provider')}
            className="group relative bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-2 border-green-500/30 rounded-2xl p-8 text-left hover:border-green-400 hover:shadow-[0_0_40px_rgba(34,197,94,0.2)] transition-all"
          >
            <div className="absolute top-4 right-4 w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
              <Server className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-green-400 mb-2">{t.provider}</h2>
            <p className="text-slate-400 mb-6">{t.providerDesc}</p>
            
            <ul className="space-y-3 mb-8">
              {t.providerFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  {feature}
                </li>
              ))}
            </ul>
            
            <div className="flex items-center gap-2 text-green-400 font-semibold group-hover:gap-4 transition-all">
              {t.select}
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>

          {/* Consumer Card */}
          <button
            onClick={() => selectProfile('consumer')}
            className="group relative bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border-2 border-cyan-500/30 rounded-2xl p-8 text-left hover:border-cyan-400 hover:shadow-[0_0_40px_rgba(6,182,212,0.2)] transition-all"
          >
            <div className="absolute top-4 right-4 w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-cyan-400" />
            </div>
            
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
              <Cpu className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-cyan-400 mb-2">{t.consumer}</h2>
            <p className="text-slate-400 mb-6">{t.consumerDesc}</p>
            
            <ul className="space-y-3 mb-8">
              {t.consumerFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                  {feature}
                </li>
              ))}
            </ul>
            
            <div className="flex items-center gap-2 text-cyan-400 font-semibold group-hover:gap-4 transition-all">
              {t.select}
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>
        </div>

        {/* Footer note */}
        <p className="text-center text-slate-500 text-sm mt-8">
          {t.canSwitch}
        </p>
      </div>

      {/* Modal de detecção de hardware */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-green-500/50 rounded-2xl p-8 max-w-md w-full mx-4 shadow-[0_0_50px_rgba(34,197,94,0.3)]">
            {status === 'detecting' && (
              <div className="text-center">
                <Loader2 className="w-16 h-16 text-green-400 animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">{t.detecting}</h3>
                <div className="w-full bg-slate-700 rounded-full h-2 mt-4">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {status === 'registering' && (
              <div className="text-center">
                <Loader2 className="w-16 h-16 text-green-400 animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">{t.registering}</h3>
                {hardware && (
                  <div className="bg-slate-800 rounded-lg p-4 mt-4 text-left">
                    <p className="text-sm text-slate-400">
                      <span className="text-green-400">GPU:</span> {hardware.gpu?.model || 'Detectando...'}
                    </p>
                    <p className="text-sm text-slate-400">
                      <span className="text-green-400">CPU:</span> {hardware.cpu.cores} cores
                    </p>
                    <p className="text-sm text-slate-400">
                      <span className="text-green-400">RAM:</span> ~{hardware.ram.total}GB
                    </p>
                  </div>
                )}
                <div className="w-full bg-slate-700 rounded-full h-2 mt-4">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">{t.registered}</h3>
                {hardware && (
                  <div className="bg-slate-800 rounded-lg p-4 mt-4 text-left">
                    <p className="text-sm text-slate-400">
                      <span className="text-green-400">GPU:</span> {hardware.gpu?.model || 'Browser GPU'}
                    </p>
                    <p className="text-sm text-slate-400">
                      <span className="text-green-400">CPU:</span> {hardware.cpu.cores} cores
                    </p>
                    <p className="text-sm text-slate-400">
                      <span className="text-green-400">RAM:</span> ~{hardware.ram.total}GB
                    </p>
                  </div>
                )}
                <p className="text-green-400 text-sm mt-4">Redirecionando...</p>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">{t.errorDetecting}</h3>
                <p className="text-red-400 text-sm mb-4">{error}</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleRetry}
                    className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium"
                  >
                    {t.retry}
                  </button>
                  <button
                    onClick={skipToProvider}
                    className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium"
                  >
                    Continuar mesmo assim
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

