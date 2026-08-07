import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import { logger } from './utils/logger.js';
import { setIoInstance } from './services/incidentService.js';
import { setOperatorOnline, setOperatorOffline, isOperatorOnline, sessionEvents } from './services/sessionManager.js';

const server = http.createServer(app);

// Initialize Socket.io Server alongside HTTP Server
export const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  }
});

io.on('connection', (socket) => {
  logger.info(`[Socket.io] Real-time client connected: ${socket.id}`);
  
  // Send current operator online status on connection
  socket.emit('operator:status', { online: isOperatorOnline() });

  socket.on('register-operator', (data) => {
    if (data && data.sessionId) {
      const success = setOperatorOnline(socket.id, data.sessionId);
      if (success) {
        io.emit('operator:status', { online: true });
        logger.info(`[Socket.io] Operator registered successfully on socket ${socket.id}`);
      }
    }
  });

  socket.on('disconnect', () => {
    logger.info(`[Socket.io] Real-time client disconnected: ${socket.id}`);
    const wasOnline = setOperatorOffline(socket.id);
    if (wasOnline) {
      io.emit('operator:status', { online: false });
      logger.info(`[Socket.io] Operator socket ${socket.id} disconnected. Operator is now offline.`);
    }
  });
});

// Listen to global session events for active session eviction
sessionEvents.on('session-invalidated', (oldSessionId) => {
  io.emit('operator:session-invalidated', { oldSessionId });
  logger.info(`[Socket.io Broadcast] Operator session invalidated event sent for oldSessionId: ${oldSessionId}`);
});

// Bind Socket.io instance to incident service for event broadcasting
setIoInstance(io);

const startServer = async () => {
  await connectDB();
  server.listen(config.port, () => {
    logger.info(`Server running in ${config.nodeEnv} mode with WebSockets on port ${config.port}`);
  });
};

startServer();
