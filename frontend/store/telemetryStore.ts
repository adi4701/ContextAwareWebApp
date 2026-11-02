import { create } from 'zustand';

export interface TelemetryEvent {
  type: string;
  timestamp?: Date | string | number;
  elementId?: string;
  depth?: number;
  route?: string;
  x?: number;
  y?: number;
  dwellMs?: number;
  [key: string]: any;
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
  scrollDepthSum: number;
  scrollSampleCount: number;
  cumulativeNavigationDepth: number;
  trackingEnabled: boolean;
  consentGiven: boolean;

  // Micro-interaction counters
  textSelectionsCount: number;
  rageClickCount: number;
  totalDwellMs: number;
  dwellEventsCount: number;

  addEvent: (event: TelemetryEvent) => void;
  clearEventsCount: (count: number) => void;
  flushAndGetBuffer: () => TelemetryEvent[];
  clearEvents: () => void;
  getSessionDuration: () => number;
  setTrackingEnabled: (enabled: boolean) => void;
  setConsent: (consent: boolean) => void;
  trackViewSwitch: (viewName?: string) => void;
  trackTextSelection: () => void;
  trackRageClick: (x: number, y: number) => void;
  trackDwell: (elementId: string, dwellMs: number) => void;
  applySimulationPreset: (preset: {
    clicks: number;
    uniqueClicks: number;
    scrollDepth: number;
    navDepth: number;
    durationSeconds: number;
  }) => void;
}

const getInitialSessionId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch {}
  }
  return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
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
  scrollDepthSum: 0,
  scrollSampleCount: 0,
  cumulativeNavigationDepth: 1,
  trackingEnabled: true,
  consentGiven: true,

  textSelectionsCount: 0,
  rageClickCount: 0,
  totalDwellMs: 0,
  dwellEventsCount: 0,

  addEvent: (event: TelemetryEvent) => {
    if (!get().trackingEnabled) return;
    set((state) => {
      const nextClicks = event.type === 'click' ? state.cumulativeClicks + 1 : state.cumulativeClicks;
      const nextKeypresses = event.type === 'keypress' ? state.cumulativeKeypresses + 1 : state.cumulativeKeypresses;
      const nextUnique = new Set(state.uniqueElementsSet);
      if (event.type === 'click' && event.elementId) {
        nextUnique.add(event.elementId);
      }

      let nextScrollSum = state.scrollDepthSum;
      let nextScrollCount = state.scrollSampleCount;
      let nextAvgScroll = state.lastKnownScrollDepth;
      if (event.type === 'scroll' && typeof event.depth === 'number') {
        nextScrollSum += event.depth;
        nextScrollCount += 1;
        nextAvgScroll = Math.round(nextScrollSum / nextScrollCount);
      }

      const nextMaxScroll = typeof event.depth === 'number'
        ? Math.max(state.maxScrollDepth, event.depth)
        : state.maxScrollDepth;

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
        events: [...state.events, { ...event, timestamp: event.timestamp || new Date() }],
        cumulativeClicks: nextClicks,
        cumulativeKeypresses: nextKeypresses,
        uniqueElementsSet: nextUnique,
        lastKnownScrollDepth: nextAvgScroll,
        maxScrollDepth: nextMaxScroll,
        scrollDepthSum: nextScrollSum,
        scrollSampleCount: nextScrollCount,
        cumulativeNavigationDepth: nextNav,
        textSelectionsCount: nextSelections,
        rageClickCount: nextRage,
        totalDwellMs: nextDwellMs,
        dwellEventsCount: nextDwellCount,
      };
    });
  },

  clearEventsCount: (count: number) => {
    set((state) => ({
      events: state.events.slice(count),
    }));
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
    return Math.max(1, (Date.now() - startTime) / 1000);
  },

  setTrackingEnabled: (enabled: boolean) => set({ trackingEnabled: enabled }),

  setConsent: (consent: boolean) => set({ consentGiven: consent, trackingEnabled: consent }),

  trackViewSwitch: (viewName) => {
    if (!get().trackingEnabled) return;
    get().addEvent({
      type: 'view_switch',
      route: viewName || (typeof window !== 'undefined' ? window.location.pathname : ''),
    });
  },

  trackTextSelection: () => {
    if (!get().trackingEnabled) return;
    get().addEvent({
      type: 'text_selection',
    });
  },

  trackRageClick: (x: number, y: number) => {
    if (!get().trackingEnabled) return;
    get().addEvent({
      type: 'rage_click',
      x,
      y,
    });
  },

  trackDwell: (elementId: string, dwellMs: number) => {
    if (!get().trackingEnabled) return;
    get().addEvent({
      type: 'dwell',
      elementId,
      dwellMs,
    });
  },

  applySimulationPreset: ({ clicks, uniqueClicks, scrollDepth, navDepth, durationSeconds }) => {
    const syntheticSet = new Set<string>();
    for (let i = 0; i < uniqueClicks; i++) {
      syntheticSet.add(`sim-el-${i}`);
    }
    set((state) => ({
      cumulativeClicks: clicks,
      uniqueElementsSet: syntheticSet,
      lastKnownScrollDepth: scrollDepth,
      scrollDepthSum: scrollDepth,
      scrollSampleCount: 1,
      maxScrollDepth: scrollDepth,
      cumulativeNavigationDepth: navDepth,
      sessionStart: new Date(Date.now() - durationSeconds * 1000),
      events: [
        ...state.events,
        { type: 'click', elementId: 'simulation-preset', timestamp: new Date() },
      ],
    }));
  },
}));
