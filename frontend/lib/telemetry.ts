import { useTelemetryStore, TelemetryEvent, TelemetryFeatures } from '../store/telemetryStore';

export const WINDOW_MS = 20_000; // 20-second rolling window
export const REPEAT_THRESHOLD_MS = 1_500; // repeat click on same target within 1.5 s
const IDLE_GAP_MS = 3_000; // gaps > 3 s counted as idle

let clickHandler: ((e: MouseEvent) => void) | null = null;
let scrollHandler: (() => void) | null = null;
let keydownHandler: ((e: KeyboardEvent) => void) | null = null;
let popstateHandler: (() => void) | null = null;
let selectionHandler: (() => void) | null = null;
let isTrackingActive = false;

// Internal rolling buffer of events in memory for fast feature calculation
let rollingEventBuffer: TelemetryEvent[] = [];

// Buffer for rage-click detection (last 5 clicks with timestamp and coordinates)
const recentClicksBuffer: Array<{ x: number; y: number; time: number }> = [];

// Throttling for selectionchange
let lastSelectionTime = 0;

/**
 * Checks whether user consent has been granted.
 */
export function hasConsent(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('telemetry_consent') === 'true';
  } catch {
    return false;
  }
}

/**
 * Sets user consent in localStorage and store, and starts/stops tracking accordingly.
 */
export function setConsent(granted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('telemetry_consent', granted ? 'true' : 'false');
  } catch {
    // Storage unavailable
  }
  useTelemetryStore.getState().setConsent(granted);

  if (granted) {
    startTracking();
  } else {
    stopTracking();
  }
}

/**
 * Starts telemetry listeners if consent is granted.
 */
export function startTracking(): void {
  if (typeof window === 'undefined') return;
  if (!hasConsent()) {
    stopTracking();
    return;
  }
  if (isTrackingActive) return;

  // Track initial route navigation
  recordEvent({
    type: 'navigate',
    route: window.location.pathname,
    timestamp: Date.now(),
  });

  // 1. Click Listener (measures click rate, unique vs repeat clicks, and rage clicks)
  clickHandler = (e: MouseEvent) => {
    const now = Date.now();
    const x = e.clientX;
    const y = e.clientY;

    const target = e.target as HTMLElement | null;
    let elementId = 'unknown';
    if (target) {
      if (target.id) {
        elementId = target.id;
      } else {
        const tag = target.tagName ? target.tagName.toLowerCase() : 'element';
        const className = target.className && typeof target.className === 'string'
          ? '.' + target.className.trim().split(/\s+/).slice(0, 2).join('.')
          : '';
        elementId = `${tag}${className}`;
      }
    }

    recordEvent({
      type: 'click',
      elementId,
      x,
      y,
      timestamp: now,
    });

    // Rage-click detection: 3+ clicks within 50px radius in 800ms
    recentClicksBuffer.push({ x, y, time: now });
    // Keep only last 800ms
    const cutoff = now - 800;
    while (recentClicksBuffer.length > 0 && recentClicksBuffer[0].time < cutoff) {
      recentClicksBuffer.shift();
    }

    if (recentClicksBuffer.length >= 3) {
      const first = recentClicksBuffer[0];
      const allWithin50px = recentClicksBuffer.every(
        (c) => Math.hypot(c.x - first.x, c.y - first.y) <= 50
      );
      if (allWithin50px) {
        recordEvent({
          type: 'rage_click',
          x,
          y,
          timestamp: now,
        });
        recentClicksBuffer.length = 0; // reset buffer after rage click fired
      }
    }
  };

  // 2. Scroll Listener (passive, calculates depth)
  scrollHandler = () => {
    const scrollHeight = document.body.scrollHeight - window.innerHeight;
    const scrollDepth = scrollHeight > 0
      ? Math.min(100, Math.max(0, (window.scrollY / scrollHeight) * 100))
      : 0;

    recordEvent({
      type: 'scroll',
      depth: Math.round(scrollDepth),
      timestamp: Date.now(),
    });
  };

  // 3. Keydown Listener
  // CRITICAL PRIVACY RULE: Never log or store key values, typed text, or personal data.
  // Telemetry is counts and timings only.
  keydownHandler = () => {
    recordEvent({
      type: 'keypress',
      timestamp: Date.now(),
    });
  };

  // 4. Navigation changes
  popstateHandler = () => {
    recordEvent({
      type: 'navigate',
      route: window.location.pathname,
      timestamp: Date.now(),
    });
  };

  // 5. Text Selection Listener (Privacy-First: Never capture selected text!)
  selectionHandler = () => {
    const now = Date.now();
    if (now - lastSelectionTime < 1000) return; // Throttle to 1s
    if (typeof window !== 'undefined' && window.getSelection) {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 3) {
        lastSelectionTime = now;
        recordEvent({
          type: 'text_selection',
          timestamp: now,
        });
      }
    }
  };

  window.addEventListener('click', clickHandler);
  window.addEventListener('scroll', scrollHandler, { passive: true });
  window.addEventListener('keydown', keydownHandler, { passive: true });
  window.addEventListener('popstate', popstateHandler);
  document.addEventListener('selectionchange', selectionHandler);

  isTrackingActive = true;
}

