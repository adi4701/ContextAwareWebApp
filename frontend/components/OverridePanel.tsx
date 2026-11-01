'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import axios from 'axios';
import { useAdaptationStore, STATE_PRESETS } from '../store/adaptationStore';
import { useTelemetryStore } from '../store/telemetryStore';
import { computeRollingFeatures } from '../lib/telemetry';

export default function OverridePanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const {
    state,
    adaptation,
    userOverrides,
    setOverride,
    clearOverride,
    clearAllOverrides,
  } = useAdaptationStore();

  const sendFeedback = async (dimension: string, value: any) => {
    const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');
    const sessionId = useTelemetryStore.getState().sessionId;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const currentFeatures = computeRollingFeatures();

    try {
      await axios.post(
        `${backendUrl}/api/feedback`,
        {
          sessionId,
          featureVector: currentFeatures,
          chosenSetting: { dimension, value },
          previousState: state,
          targetState: dimension === 'state' ? value : state,
        },
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            'Content-Type': 'application/json',
          },
          timeout: 4000,
        }
      );
      setFeedbackStatus(`Locked ${dimension} & recorded feedback ✓`);
      setTimeout(() => setFeedbackStatus(null), 3000);
    } catch {
      setFeedbackStatus(`Locked ${dimension} locally`);
      setTimeout(() => setFeedbackStatus(null), 2500);
    }
  };

  const handleStateSelect = async (targetState: string) => {
    setOverride('state', targetState);
    await sendFeedback('state', targetState);
  };

  const handleDensitySelect = async (density: 'compact' | 'standard' | 'spacious') => {
    setOverride('density', density);
    await sendFeedback('density', density);
  };

  const handleTextScaleSelect = async (scale: number) => {
    setOverride('textScale', scale);
    await sendFeedback('textScale', scale);
  };

  const handleTargetSizeSelect = async (size: 'normal' | 'large') => {
    setOverride('targetSize', size);
    await sendFeedback('targetSize', size);
  };

  const lockedKeys = Object.keys(userOverrides);

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 15 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 15 }}
            transition={{ duration: shouldReduceMotion ? 0.05 : 0.22, ease: 'easeOut' }}
            className="mb-3 w-84 sm:w-96 rounded-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700 shadow-2xl p-4 text-gray-900 dark:text-gray-100 max-h-[85vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
                <h4 className="font-bold text-sm">Adaptation Controls & Overrides</h4>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs p-1"
                aria-label="Close controls"
              >
                ✕
              </button>
            </div>

            {feedbackStatus && (
              <div className="mt-2.5 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs text-center font-bold animate-in fade-in">
                {feedbackStatus}
              </div>
            )}

            {/* 1. State Simulation / Override */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Simulate / Lock Behaviour State
                </span>
                {'state' in userOverrides && (
                  <button
                    onClick={() => clearOverride('state')}
                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                  >
                    Unlock
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {Object.keys(STATE_PRESETS).map((sKey) => {
                  const isCurrent = state === sKey;
                  const isLocked = userOverrides.state === sKey;
                  return (
                    <button
                      key={sKey}
                      id={`override-state-${sKey}`}
                      onClick={() => handleStateSelect(sKey)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between border ${
                        isCurrent
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-400 shadow-xs'
                          : 'bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-300'
                      }`}
                    >
                      <span className="capitalize">{sKey.replace('_', ' ')}</span>
                      {isLocked && <span className="text-[10px]">🔒</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Density Override */}
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Layout Density
                </span>
                {'density' in userOverrides && (
                  <button
                    onClick={() => clearOverride('density')}
                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                  >
                    Unlock
                  </button>
                )}
              </div>
              <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
                {(['compact', 'standard', 'spacious'] as const).map((d) => (
                  <button
                    key={d}
                    id={`override-density-${d}`}
                    onClick={() => handleDensitySelect(d)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                      adaptation.density === d
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Text Scale Override */}
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Text Scale
                </span>
                {'textScale' in userOverrides && (
                  <button
                    onClick={() => clearOverride('textScale')}
                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                  >
                    Unlock
                  </button>
                )}
              </div>
              <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
                {([1.0, 1.1, 1.2] as const).map((scale) => (
                  <button
                    key={scale}
                    onClick={() => handleTextScaleSelect(scale)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      adaptation.textScale === scale
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                    }`}
                  >
                    {scale === 1.0 ? '100% (Default)' : `${Math.round(scale * 100)}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Target Size Override */}
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Target Hit Size
                </span>
                {'targetSize' in userOverrides && (
                  <button
                    onClick={() => clearOverride('targetSize')}
                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                  >
                    Unlock
                  </button>
                )}
              </div>
              <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
                {(['normal', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => handleTargetSizeSelect(size)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                      adaptation.targetSize === size
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                    }`}
                  >
                    {size === 'normal' ? 'Normal (Default)' : 'Large (48px Assisted)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer: Locked Dimensions Summary & Reset */}
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="text-[11px] text-gray-400">
                {lockedKeys.length > 0 ? `${lockedKeys.length} dimension(s) locked` : 'AI active (no locks)'}
              </span>
              {lockedKeys.length > 0 && (
                <button
                  onClick={clearAllOverrides}
                  className="px-2.5 py-1 text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline"
                >
                  Reset All to AI
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <button
        id="toggle-override-panel-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/30 text-xs font-bold transition-all active:scale-95"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        <span>Adaptation Controls</span>
        {lockedKeys.length > 0 && (
          <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-900 text-[10px] flex items-center justify-center font-black">
            {lockedKeys.length}
          </span>
        )}
      </button>
    </div>
  );
}
