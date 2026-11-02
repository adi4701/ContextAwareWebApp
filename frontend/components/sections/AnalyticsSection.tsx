'use client';

import React from 'react';
import { useAdaptationStore } from '../../store/adaptationStore';

export default function AnalyticsSection() {
  const layoutDensity = useAdaptationStore((state) => state.layoutDensity);

  const paddingClass =
    layoutDensity === 'compact'
      ? 'p-3'
      : layoutDensity === 'spacious'
      ? 'p-8'
      : 'p-5';

  const weeklyData = [
    { day: 'Mon', height: 68, visits: '68%' },
    { day: 'Tue', height: 85, visits: '85%' },
    { day: 'Wed', height: 45, visits: '45%' },
    { day: 'Thu', height: 92, visits: '92%' },
    { day: 'Fri', height: 74, visits: '74%' },
    { day: 'Sat', height: 38, visits: '38%' },
    { day: 'Sun', height: 58, visits: '58%' },
  ];

  return (
    <div
      className={`rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md transition-all duration-300 ${paddingClass}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Analytics</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Weekly user engagement & trends</p>
          </div>
        </div>
        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md">
          &uarr; 14.2% vs last week
        </span>
      </div>

      {/* Bar Chart */}
      <div className="rounded-xl p-4 bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-600/40">
        <div className="flex items-end justify-between gap-3 h-36 pt-4 px-2">
          {weeklyData.map((item, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
              {/* Percentage label */}
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1 opacity-80 group-hover:opacity-100 transition-opacity">
                {item.visits}
              </span>
              {/* Bar */}
              <div className="w-full max-w-[28px] bg-gray-200 dark:bg-gray-700 rounded-t-md overflow-hidden flex items-end h-full">
                <div
                  className="w-full bg-gradient-to-t from-indigo-600 via-indigo-500 to-sky-400 rounded-t-md transition-all duration-500 group-hover:brightness-110"
                  style={{ height: `${item.height}%` }}
                />
              </div>
              {/* Day label */}
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 mt-2">
                {item.day}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
