/**
 * Register Page - CORRIGIDO
 * URLs corretas sem duplicação
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiUrl } from '../config';

interface RegisterResponse {
  success: boolean;
  token: string;
  user: any;
  wallet: {
    identity: string;
    seed: string;
  };
  error?: string;
}

export function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    type: 'CONSUMER' as 'CONSUMER' | 'PROVIDER'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [walletInfo, setWalletInfo] = useState<RegisterResponse['wallet'] | null>(null);
  const [showSeedModal, setShowSeedModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      // ✅ URL CORRETA: Usa apiUrl helper com endpoint de email
      const response = await fetch(apiUrl('auth/register-email'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          username: formData.name,
          role: formData.type
        })
      });

      const data: RegisterResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Save token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.wallet?.identity) {
        localStorage.setItem('qubicAddress', data.wallet.identity);
      }

      // Show seed phrase modal
      setWalletInfo(data.wallet);
      setShowSeedModal(true);

    } catch (err: any) {
      setError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    navigate('/select-profile');
  };

  if (showSeedModal && walletInfo) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-slate-900 rounded-2xl border border-cyan-500 p-8">
          <h2 className="text-3xl font-bold text-white mb-4">🎉 Account Created!</h2>
          <p className="text-cyan-400 mb-6">Your Qubic wallet has been created. Save your seed phrase!</p>

          <div className="bg-slate-800 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">Your Public Address</h3>
            <div className="bg-black rounded-lg p-4 font-mono text-sm text-cyan-400 break-all">
              {walletInfo.identity}
            </div>
          </div>

          <div className="bg-red-900/20 border border-red-500 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-red-400 mb-2">⚠️ Your Seed Phrase (NEVER SHARE!)</h3>
            <div className="bg-black rounded-lg p-4 font-mono text-sm text-white break-all">
              {walletInfo.seed}
            </div>
            <p className="text-sm text-gray-400 mt-3">
              Write this down and store it safely. You'll need it to recover your wallet.
            </p>
          </div>

          <button
            onClick={handleContinue}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-3 rounded-lg font-semibold"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 rounded-2xl border border-cyan-500 p-8">
        <h1 className="text-3xl font-bold text-white text-center mb-8">Create Account</h1>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-cyan-500/50 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-cyan-500/50 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-cyan-500/50 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Confirm Password</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-cyan-500/50 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Account Type</label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer ${
                formData.type === 'CONSUMER' ? 'border-cyan-500 bg-cyan-500/10' : 'border-cyan-500/30'
              }`}>
                <input
                  type="radio"
                  name="type"
                  value="CONSUMER"
                  checked={formData.type === 'CONSUMER'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="text-white font-medium mb-1">Consumer</div>
                  <div className="text-xs text-cyan-400">Use AI models</div>
                </div>
              </label>

              <label className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer ${
                formData.type === 'PROVIDER' ? 'border-cyan-500 bg-cyan-500/10' : 'border-cyan-500/30'
              }`}>
                <input
                  type="radio"
                  name="type"
                  value="PROVIDER"
                  checked={formData.type === 'PROVIDER'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="text-white font-medium mb-1">Provider</div>
                  <div className="text-xs text-cyan-400">Provide compute</div>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white py-3 rounded-lg font-semibold"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
