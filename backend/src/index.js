'use strict';
require('dotenv').config();

const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');

const logger = require('./utils/logger');
const authRouter = require('./routes/auth');
const telemetryRouter = require('./routes/telemetry');
const socketModule = require('./socket/index');

const app = express();
const server = http.createServer(app);

// Middleware
const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:3000'].filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRouter);
app.use('/api', telemetryRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>ContextUI API</title></head>
      <body style="font-family:sans-serif; text-align:center; padding:50px; background:#f8fafc;">
        <h2>ContextUI Backend API is Active</h2>
        <p>The interactive web application runs on <strong>Port 3000</strong>.</p>
        <p><a href="http://localhost:3000" style="background:#2563eb; color:white; padding:10px 20px; text-decoration:none; border-radius:8px; display:inline-block; margin-top:10px; font-weight:bold;">Open Frontend (http://localhost:3000)</a></p>
      </body>
    </html>
  `);
});

// Initialize Socket.io
socketModule.init(server);

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/context-aware-app';
mongoose.connect(MONGO_URI)
  .then(() => {
    logger.info('MongoDB connected');
    server.listen(PORT, () => {
      logger.info(`Backend running on port ${PORT}`);
    });
  })
  .catch(err => {
    logger.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  });
