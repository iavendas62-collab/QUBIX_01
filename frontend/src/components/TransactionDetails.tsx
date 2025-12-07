/**
 * TransactionDetails Component
 * 
 * Modal showing detailed information about a transaction
 * 
 * Requirements: 10.2, 10.3, 10.4
 */

import { X, ExternalLink, Copy, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useState } from 'react';

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

interface TransactionDetailsProps {
  transaction: Transaction;
  onClose: () => void;
}

export default function TransactionDetails({ transaction, onClose }: TransactionDetailsProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getExplorerUrl = (txHash: string) => {
    return `https://explorer.qubic.org/network/tx/${txHash}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusIcon = () => {
    switch (transaction.status) {
      case 'COMPLETED':
        return <CheckCircle className="w-8 h-8 text-green-400" />;
      case 'PENDING':
        return <Clock className="w-8 h-8 text-yellow-400 animate-pulse" />;
      case 'FAILED':
        return <XCircle className="w-8 h-8 text-red-400" />;
    }
  };

  const getStatusColor = () => {
    switch (transaction.status) {
      case 'COMPLETED':
        return 'text-green-400';
      case 'PENDING':
        return 'text-yellow-400';
      case 'FAILED':
        return 'text-red-400';
    }
  };

  const getTypeDescription = () => {
    switch (transaction.type) {
      case 'PAYMENT':
        return 'Payment for GPU compute time';
      case 'EARNING':
        return 'Earnings from providing GPU resources';
      case 'REFUND':
        return 'Refund for cancelled or failed job';
      case 'ESCROW_LOCK':
        return 'Funds locked in escrow for job execution';
      case 'ESCROW_RELEASE':
        return 'Escrow funds released to provider';
      default:
        return transaction.type;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold">Transaction Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-center gap-3 p-6 bg-slate-900 rounded-xl">
            {getStatusIcon()}
            <div>
              <div className={`text-2xl font-bold ${getStatusColor()}`}>
                {transaction.status}
              </div>
              <div className="text-sm text-slate-400">
                {getTypeDescription()}
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="text-center p-6 bg-slate-900 rounded-xl">
            <div className="text-sm text-slate-400 mb-2">Amount</div>
            <div className={`text-4xl font-bold ${
              ['EARNING', 'ESCROW_RELEASE', 'REFUND'].includes(transaction.type)
                ? 'text-green-400'
                : 'text-red-400'
            }`}>
              {['EARNING', 'ESCROW_RELEASE', 'REFUND'].includes(transaction.type) ? '+' : '-'}
              {Math.abs(transaction.amount).toFixed(2)} QUBIC
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900 rounded-xl p-4">
              <div className="text-sm text-slate-400 mb-1">Transaction ID</div>
              <div className="flex items-center gap-2">
                <code className="text-sm text-slate-300 font-mono">
                  {transaction.id.slice(0, 16)}...
                </code>
                <button
                  onClick={() => copyToClipboard(transaction.id)}
                  className="p-1 hover:bg-slate-700 rounded transition-colors"
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl p-4">
              <div className="text-sm text-slate-400 mb-1">Type</div>
              <div className="text-slate-300 font-medium">
                {transaction.type.replace(/_/g, ' ')}
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl p-4">
              <div className="text-sm text-slate-400 mb-1">Created</div>
              <div className="text-slate-300 text-sm">
                {formatDate(transaction.createdAt)}
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl p-4">
              <div className="text-sm text-slate-400 mb-1">Completed</div>
              <div className="text-slate-300 text-sm">
                {transaction.completedAt ? formatDate(transaction.completedAt) : 'Pending...'}
              </div>
            </div>
          </div>

          {/* Job Information */}
          {transaction.job && (
            <div className="bg-slate-900 rounded-xl p-4">
              <div className="text-sm text-slate-400 mb-3">Associated Job</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Job ID:</span>
                  <code className="text-slate-300 font-mono text-sm">
                    {transaction.job.id.slice(0, 16)}...
                  </code>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Model Type:</span>
                  <span className="text-slate-300">{transaction.job.modelType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-slate-300">{transaction.job.status}</span>
                </div>
              </div>
            </div>
          )}

          {/* Blockchain Information */}
          {transaction.qubicTxHash ? (
            <div className="bg-slate-900 rounded-xl p-4">
              <div className="text-sm text-slate-400 mb-3">Blockchain Verification</div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Transaction Hash</div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-cyan-400 font-mono break-all">
                      {transaction.qubicTxHash}
                    </code>
                    <button
                      onClick={() => copyToClipboard(transaction.qubicTxHash!)}
                      className="p-1 hover:bg-slate-700 rounded transition-colors flex-shrink-0"
                    >
                      {copied ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>
                
                <a
                  href={getExplorerUrl(transaction.qubicTxHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg transition-colors"
                >
                  View on Qubic Explorer
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-xl p-4 text-center">
              <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <div className="text-sm text-slate-400">
                Blockchain transaction pending...
              </div>
              {transaction.status === 'PENDING' && (
                <div className="text-xs text-slate-500 mt-1">
                  Estimated confirmation time: ~45 seconds
                </div>
              )}
            </div>
          )}

          {/* Estimated Confirmation Time for Pending */}
          {transaction.status === 'PENDING' && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-yellow-400 mb-1">
                    Transaction Pending
                  </div>
                  <div className="text-xs text-slate-400">
                    This transaction is waiting for blockchain confirmation. 
                    Qubic transactions typically require 3 confirmations (~15 seconds each).
                    The page will auto-update when the transaction is confirmed.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

