import { create } from 'zustand';

export interface TelemetryEvent {
  type: string;
  timestamp?: Date | string;
  [key: string]: any;
}

export interface TelemetryState {
  events: TelemetryEvent[];
  sessionId: string;
  sessionStart: Date;
  cumulativeClicks: number;
  uniqueElementsSet: Set<string>;
  lastKnownScrollDepth: number;
  cumulativeNavigationDepth: number;

  addEvent: (event: TelemetryEvent) => void;
  flushAndGetBuffer: () => TelemetryEvent[];
  getSessionDuration: () => number;
}

const getInitialSessionId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch {
      // Fallback if not available
    }
  }
  return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
};

export const useTelemetryStore = create<TelemetryState>((set, get) => ({
  events: [],
  sessionId: getInitialSessionId(),
  sessionStart: new Date(),
  cumulativeClicks: 0,
  uniqueElementsSet: new Set<string>(),
  lastKnownScrollDepth: 50,
  cumulativeNavigationDepth: 1,

  addEvent: (event: TelemetryEvent) => {
    set((state) => {
      const nextClicks = event.type === 'click' ? state.cumulativeClicks + 1 : state.cumulativeClicks;
      const nextUnique = new Set(state.uniqueElementsSet);
      if (event.type === 'click' && event.elementId) {
        nextUnique.add(event.elementId);
      }
      const nextScroll = event.type === 'scroll' && typeof event.depth === 'number'
        ? event.depth
        : state.lastKnownScrollDepth;
      const nextNav = event.type === 'navigate'
        ? state.cumulativeNavigationDepth + 1
        : state.cumulativeNavigationDepth;
      return {
        events: [...state.events, { ...event, timestamp: new Date() }],
        cumulativeClicks: nextClicks,
        uniqueElementsSet: nextUnique,
        lastKnownScrollDepth: nextScroll,
        cumulativeNavigationDepth: nextNav,
      };
    });
  },

  flushAndGetBuffer: () => {
    const currentEvents = get().events;
    set({ events: [] });
    return currentEvents;
  },

  getSessionDuration: () => {
    const startTime = get().sessionStart.getTime();
    return Math.max(0, (Date.now() - startTime) / 1000);
  },
}));
