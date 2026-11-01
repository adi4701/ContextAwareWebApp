'use strict';
const mongoose = require('mongoose');

const TelemetrySchema = new mongoose.Schema({
  // ── Legacy fields (preserved for historical data) ─────────────────────────
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: String, required: true },
  clickCount: { type: Number, default: 0 },
  uniqueElementsClicked: { type: Number, default: 0 },
  avgScrollDepth: { type: Number, default: 0 },
  sessionDuration: { type: Number, default: 0 },
  clickDensity: { type: Number, default: 0 },
  navigationDepth: { type: Number, default: 0 },
  scrollRate: { type: Number, default: 0 },
  hourOfDay: { type: Number, default: 0 },
  rawEvents: [mongoose.Schema.Types.Mixed],
  adaptationApplied: { type: String },

  // ── New fields (Phase 1+) ─────────────────────────────────────────────────
  // 8-feature window vector sent to ML service
  featureVector: { type: mongoose.Schema.Types.Mixed },

  // ML response fields
  state: { type: String, default: '' },          // fast_navigator | reader | struggling | explorer | balanced
  confidence: { type: Number, default: 0 },
  reasons: [{ type: String }],

  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Telemetry', TelemetrySchema);
