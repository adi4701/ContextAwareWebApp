'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdaptationStore } from '../store/adaptationStore';

export default function OverridePanel() {
  const [isOpen, setIsOpen] = useState(false);

  const {
    theme,
    layoutDensity,
    userOverrides,
    lastUpdated,
    detectedClass,
    setOverride,
    clearOverride,
    clearAllOverrides,
  } = useAdaptationStore();

  const formatTimestamp = (date: Date | null): string => {
    if (!date) return 'Awaiting signal...';
    try {
      const d = new Date(date);
      return d.toTimeString().split(' ')[0];
    } catch {
      return 'Just now';
    }
  };

  const profileColors: Record<string, string> = {
    power_user: 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 border-purple-300 dark:border-purple-700',
    casual_browser: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
    mobile_constrained: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 border-amber-300 dark:border-amber-700',
    accessibility_focused: 'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300 border-sky-300 dark:border-sky-700',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Modal Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 15 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="mb-3 w-80 rounded-2xl bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl border border-gray-200/80 dark:border-gray-700/80 shadow-2xl p-4 text-gray-900 dark:text-gray-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800 mb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <h4 className="font-bold text-sm">AI Adaptation Controls</h4>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs p-1"
                aria-label="Close controls"
              >
                ✕
              </button>
            </div>

            {/* Row 1 — Detected Profile */}
            <div className="mb-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Detected Profile
              </div>
              <div>
                <span
                  className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border ${
                    profileColors[detectedClass] ||
                    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-300 dark:border-gray-700'
                  }`}
                >
                  {detectedClass ? detectedClass.replace('_', ' ') : 'Detecting behavior...'}
                </span>
              </div>
            </div>

            {/* Row 2 — Theme Override */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                <span>Theme</span>
                {userOverrides.theme && (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                      manual
                    </span>
                    <button
                      onClick={() => clearOverride('theme')}
                      className="text-red-500 hover:text-red-700 font-bold ml-1 text-xs"
                      title="Clear theme override"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(['light', 'dark'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setOverride('theme', mode)}
                    className={`text-xs font-semibold py-1.5 px-3 rounded-lg border transition-all ${
                      theme === mode
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-transparent hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 3 — Layout Density Override */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                <span>Layout Density</span>
                {userOverrides.layoutDensity && (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                      manual
                    </span>
                    <button
                      onClick={() => clearOverride('layoutDensity')}
                      className="text-red-500 hover:text-red-700 font-bold ml-1 text-xs"
                      title="Clear density override"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['compact', 'standard', 'spacious'] as const).map((density) => (
                  <button
                    key={density}
                    onClick={() => setOverride('layoutDensity', density)}
                    className={`text-[11px] font-semibold py-1.5 px-2 rounded-lg border transition-all ${
                      layoutDensity === density
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-transparent hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {density.charAt(0).toUpperCase() + density.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 4 — Reset Button */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-800 mb-2">
              <button
                onClick={() => clearAllOverrides()}
                className="w-full py-1.5 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors"
              >
                Reset All Overrides (Auto Mode)
              </button>
            </div>

            {/* Row 5 — Last Updated */}
            <div className="text-[11px] text-center text-gray-400 dark:text-gray-500">
              Last adapted: {formatTimestamp(lastUpdated)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl hover:scale-105 active:scale-95 transition-all focus:outline-none"
        aria-label="Toggle AI Adaptation Settings"
      >
        <svg
          className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}
          width={24}
          height={24}
          style={{ width: '24px', height: '24px' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>
    </div>
  );
}
