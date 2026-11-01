'use strict';
const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/authMiddleware');
const { telemetryLimiter } = require('../middleware/rateLimiter');
const Telemetry = require('../models/Telemetry');
const { getIO } = require('../socket/index');
const logger = require('../utils/logger');

const router = express.Router();

const DEFAULT_SIGNAL = {
  theme: 'light',
  componentOrder: ['dashboard','analytics','settings','notifications'],
  layoutDensity: 'standard',
  detectedClass: ''
};

router.post('/telemetry', authMiddleware, telemetryLimiter, async (req, res) => {
  try {
    // STEP 1: Destructure
    const {
      sessionId,
      clickCount = 0,
      uniqueElementsClicked = 0,
      avgScrollDepth = 50,
      sessionDuration = 1,
      navigationDepth = 1,
      rawEvents = []
    } = req.body;

    // STEP 2: Compute derived features matching generate_data.py exactly
    const clickDensity = sessionDuration > 0
      ? clickCount / (sessionDuration / 60)
      : 0;
    const scrollRate = sessionDuration > 0
      ? ((avgScrollDepth / 10) / sessionDuration) * 100
      : 0;
    const hourOfDay = new Date().getHours();

    // STEP 3: Save to MongoDB
    const telemetryDoc = new Telemetry({
      userId: req.user.userId,
      sessionId,
      clickCount,
      uniqueElementsClicked,
      avgScrollDepth,
      sessionDuration,
      clickDensity,
      navigationDepth,
      scrollRate,
      hourOfDay,
      rawEvents
    });

    // STEP 4: Build feature vector
    const featureVector = {
      click_count: clickCount,
      unique_elements_clicked: uniqueElementsClicked,
      avg_scroll_depth: avgScrollDepth,
      session_duration: sessionDuration,
      click_density: parseFloat(clickDensity.toFixed(4)),
      navigation_depth: navigationDepth,
      scroll_rate: parseFloat(scrollRate.toFixed(4)),
      hour_of_day: hourOfDay
    };

    // STEP 5: Call ML service
    let adaptationSignal = DEFAULT_SIGNAL;
    const mlUrl = (process.env.ML_SERVICE_URL || 'http://localhost:8000') + '/predict';
    try {
      const mlResponse = await axios.post(
        mlUrl,
        featureVector,
        { timeout: 5000 }
      );
      adaptationSignal = mlResponse.data;
    } catch (mlErr) {
      logger.warn(`ML service unavailable: ${mlErr.message}, using default signal`);
    }

    // STEP 6: Update telemetry doc
    telemetryDoc.adaptationApplied = JSON.stringify(adaptationSignal);
    await telemetryDoc.save();

    // STEP 7: Emit via Socket.io
    try {
      const io = getIO();
      io.to('user:' + req.user.userId).emit('adaptation:update', adaptationSignal);
    } catch (socketErr) {
      logger.warn(`Socket emit failed: ${socketErr.message}`);
    }

    // STEP 8: Return response
    return res.status(200).json({ success: true, adaptation: adaptationSignal });
  } catch (err) {
    logger.error(`Telemetry error: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
