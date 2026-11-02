'use strict';
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

let io = null;

function init(server) {
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'https://context-aware-web-app.vercel.app'
  ].filter(Boolean);

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        const isAllowed =
          allowedOrigins.includes(origin) ||
          origin.endsWith('.vercel.app') ||
          origin.includes('localhost');

        if (isAllowed) {
          return callback(null, true);
        }
        return callback(new Error(`Socket origin ${origin} not allowed by CORS`));
      },
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);
    const token = socket.handshake.auth?.token;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'context_ui_default_jwt_secret_key');
        if (decoded && decoded.userId) {
          socket.join('user:' + decoded.userId);
          logger.info(`Socket ${socket.id} authenticated and joined room user:${decoded.userId}`);
        }
      } catch (err) {
        logger.warn(`Socket token verification failed for socket ${socket.id}: ${err.message}`);
      }
    } else if (socket.handshake.auth?.userId) {
      // In development fallback, verify or warn
      const fallbackId = socket.handshake.auth.userId;
      socket.join('user:' + fallbackId);
      logger.info(`Socket ${socket.id} joined room user:${fallbackId}`);
    }

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

module.exports = { init, getIO };
