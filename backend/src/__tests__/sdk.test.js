'use strict';

/**
 * __tests__/sdk.test.js
 *
 * Unit tests for the standalone AdaptiveUI browser SDK.
 */

const AdaptiveUI = require('../../../sdk/adaptive-ui');

describe('AdaptiveUI Standalone SDK', () => {
  let tracker;

  beforeEach(() => {
    tracker = AdaptiveUI.init({
      endpoint: 'http://localhost:5000/api/telemetry',
      flushIntervalMs: 60000, // don't auto-flush in tests
      applyCssVariables: false, // test environment has no real DOM layout engine
      showFloatingBadge: false,
      debug: false,
    });
  });

  afterEach(() => {
    if (tracker) {
      tracker.destroy();
    }
  });

  test('AdaptiveUI.init returns a valid tracker instance', () => {
    expect(tracker).toBeDefined();
    expect(tracker.currentState).toBe('balanced');
    expect(typeof tracker.computeFeatures).toBe('function');
  });

  test('computeFeatures returns all 8 required window features', () => {
    const features = tracker.computeFeatures();
    const expectedKeys = [
      'clicks_per_min',
      'unique_click_ratio',
      'repeat_click_ratio',
      'scroll_speed',
      'max_scroll_depth',
      'key_presses_per_min',
      'idle_ratio',
      'view_switches_per_min',
    ];

    for (const key of expectedKeys) {
      expect(features).toHaveProperty(key);
      expect(typeof features[key]).toBe('number');
      expect(Number.isFinite(features[key])).toBe(true);
    }
  });

  test('recordEvent detects repeat clicks on the same element within threshold', () => {
    // 1st click
    tracker.recordEvent('click', { elementId: 'save-btn' });
    // 2nd click immediately on same element
    tracker.recordEvent('click', { elementId: 'save-btn' });

    const f = tracker.computeFeatures();
    expect(f.clicks_per_min).toBeGreaterThan(0);
    expect(f.repeat_click_ratio).toBeGreaterThan(0);
  });

  test('keypress event counts frequency without storing typed key values', () => {
    tracker.recordEvent('keypress');
    tracker.recordEvent('keypress');
    tracker.recordEvent('keypress');

    const f = tracker.computeFeatures();
    expect(f.key_presses_per_min).toBeGreaterThan(0);

    // Verify buffer has zero key values
    for (const evt of tracker.eventBuffer) {
      expect(evt.key).toBeUndefined();
      expect(evt.keyValue).toBeUndefined();
      expect(evt.text).toBeUndefined();
    }
  });

  test('applyAdaptation updates state, reasons, and invokes callback', () => {
    let callbackSignal = null;
    tracker.onAdaptation = (sig) => {
      callbackSignal = sig;
    };

    tracker.applyAdaptation({
      state: 'fast_navigator',
      confidence: 0.95,
      reasons: ['Fast shortcut velocity'],
      changes: ['Compact rows'],
    });

    expect(tracker.currentState).toBe('fast_navigator');
    expect(tracker.confidence).toBe(0.95);
    expect(callbackSignal).not.toBeNull();
    expect(callbackSignal.state).toBe('fast_navigator');
  });

  test('undo reverts state to balanced and initiates pause window', () => {
    tracker.applyAdaptation({ state: 'reader', confidence: 0.9 });
    expect(tracker.currentState).toBe('reader');

    tracker.undo(60000); // 1 minute pause
    expect(tracker.currentState).toBe('balanced');
    expect(tracker.isPaused).toBe(true);
    expect(tracker.pausedUntil).toBeGreaterThan(Date.now());
  });

  test('STATE_CONFIGS contains all 5 canonical states', () => {
    const states = ['fast_navigator', 'reader', 'struggling', 'explorer', 'balanced'];
    for (const s of states) {
      expect(AdaptiveUI.STATE_CONFIGS[s]).toBeDefined();
      expect(AdaptiveUI.STATE_CONFIGS[s]).toHaveProperty('density');
      expect(AdaptiveUI.STATE_CONFIGS[s]).toHaveProperty('textScale');
      expect(AdaptiveUI.STATE_CONFIGS[s]).toHaveProperty('targetSize');
    }
  });
});
