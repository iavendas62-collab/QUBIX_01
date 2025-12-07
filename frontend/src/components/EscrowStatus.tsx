/**
 * Escrow Status Component
 * 
 * Displays escrow transaction status with confirmation count
 * Requirements 6.7, 8.1, 8.2, 8.3, 8.4: Display confirmation count (0/3, 1/3, 2/3, 3/3)
 * 
 * Features:
 * - Real-time confirmation count display
 * - Visual progress indicator
 * - Transaction hash with explorer link
 * - Status badges (pending, confirming, confirmed, released, refunded)
 * - WebSocket updates for live status changes
 */

import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, AlertCircle, ExternalLink, Loader } from 'lucide-react';

interface EscrowStatusProps {
  jobId: string;
  onStatusChange?: (status: EscrowStatus) => void;
}

interface EscrowStatus {
  escrowId: string;
  jobId: string;
  status: 'pending' | 'locked' | 'released' | 'refunded';
  amount: number;
  confirmations: number;
  txHash: string | null;
  explorerUrl: string | null;
  confirmationText: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface EscrowUpdate {
  status: string;
  confirmations?: number;
  requiredConfirmations?: number;
  confirmationText?: string;
  txHash?: string;
  explorerUrl?: string;
  amount?: number;
  error?: string;
}

export const EscrowStatus: React.FC<EscrowStatusProps> = ({ jobId, onStatusChange }) => {
  const [escrowStatus, setEscrowStatus] = useState<EscrowStatus | null>(null);
  const [liveUpdate, setLiveUpdate] = useState<EscrowUpdate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial escrow status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/api/escrow/status/${jobId}`);
        const data = await response.json();

        if (data.success && data.escrow) {
          setEscrowStatus(data.escrow);
          if (onStatusChange) {
            onStatusChange(data.escrow);
          }
        } else {
          setError(data.error || 'No escrow found');
        }
      } catch (err: any) {
        console.error('Error fetching escrow status:', err);
        setError(err.message || 'Failed to fetch escrow status');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [jobId, onStatusChange]);

  // Subscribe to WebSocket updates
  useEffect(() => {
    const wsUrl = (import.meta as any).env?.VITE_WS_URL || 'ws://localhost:3001';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected for escrow updates');
      // Subscribe to job updates
      ws.send(JSON.stringify({
        type: 'subscribe:job',
        subscriptionId: jobId
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'ESCROW_UPDATE' && message.data.jobId === jobId) {
          console.log('Escrow update received:', message.data);
          setLiveUpdate(message.data);

          // Update escrow status if we have complete data
          if (escrowStatus) {
            const updatedStatus = {
              ...escrowStatus,
              confirmations: message.data.confirmations ?? escrowStatus.confirmations,
              status: message.data.status === 'confirmed' ? 'locked' : 
                      message.data.status === 'released' ? 'released' :
                      message.data.status === 'refunded' ? 'refunded' :
                      escrowStatus.status,
              txHash: message.data.txHash || escrowStatus.txHash,
              explorerUrl: message.data.explorerUrl || escrowStatus.explorerUrl,
              confirmationText: message.data.confirmationText || escrowStatus.confirmationText
            };
            setEscrowStatus(updatedStatus);
            if (onStatusChange) {
              onStatusChange(updatedStatus);
            }
          }
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, [jobId, escrowStatus, onStatusChange]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <Loader className="w-4 h-4 animate-spin" />
        <span>Loading escrow status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <AlertCircle className="w-4 h-4" />
        <span>{error}</span>
      </div>
    );
  }

  if (!escrowStatus) {
    return null;
  }

  // Determine current status to display
  const currentStatus = liveUpdate?.status || escrowStatus.status;
  const confirmations = liveUpdate?.confirmations ?? escrowStatus.confirmations;
  const confirmationText = liveUpdate?.confirmationText || escrowStatus.confirmationText;
  const txHash = liveUpdate?.txHash || escrowStatus.txHash;
  const explorerUrl = liveUpdate?.explorerUrl || escrowStatus.explorerUrl;

  // Status badge styling
  const getStatusBadge = () => {
    switch (currentStatus) {
      case 'pending':
      case 'creating':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'confirming':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
            <Loader className="w-3 h-3 animate-spin" />
            Confirming
          </span>
        );
      case 'locked':
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Locked
          </span>
        );
      case 'releasing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
            <Loader className="w-3 h-3 animate-spin" />
            Releasing
          </span>
        );
      case 'released':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Released
          </span>
        );
      case 'refunding':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded-full">
            <Loader className="w-3 h-3 animate-spin" />
            Refunding
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Refunded
          </span>
        );
      case 'failed':
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
            <AlertCircle className="w-3 h-3" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
            {currentStatus}
          </span>
        );
    }
  };

  // Confirmation progress bar
  const getConfirmationProgress = () => {
    if (currentStatus === 'locked' || currentStatus === 'confirmed') {
      return 100;
    }
    if (currentStatus === 'pending' || currentStatus === 'creating') {
      return 0;
    }
    if (currentStatus === 'confirming') {
      return (confirmations / 3) * 100;
    }
    return 0;
  };

  const progress = getConfirmationProgress();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Escrow Status</h3>
        {getStatusBadge()}
      </div>

      {/* Confirmation count display - Requirement 6.7 */}
      {(currentStatus === 'pending' || currentStatus === 'confirming' || currentStatus === 'locked') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Confirmations</span>
            <span className="font-mono font-semibold text-gray-900">
              {confirmationText || `${confirmations}/3`}
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {currentStatus === 'confirming' && (
            <p className="text-xs text-gray-500">
              Waiting for blockchain confirmations... (~15s per confirmation)
            </p>
          )}
        </div>
      )}

      {/* Amount */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Amount</span>
        <span className="font-semibold text-gray-900">{escrowStatus.amount} QUBIC</span>
      </div>

      {/* Transaction hash with explorer link */}
      {txHash && (
        <div className="space-y-1">
          <span className="text-xs text-gray-600">Transaction Hash</span>
          <div className="flex items-center gap-2">
            <code className="text-xs font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded flex-1 truncate">
              {txHash}
            </code>
            {explorerUrl && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 whitespace-nowrap"
              >
                View
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {liveUpdate?.error && (
        <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{liveUpdate.error}</span>
        </div>
      )}

      {/* Status messages */}
      {currentStatus === 'locked' && (
        <p className="text-xs text-green-600">
          ✓ Funds are securely locked in escrow until job completion
        </p>
      )}
      {currentStatus === 'released' && (
        <p className="text-xs text-green-600">
          ✓ Payment has been released to the provider
        </p>
      )}
      {currentStatus === 'refunded' && (
        <p className="text-xs text-orange-600">
          ✓ Funds have been refunded to your wallet
        </p>
      )}
    </div>
  );
};

export default EscrowStatus;

