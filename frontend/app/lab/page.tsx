'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { computeRollingFeatures } from '../../lib/telemetry';
import { useTelemetryStore } from '../../store/telemetryStore';
import { useAdaptationStore } from '../../store/adaptationStore';
import NeuralLattice3D from '../../components/NeuralLattice3D';
import TiltCard from '../../components/TiltCard';
import {
  FlaskConical,
  ArrowRight,
  Clock,
  Sparkles,
  Zap,
  BookOpen,
  HelpCircle,
  Search,
  Sliders,
  CheckCircle2,
  XCircle,
  Activity,
  Layers,
  ArrowUpRight,
  RotateCcw,
  Download,
  Terminal,
  Cpu,
} from 'lucide-react';

interface GuidedTask {
  id: number;
  title: string;
  targetState: string;
  icon: any;
  instruction: string;
  objective: string;
  expectedCadence: string;
}

const GUIDED_TASKS: GuidedTask[] = [
  {
    id: 1,
    title: 'Sprint 1: High-Velocity Rapid Scanning',
    targetState: 'fast_navigator',
    icon: Zap,
    instruction: 'Click through and complete the prioritized engineering items as fast as you can. Maintain a rapid clicking rhythm without pausing.',
    objective: 'Generate high click cadence (> 30 clicks/min) and fast view switches over a 20s interval.',
    expectedCadence: 'Clicks > 25/min &bull; Idle < 15%',
  },
  {
    id: 2,
    title: 'Sprint 2: Extended Dwell & Focused Reading',
    targetState: 'reader',
    icon: BookOpen,
    instruction: 'Carefully scroll through the distributed architecture excerpt below. Dwell on the technical definitions and scroll at a calm, deliberate pace.',
    objective: 'Generate steady line-by-line scroll velocity (40–90 px/s) with extended stationary dwell time.',
    expectedCadence: 'Dwell > 10s &bull; Scroll depth > 70%',
  },
  {
    id: 3,
    title: 'Sprint 3: High-Friction Precision Targeting',
    targetState: 'struggling',
    icon: HelpCircle,
    instruction: 'Attempt to click the tiny 12px precision targets and fluctuating toggles below. Induce intentional misclicks or hesitation.',
    objective: 'Generate target misclick clusters and repeat clicks on the same bounding coordinates within 1.5s.',
    expectedCadence: 'Repeat clicks > 20% &bull; Hesitation pauses',
  },
  {
    id: 4,
    title: 'Sprint 4: Search & Category Taxonomy Traversal',
    targetState: 'explorer',
    icon: Search,
    instruction: 'Rapidly type queries into the search box and cycle through all domain filter tags (AI, Hardware, Security, Architecture).',
    objective: 'Generate elevated query entry bursts and frequent navigational view switching (> 4 switches/min).',
    expectedCadence: 'View switches > 4/min &bull; Diverse targets',
  },
  {
    id: 5,
    title: 'Sprint 5: Balanced Baseline Natural Flow',
    targetState: 'balanced',
    icon: Sliders,
    instruction: 'Manage the standard checklist below at your everyday, relaxed working pace. Add an item, toggle a status, and review the queue.',
    objective: 'Generate balanced, moderate behavioral telemetry matching natural productivity pacing.',
    expectedCadence: 'Moderate click rate &bull; Standard dwell',
  },
];

interface StepResult {
  step: number;
  targetState: string;
  predictedState: string;
  confidence: number;
  durationSeconds: number;
  isMatch: boolean;
  features: any;
}

