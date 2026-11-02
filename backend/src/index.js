'use strict';
require('dotenv').config();

const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');

const logger = require('./utils/logger');
const { healthLimiter } = require('./middleware/rateLimiter');
const authRouter = require('./routes/auth');
const telemetryRouter = require('./routes/telemetry');
const tasksRouter = require('./routes/tasks');
const feedbackRouter = require('./routes/feedback');
const socketModule = require('./socket/index');

const app = express();
const server = http.createServer(app);

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'https://context-aware-web-app.vercel.app'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile, server, curl)
    if (!origin) return callback(null, true);

    const isAllowed =
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost');

    if (isAllowed) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRouter);
app.use('/api', telemetryRouter);
app.use('/api', feedbackRouter);
app.use('/api/tasks', tasksRouter);

// Health check with subsystem verification
const handleHealthCheck = async (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  let mlStatus = 'offline';
  try {
    const mlUrl = (process.env.ML_SERVICE_URL || 'http://localhost:8000') + '/health';
    const mlRes = await axios.get(mlUrl, { timeout: 1200 });
    if (mlRes.data && mlRes.data.status === 'ok') {
      mlStatus = 'connected';
    }
  } catch (err) {
    mlStatus = 'offline';
  }

  const isDegraded = mongoStatus !== 'connected';
  const statusCode = isDegraded ? 503 : 200;

  res.status(statusCode).json({
    status: isDegraded ? 'degraded' : 'ok',
    timestamp: new Date().toISOString(),
    services: {
      backend: 'ok',
      mongodb: mongoStatus,
      mlService: mlStatus,
    },
    fallbackActive: mlStatus !== 'connected',
  });
};

app.get('/health', healthLimiter, handleHealthCheck);
app.get('/api/health', healthLimiter, handleHealthCheck);

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
