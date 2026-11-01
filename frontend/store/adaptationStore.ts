import { create } from 'zustand';

export interface AdaptationDetails {
  density: 'compact' | 'standard' | 'spacious';
  textScale: number;
  targetSize: 'normal' | 'large';
  showShortcuts: boolean;
  showHelp: boolean;
  emphasizeSearch: boolean;
  showNotes: boolean;
  [key: string]: any;
}

export interface UserOverrides {
  state?: string;
  density?: 'compact' | 'standard' | 'spacious';
  textScale?: number;
  targetSize?: 'normal' | 'large';
  showShortcuts?: boolean;
  showHelp?: boolean;
  emphasizeSearch?: boolean;
  showNotes?: boolean;
  theme?: 'light' | 'dark';
  componentOrder?: string[];
  layoutDensity?: 'compact' | 'standard' | 'spacious';
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
  adaptation?: Partial<AdaptationDetails>;

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
  lastUpdated: Date | null;
  adaptationsCount: number;
  lastAiSignal: AdaptationSignal | null;

  // Pause / Undo state
  isPaused: boolean;
  pausedUntil: number | null; // epoch ms

  // Overrides & Locked dimensions
  userOverrides: UserOverrides;

  // Legacy shims
  theme: 'light' | 'dark';
  componentOrder: string[];
  layoutDensity: 'compact' | 'standard' | 'spacious';
  detectedClass: string;

  // Actions
  setAdaptation: (signal: AdaptationSignal) => void;
  undoAdaptation: () => void;
  resumeAdaptation: () => void;
  setOverride: (key: string, value: any) => void;
  clearOverride: (key: string) => void;
  clearAllOverrides: () => void;
  simulateState: (targetState: string) => void;
}

export const STATE_PRESETS: Record<string, {
  reasons: string[];
  changes: string[];
  adaptation: AdaptationDetails;
  theme: 'light' | 'dark';
  layoutDensity: 'compact' | 'standard' | 'spacious';
}> = {
  fast_navigator: {
    reasons: [
      'High click rate and rapid keyboard shortcut navigation detected',
      'Minimal idle time indicating focused, rapid actions',
      'High frequency of view switches between tasks and lists',
    ],
    changes: [
      'Density switched to compact (more tasks on screen)',
      'Keyboard shortcut quick-bar enabled',
      'Normal target sizes for precision clicking',
    ],
    adaptation: {
      density: 'compact',
      textScale: 1.0,
      targetSize: 'normal',
      showShortcuts: true,
      showHelp: false,
      emphasizeSearch: false,
      showNotes: false,
    },
    theme: 'dark',
    layoutDensity: 'compact',
  },
  reader: {
    reasons: [
      'Slow, deep scroll pattern with extended reading intervals',
      'High idle time indicating careful processing of notes',
      'Low click rate with focused content reading',
    ],
    changes: [
      'Spacious layout density for comfortable reading',
      'Text scale enlarged to 120%',
      'Task notes automatically expanded and previewed',
    ],
    adaptation: {
      density: 'spacious',
      textScale: 1.2,
      targetSize: 'normal',
      showShortcuts: false,
      showHelp: false,
      emphasizeSearch: false,
      showNotes: true,
    },
    theme: 'light',
    layoutDensity: 'spacious',
  },
  struggling: {
    reasons: [
      'Repeated clicks on the same elements within short intervals',
      'Long hesitation pauses before selecting task actions',
      'Low scroll depth suggesting difficulty locating items',
    ],
    changes: [
      'Button hit targets enlarged to 48px with prominent labels',
      'Helpful tips banner displayed at top of workspace',
      'Enhanced border contrast and visible focus rings',
    ],
    adaptation: {
      density: 'standard',
      textScale: 1.1,
      targetSize: 'large',
      showShortcuts: false,
      showHelp: true,
      emphasizeSearch: false,
      showNotes: false,
    },
    theme: 'light',
    layoutDensity: 'standard',
  },
  explorer: {
    reasons: [
      'High text entry frequency indicating active searching',
      'Rapid filter switching across all task categories',
      'Broad exploration across multiple UI areas',
    ],
    changes: [
      'Search input pinned and highlighted at the top',
      'Quick filter tabs prominent and accessible',
      'Standard balanced row spacing',
    ],
    adaptation: {
      density: 'standard',
      textScale: 1.0,
      targetSize: 'normal',
      showShortcuts: false,
      showHelp: false,
      emphasizeSearch: true,
      showNotes: false,
    },
    theme: 'light',
    layoutDensity: 'standard',
  },
  balanced: {
    reasons: [
      'Normal balanced interaction metrics detected',
      'Confidence score below threshold (using balanced default)',
    ],
    changes: [
      'Standard density and default 1.0x typography',
      'Standard interactive target sizing',
      'Clean layout with optional notes hidden',
    ],
    adaptation: {
      density: 'standard',
      textScale: 1.0,
      targetSize: 'normal',
      showShortcuts: false,
      showHelp: false,
      emphasizeSearch: false,
      showNotes: false,
    },
    theme: 'light',
    layoutDensity: 'standard',
  },
};

const DEFAULT_ADAPTATION: AdaptationDetails = STATE_PRESETS.balanced.adaptation;

