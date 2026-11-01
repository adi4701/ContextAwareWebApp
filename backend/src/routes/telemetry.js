'use strict';
/**
 * routes/telemetry.js
 *
 * POST /api/telemetry
 * - Accepts raw events from the frontend
 * - Computes 8 behavioural window features via features.js
 * - Calls ML service /predict
 * - Applies 2-consecutive-same-state smoothing to prevent flickering
 * - Emits adaptation:update via Socket.io
 * - Returns full AdaptationSignal to the client
 * - Keeps all legacy fields in the MongoDB document for older data compatibility
 */

const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/authMiddleware');
const { telemetryLimiter } = require('../middleware/rateLimiter');
const Telemetry = require('../models/Telemetry');
const { getIO } = require('../socket/index');
const logger = require('../utils/logger');
const { computeFeatures } = require('../utils/features');

const router = express.Router();

// ── Default signal (balanced fallback) ───────────────────────────────────────
const DEFAULT_SIGNAL = {
  // New contract
  state: 'balanced',
  predictedState: 'balanced',
  confidence: 0,
  lowConfidence: true,
  probabilities: {},
  reasons: ['ML service unavailable — using default layout'],
  changes: ['Default layout applied'],
  adaptation: {
    density: 'standard',
    textScale: 1.0,
    targetSize: 'normal',
    showShortcuts: false,
    showHelp: false,
    emphasizeSearch: false,
    showNotes: false,
  },
  // Compatibility shims
  theme: 'light',
  componentOrder: ['dashboard', 'analytics', 'settings', 'notifications'],
  layoutDensity: 'standard',
  detectedClass: '',
};

// ── Per-user smoothing state ──────────────────────────────────────────────────
// Stored in-memory (reset on backend restart — acceptable for demo).
// Key: userId string → { lastPredicted: string, count: number }
const smoothingState = new Map();

const SMOOTH_REQUIRED = 2; // must see same state N times in a row

/**
 * Returns the smoothed state. Updates the in-memory counter.
 * Only emits a state change when the same predicted state appears
 * SMOOTH_REQUIRED consecutive times.
 *
 * @param {string} userId
 * @param {string} predictedState  Raw output from ML
 * @returns {{ emit: boolean, state: string }}
 */
function smooth(userId, predictedState) {
  const prev = smoothingState.get(userId) || { lastPredicted: null, count: 0, currentState: 'balanced' };

  if (prev.lastPredicted === predictedState) {
    const count = prev.count + 1;
    smoothingState.set(userId, { ...prev, count });
    if (count >= SMOOTH_REQUIRED) {
      smoothingState.set(userId, { lastPredicted: predictedState, count, currentState: predictedState });
      return { emit: true, state: predictedState };
    }
    // Not enough consecutive hits yet
    return { emit: false, state: prev.currentState };
  }

  // Different state → reset counter
  smoothingState.set(userId, { lastPredicted: predictedState, count: 1, currentState: prev.currentState });
  return { emit: false, state: prev.currentState };
}

// ── Route ─────────────────────────────────────────────────────────────────────

router.post('/telemetry', authMiddleware, telemetryLimiter, async (req, res) => {
  try {
    const {
      sessionId,
      // Legacy cumulative fields (kept for backward compat)
      clickCount = 0,
      uniqueElementsClicked = 0,
      avgScrollDepth = 50,
      sessionDuration = 1,
      navigationDepth = 1,
      // New per-request context
      sessionScrollDepthMax,
      viewSwitchCount,
      sessionStartMs,
      rawEvents = [],
    } = req.body;

    const userId = req.user.userId;

    // ── STEP 1: Legacy derived features (kept in DB for historical compat) ───
    const clickDensity = sessionDuration > 0 ? clickCount / (sessionDuration / 60) : 0;
    const scrollRate = sessionDuration > 0 ? ((avgScrollDepth / 10) / sessionDuration) * 100 : 0;
    const hourOfDay = new Date().getHours();

    // ── STEP 2: New 8-feature window vector ───────────────────────────────────
    const featureVector = computeFeatures(rawEvents, {
      sessionScrollDepthMax: sessionScrollDepthMax ?? avgScrollDepth,
      viewSwitchCount: viewSwitchCount ?? navigationDepth,
      sessionStartMs: sessionStartMs ?? (Date.now() - sessionDuration * 1000),
    });

    // ── STEP 3: Call ML service ───────────────────────────────────────────────
    let rawSignal = DEFAULT_SIGNAL;
    const mlUrl = (process.env.ML_SERVICE_URL || 'http://localhost:8000') + '/predict';
    try {
      const mlResponse = await axios.post(mlUrl, featureVector, { timeout: 5000 });
      rawSignal = mlResponse.data;
    } catch (mlErr) {
      logger.warn(`ML service unavailable: ${mlErr.message} — using default signal`);
    }

    // ── STEP 4: Apply smoothing ───────────────────────────────────────────────
    const { emit: shouldEmit, state: smoothedState } = smooth(userId, rawSignal.state);

    // Build the final signal that the client receives.
    // Always return the raw ML data (confidence, reasons, etc.),
    // but override `state` and `detectedClass` with the smoothed state.
    const adaptationSignal = {
      ...rawSignal,
      state: smoothedState,
      detectedClass: smoothedState,
    };

    // ── STEP 5: Persist to MongoDB ────────────────────────────────────────────
    const telemetryDoc = new Telemetry({
      userId,
      sessionId,
      // Legacy fields
      clickCount,
      uniqueElementsClicked,
      avgScrollDepth,
      sessionDuration,
      clickDensity: parseFloat(clickDensity.toFixed(4)),
      navigationDepth,
      scrollRate: parseFloat(scrollRate.toFixed(4)),
      hourOfDay,
      rawEvents,
      adaptationApplied: JSON.stringify(adaptationSignal),
      // New fields
      featureVector,
      state: smoothedState,
      confidence: rawSignal.confidence || 0,
      reasons: rawSignal.reasons || [],
    });
    await telemetryDoc.save();

    // ── STEP 6: Emit via Socket.io (only when smoothing threshold crossed) ────
    if (shouldEmit) {
      try {
        const io = getIO();
        io.to('user:' + userId).emit('adaptation:update', adaptationSignal);
        logger.info(`Emitted adaptation:update to user:${userId} → state=${smoothedState}`);
      } catch (socketErr) {
        logger.warn(`Socket emit failed: ${socketErr.message}`);
      }
    }

    // ── STEP 7: HTTP response ─────────────────────────────────────────────────
    // Always return the signal (even if we didn't emit via Socket.io)
    // so the HTTP client can use it if it wants.
    return res.status(200).json({
      success: true,
      adaptation: adaptationSignal,
      smoothed: shouldEmit,
    });
  } catch (err) {
    logger.error(`Telemetry error: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
