import { create } from 'zustand';

export interface UserOverrides {
  theme?: 'light' | 'dark';
  componentOrder?: string[];
  layoutDensity?: 'compact' | 'standard' | 'spacious';
  [key: string]: any;
}

export interface AdaptationSignal {
  theme?: 'light' | 'dark';
  componentOrder?: string[];
  layoutDensity?: 'compact' | 'standard' | 'spacious';
  detectedClass?: string;
  [key: string]: any;
}

export interface AdaptationState {
  theme: 'light' | 'dark';
  componentOrder: string[];
  layoutDensity: 'compact' | 'standard' | 'spacious';
  userOverrides: UserOverrides;
  lastUpdated: Date | null;
  detectedClass: string;
  adaptationsCount: number;
  lastAiSignal: AdaptationSignal | null;

  setAdaptation: (signal: AdaptationSignal) => void;
  setOverride: (key: string, value: any) => void;
  clearOverride: (key: string) => void;
  clearAllOverrides: () => void;
}

export const useAdaptationStore = create<AdaptationState>((set) => ({
  theme: 'light',
  componentOrder: ['dashboard', 'analytics', 'settings', 'notifications'],
  layoutDensity: 'standard',
  userOverrides: {},
  lastUpdated: null,
  detectedClass: '',
  adaptationsCount: 0,
  lastAiSignal: null,

  setAdaptation: (signal: AdaptationSignal) => {
    set((state) => {
      const updates: Partial<AdaptationState> = {
        lastUpdated: new Date(),
        adaptationsCount: state.adaptationsCount + 1,
        lastAiSignal: signal,
        detectedClass: signal.detectedClass !== undefined ? signal.detectedClass : state.detectedClass,
      };

      if (signal.theme !== undefined && !('theme' in state.userOverrides)) {
        updates.theme = signal.theme;
      }
      if (signal.componentOrder !== undefined && !('componentOrder' in state.userOverrides)) {
        updates.componentOrder = signal.componentOrder;
      }
      if (signal.layoutDensity !== undefined && !('layoutDensity' in state.userOverrides)) {
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
      }
      return fallback;
    });
  },
}));
