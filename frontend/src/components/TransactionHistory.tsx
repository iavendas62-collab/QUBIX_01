/**
 * TransactionHistory Component
 * 
 * Displays transaction history with pagination, filtering, and blockchain verification
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */

import { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle, 
  XCircle,
  ExternalLink,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

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

interface TransactionHistoryProps {
  qubicAddress: string;
  onTransactionClick?: (transaction: Transaction) => void;
}

export default function TransactionHistory({ qubicAddress, onTransactionClick }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  
  // Filters
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Auto-refresh for pending transactions
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (filterType) params.append('type', filterType);
      if (filterStatus) params.append('status', filterStatus);
      if (startDate) params.append('startDate', new Date(startDate).toISOString());
      if (endDate) params.append('endDate', new Date(endDate).toISOString());
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/transactions/history/${qubicAddress}?${params}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.transactions);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setLastUpdated(new Date());
      } else {
        throw new Error(data.error || 'Failed to fetch transactions');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [qubicAddress, page, filterType, filterStatus, startDate, endDate]);

  // Auto-refresh every 10 seconds if there are pending transactions
  useEffect(() => {
    if (!autoRefresh) return;
    
    const hasPending = transactions.some(tx => tx.status === 'PENDING');
    if (!hasPending) return;
    
    const interval = setInterval(() => {
      fetchTransactions();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [transactions, autoRefresh]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'EARNING':
      case 'ESCROW_RELEASE':
        return <ArrowUpRight className="w-4 h-4 text-green-400" />;
      case 'PAYMENT':
      case 'ESCROW_LOCK':
        return <ArrowDownLeft className="w-4 h-4 text-red-400" />;
      case 'REFUND':
        return <ArrowUpRight className="w-4 h-4 text-yellow-400" />;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-400 animate-pulse" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500/20 text-green-400';
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'FAILED':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'PAYMENT':
        return 'Payment';
      case 'EARNING':
        return 'Earning';
      case 'REFUND':
        return 'Refund';
      case 'ESCROW_LOCK':
        return 'Escrow Lock';
      case 'ESCROW_RELEASE':
        return 'Escrow Release';
      default:
        return type;
    }
  };

  const getExplorerUrl = (txHash: string) => {
    return `https://explorer.qubic.org/network/tx/${txHash}`;
  };

  const getEstimatedConfirmationTime = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - created.getTime()) / 1000);
    const estimatedTotal = 45; // 3 confirmations × 15 seconds
    const remaining = Math.max(0, estimatedTotal - elapsed);
    
    if (remaining === 0) return 'Confirming...';
    return `~${remaining}s remaining`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: number, type: string) => {
    const isPositive = ['EARNING', 'ESCROW_RELEASE', 'REFUND'].includes(type);
    const sign = isPositive ? '+' : '-';
    return `${sign}${Math.abs(amount).toFixed(2)} QUBIC`;
  };

  const clearFilters = () => {
    setFilterType('');
    setFilterStatus('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const hasActiveFilters = filterType || filterStatus || startDate || endDate;

  if (loading && transactions.length === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
          <span className="ml-3 text-slate-400">Loading transactions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchTransactions}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Transaction History</h2>
          <span className="text-sm text-slate-400">
            {total} transaction{total !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              hasActiveFilters
                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                : 'border-slate-600 hover:bg-slate-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-cyan-500 text-white text-xs rounded-full">
                {[filterType, filterStatus, startDate, endDate].filter(Boolean).length}
              </span>
            )}
          </button>
          
          <button
            onClick={fetchTransactions}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 border border-slate-600 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Type</label>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Types</option>
                <option value="PAYMENT">Payment</option>
                <option value="EARNING">Earning</option>
                <option value="REFUND">Refund</option>
                <option value="ESCROW_LOCK">Escrow Lock</option>
                <option value="ESCROW_RELEASE">Escrow Release</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-slate-400 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-slate-400 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm text-slate-400 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          
          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm text-cyan-400 hover:text-cyan-300"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Last updated timestamp */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          Last updated: {Math.floor((Date.now() - lastUpdated.getTime()) / 1000)}s ago
        </span>
        {transactions.some(tx => tx.status === 'PENDING') && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 animate-pulse" />
            Auto-refreshing pending transactions
          </span>
        )}
      </div>

      {/* Transactions table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        {transactions.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No transactions found</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-3 text-sm text-cyan-400 hover:text-cyan-300"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-slate-900 text-sm text-slate-400">
                <tr>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Type</th>
                  <th className="px-6 py-3 text-left">Job</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3 text-center">Blockchain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => onTransactionClick?.(tx)}
                    className="hover:bg-slate-700/50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {formatDate(tx.createdAt)}
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(tx.type)}
                        <span className="text-sm">{getTypeLabel(tx.type)}</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {tx.job ? (
                        <div>
                          <div className="font-medium text-slate-300">{tx.job.modelType}</div>
                          <div className="text-xs text-slate-500">ID: {tx.job.id.slice(0, 8)}...</div>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(tx.status)}`}>
                          {getStatusIcon(tx.status)}
                          {tx.status.toLowerCase()}
                        </span>
                        {tx.status === 'PENDING' && (
                          <span className="text-xs text-slate-500">
                            {getEstimatedConfirmationTime(tx.createdAt)}
                          </span>
                        )}
                      </div>
                    </td>
                    
                    <td className={`px-6 py-4 text-right font-medium ${
                      ['EARNING', 'ESCROW_RELEASE', 'REFUND'].includes(tx.type)
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}>
                      {formatAmount(tx.amount, tx.type)}
                    </td>
                    
                    <td className="px-6 py-4 text-center">
                      {tx.qubicTxHash ? (
                        <a
                          href={getExplorerUrl(tx.qubicTxHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-sm"
                        >
                          View
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-600 text-sm">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-slate-900 border-t border-slate-700 flex items-center justify-between">
                <div className="text-sm text-slate-400">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 border border-slate-600 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <span className="text-sm text-slate-400">
                    Page {page} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 border border-slate-600 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

