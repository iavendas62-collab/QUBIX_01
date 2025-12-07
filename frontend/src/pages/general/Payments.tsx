/**
 * Payments - Transaction history for payments and earnings
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */
import { useState, useEffect } from 'react';
import { CreditCard, ArrowUpRight, ArrowDownLeft, Download } from 'lucide-react';
import TransactionHistory from '../../components/TransactionHistory';
import TransactionDetails from '../../components/TransactionDetails';

interface Transaction {
  id: string;
  type: 'PAYMENT' | 'EARNING' | 'REFUND' | 'ESCROW_LOCK' | 'ESCROW_RELEASE';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  qubicTxHash: string | null;
  createdAt: string;
  completedAt: string | null;
  job?: {
    id: string;
    modelType: string;
    status: string;
  } | null;
}

export default function Payments() {
  const [qubicAddress, setQubicAddress] = useState<string>('');
  const [balance, setBalance] = useState<number>(0);
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [totalEarned, setTotalEarned] = useState<number>(0);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    // Get user's Qubic address from localStorage or auth context
    const storedAddress = localStorage.getItem('qubicAddress');
    if (storedAddress) {
      setQubicAddress(storedAddress);
      fetchSummary(storedAddress);
    }
  }, []);

  const fetchSummary = async (address: string) => {
    try {
      // Fetch user balance and transaction summary
      const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(
        `${apiUrl}/api/transactions/history/${address}?limit=1000`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.transactions) {
          // Calculate totals
          let spent = 0;
          let earned = 0;
          
          data.transactions.forEach((tx: Transaction) => {
            if (tx.status === 'COMPLETED') {
              if (['PAYMENT', 'ESCROW_LOCK'].includes(tx.type)) {
                spent += tx.amount;
              } else if (['EARNING', 'ESCROW_RELEASE', 'REFUND'].includes(tx.type)) {
                earned += tx.amount;
              }
            }
          });
          
          setTotalSpent(spent);
          setTotalEarned(earned);
          setBalance(earned - spent);
        }
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleExport = () => {
    // TODO: Implement CSV export
    alert('Export functionality coming soon!');
  };

  if (!qubicAddress) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Payments</h1>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
          <p className="text-slate-400 mb-4">Please connect your Qubic wallet to view transactions</p>
          <button className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg transition-colors">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payments</h1>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 border border-slate-600 hover:bg-slate-800 px-4 py-2 rounded-lg transition-colors"
        >
          <Download className="w-5 h-5" /> Export
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <CreditCard className="w-8 h-8 text-cyan-400 mb-3" />
          <div className="text-3xl font-bold text-cyan-400">{balance.toFixed(2)} QUBIC</div>
          <div className="text-sm text-slate-400">Current Balance</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <ArrowDownLeft className="w-8 h-8 text-red-400 mb-3" />
          <div className="text-3xl font-bold text-red-400">-{totalSpent.toFixed(2)} QUBIC</div>
          <div className="text-sm text-slate-400">Total Spent</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <ArrowUpRight className="w-8 h-8 text-green-400 mb-3" />
          <div className="text-3xl font-bold text-green-400">+{totalEarned.toFixed(2)} QUBIC</div>
          <div className="text-sm text-slate-400">Total Earned</div>
        </div>
      </div>

      {/* Transaction History */}
      <TransactionHistory 
        qubicAddress={qubicAddress}
        onTransactionClick={setSelectedTransaction}
      />

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <TransactionDetails
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
}
