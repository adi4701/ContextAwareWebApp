import { create } from 'zustand';

export interface TelemetryEvent {
  type: 'click' | 'scroll' | 'keypress' | 'navigate' | 'view_switch' | string;
  timestamp: number | Date; // epoch ms or Date
  elementId?: string;
  depth?: number;
  route?: string;
  x?: number;
  y?: number;
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

  setConsent: (consent: boolean) => void;
  addEvent: (event: Omit<TelemetryEvent, 'timestamp'> & { timestamp?: number | Date }) => void;
  trackViewSwitch: (viewName?: string) => void;
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

      return {
        events: [...state.events, fullEvent],
        cumulativeClicks: nextClicks,
        cumulativeKeypresses: nextKeypresses,
        uniqueElementsSet: nextUnique,
        lastKnownScrollDepth: scrollDepth,
        maxScrollDepth: nextMaxScroll,
        cumulativeNavigationDepth: nextNav,
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
