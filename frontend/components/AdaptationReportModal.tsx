'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
  History,
  RotateCcw,
} from 'lucide-react';
import { useAdaptationStore, AdaptationHistoryItem } from '../store/adaptationStore';

export default function AdaptationReportModal() {
  const {
    showXaiModal,
    activeReportEvent,
    adaptationHistory,
    toastNotification,
    toggleXaiModal,
    clearToast,
    undoAdaptation,
    recordFeedback,
  } = useAdaptationStore();

  const [feedbackSubmitted, setFeedbackSubmitted] = useState<string | null>(null);

  const event: AdaptationHistoryItem = activeReportEvent || adaptationHistory[0] || {
    id: 'demo_fallback',
    timestamp: new Date(),
    fromState: 'balanced',
    toState: 'fast_scanner',
    confidence: 0.89,
    inferenceTimeMs: 1.6,
    explanations: [
      {
        feature: 'scroll_velocity',
        userValue: 395,
        baselineValue: 140,
        unit: 'px/s',
        impact: 42,
        direction: 'above',
        reason: 'Rapid downward scrolling detected without reading pauses',
      },
      {
        feature: 'dwell_time',
        userValue: 2.1,
        baselineValue: 8.5,
        unit: 's/article',
        impact: 31,
        direction: 'below',
        reason: 'Brief card inspection time indicating quick headline scanning',
      },
    ],
    tokens: {
      contentMode: 'tldr_summary',
      layoutShell: 'masonry_grid',
      typographyScale: 'standard_15',
      navMode: 'filter_pills',
      theme: 'light',
      motionLevel: 'smooth_350',
      explainBanner: 'Skimmer Feed: 3-bullet TL;DR summaries and category filter pills active.',
    },
  };

  const handleFeedback = async (isThumbsUp: boolean) => {
    setFeedbackSubmitted(isThumbsUp ? 'positive' : 'negative');
    await recordFeedback(
      {
        eventId: event.id,
        fromState: event.fromState,
        toState: event.toState,
        confidence: event.confidence,
      },
      isThumbsUp
    );

    if (!isThumbsUp) {
      setTimeout(() => {
        undoAdaptation();
        toggleXaiModal(false);
      }, 1000);
    }
  };

  return (
    <>
      {/* ════════════════════ SLIDE-IN TOAST NOTIFICATION ════════════════════ */}
      {toastNotification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-sm sm:max-w-md w-full">
          <div className="rounded-2xl bg-zinc-900 text-white p-4 shadow-2xl border border-zinc-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  UI Adaptation Event
                </p>
                <p className="text-sm font-bold text-white capitalize">
                  {toastNotification.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  toggleXaiModal(true);
                  clearToast();
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm"
              >
                Why Adapted?
              </button>
              <button
                onClick={clearToast}
                className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors"
                aria-label="Dismiss toast"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════ INTERACTIVE XAI MODAL ════════════════════ */}
      {showXaiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-zinc-950 p-6 sm:p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800 relative">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-5 border-b border-zinc-100 dark:border-zinc-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                    Explainable AI (XAI) Adaptation Report
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Complete behavioral attribution and UI token diff
                  </p>
                </div>
              </div>

              <button
                onClick={() => toggleXaiModal(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Panel 1: Transformation Summary */}
            <div className="mt-6 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {event.fromState ? event.fromState.replace('_', ' ') : 'Balanced'}
                </span>
                <ArrowRight className="w-4 h-4 text-zinc-400" />
                <span className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 text-white shadow-md shadow-blue-500/20">
                  {event.toState ? event.toState.replace('_', ' ') : 'Fast Scanner'}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-blue-500" />
                  <span>Confidence: <strong className="text-zinc-900 dark:text-zinc-100">{Math.round((event.confidence || 0.88) * 100)}%</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  <span>Latency: <strong className="text-zinc-900 dark:text-zinc-100">{event.inferenceTimeMs || 1.6} ms</strong></span>
                </div>
              </div>
            </div>

            {/* Panel 2: Exact UI Token Diff Table */}
            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-500" />
                Adapted Design & Functional Tokens (7-Token Diff)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/80 flex justify-between items-center">
                  <span className="font-semibold text-zinc-500">1. Content Mode</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {event.tokens.contentMode}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/80 flex justify-between items-center">
                  <span className="font-semibold text-zinc-500">2. Layout Shell</span>
                  <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                    {event.tokens.layoutShell}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/80 flex justify-between items-center">
                  <span className="font-semibold text-zinc-500">3. Typography</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {event.tokens.typographyScale}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/80 flex justify-between items-center">
                  <span className="font-semibold text-zinc-500">4. Navigation Hotkeys</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {event.tokens.navMode}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/80 flex justify-between items-center">
                  <span className="font-semibold text-zinc-500">5. Visual Theme</span>
                  <span className="font-mono font-bold text-pink-600 dark:text-pink-400">
                    {event.tokens.theme}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/80 flex justify-between items-center">
                  <span className="font-semibold text-zinc-500">6. Motion Profile</span>
                  <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                    {event.tokens.motionLevel}
                  </span>
                </div>
              </div>

              <div className="mt-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 text-xs text-blue-900 dark:text-blue-300">
                <strong>7. Explanation Banner:</strong> {event.tokens.explainBanner}
              </div>
            </div>

            {/* Panel 3: Behavioral Evidence Breakdown */}
            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                Live Micro-Behavior Evidence vs Population Baseline
              </h4>

              <div className="space-y-3">
                {event.explanations.map((exp, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 capitalize">
                        {exp.feature.replace(/_/g, ' ')}
                      </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {exp.impact}% Model Contribution
                      </span>
                    </div>

                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden mb-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(15, exp.impact))}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-500">
                      <span>User Observed: <strong>{exp.userValue} {exp.unit}</strong></span>
                      <span>Baseline: <strong>{exp.baselineValue} {exp.unit}</strong></span>
                      <span className="text-zinc-700 dark:text-zinc-300 italic">{exp.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel 4: Feedback Loop & Undo */}
            <div className="mt-8 pt-5 border-t border-zinc-100 dark:border-zinc-900 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-zinc-500">
                {feedbackSubmitted ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Feedback recorded for continual model retraining!
                  </span>
                ) : (
                  <span>Was this adaptation accurate to your intent?</span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => handleFeedback(true)}
                  disabled={Boolean(feedbackSubmitted)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  Accurate
                </button>

                <button
                  onClick={() => handleFeedback(false)}
                  disabled={Boolean(feedbackSubmitted)}
                  className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  Undo & Lock (2 min)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
