'use client';

import React, { useState } from 'react';
import { useAdaptationStore } from '../../store/adaptationStore';
import { useTelemetryStore } from '../../store/telemetryStore';
import { flushTelemetry } from '../../lib/flushTelemetry';
import { PlayCircle, Sparkles, Send, RefreshCw, Sun, Moon } from 'lucide-react';

export default function QuickActionsSection() {
  const layoutDensity = useAdaptationStore((state) => state.layoutDensity);
  const theme = useAdaptationStore((state) => state.theme);
  const setOverride = useAdaptationStore((state) => state.setOverride);
  const clearAllOverrides = useAdaptationStore((state) => state.clearAllOverrides);
  const addEvent = useTelemetryStore((state) => state.addEvent);

  const [simulating, setSimulating] = useState(false);

  const paddingClass =
    layoutDensity === 'compact'
      ? 'p-3'
      : layoutDensity === 'spacious'
      ? 'p-8'
      : 'p-5';

  const simulateBurst = async (type: 'power' | 'casual') => {
    setSimulating(true);

    if (type === 'power') {
      // Simulate rapid power user clicks and scroll
      for (let i = 0; i < 15; i++) {
        addEvent({ type: 'click', elementId: `btn-burst-${i}`, timestamp: new Date() });
      }
      addEvent({ type: 'scroll', depth: 85, timestamp: new Date() });
      addEvent({ type: 'navigate', timestamp: new Date() });
    } else {
      // Casual browser: slow methodical scroll, few clicks
      addEvent({ type: 'click', elementId: 'card-view', timestamp: new Date() });
      addEvent({ type: 'scroll', depth: 30, timestamp: new Date() });
    }

    // Flush immediately to trigger backend and ML update
    await flushTelemetry();
    setTimeout(() => setSimulating(false), 800);
  };

  return (
    <div
      className={`rounded-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 shadow-md transition-all duration-300 ${paddingClass}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Interaction Testing Lab</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Simulate behaviors & trigger ML adaptations</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200/50 dark:border-violet-800/50">
          Demo Tools
        </span>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          onClick={() => simulateBurst('power')}
          disabled={simulating}
          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-purple-500/20 active:scale-98 transition-all disabled:opacity-50"
        >
          <PlayCircle className="w-4 h-4" />
          <span>Simulate Power User Burst (15 Clicks)</span>
        </button>

        <button
          onClick={() => simulateBurst('casual')}
          disabled={simulating}
          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 active:scale-98 transition-all disabled:opacity-50"
        >
          <PlayCircle className="w-4 h-4" />
          <span>Simulate Casual Browser (Shallow Scroll)</span>
        </button>

        <button
          onClick={() => flushTelemetry()}
          className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium text-xs transition-colors"
        >
          <Send className="w-3.5 h-3.5 text-blue-500" />
          <span>Force Flush Telemetry</span>
        </button>

        <button
          onClick={() => setOverride('theme', theme === 'dark' ? 'light' : 'dark')}
          className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium text-xs transition-colors"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Switch to Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-indigo-500" />
              <span>Switch to Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Reset Bar */}
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
        <span>Click buttons above to see the UI morph in real time</span>
        <button
          onClick={() => clearAllOverrides()}
          className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset All Overrides</span>
        </button>
      </div>
    </div>
  );
}
