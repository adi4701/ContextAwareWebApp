'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';

interface ModelMetrics {
  data_note: string;
  data_type: string;
  n_samples: number;
  n_classes: number;
  classes: string[];
  features: string[];
  cv_accuracy_mean: number;
  cv_accuracy_std: number;
  test_accuracy: number;
  test_macro_f1: number;
  baseline_accuracy: number;
  baseline_macro_f1: number;
  confidence_threshold: number;
  per_class_f1: Record<string, number>;
  confusion_matrix: number[][];
  confusion_matrix_labels: string[];
  feature_importances: Record<string, number>;
}

export default function LandingPage() {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [previewState, setPreviewState] = useState<'fast_navigator' | 'reader' | 'struggling' | 'explorer' | 'balanced'>('balanced');
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    // Load honest model metrics from public/model-metrics.json
    fetch('/model-metrics.json')
      .then((res) => res.json())
      .then((data: ModelMetrics) => setMetrics(data))
      .catch((err) => console.debug('Could not load model-metrics.json', err));
  }, []);

  const previewStates = [
    { key: 'balanced', label: 'Balanced (Default)', color: 'bg-slate-500' },
    { key: 'fast_navigator', label: 'Fast Navigator', color: 'bg-purple-600' },
    { key: 'reader', label: 'Focused Reader', color: 'bg-emerald-600' },
    { key: 'struggling', label: 'Assisted Mode', color: 'bg-amber-600' },
    { key: 'explorer', label: 'Deep Explorer', color: 'bg-blue-600' },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300 font-sans selection:bg-blue-600 selection:text-white">
      {/* ════════════════════ NAVIGATION BAR ════════════════════ */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/85 dark:bg-gray-950/85 border-b border-gray-200/80 dark:border-gray-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-base shadow-md shadow-blue-500/20">
              C
            </div>
            <div>
              <span className="font-black text-lg tracking-tight text-gray-900 dark:text-white">ContextUI</span>
              <span className="ml-2 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                Adaptive ML
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-gray-600 dark:text-gray-300">
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How It Works</a>
            <a href="#preview" className="hover:text-blue-600 transition-colors">Live Preview</a>
            <a href="#states" className="hover:text-blue-600 transition-colors">Adaptation States</a>
            <a href="#results" className="hover:text-blue-600 transition-colors">Evaluation Results</a>
            <a href="#privacy" className="hover:text-blue-600 transition-colors">Privacy</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/demo"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>Launch Demo App</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ════════════════════ HERO SECTION ════════════════════ */}
      <section className="relative overflow-hidden pt-16 sm:pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold mb-6">
          <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span>Real-Time Behavioural Machine Learning Feedback Loop</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-gray-950 dark:text-white tracking-tight leading-tight max-w-4xl mx-auto">
          A UI that adapts to how you{' '}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            actually use it.
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
          An adaptive task manager that watches your interaction patterns—clicks, scroll velocities, idle gaps, and typing cadences—and reshapes its density, typography, and controls dynamically using Random Forest machine learning.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/demo"
            className="px-6 py-3.5 rounded-2xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center gap-2"
          >
            <span>Try the Live Demo</span>
            <span className="text-base">→</span>
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3.5 rounded-2xl text-sm font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-xs flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>View on GitHub</span>
          </a>
          <a
            href="#results"
            className="px-5 py-3.5 rounded-2xl text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors"
          >
            Model Metrics ↓
          </a>
        </div>
      </section>

      {/* ════════════════════ ARCHITECTURE & HOW IT WORKS ════════════════════ */}
      <section id="how-it-works" className="py-16 bg-white dark:bg-gray-900/60 border-y border-gray-200/80 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
              The Intelligent Feedback Loop
            </h2>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white mt-1">
              How ContextUI Observes and Reshapes in Real Time
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Three seamless stages operating on a rolling 20-second behavioral window with anti-flicker state smoothing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-md shadow-blue-500/20">
                1
              </div>
              <h4 className="text-base font-black text-gray-900 dark:text-white">Observe (Client Telemetry)</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                A non-intrusive client collector tracks 8 window features over a rolling 20s interval: click cadence, repeat targets, scroll velocity, depth, anonymous key frequency, idle ratios, and filter switches.
              </p>
              <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                🔒 Key values and typed text are strictly excluded.
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-base shadow-md shadow-indigo-500/20">
                2
              </div>
              <h4 className="text-base font-black text-gray-900 dark:text-white">Predict (FastAPI Classifier)</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                The feature vector is sent to a scikit-learn Random Forest model. If confidence falls below 45%, it defaults safely to Balanced. The backend applies 2-consecutive-state smoothing to prevent UI flicker.
              </p>
              <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                ⚡ Sub-10ms inference with explainability signals.
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black text-base shadow-md shadow-purple-500/20">
                3
              </div>
              <h4 className="text-base font-black text-gray-900 dark:text-white">Adapt (Dynamic Reshaping)</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                The UI adapts via CSS variables and conditional layout rendering: toggling density, scaling typography, expanding notes, pinning search, or displaying shortcut bars. Users can click Undo to revert anytime.
              </p>
              <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                ✨ Smooth Framer Motion transitions with reduced-motion support.
              </div>
            </div>
          </div>

          {/* Architecture Visual Box */}
          <div className="mt-10 p-6 rounded-3xl bg-gray-950 text-slate-100 border border-gray-800 shadow-xl">
            <div className="text-center mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                System Architecture Flow
              </span>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-xs font-mono">
              <div className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-center w-full md:w-auto">
                <span className="text-blue-400 font-bold">Frontend (Next.js 16)</span>
                <span className="block text-[10px] text-slate-400">8 Rolling Window Features</span>
              </div>
              <span className="text-slate-500 font-bold hidden md:inline">➔</span>
              <div className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-center w-full md:w-auto">
                <span className="text-emerald-400 font-bold">Backend (Express & Socket.io)</span>
                <span className="block text-[10px] text-slate-400">Telemetry Ingest & Smoothing</span>
              </div>
              <span className="text-slate-500 font-bold hidden md:inline">➔</span>
              <div className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-center w-full md:w-auto">
                <span className="text-purple-400 font-bold">ML Service (FastAPI)</span>
                <span className="block text-[10px] text-slate-400">Random Forest Classifier</span>
              </div>
              <span className="text-slate-500 font-bold hidden md:inline">➔</span>
              <div className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-center w-full md:w-auto">
                <span className="text-amber-400 font-bold">Socket.io Emission</span>
                <span className="block text-[10px] text-slate-400">Instant Adaptation & Undo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ INTERACTIVE LIVE PREVIEW ════════════════════ */}
      <section id="preview" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Interactive Preview
          </h2>
          <h3 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white mt-1">
            See How the Interface Morphs Across Personas
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Click any behavioural state below to preview how the task app adapts its layout, typography, and controls.
          </p>

          {/* Interactive State Selector Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            {previewStates.map((st) => (
              <button
                key={st.key}
                onClick={() => setPreviewState(st.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                  previewState === st.key
                    ? `${st.color} text-white shadow-md border-transparent`
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-400'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Morphing Mock Card */}
        <div className="max-w-2xl mx-auto p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-4">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              Preview Mode: <strong className="text-blue-600 dark:text-blue-400 capitalize">{previewState.replace('_', ' ')}</strong>
            </span>
            <span className="text-[11px] text-gray-400">
              {previewState === 'fast_navigator' && 'Compact Density + Shortcuts'}
              {previewState === 'reader' && 'Spacious + 120% Text + Notes Open'}
              {previewState === 'struggling' && '48px Action Buttons + Help Banner'}
              {previewState === 'explorer' && 'Pinned Search Highlight'}
              {previewState === 'balanced' && 'Standard Balanced Defaults'}
            </span>
          </div>

          {/* Simulated Fast Navigator Bar */}
          {previewState === 'fast_navigator' && (
            <div className="mb-4 p-2.5 rounded-xl bg-slate-900 text-slate-100 text-[11px] flex items-center justify-between font-mono animate-in fade-in">
              <span>⚡ Shortcut Bar: [N] New &bull; [/] Search &bull; [J/K] Navigate &bull; [X] Done</span>
              <span className="text-emerald-400">Active</span>
            </div>
          )}

          {/* Simulated Struggling Help Tips */}
          {previewState === 'struggling' && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-800 dark:text-amber-200 text-xs animate-in fade-in">
              💡 <strong>Assisted Mode:</strong> Hit buttons enlarged to 48px with clear action labels to prevent misclicks.
            </div>
          )}

          {/* Simulated Task Item */}
          <div
            className={`rounded-2xl border transition-all duration-300 ${
              previewState === 'fast_navigator'
                ? 'p-2.5 border-purple-300 dark:border-purple-800 bg-purple-50/20'
                : previewState === 'reader'
                ? 'p-6 border-emerald-300 dark:border-emerald-800 bg-emerald-50/20'
                : previewState === 'struggling'
                ? 'p-5 border-amber-300 dark:border-amber-800 bg-amber-50/20'
                : previewState === 'explorer'
                ? 'p-4 border-blue-400 dark:border-blue-700 bg-blue-50/20 ring-2 ring-blue-500/20'
                : 'p-4 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div
                  className={`rounded-xl border flex items-center justify-center shrink-0 ${
                    previewState === 'struggling'
                      ? 'w-9 h-9 border-2 border-amber-500 bg-amber-100 text-amber-700 font-bold text-xs'
                      : 'w-5 h-5 border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {previewState === 'struggling' && '✓'}
                </div>
                <div>
                  <h4
                    className={`font-bold transition-all ${
                      previewState === 'reader'
                        ? 'text-lg text-gray-900 dark:text-white leading-relaxed'
                        : previewState === 'fast_navigator'
                        ? 'text-xs text-gray-900 dark:text-white'
                        : 'text-sm text-gray-900 dark:text-white'
                    }`}
                  >
                    Deploy production behavioural model
                  </h4>
                  {(previewState === 'reader' || previewState === 'fast_navigator') && (
                    <p className={`text-gray-500 dark:text-gray-400 mt-1 ${previewState === 'reader' ? 'text-sm leading-relaxed' : 'text-xs'}`}>
                      Evaluated on 8,000 synthetic behavioral interaction windows with honest macro F1 score.
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div>
                {previewState === 'struggling' ? (
                  <div className="flex items-center gap-1.5">
                    <button className="px-3 py-2 rounded-xl text-xs font-black bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                      Edit Task
                    </button>
                    <button className="px-3 py-2 rounded-xl text-xs font-black bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400">
                      Delete
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">Default actions</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ ADAPTATION USE CASES (THE 4 STATES) ════════════════════ */}
      <section id="states" className="py-16 bg-slate-100/70 dark:bg-gray-900/40 border-y border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Personalized Workflows
            </h2>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white mt-1">
              Four Behavioural Profiles, Tailored in Real Time
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Every persona adapts specific UI attributes: density, text scaling, button targets, search priority, and notes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 shadow-xs space-y-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                Fast Navigator
              </span>
              <h4 className="text-base font-black">Speed & Keyboard Power</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Triggered by rapid clicking, low idle pauses, and frequent list switches. Switches to compact density and shows the keyboard shortcut cheat-bar.
              </p>
              <div className="text-[11px] font-mono text-purple-600 dark:text-purple-400 font-bold">
                density: compact &bull; shortcuts: true
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 shadow-xs space-y-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                Focused Reader
              </span>
              <h4 className="text-base font-black">Spacious & Readable</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Triggered by slow scroll speed, high scroll depth, and reading pauses. Expands spacing, increases typography scale to 120%, and auto-expands task notes.
              </p>
              <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                textScale: 1.2x &bull; notes: expanded
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 shadow-xs space-y-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                Assisted Mode
              </span>
              <h4 className="text-base font-black">Clear Affordances</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Triggered by repeat clicks on the same elements within 1.5s or hesitation. Enlarges button hit targets to 48px with text labels and shows helpful tips.
              </p>
              <div className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                targetSize: large (48px) &bull; help: true
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 shadow-xs space-y-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Deep Explorer
              </span>
              <h4 className="text-base font-black">Search & Discovery</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Triggered by typing bursts and frequent tab changes. Pins the search bar with active focus highlight and surfaces quick category filters.
              </p>
              <div className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-bold">
                emphasizeSearch: true &bull; pinned
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ RESULTS & EVALUATION (HONEST METRICS) ════════════════════ */}
      <section id="results" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold mb-3">
            <span>Data: {metrics?.data_type || 'synthetic'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white">
            Honest Model Evaluation
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
            {metrics?.data_note || 'Trained on simulated interaction data only. Real-world accuracy will be lower.'}
          </p>
        </div>

        {/* Dynamic Metric Cards (zero hardcoded numbers) */}
        {metrics && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xs">
                <span className="text-xs text-gray-500 font-bold">Test Accuracy</span>
                <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">
                  {(metrics.test_accuracy * 100).toFixed(1)}%
                </div>
                <span className="text-[11px] text-gray-400">Held-out 20% validation split</span>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xs">
                <span className="text-xs text-gray-500 font-bold">Macro F1 Score</span>
                <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                  {(metrics.test_macro_f1 * 100).toFixed(1)}%
                </div>
                <span className="text-[11px] text-gray-400">Balanced across all 4 classes</span>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xs">
                <span className="text-xs text-gray-500 font-bold">Majority Baseline</span>
                <div className="text-3xl font-black text-gray-700 dark:text-gray-300 mt-1">
                  {(metrics.baseline_accuracy * 100).toFixed(1)}%
                </div>
                <span className="text-[11px] text-gray-400">Rule-based trivial majority baseline</span>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xs">
                <span className="text-xs text-gray-500 font-bold">Synthetic Samples</span>
                <div className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-1">
                  {metrics.n_samples.toLocaleString()}
                </div>
                <span className="text-[11px] text-gray-400">Generated interaction windows</span>
              </div>
            </div>

            {/* Confusion Matrix & Feature Importances */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Confusion Matrix Table */}
              <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xs">
                <h4 className="text-sm font-black text-gray-900 dark:text-white mb-1">
                  Confusion Matrix (Held-out Test Set)
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Actual classes (rows) vs Predicted classes (columns)
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-center border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="py-2 text-left font-semibold text-gray-400">Actual \ Pred</th>
                        {metrics.confusion_matrix_labels.map((l) => (
                          <th key={l} className="py-2 px-2 font-bold capitalize text-gray-700 dark:text-gray-300">
                            {l.replace('_', ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.confusion_matrix.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-2.5 text-left font-bold capitalize text-gray-700 dark:text-gray-300">
                            {metrics.confusion_matrix_labels[rIdx].replace('_', ' ')}
                          </td>
                          {row.map((val, cIdx) => (
                            <td
                              key={cIdx}
                              className={`py-2.5 px-2 font-mono font-bold ${
                                rIdx === cIdx
                                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                                  : val > 0
                                  ? 'bg-red-50 dark:bg-red-950/30 text-red-600'
                                  : 'text-gray-400'
                              }`}
                            >
                              {val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Feature Importances */}
              <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xs">
                <h4 className="text-sm font-black text-gray-900 dark:text-white mb-1">
                  Random Forest Feature Importances
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Gini importance contribution per behavioral feature
                </p>

                <div className="space-y-2.5">
                  {Object.entries(metrics.feature_importances)
                    .sort(([, a], [, b]) => b - a)
                    .map(([feat, imp]) => {
                      const pct = Math.round(imp * 100);
                      return (
                        <div key={feat} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-gray-700 dark:text-gray-300">{feat}</span>
                            <span className="font-bold text-gray-500">{pct}%</span>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-600 dark:bg-blue-400 h-full rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ════════════════════ PRIVACY FIRST SECTION ════════════════════ */}
      <section id="privacy" className="py-16 bg-slate-100/70 dark:bg-gray-900/60 border-y border-gray-200/80 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 mb-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white">
            Privacy-First Architecture by Design
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto">
            We believe intelligent adaptation should never come at the expense of personal privacy. ContextUI is engineered with hardcoded architectural safeguards:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mt-6">
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400">Zero Keystrokes</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Key events track timestamp counts only. Key codes, character values, and text input are never inspected or recorded.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400">Explicit Consent</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                A visible consent toggle governs all tracking. When disabled, zero events are buffered and zero network calls are made.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400">Instant Undo</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Users retain full sovereignty. Clicking Undo immediately resets to Balanced and pauses automated adaptation for 2 minutes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ TECH STACK SECTION ════════════════════ */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-6">
          Technologies Powering ContextUI
        </h2>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-3xl mx-auto text-xs font-bold text-gray-700 dark:text-gray-300">
          <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xs">
            Next.js 16 (App Router)
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xs">
            TypeScript
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xs">
            Tailwind CSS
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xs">
            Framer Motion
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xs">
            Zustand
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xs">
            FastAPI
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xs">
            scikit-learn (Random Forest)
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xs">
            Express / Node.js
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xs">
            MongoDB & Mongoose
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xs">
            Socket.io
          </span>
        </div>
      </section>

      {/* ════════════════════ FOOTER ════════════════════ */}
      <footer className="border-t border-gray-200/80 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 py-8 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div>
            <p className="font-bold text-gray-800 dark:text-gray-200">
              ContextUI &mdash; Adaptive Task Manager
            </p>
            <p className="text-[11px] mt-0.5">Minor Project &bull; B.Tech CSE Data Science, Amity University 2026</p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/demo" className="hover:text-blue-600 transition-colors">
              Live Demo
            </Link>
            <a href="#results" className="hover:text-blue-600 transition-colors">
              Model Evaluation
            </a>
            <a href="#privacy" className="hover:text-blue-600 transition-colors">
              Privacy Guarantee
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
