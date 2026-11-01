'use strict';
const { Server } = require('socket.io');
const logger = require('../utils/logger');

let io = null;

function init(server) {
  const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:3000'].filter(Boolean);
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);
    const userId = socket.handshake.auth.userId;
    if (userId) {
      socket.join('user:' + userId);
      logger.info(`Socket ${socket.id} joined room user:${userId}`);
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
