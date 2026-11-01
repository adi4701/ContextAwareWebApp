'use strict';
const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Optional for guest mode
    index: true,
  },
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  featureVector: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  chosenSetting: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  previousState: {
    type: String,
    default: 'balanced',
  },
  targetState: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

module.exports = mongoose.model('Feedback', FeedbackSchema);
