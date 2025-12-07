/**
 * useRefresh Hook - Provides refresh functionality with loading state, auto-refresh, and staleness tracking
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { notify } from '../components/ui';

interface UseRefreshOptions {
  onRefresh: () => Promise<void>;
  autoRefreshInterval?: number; // milliseconds, default 30000 (30 seconds)
  enableAutoRefresh?: boolean; // default true
  showSuccessToast?: boolean; // default true
  showErrorToast?: boolean; // default true
}

interface UseRefreshReturn {
  isRefreshing: boolean;
  lastUpdated: Date | null;
  secondsSinceUpdate: number;
  refresh: () => Promise<void>;
  setLastUpdated: (date: Date) => void;
}

export function useRefresh({
  onRefresh,
  autoRefreshInterval = 30000,
  enableAutoRefresh = true,
  showSuccessToast = true,
  showErrorToast = true
}: UseRefreshOptions): UseRefreshReturn {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stalenessTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Manual refresh function
  const refresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    
    try {
      await onRefresh();
      const now = new Date();
      setLastUpdated(now);
      setSecondsSinceUpdate(0);
      
      if (showSuccessToast) {
        notify.success('Data refreshed successfully');
      }
    } catch (error) {
      console.error('Refresh failed:', error);
      
      if (showErrorToast) {
        notify.error('Failed to refresh data. Please try again.');
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, onRefresh, showSuccessToast, showErrorToast]);

  // Update staleness counter every second
  useEffect(() => {
    if (!lastUpdated) return;

    stalenessTimerRef.current = setInterval(() => {
      const now = new Date();
      const seconds = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);
      setSecondsSinceUpdate(seconds);
    }, 1000);

    return () => {
      if (stalenessTimerRef.current) {
        clearInterval(stalenessTimerRef.current);
      }
    };
  }, [lastUpdated]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!enableAutoRefresh) return;

    autoRefreshTimerRef.current = setInterval(() => {
      refresh();
    }, autoRefreshInterval);

    return () => {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
      }
    };
  }, [enableAutoRefresh, autoRefreshInterval, refresh]);

  return {
    isRefreshing,
    lastUpdated,
    secondsSinceUpdate,
    refresh,
    setLastUpdated
  };
}

/**
 * Format seconds into human-readable time
 */
export function formatTimeSince(seconds: number): string {
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
