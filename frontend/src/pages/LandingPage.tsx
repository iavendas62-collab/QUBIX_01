import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Cpu, Zap, DollarSign, Shield, Globe, ArrowRight, 
  Play, Server, TrendingUp, Users, ChevronRight, CheckCircle, Sparkles
} from 'lucide-react';
import LanguageSelector from '../components/LanguageSelector';
import { useLanguage } from '../i18n/LanguageContext';
import { QuickProvider } from '../components/QuickProvider';

const texts = {
  en: {
    hero: 'The First Decentralized',
    heroHighlight: 'GPU Marketplace',
    heroSub: 'on Qubic',
    description: 'Rent powerful GPUs for AI, Gaming, and Rendering. Or earn QUBIC by sharing your hardware.',
    rentGpu: 'Rent GPU',
    rentGpuDesc: 'Access powerful GPUs instantly',
    earnMoney: 'Earn with your GPU',
    earnMoneyDesc: 'Share hardware, earn QUBIC',
    login: 'Login',
    register: 'Get Started',
    stats: {
      providers: 'Active Providers',
      compute: 'Available Compute',
      price: 'Avg Price/Hour'
    },
    features: {
      title: 'Why QUBIX?',
      cheap: 'Up to 70% Cheaper',
      cheapDesc: 'Than traditional cloud providers',
      fast: 'Instant Access',
      fastDesc: 'No waiting, no contracts',
      secure: 'Blockchain Secured',
      secureDesc: 'Payments via Qubic network',
      global: 'Global Network',
      globalDesc: 'GPUs from around the world'
    },
    howItWorks: 'How it Works',
    forConsumers: 'For Consumers',
    forProviders: 'For Providers',
    step1c: 'Browse GPUs',
    step1cDesc: 'Find the perfect GPU for your needs',
    step2c: 'Pay with QUBIC',
    step2cDesc: 'Secure blockchain payment',
    step3c: 'Start Using',
    step3cDesc: 'Instant access via SSH or Jupyter',
    step1p: 'Install Worker',
    step1pDesc: 'Simple one-line installation',
    step2p: 'Set Your Price',
    step2pDesc: 'You control your earnings',
    step3p: 'Earn QUBIC',
    step3pDesc: 'Get paid automatically',
    shareGpu: {
      title: 'Share Your GPU',
      subtitle: 'Start earning QUBIC in seconds',
      description: 'Turn your idle GPU into a passive income stream. One click to register, automatic payments.',
      cta: 'Share My GPU Now',
      benefits: {
        instant: 'Instant Setup',
        instantDesc: 'One-click registration, no complex configuration',
        earn: 'Earn QUBIC',
        earnDesc: 'Get paid automatically for every compute job',
        secure: 'Secure & Safe',
        secureDesc: 'Blockchain-secured payments, you stay in control'
      },
      successTitle: 'You\'re Now a Provider!',
      successDesc: 'Your GPU is online and ready to earn QUBIC tokens.'
    }
  },
  pt: {
    hero: 'O Primeiro Marketplace',
    heroHighlight: 'Descentralizado de GPU',
    heroSub: 'na Qubic',
    description: 'Alugue GPUs poderosas para IA, Gaming e Renderização. Ou ganhe QUBIC compartilhando seu hardware.',
    rentGpu: 'Alugar GPU',
    rentGpuDesc: 'Acesse GPUs poderosas instantaneamente',
    earnMoney: 'Ganhe com sua GPU',
    earnMoneyDesc: 'Compartilhe hardware, ganhe QUBIC',
    login: 'Entrar',
    register: 'Começar',
    stats: {
      providers: 'Provedores Ativos',
      compute: 'Computação Disponível',
      price: 'Preço Médio/Hora'
    },
    features: {
      title: 'Por que QUBIX?',
      cheap: 'Até 70% Mais Barato',
      cheapDesc: 'Que provedores de nuvem tradicionais',
      fast: 'Acesso Instantâneo',
      fastDesc: 'Sem espera, sem contratos',
      secure: 'Segurança Blockchain',
      secureDesc: 'Pagamentos via rede Qubic',
      global: 'Rede Global',
      globalDesc: 'GPUs de todo o mundo'
    },
    howItWorks: 'Como Funciona',
    forConsumers: 'Para Consumidores',
    forProviders: 'Para Provedores',
    step1c: 'Navegue pelas GPUs',
    step1cDesc: 'Encontre a GPU perfeita para suas necessidades',
    step2c: 'Pague com QUBIC',
    step2cDesc: 'Pagamento seguro via blockchain',
    step3c: 'Comece a Usar',
    step3cDesc: 'Acesso instantâneo via SSH ou Jupyter',
    step1p: 'Instale o Worker',
    step1pDesc: 'Instalação simples de uma linha',
    step2p: 'Defina Seu Preço',
    step2pDesc: 'Você controla seus ganhos',
    step3p: 'Ganhe QUBIC',
    step3pDesc: 'Receba automaticamente',
    shareGpu: {
      title: 'Compartilhe Sua GPU',
      subtitle: 'Comece a ganhar QUBIC em segundos',
      description: 'Transforme sua GPU ociosa em renda passiva. Um clique para registrar, pagamentos automáticos.',
      cta: 'Compartilhar Minha GPU',
      benefits: {
        instant: 'Configuração Instantânea',
        instantDesc: 'Registro com um clique, sem configuração complexa',
        earn: 'Ganhe QUBIC',
        earnDesc: 'Receba automaticamente por cada trabalho de computação',
        secure: 'Seguro & Protegido',
        secureDesc: 'Pagamentos via blockchain, você mantém o controle'
      },
      successTitle: 'Você Agora é um Provedor!',
      successDesc: 'Sua GPU está online e pronta para ganhar tokens QUBIC.'
    }
  },
  es: {
    hero: 'El Primer Marketplace',
    heroHighlight: 'Descentralizado de GPU',
    heroSub: 'en Qubic',
    description: 'Alquila GPUs potentes para IA, Gaming y Renderizado. O gana QUBIC compartiendo tu hardware.',
    rentGpu: 'Alquilar GPU',
    rentGpuDesc: 'Accede a GPUs potentes al instante',
    earnMoney: 'Gana con tu GPU',
    earnMoneyDesc: 'Comparte hardware, gana QUBIC',
    login: 'Iniciar Sesión',
    register: 'Comenzar',
    stats: {
      providers: 'Proveedores Activos',
      compute: 'Cómputo Disponible',
      price: 'Precio Promedio/Hora'
    },
    features: {
      title: '¿Por qué QUBIX?',
      cheap: 'Hasta 70% Más Barato',
      cheapDesc: 'Que proveedores de nube tradicionales',
      fast: 'Acceso Instantáneo',
      fastDesc: 'Sin esperas, sin contratos',
      secure: 'Seguridad Blockchain',
      secureDesc: 'Pagos vía red Qubic',
      global: 'Red Global',
      globalDesc: 'GPUs de todo el mundo'
    },
    howItWorks: 'Cómo Funciona',
    forConsumers: 'Para Consumidores',
    forProviders: 'Para Proveedores',
    step1c: 'Explora GPUs',
    step1cDesc: 'Encuentra la GPU perfecta para tus necesidades',
    step2c: 'Paga con QUBIC',
    step2cDesc: 'Pago seguro vía blockchain',
    step3c: 'Empieza a Usar',
    step3cDesc: 'Acceso instantáneo vía SSH o Jupyter',
    step1p: 'Instala el Worker',
    step1pDesc: 'Instalación simple de una línea',
    step2p: 'Define Tu Precio',
    step2pDesc: 'Tú controlas tus ganancias',
    step3p: 'Gana QUBIC',
    step3pDesc: 'Recibe automáticamente',
    shareGpu: {
      title: 'Comparte Tu GPU',
      subtitle: 'Empieza a ganar QUBIC en segundos',
      description: 'Convierte tu GPU inactiva en ingresos pasivos. Un clic para registrar, pagos automáticos.',
      cta: 'Compartir Mi GPU',
      benefits: {
        instant: 'Configuración Instantánea',
        instantDesc: 'Registro con un clic, sin configuración compleja',
        earn: 'Gana QUBIC',
        earnDesc: 'Recibe automáticamente por cada trabajo de cómputo',
        secure: 'Seguro & Protegido',
        secureDesc: 'Pagos vía blockchain, tú mantienes el control'
      },
      successTitle: '¡Ahora Eres un Proveedor!',
      successDesc: 'Tu GPU está en línea y lista para ganar tokens QUBIC.'
    }
  }
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = texts[language];
  const [stats] = useState({ providers: 156, compute: 4500, price: 5.5 });
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const shareGpuRef = useRef<HTMLElement>(null);

  // Smooth scroll to Share GPU section
  const scrollToShareGpu = () => {
    shareGpuRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Handle successful provider registration
  const handleProviderSuccess = (_provider: any) => {
    setRegistrationSuccess(true);
    // Update stats to reflect new provider
    // In production, this would fetch from API
  };

  // Handle registration error
  const handleProviderError = (error: Error) => {
    console.error('Provider registration error:', error);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-cyan-400">QUBIX</div>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <button
              onClick={() => navigate('/app/dashboard')}
              className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold transition-colors"
            >
              {t.register}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[120px] -top-40 -left-40" />
          <div className="absolute w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[100px] top-40 right-20" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl font-bold mb-4">
              {t.hero}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                {t.heroHighlight}
              </span>
              <br />
              <span className="text-3xl md:text-4xl text-slate-400">{t.heroSub}</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mt-6">
              {t.description}
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col md:flex-row gap-6 justify-center mb-16">
            <button
              onClick={() => navigate('/app/dashboard')}
              className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-bold text-lg overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center gap-3">
                <Play className="w-6 h-6" />
                {t.rentGpu}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <span className="relative block text-sm font-normal text-cyan-100 mt-1">
                {t.rentGpuDesc}
              </span>
            </button>

            <button
              onClick={scrollToShareGpu}
              className="group relative px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl font-bold text-lg overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center gap-3">
                <DollarSign className="w-6 h-6" />
                {t.earnMoney}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <span className="relative block text-sm font-normal text-green-100 mt-1">
                {t.earnMoneyDesc}
              </span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="text-center p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
              <Users className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">{stats.providers}</div>
              <div className="text-sm text-slate-400">{t.stats.providers}</div>
            </div>
            <div className="text-center p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
              <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">{stats.compute} TFLOPS</div>
              <div className="text-sm text-slate-400">{t.stats.compute}</div>
            </div>
            <div className="text-center p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
              <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">{stats.price} QUBIC</div>
              <div className="text-sm text-slate-400">{t.stats.price}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">{t.features.title}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl text-center">
              <TrendingUp className="w-10 h-10 text-green-400 mx-auto mb-4" />
              <h3 className="font-bold mb-2">{t.features.cheap}</h3>
              <p className="text-sm text-slate-400">{t.features.cheapDesc}</p>
            </div>
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl text-center">
              <Zap className="w-10 h-10 text-yellow-400 mx-auto mb-4" />
              <h3 className="font-bold mb-2">{t.features.fast}</h3>
              <p className="text-sm text-slate-400">{t.features.fastDesc}</p>
            </div>
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl text-center">
              <Shield className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
              <h3 className="font-bold mb-2">{t.features.secure}</h3>
              <p className="text-sm text-slate-400">{t.features.secureDesc}</p>
            </div>
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl text-center">
              <Globe className="w-10 h-10 text-blue-400 mx-auto mb-4" />
              <h3 className="font-bold mb-2">{t.features.global}</h3>
              <p className="text-sm text-slate-400">{t.features.globalDesc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">{t.howItWorks}</h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            {/* Consumer Flow */}
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-cyan-400 mb-6 flex items-center gap-2">
                <Cpu className="w-6 h-6" />
                {t.forConsumers}
              </h3>
              <div className="space-y-6">
                {[
                  { step: '1', title: t.step1c, desc: t.step1cDesc },
                  { step: '2', title: t.step2c, desc: t.step2cDesc },
                  { step: '3', title: t.step3c, desc: t.step3cDesc }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center font-bold text-sm">
                      {item.step}
                    </div>
                    <div>
                      <div className="font-semibold">{item.title}</div>
                      <div className="text-sm text-slate-400">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/app/dashboard')}
                className="mt-6 w-full py-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                {t.rentGpu} <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Provider Flow */}
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-green-400 mb-6 flex items-center gap-2">
                <Server className="w-6 h-6" />
                {t.forProviders}
              </h3>
              <div className="space-y-6">
                {[
                  { step: '1', title: t.step1p, desc: t.step1pDesc },
                  { step: '2', title: t.step2p, desc: t.step2pDesc },
                  { step: '3', title: t.step3p, desc: t.step3pDesc }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center font-bold text-sm">
                      {item.step}
                    </div>
                    <div>
                      <div className="font-semibold">{item.title}</div>
                      <div className="text-sm text-slate-400">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={scrollToShareGpu}
                className="mt-6 w-full py-3 bg-green-500 hover:bg-green-600 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                {t.earnMoney} <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Share Your GPU Section */}
      <section ref={shareGpuRef} id="share-gpu" className="py-20 px-6 bg-gradient-to-b from-slate-950 to-black relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[120px] -bottom-40 -right-40" />
          <div className="absolute w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px] top-20 left-20" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              {t.shareGpu.subtitle}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                {t.shareGpu.title}
              </span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              {t.shareGpu.description}
            </p>
          </div>

          {/* Benefit Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 bg-slate-900/50 border border-green-500/20 rounded-xl text-center hover:border-green-500/40 transition-colors">
              <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-7 h-7 text-green-400" />
              </div>
              <h3 className="font-bold text-lg mb-2">{t.shareGpu.benefits.instant}</h3>
              <p className="text-sm text-slate-400">{t.shareGpu.benefits.instantDesc}</p>
            </div>
            <div className="p-6 bg-slate-900/50 border border-green-500/20 rounded-xl text-center hover:border-green-500/40 transition-colors">
              <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-7 h-7 text-green-400" />
              </div>
              <h3 className="font-bold text-lg mb-2">{t.shareGpu.benefits.earn}</h3>
              <p className="text-sm text-slate-400">{t.shareGpu.benefits.earnDesc}</p>
            </div>
            <div className="p-6 bg-slate-900/50 border border-green-500/20 rounded-xl text-center hover:border-green-500/40 transition-colors">
              <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-green-400" />
              </div>
              <h3 className="font-bold text-lg mb-2">{t.shareGpu.benefits.secure}</h3>
              <p className="text-sm text-slate-400">{t.shareGpu.benefits.secureDesc}</p>
            </div>
          </div>

          {/* QuickProvider Component or Success Animation */}
          {registrationSuccess ? (
            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-2xl p-8 text-center animate-fade-in">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-once">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-green-400 mb-2">{t.shareGpu.successTitle}</h3>
                <p className="text-slate-300 mb-6">{t.shareGpu.successDesc}</p>
                <button
                  onClick={() => navigate('/provider/dashboard')}
                  className="px-8 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-semibold transition-colors flex items-center gap-2 mx-auto"
                >
                  View Dashboard <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <QuickProvider 
                onSuccess={handleProviderSuccess}
                onError={handleProviderError}
              />
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto text-center text-slate-500 text-sm">
          <p>© 2024 QUBIX - Built on Qubic Network</p>
        </div>
      </footer>
    </div>
  );
}
