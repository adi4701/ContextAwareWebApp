'use strict';
const mongoose = require('mongoose');

const TelemetrySchema = new mongoose.Schema({
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
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Telemetry', TelemetrySchema);
