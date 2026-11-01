'use strict';
/**
 * features.js
 * Computes the 8 behavioural window features used by the ML service.
 *
 * All inputs are raw event arrays or pre-aggregated counters.
 * KEY VALUES ARE NEVER STORED OR LOGGED — only counts and timings.
 *
 * Window: the last WINDOW_MS milliseconds of raw events (default 20 s).
 */

const WINDOW_MS = 20_000; // 20-second rolling window
const REPEAT_THRESHOLD_MS = 1_500; // same target within 1.5 s = repeat click
const MIN_WINDOW_S = 1; // avoid division-by-zero for very short windows

/**
 * computeFeatures(rawEvents, extras) → FeatureVector
 *
 * @param {Array<{type:string, timestamp:number|string, elementId?:string,
 *                depth?:number, x?:number, y?:number, key?:boolean}>} rawEvents
 *   Event objects from the telemetry buffer.
 *   timestamp must be a JS epoch ms number or ISO string.
 *   key values must NOT be present (only key_press count events are accepted).
 *
 * @param {object} extras  Pre-aggregated values from the frontend store
 * @param {number} [extras.sessionScrollDepthMax=0]  Max scroll depth seen this session (0-100)
 * @param {number} [extras.viewSwitchCount=0]        Total route/filter changes since session start
 * @param {number} [extras.sessionStartMs]           Session start epoch ms (for idle computation)
 *
 * @returns {{
 *   clicks_per_min: number,
 *   unique_click_ratio: number,
 *   repeat_click_ratio: number,
 *   scroll_speed: number,
 *   max_scroll_depth: number,
 *   key_presses_per_min: number,
 *   idle_ratio: number,
 *   view_switches_per_min: number
 * }}
 */
