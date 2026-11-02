'use client';

import React, { useState } from 'react';
import { useAdaptationStore } from '../../store/adaptationStore';
import { useTelemetryStore } from '../../store/telemetryStore';
import { flushTelemetry } from '../../lib/flushTelemetry';
import { Zap, BookOpen, Smartphone, Eye, Sparkles, RefreshCw, Sun, Moon } from 'lucide-react';

export default function QuickActionsSection() {
  const layoutDensity = useAdaptationStore((state) => state.layoutDensity);
  const theme = useAdaptationStore((state) => state.theme);
  const setOverride = useAdaptationStore((state) => state.setOverride);
  const clearAllOverrides = useAdaptationStore((state) => state.clearAllOverrides);
  const applySimulationPreset = useTelemetryStore((state) => state.applySimulationPreset);

  const [simulating, setSimulating] = useState<string | null>(null);

  const paddingClass =
    layoutDensity === 'compact'
      ? 'p-3'
      : layoutDensity === 'spacious'
      ? 'p-8'
      : 'p-5';

  const presets = [
    {
      id: 'power_user',
      label: 'Simulate Power User',
      desc: '65 clicks, 80% scroll, 9 depth',
      icon: Zap,
      color: 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50 hover:bg-purple-200/70',
      data: { clicks: 65, uniqueClicks: 52, scrollDepth: 80, navDepth: 9, durationSeconds: 120 },
    },
    {
      id: 'casual_browser',
      label: 'Simulate Casual Browser',
      desc: '8 clicks, 28% scroll, 2 depth',
      icon: BookOpen,
      color: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50 hover:bg-blue-200/70',
      data: { clicks: 8, uniqueClicks: 6, scrollDepth: 28, navDepth: 2, durationSeconds: 120 },
    },
    {
      id: 'mobile_constrained',
      label: 'Simulate Mobile Constrained',
      desc: '20 clicks, 60% scroll, 75s',
      icon: Smartphone,
      color: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50 hover:bg-amber-200/70',
      data: { clicks: 20, uniqueClicks: 10, scrollDepth: 60, navDepth: 3, durationSeconds: 75 },
    },
    {
      id: 'accessibility_focused',
      label: 'Simulate Accessibility Focused',
      desc: '25 clicks, 94% scroll, 24 unique',
      icon: Eye,
      color: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-200/70',
      data: { clicks: 25, uniqueClicks: 24, scrollDepth: 94, navDepth: 5, durationSeconds: 150 },
    },
  ];

  const handleSimulate = async (p: typeof presets[0]) => {
    setSimulating(p.id);
    applySimulationPreset(p.data);
    await flushTelemetry();
    setTimeout(() => setSimulating(null), 800);
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
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Trigger instant live ML adaptations via 4 behavioral profiles
            </p>
          </div>
        </div>
      </div>

      {/* 4 Simulation Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
        {presets.map((p) => {
          const Icon = p.icon;
          const isCurrent = simulating === p.id;
          return (
            <button
              key={p.id}
              onClick={() => handleSimulate(p)}
              disabled={Boolean(simulating)}
              className={`p-3 rounded-xl border text-left transition-all duration-200 flex items-start gap-2.5 active:scale-98 disabled:opacity-50 ${p.color}`}
            >
              <div className="p-1.5 rounded-lg bg-white/60 dark:bg-black/30 shrink-0 mt-0.5">
                <Icon className={`w-4 h-4 ${isCurrent ? 'animate-spin' : ''}`} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold leading-tight truncate">{p.label}</div>
                <div className="text-[10px] opacity-80 mt-0.5 leading-snug">{p.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Manual Override Controls */}
      <div className="pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between flex-wrap gap-2 text-xs">
        <span className="text-gray-500 dark:text-gray-400 font-medium text-[11px]">Manual Overrides:</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setOverride('theme', theme === 'dark' ? 'light' : 'dark')}
            className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-300"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
            <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
          </button>
          <button
            onClick={() => clearAllOverrides()}
            className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-300"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
            <span>Reset All</span>
          </button>
        </div>
      </div>
    </div>
  );
}
