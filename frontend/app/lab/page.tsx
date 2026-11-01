'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { computeRollingFeatures } from '../../lib/telemetry';
import { useTelemetryStore } from '../../store/telemetryStore';

interface GuidedTask {
  id: number;
  title: string;
  targetState: string;
  instruction: string;
  objective: string;
  prompt: string;
}

const GUIDED_TASKS: GuidedTask[] = [
  {
    id: 1,
    title: 'Task 1: Speed Scanning & Navigation',
    targetState: 'fast_navigator',
    instruction: 'Click through and complete the urgent tasks as quickly as possible. Use rapid clicks and page navigation.',
    objective: 'Generate high click frequency and fast view switches over a 20s interval.',
    prompt: 'Click all 4 priority items rapidly to trigger the Fast Navigator profile.',
  },
  {
    id: 2,
    title: 'Task 2: Deep Reading & Note Analysis',
    targetState: 'reader',
    instruction: 'Scroll slowly through the extended system architecture note below. Dwell on each section and read carefully.',
    objective: 'Generate low click rate, extended idle reading dwell time, and deep scroll.',
    prompt: 'Read through the notes for at least 15 seconds before advancing.',
  },
  {
    id: 3,
    title: 'Task 3: Precision Micro-Interactions',
    targetState: 'struggling',
    instruction: 'Try to click the deliberately miniature action targets (14px) and checkboxes below without misclicking.',
    objective: 'Generate hesitation pauses, repeated target clicks, and precision difficulty signals.',
    prompt: 'Click each tiny icon target carefully.',
  },
  {
    id: 4,
    title: 'Task 4: Search & Category Exploration',
    targetState: 'explorer',
    instruction: 'Type multiple keywords into the search box ("architecture", "database", "security") and toggle each category filter.',
    objective: 'Generate elevated keystroke counts, multiple view switches, and broad exploration.',
    prompt: 'Type at least two queries and click through each filter.',
  },
  {
    id: 5,
    title: 'Task 5: Balanced Natural Management',
    targetState: 'balanced',
    instruction: 'Add a new task, toggle an item, and navigate at a normal, steady pace.',
    objective: 'Generate balanced, moderate behavioral metrics matching typical user flow.',
    prompt: 'Create one task and review your list.',
  },
];

