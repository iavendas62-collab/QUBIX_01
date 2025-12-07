// WebSocket client with automatic reconnection and exponential backoff

export enum WSEventType {
  // Client -> Server
  SUBSCRIBE_MARKETPLACE = 'subscribe:marketplace',
  SUBSCRIBE_PROVIDER = 'subscribe:provider',
  SUBSCRIBE_JOB = 'subscribe:job',
  UNSUBSCRIBE = 'unsubscribe',
  PING = 'ping',
  
  // Server -> Client
  PONG = 'pong',
  SUBSCRIBED = 'subscribed',
  PROVIDER_REGISTERED = 'PROVIDER_REGISTERED',
  PROVIDER_STATUS_CHANGED = 'PROVIDER_STATUS_CHANGED',
  GPU_METRICS_UPDATE = 'GPU_METRICS_UPDATE',
  JOB_PROGRESS = 'JOB_PROGRESS',
  JOB_COMPLETED = 'JOB_COMPLETED',
  MARKETPLACE_UPDATE = 'MARKETPLACE_UPDATE',
  ERROR = 'error'
}

interface WSMessage {
  type: string;
  data?: any;
  subscriptionId?: string;
}

type EventHandler = (data: any) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  private subscriptions: Set<string> = new Set();
  private isIntentionallyClosed = false;
  private connectionPromise: Promise<void> | null = null;

  constructor(url?: string) {
    // Default to localhost in development, use relative path in production
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    this.url = url || (isDev 
      ? 'ws://localhost:3001' 
      : `ws://${window.location.host}`);
  }

  public connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        this.isIntentionallyClosed = false;
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected');
          this.reconnectAttempts = 0;
          this.connectionPromise = null;
          this.startPingInterval();
          
          // Resubscribe to all previous subscriptions
          this.resubscribe();
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.connectionPromise = null;
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('🔌 WebSocket disconnected');
          this.stopPingInterval();
          this.connectionPromise = null;
          
          if (!this.isIntentionallyClosed) {
            this.scheduleReconnect();
          }
        };
      } catch (error) {
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s (max 5s per requirement)
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 5000);
    this.reconnectAttempts++;

    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch(err => {
        console.error('Reconnection failed:', err);
      });
    }, delay);
  }

  private handleMessage(data: string) {
    try {
      const message: WSMessage = JSON.parse(data);
      
      // Emit to specific event handlers
      const handlers = this.eventHandlers.get(message.type);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(message.data);
          } catch (error) {
            console.error(`Error in event handler for ${message.type}:`, error);
          }
        });
      }

      // Also emit to wildcard handlers
      const wildcardHandlers = this.eventHandlers.get('*');
      if (wildcardHandlers) {
        wildcardHandlers.forEach(handler => {
          try {
            handler(message);
          } catch (error) {
            console.error('Error in wildcard event handler:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private startPingInterval() {
    this.pingInterval = setInterval(() => {
      this.send({ type: WSEventType.PING });
    }, 30000); // Ping every 30 seconds
  }

  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private resubscribe() {
    this.subscriptions.forEach(subscription => {
      if (subscription === 'marketplace') {
        this.send({ type: WSEventType.SUBSCRIBE_MARKETPLACE });
      } else if (subscription.startsWith('provider:')) {
        const providerId = subscription.split(':')[1];
        this.send({ 
          type: WSEventType.SUBSCRIBE_PROVIDER, 
          subscriptionId: providerId 
        });
      } else if (subscription.startsWith('job:')) {
        const jobId = subscription.split(':')[1];
        this.send({ 
          type: WSEventType.SUBSCRIBE_JOB, 
          subscriptionId: jobId 
        });
      }
    });
  }

  public send(message: WSMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  }

  public subscribeToMarketplace() {
    this.subscriptions.add('marketplace');
    this.send({ type: WSEventType.SUBSCRIBE_MARKETPLACE });
  }

  public subscribeToProvider(providerId: string) {
    this.subscriptions.add(`provider:${providerId}`);
    this.send({ 
      type: WSEventType.SUBSCRIBE_PROVIDER, 
      subscriptionId: providerId 
    });
  }

  public subscribeToJob(jobId: string) {
    this.subscriptions.add(`job:${jobId}`);
    this.send({ 
      type: WSEventType.SUBSCRIBE_JOB, 
      subscriptionId: jobId 
    });
  }

  public unsubscribe(subscriptionId: string) {
    this.subscriptions.delete(subscriptionId);
    this.send({ 
      type: WSEventType.UNSUBSCRIBE, 
      subscriptionId 
    });
  }

  public on(eventType: string, handler: EventHandler) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);
  }

  public off(eventType: string, handler: EventHandler) {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(eventType);
      }
    }
  }

  public disconnect() {
    this.isIntentionallyClosed = true;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.stopPingInterval();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.subscriptions.clear();
    this.eventHandlers.clear();
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  public getConnectionState(): string {
    if (!this.ws) return 'DISCONNECTED';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'OPEN';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'CLOSED';
      default: return 'UNKNOWN';
    }
  }
}

// Singleton instance
let wsClient: WebSocketClient | null = null;

export function getWebSocketClient(): WebSocketClient {
  if (!wsClient) {
    wsClient = new WebSocketClient();
  }
  return wsClient;
}

export function resetWebSocketClient() {
  if (wsClient) {
    wsClient.disconnect();
    wsClient = null;
  }
}
