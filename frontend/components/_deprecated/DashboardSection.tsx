'use client';

import React from 'react';
import { useAdaptationStore } from '../../store/adaptationStore';

export default function DashboardSection() {
  const layoutDensity = useAdaptationStore((state) => state.layoutDensity);
  const adaptationsCount = useAdaptationStore((state) => state.adaptationsCount);

  const paddingClass =
    layoutDensity === 'compact'
      ? 'p-3'
      : layoutDensity === 'spacious'
      ? 'p-8'
      : 'p-5';

  const stats = [
    {
      title: 'Total Sessions',
      value: '1,284',
      accentColor: 'bg-blue-500',
      textColor: 'text-blue-600 dark:text-blue-400',
      badge: '+12%',
    },
    {
      title: 'Avg Duration',
      value: '4m 32s',
      accentColor: 'bg-emerald-500',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      badge: '+8%',
    },
    {
      title: 'Adaptations',
      value: String(adaptationsCount),
      accentColor: 'bg-purple-500',
      textColor: 'text-purple-600 dark:text-purple-400',
      badge: 'Live',
    },
  ];

  const sparklineHeights = [30, 45, 60, 35, 75, 50, 90, 65, 80, 55, 95, 70];

  return (
    <div
      className={`rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md transition-all duration-300 ${paddingClass}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
            <svg
              className="w-5 h-5"
              width={20}
              height={20}
              style={{ width: '20px', height: '20px' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Dashboard</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">System overview & usage metrics</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
          Real-Time
        </span>
      </div>

      {/* 3 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-100 dark:border-gray-600/60 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{stat.title}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 shadow-xs">
                {stat.badge}
              </span>
            </div>
            <div className={`text-xl font-extrabold ${stat.textColor}`}>{stat.value}</div>
            <div className={`h-1.5 w-full rounded-full ${stat.accentColor} mt-2.5 opacity-80`} />
          </div>
        ))}
      </div>

      {/* Sparkline Bar Chart */}
      <div className="rounded-xl p-3 bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-600/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Live Traffic Intensity</span>
          <span className="text-[11px] text-gray-400 dark:text-gray-400">Past 12 intervals</span>
        </div>
        <div className="flex items-end gap-1.5 h-14 pt-1">
          {sparklineHeights.map((h, idx) => (
            <div
              key={idx}
              className="flex-1 bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t transition-all duration-300 hover:brightness-125 cursor-pointer"
              style={{ height: `${h}%` }}
              title={`Intensity: ${h}%`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