function computeFeatures(rawEvents = [], extras = {}) {
  const {
    sessionScrollDepthMax = 0,
    viewSwitchCount = 0,
    sessionStartMs = Date.now(),
  } = extras;

  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  // ── Filter to the rolling window ─────────────────────────────────────────
  const windowEvents = rawEvents.filter((e) => {
    const ts = typeof e.timestamp === 'string' ? Date.parse(e.timestamp) : (e.timestamp || 0);
    return ts >= windowStart;
  });

  const windowSeconds = Math.max(MIN_WINDOW_S, WINDOW_MS / 1000);
  const windowMinutes = windowSeconds / 60;

  // ── Clicks ────────────────────────────────────────────────────────────────
  const clickEvents = windowEvents.filter((e) => e.type === 'click');
  const totalClicks = clickEvents.length;
  const clicks_per_min = totalClicks / windowMinutes;

  // Unique targets
  const uniqueTargets = new Set(clickEvents.map((e) => e.elementId || 'unknown'));
  const uniqueCount = uniqueTargets.size;

  // Repeat clicks: same elementId as the immediately preceding click within REPEAT_THRESHOLD_MS
  let repeatCount = 0;
  const sortedClicks = [...clickEvents].sort((a, b) => {
    const ta = typeof a.timestamp === 'string' ? Date.parse(a.timestamp) : (a.timestamp || 0);
    const tb = typeof b.timestamp === 'string' ? Date.parse(b.timestamp) : (b.timestamp || 0);
    return ta - tb;
  });

  for (let i = 1; i < sortedClicks.length; i++) {
    const prev = sortedClicks[i - 1];
    const curr = sortedClicks[i];
    const tPrev = typeof prev.timestamp === 'string' ? Date.parse(prev.timestamp) : (prev.timestamp || 0);
    const tCurr = typeof curr.timestamp === 'string' ? Date.parse(curr.timestamp) : (curr.timestamp || 0);
    const sameTarget = (prev.elementId || 'unknown') === (curr.elementId || 'unknown');
    if (sameTarget && (tCurr - tPrev) <= REPEAT_THRESHOLD_MS) {
      repeatCount++;
    }
  }

  const unique_click_ratio = totalClicks > 0 ? clamp(uniqueCount / totalClicks, 0, 1) : 0.5;
  const repeat_click_ratio = totalClicks > 0 ? clamp(repeatCount / totalClicks, 0, 1) : 0;

  // ── Scroll ────────────────────────────────────────────────────────────────
  const scrollEvents = windowEvents.filter((e) => e.type === 'scroll');
  const scrollDepths = scrollEvents.map((e) => (typeof e.depth === 'number' ? e.depth : 0));

  const maxDepthInWindow = scrollDepths.length > 0 ? Math.max(...scrollDepths) : 0;
  const max_scroll_depth = Math.max(maxDepthInWindow, sessionScrollDepthMax);

  // Scroll speed: change in depth per second within the window
  let scroll_speed = 0;
  if (scrollEvents.length >= 2) {
    const sorted = [...scrollEvents].sort((a, b) => {
      const ta = typeof a.timestamp === 'string' ? Date.parse(a.timestamp) : (a.timestamp || 0);
      const tb = typeof b.timestamp === 'string' ? Date.parse(b.timestamp) : (b.timestamp || 0);
      return ta - tb;
    });
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const dt = ((typeof last.timestamp === 'string' ? Date.parse(last.timestamp) : (last.timestamp || 0))
              - (typeof first.timestamp === 'string' ? Date.parse(first.timestamp) : (first.timestamp || 0))) / 1000;
    const dDepth = Math.abs((last.depth || 0) - (first.depth || 0));
    if (dt > 0) {
      // Normalise: max realistic scroll speed ~100 depth-units/s → cap at 1
      scroll_speed = clamp(dDepth / dt / 100, 0, 1);
    }
  }

  // ── Key presses (count only, never values) ─────────────────────────────────
  const keyEvents = windowEvents.filter((e) => e.type === 'keypress');
  const key_presses_per_min = keyEvents.length / windowMinutes;

  // ── Idle ratio ────────────────────────────────────────────────────────────
  // Idle = time in the window with no events. Approximate with inter-event gaps.
  const allTimes = windowEvents
    .map((e) => (typeof e.timestamp === 'string' ? Date.parse(e.timestamp) : (e.timestamp || 0)))
    .filter((t) => t >= windowStart)
    .sort((a, b) => a - b);

  let idleMs = 0;
  const IDLE_GAP_MS = 3000; // gaps > 3 s count as idle

  if (allTimes.length === 0) {
    // No events at all — fully idle
    idleMs = WINDOW_MS;
  } else {
    // Gap before first event
    const firstGap = allTimes[0] - windowStart;
    if (firstGap > IDLE_GAP_MS) idleMs += firstGap;

    // Inter-event gaps
    for (let i = 1; i < allTimes.length; i++) {
      const gap = allTimes[i] - allTimes[i - 1];
      if (gap > IDLE_GAP_MS) idleMs += gap;
    }

    // Gap after last event
    const lastGap = now - allTimes[allTimes.length - 1];
    if (lastGap > IDLE_GAP_MS) idleMs += lastGap;
  }

  const idle_ratio = clamp(idleMs / WINDOW_MS, 0, 1);

  // ── View switches ─────────────────────────────────────────────────────────
  // Count navigate events in the window + add a proportional slice of session switches
  const navigateInWindow = windowEvents.filter((e) => e.type === 'navigate').length;
  // Combine window-level count with a rate from session total
  const sessionDurationS = Math.max(1, (now - sessionStartMs) / 1000);
  const sessionRate = viewSwitchCount / (sessionDurationS / 60); // per minute
  // Use window count if available, else fall back to session rate
  const view_switches_per_min = navigateInWindow > 0
    ? navigateInWindow / windowMinutes
    : sessionRate;

  return {
    clicks_per_min:       round4(clicks_per_min),
    unique_click_ratio:   round4(unique_click_ratio),
    repeat_click_ratio:   round4(repeat_click_ratio),
    scroll_speed:         round4(scroll_speed),
    max_scroll_depth:     round4(max_scroll_depth),
    key_presses_per_min:  round4(key_presses_per_min),
    idle_ratio:           round4(idle_ratio),
    view_switches_per_min: round4(view_switches_per_min),
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function round4(v) {
  return Math.round(v * 10000) / 10000;
}

module.exports = { computeFeatures, WINDOW_MS, REPEAT_THRESHOLD_MS };
