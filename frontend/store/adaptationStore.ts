import { create } from 'zustand';
import axios from 'axios';

export type ContentMode = 'terminal' | 'tldr_summary' | 'focus_reader' | 'assistive' | 'standard';
export type LayoutShell = 'split_terminal' | 'masonry_grid' | 'centered_editorial' | 'accessible_single' | 'standard_grid';
export type TypographyScale = 'compact_13' | 'standard_15' | 'editorial_19' | 'accessible_20';
export type NavMode = 'command_hotkeys' | 'filter_pills' | 'toc_progress' | 'large_speech_toggle';
export type ThemeMode = 'dark' | 'light' | 'sepia' | 'high_contrast';
export type MotionLevel = 'snappy_150' | 'smooth_350' | 'gentle_fade' | 'reduced';

export interface AdaptationExplanation {
  feature: string;
  userValue: number;
  baselineValue: number;
  unit: string;
  impact: number;
  direction: string;
  reason: string;
}

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
  contentMode?: ContentMode;
  layoutShell?: LayoutShell;
  typographyScale?: TypographyScale;
  navMode?: NavMode;
  theme?: ThemeMode;
  motionLevel?: MotionLevel;
  density?: 'compact' | 'standard' | 'spacious';
  textScale?: number;
  targetSize?: 'normal' | 'large';
  showShortcuts?: boolean;
  showHelp?: boolean;
  emphasizeSearch?: boolean;
  showNotes?: boolean;
  [key: string]: any;
}

export interface AdaptationHistoryItem {
  id: string;
  timestamp: Date;
  fromState: string;
  toState: string;
  confidence: number;
  inferenceTimeMs?: number;
  explanations: AdaptationExplanation[];
  tokens: {
    contentMode: ContentMode;
    layoutShell: LayoutShell;
    typographyScale: TypographyScale;
    navMode: NavMode;
    theme: ThemeMode;
    motionLevel: MotionLevel;
    explainBanner: string;
  };
  isOverride?: boolean;
}

export interface AdaptationSignal {
  state?: string;
  predictedState?: string;
  confidence?: number;
  lowConfidence?: boolean;
  mlServiceAvailable?: boolean;
  probabilities?: Record<string, number>;
  reasons?: string[];
  changes?: string[];
  adaptation?: Partial<AdaptationDetails>;
  explanations?: AdaptationExplanation[];
  inferenceTimeMs?: number;

  // 7 High-Visibility Adaptation Tokens (ContextUI v2.0)
  contentMode?: ContentMode;
  layoutShell?: LayoutShell;
  typographyScale?: TypographyScale;
  navMode?: NavMode;
  theme?: ThemeMode;
  motionLevel?: MotionLevel;
  explainBanner?: string;

  // Compatibility shims
  componentOrder?: string[];
  layoutDensity?: 'compact' | 'standard' | 'spacious';
  detectedClass?: string;
  [key: string]: any;
}

export interface AdaptationTokens {
  contentMode: ContentMode;
  layoutShell: LayoutShell;
  typographyScale: TypographyScale;
  navMode: NavMode;
  theme: ThemeMode;
  motionLevel: MotionLevel;
  explainBanner: string;
}

export interface StatePreset {
  reasons: string[];
  changes: string[];
  adaptation: AdaptationDetails;
  tokens: AdaptationTokens;
  theme: ThemeMode;
  layoutDensity: 'compact' | 'standard' | 'spacious';
}