/**
 * Stops telemetry tracking and removes all listeners.
 */
export function stopTracking(): void {
  if (typeof window === 'undefined') return;

  if (clickHandler) {
    window.removeEventListener('click', clickHandler);
    clickHandler = null;
  }
  if (scrollHandler) {
    window.removeEventListener('scroll', scrollHandler);
    scrollHandler = null;
  }
  if (keydownHandler) {
    window.removeEventListener('keydown', keydownHandler);
    keydownHandler = null;
  }
  if (popstateHandler) {
    window.removeEventListener('popstate', popstateHandler);
    popstateHandler = null;
  }
  if (selectionHandler) {
    document.removeEventListener('selectionchange', selectionHandler);
    selectionHandler = null;
  }

  rollingEventBuffer = [];
  recentClicksBuffer.length = 0;
  useTelemetryStore.getState().clearEvents();
  isTrackingActive = false;
}

/**
 * Helper to record a custom view or filter switch.
 */
export function trackViewSwitch(viewName?: string): void {
  if (!hasConsent()) return;
  recordEvent({
    type: 'view_switch',
    route: viewName || (typeof window !== 'undefined' ? window.location.pathname : ''),
    timestamp: Date.now(),
  });
}

/**
 * Helper to record article/card dwell time in milliseconds.
 */
export function trackDwell(elementId: string, dwellMs: number): void {
  if (!hasConsent()) return;
  recordEvent({
    type: 'dwell',
    elementId,
    dwellMs,
    timestamp: Date.now(),
  });
}

function getTs(ts: number | Date | string | undefined): number {
  if (typeof ts === 'number') return ts;
  if (ts instanceof Date) return ts.getTime();
  return Date.now();
}

/**
 * Internal helper to record an event into both the store and rolling buffer.
 */
function recordEvent(event: TelemetryEvent): void {
  if (!hasConsent()) return;

  // Append to rolling buffer and prune events older than WINDOW_MS
  const now = Date.now();
  const normalizedEvent: TelemetryEvent = { ...event, timestamp: getTs(event.timestamp) };
  rollingEventBuffer.push(normalizedEvent);
  const cutoff = now - WINDOW_MS;
  rollingEventBuffer = rollingEventBuffer.filter((e) => getTs(e.timestamp) >= cutoff);

  // Also add to Zustand store
  useTelemetryStore.getState().addEvent(normalizedEvent);
}

/**
 * Computes the 8 behavioural features over the rolling 20-second window.
 */
