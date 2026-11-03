'use strict';
const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'context_ui_default_jwt_secret_key');
      req.user = decoded;
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
  }

  // Gracefully permit guest / demo sessions for real-time telemetry adaptation
  const isTelemetry = req.path === '/telemetry' || (req.baseUrl && req.baseUrl.includes('telemetry'));
  if (isTelemetry) {
    const guestId = req.body?.sessionId || ('guest_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7));
    req.user = { userId: guestId, isGuest: true };
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized: Authentication required' });
};
