/**
 * JobMonitor Component - Real-time job monitoring dashboard
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.6, 7.7, 8.1, 8.2, 8.3, 8.4
 * 
 * Features:
 * - 3-column layout: Job info | Live metrics | Log stream
 * - Real-time GPU metrics with animated charts
 * - Live log streaming with auto-scroll
 * - Progress bar and time remaining
 * - WebSocket subscription for updates
 * - Action buttons (pause, stop, extend)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Activity, Cpu, Clock, Zap, ThermometerSun, 
  Power, MemoryStick, AlertTriangle, CheckCircle,
  Pause, Square, Plus, Filter, Download, Maximize2
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { useJobProgress } from '../hooks/useWebSocket';
import toast from 'react-hot-toast';

interface JobMonitorProps {
  jobId: string;
  onClose?: () => void;
}

interface GPUMetrics {
  gpuUtilization: number; // 0-100
  gpuMemoryUsed: number; // MB
  gpuMemoryTotal: number; // MB
  gpuTemperature: number; // Celsius
  powerUsage: number; // Watts
  timestamp: Date;
}

interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
}

interface Job {
  id: string;
  modelType: string;
  status: string;
  progress: number;
  currentOperation?: string;
  estimatedCost: number;
  actualCost?: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  provider?: {
    workerId: string;
    gpuModel: string;
    gpuVram: number;
    pricePerHour: number;
  };
}

export default function JobMonitor({ jobId, onClose }: JobMonitorProps) {
  const [job, setJob] = useState<Job | null>(null);
  const [metrics, setMetrics] = useState<GPUMetrics[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [costSoFar, setCostSoFar] = useState<number>(0);
  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'warning' | 'error'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Fetch initial job data
  const fetchJob = useCallback(async () => {
    try {
      const res = await fetch(`/api/api/jobs/${jobId}`);
      if (res.ok) {
        const data = await res.json();
        setJob(data);
      }
    } catch (error) {
      console.error('Failed to fetch job:', error);
      toast.error('Failed to load job details');
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  // Handle real-time updates via WebSocket
  const handleJobUpdate = useCallback((data: any) => {
    console.log('Job update received:', data);

    // Update job progress
    if (data.progress !== undefined) {
      setJob(prev => prev ? { ...prev, progress: data.progress } : null);
    }

    // Update current operation
    if (data.currentOperation) {
      setJob(prev => prev ? { ...prev, currentOperation: data.currentOperation } : null);
    }

    // Update status
    if (data.status) {
      setJob(prev => prev ? { ...prev, status: data.status } : null);
    }

    // Update time remaining
    if (data.timeRemaining !== undefined) {
      setTimeRemaining(data.timeRemaining);
    }

    // Update cost so far
    if (data.costSoFar !== undefined) {
      setCostSoFar(data.costSoFar);
    }

    // Add GPU metrics
    if (data.metrics) {
      const newMetric: GPUMetrics = {
        ...data.metrics,
        timestamp: new Date()
      };
      
      setMetrics(prev => {
        // Keep only last 60 seconds of data (30 data points at 2s intervals)
        const updated = [...prev, newMetric];
        return updated.slice(-30);
      });
    }

    // Add log entries
    if (data.logLines && Array.isArray(data.logLines)) {
      const newLogs: LogEntry[] = data.logLines.map((line: string) => ({
        timestamp: new Date(),
        level: line.toLowerCase().includes('error') ? 'error' : 
               line.toLowerCase().includes('warn') ? 'warning' : 'info',
        message: line
      }));
      
      setLogs(prev => [...prev, ...newLogs]);
    }

    // Handle completion
    if (data.status === 'COMPLETED' || data.status === 'FAILED') {
      toast.success(data.status === 'COMPLETED' ? 'Job completed successfully!' : 'Job failed');
    }
  }, []);

  useJobProgress(jobId, handleJobUpdate);

  // Auto-scroll logs
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Handle manual scroll - disable auto-scroll if user scrolls up
  const handleLogsScroll = useCallback(() => {
    if (!logsContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    
    setAutoScroll(isAtBottom);
  }, []);

  // Calculate duration
  const getDuration = useCallback(() => {
    if (!job) return '0s';
    const start = job.startedAt ? new Date(job.startedAt) : new Date(job.createdAt);
    const end = job.completedAt ? new Date(job.completedAt) : new Date();
    const diff = end.getTime() - start.getTime();
    
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    
    if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  }, [job]);

  // Format time remaining
  const formatTimeRemaining = (seconds: number | null) => {
    if (seconds === null || seconds < 0) return 'Calculating...';
    
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) return `${hours}h ${mins}m remaining`;
    if (mins > 0) return `${mins}m ${secs}s remaining`;
    return `${secs}s remaining`;
  };

  // Get temperature color
  const getTempColor = (temp: number) => {
    if (temp > 80) return 'text-red-400';
    if (temp > 70) return 'text-yellow-400';
    return 'text-green-400';
  };

  // Get utilization color
  const getUtilColor = (util: number) => {
    if (util > 85) return 'text-red-400';
    if (util > 70) return 'text-yellow-400';
    return 'text-cyan-400';
  };

  // Filter logs
  const filteredLogs = logs.filter(log => 
    logFilter === 'all' || log.level === logFilter
  );

  // Get latest metrics
  const latestMetrics = metrics.length > 0 ? metrics[metrics.length - 1] : null;

  // Prepare chart data
  const utilizationData = metrics.map((m, i) => ({
    time: i,
    utilization: m.gpuUtilization,
    timestamp: m.timestamp
  }));

  const memoryData = latestMetrics ? [
    { name: 'Used', value: latestMetrics.gpuMemoryUsed / 1024, fill: '#a855f7' },
    { name: 'Free', value: (latestMetrics.gpuMemoryTotal - latestMetrics.gpuMemoryUsed) / 1024, fill: '#334155' }
  ] : [];

  const powerData = metrics.slice(-10).map((m, i) => ({
    time: i,
    power: m.powerUsage,
    timestamp: m.timestamp
  }));

  const temperatureData = metrics.slice(-10).map((m, i) => ({
    time: i,
    temp: m.gpuTemperature,
    timestamp: m.timestamp
  }));

  if (!job) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="w-12 h-12 text-cyan-400 animate-pulse mx-auto mb-4" />
          <p className="text-slate-400">Loading job details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Progress */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">{job.modelType}</h2>
            <p className="text-sm text-slate-400">Job ID: {job.id.slice(0, 8)}...</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              job.status === 'RUNNING' ? 'bg-cyan-500/20 text-cyan-400' :
              job.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
              job.status === 'FAILED' ? 'bg-red-500/20 text-red-400' :
              'bg-yellow-500/20 text-yellow-400'
            }`}>
              {job.status}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">
              {job.currentOperation || 'Processing...'}
            </span>
            <span className="text-cyan-400 font-medium">{job.progress}%</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
              style={{ width: `${job.progress}%` }}
            />
          </div>
        </div>

        {/* Time and Cost Info */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-900 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">Duration</div>
            <div className="font-medium">{getDuration()}</div>
          </div>
          <div className="bg-slate-900 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">Time Remaining</div>
            <div className="font-medium">{formatTimeRemaining(timeRemaining)}</div>
          </div>
          <div className="bg-slate-900 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">Cost So Far</div>
            <div className="font-medium text-cyan-400">
              {costSoFar.toFixed(4)} QUBIC
            </div>
          </div>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Job Info */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            Job Information
          </h3>

          <div className="space-y-3">
            <div>
              <div className="text-xs text-slate-400 mb-1">Job ID</div>
              <div className="text-sm font-mono">{job.id.slice(0, 16)}...</div>
            </div>

            <div>
              <div className="text-xs text-slate-400 mb-1">Status</div>
              <div className="text-sm font-medium">{job.status}</div>
            </div>

            {job.provider && (
              <>
                <div>
                  <div className="text-xs text-slate-400 mb-1">GPU Model</div>
                  <div className="text-sm font-medium">{job.provider.gpuModel}</div>
                </div>

                <div>
                  <div className="text-xs text-slate-400 mb-1">VRAM</div>
                  <div className="text-sm">{job.provider.gpuVram}GB</div>
                </div>

                <div>
                  <div className="text-xs text-slate-400 mb-1">Rate</div>
                  <div className="text-sm text-cyan-400">
                    {job.provider.pricePerHour.toFixed(2)} QUBIC/h
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400 mb-1">Worker ID</div>
                  <div className="text-sm font-mono">{job.provider.workerId.slice(0, 12)}...</div>
                </div>
              </>
            )}

            <div>
              <div className="text-xs text-slate-400 mb-1">Created</div>
              <div className="text-sm">{new Date(job.createdAt).toLocaleString()}</div>
            </div>

            {job.startedAt && (
              <div>
                <div className="text-xs text-slate-400 mb-1">Started</div>
                <div className="text-sm">{new Date(job.startedAt).toLocaleString()}</div>
              </div>
            )}

            <div>
              <div className="text-xs text-slate-400 mb-1">Estimated Cost</div>
              <div className="text-sm text-cyan-400">{job.estimatedCost.toFixed(4)} QUBIC</div>
            </div>
          </div>

          {/* Action Buttons */}
          {job.status === 'RUNNING' && (
            <div className="space-y-2 pt-4 border-t border-slate-700">
              <button className="w-full flex items-center justify-center gap-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 py-2 rounded-lg text-sm">
                <Pause className="w-4 h-4" />
                Pause Job
              </button>
              <button className="w-full flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 rounded-lg text-sm">
                <Square className="w-4 h-4" />
                Stop Job
              </button>
              <button className="w-full flex items-center justify-center gap-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 py-2 rounded-lg text-sm">
                <Plus className="w-4 h-4" />
                Extend Time
              </button>
            </div>
          )}

          {job.status === 'COMPLETED' && (
            <button className="w-full flex items-center justify-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 py-2 rounded-lg text-sm">
              <Download className="w-4 h-4" />
              Download Results
            </button>
          )}
        </div>

        {/* Center Column: Live Metrics */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Live GPU Metrics
          </h3>

          {latestMetrics ? (
            <>
              {/* Current Metrics Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className={`w-4 h-4 ${getUtilColor(latestMetrics.gpuUtilization)}`} />
                    <span className="text-xs text-slate-400">GPU Utilization</span>
                  </div>
                  <div className={`text-2xl font-bold ${getUtilColor(latestMetrics.gpuUtilization)}`}>
                    {latestMetrics.gpuUtilization.toFixed(1)}%
                  </div>
                  {latestMetrics.gpuUtilization > 85 && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-red-400">
                      <AlertTriangle className="w-3 h-3" />
                      High usage
                    </div>
                  )}
                </div>

                <div className="bg-slate-900 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <MemoryStick className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-slate-400">GPU Memory</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-400">
                    {((latestMetrics.gpuMemoryUsed / latestMetrics.gpuMemoryTotal) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {(latestMetrics.gpuMemoryUsed / 1024).toFixed(1)}GB / {(latestMetrics.gpuMemoryTotal / 1024).toFixed(1)}GB
                  </div>
                </div>

                <div className="bg-slate-900 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <ThermometerSun className={`w-4 h-4 ${getTempColor(latestMetrics.gpuTemperature)}`} />
                    <span className="text-xs text-slate-400">Temperature</span>
                  </div>
                  <div className={`text-2xl font-bold ${getTempColor(latestMetrics.gpuTemperature)}`}>
                    {latestMetrics.gpuTemperature.toFixed(1)}°C
                  </div>
                  {latestMetrics.gpuTemperature > 80 && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-red-400">
                      <AlertTriangle className="w-3 h-3" />
                      High temp
                    </div>
                  )}
                </div>

                <div className="bg-slate-900 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Power className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs text-slate-400">Power Usage</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {latestMetrics.powerUsage.toFixed(0)}W
                  </div>
                </div>
              </div>

              {/* GPU Utilization Line Chart - Last 60 seconds */}
              {utilizationData.length > 0 && (
                <div>
                  <div className="text-sm text-slate-400 mb-2">GPU Utilization (Last 60s)</div>
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart data={utilizationData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        dataKey="time" 
                        stroke="#64748b"
                        tick={{ fontSize: 10 }}
                        hide
                      />
                      <YAxis 
                        stroke="#64748b"
                        tick={{ fontSize: 10 }}
                        domain={[0, 100]}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Utilization']}
                        labelFormatter={(label, payload) => {
                          if (payload && payload[0] && payload[0].payload.timestamp) {
                            return new Date(payload[0].payload.timestamp).toLocaleTimeString();
                          }
                          return '';
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="utilization" 
                        stroke={latestMetrics && latestMetrics.gpuUtilization > 85 ? '#ef4444' : 
                               latestMetrics && latestMetrics.gpuUtilization > 70 ? '#eab308' : '#06b6d4'} 
                        strokeWidth={2}
                        dot={false}
                        animationDuration={300}
                        isAnimationActive={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* GPU Memory Bar Chart (Used/Total) */}
              {memoryData.length > 0 && (
                <div>
                  <div className="text-sm text-slate-400 mb-2">Memory Usage</div>
                  <ResponsiveContainer width="100%" height={80}>
                    <BarChart 
                      data={memoryData} 
                      layout="vertical"
                      margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                    >
                      <XAxis type="number" hide domain={[0, latestMetrics.gpuMemoryTotal / 1024]} />
                      <YAxis type="category" hide />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value: number, name: string) => [
                          `${value.toFixed(2)} GB`, 
                          name
                        ]}
                      />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]} animationDuration={500}>
                        {memoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="text-xs text-slate-400 text-center mt-1">
                    {(latestMetrics.gpuMemoryUsed / 1024).toFixed(2)}GB / {(latestMetrics.gpuMemoryTotal / 1024).toFixed(2)}GB
                  </div>
                </div>
              )}

              {/* Temperature Gauge with Color Coding */}
              {latestMetrics && (
                <div>
                  <div className="text-sm text-slate-400 mb-2">Temperature Gauge</div>
                  <div className="relative">
                    {/* Temperature gauge background */}
                    <div className="h-24 bg-slate-900 rounded-lg p-4 flex items-center justify-center">
                      <div className="text-center">
                        <div className={`text-4xl font-bold ${getTempColor(latestMetrics.gpuTemperature)}`}>
                          {latestMetrics.gpuTemperature.toFixed(1)}°C
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {latestMetrics.gpuTemperature < 70 ? 'Normal' : 
                           latestMetrics.gpuTemperature < 80 ? 'Warm' : 'Hot'}
                        </div>
                      </div>
                    </div>
                    {/* Color bar indicator */}
                    <div className="mt-2 h-2 rounded-full overflow-hidden flex">
                      <div className="flex-1 bg-green-500" />
                      <div className="flex-1 bg-yellow-500" />
                      <div className="flex-1 bg-red-500" />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>0°C</span>
                      <span>70°C</span>
                      <span>80°C</span>
                      <span>100°C</span>
                    </div>
                    {/* Temperature indicator position */}
                    <div 
                      className="absolute bottom-0 w-1 h-3 bg-white rounded-full transition-all duration-500"
                      style={{ 
                        left: `${Math.min(latestMetrics.gpuTemperature, 100)}%`,
                        transform: 'translateX(-50%)'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Power Usage Display with Trend */}
              {powerData.length > 0 && (
                <div>
                  <div className="text-sm text-slate-400 mb-2">Power Usage Trend</div>
                  <ResponsiveContainer width="100%" height={100}>
                    <LineChart data={powerData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        dataKey="time" 
                        stroke="#64748b"
                        tick={{ fontSize: 10 }}
                        hide
                      />
                      <YAxis 
                        stroke="#64748b"
                        tick={{ fontSize: 10 }}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value: number) => [`${value.toFixed(0)}W`, 'Power']}
                        labelFormatter={(label, payload) => {
                          if (payload && payload[0] && payload[0].payload.timestamp) {
                            return new Date(payload[0].payload.timestamp).toLocaleTimeString();
                          }
                          return '';
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="power" 
                        stroke="#eab308" 
                        strokeWidth={2}
                        dot={false}
                        animationDuration={300}
                        isAnimationActive={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="text-xs text-slate-400 text-center mt-1">
                    Current: {latestMetrics.powerUsage.toFixed(0)}W
                    {powerData.length > 1 && (
                      <span className={`ml-2 ${
                        powerData[powerData.length - 1].power > powerData[powerData.length - 2].power 
                          ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {powerData[powerData.length - 1].power > powerData[powerData.length - 2].power ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4 animate-pulse" />
              <p className="text-slate-400">Waiting for metrics...</p>
            </div>
          )}
        </div>

        {/* Right Column: Log Stream */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col h-[600px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Maximize2 className="w-5 h-5 text-cyan-400" />
              Live Logs
            </h3>
            <div className="flex items-center gap-2">
              <select
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm"
              >
                <option value="all">All</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
              <button
                onClick={() => setAutoScroll(!autoScroll)}
                className={`p-1 rounded ${autoScroll ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-slate-400'}`}
                title={autoScroll ? 'Auto-scroll enabled' : 'Auto-scroll disabled'}
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div 
            ref={logsContainerRef}
            onScroll={handleLogsScroll}
            className="flex-1 bg-slate-900 rounded-lg p-3 overflow-y-auto font-mono text-xs space-y-1"
          >
            {filteredLogs.length > 0 ? (
              <>
                {filteredLogs.map((log, i) => (
                  <div 
                    key={i}
                    className={`flex gap-2 ${
                      log.level === 'error' ? 'text-red-400' :
                      log.level === 'warning' ? 'text-yellow-400' :
                      'text-slate-300'
                    }`}
                  >
                    <span className="text-slate-500 shrink-0">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                    <span className="shrink-0 font-bold">
                      [{log.level.toUpperCase()}]
                    </span>
                    <span className="break-all">{log.message}</span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </>
            ) : (
              <div className="text-center py-12 text-slate-500">
                No logs yet...
              </div>
            )}
          </div>

          {!autoScroll && (
            <button
              onClick={() => {
                setAutoScroll(true);
                logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="mt-2 w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 py-2 rounded-lg text-sm"
            >
              Scroll to Bottom
            </button>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-cyan-400" />
          Timeline
        </h3>
        
        <div className="relative">
          {/* Progress line */}
          <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-slate-700" />
          <div 
            className="absolute left-2 top-0 w-0.5 bg-gradient-to-b from-cyan-500 to-blue-500 transition-all duration-500"
            style={{ height: `${job.progress}%` }}
          />

          <div className="space-y-6 relative">
            <div className="flex items-center gap-4">
              <div className="w-5 h-5 rounded-full bg-green-500 border-4 border-slate-800 z-10" />
              <div>
                <div className="font-medium">Job Created</div>
                <div className="text-sm text-slate-400">
                  {new Date(job.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            {job.startedAt && (
              <div className="flex items-center gap-4">
                <div className="w-5 h-5 rounded-full bg-cyan-500 border-4 border-slate-800 z-10" />
                <div>
                  <div className="font-medium">Execution Started</div>
                  <div className="text-sm text-slate-400">
                    {new Date(job.startedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {job.status === 'RUNNING' && (
              <div className="flex items-center gap-4">
                <div className="w-5 h-5 rounded-full bg-blue-500 border-4 border-slate-800 z-10 animate-pulse" />
                <div>
                  <div className="font-medium">In Progress</div>
                  <div className="text-sm text-slate-400">
                    {job.currentOperation || 'Processing...'}
                  </div>
                </div>
              </div>
            )}

            {job.completedAt && (
              <div className="flex items-center gap-4">
                <div className={`w-5 h-5 rounded-full ${
                  job.status === 'COMPLETED' ? 'bg-green-500' : 'bg-red-500'
                } border-4 border-slate-800 z-10`} />
                <div>
                  <div className="font-medium">
                    {job.status === 'COMPLETED' ? 'Completed Successfully' : 'Failed'}
                  </div>
                  <div className="text-sm text-slate-400">
                    {new Date(job.completedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
