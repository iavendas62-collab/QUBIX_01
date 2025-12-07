import { useState } from 'react';
import { CheckCircle, Copy, DollarSign, Zap, ArrowRight, Monitor, Server } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';

interface BecomeProviderProps {
  onBack: () => void;
}

// Translations for this component
const texts = {
  en: {
    back: '← Back to Dashboard',
    title: 'Earn money with your',
    hardware: 'Hardware',
    subtitle: 'Share your GPU/CPU and receive QUBIC for every hour of use',
    earnings: '5-80 QUBIC/h',
    earningsLabel: 'Earnings per hour',
    time: '2 min',
    timeLabel: 'To get started',
    passive: '24/7',
    passiveLabel: 'Passive income',
    step1: 'Choose OS',
    step2: 'Install Worker',
    step3: 'Done!',
    whatOs: "What's your operating system?",
    copyRun: 'Copy and run in terminal',
    openTerminal: 'Open {terminal} and paste the command below:',
    tip: 'Tip',
    tipText: 'The Worker automatically detects your GPU/CPU and registers it on the marketplace.',
    ranCommand: "I've run the command",
    online: 'Your hardware is online! 🎉',
    onlineDesc: "Your GPU/CPU now appears on the marketplace. You'll receive QUBIC automatically when someone rents your hardware.",
    yourHardware: 'Your hardware',
    available: 'Online and available',
    viewDash: 'View Dashboard',
    copied: 'Copied!',
    copy: 'Copy',
  },
  pt: {
    back: '← Voltar ao Painel',
    title: 'Ganhe dinheiro com seu',
    hardware: 'Hardware',
    subtitle: 'Compartilhe sua GPU/CPU e receba QUBIC por cada hora de uso',
    earnings: '5-80 QUBIC/h',
    earningsLabel: 'Ganho por hora',
    time: '2 min',
    timeLabel: 'Para começar',
    passive: '24/7',
    passiveLabel: 'Renda passiva',
    step1: 'Escolher SO',
    step2: 'Instalar Worker',
    step3: 'Pronto!',
    whatOs: 'Qual seu sistema operacional?',
    copyRun: 'Copie e execute no terminal',
    openTerminal: 'Abra o {terminal} e cole o comando abaixo:',
    tip: 'Dica',
    tipText: 'O Worker detecta automaticamente sua GPU/CPU e registra no marketplace.',
    ranCommand: 'Já executei o comando',
    online: 'Seu hardware está online! 🎉',
    onlineDesc: 'Sua GPU/CPU agora aparece no marketplace. Você receberá QUBIC automaticamente quando alguém alugar seu hardware.',
    yourHardware: 'Seu hardware',
    available: 'Online e disponível',
    viewDash: 'Ver Painel',
    copied: 'Copiado!',
    copy: 'Copiar',
  },
  es: {
    back: '← Volver al Panel',
    title: 'Gana dinero con tu',
    hardware: 'Hardware',
    subtitle: 'Comparte tu GPU/CPU y recibe QUBIC por cada hora de uso',
    earnings: '5-80 QUBIC/h',
    earningsLabel: 'Ganancia por hora',
    time: '2 min',
    timeLabel: 'Para empezar',
    passive: '24/7',
    passiveLabel: 'Ingreso pasivo',
    step1: 'Elegir SO',
    step2: 'Instalar Worker',
    step3: '¡Listo!',
    whatOs: '¿Cuál es tu sistema operativo?',
    copyRun: 'Copia y ejecuta en terminal',
    openTerminal: 'Abre {terminal} y pega el comando:',
    tip: 'Consejo',
    tipText: 'El Worker detecta automáticamente tu GPU/CPU y lo registra en el marketplace.',
    ranCommand: 'Ya ejecuté el comando',
    online: '¡Tu hardware está online! 🎉',
    onlineDesc: 'Tu GPU/CPU ahora aparece en el marketplace. Recibirás QUBIC automáticamente cuando alguien alquile tu hardware.',
    yourHardware: 'Tu hardware',
    available: 'Online y disponible',
    viewDash: 'Ver Panel',
    copied: '¡Copiado!',
    copy: 'Copiar',
  }
};

