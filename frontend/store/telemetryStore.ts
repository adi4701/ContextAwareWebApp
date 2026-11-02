import { create } from 'zustand';

export interface TelemetryEvent {
  type: 'click' | 'scroll' | 'keypress' | 'navigate' | 'view_switch' | 'text_selection' | 'rage_click' | 'dwell' | string;
  timestamp: number | Date; // epoch ms or Date
  elementId?: string;
  depth?: number;
  route?: string;
  x?: number;
  y?: number;
  dwellMs?: number;
}

export interface TelemetryFeatures {
  clicks_per_min: number;
  unique_click_ratio: number;
  repeat_click_ratio: number;
  scroll_speed: number;
  max_scroll_depth: number;
  key_presses_per_min: number;
  idle_ratio: number;
  view_switches_per_min: number;
  // Extended v2.0 micro-signals (optional for ML vector, informative for HUD)
  text_selections_count?: number;
  rage_click_count?: number;
  mean_dwell_seconds?: number;
}

export interface TelemetryState {
  events: TelemetryEvent[];
  sessionId: string;
  sessionStart: Date;
  cumulativeClicks: number;
  cumulativeKeypresses: number;
  uniqueElementsSet: Set<string>;
  lastKnownScrollDepth: number;
  maxScrollDepth: number;
  cumulativeNavigationDepth: number;
  consentGiven: boolean;

  // Micro-interaction counters for ContextPulse
  textSelectionsCount: number;
  rageClickCount: number;
  totalDwellMs: number;
  dwellEventsCount: number;

  setConsent: (consent: boolean) => void;
  addEvent: (event: Omit<TelemetryEvent, 'timestamp'> & { timestamp?: number | Date }) => void;
  trackViewSwitch: (viewName?: string) => void;
  trackTextSelection: () => void;
  trackRageClick: (x: number, y: number) => void;
  trackDwell: (elementId: string, dwellMs: number) => void;
  flushAndGetBuffer: () => TelemetryEvent[];
  clearEvents: () => void;
  getSessionDuration: () => number;
}

const getInitialSessionId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch {
      // Fallback
    }
  }
  return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
};

const getInitialConsent = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const val = localStorage.getItem('telemetry_consent');
    return val === 'true';
  } catch {
    return false;
  }
};

export const useTelemetryStore = create<TelemetryState>((set, get) => ({
  events: [],
  sessionId: getInitialSessionId(),
  sessionStart: new Date(),
  cumulativeClicks: 0,
  cumulativeKeypresses: 0,
  uniqueElementsSet: new Set<string>(),
  lastKnownScrollDepth: 0,
  maxScrollDepth: 0,
  cumulativeNavigationDepth: 1,
  consentGiven: getInitialConsent(),

  textSelectionsCount: 0,
  rageClickCount: 0,
  totalDwellMs: 0,
  dwellEventsCount: 0,

  setConsent: (consent: boolean) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('telemetry_consent', consent ? 'true' : 'false');
      } catch {
        // Storage unavailable
      }
    }
    set({
      consentGiven: consent,
      // If turning off, clear buffered events immediately
      ...(consent ? {} : { events: [] }),
    });
  },

  addEvent: (event) => {
    // If no consent, NEVER record anything
    if (!get().consentGiven) return;

    const timestamp = event.timestamp ?? Date.now();
    const fullEvent: TelemetryEvent = { ...event, timestamp };

    set((state) => {
      const nextClicks = event.type === 'click' ? state.cumulativeClicks + 1 : state.cumulativeClicks;
      const nextKeypresses = event.type === 'keypress' ? state.cumulativeKeypresses + 1 : state.cumulativeKeypresses;
      const nextUnique = new Set(state.uniqueElementsSet);
      if (event.type === 'click' && event.elementId) {
        nextUnique.add(event.elementId);
      }
      const scrollDepth = event.type === 'scroll' && typeof event.depth === 'number'
        ? event.depth
        : state.lastKnownScrollDepth;
      const nextMaxScroll = Math.max(state.maxScrollDepth, scrollDepth);

      const nextNav = (event.type === 'navigate' || event.type === 'view_switch')
        ? state.cumulativeNavigationDepth + 1
        : state.cumulativeNavigationDepth;

      const nextSelections = event.type === 'text_selection' ? state.textSelectionsCount + 1 : state.textSelectionsCount;
      const nextRage = event.type === 'rage_click' ? state.rageClickCount + 1 : state.rageClickCount;
      const nextDwellMs = event.type === 'dwell' && typeof event.dwellMs === 'number'
        ? state.totalDwellMs + event.dwellMs
        : state.totalDwellMs;
      const nextDwellCount = event.type === 'dwell' ? state.dwellEventsCount + 1 : state.dwellEventsCount;

      return {
        events: [...state.events, fullEvent],
        cumulativeClicks: nextClicks,
        cumulativeKeypresses: nextKeypresses,
        uniqueElementsSet: nextUnique,
        lastKnownScrollDepth: scrollDepth,
        maxScrollDepth: nextMaxScroll,
        cumulativeNavigationDepth: nextNav,
        textSelectionsCount: nextSelections,
        rageClickCount: nextRage,
        totalDwellMs: nextDwellMs,
        dwellEventsCount: nextDwellCount,
      };
    });
  },

  trackViewSwitch: (viewName) => {
    if (!get().consentGiven) return;
    get().addEvent({
      type: 'view_switch',
      route: viewName || (typeof window !== 'undefined' ? window.location.pathname : ''),
    });
  },

  trackTextSelection: () => {
    if (!get().consentGiven) return;
    // CRITICAL PRIVACY RULE: Never log the selected text! Count only.
    get().addEvent({
      type: 'text_selection',
    });
  },

  trackRageClick: (x: number, y: number) => {
    if (!get().consentGiven) return;
    get().addEvent({
      type: 'rage_click',
      x,
      y,
    });
  },

  trackDwell: (elementId: string, dwellMs: number) => {
    if (!get().consentGiven) return;
    get().addEvent({
      type: 'dwell',
      elementId,
      dwellMs,
    });
  },

  flushAndGetBuffer: () => {
    const currentEvents = get().events;
    set({ events: [] });
    return currentEvents;
  },

  clearEvents: () => {
    set({ events: [] });
  },

  getSessionDuration: () => {
    const startTime = get().sessionStart.getTime();
    return Math.max(0, (Date.now() - startTime) / 1000);
  },
}));
