'use strict';
const express = require('express');
const jwt = require('jsonwebtoken');
const Feedback = require('../models/Feedback');
const logger = require('../utils/logger');
const { feedbackLimiter } = require('../middleware/rateLimiter');
const { validateFeedback } = require('../middleware/validate');

const router = express.Router();

/**
 * Optional authentication: extracts userId if Authorization header is present,
 * but allows guest requests through.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'context_ui_default_jwt_secret_key');
      req.user = decoded;
    } catch (e) {
      // Invalid token, proceed as guest
    }
  }
  next();
}

// POST /api/feedback
router.post('/feedback', feedbackLimiter, optionalAuth, validateFeedback, async (req, res) => {
  try {
    const {
      sessionId = 'guest_session',
      featureVector = {},
      chosenSetting = {},
      previousState = 'balanced',
      targetState = '',
    } = req.body;

    if (!chosenSetting || typeof chosenSetting !== 'object') {
      return res.status(400).json({ error: 'chosenSetting is required' });
    }

    const feedbackDoc = new Feedback({
      userId: req.user ? req.user.userId : null,
      sessionId,
      featureVector,
      chosenSetting,
      previousState,
      targetState: targetState || (chosenSetting.state || chosenSetting.value || ''),
    });

    await feedbackDoc.save();
    logger.info(`Recorded user adaptation feedback for session ${sessionId}: setting=${JSON.stringify(chosenSetting)}`);

    return res.status(201).json({
      success: true,
      message: 'Feedback recorded successfully for real model retraining',
      feedbackId: feedbackDoc._id,
    });
  } catch (err) {
    logger.error(`Feedback submission error: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error recording feedback' });
  }
});

// GET /api/feedback/export — exports all recorded feedback windows for retraining
router.get('/feedback/export', async (req, res) => {
  try {
    const feedbackList = await Feedback.find({}).sort({ timestamp: -1 });
    const formatted = feedbackList.map((item) => {
      const label = item.targetState || (item.chosenSetting?.state || item.chosenSetting?.value || 'balanced');
      return {
        _id: item._id,
        sessionId: item.sessionId,
        label,
        featureVector: item.featureVector,
        chosenSetting: item.chosenSetting,
        previousState: item.previousState,
        timestamp: item.timestamp,
      };
    });

    return res.status(200).json({
      count: formatted.length,
      data: formatted,
    });
  } catch (err) {
    logger.error(`Error exporting feedback: ${err.message}`);
    return res.status(500).json({ error: 'Failed to export feedback data' });
  }
});

module.exports = router;
