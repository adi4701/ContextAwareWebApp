'use client';

import React, { useState } from 'react';
import { useAdaptationStore } from '../../store/adaptationStore';

export default function SettingsSection() {
  const layoutDensity = useAdaptationStore((state) => state.layoutDensity);

  const paddingClass =
    layoutDensity === 'compact'
      ? 'p-3'
      : layoutDensity === 'spacious'
      ? 'p-8'
      : 'p-5';

  const [toggles, setToggles] = useState({
    notifications: true,
    darkMode: false,
    compactView: false,
    analyticsTracking: true,
  });

  const toggleHandler = (key: keyof typeof toggles) => {
    setToggles((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const settingsItems: { key: keyof typeof toggles; label: string; desc: string }[] = [
    { key: 'notifications', label: 'Push Notifications', desc: 'Receive real-time alerts on adaptations' },
    { key: 'darkMode', label: 'Force Dark Theme', desc: 'Lock UI color theme preference' },
    { key: 'compactView', label: 'Compact Grid View', desc: 'Reduce element spacing for higher information density' },
    { key: 'analyticsTracking', label: 'Telemetry Telemetry Collection', desc: 'Stream interaction telemetry to ML model' },
  ];

  return (
    <div
      className={`rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md transition-all duration-300 ${paddingClass}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Settings</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">User preferences & options</p>
          </div>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">Adaptive Enabled</span>
      </div>

      {/* Toggle Rows */}
      <div className="space-y-3">
        {settingsItems.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600/50 hover:bg-gray-100/80 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="pr-2">
              <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">{item.label}</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">{item.desc}</div>
            </div>
            <button
              type="button"
              onClick={() => toggleHandler(item.key)}
              aria-label={`Toggle ${item.label}`}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                toggles[item.key] ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  toggles[item.key] ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
