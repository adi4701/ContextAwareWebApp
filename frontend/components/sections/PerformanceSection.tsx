'use client';

import React from 'react';
import { useAdaptationStore } from '../../store/adaptationStore';
import { Cpu, Zap, CheckCircle2, SlidersHorizontal } from 'lucide-react';

export default function PerformanceSection() {
  const layoutDensity = useAdaptationStore((state) => state.layoutDensity);
  const detectedClass = useAdaptationStore((state) => state.detectedClass);

  const paddingClass =
    layoutDensity === 'compact'
      ? 'p-3'
      : layoutDensity === 'spacious'
      ? 'p-8'
      : 'p-5';

  const featureWeights = [
    { name: 'Click Density', weight: 88, color: 'bg-blue-500' },
    { name: 'Scroll Rate', weight: 74, color: 'bg-emerald-500' },
    { name: 'Navigation Depth', weight: 62, color: 'bg-indigo-500' },
    { name: 'Session Duration', weight: 51, color: 'bg-amber-500' },
    { name: 'Hour of Day', weight: 35, color: 'bg-purple-500' },
  ];

  return (
    <div
      className={`rounded-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 shadow-md transition-all duration-300 ${paddingClass}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">ML Model Insights</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Random Forest weights & pipeline health</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-200/50 dark:border-emerald-800/50">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Pipeline Healthy</span>
        </div>
      </div>

      {/* Latency & Confidence Row */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-600/40">
          <div className="flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Latency</span>
          </div>
          <div className="text-base font-black text-gray-900 dark:text-white mt-1">12 ms</div>
        </div>

        <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-600/40">
          <div className="flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-500" />
            <span>Trees</span>
          </div>
          <div className="text-base font-black text-gray-900 dark:text-white mt-1">100 Estimators</div>
        </div>

        <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-600/40">
          <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Active Profile</div>
          <div className="text-xs font-black text-indigo-600 dark:text-indigo-400 mt-1 capitalize truncate">
            {detectedClass ? detectedClass.replace('_', ' ') : 'Analyzing...'}
          </div>
        </div>
      </div>

      {/* Feature Importance Bars */}
      <div>
        <div className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
          Feature Importance Distribution
        </div>
        <div className="space-y-2">
          {featureWeights.map((f) => (
            <div key={f.name} className="space-y-1">
              <div className="flex justify-between text-[11px] font-medium">
                <span className="text-gray-600 dark:text-gray-400">{f.name}</span>
                <span className="font-mono text-gray-700 dark:text-gray-300">{f.weight}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                <div
                  className={`h-full rounded-full ${f.color} transition-all duration-500`}
                  style={{ width: `${f.weight}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
