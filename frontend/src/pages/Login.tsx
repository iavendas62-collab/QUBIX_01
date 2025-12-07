import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiUrl } from '../config';

interface LoginResponse {
  success: boolean;
  token: string;
  user: any;
  error?: string;
}

export function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 🔓 MOCK LOGIN - Funciona sem backend
      // Qualquer email/senha funciona para demo
      const mockUser = {
        id: `user-${Date.now()}`,
        email: formData.email || 'demo@qubix.io',
        username: formData.email?.split('@')[0] || 'Demo User',
        qubicAddress: `QUBIC${Math.random().toString(36).substring(2, 15).toUpperCase()}ADDRESS`,
        role: 'CONSUMER',
        balance: 10000
      };

      const mockToken = btoa(JSON.stringify(mockUser));
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('qubicAddress', mockUser.qubicAddress);

      console.log('✅ Mock login successful:', mockUser.email);
      
      // Pequeno delay para parecer real
      await new Promise(resolve => setTimeout(resolve, 500));
      
      navigate('/app/dashboard');

    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 rounded-2xl border border-cyan-500 p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">QUBIX</h1>
          <p className="text-cyan-400">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-cyan-500/50 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
              placeholder="you@example.com"
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
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white py-3 rounded-lg font-semibold"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Don't have an account?{' '}
          <Link to="/signup" className="text-cyan-400 hover:text-cyan-300">
            Create one
          </Link>
        </div>

        <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-center">
          <p className="text-xs text-cyan-400">
            🔓 Demo Mode: Any email/password works!
          </p>
        </div>
      </div>
    </div>
  );
}

