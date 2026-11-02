'use strict';
/**
 * middleware/rateLimiter.js
 *
 * Dedicated rate limiters for telemetry, auth, feedback, and health probes.
 */
const rateLimit = require('express-rate-limit');

const telemetryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120, // up to 120 flushes per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many telemetry requests, please slow down.' },
});

const feedbackLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60, // up to 60 feedback submits per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many feedback submissions, please try again shortly.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts, please try again later.' },
});

const healthLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300, // generous for external monitoring probes
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  telemetryLimiter,
  feedbackLimiter,
  authLimiter,
  healthLimiter,
};
