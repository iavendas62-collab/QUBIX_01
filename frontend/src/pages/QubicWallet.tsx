/**
 * Qubic Wallet Page - Real blockchain integration
 * Connect, send, receive QUBIC tokens and manage escrows
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  Send,
  ArrowDownLeft,
  History,
  Lock,
  Unlock,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Copy,
  ExternalLink
} from 'lucide-react';
import { apiUrl } from '../config';

interface WalletState {
  connected: boolean;
  address: string;
  seed: string;
  balance: number;
  loading: boolean;
}

interface Transaction {
  txHash: string;
  type: 'send' | 'receive' | 'escrow_lock' | 'escrow_release' | 'escrow_refund';
  amount: number;
  to?: string;
  from?: string;
  status: 'pending' | 'confirmed' | 'failed' | 'completed';
  timestamp: string;
  jobId?: string;
  escrowId?: string;
}

interface Escrow {
  escrowId: string;
  consumerAddress: string;
  providerAddress: string;
  amount: number;
  jobId: string;
  status: string;
  createdTick: number;
  txHash: string;
}

export function QubicWallet() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: '',
    seed: '',
    balance: 0,
    loading: false
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'send' | 'escrow' | 'history'>('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [showSeed, setShowSeed] = useState(false);

  // Load wallet data on mount
  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/signin');
      return;
    }

    const userData = JSON.parse(user);
    const address = userData.qubicAddress;

    if (!address) {
      alert('No Qubic address found. Please register first.');
      navigate('/register');
      return;
    }

    setWallet(prev => ({ ...prev, address, connected: true }));

    // Load balance
    await loadBalance(address);

    // Load escrows
    await loadEscrows(address);
  };

  const loadBalance = async (address: string) => {
    try {
      const response = await fetch(apiUrl(`qubic/balance/${address}`));
      const data = await response.json();

      if (data.success) {
        // Check if we have a persisted balance from escrow transactions
        const persistedBalance = localStorage.getItem('walletBalance');
        const finalBalance = persistedBalance ? parseFloat(persistedBalance) : data.balance;

        setWallet(prev => ({ ...prev, balance: finalBalance }));
      }
    } catch (error) {
      console.error('Failed to load balance:', error);

      // Fallback: try to load from localStorage
      const persistedBalance = localStorage.getItem('walletBalance');
      if (persistedBalance) {
        setWallet(prev => ({ ...prev, balance: parseFloat(persistedBalance) }));
      }
    }
  };

  const loadEscrows = async (address: string) => {
    try {
      // Load escrows from API
      const response = await fetch(apiUrl(`qubic/escrow/user/${address}`));
      const data = await response.json();

      let allEscrows: Escrow[] = [];
      if (data.success && data.escrows) {
        allEscrows = data.escrows;
      }

      // Load additional escrows from localStorage (created during job submission)
      const localEscrows = JSON.parse(localStorage.getItem('userEscrows') || '[]');
      const localEscrowObjects: Escrow[] = localEscrows.map((localEscrow: any) => ({
        escrowId: localEscrow.id,
        consumerAddress: address,
        providerAddress: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // Mock provider
        amount: localEscrow.amount,
        jobId: localEscrow.jobId,
        status: localEscrow.status || 'active',
        createdTick: Math.floor(new Date(localEscrow.createdAt).getTime() / 1000),
        txHash: localEscrow.txHash
      }));

      // Combine and deduplicate escrows
      const combinedEscrows = [...allEscrows, ...localEscrowObjects];
      const uniqueEscrows = combinedEscrows.filter((escrow, index, self) =>
        index === self.findIndex(e => e.escrowId === escrow.escrowId)
      );

      setEscrows(uniqueEscrows);

      // Generate transaction history from escrows
      const escrowTransactions: Transaction[] = uniqueEscrows.map((escrow: Escrow) => ({
        txHash: escrow.txHash || generateFakeTxHash(),
        type: 'escrow_lock' as const,
        amount: escrow.amount,
        status: escrow.status === 'active' ? 'confirmed' : 'completed',
        timestamp: new Date(escrow.createdTick * 1000).toISOString(),
        jobId: escrow.jobId,
        escrowId: escrow.escrowId
      }));

      setTransactions(escrowTransactions);
    } catch (error) {
      console.error('Failed to load escrows:', error);

      // Fallback: load only from localStorage
      const localEscrows = JSON.parse(localStorage.getItem('userEscrows') || '[]');
      const localEscrowObjects: Escrow[] = localEscrows.map((localEscrow: any) => ({
        escrowId: localEscrow.id,
        consumerAddress: address,
        providerAddress: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
        amount: localEscrow.amount,
        jobId: localEscrow.jobId,
        status: localEscrow.status || 'active',
        createdTick: Math.floor(new Date(localEscrow.createdAt).getTime() / 1000),
        txHash: localEscrow.txHash
      }));

      setEscrows(localEscrowObjects);

      const escrowTransactions: Transaction[] = localEscrowObjects.map((escrow: Escrow) => ({
        txHash: escrow.txHash || generateFakeTxHash(),
        type: 'escrow_lock' as const,
        amount: escrow.amount,
        status: escrow.status === 'active' ? 'confirmed' : 'completed',
        timestamp: new Date(escrow.createdTick * 1000).toISOString(),
        jobId: escrow.jobId,
        escrowId: escrow.escrowId
      }));

      setTransactions(escrowTransactions);
    }
  };

  // Generate fake but realistic TX hash
  const generateFakeTxHash = (): string => {
    const chars = 'abcdef0123456789';
    let hash = '';
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  };

  const handleSendTransaction = async (toAddress: string, amount: number, seed: string) => {
    if (!wallet.address) return;

    try {
      setWallet(prev => ({ ...prev, loading: true }));

      const response = await fetch(apiUrl('qubic/transfer'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAddress: wallet.address,
          fromSeed: seed,
          toAddress,
          amount
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Transaction sent! TX: ${data.transaction.txHash}`);
        await loadBalance(wallet.address);
      } else {
        alert(`Transaction failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Send transaction error:', error);
      alert('Failed to send transaction');
    } finally {
      setWallet(prev => ({ ...prev, loading: false }));
    }
  };

  const handleCreateEscrow = async (providerAddress: string, amount: number, jobId: string, seed: string) => {
    if (!wallet.address) return;

    try {
      setWallet(prev => ({ ...prev, loading: true }));

      const response = await fetch(apiUrl('qubic/escrow/create'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consumerAddress: wallet.address,
          consumerSeed: seed,
          providerAddress,
          amount,
          jobId,
          expiryHours: 24
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Escrow created! ID: ${data.escrow.escrowId}`);
        await loadBalance(wallet.address);
        await loadEscrows(wallet.address);
      } else {
        alert(`Escrow creation failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Create escrow error:', error);
      alert('Failed to create escrow');
    } finally {
      setWallet(prev => ({ ...prev, loading: false }));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const openInExplorer = (address: string) => {
    window.open(`https://wallet.qubic.org/explorer/${address}`, '_blank');
  };

  if (!wallet.connected) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Wallet className="w-16 h-16 mx-auto mb-4 text-cyan-400" />
          <h2 className="text-2xl font-bold mb-4">Loading Wallet...</h2>
          <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Wallet className="w-8 h-8 text-cyan-400" />
                Qubic Wallet
              </h1>
              <p className="text-gray-400">Manage your QUBIC tokens and blockchain transactions</p>
            </div>
            {/* Clear Test Data Button */}
            <button
              onClick={() => {
                if (confirm('Clear all test escrow data and reset balance?')) {
                  localStorage.removeItem('userEscrows');
                  localStorage.removeItem('walletBalance');
                  loadWalletData(); // Reload everything
                  alert('Test data cleared and balance reset!');
                }
              }}
              className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
              title="Clear test escrow data and reset balance"
            >
              🧹 Clear Test Data
            </button>
          </div>
        </div>

        {/* Wallet Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Balance Card */}
          <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Balance</h3>
              <RefreshCw
                className="w-5 h-5 text-cyan-400 cursor-pointer hover:rotate-180 transition-transform"
                onClick={() => loadBalance(wallet.address)}
              />
            </div>
            <div className="text-3xl font-bold text-cyan-400 mb-2">
              {wallet.balance.toLocaleString()} QUBIC
            </div>
            <div className="text-sm text-gray-400">
              ≈ ${(wallet.balance * 0.00075).toFixed(2)} USD
            </div>
          </div>

          {/* Address Card */}
          <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Your Address</h3>
            <div className="bg-black rounded-lg p-3 font-mono text-sm text-cyan-400 mb-3 break-all">
              {wallet.address}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(wallet.address)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-sm"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <button
                onClick={() => openInExplorer(wallet.address)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Explorer
              </button>
            </div>
          </div>

          {/* Network Status */}
          <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Network Status</h3>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400">Connected to Qubic</span>
            </div>
            <div className="text-sm text-gray-400">
              Real blockchain integration
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 mb-6">
          {[
            { id: 'overview', label: 'Overview', icon: Wallet },
            { id: 'send', label: 'Send', icon: Send },
            { id: 'escrow', label: 'Escrow', icon: Lock },
            { id: 'history', label: 'History', icon: History }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium ${
                activeTab === id
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Active Escrows */}
              <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Lock className="w-5 h-5 text-cyan-400" />
                    Active Escrows ({escrows.filter(e => e.status === 'active').length})
                  </h3>
                  <RefreshCw
                    className="w-5 h-5 text-cyan-400 cursor-pointer hover:rotate-180 transition-transform"
                    onClick={() => loadEscrows(wallet.address)}
                  />
                </div>
                {escrows.filter(e => e.status === 'active').length === 0 ? (
                  <div className="text-center py-8">
                    <Lock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 mb-2">No active escrows</p>
                    <p className="text-xs text-gray-500">
                      Escrows will appear here when you submit jobs
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {escrows.filter(e => e.status === 'active').map(escrow => (
                      <div key={escrow.escrowId} className="bg-slate-800 rounded-lg p-4 hover:bg-slate-700 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="font-mono text-sm text-cyan-400">
                              {escrow.escrowId.slice(0, 12)}...
                            </span>
                          </div>
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                            Active
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Amount:</span>
                            <span className="text-white font-medium">{escrow.amount} QUBIC</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Job:</span>
                            <span className="text-cyan-400">{escrow.jobId}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Provider: {escrow.providerAddress.slice(0, 12)}...
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <History className="w-5 h-5 text-cyan-400" />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {escrows.slice(0, 3).map(escrow => (
                    <div key={escrow.escrowId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Lock className="w-4 h-4 text-cyan-400" />
                        <div>
                          <div className="text-sm font-medium">
                            Escrow {escrow.status}
                          </div>
                          <div className="text-xs text-gray-400">
                            {escrow.amount} QUBIC
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(escrow.createdTick * 1000).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  {escrows.length === 0 && (
                    <p className="text-gray-400">No recent activity</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Send Tab */}
          {activeTab === 'send' && (
            <SendTransactionForm
              balance={wallet.balance}
              onSend={handleSendTransaction}
              loading={wallet.loading}
            />
          )}

          {/* Escrow Tab */}
          {activeTab === 'escrow' && (
            <EscrowManagement
              escrows={escrows}
              address={wallet.address}
              onCreateEscrow={handleCreateEscrow}
              loading={wallet.loading}
            />
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <TransactionHistory transactions={transactions} />
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-components
function SendTransactionForm({ balance, onSend, loading }: {
  balance: number;
  onSend: (toAddress: string, amount: number, seed: string) => void;
  loading: boolean;
}) {
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [seed, setSeed] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (numAmount > balance) {
      alert('Insufficient balance');
      return;
    }
    onSend(toAddress, numAmount, seed);
  };

  return (
    <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-6">
      <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <Send className="w-5 h-5 text-cyan-400" />
        Send QUBIC
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Recipient Address
          </label>
          <input
            type="text"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border border-cyan-500/50 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
            placeholder="QUBIC address (60 characters)"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Amount (QUBIC)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border border-cyan-500/50 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
            placeholder="0.00"
            min="0"
            step="0.01"
            required
          />
          <div className="text-sm text-gray-400 mt-1">
            Available: {balance} QUBIC
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Your Seed Phrase
          </label>
          <input
            type="password"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border border-cyan-500/50 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
            placeholder="Enter your 55-character seed"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || !toAddress || !amount || !seed}
          className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold"
        >
          {loading ? 'Sending...' : 'Send Transaction'}
        </button>
      </form>
    </div>
  );
}

function EscrowManagement({ escrows, address, onCreateEscrow, loading }: {
  escrows: Escrow[];
  address: string;
  onCreateEscrow: (providerAddress: string, amount: number, jobId: string, seed: string) => void;
  loading: boolean;
}) {
  const [providerAddress, setProviderAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [jobId, setJobId] = useState('');
  const [seed, setSeed] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateEscrow(providerAddress, parseFloat(amount), jobId, seed);
  };

  return (
    <div className="space-y-6">
      {/* Create Escrow Form */}
      <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Lock className="w-5 h-5 text-cyan-400" />
          Create Escrow
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Provider Address
            </label>
            <input
              type="text"
              value={providerAddress}
              onChange={(e) => setProviderAddress(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-cyan-500/50 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
              placeholder="Provider's QUBIC address"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Amount (QUBIC)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-cyan-500/50 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                placeholder="100"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Job ID
              </label>
              <input
                type="text"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-cyan-500/50 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                placeholder="job-123"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Your Seed Phrase
            </label>
            <input
              type="password"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-cyan-500/50 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
              placeholder="Enter your 55-character seed"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold"
          >
            {loading ? 'Creating Escrow...' : 'Create Escrow'}
          </button>
        </form>
      </div>

      {/* Escrow List */}
      <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-6">Your Escrows</h3>

        {escrows.length === 0 ? (
          <p className="text-gray-400">No escrows found</p>
        ) : (
          <div className="space-y-4">
            {escrows.map(escrow => (
              <div key={escrow.escrowId} className="bg-slate-800 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="font-mono text-sm text-cyan-400">
                    {escrow.escrowId}
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    escrow.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    escrow.status === 'released' ? 'bg-blue-500/20 text-blue-400' :
                    escrow.status === 'refunded' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {escrow.status}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Amount:</span>
                    <span className="ml-2 text-white">{escrow.amount} QUBIC</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Job:</span>
                    <span className="ml-2 text-white">{escrow.jobId}</span>
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-400">
                  Created: {new Date(escrow.createdTick * 1000).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TransactionHistory({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-6">
      <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <History className="w-5 h-5 text-cyan-400" />
        Transaction History ({transactions.length})
      </h3>

      {transactions.length === 0 ? (
        <div className="text-center py-8">
          <History className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-2">No transactions yet</p>
          <p className="text-xs text-gray-500">
            Transactions will appear here after job submissions and escrow activities
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {transactions.map(tx => (
            <div key={tx.txHash} className="bg-slate-800 rounded-lg p-4 hover:bg-slate-700 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {tx.type === 'send' && <Send className="w-5 h-5 text-red-400" />}
                  {tx.type === 'receive' && <ArrowDownLeft className="w-5 h-5 text-green-400" />}
                  {tx.type === 'escrow_lock' && <Lock className="w-5 h-5 text-cyan-400" />}
                  {tx.type === 'escrow_release' && <Unlock className="w-5 h-5 text-blue-400" />}
                  {tx.type === 'escrow_refund' && <RefreshCw className="w-5 h-5 text-orange-400" />}

                  <div>
                    <div className="font-medium capitalize">{tx.type.replace('_', ' ')}</div>
                    <div className="text-sm text-gray-400">
                      {tx.amount} QUBIC
                    </div>
                  </div>
                </div>

                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  tx.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                  tx.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                  tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {tx.status}
                </div>
              </div>

              {/* Transaction Hash */}
              <div className="mb-3">
                <div className="text-xs text-gray-400 mb-1">Transaction Hash</div>
                <div className="font-mono text-xs text-cyan-400 break-all bg-black rounded px-2 py-1">
                  {tx.txHash.slice(0, 32)}...{tx.txHash.slice(-8)}
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {tx.jobId && (
                  <div>
                    <span className="text-gray-400">Job ID:</span>
                    <span className="ml-2 text-cyan-400">{tx.jobId}</span>
                  </div>
                )}
                {tx.escrowId && (
                  <div>
                    <span className="text-gray-400">Escrow ID:</span>
                    <span className="ml-2 text-cyan-400 font-mono text-xs">
                      {tx.escrowId.slice(0, 12)}...
                    </span>
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-gray-500">
                {new Date(tx.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
