import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { setupRoutes } from './routes';
import { setupWebSocket } from './websocket';
import { QubicClient } from './services/qubic-client';
import { JobQueue } from './services/job-queue';
import { startHeartbeatService } from './services/provider-heartbeat.service';
import { logger, dbLogger } from './services/logger';
import { requestLogger, errorLogger, performanceMonitor } from './middleware/request-logger';
import { compressionMiddleware, cacheControl } from './middleware/compression';
import { generalLimiter } from './middleware/rate-limiter';
import { startHealthMonitoring, monitorDatabaseConnection } from './services/health';
import { escrowService } from './services/escrow.service';
import { getEarningsBroadcaster } from './services/earnings-broadcaster.service';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3005;

// CORS Configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'https://qubix.io'
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' })); // Support large payloads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Compression middleware - compress responses for better performance
app.use(compressionMiddleware);

// Rate limiting - protect against abuse
app.use('/api', generalLimiter.middleware());

// Request logging middleware (Requirements: 3.5)
app.use(requestLogger);
app.use(performanceMonitor(1000)); // Warn on requests > 1s

// Cache control for static assets
app.use('/static', cacheControl(86400)); // 24 hours

// Initialize services
const qubicClient = new QubicClient({
  host: process.env.QUBIC_RPC_HOST || 'localhost',
  port: parseInt(process.env.QUBIC_RPC_PORT || '21841')
});

const jobQueue = new JobQueue();

// Setup WebSocket first (so wsManager is available for routes)
const wsManager = setupWebSocket(wss, { qubicClient, jobQueue });

// Initialize escrow service with WebSocket manager for real-time updates
escrowService.setWebSocketManager(wsManager);

// Setup routes with wsManager
setupRoutes(app, { qubicClient, jobQueue, wsManager });

// Error logging middleware (must be after routes)
app.use(errorLogger);

// Start provider heartbeat service for timeout detection
// Requirements: 5.1, 5.2, 5.3 - Real-time GPU metrics and provider status
const heartbeatService = startHeartbeatService(wsManager);

// Start earnings broadcaster for live earnings updates
// Requirements: 9.2 - Broadcast earnings updates every 5 seconds
const earningsBroadcaster = getEarningsBroadcaster(wsManager);
earningsBroadcaster.start();

// Start health monitoring (Requirements: 3.5)
const healthMonitor = startHealthMonitoring(30000, qubicClient);

// Monitor database connection (non-blocking)
monitorDatabaseConnection().catch((error) => {
  dbLogger.error({ error: error.message }, 'Database connection failed on startup - running in degraded mode');
  logger.warn('Backend running without database connection - some features may be limited');
});

// Start server
server.listen(PORT, () => {
  logger.info({ port: PORT }, 'Qubix Backend started');
  logger.info('WebSocket server ready');
  logger.info(
    { host: process.env.QUBIC_RPC_HOST, port: process.env.QUBIC_RPC_PORT },
    'Qubic node configured'
  );
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, closing server...');
  heartbeatService.stop();
  earningsBroadcaster.stop();
  clearInterval(healthMonitor);
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaught Exception', (error) => {
  logger.error({ error: error.message, stack: error.stack }, 'Uncaught exception - continuing in degraded mode');
  // Don't exit immediately - allow server to continue in degraded mode
  // Only exit if it's a critical error
  if (error.message.includes('EADDRINUSE') || error.message.includes('EACCES')) {
    logger.fatal('Critical error - shutting down');
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled promise rejection');
});
