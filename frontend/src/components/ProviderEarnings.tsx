/**
 * ProviderEarnings Component
 * 
 * Real-time earnings dashboard for providers showing:
 * - Earnings summary (total, today, week, month, pending)
 * - Average hourly rate calculation
 * - Earnings history chart (last 30 days)
 * - Active jobs table with live duration and earnings
 * - Transaction history with blockchain explorer links
 * - Performance metrics (uptime, jobs completed, rating)
 * - WebSocket subscription for live earnings updates
 * 
 * Requirements: 9.1, 9.3, 9.4, 9.5, 9.6, 9.7, 10.1, 10.2, 10.3
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Activity, 
  ExternalLink,
  RefreshCw,
  Calendar,
  Award
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { useWebSocket } from '../hooks/useWebSocket';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

// Types based on design document
interface EarningsData {
  totalEarned: number;
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  pendingPayouts: number;
  averageHourlyRate: number;
  earningsHistory: EarningEntry[];
}

interface EarningEntry {
  date: string;
  amount: number;
  jobCount?: number;
}

interface ActiveJob {
  jobId: string;
  clientAddress: string;
  gpuUsed: string;
  durationSoFar: number; // seconds
  earningsSoFar: number; // QUBIC, live
  estimatedTotal: number; // QUBIC
  status: 'running' | 'paused';
  startedAt: Date;
  pricePerHour: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  qubicTxHash: string | null;
  createdAt: string;
  completedAt: string | null;
  job?: {
    id: string;
    modelType: string;
    status: string;
  } | null;
}

interface PerformanceMetrics {
  uptimePercent: number;
  jobsCompleted: number;
  averageRating: number;
  responseTime: number; // ms
}

interface ProviderEarningsProps {
  providerId?: string;
  qubicAddress?: string;
}

export default function ProviderEarnings({ providerId, qubicAddress }: ProviderEarningsProps) {
  const [earnings, setEarnings] = useState<EarningsData>({
    totalEarned: 0,
    todayEarnings: 0,
    weekEarnings: 0,
    monthEarnings: 0,
    pendingPayouts: 0,
    averageHourlyRate: 0,
    earningsHistory: []
  });
  
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    uptimePercent: 0,
    jobsCompleted: 0,
    averageRating: 0,
    responseTime: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  
  const { subscribe, subscribeToProvider, isConnected } = useWebSocket();

  // Fetch earnings data from backend
  // Requirement 9.1: Display total earnings, today's earnings, and pending payouts
  const fetchEarnings = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (qubicAddress) params.append('qubicAddress', qubicAddress);
      
      const response = await fetch(`/api/providers/my/earnings?${params}`);
      if (!response.ok) throw new Error('Failed to fetch earnings');
      
      const data = await response.json();
      
      setEarnings({
        totalEarned: data.total || 0,
        todayEarnings: data.today || 0,
        weekEarnings: data.thisWeek || 0,
        monthEarnings: data.thisMonth || 0,
        pendingPayouts: data.pending || 0,
        averageHourlyRate: data.averageHourlyRate || 0,
        earningsHistory: data.history || []
      });
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching earnings:', error);
    }
  }, [qubicAddress]);

  // Fetch active jobs
  // Requirement 9.4: Show active jobs table with live duration and earnings columns
  const fetchActiveJobs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (qubicAddress) params.append('qubicAddress', qubicAddress);
      params.append('status', 'RUNNING');
      
      const response = await fetch(`/api/providers/my/jobs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch active jobs');
      
      const jobs = await response.json();
      
      // Transform to ActiveJob format
      const activeJobsData: ActiveJob[] = jobs
        .filter((job: any) => job.status === 'RUNNING')
        .map((job: any) => {
          const startedAt = new Date(job.startedAt);
          const now = new Date();
          const durationSoFar = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
          const pricePerHour = job.provider?.pricePerHour || 1.0;
          const earningsSoFar = (durationSoFar / 3600) * pricePerHour;
          
          return {
            jobId: job.id,
            clientAddress: job.consumer?.qubicAddress || 'Unknown',
            gpuUsed: job.provider?.gpuModel || 'Unknown GPU',
            durationSoFar,
            earningsSoFar,
            estimatedTotal: job.estimatedCost || 0,
            status: 'running' as const,
            startedAt,
            pricePerHour
          };
        });
      
      setActiveJobs(activeJobsData);
    } catch (error) {
      console.error('Error fetching active jobs:', error);
    }
  }, [qubicAddress]);

  // Fetch transaction history
  // Requirement 10.1, 10.2, 10.3: Display transaction history with explorer links
  const fetchTransactions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (qubicAddress) params.append('qubicAddress', qubicAddress);
      params.append('limit', '50');
      
      // Get user ID from qubic address
      const userResponse = await fetch(`/api/wallet/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qubicAddress })
      });
      
      if (!userResponse.ok) {
        console.warn('Could not fetch user for transactions');
        return;
      }
      
      const userData = await userResponse.json();
      if (!userData.success || !userData.user) return;
      
      // Fetch transactions for user
      const txResponse = await fetch(`/api/transactions/history/${userData.user.id}`);
      if (!txResponse.ok) throw new Error('Failed to fetch transactions');
      
      const txData = await txResponse.json();
      setTransactions(txData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  }, [qubicAddress]);

  // Fetch performance metrics
  // Requirement 9.7: Display performance metrics (uptime, jobs completed, rating)
  const fetchPerformanceMetrics = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (qubicAddress) params.append('qubicAddress', qubicAddress);
      
      const response = await fetch(`/api/providers/my?${params}`);
      if (!response.ok) throw new Error('Failed to fetch providers');
      
      const providers = await response.json();
      
      if (providers.length > 0) {
        // Aggregate metrics from all providers
        const totalJobs = providers.reduce((sum: number, p: any) => sum + (p.totalJobs || 0), 0);
        const avgUptime = providers.reduce((sum: number, p: any) => sum + (p.uptime || 0), 0) / providers.length;
        
        setPerformanceMetrics({
          uptimePercent: avgUptime,
          jobsCompleted: totalJobs,
          averageRating: 4.8, // Placeholder - would come from reviews system
          responseTime: 150 // Placeholder - would come from monitoring
        });
      }
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
    }
  }, [qubicAddress]);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchEarnings(),
        fetchActiveJobs(),
        fetchTransactions(),
        fetchPerformanceMetrics()
      ]);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [fetchEarnings, fetchActiveJobs, fetchTransactions, fetchPerformanceMetrics]);

  // Initial load
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Auto-refresh every 30 seconds
  // Requirement 13.6: Auto-refresh data every 30 seconds
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    
    const interval = setInterval(() => {
      fetchAllData();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [autoRefreshEnabled, fetchAllData]);

  // Update active jobs earnings every 5 seconds
  // Requirement 9.2: Update earnings-so-far every 5 seconds for active jobs
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveJobs(prevJobs => 
        prevJobs.map(job => {
          const now = new Date();
          const durationSoFar = Math.floor((now.getTime() - job.startedAt.getTime()) / 1000);
          const earningsSoFar = (durationSoFar / 3600) * job.pricePerHour;
          
          return {
            ...job,
            durationSoFar,
            earningsSoFar
          };
        })
      );
    }, 5000); // 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  // WebSocket subscription for live updates
  // Requirement 9.2: Live earnings updates via WebSocket
  useEffect(() => {
    if (!isConnected || !providerId) return;
    
    subscribeToProvider(providerId);
    
    const unsubscribe = subscribe('EARNINGS_UPDATE', (data: any) => {
      if (data.providerId === providerId) {
        setEarnings(prev => ({
          ...prev,
          todayEarnings: data.todayEarnings || prev.todayEarnings
        }));
        
        if (data.activeJobs) {
          setActiveJobs(data.activeJobs);
        }
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [isConnected, providerId, subscribe, subscribeToProvider]);

  // Format duration as human-readable
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get Qubic explorer URL
  // Requirement 10.3: Provide clickable link to Qubic explorer
  const getExplorerUrl = (txHash: string): string => {
    return `https://explorer.qubic.org/tx/${txHash}`;
  };

  // Calculate time since last update
  const getTimeSinceUpdate = (): string => {
    const seconds = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Manual refresh handler
  // Requirement 13.1, 13.2, 13.3: Refresh functionality with loading state and feedback
  const handleRefresh = async () => {
    await fetchAllData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Provider Earnings</h1>
          <p className="text-sm text-slate-400 mt-1">
            Last updated: {getTimeSinceUpdate()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Earnings Summary Cards */}
      {/* Requirement 9.1: Display total earnings, today's earnings, week, month, pending payouts */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/30">
          <div className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">Total Earned</span>
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-green-400">
              {earnings.totalEarned.toFixed(2)}
            </div>
            <div className="text-xs text-slate-400 mt-1">QUBIC</div>
          </div>
        </Card>

        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Today</span>
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {earnings.todayEarnings.toFixed(2)}
            </div>
            <div className="text-xs text-slate-400 mt-1">QUBIC</div>
          </div>
        </Card>

        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">This Week</span>
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {earnings.weekEarnings.toFixed(2)}
            </div>
            <div className="text-xs text-slate-400 mt-1">QUBIC</div>
          </div>
        </Card>

        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">This Month</span>
              <Activity className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {earnings.monthEarnings.toFixed(2)}
            </div>
            <div className="text-xs text-slate-400 mt-1">QUBIC</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-yellow-500/30">
          <div className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">Pending</span>
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-yellow-400">
              {earnings.pendingPayouts.toFixed(2)}
            </div>
            <div className="text-xs text-slate-400 mt-1">QUBIC</div>
          </div>
        </Card>
      </div>

      {/* Performance Metrics */}
      {/* Requirement 9.7: Display performance metrics (uptime, jobs completed, rating) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="text-sm text-slate-400 mb-1">Uptime</div>
            <div className="text-xl font-bold text-white">
              {performanceMetrics.uptimePercent.toFixed(1)}%
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="text-sm text-slate-400 mb-1">Jobs Completed</div>
            <div className="text-xl font-bold text-white">
              {performanceMetrics.jobsCompleted}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="text-sm text-slate-400 mb-1">Average Rating</div>
            <div className="flex items-center gap-2">
              <div className="text-xl font-bold text-white">
                {performanceMetrics.averageRating.toFixed(1)}
              </div>
              <Award className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="text-sm text-slate-400 mb-1">Avg Hourly Rate</div>
            <div className="text-xl font-bold text-white">
              {earnings.averageHourlyRate.toFixed(2)} QUBIC/h
            </div>
          </div>
        </Card>
      </div>

      {/* Earnings History Chart */}
      {/* Requirement 9.3: Show earnings history line chart (last 30 days) */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Earnings History (Last 30 Days)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={earnings.earningsHistory}>
              <defs>
                <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b"
                tick={{ fill: '#94a3b8' }}
              />
              <YAxis 
                stroke="#64748b"
                tick={{ fill: '#94a3b8' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#22c55e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#earningsGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Active Jobs Table */}
      {/* Requirement 9.4: Show active jobs table with live duration and earnings columns */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Active Jobs ({activeJobs.length})
          </h2>
          {activeJobs.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No active jobs at the moment
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50 text-sm text-slate-400">
                  <tr>
                    <th className="px-4 py-3 text-left">Job ID</th>
                    <th className="px-4 py-3 text-left">Client</th>
                    <th className="px-4 py-3 text-left">GPU</th>
                    <th className="px-4 py-3 text-center">Duration</th>
                    <th className="px-4 py-3 text-right">Earnings So Far</th>
                    <th className="px-4 py-3 text-right">Estimated Total</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {activeJobs.map(job => (
                    <tr key={job.jobId} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-sm font-mono text-slate-300">
                        {job.jobId.substring(0, 8)}...
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        {job.clientAddress.substring(0, 10)}...
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        {job.gpuUsed}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-slate-300">
                        {formatDuration(job.durationSoFar)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-green-400">
                        +{job.earningsSoFar.toFixed(4)} QUBIC
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-400">
                        ~{job.estimatedTotal.toFixed(2)} QUBIC
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                          {job.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* Transaction History */}
      {/* Requirement 10.1, 10.2, 10.3: Display transaction history with explorer links */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Transaction History
          </h2>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No transactions yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50 text-sm text-slate-400">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Explorer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-sm text-slate-300">
                        {formatDate(tx.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          tx.type === 'ESCROW_RELEASE' || tx.type === 'EARNING'
                            ? 'bg-green-500/20 text-green-400'
                            : tx.type === 'REFUND'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {tx.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">
                        <span className={
                          tx.type === 'ESCROW_RELEASE' || tx.type === 'EARNING'
                            ? 'text-green-400'
                            : 'text-slate-300'
                        }>
                          {tx.type === 'ESCROW_RELEASE' || tx.type === 'EARNING' ? '+' : ''}
                          {tx.amount.toFixed(2)} QUBIC
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          tx.status === 'COMPLETED'
                            ? 'bg-green-500/20 text-green-400'
                            : tx.status === 'PENDING'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {tx.qubicTxHash ? (
                          <a
                            href={getExplorerUrl(tx.qubicTxHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        ) : (
                          <span className="text-slate-500 text-xs">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

