import { create } from 'zustand';

export interface AdaptationDetails {
  density?: 'compact' | 'standard' | 'spacious';
  textScale?: number;
  targetSize?: 'normal' | 'large';
  showShortcuts?: boolean;
  showHelp?: boolean;
  emphasizeSearch?: boolean;
  showNotes?: boolean;
  [key: string]: any;
}

export interface UserOverrides {
  theme?: 'light' | 'dark';
  componentOrder?: string[];
  layoutDensity?: 'compact' | 'standard' | 'spacious';
  state?: string;
  [key: string]: any;
}

export interface AdaptationSignal {
  state?: string;
  predictedState?: string;
  confidence?: number;
  lowConfidence?: boolean;
  probabilities?: Record<string, number>;
  reasons?: string[];
  changes?: string[];
  adaptation?: AdaptationDetails;

  // Compatibility shims
  theme?: 'light' | 'dark';
  componentOrder?: string[];
  layoutDensity?: 'compact' | 'standard' | 'spacious';
  detectedClass?: string;
  [key: string]: any;
}

export interface AdaptationState {
  state: string; // fast_navigator | reader | struggling | explorer | balanced
  confidence: number;
  reasons: string[];
  changes: string[];
  adaptation: AdaptationDetails;

  // Legacy fields
  theme: 'light' | 'dark';
  componentOrder: string[];
  layoutDensity: 'compact' | 'standard' | 'spacious';
  detectedClass: string;

  userOverrides: UserOverrides;
  lastUpdated: Date | null;
  adaptationsCount: number;
  lastAiSignal: AdaptationSignal | null;

  setAdaptation: (signal: AdaptationSignal) => void;
  setOverride: (key: string, value: any) => void;
  clearOverride: (key: string) => void;
  clearAllOverrides: () => void;
}

const DEFAULT_ADAPTATION_DETAILS: AdaptationDetails = {
  density: 'standard',
  textScale: 1.0,
  targetSize: 'normal',
  showShortcuts: false,
  showHelp: false,
  emphasizeSearch: false,
  showNotes: false,
};

export const useAdaptationStore = create<AdaptationState>((set) => ({
  state: 'balanced',
  confidence: 0,
  reasons: [],
  changes: [],
  adaptation: DEFAULT_ADAPTATION_DETAILS,

  theme: 'light',
  componentOrder: ['dashboard', 'analytics', 'settings', 'notifications'],
  layoutDensity: 'standard',
  userOverrides: {},
  lastUpdated: null,
  detectedClass: 'balanced',
  adaptationsCount: 0,
  lastAiSignal: null,

  setAdaptation: (signal: AdaptationSignal) => {
    set((prevState) => {
      const updates: Partial<AdaptationState> = {
        lastUpdated: new Date(),
        adaptationsCount: prevState.adaptationsCount + 1,
        lastAiSignal: signal,
      };

      // State and confidence
      const nextState = signal.state || signal.detectedClass || prevState.state;
      if (!('state' in prevState.userOverrides)) {
        updates.state = nextState;
        updates.detectedClass = nextState;
      }
      if (typeof signal.confidence === 'number') {
        updates.confidence = signal.confidence;
      }
      if (Array.isArray(signal.reasons)) {
        updates.reasons = signal.reasons;
      }
      if (Array.isArray(signal.changes)) {
        updates.changes = signal.changes;
      }
      if (signal.adaptation) {
        updates.adaptation = { ...DEFAULT_ADAPTATION_DETAILS, ...signal.adaptation };
        if (signal.adaptation.density) {
          updates.layoutDensity = signal.adaptation.density;
        }
      }

      // Legacy shims
      if (signal.theme !== undefined && !('theme' in prevState.userOverrides)) {
        updates.theme = signal.theme;
      }
      if (signal.componentOrder !== undefined && !('componentOrder' in prevState.userOverrides)) {
        updates.componentOrder = signal.componentOrder;
      }
      if (signal.layoutDensity !== undefined && !('layoutDensity' in prevState.userOverrides)) {
        updates.layoutDensity = signal.layoutDensity;
      }

      return updates;
    });
  },

  setOverride: (key: string, value: any) => {
    set((state) => ({
      userOverrides: {
        ...state.userOverrides,
        [key]: value,
      },
      [key]: value,
    }));
  },

  clearOverride: (key: string) => {
    set((state) => {
      const updatedOverrides = { ...state.userOverrides };
      delete updatedOverrides[key];
      const updates: Partial<AdaptationState> = {
        userOverrides: updatedOverrides,
      };
      if (state.lastAiSignal && state.lastAiSignal[key] !== undefined) {
        updates[key as keyof AdaptationState] = state.lastAiSignal[key];
      }
      return updates;
    });
  },

  clearAllOverrides: () => {
    set((state) => {
      const fallback: Partial<AdaptationState> = {
        userOverrides: {},
      };
      if (state.lastAiSignal) {
        if (state.lastAiSignal.theme) fallback.theme = state.lastAiSignal.theme;
        if (state.lastAiSignal.layoutDensity) fallback.layoutDensity = state.lastAiSignal.layoutDensity;
        if (state.lastAiSignal.componentOrder) fallback.componentOrder = state.lastAiSignal.componentOrder;
        if (state.lastAiSignal.state) fallback.state = state.lastAiSignal.state;
      }
      return fallback;
    });
  },
}));