export const useAdaptationStore = create<AdaptationState>((set, get) => ({
  state: 'balanced',
  confidence: 0.85,
  reasons: STATE_PRESETS.balanced.reasons,
  changes: STATE_PRESETS.balanced.changes,
  adaptation: DEFAULT_ADAPTATION,
  lastUpdated: null,
  adaptationsCount: 0,
  lastAiSignal: null,

  isPaused: false,
  pausedUntil: null,
  userOverrides: {},

  theme: 'light',
  componentOrder: ['dashboard', 'analytics', 'settings', 'notifications'],
  layoutDensity: 'standard',
  detectedClass: 'balanced',

  setAdaptation: (signal: AdaptationSignal) => {
    set((prevState) => {
      // 1. Check if adaptation is currently paused (e.g. from Undo)
      const now = Date.now();
      if (prevState.isPaused) {
        if (prevState.pausedUntil && now < prevState.pausedUntil) {
          // Still in the 2-minute pause window
          return prevState;
        }
        // Pause expired, continue
      }

      const updates: Partial<AdaptationState> = {
        lastUpdated: new Date(),
        adaptationsCount: prevState.adaptationsCount + 1,
        lastAiSignal: signal,
        isPaused: false,
        pausedUntil: null,
      };

      const targetState = signal.state || signal.detectedClass || 'balanced';
      const preset = STATE_PRESETS[targetState] || STATE_PRESETS.balanced;

      // Update state if not locked by user
      if (!('state' in prevState.userOverrides)) {
        updates.state = targetState;
        updates.detectedClass = targetState;
      }

      if (typeof signal.confidence === 'number') {
        updates.confidence = signal.confidence;
      }

      // Plain language reasons & changes
      updates.reasons = Array.isArray(signal.reasons) && signal.reasons.length > 0
        ? signal.reasons
        : preset.reasons;

      updates.changes = Array.isArray(signal.changes) && signal.changes.length > 0
        ? signal.changes
        : preset.changes;

      // Merge adaptation hints with presets
      const baseAdaptation = signal.adaptation
        ? { ...preset.adaptation, ...signal.adaptation }
        : preset.adaptation;

      // Apply overrides for locked dimensions
      const finalAdaptation: AdaptationDetails = { ...baseAdaptation };
      if ('density' in prevState.userOverrides) {
        finalAdaptation.density = prevState.userOverrides.density!;
      }
      if ('textScale' in prevState.userOverrides) {
        finalAdaptation.textScale = prevState.userOverrides.textScale!;
      }
      if ('targetSize' in prevState.userOverrides) {
        finalAdaptation.targetSize = prevState.userOverrides.targetSize!;
      }
      if ('showShortcuts' in prevState.userOverrides) {
        finalAdaptation.showShortcuts = prevState.userOverrides.showShortcuts!;
      }
      if ('showHelp' in prevState.userOverrides) {
        finalAdaptation.showHelp = prevState.userOverrides.showHelp!;
      }
      if ('emphasizeSearch' in prevState.userOverrides) {
        finalAdaptation.emphasizeSearch = prevState.userOverrides.emphasizeSearch!;
      }
      if ('showNotes' in prevState.userOverrides) {
        finalAdaptation.showNotes = prevState.userOverrides.showNotes!;
      }

      updates.adaptation = finalAdaptation;
      updates.layoutDensity = finalAdaptation.density;

      // Legacy shims
      if (signal.theme && !('theme' in prevState.userOverrides)) {
        updates.theme = signal.theme;
      }

      return updates;
    });
  },

  undoAdaptation: () => {
    // Reverts to balanced and pauses AI adaptation for 2 minutes (120,000 ms)
    const pauseUntil = Date.now() + 120_000;
    const balanced = STATE_PRESETS.balanced;

    set({
      state: 'balanced',
      detectedClass: 'balanced',
      confidence: 1.0,
      reasons: ['User selected Undo — reverted to default layout'],
      changes: ['All automated adaptations paused for 2 minutes'],
      adaptation: { ...balanced.adaptation },
      layoutDensity: 'standard',
      isPaused: true,
      pausedUntil: pauseUntil,
      userOverrides: {},
    });
  },

  resumeAdaptation: () => {
    set({
      isPaused: false,
      pausedUntil: null,
    });
  },

  setOverride: (key: string, value: any) => {
    set((state) => {
      const nextOverrides = {
        ...state.userOverrides,
        [key]: value,
      };

      const nextAdaptation = { ...state.adaptation };
      if (key in nextAdaptation) {
        (nextAdaptation as any)[key] = value;
      }

      const updates: Partial<AdaptationState> = {
        userOverrides: nextOverrides,
        adaptation: nextAdaptation,
      };

      if (key === 'density') {
        updates.layoutDensity = value;
      }
      if (key === 'state') {
        const preset = STATE_PRESETS[value] || STATE_PRESETS.balanced;
        updates.state = value;
        updates.detectedClass = value;
        updates.adaptation = { ...preset.adaptation };
        updates.reasons = preset.reasons;
        updates.changes = preset.changes;
        updates.layoutDensity = preset.adaptation.density;
      }

      return updates;
    });
  },

  clearOverride: (key: string) => {
    set((state) => {
      const nextOverrides = { ...state.userOverrides };
      delete nextOverrides[key];
      return { userOverrides: nextOverrides };
    });
  },

  clearAllOverrides: () => {
    set({
      userOverrides: {},
      isPaused: false,
      pausedUntil: null,
    });
  },

  simulateState: (targetState: string) => {
    const preset = STATE_PRESETS[targetState] || STATE_PRESETS.balanced;
    set((prevState) => ({
      state: targetState,
      detectedClass: targetState,
      confidence: 0.94,
      reasons: preset.reasons,
      changes: preset.changes,
      adaptation: { ...preset.adaptation },
      layoutDensity: preset.layoutDensity,
      theme: preset.theme,
      lastUpdated: new Date(),
      adaptationsCount: prevState.adaptationsCount + 1,
    }));
  },
}));