export default function BecomeProvider({ onBack }: BecomeProviderProps) {
  const { language } = useLanguage();
  const t = texts[language];
  
  const [step, setStep] = useState(1);
  const [os, setOs] = useState<'windows' | 'linux' | 'mac'>('windows');
  const [copied, setCopied] = useState(false);

  const commands = {
    windows: `# Option 1: Auto Installer (Recommended)
# Download and run: https://qubix.network/install-windows.bat

# Option 2: Manual
curl -O https://qubix.network/worker.py
pip install psutil requests
python worker.py`,
    linux: `# Option 1: One-liner (Recommended)
curl -sSL https://qubix.network/install.sh | bash

# Option 2: Manual
curl -O https://qubix.network/worker.py
pip3 install psutil requests
python3 worker.py`,
    mac: `# Option 1: One-liner (Recommended)
curl -sSL https://qubix.network/install.sh | bash

# Option 2: Manual
curl -O https://qubix.network/worker.py
pip3 install psutil requests
python3 worker.py`
  };

  const copyCommand = () => {
    navigator.clipboard.writeText(commands[os]);
    setCopied(true);
    toast.success(t.copied);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <button onClick={onBack} className="text-slate-400 hover:text-white mb-8 flex items-center gap-2">
          {t.back}
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl mb-4 shadow-[0_0_30px_rgba(6,182,212,0.4)]">
            <Server className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-3">
            {t.title} <span className="text-cyan-400">{t.hardware}</span>
          </h1>
          <p className="text-lg text-slate-400">{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-center">
            <DollarSign className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-green-400">{t.earnings}</div>
            <div className="text-slate-400 text-xs">{t.earningsLabel}</div>
          </div>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-center">
            <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-yellow-400">{t.time}</div>
            <div className="text-slate-400 text-xs">{t.timeLabel}</div>
          </div>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-center">
            <Monitor className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-cyan-400">{t.passive}</div>
            <div className="text-slate-400 text-xs">{t.passiveLabel}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
          <div className="flex border-b border-slate-700">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                onClick={() => setStep(s)}
                className={`flex-1 py-4 text-center transition-colors ${
                  step === s ? 'bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full mr-2 text-sm ${
                  step > s ? 'bg-green-500 text-white' : step === s ? 'bg-cyan-500 text-white' : 'bg-slate-700'
                }`}>
                  {step > s ? '✓' : s}
                </span>
                {s === 1 && t.step1}
                {s === 2 && t.step2}
                {s === 3 && t.step3}
              </button>
            ))}
          </div>

          <div className="p-6">
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4">{t.whatOs}</h2>
                <div className="grid grid-cols-3 gap-3">
                  {(['windows', 'linux', 'mac'] as const).map((system) => (
                    <button
                      key={system}
                      onClick={() => { setOs(system); setStep(2); }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        os === system ? 'border-cyan-400 bg-cyan-500/10' : 'border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <div className="text-3xl mb-2">
                        {system === 'windows' && '🪟'}
                        {system === 'linux' && '🐧'}
                        {system === 'mac' && '🍎'}
                      </div>
                      <div className="font-semibold capitalize text-sm">{system}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-2">{t.copyRun}</h2>
                <p className="text-slate-400 text-sm mb-4">
                  {t.openTerminal.replace('{terminal}', os === 'windows' ? 'PowerShell' : 'Terminal')}
                </p>
                
                <div className="relative">
                  <pre className="bg-slate-950 border border-slate-700 rounded-lg p-4 text-xs overflow-x-auto">
                    <code className="text-green-400">{commands[os]}</code>
                  </pre>
                  <button
                    onClick={copyCommand}
                    className={`absolute top-3 right-3 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm transition-colors ${
                      copied ? 'bg-green-500 text-white' : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  >
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? t.copied : t.copy}
                  </button>
                </div>

                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-cyan-400 mt-0.5" />
                    <div>
                      <div className="font-semibold text-cyan-400 text-sm">{t.tip}</div>
                      <div className="text-xs text-slate-300">{t.tipText}</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setStep(3)}
                  className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  {t.ranCommand} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold mb-3">{t.online}</h2>
                <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">{t.onlineDesc}</p>

                <div className="bg-slate-800 rounded-lg p-4 max-w-sm mx-auto mb-6">
                  <div className="text-xs text-slate-400 mb-1">{t.yourHardware}</div>
                  <div className="text-lg font-bold text-cyan-400">NVIDIA GeForce MX150</div>
                  <div className="text-slate-400 text-sm">4 GB VRAM • 5 QUBIC/hour</div>
                  <div className="mt-3 flex items-center justify-center gap-2 text-green-400 text-sm">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    {t.available}
                  </div>
                </div>

                <button onClick={onBack} className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold transition-colors">
                  {t.viewDash}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

