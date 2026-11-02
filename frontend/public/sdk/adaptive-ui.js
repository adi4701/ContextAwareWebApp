(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AdaptiveUI = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var WINDOW_MS = 20000;      // 20-second rolling sliding window
  var FLUSH_MS = 5000;        // 5-second flush interval
  var REPEAT_THRESHOLD_MS = 1500; // Repeat click detection threshold
  var IDLE_GAP_MS = 3000;     // Inactivity gap threshold (3 seconds)

  var STATE_CONFIGS = {
    fast_navigator: {
      density: 'compact',
      textScale: 1.0,
      targetSize: '36px',
      showShortcuts: true,
      showHelp: false,
      emphasizeSearch: false,
      showNotes: false,
    },
    reader: {
      density: 'spacious',
      textScale: 1.2,
      targetSize: '40px',
      showShortcuts: false,
      showHelp: false,
      emphasizeSearch: false,
      showNotes: true,
    },
    struggling: {
      density: 'standard',
      textScale: 1.1,
      targetSize: '48px',
      showShortcuts: false,
      showHelp: true,
      emphasizeSearch: false,
      showNotes: false,
    },
    explorer: {
      density: 'standard',
      textScale: 1.0,
      targetSize: '36px',
      showShortcuts: false,
      showHelp: false,
      emphasizeSearch: true,
      showNotes: false,
    },
    balanced: {
      density: 'standard',
      textScale: 1.0,
      targetSize: '36px',
      showShortcuts: false,
      showHelp: false,
      emphasizeSearch: false,
      showNotes: false,
    },
  };

  function round4(n) {
    return Math.round(n * 10000) / 10000;
  }

  function clamp(v, min, max) {
    return Math.min(Math.max(v, min), max);
  }

  function generateSessionId() {
    return 'sdk_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
  }

  // ── Core Tracker Class ────────────────────────────────────────────────────────
  function AdaptiveTracker(options) {
    options = options || {};
    this.endpoint = options.endpoint || '/api/telemetry';
    this.feedbackEndpoint = options.feedbackEndpoint || '/api/feedback';
    this.token = options.token || null;
    this.sessionId = options.sessionId || generateSessionId();
    this.consent = typeof options.consent === 'function' ? options.consent : function () { return options.consent !== false; };
    this.flushIntervalMs = options.flushIntervalMs || FLUSH_MS;
    this.windowDurationMs = options.windowDurationMs || WINDOW_MS;
    this.applyCssVariables = options.applyCssVariables !== false;
    this.showFloatingBadge = options.showFloatingBadge !== false;
    this.onAdaptation = typeof options.onAdaptation === 'function' ? options.onAdaptation : null;
    this.debug = Boolean(options.debug);

    this.targetElement = null;
    if (typeof document !== 'undefined') {
      if (typeof options.targetElement === 'string') {
        this.targetElement = document.querySelector(options.targetElement);
      } else if (options.targetElement && options.targetElement.nodeType) {
        this.targetElement = options.targetElement;
      }
      if (!this.targetElement) {
        this.targetElement = document.body || document.documentElement;
      }
    }

    // Rolling events buffer (counts and timestamps ONLY — zero text values)
    this.eventBuffer = [];
    this.sessionStartMs = Date.now();
    this.maxScrollDepthSeen = 0;
    this.viewSwitchCount = 0;

    // Active adaptation state
    this.currentState = 'balanced';
    this.confidence = 0.5;
    this.reasons = ['Standard baseline layout active'];
    this.changes = ['Default styles applied'];
    this.isPaused = false;
    this.pausedUntil = null;

    this._timer = null;
    this._listeners = [];
    this._badgeElement = null;

    this._bindEvents();
    this._startFlushing();
    if (this.showFloatingBadge && typeof document !== 'undefined') {
      this._injectFloatingBadge();
    }
  }

  AdaptiveTracker.prototype._log = function () {
    if (this.debug && typeof console !== 'undefined' && console.log) {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('[AdaptiveUI]');
      console.log.apply(console, args);
    }
  };

  // ── Event Collection (Zero Keystrokes Logged) ───────────────────────────────
  AdaptiveTracker.prototype.recordEvent = function (type, extra) {
    if (!this.consent()) return;

    var now = Date.now();
    var evt = {
      type: type,
      timestamp: now,
    };

    if (extra && extra.elementId) {
      evt.elementId = String(extra.elementId).substring(0, 64);
    }
    if (extra && typeof extra.scrollDepth === 'number') {
      evt.scrollDepth = clamp(extra.scrollDepth, 0, 100);
      if (evt.scrollDepth > this.maxScrollDepthSeen) {
        this.maxScrollDepthSeen = evt.scrollDepth;
      }
    }

    this.eventBuffer.push(evt);

    // Prune events older than rolling window
    var cutoff = now - this.windowDurationMs;
    while (this.eventBuffer.length > 0 && this.eventBuffer[0].timestamp < cutoff) {
      this.eventBuffer.shift();
    }
  };

  AdaptiveTracker.prototype._bindEvents = function () {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    var self = this;

    // Click listener
    function onClick(e) {
      var target = e.target;
      var elId = (target && (target.id || target.getAttribute('data-testid') || target.tagName)) || 'anon';
      self.recordEvent('click', { elementId: elId });
    }

    // Scroll listener (throttled)
    var lastScrollTime = 0;
    function onScroll() {
      var now = Date.now();
      if (now - lastScrollTime < 150) return;
      lastScrollTime = now;

      var doc = document.documentElement;
      var body = document.body;
      var scrollTop = window.pageYOffset || doc.scrollTop || body.scrollTop || 0;
      var scrollHeight = Math.max(doc.scrollHeight, body.scrollHeight) - window.innerHeight;
      var depth = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

      self.recordEvent('scroll', { scrollDepth: depth });
    }

    // Keydown listener — ONLY counts timestamp. ZERO key or character data.
    function onKeyDown(e) {
      self.recordEvent('keypress');
    }

    // View / route switch listener
    function onViewSwitch() {
      self.viewSwitchCount++;
      self.recordEvent('navigate');
    }

    window.addEventListener('click', onClick, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKeyDown, { passive: true });
    window.addEventListener('popstate', onViewSwitch, { passive: true });
    window.addEventListener('hashchange', onViewSwitch, { passive: true });

    this._listeners = [
      { target: window, event: 'click', fn: onClick },
      { target: window, event: 'scroll', fn: onScroll },
      { target: window, event: 'keydown', fn: onKeyDown },
      { target: window, event: 'popstate', fn: onViewSwitch },
      { target: window, event: 'hashchange', fn: onViewSwitch },
    ];
  };

  // ── 8 Window Features Computation ──────────────────────────────────────────
  AdaptiveTracker.prototype.computeFeatures = function () {
    var now = Date.now();
    var cutoff = now - this.windowDurationMs;
    var windowEvents = [];

    for (var i = 0; i < this.eventBuffer.length; i++) {
      if (this.eventBuffer[i].timestamp >= cutoff) {
        windowEvents.push(this.eventBuffer[i]);
      }
    }

    var windowSec = this.windowDurationMs / 1000;
    var minutes = windowSec / 60;

    // 1. Clicks & Repeat clicks
    var clicks = 0;
    var lastClickId = null;
    var lastClickTs = 0;
    var repeatClicks = 0;
    var distinctTargets = {};

    // 2. Scroll speed & max depth
    var scrollEvents = [];
    var maxDepth = this.maxScrollDepthSeen;

    // 3. Key presses
    var keypressCount = 0;

    // 4. Navigate events
    var navigateEvents = 0;

    for (var j = 0; j < windowEvents.length; j++) {
      var evt = windowEvents[j];
      if (evt.type === 'click') {
        clicks++;
        if (evt.elementId) {
          distinctTargets[evt.elementId] = true;
          if (evt.elementId === lastClickId && (evt.timestamp - lastClickTs) <= REPEAT_THRESHOLD_MS) {
            repeatClicks++;
          }
          lastClickId = evt.elementId;
          lastClickTs = evt.timestamp;
        }
      } else if (evt.type === 'scroll') {
        scrollEvents.push(evt);
        if (typeof evt.scrollDepth === 'number' && evt.scrollDepth > maxDepth) {
          maxDepth = evt.scrollDepth;
        }
      } else if (evt.type === 'keypress') {
        keypressCount++;
      } else if (evt.type === 'navigate') {
        navigateEvents++;
      }
    }

    var clicksPerMin = clicks / minutes;
    var uniqueClickRatio = clicks > 0 ? Object.keys(distinctTargets).length / clicks : 0.5;
    var repeatClickRatio = clicks > 0 ? repeatClicks / clicks : 0.0;

    // Scroll speed calculation (pixels/sec or % depth diff/sec)
    var scrollSpeed = 0;
    if (scrollEvents.length >= 2) {
      var firstScroll = scrollEvents[0];
      var lastScroll = scrollEvents[scrollEvents.length - 1];
      var durationS = (lastScroll.timestamp - firstScroll.timestamp) / 1000;
      if (durationS > 0) {
        var diff = Math.abs(lastScroll.scrollDepth - firstScroll.scrollDepth);
        scrollSpeed = (diff / durationS) * 20; // scaled roughly to px/s
      }
    }

    var keyPressesPerMin = keypressCount / minutes;

    // Idle ratio calculation
    var idleRatio = 0.5;
    if (windowEvents.length === 0) {
      idleRatio = 1.0;
    } else {
      var idleMs = 0;
      var prevTs = cutoff;
      for (var k = 0; k < windowEvents.length; k++) {
        var gap = windowEvents[k].timestamp - prevTs;
        if (gap > IDLE_GAP_MS) {
          idleMs += gap;
        }
        prevTs = windowEvents[k].timestamp;
      }
      var endGap = now - prevTs;
      if (endGap > IDLE_GAP_MS) {
        idleMs += endGap;
      }
      idleRatio = clamp(idleMs / this.windowDurationMs, 0, 1);
    }

    // View switches
    var viewSwitchesPerMin = (navigateEvents > 0 ? navigateEvents : this.viewSwitchCount) / minutes;

    return {
      clicks_per_min: round4(clicksPerMin),
      unique_click_ratio: round4(clamp(uniqueClickRatio, 0, 1)),
      repeat_click_ratio: round4(clamp(repeatClickRatio, 0, 1)),
      scroll_speed: round4(scrollSpeed),
      max_scroll_depth: round4(clamp(maxDepth, 0, 100)),
      key_presses_per_min: round4(keyPressesPerMin),
      idle_ratio: round4(clamp(idleRatio, 0, 1)),
      view_switches_per_min: round4(viewSwitchesPerMin),
    };
  };

  // ── Periodic Ingestion & Adapt ───────────────────────────────────────────────
  AdaptiveTracker.prototype.flush = function () {
    if (!this.consent()) return;

    // Skip if paused by Undo
    if (this.isPaused) {
      if (this.pausedUntil && Date.now() < this.pausedUntil) {
        this._log('Adaptation paused until', new Date(this.pausedUntil).toLocaleTimeString());
        return;
      }
      this.isPaused = false;
      this.pausedUntil = null;
    }

    var features = this.computeFeatures();
    var payload = {
      sessionId: this.sessionId,
      features: features,
      featureVector: features,
      sessionStartMs: this.sessionStartMs,
      sessionScrollDepthMax: this.maxScrollDepthSeen,
      viewSwitchCount: this.viewSwitchCount,
      rawEvents: this.eventBuffer.slice(-20), // send last 20 anonymous events
    };

    var self = this;
    var headers = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = 'Bearer ' + this.token;
    }

    if (typeof fetch === 'function') {
      fetch(this.endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(function (data) {
          if (data && data.adaptation) {
            self.applyAdaptation(data.adaptation);
          }
        })
        .catch(function (err) {
          self._log('Telemetry flush warning:', err.message);
        });
    }
  };

  AdaptiveTracker.prototype._startFlushing = function () {
    var self = this;
    this._timer = setInterval(function () {
      self.flush();
    }, this.flushIntervalMs);
  };

  // ── Morphing / Adaptation Applier ───────────────────────────────────────────
  AdaptiveTracker.prototype.applyAdaptation = function (signal) {
    if (!signal) return;

    var newState = signal.state || signal.detectedClass || 'balanced';
    var config = STATE_CONFIGS[newState] || STATE_CONFIGS.balanced;

    this.currentState = newState;
    this.confidence = typeof signal.confidence === 'number' ? signal.confidence : 0.5;
    this.reasons = Array.isArray(signal.reasons) ? signal.reasons : ['Adaptive layout applied'];
    this.changes = Array.isArray(signal.changes) ? signal.changes : ['UI adjusted to interaction cadence'];

    this._log('Applied adaptation state:', newState, 'confidence:', this.confidence);

    // Apply CSS Custom Properties directly to DOM
    if (this.applyCssVariables && this.targetElement) {
      var el = this.targetElement;
      el.setAttribute('data-adaptive-state', newState);
      el.style.setProperty('--adaptive-density', config.density);
      el.style.setProperty('--adaptive-text-scale', String(config.textScale));
      el.style.setProperty('--adaptive-target-size', config.targetSize);
      el.style.setProperty('--adaptive-show-shortcuts', config.showShortcuts ? 'block' : 'none');
      el.style.setProperty('--adaptive-show-help', config.showHelp ? 'block' : 'none');
      el.style.setProperty('--adaptive-show-notes', config.showNotes ? 'block' : 'none');
    }

    if (this._badgeElement) {
      this._updateFloatingBadge();
    }

    if (this.onAdaptation) {
      this.onAdaptation({
        state: newState,
        confidence: this.confidence,
        reasons: this.reasons,
        changes: this.changes,
        config: config,
        rawSignal: signal,
      });
    }
  };

  // ── Undo & Pause Sovereignty ────────────────────────────────────────────────
  AdaptiveTracker.prototype.undo = function (pauseDurationMs) {
    pauseDurationMs = pauseDurationMs || 120000; // 2 minutes default
    this.isPaused = true;
    this.pausedUntil = Date.now() + pauseDurationMs;

    this.applyAdaptation({
      state: 'balanced',
      confidence: 1.0,
      reasons: ['User triggered Undo — manual pause active for 2 minutes'],
      changes: ['Reverted to balanced default layout'],
    });

    this._log('Adaptation undone. Paused for', pauseDurationMs / 1000, 'seconds.');
  };

  AdaptiveTracker.prototype.resume = function () {
    this.isPaused = false;
    this.pausedUntil = null;
    this.flush();
    this._log('Adaptation resumed.');
  };

  // ── Embedded Floating Badge / Widget ────────────────────────────────────────
  AdaptiveTracker.prototype._injectFloatingBadge = function () {
    var badge = document.createElement('div');
    badge.id = 'adaptive-ui-badge';
    badge.style.position = 'fixed';
    badge.style.bottom = '16px';
    badge.style.right = '16px';
    badge.style.zIndex = '99999';
    badge.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    badge.style.fontSize = '12px';
    badge.style.background = '#18181b';
    badge.style.color = '#fafafa';
    badge.style.border = '1px solid #3f3f46';
    badge.style.borderRadius = '12px';
    badge.style.padding = '8px 12px';
    badge.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.3)';
    badge.style.display = 'flex';
    badge.style.alignItems = 'center';
    badge.style.gap = '8px';
    badge.style.transition = 'all 0.2s ease';

    this._badgeElement = badge;
    this._updateFloatingBadge();
    document.body.appendChild(badge);
  };

  AdaptiveTracker.prototype._updateFloatingBadge = function () {
    if (!this._badgeElement) return;

    var badge = this._badgeElement;
    var state = this.currentState;
    var conf = Math.round(this.confidence * 100);

    var stateColors = {
      fast_navigator: '#9333ea',
      reader: '#059669',
      struggling: '#d97706',
      explorer: '#2563eb',
      balanced: '#71717a',
    };

    var color = stateColors[state] || '#71717a';

    badge.innerHTML = [
      '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + color + '"></span>',
      '<span>Adaptive: <strong style="text-transform:capitalize">' + state.replace('_', ' ') + '</strong> (' + conf + '%)</span>',
      '<button id="adaptive-ui-undo-btn" style="background:#27272a;color:#d4d4d8;border:1px solid #52525b;padding:2px 8px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;">Undo</button>',
    ].join('');

    var self = this;
    var undoBtn = badge.querySelector('#adaptive-ui-undo-btn');
    if (undoBtn) {
      undoBtn.onclick = function (e) {
        e.stopPropagation();
        self.undo();
      };
    }
  };

  AdaptiveTracker.prototype.destroy = function () {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    for (var i = 0; i < this._listeners.length; i++) {
      var item = this._listeners[i];
      item.target.removeEventListener(item.event, item.fn);
    }
    this._listeners = [];
    if (this._badgeElement && this._badgeElement.parentNode) {
      this._badgeElement.parentNode.removeChild(this._badgeElement);
      this._badgeElement = null;
    }
  };

  // ── Global Singleton API ────────────────────────────────────────────────────
  var instance = null;

  return {
    init: function (options) {
      if (instance) {
        instance.destroy();
      }
      instance = new AdaptiveTracker(options);
      return instance;
    },
    getInstance: function () {
      return instance;
    },
    undo: function () {
      if (instance) instance.undo();
    },
    resume: function () {
      if (instance) instance.resume();
    },
    computeFeatures: function () {
      return instance ? instance.computeFeatures() : null;
    },
    STATE_CONFIGS: STATE_CONFIGS,
  };
});