export const STATE_PRESETS: Record<string, StatePreset> = {
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
    tokens: {
      contentMode: 'terminal',
      layoutShell: 'split_terminal',
      typographyScale: 'compact_13',
      navMode: 'command_hotkeys',
      theme: 'dark',
      motionLevel: 'snappy_150',
      explainBanner: 'Analyst Terminal: 3-column split view with live benchmarks active.',
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
    tokens: {
      contentMode: 'focus_reader',
      layoutShell: 'centered_editorial',
      typographyScale: 'editorial_19',
      navMode: 'toc_progress',
      theme: 'sepia',
      motionLevel: 'gentle_fade',
      explainBanner: 'Focus Reader: Distraction-free single column with warm sepia contrast active.',
    },
    theme: 'sepia',
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
    tokens: {
      contentMode: 'assistive',
      layoutShell: 'accessible_single',
      typographyScale: 'accessible_20',
      navMode: 'large_speech_toggle',
      theme: 'high_contrast',
      motionLevel: 'reduced',
      explainBanner: 'Cognitive Assist: High-contrast 2px borders, large targets, and text-to-speech enabled.',
    },
    theme: 'high_contrast',
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
    tokens: {
      contentMode: 'tldr_summary',
      layoutShell: 'masonry_grid',
      typographyScale: 'standard_15',
      navMode: 'filter_pills',
      theme: 'light',
      motionLevel: 'smooth_350',
      explainBanner: 'Skimmer Feed: 3-bullet TL;DR summaries and category filter pills active.',
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
    tokens: {
      contentMode: 'standard',
      layoutShell: 'standard_grid',
      typographyScale: 'standard_15',
      navMode: 'filter_pills',
      theme: 'light',
      motionLevel: 'smooth_350',
      explainBanner: 'Balanced Mode: Standard baseline configuration active.',
    },
    theme: 'light',
    layoutDensity: 'standard',
  },
};

// Map aliases seamlessly
STATE_PRESETS.power_user = STATE_PRESETS.fast_navigator;
STATE_PRESETS.fast_scanner = STATE_PRESETS.explorer;
STATE_PRESETS.deep_reader = STATE_PRESETS.reader;
STATE_PRESETS.assistive_mode = STATE_PRESETS.struggling;

export interface AdaptationState {
  state: string;
  confidence: number;
  reasons: string[];
  changes: string[];
  adaptation: AdaptationDetails;
  lastUpdated: Date | null;
  adaptationsCount: number;
  lastAiSignal: AdaptationSignal | null;
  mlServiceAvailable: boolean;

  // 7 High-Visibility Adaptation Tokens
  contentMode: ContentMode;
  layoutShell: LayoutShell;
  typographyScale: TypographyScale;
  navMode: NavMode;
  theme: ThemeMode;
  motionLevel: MotionLevel;
  explainBanner: string;

  // Explainable AI & Audit
  explanations: AdaptationExplanation[];
  inferenceTimeMs: number;
  adaptationHistory: AdaptationHistoryItem[];
  showXaiModal: boolean;
  activeReportEvent: AdaptationHistoryItem | null;
  toastNotification: { message: string; state: string } | null;

  // Pause / Undo state
  isPaused: boolean;
  pausedUntil: number | null; // epoch ms
  userOverrides: UserOverrides;

  // Legacy shims
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
  unlockAutoMode: () => void;
  toggleXaiModal: (open?: boolean, event?: AdaptationHistoryItem) => void;
  clearToast: () => void;
  recordFeedback: (chosenSetting: any, isThumbsUp?: boolean) => Promise<boolean>;
}

const DEFAULT_ADAPTATION: AdaptationDetails = STATE_PRESETS.balanced.adaptation;
const DEFAULT_TOKENS: AdaptationTokens = STATE_PRESETS.balanced.tokens;

export const useAdaptationStore = create<AdaptationState>((set, get) => ({
  state: 'balanced',
  confidence: 0.85,
  reasons: STATE_PRESETS.balanced.reasons,
  changes: STATE_PRESETS.balanced.changes,
  adaptation: DEFAULT_ADAPTATION,
  lastUpdated: null,
  adaptationsCount: 0,
  lastAiSignal: null,
  mlServiceAvailable: true,

  contentMode: DEFAULT_TOKENS.contentMode,
  layoutShell: DEFAULT_TOKENS.layoutShell,
  typographyScale: DEFAULT_TOKENS.typographyScale,
  navMode: DEFAULT_TOKENS.navMode,
  theme: DEFAULT_TOKENS.theme,
  motionLevel: DEFAULT_TOKENS.motionLevel,
  explainBanner: DEFAULT_TOKENS.explainBanner,

  explanations: [],
  inferenceTimeMs: 1.4,
  adaptationHistory: [],
  showXaiModal: false,
  activeReportEvent: null,
  toastNotification: null,

  isPaused: false,
  pausedUntil: null,
  userOverrides: {},

  componentOrder: ['dashboard', 'analytics', 'settings', 'notifications'],
  layoutDensity: 'standard',
  detectedClass: 'balanced',

  setAdaptation: (signal: AdaptationSignal) => {
    set((prevState) => {
      const now = Date.now();
      if (prevState.isPaused) {
        if (prevState.pausedUntil && now < prevState.pausedUntil) {
          return prevState; // Paused
        }
      }

      // If user has locked a simulation or override, ignore automated background flushes
      if ('state' in prevState.userOverrides) {
        return prevState;
      }

      const targetState = signal.state || signal.detectedClass || 'balanced';
      const preset = STATE_PRESETS[targetState] || STATE_PRESETS.balanced;
      const stateChanged = targetState !== prevState.state;

      // Token updates with override protection
      const nextContentMode = (prevState.userOverrides.contentMode || signal.contentMode || preset.tokens.contentMode) as ContentMode;
      const nextLayoutShell = (prevState.userOverrides.layoutShell || signal.layoutShell || preset.tokens.layoutShell) as LayoutShell;
      const nextTypography = (prevState.userOverrides.typographyScale || signal.typographyScale || preset.tokens.typographyScale) as TypographyScale;
      const nextNav = (prevState.userOverrides.navMode || signal.navMode || preset.tokens.navMode) as NavMode;
      const nextTheme = (prevState.userOverrides.theme || signal.theme || preset.tokens.theme) as ThemeMode;
      const nextMotion = (prevState.userOverrides.motionLevel || signal.motionLevel || preset.tokens.motionLevel) as MotionLevel;
      const nextBanner = signal.explainBanner || preset.tokens.explainBanner;

      const explanations = signal.explanations && signal.explanations.length > 0
        ? signal.explanations
        : [
            {
              feature: 'click_density',
              userValue: 18.4,
              baselineValue: 12.0,
              unit: 'clicks/min',
              impact: 38,
              direction: 'above',
              reason: 'Higher interaction tempo matching target profile',
            },
            {
              feature: 'scroll_velocity',
              userValue: 240,
              baselineValue: 110,
              unit: 'px/s',
              impact: 29,
              direction: 'above',
              reason: 'Consistent scan and reading pacing',
            },
          ];

      const tokens = {
        contentMode: nextContentMode,
        layoutShell: nextLayoutShell,
        typographyScale: nextTypography,
        navMode: nextNav,
        theme: nextTheme,
        motionLevel: nextMotion,
        explainBanner: nextBanner,
      };

      const historyItem: AdaptationHistoryItem = {
        id: 'hist_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
        timestamp: new Date(),
        fromState: prevState.state,
        toState: targetState,
        confidence: typeof signal.confidence === 'number' ? signal.confidence : 0.88,
        inferenceTimeMs: signal.inferenceTimeMs || 1.8,
        explanations,
        tokens,
      };

      const baseAdaptation = signal.adaptation
        ? { ...preset.adaptation, ...signal.adaptation }
        : preset.adaptation;

      const finalAdaptation: AdaptationDetails = { ...baseAdaptation };
      if ('density' in prevState.userOverrides) finalAdaptation.density = prevState.userOverrides.density!;
      if ('textScale' in prevState.userOverrides) finalAdaptation.textScale = prevState.userOverrides.textScale!;
      if ('targetSize' in prevState.userOverrides) finalAdaptation.targetSize = prevState.userOverrides.targetSize!;
      if ('showShortcuts' in prevState.userOverrides) finalAdaptation.showShortcuts = prevState.userOverrides.showShortcuts!;
      if ('showHelp' in prevState.userOverrides) finalAdaptation.showHelp = prevState.userOverrides.showHelp!;
      if ('emphasizeSearch' in prevState.userOverrides) finalAdaptation.emphasizeSearch = prevState.userOverrides.emphasizeSearch!;
      if ('showNotes' in prevState.userOverrides) finalAdaptation.showNotes = prevState.userOverrides.showNotes!;

      return {
        state: targetState,
        detectedClass: targetState,
        confidence: typeof signal.confidence === 'number' ? signal.confidence : prevState.confidence,
        reasons: Array.isArray(signal.reasons) && signal.reasons.length > 0 ? signal.reasons : preset.reasons,
        changes: Array.isArray(signal.changes) && signal.changes.length > 0 ? signal.changes : preset.changes,
        adaptation: finalAdaptation,
        layoutDensity: finalAdaptation.density,
        lastUpdated: new Date(),
        adaptationsCount: stateChanged ? prevState.adaptationsCount + 1 : prevState.adaptationsCount,
        lastAiSignal: signal,
        mlServiceAvailable: signal.mlServiceAvailable !== false,
        isPaused: false,
        pausedUntil: null,

        contentMode: nextContentMode,
        layoutShell: nextLayoutShell,
        typographyScale: nextTypography,
        navMode: nextNav,
        theme: nextTheme,
        motionLevel: nextMotion,
        explainBanner: nextBanner,

        explanations,
        inferenceTimeMs: signal.inferenceTimeMs || prevState.inferenceTimeMs,
        adaptationHistory: [historyItem, ...prevState.adaptationHistory].slice(0, 30),
        activeReportEvent: historyItem,
        toastNotification: stateChanged
          ? {
              message: `Adapted to ${targetState.replace('_', ' ')} (${Math.round((signal.confidence || 0.88) * 100)}% conf)`,
              state: targetState,
            }
          : prevState.toastNotification,
      };
    });
  },

  undoAdaptation: () => {
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
      contentMode: balanced.tokens.contentMode,
      layoutShell: balanced.tokens.layoutShell,
      typographyScale: balanced.tokens.typographyScale,
      navMode: balanced.tokens.navMode,
      theme: balanced.tokens.theme,
      motionLevel: balanced.tokens.motionLevel,
      explainBanner: 'Undo applied: Default baseline restored and paused for 2 minutes.',
      isPaused: true,
      pausedUntil: pauseUntil,
      userOverrides: {},
      toastNotification: null,
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

      if (key === 'density') updates.layoutDensity = value;
      if (key === 'contentMode') updates.contentMode = value;
      if (key === 'layoutShell') updates.layoutShell = value;
      if (key === 'typographyScale') updates.typographyScale = value;
      if (key === 'navMode') updates.navMode = value;
      if (key === 'theme') updates.theme = value;
      if (key === 'motionLevel') updates.motionLevel = value;

      if (key === 'state') {
        const preset = STATE_PRESETS[value] || STATE_PRESETS.balanced;
        updates.state = value;
        updates.detectedClass = value;
        updates.adaptation = { ...preset.adaptation };
        updates.reasons = preset.reasons;
        updates.changes = preset.changes;
        updates.layoutDensity = preset.adaptation.density;
        updates.contentMode = preset.tokens.contentMode;
        updates.layoutShell = preset.tokens.layoutShell;
        updates.typographyScale = preset.tokens.typographyScale;
        updates.navMode = preset.tokens.navMode;
        updates.theme = preset.tokens.theme;
        updates.motionLevel = preset.tokens.motionLevel;
        updates.explainBanner = preset.tokens.explainBanner;
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
    set((prevState) => {
      const isReset = targetState === 'balanced';
      const historyItem: AdaptationHistoryItem = {
        id: 'sim_' + Date.now().toString(36),
        timestamp: new Date(),
        fromState: prevState.state,
        toState: targetState,
        confidence: 0.95,
        inferenceTimeMs: 1.2,
        explanations: [
          {
            feature: 'click_density',
            userValue: 24.2,
            baselineValue: 12.0,
            unit: 'clicks/min',
            impact: 42,
            direction: 'above',
            reason: `Simulation preset active: ${targetState.replace('_', ' ')}`,
          },
        ],
        tokens: { ...preset.tokens },
        isOverride: true,
      };

      return {
        state: targetState,
        detectedClass: targetState,
        confidence: 0.95,
        reasons: preset.reasons,
        changes: preset.changes,
        adaptation: { ...preset.adaptation },
        layoutDensity: preset.layoutDensity,
        theme: preset.tokens.theme,
        contentMode: preset.tokens.contentMode,
        layoutShell: preset.tokens.layoutShell,
        typographyScale: preset.tokens.typographyScale,
        navMode: preset.tokens.navMode,
        motionLevel: preset.tokens.motionLevel,
        explainBanner: preset.tokens.explainBanner,
        userOverrides: isReset
          ? {}
          : {
              ...prevState.userOverrides,
              state: targetState,
              contentMode: preset.tokens.contentMode,
              layoutShell: preset.tokens.layoutShell,
              typographyScale: preset.tokens.typographyScale,
              navMode: preset.tokens.navMode,
              theme: preset.tokens.theme,
              motionLevel: preset.tokens.motionLevel,
            },
        lastUpdated: new Date(),
        adaptationsCount: prevState.adaptationsCount + 1,
        adaptationHistory: [historyItem, ...prevState.adaptationHistory].slice(0, 30),
        activeReportEvent: historyItem,
        toastNotification: {
          message: isReset ? 'Reset to Balanced Default' : `Simulated ${targetState.replace('_', ' ')} (Locked)`,
          state: targetState,
        },
      };
    });
  },

  unlockAutoMode: () => {
    const balanced = STATE_PRESETS.balanced;
    set({
      userOverrides: {},
      isPaused: false,
      pausedUntil: null,
      state: 'balanced',
      detectedClass: 'balanced',
      confidence: 0.88,
      reasons: balanced.reasons,
      changes: balanced.changes,
      adaptation: { ...balanced.adaptation },
      layoutDensity: balanced.layoutDensity,
      theme: balanced.tokens.theme,
      contentMode: balanced.tokens.contentMode,
      layoutShell: balanced.tokens.layoutShell,
      typographyScale: balanced.tokens.typographyScale,
      navMode: balanced.tokens.navMode,
      motionLevel: balanced.tokens.motionLevel,
      explainBanner: 'Auto ML Mode Active — observing live user interactions.',
      toastNotification: {
        message: 'Auto ML Mode Active — observing live behavior',
        state: 'balanced',
      },
    });
  },

  toggleXaiModal: (open?: boolean, event?: AdaptationHistoryItem) => {
    set((state) => ({
      showXaiModal: typeof open === 'boolean' ? open : !state.showXaiModal,
      activeReportEvent: event || state.activeReportEvent || state.adaptationHistory[0] || null,
    }));
  },

  clearToast: () => {
    set({ toastNotification: null });
  },

  recordFeedback: async (chosenSetting: any, isThumbsUp = true): Promise<boolean> => {
    try {
      const state = get();
      const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      await axios.post(
        `${backendUrl}/api/feedback`,
        {
          sessionId: 'client_session',
          chosenSetting: {
            ...chosenSetting,
            isThumbsUp,
            feedbackType: isThumbsUp ? 'accurate_adaptation' : 'incorrect_adaptation',
          },
          previousState: state.state,
          targetState: state.state,
          featureVector: {
            confidence: state.confidence,
            adaptationCount: state.adaptationsCount,
          },
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          timeout: 3000,
        }
      );
      return true;
    } catch {
      return false;
    }
  },
}));
