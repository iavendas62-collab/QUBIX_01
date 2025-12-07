import { WebSocketServer, WebSocket } from 'ws';

// Event types for WebSocket messages
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
  JOB_LOGS = 'JOB_LOGS',
  MARKETPLACE_UPDATE = 'MARKETPLACE_UPDATE',
  ERROR = 'error'
}

interface WSMessage {
  type: string;
  data?: any;
  subscriptionId?: string;
}

interface ClientSubscription {
  ws: WebSocket;
  subscriptions: Set<string>;
  lastPing: number;
}

export class WebSocketManager {
  private clients: Map<string, ClientSubscription> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map(); // subscription -> clientIds
  private wss: WebSocketServer;
  private services: any;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(wss: WebSocketServer, services: any) {
    this.wss = wss;
    this.services = services;
    this.setupConnectionHandler();
    this.startHeartbeat();
  }

  private setupConnectionHandler() {
    this.wss.on('connection', (ws: WebSocket) => {
      const clientId = this.generateClientId();
      console.log(`📡 New WebSocket connection: ${clientId}`);

      // Initialize client subscription tracking
      this.clients.set(clientId, {
        ws,
        subscriptions: new Set(),
        lastPing: Date.now()
      });

      // Send welcome message
      this.sendToClient(ws, {
        type: 'connected',
        data: { clientId, timestamp: new Date().toISOString() }
      });

      // Handle incoming messages
      ws.on('message', (message: Buffer) => {
        this.handleMessage(clientId, message);
      });

      // Handle connection close
      ws.on('close', () => {
        console.log(`📡 WebSocket connection closed: ${clientId}`);
        this.removeClient(clientId);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.removeClient(clientId);
      });
    });
  }