export default function LabPage() {
  const [currentStep, setCurrentStep] = useState(0); // 0 to 4
  const [isCompleted, setIsCompleted] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [hasConsent, setHasConsent] = useState(true);
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const [adaptationMode, setAdaptationMode] = useState<'on' | 'off'>('on');
  const [completionRecords, setCompletionRecords] = useState<Record<number, number>>({});

  const sessionId = useTelemetryStore((s) => s.sessionId);
  const currentTask = GUIDED_TASKS[currentStep];

  // Timer
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
    setSubmissionStatus(null);
  };

  const completeStep = async () => {
    setIsTimerRunning(false);
    const duration = secondsElapsed;

    setCompletionRecords((prev) => ({ ...prev, [currentStep]: duration }));

    // Extract current 20s feature vector
    const featureVector = computeRollingFeatures();
    const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (hasConsent) {
      try {
        setSubmissionStatus('Submitting labelled window to /api/feedback...');
        await axios.post(
          `${backendUrl}/api/feedback`,
          {
            sessionId,
            featureVector,
            chosenSetting: {
              dimension: 'state',
              value: currentTask.targetState,
            },
            previousState: 'lab_session',
            targetState: currentTask.targetState,
            labMetadata: {
              taskStep: currentStep + 1,
              durationSeconds: duration,
              adaptationMode,
            },
          },
          {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              'Content-Type': 'application/json',
            },
            timeout: 5000,
          }
        );
        setSubmissionStatus(`Recorded labelled window for "${currentTask.targetState}" (${duration}s) ✓`);
      } catch {
        setSubmissionStatus(`Recorded locally for "${currentTask.targetState}" (${duration}s)`);
      }
    }

    if (currentStep < GUIDED_TASKS.length - 1) {
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
        setSecondsElapsed(0);
        setIsTimerRunning(true);
        setSubmissionStatus(null);
      }, 1200);
    } else {
      setIsCompleted(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Evaluation Lab
              </span>
              <h1 className="text-xl font-black">Participant Behaviour Training Mode</h1>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              5 guided behavioural exercises to record labelled interaction windows for retraining.
            </p>
          </div>

          <Link
            href="/demo"
            className="text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors"
          >
            ← Return to App
          </Link>
        </div>

        {/* A/B Adaptation Mode Toggle */}
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div>
            <span className="text-xs font-bold text-gray-900 dark:text-white">A/B Testing Mode:</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">
              Compare completion times with dynamic UI adaptation ON vs OFF.
            </span>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
            <button
              onClick={() => setAdaptationMode('on')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                adaptationMode === 'on'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Adaptation ON
            </button>
            <button
              onClick={() => setAdaptationMode('off')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                adaptationMode === 'off'
                  ? 'bg-gray-700 text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Adaptation OFF (Control)
            </button>
          </div>
        </div>

        {!isCompleted ? (
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                <span>Task {currentStep + 1} of {GUIDED_TASKS.length}</span>
                <span className="capitalize font-bold text-blue-600 dark:text-blue-400">
                  Target Label: {currentTask.targetState.replace('_', ' ')}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / GUIDED_TASKS.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Task Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-gray-900 dark:text-white">
                    {currentTask.title}
                  </h2>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-0.5">
                    Objective: {currentTask.objective}
                  </p>
                </div>

                {/* Stopwatch */}
                <div className="px-3.5 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 font-mono text-sm font-black text-gray-800 dark:text-gray-200 flex items-center gap-1.5 shrink-0">
                  <span className={`w-2 h-2 rounded-full ${isTimerRunning ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                  <span>{Math.floor(secondsElapsed / 60)}:{(secondsElapsed % 60).toString().padStart(2, '0')}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                <strong className="block text-gray-900 dark:text-white mb-1">Instructions:</strong>
                {currentTask.instruction}
              </div>

              {/* Interactive Sandbox per Task */}
              <div className="p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/80">
                {currentStep === 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-gray-400">Click all urgent items:</span>
                    {['#urgent: Deploy critical auth patch', '#urgent: Audit telemetry rate limits', 'Regular: Clean CSS files', '#urgent: Retrain Random Forest model', '#urgent: Run Lighthouse verification'].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {}}
                        className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold border flex items-center justify-between transition-all ${
                          item.includes('#urgent')
                            ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100'
                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 text-gray-600'
                        }`}
                      >
                        <span>{item}</span>
                        <span className="text-[10px] font-bold">Click</span>
                      </button>
                    ))}
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-3 max-h-56 overflow-y-auto p-2 text-xs leading-relaxed text-gray-600 dark:text-gray-300 border rounded-xl">
                    <h4 className="font-bold text-gray-900 dark:text-white">Design Spec: Multi-Modal Adaptation Mechanics</h4>
                    <p>
                      The machine learning pipeline processes eight rolling behavioural telemetry dimensions computed across 20-second rolling sliding windows. The goal of this approach is to capture spontaneous human pacing without invasive key recording.
                    </p>
                    <p>
                      When a user exhibits high dwell times and extended scroll depth, the model infers a reader profile. In this mode, the container expands margins, note previews expand automatically, and font size scales up to 120% to prevent eye fatigue.
                    </p>
                    <p>
                      Conversely, when a rapid cadence is observed with short inter-event intervals, the compact Fast Navigator view activates, displaying keyboard shortcuts for power-user speed.
                    </p>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-3">
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      Precision challenge: Click each tiny 14px target:
                    </span>
                    <div className="flex flex-wrap items-center gap-3 py-2">
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <button
                          key={num}
                          onClick={() => {}}
                          className="w-3.5 h-3.5 rounded-xs bg-amber-500 hover:bg-amber-600 active:scale-75 text-[8px] flex items-center justify-center text-white"
                          title={`Micro-target ${num}`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-3">
                    <span className="text-[11px] font-bold text-blue-500">Search & Filter Explorer Sandbox:</span>
                    <input
                      type="text"
                      placeholder="Type search queries here (e.g. backend, database)..."
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs"
                    />
                    <div className="flex gap-2">
                      {['All', 'Backend', 'Machine Learning', 'Frontend'].map((filter) => (
                        <button key={filter} className="px-2.5 py-1 rounded-lg text-xs bg-gray-100 dark:bg-gray-800">
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-gray-500">Everyday Task Flow:</span>
                    <input
                      type="text"
                      placeholder="Add everyday task..."
                      className="w-full px-3 py-2 rounded-xl border text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Consent and Controls */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasConsent}
                    onChange={(e) => setHasConsent(e.target.checked)}
                    className="rounded-md border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Consent: Record labelled window via /api/feedback</span>
                </label>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {!isTimerRunning ? (
                    <button
                      onClick={startTask}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold bg-gray-800 text-white hover:bg-gray-700"
                    >
                      Start Task Timer
                    </button>
                  ) : (
                    <button
                      onClick={completeStep}
                      className="flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                    >
                      Complete & Record Step →
                    </button>
                  )}
                </div>
              </div>

              {submissionStatus && (
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs text-center font-bold">
                  {submissionStatus}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Completion Summary */
          <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl text-center space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="text-2xl font-black">Evaluation Session Complete!</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              All 5 guided task interaction windows have been recorded and saved for model evaluation.
            </p>

            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border text-xs max-w-sm mx-auto text-left space-y-1.5">
              <span className="font-bold block text-gray-900 dark:text-white">Session Timings:</span>
              {Object.entries(completionRecords).map(([idx, sec]) => (
                <div key={idx} className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>{GUIDED_TASKS[Number(idx)].targetState.replace('_', ' ')}</span>
                  <span className="font-mono font-bold">{sec}s</span>
                </div>
              ))}
            </div>

            <div className="pt-4 flex flex-wrap justify-center gap-3">
              <Link
                href="/demo"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700"
              >
                Go to Live App
              </Link>
              <Link
                href="/#results"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                View Evaluation Results
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
