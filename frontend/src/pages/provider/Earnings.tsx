/**
 * Earnings - Ganhos do provider
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7
 */
import { useState, useEffect, useCallback } from 'react';
import { DollarSign, TrendingUp, Download, Calendar, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useRefresh, formatTimeSince } from '../../hooks/useRefresh';
import { Skeleton } from '../../components/ui/Skeleton';

export default function Earnings() {
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState({ 
    total: 0, 
    thisMonth: 0, 
    thisWeek: 0, 
    today: 0, 
    pending: 0 
  });
  const [chartData, setChartData] = useState<Array<{ date: string; amount: number }>>([]);
  const [history, setHistory] = useState<Array<{ 
    id: string; 
    date: string; 
    amount: number; 
    gpu: string; 
    hours: number 
  }>>([]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const providerId = user.id || user.qubicAddress;

  // Fetch earnings data
  const fetchEarnings = useCallback(async () => {
    if (!providerId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch earnings summary
      const res = await fetch(`/api/providers/${providerId}/earnings`);
      if (res.ok) {
        const data = await res.json();
        setEarnings({
          total: data.totalEarned || 0,
          thisMonth: data.monthEarnings || 0,
          thisWeek: data.weekEarnings || 0,
          today: data.todayEarnings || 0,
          pending: data.pendingPayouts || 0
        });
        
        // Set chart data from earnings history
        if (data.earningsHistory && data.earningsHistory.length > 0) {
          setChartData(data.earningsHistory.map((e: any) => ({
            date: new Date(e.date).getDate().toString().padStart(2, '0'),
            amount: e.amount
          })));
        }
      }

      // Fetch transaction history
      const historyRes = await fetch(`/api/transactions/${providerId}`);
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData.slice(0, 10).map((t: any) => ({
          id: t.id,
          date: new Date(t.createdAt).toLocaleDateString(),
          amount: t.amount,
          gpu: t.gpuModel || 'Unknown GPU',
          hours: t.duration ? Math.round(t.duration / 3600) : 0
        })));
      }
    } catch (e) {
      console.error('Failed to fetch earnings:', e);
      throw e; // Let useRefresh handle the error
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  // Use refresh hook with auto-refresh every 30 seconds
  const { isRefreshing, lastUpdated, secondsSinceUpdate, refresh, setLastUpdated } = useRefresh({
    onRefresh: fetchEarnings,
    autoRefreshInterval: 30000,
    enableAutoRefresh: true,
    showSuccessToast: false,
    showErrorToast: true
  });

  useEffect(() => {
    fetchEarnings().then(() => {
      setLastUpdated(new Date());
    });
  }, [fetchEarnings, setLastUpdated]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Earnings</h1>
          {lastUpdated && (
            <p className="text-slate-400 text-sm mt-1">
              Last updated: {formatTimeSince(secondsSinceUpdate)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button className="flex items-center gap-2 bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg font-medium">
            <Download className="w-5 h-5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <Skeleton className="w-24 h-4 mb-2" />
              <Skeleton className="w-32 h-8" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <div className="text-sm text-slate-400 mb-1">Total Earnings</div>
            <div className="text-2xl font-bold text-green-400">{earnings.total.toFixed(2)} QUBIC</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <div className="text-sm text-slate-400 mb-1">This Month</div>
            <div className="text-2xl font-bold text-white">{earnings.thisMonth.toFixed(2)} QUBIC</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <div className="text-sm text-slate-400 mb-1">This Week</div>
            <div className="text-2xl font-bold text-white">{earnings.thisWeek.toFixed(2)} QUBIC</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <div className="text-sm text-slate-400 mb-1">Today</div>
            <div className="text-2xl font-bold text-white">{earnings.today.toFixed(2)} QUBIC</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <div className="text-sm text-slate-400 mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-400">{earnings.pending.toFixed(2)} QUBIC</div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Earnings Over Time</h2>
          <div className="flex gap-2">
            {['week', 'month', 'year'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 rounded text-sm ${period === p ? 'bg-green-500' : 'bg-slate-700'}`}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Skeleton className="w-full h-full" />
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="amount" stroke="#22c55e" fillOpacity={1} fill="url(#earnGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-slate-400">
            No earnings data available yet
          </div>
        )}
      </div>

      {/* History */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700"><h2 className="font-semibold">Recent Earnings</h2></div>
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="w-32 h-4" />
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-16 h-4" />
                <Skeleton className="w-20 h-4" />
              </div>
            ))}
          </div>
        ) : history.length > 0 ? (
          <table className="w-full">
            <thead className="bg-slate-900 text-sm text-slate-400">
              <tr><th className="px-6 py-3 text-left">Date</th><th className="px-6 py-3 text-left">GPU</th><th className="px-6 py-3 text-center">Hours</th><th className="px-6 py-3 text-right">Amount</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {history.map(h => (
                <tr key={h.id} className="hover:bg-slate-700/50">
                  <td className="px-6 py-4">{h.date}</td>
                  <td className="px-6 py-4">{h.gpu}</td>
                  <td className="px-6 py-4 text-center">{h.hours}h</td>
                  <td className="px-6 py-4 text-right text-green-400 font-medium">+{h.amount.toFixed(2)} QUBIC</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-slate-400">
            No transaction history available yet
          </div>
        )}
      </div>
    </div>
  );
}