  private handleMessage(clientId: string, message: Buffer) {
    try {
      const data: WSMessage = JSON.parse(message.toString());
      const client = this.clients.get(clientId);

      if (!client) {
        console.warn(`Message from unknown client: ${clientId}`);
        return;
      }

      // Update last ping time
      client.lastPing = Date.now();

      switch (data.type) {
        case WSEventType.SUBSCRIBE_MARKETPLACE:
          this.subscribe(clientId, 'marketplace');
          this.sendToClient(client.ws, {
            type: WSEventType.SUBSCRIBED,
            data: { subscription: 'marketplace' }
          });
          break;

        case WSEventType.SUBSCRIBE_PROVIDER:
          if (data.subscriptionId) {
            this.subscribe(clientId, `provider:${data.subscriptionId}`);
            this.sendToClient(client.ws, {
              type: WSEventType.SUBSCRIBED,
              data: { subscription: `provider:${data.subscriptionId}` }
            });
          }
          break;

        case WSEventType.SUBSCRIBE_JOB:
          if (data.subscriptionId) {
            this.subscribe(clientId, `job:${data.subscriptionId}`);
            this.sendToClient(client.ws, {
              type: WSEventType.SUBSCRIBED,
              data: { subscription: `job:${data.subscriptionId}` }
            });
          }
          break;

        case WSEventType.UNSUBSCRIBE:
          if (data.subscriptionId) {
            this.unsubscribe(clientId, data.subscriptionId);
          }
          break;

        case WSEventType.PING:
          this.sendToClient(client.ws, { type: WSEventType.PONG });
          break;

        default:
          console.warn(`Unknown message type: ${data.type}`);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      const client = this.clients.get(clientId);
      if (client) {
        this.sendToClient(client.ws, {
          type: WSEventType.ERROR,
          data: { message: 'Invalid message format' }
        });
      }
    }
  }

  private subscribe(clientId: string, subscriptionId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Add to client's subscriptions
    client.subscriptions.add(subscriptionId);

    // Add to subscription map
    if (!this.subscriptions.has(subscriptionId)) {
      this.subscriptions.set(subscriptionId, new Set());
    }
    this.subscriptions.get(subscriptionId)!.add(clientId);

    console.log(`Client ${clientId} subscribed to ${subscriptionId}`);
  }

  private unsubscribe(clientId: string, subscriptionId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from client's subscriptions
    client.subscriptions.delete(subscriptionId);

    // Remove from subscription map
    const subscribers = this.subscriptions.get(subscriptionId);
    if (subscribers) {
      subscribers.delete(clientId);
      if (subscribers.size === 0) {
        this.subscriptions.delete(subscriptionId);
      }
    }

    console.log(`Client ${clientId} unsubscribed from ${subscriptionId}`);
  }

  private removeClient(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from all subscriptions
    client.subscriptions.forEach(subscriptionId => {
      const subscribers = this.subscriptions.get(subscriptionId);
      if (subscribers) {
        subscribers.delete(clientId);
        if (subscribers.size === 0) {
          this.subscriptions.delete(subscriptionId);
        }
      }
    });

    // Remove client
    this.clients.delete(clientId);
  }

  private sendToClient(ws: WebSocket, message: WSMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending message to client:', error);
      }
    }
  }

  // Public broadcast methods
  public broadcastToSubscription(subscriptionId: string, message: WSMessage) {
    const subscribers = this.subscriptions.get(subscriptionId);
    if (!subscribers || subscribers.size === 0) {
      return;
    }

    subscribers.forEach(clientId => {
      const client = this.clients.get(clientId);
      if (client) {
        this.sendToClient(client.ws, message);
      }
    });
  }

  public broadcastProviderRegistered(provider: any) {
    this.broadcastToSubscription('marketplace', {
      type: WSEventType.PROVIDER_REGISTERED,
      data: provider
    });
  }

  public broadcastProviderStatusChanged(providerId: string, status: any) {
    // Broadcast to marketplace
    this.broadcastToSubscription('marketplace', {
      type: WSEventType.PROVIDER_STATUS_CHANGED,
      data: { providerId, status }
    });

    // Broadcast to provider-specific subscribers
    this.broadcastToSubscription(`provider:${providerId}`, {
      type: WSEventType.PROVIDER_STATUS_CHANGED,
      data: { providerId, status }
    });
  }

  public broadcastGPUMetrics(providerId: string, metrics: any) {
    this.broadcastToSubscription(`provider:${providerId}`, {
      type: WSEventType.GPU_METRICS_UPDATE,
      data: { providerId, metrics, timestamp: new Date().toISOString() }
    });
  }

  public broadcastGPUMetricsUpdate(providerId: string, metrics: any) {
    // Alias for broadcastGPUMetrics
    this.broadcastGPUMetrics(providerId, metrics);
  }

  public broadcastJobProgress(jobId: string, progress: number, data?: any) {
    this.broadcastToSubscription(`job:${jobId}`, {
      type: WSEventType.JOB_PROGRESS,
      data: { 
        jobId, 
        progress, 
        currentOperation: data?.currentOperation,
        metrics: data?.metrics,
        timeRemaining: data?.timeRemaining,
        costSoFar: data?.costSoFar,
        timestamp: data?.timestamp || new Date().toISOString() 
      }
    });
  }

  public broadcastJobCompleted(jobId: string, status: string, result: any) {
    this.broadcastToSubscription(`job:${jobId}`, {
      type: WSEventType.JOB_COMPLETED,
      data: { jobId, status, result, timestamp: new Date().toISOString() }
    });
  }

  public broadcastJobLogs(jobId: string, logs: any[]) {
    this.broadcastToSubscription(`job:${jobId}`, {
      type: WSEventType.JOB_LOGS,
      data: { jobId, logs, timestamp: new Date().toISOString() }
    });
  }

  public broadcastMarketplaceUpdate(update: any) {
    this.broadcastToSubscription('marketplace', {
      type: WSEventType.MARKETPLACE_UPDATE,
      data: update
    });
  }

  public broadcastEarningsUpdate(providerId: string, earningsData: any) {
    this.broadcastToSubscription(`provider:${providerId}`, {
      type: 'EARNINGS_UPDATE',
      data: {
        providerId,
        ...earningsData,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Heartbeat to detect stale connections
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 60000; // 60 seconds

      this.clients.forEach((client, clientId) => {
        if (now - client.lastPing > timeout) {
          console.log(`Client ${clientId} timed out, closing connection`);
          client.ws.close();
          this.removeClient(clientId);
        }
      });
    }, 30000); // Check every 30 seconds
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getStats() {
    return {
      totalClients: this.clients.size,
      totalSubscriptions: this.subscriptions.size,
      subscriptionDetails: Array.from(this.subscriptions.entries()).map(([id, clients]) => ({
        subscriptionId: id,
        subscriberCount: clients.size
      }))
    };
  }

  public shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Close all client connections
    this.clients.forEach((client, clientId) => {
      client.ws.close();
    });

    this.clients.clear();
    this.subscriptions.clear();
  }
}

export function setupWebSocket(wss: WebSocketServer, services: any) {
  const wsManager = new WebSocketManager(wss, services);

  // Expose WebSocket manager to services
  services.wsManager = wsManager;

  return wsManager;
}
