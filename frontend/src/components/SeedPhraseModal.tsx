import React, { useState } from 'react';
import { X, Copy, AlertTriangle, Check } from 'lucide-react';

interface SeedPhraseModalProps {
  seed: string;
  onConfirm: () => void;
  onClose?: () => void;
}

export const SeedPhraseModal: React.FC<SeedPhraseModalProps> = ({ seed, onConfirm, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(seed);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleConfirm = () => {
    if (confirmed) {
      onConfirm();
    }
  };

  // Prevent closing by clicking outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 relative">
        {/* Close button disabled until confirmed */}
        {onClose && confirmed && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        )}

        {/* Warning Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-yellow-100 p-3 rounded-full">
            <AlertTriangle className="text-yellow-600" size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Save Your Seed Phrase</h2>
            <p className="text-sm text-gray-600">This is the ONLY time you'll see this</p>
          </div>
        </div>

        {/* Important Warning */}
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="text-red-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-red-800 font-semibold mb-1">⚠️ CRITICAL WARNING</h3>
              <ul className="text-red-700 text-sm space-y-1">
                <li>• This seed phrase controls your Qubic wallet</li>
                <li>• We CANNOT recover it if you lose it</li>
                <li>• Anyone with this phrase can access your funds</li>
                <li>• Never share it with anyone</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Seed Phrase Display */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Seed Phrase
          </label>
          <div className="relative">
            <div className="bg-gray-900 border-2 border-gray-600 rounded-lg p-4 font-mono text-lg break-all select-all text-white">
              {seed}
            </div>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 bg-white border border-gray-300 rounded px-3 py-1.5 text-sm font-medium hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              {copied ? (
                <>
                  <Check size={16} className="text-green-600" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">How to save it securely:</h3>
          <ol className="text-blue-800 text-sm space-y-1 list-decimal list-inside">
            <li>Write it down on paper and store in a safe place</li>
            <li>Consider using a password manager</li>
            <li>Never store it in plain text on your computer</li>
            <li>Make multiple backup copies in different locations</li>
          </ol>
        </div>

        {/* Confirmation Checkbox */}
        <div className="mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              <strong>I have saved my seed phrase securely.</strong> I understand that if I lose it, 
              I will permanently lose access to my wallet and funds. There is no way to recover it.
            </span>
          </label>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleConfirm}
          disabled={!confirmed}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all ${
            confirmed
              ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {confirmed ? 'Continue to Dashboard' : 'Please confirm you have saved your seed phrase'}
        </button>

        {/* Additional Warning */}
        <p className="text-center text-xs text-gray-500 mt-4">
          Once you continue, you will not be able to see this seed phrase again
        </p>
      </div>
    </div>
  );
};

export default SeedPhraseModal;
