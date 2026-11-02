'use strict';
/**
 * middleware/validate.js
 *
 * Strict input validation and sanitization for telemetry and feedback routes.
 * Ensures data integrity, prevents malformed vectors, and strictly enforces
 * zero-knowledge privacy boundaries (blocking key values and text inputs).
 */

const ALLOWED_STATES = ['fast_navigator', 'reader', 'struggling', 'explorer', 'balanced'];

/**
 * Checks if a value is a valid finite number.
 */
function isFiniteNumber(val) {
  return typeof val === 'number' && Number.isFinite(val);
}

/**
 * Validates the 8 behavioural window features.
 * All features must be finite numbers within their physical bounds.
 *
 * @param {object} f - Feature object
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateFeatureVector(f) {
  if (!f || typeof f !== 'object') {
    return { valid: false, errors: ['Feature vector must be an object'] };
  }

  const errors = [];

  const checks = [
    { key: 'clicks_per_min', min: 0, max: 1200 },
    { key: 'unique_click_ratio', min: 0, max: 1 },
    { key: 'repeat_click_ratio', min: 0, max: 1 },
    { key: 'scroll_speed', min: 0, max: 20000 },
    { key: 'max_scroll_depth', min: 0, max: 100 },
    { key: 'key_presses_per_min', min: 0, max: 2000 },
    { key: 'idle_ratio', min: 0, max: 1 },
    { key: 'view_switches_per_min', min: 0, max: 600 },
  ];

  for (const { key, min, max } of checks) {
    if (f[key] !== undefined) {
      if (!isFiniteNumber(f[key])) {
        errors.push(`Feature '${key}' must be a finite number`);
      } else if (f[key] < min || f[key] > max) {
        errors.push(`Feature '${key}' must be between ${min} and ${max} (received ${f[key]})`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates incoming POST /api/telemetry payload.
 */
function validateTelemetry(req, res, next) {
  const { rawEvents, features, featureVector, sessionId } = req.body;

  // Session ID validation (if provided)
  if (sessionId !== undefined && (typeof sessionId !== 'string' || sessionId.length > 256)) {
    return res.status(400).json({ error: 'sessionId must be a string up to 256 characters' });
  }

  // Raw events validation & privacy enforcement
  if (rawEvents !== undefined) {
    if (!Array.isArray(rawEvents)) {
      return res.status(400).json({ error: 'rawEvents must be an array' });
    }
    if (rawEvents.length > 1000) {
      return res.status(400).json({ error: 'rawEvents cannot exceed 1000 events per window' });
    }

    // Zero-knowledge privacy check: reject any event containing text or key values
    for (const evt of rawEvents) {
      if (!evt || typeof evt !== 'object') {
        return res.status(400).json({ error: 'Each event in rawEvents must be an object' });
      }
      if (evt.key !== undefined || evt.keyValue !== undefined || evt.text !== undefined || evt.value !== undefined) {
        return res.status(400).json({
          error: 'Privacy violation: Telemetry must only include anonymous counts and timestamps, never key values or typed text',
        });
      }
    }
  }

  // Feature vector validation (if precomputed client-side)
  const vectorToTest = features || featureVector;
  if (vectorToTest !== undefined) {
    const { valid, errors } = validateFeatureVector(vectorToTest);
    if (!valid) {
      return res.status(400).json({
        error: 'Invalid feature vector',
        details: errors,
      });
    }
  }

  next();
}

/**
 * Validates incoming POST /api/feedback payload.
 */
function validateFeedback(req, res, next) {
  const { chosenSetting, featureVector, sessionId, targetState, previousState } = req.body;

  if (!chosenSetting || typeof chosenSetting !== 'object') {
    return res.status(400).json({ error: 'chosenSetting is required and must be an object' });
  }

  if (sessionId !== undefined && (typeof sessionId !== 'string' || sessionId.length > 256)) {
    return res.status(400).json({ error: 'sessionId must be a string under 256 characters' });
  }

  if (targetState !== undefined && targetState !== '' && !ALLOWED_STATES.includes(targetState)) {
    return res.status(400).json({
      error: `targetState must be one of: ${ALLOWED_STATES.join(', ')}`,
    });
  }

  if (previousState !== undefined && !ALLOWED_STATES.includes(previousState)) {
    return res.status(400).json({
      error: `previousState must be one of: ${ALLOWED_STATES.join(', ')}`,
    });
  }

  if (featureVector !== undefined) {
    const { valid, errors } = validateFeatureVector(featureVector);
    if (!valid) {
      return res.status(400).json({
        error: 'Invalid feature vector in feedback submission',
        details: errors,
      });
    }
  }

  next();
}

module.exports = {
  validateTelemetry,
  validateFeedback,
  validateFeatureVector,
  ALLOWED_STATES,
};
