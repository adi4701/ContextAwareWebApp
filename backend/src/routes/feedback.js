'use strict';
const express = require('express');
const jwt = require('jsonwebtoken');
const Feedback = require('../models/Feedback');
const logger = require('../utils/logger');

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
router.post('/feedback', optionalAuth, async (req, res) => {
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

module.exports = router;
