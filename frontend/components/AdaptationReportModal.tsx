'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ArrowRight,
  Cpu,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Layers,
  Activity,
  CheckCircle2,
  Terminal,
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
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-sm sm:max-w-md w-full font-mono">
          <div className="rounded-2xl glass-panel text-zinc-100 p-4 shadow-2xl border border-zinc-700/60 flex items-center justify-between gap-3 bg-[#0d0d12]/95 backdrop-blur-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">
                  Adaptation Triggered
                </p>
                <p className="text-xs font-bold text-white capitalize mt-0.5">
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
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-sm"
              >
                Inspect
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

      {/* ════════════════════ INTERACTIVE XAI AUDIT MODAL ════════════════════ */}
      {showXaiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-2xl p-4 animate-in fade-in duration-200 font-sans">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl glass-panel p-6 sm:p-8 shadow-2xl border border-zinc-200/80 dark:border-zinc-800 relative bg-[#FAF9F6]/95 dark:bg-[#09090D]/95">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-5 border-b border-zinc-200/60 dark:border-zinc-800/80 font-mono">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center shadow-md">
                  <Terminal className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                    Explainable AI (XAI) Attribution
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Local feature divergence & 7-token interface diff
                  </p>
                </div>
              </div>

              <button
                onClick={() => toggleXaiModal(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Panel 1: Transformation Summary */}
            <div className="mt-6 p-4 rounded-2xl glass-card flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {event.fromState ? event.fromState.replace('_', ' ') : 'Balanced'}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500 text-black shadow-md shadow-emerald-500/20">
                  {event.toState ? event.toState.replace('_', ' ') : 'Fast Scanner'}
                </span>
              </div>

              <div className="flex items-center gap-4 text-zinc-500 dark:text-zinc-400 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Confidence: <strong className="text-zinc-900 dark:text-zinc-100">{Math.round((event.confidence || 0.88) * 100)}%</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Latency: <strong className="text-zinc-900 dark:text-zinc-100">{event.inferenceTimeMs || 1.6}ms</strong></span>
                </div>
              </div>
            </div>

            {/* Panel 2: Exact UI Token Diff Table */}
            <div className="mt-6 font-mono">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-emerald-500" />
                Adapted Design & Functional Tokens
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl glass-card flex justify-between items-center">
                  <span className="text-zinc-500 text-[11px]">Content Mode</span>
                  <span className="font-bold text-emerald-500">
                    {event.tokens.contentMode}
                  </span>
                </div>

                <div className="p-3 rounded-xl glass-card flex justify-between items-center">
                  <span className="text-zinc-500 text-[11px]">Layout Shell</span>
                  <span className="font-bold text-indigo-400">
                    {event.tokens.layoutShell}
                  </span>
                </div>

                <div className="p-3 rounded-xl glass-card flex justify-between items-center">
                  <span className="text-zinc-500 text-[11px]">Typography</span>
                  <span className="font-bold text-amber-400">
                    {event.tokens.typographyScale}
                  </span>
                </div>

                <div className="p-3 rounded-xl glass-card flex justify-between items-center">
                  <span className="text-zinc-500 text-[11px]">Navigation</span>
                  <span className="font-bold text-cyan-400">
                    {event.tokens.navMode}
                  </span>
                </div>

                <div className="p-3 rounded-xl glass-card flex justify-between items-center">
                  <span className="text-zinc-500 text-[11px]">Visual Theme</span>
                  <span className="font-bold text-zinc-200">
                    {event.tokens.theme}
                  </span>
                </div>

                <div className="p-3 rounded-xl glass-card flex justify-between items-center">
                  <span className="text-zinc-500 text-[11px]">Motion Profile</span>
                  <span className="font-bold text-zinc-200">
                    {event.tokens.motionLevel}
                  </span>
                </div>
              </div>

              <div className="mt-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 font-sans">
                <strong className="font-mono text-[10px] uppercase tracking-wider">Active Directive:</strong> {event.tokens.explainBanner}
              </div>
            </div>

            {/* Panel 3: Behavioral Evidence Breakdown */}
            <div className="mt-6 font-mono">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                Live Metric Divergence vs Population Baselines
              </h4>

              <div className="space-y-2.5">
                {event.explanations.map((exp, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl glass-card"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 capitalize">
                        {exp.feature.replace(/_/g, ' ')}
                      </span>
                      <span className="font-bold text-emerald-500">
                        {exp.impact}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1.5">
                      <span>Observed: <strong className="text-zinc-200">{exp.userValue} {exp.unit}</strong></span>
                      <span>Baseline: <strong>{exp.baselineValue || (exp as any).baseline} {exp.unit}</strong></span>
                    </div>

                    <p className="text-[11px] text-zinc-600 dark:text-zinc-300 font-sans italic">
                      {exp.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel 4: Feedback Loop & Undo */}
            <div className="mt-7 pt-5 border-t border-zinc-200/60 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
              <div className="text-zinc-500">
                {feedbackSubmitted ? (
                  <span className="text-emerald-500 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Feedback recorded for continual model fine-tuning.
                  </span>
                ) : (
                  <span>Was this adaptation accurate to your intent?</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleFeedback(true)}
                  disabled={Boolean(feedbackSubmitted)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-bold flex items-center gap-1.5 border border-emerald-500/30 transition-all disabled:opacity-50"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  Accurate
                </button>

                <button
                  onClick={() => handleFeedback(false)}
                  disabled={Boolean(feedbackSubmitted)}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold flex items-center gap-1.5 border border-rose-500/30 transition-all disabled:opacity-50"
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