export function computeRollingFeatures(): TelemetryFeatures {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const store = useTelemetryStore.getState();

  // Prune rolling buffer
  rollingEventBuffer = rollingEventBuffer.filter((e) => getTs(e.timestamp) >= windowStart);

  const windowEvents = rollingEventBuffer;
  const windowMinutes = (WINDOW_MS / 1000) / 60; // 20s / 60 = 1/3 minute

  // 1. Clicks & click ratios
  const clickEvents = windowEvents.filter((e) => e.type === 'click');
  const totalClicks = clickEvents.length;
  const clicks_per_min = totalClicks / windowMinutes;

  const uniqueTargets = new Set(clickEvents.map((e) => e.elementId || 'unknown'));
  const unique_click_ratio = totalClicks > 0 ? clamp(uniqueTargets.size / totalClicks, 0, 1) : 0.5;

  // Repeat clicks: same elementId within REPEAT_THRESHOLD_MS or rage clicks
  let repeatCount = 0;
  const sortedClicks = [...clickEvents].sort((a, b) => getTs(a.timestamp) - getTs(b.timestamp));
  for (let i = 1; i < sortedClicks.length; i++) {
    const prev = sortedClicks[i - 1];
    const curr = sortedClicks[i];
    const sameTarget = (prev.elementId || 'unknown') === (curr.elementId || 'unknown');
    if (sameTarget && (getTs(curr.timestamp) - getTs(prev.timestamp)) <= REPEAT_THRESHOLD_MS) {
      repeatCount++;
    }
  }
  const rageClicks = windowEvents.filter((e) => e.type === 'rage_click').length;
  const repeat_click_ratio = totalClicks > 0 ? clamp((repeatCount + rageClicks * 2) / totalClicks, 0, 1) : (rageClicks > 0 ? 0.8 : 0);

  // 2. Scroll features
  const scrollEvents = windowEvents.filter((e) => e.type === 'scroll');
  const depths = scrollEvents.map((e) => (typeof e.depth === 'number' ? e.depth : 0));
  const maxDepthInWindow = depths.length > 0 ? Math.max(...depths) : 0;
  const max_scroll_depth = Math.max(maxDepthInWindow, store.lastKnownScrollDepth, store.maxScrollDepth);

  let scroll_speed = 0;
  if (scrollEvents.length >= 2) {
    const sorted = [...scrollEvents].sort((a, b) => getTs(a.timestamp) - getTs(b.timestamp));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const dt = (getTs(last.timestamp) - getTs(first.timestamp)) / 1000;
    const dDepth = Math.abs((last.depth || 0) - (first.depth || 0));
    if (dt > 0) {
      scroll_speed = clamp(dDepth / dt / 100, 0, 1);
    }
  }

  // 3. Key presses (count only, never key values)
  const keyEvents = windowEvents.filter((e) => e.type === 'keypress');
  const key_presses_per_min = keyEvents.length / windowMinutes;

  // 4. Idle ratio
  const allTimestamps = windowEvents.map((e) => getTs(e.timestamp)).sort((a, b) => a - b);
  let idleMs = 0;
  if (allTimestamps.length === 0) {
    idleMs = WINDOW_MS;
  } else {
    const firstGap = allTimestamps[0] - windowStart;
    if (firstGap > IDLE_GAP_MS) idleMs += firstGap;

    for (let i = 1; i < allTimestamps.length; i++) {
      const gap = allTimestamps[i] - allTimestamps[i - 1];
      if (gap > IDLE_GAP_MS) idleMs += gap;
    }

    const lastGap = now - allTimestamps[allTimestamps.length - 1];
    if (lastGap > IDLE_GAP_MS) idleMs += lastGap;
  }
  const idle_ratio = clamp(idleMs / WINDOW_MS, 0, 1);

  // 5. View switches
  const navInWindow = windowEvents.filter((e) => e.type === 'navigate' || e.type === 'view_switch').length;
  const sessionDurationS = store.getSessionDuration();
  const sessionRate = sessionDurationS > 0
    ? store.cumulativeNavigationDepth / (sessionDurationS / 60)
    : 0;
  const view_switches_per_min = navInWindow > 0 ? navInWindow / windowMinutes : sessionRate;

  // Micro-interaction summaries
  const textSelections = windowEvents.filter((e) => e.type === 'text_selection').length;
  const dwellEvents = windowEvents.filter((e) => e.type === 'dwell');
  const meanDwellSeconds = dwellEvents.length > 0
    ? dwellEvents.reduce((acc, e) => acc + (e.dwellMs || 0), 0) / dwellEvents.length / 1000
    : 0;

  return {
    clicks_per_min: round4(clicks_per_min),
    unique_click_ratio: round4(unique_click_ratio),
    repeat_click_ratio: round4(repeat_click_ratio),
    scroll_speed: round4(scroll_speed),
    max_scroll_depth: round4(max_scroll_depth),
    key_presses_per_min: round4(key_presses_per_min),
    idle_ratio: round4(idle_ratio),
    view_switches_per_min: round4(view_switches_per_min),
    text_selections_count: textSelections,
    rage_click_count: rageClicks,
    mean_dwell_seconds: round4(meanDwellSeconds),
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function round4(v: number): number {
  return Math.round(v * 10000) / 10000;
}
