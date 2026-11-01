'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAdaptationStore } from '../store/adaptationStore';

const STATE_NAMES: Record<string, { label: string; badgeColor: string; description: string }> = {
  fast_navigator: {
    label: 'Fast Navigator',
    badgeColor: 'bg-purple-600 text-white',
    description: 'Compact rows, keyboard shortcuts bar active',
  },
  reader: {
    label: 'Reader Mode',
    badgeColor: 'bg-emerald-600 text-white',
    description: 'Spacious layout, 120% text, notes expanded',
  },
  struggling: {
    label: 'Assisted Mode',
    badgeColor: 'bg-amber-600 text-white',
    description: 'Enlarged buttons, action labels, help tips',
  },
  explorer: {
    label: 'Deep Explorer',
    badgeColor: 'bg-blue-600 text-white',
    description: 'Search pinned to top, filters highlighted',
  },
  balanced: {
    label: 'Balanced Default',
    badgeColor: 'bg-gray-600 text-white',
    description: 'Standard layout, waiting for clear behavioral signal',
  },
};

export default function WhyAdaptedPanel() {
  const {
    state,
    confidence,
    reasons,
    changes,
    isPaused,
    pausedUntil,
    undoAdaptation,
    resumeAdaptation,
  } = useAdaptationStore();

  const [isExpanded, setIsExpanded] = useState(true);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  // Countdown timer for 2-minute pause window
  useEffect(() => {
    if (!isPaused || !pausedUntil) {
      setRemainingSeconds(0);
      return;
    }

    const updateRemaining = () => {
      const diff = Math.max(0, Math.ceil((pausedUntil - Date.now()) / 1000));
      setRemainingSeconds(diff);
      if (diff <= 0) {
        resumeAdaptation();
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [isPaused, pausedUntil, resumeAdaptation]);

  const stateInfo = STATE_NAMES[state] || STATE_NAMES.balanced;
  const confidencePercent = Math.round((confidence || 0.8) * 100);

  return (
    <div className="fixed bottom-4 left-4 z-40 max-w-sm sm:max-w-md font-sans">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          // Minimized Floating Pill
          <motion.button
            key="minimized-pill"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 10 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: shouldReduceMotion ? 0.05 : 0.2 }}
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-800 dark:text-gray-200 hover:border-blue-500 transition-all"
            aria-label="Open Why UI Changed panel"
          >
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-ping" />
            <span>Why did UI adapt?</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${stateInfo.badgeColor}`}>
              {stateInfo.label}
            </span>
          </motion.button>
        ) : (
          // Expanded Floating Card
          <motion.div
            key="expanded-card"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 15 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: shouldReduceMotion ? 0.05 : 0.25, ease: 'easeOut' }}
            className="rounded-2xl p-4 sm:p-5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-2xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Why did the UI change?
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${stateInfo.badgeColor}`}>
                      {stateInfo.label}
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold">
                      {confidencePercent}% ML confidence
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-md text-xs"
                aria-label="Minimize panel"
              >
                ✕
              </button>
            </div>

            {/* Confidence Bar */}
            <div className="mt-3">
              <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full"
                  initial={shouldReduceMotion ? { width: `${confidencePercent}%` } : { width: 0 }}
                  animate={{ width: `${confidencePercent}%` }}
                  transition={{ duration: shouldReduceMotion ? 0.05 : 0.4 }}
                />
              </div>
            </div>

            {/* Paused Banner if Undo was triggered */}
            {isPaused && (
              <div className="mt-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between">
                <div>
                  <span className="font-bold">Adaptation paused: </span>
                  <span>{Math.floor(remainingSeconds / 60)}:{(remainingSeconds % 60).toString().padStart(2, '0')}</span>
                </div>
                <button
                  onClick={resumeAdaptation}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 hover:opacity-90"
                >
                  Resume Now
                </button>
              </div>
            )}

            {/* Plain Language Reasons */}
            <div className="mt-3 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Observed Behaviour
              </span>
              <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                {reasons.slice(0, 3).map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5 leading-snug">
                    <span className="text-blue-500 font-bold shrink-0">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* UI Changes Applied */}
            <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Active Adaptations
              </span>
              <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                {changes.map((c, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons: Undo & Minimize */}
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
              <button
                id="undo-adaptation-btn"
                onClick={undoAdaptation}
                disabled={state === 'balanced' && isPaused}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-xs"
                title="Revert to balanced default and pause adaptation for 2 minutes"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <span>Undo (Revert to Balanced)</span>
              </button>

              <button
                onClick={() => setIsExpanded(false)}
                className="py-2 px-3 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Hide
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
