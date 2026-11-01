'use strict';
/**
 * __tests__/features.test.js
 * Jest unit tests for backend/src/utils/features.js
 *
 * Run: cd backend && npx jest
 */

const { computeFeatures, WINDOW_MS, REPEAT_THRESHOLD_MS } = require('../features');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Build a synthetic event at (now - offsetMs) from now.
 */
function ev(type, offsetMs = 0, extra = {}) {
  return { type, timestamp: Date.now() - offsetMs, ...extra };
}

// ── Basic structure ───────────────────────────────────────────────────────────

describe('computeFeatures — return shape', () => {
  test('returns all 8 feature keys with no events', () => {
    const f = computeFeatures([], {});
    const keys = [
      'clicks_per_min', 'unique_click_ratio', 'repeat_click_ratio',
      'scroll_speed', 'max_scroll_depth', 'key_presses_per_min',
      'idle_ratio', 'view_switches_per_min',
    ];
    keys.forEach((k) => expect(f).toHaveProperty(k));
  });

  test('all values are finite numbers', () => {
    const f = computeFeatures([], {});
    Object.values(f).forEach((v) => {
      expect(typeof v).toBe('number');
      expect(isFinite(v)).toBe(true);
    });
  });

  test('ratios are clamped to [0, 1]', () => {
    const events = [
      ev('click', 1000, { elementId: 'a' }),
      ev('click', 500,  { elementId: 'a' }), // repeat
    ];
    const f = computeFeatures(events, {});
    expect(f.unique_click_ratio).toBeGreaterThanOrEqual(0);
    expect(f.unique_click_ratio).toBeLessThanOrEqual(1);
    expect(f.repeat_click_ratio).toBeGreaterThanOrEqual(0);
    expect(f.repeat_click_ratio).toBeLessThanOrEqual(1);
    expect(f.idle_ratio).toBeGreaterThanOrEqual(0);
    expect(f.idle_ratio).toBeLessThanOrEqual(1);
    expect(f.scroll_speed).toBeGreaterThanOrEqual(0);
    expect(f.scroll_speed).toBeLessThanOrEqual(1);
  });
});

// ── Clicks ────────────────────────────────────────────────────────────────────

describe('computeFeatures — click features', () => {
  test('clicks_per_min is positive for click events in window', () => {
    const events = [
      ev('click', 1000, { elementId: 'btn-a' }),
      ev('click', 2000, { elementId: 'btn-b' }),
      ev('click', 3000, { elementId: 'btn-c' }),
    ];
    const f = computeFeatures(events, {});
    expect(f.clicks_per_min).toBeGreaterThan(0);
  });

  test('clicks outside the window are excluded', () => {
    const old = ev('click', WINDOW_MS + 5000, { elementId: 'x' }); // outside
    const recent = ev('click', 1000, { elementId: 'y' });           // inside
    const f = computeFeatures([old, recent], {});
    // Only 1 click in window → clicks_per_min = 1 / (20/60) = 3
    expect(f.clicks_per_min).toBeCloseTo(3, 0);
  });

  test('unique_click_ratio = 1 when all clicks are on different elements', () => {
    const events = [
      ev('click', 1000, { elementId: 'a' }),
      ev('click', 2000, { elementId: 'b' }),
      ev('click', 3000, { elementId: 'c' }),
    ];
    const f = computeFeatures(events, {});
    expect(f.unique_click_ratio).toBe(1);
  });

  test('repeat_click_ratio > 0 when same target clicked twice within threshold', () => {
    const now = Date.now();
    const events = [
      { type: 'click', timestamp: now - 500, elementId: 'btn' },
      { type: 'click', timestamp: now - 200, elementId: 'btn' }, // repeat within 1.5s
    ];
    const f = computeFeatures(events, {});
    expect(f.repeat_click_ratio).toBeGreaterThan(0);
  });

  test('repeat_click_ratio = 0 when same target clicked after threshold', () => {
    const now = Date.now();
    const events = [
      { type: 'click', timestamp: now - 5000, elementId: 'btn' },
      { type: 'click', timestamp: now - 500,  elementId: 'btn' }, // same but > 1.5s apart
    ];
    const f = computeFeatures(events, {});
    expect(f.repeat_click_ratio).toBe(0);
  });

  test('no clicks → clicks_per_min = 0, unique_click_ratio = 0.5 (neutral)', () => {
    const f = computeFeatures([], {});
    expect(f.clicks_per_min).toBe(0);
    expect(f.unique_click_ratio).toBe(0.5);
    expect(f.repeat_click_ratio).toBe(0);
  });
});

// ── Scroll ────────────────────────────────────────────────────────────────────

