/**
 * Tests for useRefresh hook
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRefresh, formatTimeSince } from '../useRefresh';

// Mock notify
jest.mock('../../components/ui', () => ({
  notify: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('useRefresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should initialize with correct default values', () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useRefresh({ onRefresh }));

    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.lastUpdated).toBeNull();
    expect(result.current.secondsSinceUpdate).toBe(0);
  });

  it('should call onRefresh when refresh is triggered', async () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useRefresh({ onRefresh }));

    await act(async () => {
      await result.current.refresh();
    });

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('should set isRefreshing to true during refresh', async () => {
    let resolveRefresh: () => void;
    const refreshPromise = new Promise<void>((resolve) => {
      resolveRefresh = resolve;
    });
    const onRefresh = jest.fn(() => refreshPromise);
    
    const { result } = renderHook(() => useRefresh({ onRefresh }));

    act(() => {
      result.current.refresh();
    });

    expect(result.current.isRefreshing).toBe(true);

    await act(async () => {
      resolveRefresh!();
      await refreshPromise;
    });

    expect(result.current.isRefreshing).toBe(false);
  });

  it('should update lastUpdated after successful refresh', async () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useRefresh({ onRefresh }));

    expect(result.current.lastUpdated).toBeNull();

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.lastUpdated).toBeInstanceOf(Date);
  });

  it('should increment secondsSinceUpdate every second', async () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useRefresh({ onRefresh }));

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.secondsSinceUpdate).toBe(0);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(result.current.secondsSinceUpdate).toBe(1);
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(result.current.secondsSinceUpdate).toBe(3);
    });
  });

  it('should auto-refresh at specified interval', async () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined);
    renderHook(() => 
      useRefresh({ 
        onRefresh, 
        autoRefreshInterval: 5000,
        enableAutoRefresh: true 
      })
    );

    expect(onRefresh).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(onRefresh).toHaveBeenCalledTimes(2);
    });
  });

  it('should not auto-refresh when disabled', async () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined);
    renderHook(() => 
      useRefresh({ 
        onRefresh, 
        autoRefreshInterval: 5000,
        enableAutoRefresh: false 
      })
    );

    await act(async () => {
      jest.advanceTimersByTime(10000);
    });

    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('should handle refresh errors gracefully', async () => {
    const error = new Error('Refresh failed');
    const onRefresh = jest.fn().mockRejectedValue(error);
    const { result } = renderHook(() => useRefresh({ onRefresh }));

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.isRefreshing).toBe(false);
  });

  it('should not trigger multiple refreshes simultaneously', async () => {
    let resolveCount = 0;
    const onRefresh = jest.fn(() => 
      new Promise<void>((resolve) => {
        setTimeout(() => {
          resolveCount++;
          resolve();
        }, 100);
      })
    );
    
    const { result } = renderHook(() => useRefresh({ onRefresh }));

    // Trigger multiple refreshes
    act(() => {
      result.current.refresh();
      result.current.refresh();
      result.current.refresh();
    });

    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    // Should only call once
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});

describe('formatTimeSince', () => {
  it('should format seconds correctly', () => {
    expect(formatTimeSince(0)).toBe('0s ago');
    expect(formatTimeSince(30)).toBe('30s ago');
    expect(formatTimeSince(59)).toBe('59s ago');
  });

  it('should format minutes correctly', () => {
    expect(formatTimeSince(60)).toBe('1m ago');
    expect(formatTimeSince(120)).toBe('2m ago');
    expect(formatTimeSince(3599)).toBe('59m ago');
  });

  it('should format hours correctly', () => {
    expect(formatTimeSince(3600)).toBe('1h ago');
    expect(formatTimeSince(7200)).toBe('2h ago');
    expect(formatTimeSince(86399)).toBe('23h ago');
  });

  it('should format days correctly', () => {
    expect(formatTimeSince(86400)).toBe('1d ago');
    expect(formatTimeSince(172800)).toBe('2d ago');
    expect(formatTimeSince(604800)).toBe('7d ago');
  });
});

