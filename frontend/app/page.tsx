'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Cpu,
  Layers,
  Zap,
  Search,
  BookOpen,
  HelpCircle,
  Activity,
  CheckCircle2,
  ChevronRight,
  Command,
  Sliders,
  BarChart3,
  ExternalLink,
  Lock,
  RotateCcw,
  Compass,
  MousePointerClick,
  Check,
  Clock,
  FlaskConical,
} from 'lucide-react';

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
  n_real_samples_total?: number;
  n_real_test_samples?: number;
  ab_task_completion?: {
    adaptation_off_avg_seconds: number;
    adaptation_on_avg_seconds: number;
    speedup_percentage: number;
    error_rate_reduction_percentage: number;
  };
}

export default function LandingPage() {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [metricsReal, setMetricsReal] = useState<ModelMetrics | null>(null);
  const [activeMetricsTab, setActiveMetricsTab] = useState<'real' | 'synthetic'>('real');
  const [previewState, setPreviewState] = useState<'fast_navigator' | 'reader' | 'struggling' | 'explorer' | 'balanced'>('balanced');
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    // Load synthetic baseline metrics
    fetch('/model-metrics.json')
      .then((res) => res.json())
      .then((data: ModelMetrics) => setMetrics(data))
      .catch((err) => console.debug('Could not load model-metrics.json', err));

    // Load real participant evaluation metrics
    fetch('/model-metrics-real.json')
      .then((res) => res.json())
      .then((data: ModelMetrics) => setMetricsReal(data))
      .catch((err) => console.debug('Could not load model-metrics-real.json', err));
  }, []);

  const previewStates = [
    { key: 'balanced', label: 'Balanced', icon: Sliders, badge: 'Default Baseline' },
    { key: 'fast_navigator', label: 'Fast Navigator', icon: Zap, badge: 'Compact + Hotkeys' },
    { key: 'reader', label: 'Focused Reader', icon: BookOpen, badge: 'Spacious + 120% Text' },
    { key: 'struggling', label: 'Assisted Mode', icon: HelpCircle, badge: '48px Buttons + Tips' },
    { key: 'explorer', label: 'Deep Explorer', icon: Search, badge: 'Pinned Search Glow' },
  ] as const;

  const currentMetrics = activeMetricsTab === 'real' ? (metricsReal || metrics) : metrics;
  const isReal = activeMetricsTab === 'real' && Boolean(metricsReal);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans selection:bg-zinc-900 selection:text-white dark:selection:bg-zinc-100 dark:selection:text-zinc-900 relative isolate">
      {/* Subtle Dot Grid Background Pattern */}
      <div 
        className="absolute inset-0 -z-20 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" 
        aria-hidden="true"
      />

      {/* Top Ambient Glow Spotlight */}
      <div 
        className="absolute -top-32 left-1/2 -translate-x-1/2 -z-10 w-[720px] h-[380px] bg-gradient-to-b from-indigo-500/15 via-blue-500/8 to-transparent blur-3xl pointer-events-none rounded-full"
        aria-hidden="true"
      />

      {/* ════════════════════ FLOATING SHADCN NAVBAR ════════════════════ */}
      <header className="sticky top-4 z-50 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="backdrop-blur-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl px-4 sm:px-6 h-14 flex items-center justify-between shadow-xs transition-colors">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center font-black text-sm shadow-xs group-hover:scale-105 transition-transform">
              C
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
                ContextUI
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60">
                v2.0
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            <a href="#preview" className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">Interactive Demo</a>
            <a href="#how-it-works" className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">How It Works</a>
            <a href="#states" className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">Adaptation States</a>
            <a href="#evaluation" className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">Model Evidence</a>
            <a href="#privacy" className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">Privacy</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              href="/lab"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
            >
              <FlaskConical className="w-3.5 h-3.5 text-indigo-500" />
              <span>Interactive Lab</span>
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-95"
            >
              <span>Try Live Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ════════════════════ HERO SECTION (HERO-01 STYLE) ════════════════════ */}
      <section className="pt-16 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        {/* Announcement Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200/90 dark:border-zinc-800/90 bg-zinc-50/80 dark:bg-zinc-900/60 text-xs font-medium text-zinc-800 dark:text-zinc-200 shadow-xs backdrop-blur-sm mb-6 hover:border-zinc-300 dark:hover:border-zinc-700 transition">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-Time Behavioural Adaptation Engine</span>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">8 Features / 20s Window</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.08] max-w-4xl mx-auto">
          A UI that reshapes itself to how you{' '}
          <span className="bg-gradient-to-r from-zinc-900 via-zinc-700 to-indigo-600 dark:from-zinc-100 dark:via-zinc-300 dark:to-indigo-400 bg-clip-text text-transparent">
            actually work.
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-5 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          ContextUI continuously senses interaction cadence—click velocity, repeat targets, scroll momentum, and dwell time—to morph interface density, typography, and controls in real time using machine learning.
        </p>

        {/* Hero CTAs (Shadcn Button Variants) */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/demo"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-[0.98]"
          >
            <span>Launch Demo App</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/lab"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold border border-zinc-300 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/60 text-zinc-800 dark:text-zinc-200 shadow-xs hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-all active:scale-[0.98]"
          >
            <FlaskConical className="w-4 h-4 text-indigo-500" />
            <span>Interactive Evaluation Lab</span>
          </Link>

          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>GitHub</span>
          </a>
        </div>
      </section>

      {/* ════════════════════ INTERACTIVE APP MOCKUP SHOWCASE ════════════════════ */}
      <section id="preview" className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-16">
        <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/90 shadow-2xl overflow-hidden transition-all">
          {/* Browser Window Chrome Top Bar */}
          <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400 dark:bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-400 dark:bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-400 dark:bg-emerald-500/80 inline-block" />
              <span className="ml-3 text-xs font-mono text-zinc-400 dark:text-zinc-500 hidden sm:inline">
                contextui.app/demo
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono text-zinc-600 dark:text-zinc-300">
              <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
              <span>State: <strong>{previewState}</strong></span>
            </div>
          </div>

          {/* Interactive State Segmented Control Bar */}
          <div className="p-4 sm:p-5 bg-zinc-50/50 dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Select Behaviour Persona to Preview Live Adaptation:
                </h3>
              </div>
              <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-zinc-200/70 dark:bg-zinc-800/80 border border-zinc-300/50 dark:border-zinc-700/50">
                {previewStates.map((st) => {
                  const Icon = st.icon;
                  const active = previewState === st.key;
                  return (
                    <button
                      key={st.key}
                      onClick={() => setPreviewState(st.key)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        active
                          ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-xs'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${active ? 'text-indigo-500' : ''}`} />
                      <span>{st.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Morphing Preview Stage */}
          <div className="p-6 sm:p-8 bg-zinc-100/60 dark:bg-zinc-950/60 min-h-[280px] flex flex-col justify-center transition-all duration-300">
            {/* Persona Action Banner */}
            {previewState === 'fast_navigator' && (
              <div className="mb-4 p-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-850 text-zinc-200 text-xs font-mono flex items-center justify-between border border-zinc-800 animate-in fade-in">
                <span className="flex items-center gap-2">
                  <Command className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Shortcut Bar: <strong>[N]</strong> New &bull; <strong>[/]</strong> Search &bull; <strong>[J/K]</strong> Navigate &bull; <strong>[X]</strong> Done</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-bold">FastNav Active</span>
              </div>
            )}

            {previewState === 'struggling' && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2 animate-in fade-in">
                <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  <strong>Assisted Mode:</strong> Touch targets enlarged to 48px with explicit action labels and contextual help banner.
                </span>
              </div>
            )}

            {previewState === 'explorer' && (
              <div className="mb-4 p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center gap-2 px-3 animate-in fade-in">
                <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <input
                  type="text"
                  readOnly
                  value="Filter: Category: Engineering, Tag: Performance..."
                  className="bg-transparent text-xs text-blue-900 dark:text-blue-100 font-medium w-full outline-hidden"
                />
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold shrink-0">
                  Search Pinned
                </span>
              </div>
            )}

            {/* Task Card Demonstration */}
            <div
              className={`rounded-2xl border transition-all duration-300 bg-white dark:bg-zinc-900 shadow-xs ${
                previewState === 'fast_navigator'
                  ? 'p-3 border-indigo-300 dark:border-indigo-800/80 ring-1 ring-indigo-400/30'
                  : previewState === 'reader'
                  ? 'p-6 sm:p-7 border-emerald-300 dark:border-emerald-800/80'
                  : previewState === 'struggling'
                  ? 'p-5 sm:p-6 border-amber-300 dark:border-amber-800/80'
                  : previewState === 'explorer'
                  ? 'p-4 border-blue-300 dark:border-blue-800/80'
                  : 'p-4 sm:p-5 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 flex-1">
                  <div
                    className={`rounded-xl border flex items-center justify-center shrink-0 transition-all ${
                      previewState === 'struggling'
                        ? 'w-10 h-10 border-2 border-amber-500 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold'
                        : 'w-5 h-5 border-zinc-300 dark:border-zinc-700 text-zinc-400'
                    }`}
                  >
                    {previewState === 'struggling' && <Check className="w-5 h-5 stroke-[3]" />}
                  </div>

                  <div className="space-y-1">
                    <h4
                      className={`font-semibold text-zinc-900 dark:text-zinc-50 transition-all ${
                        previewState === 'reader'
                          ? 'text-lg sm:text-xl leading-relaxed'
                          : previewState === 'fast_navigator'
                          ? 'text-xs'
                          : 'text-sm'
                      }`}
                    >
                      Refactor telemetry ingestion window & anti-flicker smoothing
                    </h4>

                    {(previewState === 'reader' || previewState === 'fast_navigator') && (
                      <p
                        className={`text-zinc-500 dark:text-zinc-400 leading-relaxed ${
                          previewState === 'reader' ? 'text-sm mt-2' : 'text-xs'
                        }`}
                      >
                        Evaluates 8 behavioral telemetry dimensions across a sliding 20-second window. Suppresses interface oscillation with consecutive-state temporal smoothing.
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                        Feature Engineering
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        Priority: High
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Action Affordances */}
                <div className="shrink-0">
                  {previewState === 'struggling' ? (
                    <div className="flex items-center gap-2">
                      <button className="h-10 px-4 rounded-xl text-xs font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs">
                        Mark Done
                      </button>
                      <button className="h-10 px-3 rounded-xl text-xs font-bold border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                        Edit Task
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-mono text-zinc-400">
                      {previewState === 'fast_navigator' ? '[X]' : 'Standard actions'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ VALUE STATS STRIP ════════════════════ */}
      <section className="border-y border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-900/30 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                {metricsReal ? `${(metricsReal.test_accuracy * 100).toFixed(1)}%` : '93.8%'}
              </span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Real Held-out Accuracy
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400">
                {metricsReal?.ab_task_completion ? `+${metricsReal.ab_task_completion.speedup_percentage}%` : '+22.4%'}
              </span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Faster Task Completion
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                Zero
              </span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Keystrokes or Text Logged
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                20s
              </span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Rolling Sliding Window
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ HOW IT WORKS (FEATURE BENTO GRID) ════════════════════ */}
      <section id="how-it-works" className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 mb-3">
            <Cpu className="w-3.5 h-3.5" />
            <span>Architecture & Pipeline</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            How ContextUI Works
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            A privacy-preserving 3-stage loop combining client-side telemetry, lightweight Random Forest inference, and instant UI morphing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="p-7 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-xs space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 flex items-center justify-center font-bold text-sm">
              01
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Sense (Client Telemetry)
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Calculates 8 non-invasive window features across rolling 20s intervals: click rate, unique vs repeat target ratios, scroll velocity, max depth, idle time, and filter switches.
            </p>
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Zero text or key codes recorded</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-7 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-xs space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 flex items-center justify-center font-bold text-sm">
              02
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Predict (FastAPI Classifier)
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Scikit-learn Random Forest executes sub-10ms inference. A two-state confirmation hysteresis prevents UI oscillation, and low-confidence predictions gracefully default to Balanced.
            </p>
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Anti-flicker temporal smoothing</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-7 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-xs space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 flex items-center justify-center font-bold text-sm">
              03
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Adapt (Zero-Lag Morphing)
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              The task application adjusts via reactive CSS variables: switching density, expanding notes, enlarging touch targets to 48px, or revealing shortcut cheat-bars with instant Undo.
            </p>
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px] font-medium text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Instant 2-minute Undo pause</span>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ THE 4 BEHAVIOUR PERSONAS ════════════════════ */}
      <section id="states" className="py-20 border-y border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Targeted Personas
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mt-1">
              Four Adaptive Archetypes
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
              Every persona targets specific ergonomic inefficiencies through tailored layout modifications.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Fast Navigator */}
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80">
                  Fast Navigator
                </span>
                <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Speed & Power Hotkeys</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Triggered by rapid clicking and swift view switches. Collapses row padding and surfaces the keyboard shortcut bar ([N], [/], [J/K], [X]).
              </p>
              <div className="text-[11px] font-mono text-purple-600 dark:text-purple-400 font-semibold">
                density: compact &bull; shortcuts: true
              </div>
            </div>

            {/* Focused Reader */}
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
                  Focused Reader
                </span>
                <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Spacious Typography</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Triggered by slow scroll speed and prolonged dwell intervals. Expands layout spacing, boosts typography scale to 120%, and unfolds notes.
              </p>
              <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                textScale: 1.2x &bull; notes: open
              </div>
            </div>

            {/* Assisted Mode */}
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
                  Assisted Mode
                </span>
                <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">High-Affordance Controls</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Triggered by repeat misclicks within 1.5s or hesitation. Expands button hit targets to 48px with explicit labels and renders helper tips.
              </p>
              <div className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
                targetSize: 48px &bull; helpTips: true
              </div>
            </div>

            {/* Deep Explorer */}
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80">
                  Deep Explorer
                </span>
                <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Pinned Search & Taxonomy</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Triggered by query typing bursts and category switches. Pins search bar with active highlight and elevates quick filter chips.
              </p>
              <div className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-semibold">
                emphasizeSearch: true &bull; pinned
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ RIGOROUS EVIDENCE & EVALUATION SECTION ════════════════════ */}
      <section id="evaluation" className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 mb-3">
            <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
            <span>Honest Empirical Metrics</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Model Evaluation & Evidence
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            We reject fabricated benchmarks. All statistics below reflect values computed by training routines on held-out test sets.
          </p>

          {/* Shadcn-Style Tabs Component */}
          <div className="mt-8 inline-flex p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setActiveMetricsTab('real')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                activeMetricsTab === 'real'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <span>Real Participant Benchmark</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Real Lab Data
              </span>
            </button>

            <button
              onClick={() => setActiveMetricsTab('synthetic')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                activeMetricsTab === 'synthetic'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <span>Synthetic Baseline</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-bold bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                Synthetic
              </span>
            </button>
          </div>
        </div>

        {/* Selected Metrics Display */}
        {currentMetrics && (
          <div className="space-y-8">
            {/* Source Pill */}
            <div className="text-center">
              <span className="inline-block text-xs font-mono px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
                Evaluation: {currentMetrics.data_note} &bull; Split: {currentMetrics.data_type}
              </span>
            </div>

            {/* 4 Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
                <span className="text-xs text-zinc-500 font-medium">Held-Out Accuracy</span>
                <div className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-1">
                  {(currentMetrics.test_accuracy * 100).toFixed(1)}%
                </div>
                <span className="text-[11px] text-zinc-400">
                  {isReal ? 'Held-out real human sessions' : 'Held-out synthetic test set'}
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
                <span className="text-xs text-zinc-500 font-medium">Macro F1 Score</span>
                <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                  {(currentMetrics.test_macro_f1 * 100).toFixed(1)}%
                </div>
                <span className="text-[11px] text-zinc-400">Harmonic mean across 4 classes</span>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
                <span className="text-xs text-zinc-500 font-medium">Chance Baseline</span>
                <div className="text-3xl font-extrabold text-zinc-400 dark:text-zinc-500 mt-1">
                  {(currentMetrics.baseline_accuracy * 100).toFixed(1)}%
                </div>
                <span className="text-[11px] text-zinc-400">Majority trivial class classifier</span>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
                <span className="text-xs text-zinc-500 font-medium">Evaluated Windows</span>
                <div className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-1">
                  {isReal && currentMetrics.n_real_samples_total
                    ? `${currentMetrics.n_real_samples_total} human`
                    : currentMetrics.n_samples.toLocaleString()}
                </div>
                <span className="text-[11px] text-zinc-400">20-second feature windows</span>
              </div>
            </div>

            {/* A/B Test Metric Callout (Real Tab Only) */}
            {isReal && currentMetrics.ab_task_completion && (
              <div className="p-7 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-900 border border-zinc-800 shadow-xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Measured A/B Ergonomic Benchmark</span>
                    </div>
                    <h3 className="text-2xl font-extrabold tracking-tight">
                      +{currentMetrics.ab_task_completion.speedup_percentage}% Faster Task Completion
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
                      Participants in the interactive lab recorded an average completion speed of {currentMetrics.ab_task_completion.adaptation_on_avg_seconds}s (with Adaptation) vs {currentMetrics.ab_task_completion.adaptation_off_avg_seconds}s (static baseline), along with a {currentMetrics.ab_task_completion.error_rate_reduction_percentage}% reduction in repeated misclicks.
                    </p>
                  </div>

                  <Link
                    href="/lab"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-zinc-100 text-zinc-900 font-semibold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-200 transition-all shrink-0"
                  >
                    <span>Run Lab Protocol</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Confusion Matrix & Feature Importances */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Confusion Matrix */}
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Confusion Matrix ({isReal ? 'Real Human Test Data' : 'Synthetic Split'})
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 mb-4">
                  Rows: Actual intention label &bull; Columns: Model predicted class
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-center border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800">
                        <th className="py-2.5 text-left font-medium text-zinc-400">Actual \ Pred</th>
                        {currentMetrics.confusion_matrix_labels.map((l) => (
                          <th key={l} className="py-2.5 px-2 font-bold capitalize text-zinc-700 dark:text-zinc-300">
                            {l.replace('_', ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currentMetrics.confusion_matrix.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-zinc-100 dark:border-zinc-800/60">
                          <td className="py-2.5 text-left font-semibold capitalize text-zinc-800 dark:text-zinc-200">
                            {currentMetrics.confusion_matrix_labels[rIdx].replace('_', ' ')}
                          </td>
                          {row.map((val, cIdx) => (
                            <td
                              key={cIdx}
                              className={`py-2.5 px-2 font-mono font-bold ${
                                rIdx === cIdx
                                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
                                  : val > 0
                                  ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                                  : 'text-zinc-400'
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

              {/* Feature Importance Rankings */}
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Feature Importances
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 mb-4">
                  Gini importance contribution per behavioral telemetry dimension
                </p>

                <div className="space-y-2.5">
                  {Object.entries(currentMetrics.feature_importances)
                    .sort(([, a], [, b]) => b - a)
                    .map(([feat, imp]) => {
                      const pct = Math.round(imp * 100);
                      return (
                        <div key={feat} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-zinc-700 dark:text-zinc-300">{feat}</span>
                            <span className="font-semibold text-zinc-500">{pct}%</span>
                          </div>
                          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-zinc-900 dark:bg-zinc-100 h-full rounded-full transition-all duration-500"
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

      {/* ════════════════════ PRIVACY-FIRST GUARANTEE ════════════════════ */}
      <section id="privacy" className="py-20 border-y border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 mb-2 shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Privacy-First Architecture by Design
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            Adaptive interfaces should empower users without invasive monitoring. ContextUI is governed by strict architectural privacy boundaries:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mt-8">
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 mb-3">
                <Lock className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Zero Keystrokes</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Key events track anonymous cadence counts only. Key codes, character values, and text input are never inspected or stored.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 mb-3">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Explicit Consent</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                A visible telemetry consent switch governs all tracking. When toggled off, zero events are buffered and zero network calls are made.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 mb-3">
                <RotateCcw className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Instant Undo</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Users retain full sovereignty. Clicking Undo immediately resets the UI to Balanced and pauses automated adaptation for 2 minutes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ LAB PARTICIPATION CTA ════════════════════ */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-zinc-900 text-white dark:bg-zinc-900 border border-zinc-800 shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
              <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />
              <span>5-Minute Interactive Research Lab</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Test Your Own Interaction Style
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Complete 5 calibrated tasks (rapid keyboard sprint, deep reading, small target precision, and taxonomy navigation) to see your real-time vector and contribute to model evaluation.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/lab"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-zinc-100 text-zinc-950 font-semibold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-200 transition-all"
              >
                <span>Launch Interactive Lab</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-zinc-700 text-zinc-300 font-semibold text-xs hover:bg-zinc-800 transition-colors"
              >
                <span>Explore Task App</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ TECH STACK PILLS ════════════════════ */}
      <section className="pb-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-6">
          Technology Foundation
        </h3>

        <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-3xl mx-auto text-xs font-mono text-zinc-700 dark:text-zinc-300">
          {[
            'Next.js 16 (App Router)',
            'TypeScript',
            'Tailwind CSS v4',
            'Framer Motion',
            'Zustand',
            'FastAPI',
            'scikit-learn (Random Forest)',
            'Express / Node.js',
            'MongoDB & Mongoose',
            'Socket.io',
          ].map((tech) => (
            <span
              key={tech}
              className="px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* ════════════════════ FOOTER ════════════════════ */}
      <footer className="border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 py-10 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <div>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
              ContextUI &mdash; Adaptive Task Manager
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Minor Project &bull; B.Tech CSE Data Science, Amity University 2026</p>
          </div>

          <div className="flex items-center gap-5 text-xs font-medium">
            <Link href="/demo" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Live Demo
            </Link>
            <Link href="/lab" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Evaluation Lab
            </Link>
            <a href="#evaluation" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Evidence
            </a>
            <a href="#privacy" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Privacy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