describe('computeFeatures — scroll features', () => {
  test('max_scroll_depth uses the maximum depth seen', () => {
    const events = [
      ev('scroll', 5000, { depth: 20 }),
      ev('scroll', 3000, { depth: 75 }),
      ev('scroll', 1000, { depth: 45 }),
    ];
    const f = computeFeatures(events, {});
    expect(f.max_scroll_depth).toBe(75);
  });

  test('max_scroll_depth falls back to sessionScrollDepthMax when no window events', () => {
    const f = computeFeatures([], { sessionScrollDepthMax: 60 });
    expect(f.max_scroll_depth).toBe(60);
  });

  test('max_scroll_depth is max of window events and sessionScrollDepthMax', () => {
    const events = [ev('scroll', 1000, { depth: 40 })];
    const f = computeFeatures(events, { sessionScrollDepthMax: 80 });
    expect(f.max_scroll_depth).toBe(80);
  });

  test('scroll_speed > 0 when depth changes across multiple scroll events', () => {
    const now = Date.now();
    const events = [
      { type: 'scroll', timestamp: now - 4000, depth: 10 },
      { type: 'scroll', timestamp: now - 2000, depth: 60 },
    ];
    const f = computeFeatures(events, {});
    expect(f.scroll_speed).toBeGreaterThan(0);
  });

  test('scroll_speed = 0 with fewer than 2 scroll events', () => {
    const events = [ev('scroll', 1000, { depth: 50 })];
    const f = computeFeatures(events, {});
    expect(f.scroll_speed).toBe(0);
  });
});

// ── Key presses ───────────────────────────────────────────────────────────────

describe('computeFeatures — key press features', () => {
  test('key_presses_per_min > 0 for keypress events', () => {
    const events = [
      ev('keypress', 1000),
      ev('keypress', 2000),
      ev('keypress', 3000),
    ];
    const f = computeFeatures(events, {});
    expect(f.key_presses_per_min).toBeGreaterThan(0);
  });

  test('keypress events carry no key value field', () => {
    // Verify our test events don't have a "key" field (privacy rule)
    const events = [ev('keypress', 500)];
    events.forEach((e) => expect(e).not.toHaveProperty('key'));
  });

  test('key_presses_per_min = 0 when no keypress events', () => {
    const f = computeFeatures([ev('click', 500, { elementId: 'x' })], {});
    expect(f.key_presses_per_min).toBe(0);
  });
});

// ── Idle ─────────────────────────────────────────────────────────────────────

describe('computeFeatures — idle ratio', () => {
  test('idle_ratio = 1 when no events at all', () => {
    const f = computeFeatures([], {});
    expect(f.idle_ratio).toBe(1);
  });

  test('idle_ratio < 1 when events are distributed across the window', () => {
    const events = Array.from({ length: 10 }, (_, i) =>
      ev('click', i * 1500, { elementId: `e${i}` })
    );
    const f = computeFeatures(events, {});
    expect(f.idle_ratio).toBeLessThan(1);
  });
});

// ── View switches ─────────────────────────────────────────────────────────────

describe('computeFeatures — view switches', () => {
  test('view_switches_per_min > 0 when navigate events in window', () => {
    const events = [
      ev('navigate', 5000, { route: '/a' }),
      ev('navigate', 3000, { route: '/b' }),
    ];
    const f = computeFeatures(events, {});
    expect(f.view_switches_per_min).toBeGreaterThan(0);
  });

  test('falls back to session rate when no navigate events in window', () => {
    const f = computeFeatures([], {
      viewSwitchCount: 6,
      sessionStartMs: Date.now() - 60_000, // 1 minute ago → 6/min
    });
    expect(f.view_switches_per_min).toBeCloseTo(6, 0);
  });

  test('view_switches_per_min = 0 with no session switches and no window navigates', () => {
    const f = computeFeatures([], { viewSwitchCount: 0, sessionStartMs: Date.now() - 30_000 });
    expect(f.view_switches_per_min).toBe(0);
  });
});

// ── Edge cases ────────────────────────────────────────────────────────────────

describe('computeFeatures — edge cases', () => {
  test('handles ISO string timestamps correctly', () => {
    const now = new Date();
    const events = [{ type: 'click', timestamp: new Date(Date.now() - 1000).toISOString(), elementId: 'a' }];
    const f = computeFeatures(events, {});
    expect(f.clicks_per_min).toBeGreaterThan(0);
  });

  test('handles missing elementId gracefully', () => {
    const events = [ev('click', 500), ev('click', 300)]; // no elementId
    expect(() => computeFeatures(events, {})).not.toThrow();
  });

  test('handles empty rawEvents array', () => {
    expect(() => computeFeatures([], {})).not.toThrow();
  });

  test('handles very large event arrays without error', () => {
    const events = Array.from({ length: 500 }, (_, i) =>
      ev('click', i * 30, { elementId: `e${i % 20}` })
    );
    expect(() => computeFeatures(events, {})).not.toThrow();
  });

  test('values are rounded to 4 decimal places', () => {
    const events = [ev('click', 1000, { elementId: 'a' })];
    const f = computeFeatures(events, {});
    Object.entries(f).forEach(([k, v]) => {
      const rounded = Math.round(v * 10000) / 10000;
      expect(v).toBe(rounded);
    });
  });
});
