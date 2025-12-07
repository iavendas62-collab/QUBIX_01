/**
 * Account - Configurações da conta
 * Requirements: 6.3, 6.4 - Toast notifications and confirmation dialogs
 */
import { useState, useEffect } from 'react';
import { User, Mail, Shield, Wallet, Globe, LogOut, Copy, Check } from 'lucide-react';
import { notify } from '../../components/ui';
import { useNavigate } from 'react-router-dom';

export default function Account() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  }, []);

  const copyIdentity = () => {
    if (user?.qubicIdentity) {
      navigator.clipboard.writeText(user.qubicIdentity);
      setCopied(true);
      notify.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userProfile');
    navigate('/');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Account Settings</h1>

      {/* Profile */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><User className="w-5 h-5 text-cyan-400" /> Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Name</label>
            <input type="text" value={user?.name || ''} readOnly className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1 flex items-center gap-1"><Mail className="w-4 h-4" /> Email</label>
            <input type="email" value={user?.email || ''} readOnly className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3" />
          </div>
        </div>
      </div>

      {/* Wallet */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Wallet className="w-5 h-5 text-cyan-400" /> Qubic Wallet</h2>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Public Identity</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-cyan-400 text-sm font-mono overflow-hidden text-ellipsis">
              {user?.qubicIdentity || 'Not available'}
            </code>
            <button onClick={copyIdentity} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg">
              {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">This is your public Qubic identity. Share it to receive payments.</p>
        </div>
      </div>

      {/* Security */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-cyan-400" /> Security</h2>
        <button className="w-full bg-slate-700 hover:bg-slate-600 px-4 py-3 rounded-lg text-left">
          Change Password
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-slate-800 border border-red-500/30 rounded-xl p-6">
        <h2 className="font-semibold mb-4 text-red-400">Danger Zone</h2>
        <button onClick={handleLogout} className="flex items-center gap-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 px-4 py-3 rounded-lg">
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </div>
    </div>
  );
}