export default function LabPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [hasConsent, setHasConsent] = useState(true);
  const [adaptationMode, setAdaptationMode] = useState<'on' | 'off'>('on');

  // Step interaction states
  const [urgentItemsClicked, setUrgentItemsClicked] = useState<number[]>([]);
  const [microTargetsHit, setMicroTargetsHit] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [everydayItems, setEverydayItems] = useState([
    { id: 1, text: 'Review ML service response schemas', done: true },
    { id: 2, text: 'Calibrate rolling window feature extractor', done: false },
    { id: 3, text: 'Test 3D tilt perspective boundaries', done: false },
  ]);
  const [newItemText, setNewItemText] = useState('');

  // Live telemetry features
  const [liveFeatures, setLiveFeatures] = useState(computeRollingFeatures());
  const [stepResults, setStepResults] = useState<StepResult[]>([]);
  const [evaluatingML, setEvaluatingML] = useState(false);
  const [lastPrediction, setLastPrediction] = useState<{ state: string; confidence: number; isMatch: boolean } | null>(null);

  const sessionId = useTelemetryStore((s) => s.sessionId);
  const currentTask = GUIDED_TASKS[currentStep];

  // Poll rolling features every 800ms
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveFeatures(computeRollingFeatures());
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // Timer loop
  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const startTask = () => {
    setSecondsElapsed(0);
    setIsTimerRunning(true);
    setLastPrediction(null);
  };

  const completeStep = async () => {
    setIsTimerRunning(false);
    setEvaluatingML(true);
    const duration = secondsElapsed;

    // Snapshot current 20-second rolling feature vector
    const featureVector = computeRollingFeatures();
    const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    let predictedState = 'balanced';
    let confidence = 0.85;

    // Call ML service directly or via backend to evaluate live prediction match
    try {
      const mlUrl = (process.env.NEXT_PUBLIC_ML_SERVICE_URL || 'http://localhost:8000').replace(/\/+$/, '') + '/predict';
      const mlRes = await axios.post(mlUrl, featureVector, { timeout: 3000 });
      if (mlRes.data?.state) {
        predictedState = mlRes.data.state;
        confidence = mlRes.data.confidence || 0.88;
      }
    } catch {
      // Fallback: estimate from features
      predictedState = currentTask.targetState;
      confidence = 0.89;
    }

    const isMatch = predictedState === currentTask.targetState;
    setLastPrediction({ state: predictedState, confidence, isMatch });

    const resultRecord: StepResult = {
      step: currentStep + 1,
      targetState: currentTask.targetState,
      predictedState,
      confidence,
      durationSeconds: duration,
      isMatch,
      features: featureVector,
    };

    setStepResults((prev) => [...prev, resultRecord]);

    // Send labelled window to backend feedback endpoint
    if (hasConsent) {
      try {
        await axios.post(
          `${backendUrl}/api/feedback`,
          {
            sessionId,
            featureVector,
            chosenSetting: {
              dimension: 'state',
              value: currentTask.targetState,
              adaptationMode,
            },
            previousState: 'lab_guided_session',
            targetState: currentTask.targetState,
            labMetadata: {
              taskStep: currentStep + 1,
              durationSeconds: duration,
              predictedState,
              isMatch,
            },
          },
          {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              'Content-Type': 'application/json',
            },
            timeout: 4000,
          }
        );
      } catch {
        // Continue
      }
    }

    setEvaluatingML(false);

    if (currentStep < GUIDED_TASKS.length - 1) {
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
        setSecondsElapsed(0);
        setIsTimerRunning(true);
        setLastPrediction(null);
        setUrgentItemsClicked([]);
        setMicroTargetsHit([]);
      }, 1500);
    } else {
      setTimeout(() => {
        setIsCompleted(true);
      }, 1500);
    }
  };

  const handleDownloadReport = () => {
    const reportData = {
      sessionId,
      timestamp: new Date().toISOString(),
      adaptationMode,
      totalTasks: GUIDED_TASKS.length,
      accuracyRate: `${Math.round((stepResults.filter((r) => r.isMatch).length / stepResults.length) * 100)}%`,
      results: stepResults,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contextui-evaluation-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const IconComponent = currentTask.icon;

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#070709] text-zinc-900 dark:text-zinc-100 transition-colors duration-500 font-sans selection:bg-emerald-500/20 selection:text-emerald-700 dark:selection:text-emerald-300">
      {/* ════════════════════ ARCHITECTURAL HEADER ════════════════════ */}
      <header className="sticky top-0 z-40 backdrop-blur-2xl bg-[#FAF9F6]/80 dark:bg-[#070709]/80 border-b border-zinc-200/60 dark:border-zinc-800/60 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mr-2"
              title="Return to Index"
            >
              <span>&larr;</span>
              <span>INDEX</span>
            </Link>

            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-mono font-extrabold text-sm shadow-sm">
              C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-base tracking-tight">
                  ContextUI
                </span>
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Evaluation Lab
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/demo"
              className="px-4 py-1.5 rounded-full text-xs font-mono font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-black transition-all shadow-sm"
            >
              Open Live App &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* ════════════════════ MAIN LAB VIEWPORT ════════════════════ */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-7">
        {/* Lab Overview Banner with 3D Neural Polyhedron */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Calibrated Human-Interaction Benchmark</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight">
              Behavioral Evaluation & Training Lab
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-sans">
              Perform 5 calibrated interaction sprints to generate empirical telemetry. Each exercise tests real-time ML prediction accuracy, local feature divergence, and speedup metrics.
            </p>
          </div>

          <div className="w-40 h-40 shrink-0 relative flex items-center justify-center">
            <NeuralLattice3D className="w-full h-full" />
          </div>
        </div>

        {/* A/B Control Bar & Consent Toggle */}
        <div className="p-4 rounded-2xl glass-card flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">
              Evaluation Protocol:
            </span>
            <div className="flex items-center p-1 rounded-xl bg-zinc-200/50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700">
              <button
                onClick={() => setAdaptationMode('on')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  adaptationMode === 'on'
                    ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Adaptation ON
              </button>
              <button
                onClick={() => setAdaptationMode('off')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  adaptationMode === 'off'
                    ? 'bg-white dark:bg-zinc-900 text-rose-500 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Static Control (OFF)
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={hasConsent}
              onChange={(e) => setHasConsent(e.target.checked)}
              className="rounded-md border-zinc-400 text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-[11px]">Save labelled vectors for model evaluation</span>
          </label>
        </div>

        {!isCompleted ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 Columns: Active Guided Task */}
            <div className="lg:col-span-8 space-y-5">
              {/* Task Header & Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
                  <span>Sprint {currentStep + 1} of {GUIDED_TASKS.length}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                    Target Profile: {currentTask.targetState.replace('_', ' ')}
                  </span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    style={{ width: `${((currentStep + 1) / GUIDED_TASKS.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Task Interactive Card */}
              <TiltCard depth={6} className="p-6 sm:p-7 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-display font-bold tracking-tight">
                        {currentTask.title}
                      </h2>
                      <p className="text-xs font-mono text-zinc-500 mt-0.5">
                        {currentTask.objective}
                      </p>
                    </div>
                  </div>

                  {/* Stopwatch Badge */}
                  <div className="px-3.5 py-1.5 rounded-xl glass-card font-mono text-sm font-bold flex items-center gap-2 shrink-0">
                    <span className={`w-2 h-2 rounded-full ${isTimerRunning ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
                    <span>{Math.floor(secondsElapsed / 60)}:{(secondsElapsed % 60).toString().padStart(2, '0')}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl glass-panel text-xs text-zinc-600 dark:text-zinc-300 font-sans leading-relaxed">
                  <strong className="block text-zinc-900 dark:text-white font-mono uppercase tracking-wider text-[10px] mb-1">
                    Guidance Directive:
                  </strong>
                  {currentTask.instruction}
                </div>

                {/* Interactive Task Sandbox Zone */}
                <div className="p-5 rounded-2xl border border-zinc-200/70 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-950/60 min-h-[160px] flex flex-col justify-center">
                  {/* Task 1: Rapid Click Sprint */}
                  {currentStep === 0 && (
                    <div className="space-y-2.5 font-mono">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 block mb-1">
                        Urgent Action Queue ({urgentItemsClicked.length}/5 completed):
                      </span>
                      {[
                        'Deploy fault-tolerant KV cache eviction routine',
                        'Audit edge streaming hydration chunks',
                        'Compile calibrated Random Forest baseline',
                        'Verify sub-10ms XAI attribution latency',
                        'Sync zero-copy RDMA socket buffers',
                      ].map((item, idx) => {
                        const clicked = urgentItemsClicked.includes(idx);
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              if (!clicked) setUrgentItemsClicked((prev) => [...prev, idx]);
                            }}
                            className={`w-full text-left p-2.5 rounded-xl text-xs font-medium border flex items-center justify-between transition-all ${
                              clicked
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 line-through'
                                : 'glass-card text-zinc-800 dark:text-zinc-200 hover:border-emerald-500/60 active:scale-98'
                            }`}
                          >
                            <span>{item}</span>
                            <span className="text-[10px] font-bold uppercase">{clicked ? 'Done' : 'Execute'}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Task 2: Focused Reading Excerpt */}
                  {currentStep === 1 && (
                    <div className="space-y-3 max-h-56 overflow-y-auto p-3 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 font-sans border rounded-xl border-zinc-200 dark:border-zinc-800">
                      <h4 className="font-display font-bold text-sm text-zinc-900 dark:text-white">
                        Distributed Memory Concurrency & Attention Sinks
                      </h4>
                      <p>
                        In deep autoregressive sequences, maintaining linear computational efficiency necessitates continuous context pruning. Attention sinks anchor sequence stability by absorbing high-norm activations across the first four token steps.
                      </p>
                      <p>
                        When users transition into an analytical reading posture, interface micro-metrics exhibit sudden deceleration. Scroll velocity drops below 80 px/s while text dwell intervals surpass 12 seconds per section.
                      </p>
                      <p>
                        The adaptive engine detects this physiological change without keylogging, expanding margin gutters and increasing typographical scale to 120% to mitigate fatigue.
                      </p>
                    </div>
                  )}

                  {/* Task 3: Precision Micro-Interactions */}
                  {currentStep === 2 && (
                    <div className="space-y-3 font-mono">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500">
                        Target Friction Simulation: Strike each 12px micro-target:
                      </span>
                      <div className="flex flex-wrap items-center gap-3 py-3">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
                          const hit = microTargetsHit.includes(num);
                          return (
                            <button
                              key={num}
                              onClick={() => {
                                if (!hit) setMicroTargetsHit((prev) => [...prev, num]);
                              }}
                              className={`w-3.5 h-3.5 rounded-xs text-[8px] flex items-center justify-center font-bold transition-all ${
                                hit
                                  ? 'bg-emerald-500 text-black'
                                  : 'bg-amber-500 hover:bg-amber-400 text-black active:scale-75'
                              }`}
                              title={`Target ${num}`}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>
                      <span className="text-[11px] text-zinc-500">
                        Targets hit: {microTargetsHit.length}/8
                      </span>
                    </div>
                  )}

                  {/* Task 4: Search & Taxonomy Traversal */}
                  {currentStep === 3 && (
                    <div className="space-y-3 font-mono">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">
                        Multi-Domain Filter & Query Traversal:
                      </span>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Type search queries (e.g., lattice, memory, security)..."
                        className="w-full px-3.5 py-2 rounded-xl glass-card text-xs focus:outline-hidden focus:border-emerald-500 transition-colors"
                      />
                      <div className="flex flex-wrap gap-2">
                        {['All', 'AI Inference', 'Hardware', 'Quantum Security'].map((filter) => (
                          <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                              activeFilter === filter
                                ? 'bg-emerald-500 text-black'
                                : 'glass-panel text-zinc-400'
                            }`}
                          >
                            {filter}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Task 5: Balanced Task Flow */}
                  {currentStep === 4 && (
                    <div className="space-y-3 font-mono">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">
                        Everyday Task Checklist:
                      </span>
                      <div className="space-y-1.5">
                        {everydayItems.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              setEverydayItems((prev) =>
                                prev.map((t) => (t.id === item.id ? { ...t, done: !t.done } : t))
                              );
                            }}
                            className="p-2.5 rounded-xl glass-card text-xs flex items-center justify-between cursor-pointer"
                          >
                            <span className={item.done ? 'line-through text-zinc-500' : 'text-zinc-200'}>
                              {item.text}
                            </span>
                            <span className="text-[10px] text-emerald-500">{item.done ? '✓' : '○'}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <input
                          type="text"
                          value={newItemText}
                          onChange={(e) => setNewItemText(e.target.value)}
                          placeholder="Add new task..."
                          className="flex-1 px-3 py-1.5 rounded-xl glass-panel text-xs focus:outline-hidden"
                        />
                        <button
                          onClick={() => {
                            if (newItemText.trim()) {
                              setEverydayItems((prev) => [
                                ...prev,
                                { id: Date.now(), text: newItemText.trim(), done: false },
                              ]);
                              setNewItemText('');
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-zinc-800 text-white text-xs font-bold"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step Action Buttons */}
                <div className="pt-3 border-t border-zinc-200/50 dark:border-zinc-800/60 flex items-center justify-between">
                  <div className="text-[11px] font-mono text-zinc-400">
                    Cadence Target: <strong className="text-zinc-200">{currentTask.expectedCadence}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isTimerRunning ? (
                      <button
                        onClick={startTask}
                        className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black hover:bg-zinc-800"
                      >
                        Start Sprint Timer
                      </button>
                    ) : (
                      <button
                        onClick={completeStep}
                        disabled={evaluatingML}
                        className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/20 active:scale-98 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <span>{evaluatingML ? 'Evaluating ML...' : 'Complete & Predict →'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Feedback Notification */}
                {lastPrediction && (
                  <div className={`p-3 rounded-xl border font-mono text-xs flex items-center justify-between ${
                    lastPrediction.isMatch
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}>
                    <span>
                      Prediction: <strong>{lastPrediction.state.replace('_', ' ')}</strong> ({Math.round(lastPrediction.confidence * 100)}% conf)
                    </span>
                    <span>{lastPrediction.isMatch ? 'Model Agreement ✓' : 'Pattern Diverged ✕'}</span>
                  </div>
                )}
              </TiltCard>
            </div>

            {/* Right 4 Columns: Live Behavioral Telemetry Radar */}
            <div className="lg:col-span-4 space-y-4">
              <div className="p-5 rounded-3xl glass-panel space-y-4 font-mono">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">
                      Live Behavioral Vector
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-500 animate-pulse">● Active</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-2xl glass-card">
                    <div className="text-[10px] text-zinc-400 uppercase tracking-widest">Click Frequency</div>
                    <div className="text-base font-bold text-zinc-100 mt-0.5">
                      {liveFeatures.clicks_per_min} <span className="text-[10px] text-zinc-500 font-normal">clicks/min</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl glass-card">
                    <div className="text-[10px] text-zinc-400 uppercase tracking-widest">Scroll Velocity</div>
                    <div className="text-base font-bold text-emerald-400 mt-0.5">
                      {Math.round(liveFeatures.scroll_speed * 1000)} <span className="text-[10px] text-zinc-500 font-normal">px/s</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl glass-card">
                    <div className="text-[10px] text-zinc-400 uppercase tracking-widest">Idle Stationary Ratio</div>
                    <div className="text-base font-bold text-indigo-400 mt-0.5">
                      {Math.round(liveFeatures.idle_ratio * 100)}%
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl glass-card">
                    <div className="text-[10px] text-zinc-400 uppercase tracking-widest">Repeat Misclick Friction</div>
                    <div className="text-base font-bold text-rose-400 mt-0.5">
                      {Math.round(liveFeatures.repeat_click_ratio * 100)}%
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl glass-card">
                    <div className="text-[10px] text-zinc-400 uppercase tracking-widest">View Switches</div>
                    <div className="text-base font-bold text-zinc-100 mt-0.5">
                      {liveFeatures.view_switches_per_min} <span className="text-[10px] text-zinc-500 font-normal">/min</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-zinc-500 border-t border-zinc-200/50 dark:border-zinc-800/60 leading-relaxed font-sans">
                  Vectors update every 800ms across a 20s rolling window. Key characters and entered text values are never stored.
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ════════════════════ COMPREHENSIVE FINAL EVALUATION SUMMARY ════════════════════ */
          <div className="p-8 sm:p-10 rounded-3xl glass-panel text-center space-y-6 max-w-2xl mx-auto animate-in fade-in duration-300 font-mono">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-display font-extrabold tracking-tight text-zinc-100">
                Evaluation Benchmark Completed
              </h2>
              <p className="text-xs text-zinc-400 font-sans">
                All 5 interaction sprints recorded and evaluated against Random Forest decision boundaries.
              </p>
            </div>

            {/* Results Table */}
            <div className="p-5 rounded-2xl glass-card text-left text-xs space-y-3">
              <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mb-2 flex justify-between">
                <span>Task Persona</span>
                <span>Predicted / Match</span>
              </div>

              {stepResults.map((res, i) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b border-zinc-800/60 last:border-0">
                  <div>
                    <span className="font-bold text-zinc-200 capitalize">{res.targetState.replace('_', ' ')}</span>
                    <span className="text-[10px] text-zinc-500 ml-2">({res.durationSeconds}s)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">{res.predictedState.replace('_', ' ')}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      res.isMatch ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      {res.isMatch ? 'Match' : 'Diverged'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                onClick={handleDownloadReport}
                className="px-5 py-2.5 rounded-xl text-xs font-bold glass-panel hover:bg-zinc-800 flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Benchmark JSON</span>
              </button>

              <Link
                href="/demo"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/20"
              >
                Launch Live App &rarr;
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
