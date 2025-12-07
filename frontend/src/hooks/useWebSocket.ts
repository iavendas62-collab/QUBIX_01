import { useEffect, useState, useCallback, useRef } from 'react';
import { getWebSocketClient, WSEventType } from '../services/websocket';

type EventHandler = (data: any) => void;

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('DISCONNECTED');
  const wsClient = useRef(getWebSocketClient());
  const checkInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const client = wsClient.current;

    // Connect on mount
    client.connect().catch(err => {
      console.error('Failed to connect WebSocket:', err);
    });

    // Check connection state periodically
    checkInterval.current = setInterval(() => {
      setIsConnected(client.isConnected());
      setConnectionState(client.getConnectionState());
    }, 1000);

    return () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
      }
    };
  }, []);

  const subscribe = useCallback((eventType: string, handler: EventHandler) => {
    wsClient.current.on(eventType, handler);
    
    return () => {
      wsClient.current.off(eventType, handler);
    };
  }, []);

  const subscribeToMarketplace = useCallback(() => {
    wsClient.current.subscribeToMarketplace();
  }, []);

  const subscribeToProvider = useCallback((providerId: string) => {
    wsClient.current.subscribeToProvider(providerId);
  }, []);

  const subscribeToJob = useCallback((jobId: string) => {
    wsClient.current.subscribeToJob(jobId);
  }, []);

  const unsubscribe = useCallback((subscriptionId: string) => {
    wsClient.current.unsubscribe(subscriptionId);
  }, []);

  return {
    isConnected,
    connectionState,
    subscribe,
    subscribeToMarketplace,
    subscribeToProvider,
    subscribeToJob,
    unsubscribe,
    WSEventType
  };
}

// Hook for marketplace updates
export function useMarketplaceUpdates(onUpdate: (data: any) => void) {
  const { subscribe, subscribeToMarketplace, isConnected } = useWebSocket();

  useEffect(() => {
    // Don't block if WebSocket is not connected - marketplace can work without it
    if (!isConnected) {
      console.log('WebSocket not connected, marketplace updates disabled');
      return;
    }

    try {
      // Subscribe to marketplace
      subscribeToMarketplace();

      // Listen for all marketplace-related events
      const unsubscribers = [
        subscribe(WSEventType.PROVIDER_REGISTERED, onUpdate),
        subscribe(WSEventType.PROVIDER_STATUS_CHANGED, onUpdate),
        subscribe(WSEventType.MARKETPLACE_UPDATE, onUpdate)
      ];

      return () => {
        unsubscribers.forEach(unsub => unsub());
      };
    } catch (error) {
      console.error('Error setting up marketplace updates:', error);
    }
  }, [isConnected, subscribe, subscribeToMarketplace, onUpdate]);
}

// Hook for provider metrics
export function useProviderMetrics(providerId: string | null, onMetrics: (data: any) => void) {
  const { subscribe, subscribeToProvider, unsubscribe, isConnected } = useWebSocket();

  useEffect(() => {
    if (!isConnected || !providerId) return;

    // Subscribe to provider
    subscribeToProvider(providerId);

    // Listen for metrics updates
    const unsubscriber = subscribe(WSEventType.GPU_METRICS_UPDATE, (data) => {
      if (data.providerId === providerId) {
        onMetrics(data);
      }
    });

    return () => {
      unsubscriber();
      unsubscribe(`provider:${providerId}`);
    };
  }, [isConnected, providerId, subscribe, subscribeToProvider, unsubscribe, onMetrics]);
}

// Hook for job progress
export function useJobProgress(jobId: string | null, onProgress: (data: any) => void) {
  const { subscribe, subscribeToJob, unsubscribe, isConnected } = useWebSocket();

  useEffect(() => {
    if (!isConnected || !jobId) return;

    // Subscribe to job
    subscribeToJob(jobId);

    // Listen for job updates
    const unsubscribers = [
      subscribe(WSEventType.JOB_PROGRESS, (data) => {
        if (data.jobId === jobId) {
          onProgress(data);
        }
      }),
      subscribe(WSEventType.JOB_COMPLETED, (data) => {
        if (data.jobId === jobId) {
          onProgress(data);
        }
      })
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
      unsubscribe(`job:${jobId}`);
    };
  }, [isConnected, jobId, subscribe, subscribeToJob, unsubscribe, onProgress]);
}

// Alias for useJobProgress for semantic clarity
export const useJobUpdates = useJobProgress;
