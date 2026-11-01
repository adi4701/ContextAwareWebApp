'use client';

import React from 'react';
import { useAdaptationStore } from '../../store/adaptationStore';

export default function NotificationsSection() {
  const layoutDensity = useAdaptationStore((state) => state.layoutDensity);

  const paddingClass =
    layoutDensity === 'compact'
      ? 'p-3'
      : layoutDensity === 'spacious'
      ? 'p-8'
      : 'p-5';

  const notifications = [
    {
      id: 1,
      title: 'New adaptation applied',
      description: 'Model updated theme and density according to power profile',
      time: '2s ago',
      borderColor: 'border-l-blue-500',
      bgColor: 'bg-blue-50/50 dark:bg-blue-950/20',
      iconColor: 'text-blue-500',
      icon: (
        <svg
          className="w-4 h-4"
          width={16}
          height={16}
          style={{ width: '16px', height: '16px' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      id: 2,
      title: 'Session milestone',
      description: 'Active continuous interaction reached 50 telemetry points',
      time: '1m ago',
      borderColor: 'border-l-emerald-500',
      bgColor: 'bg-emerald-50/50 dark:bg-emerald-950/20',
      iconColor: 'text-emerald-500',
      icon: (
        <svg
          className="w-4 h-4"
          width={16}
          height={16}
          style={{ width: '16px', height: '16px' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 3,
      title: 'Weekly report',
      description: 'Your browsing habit summary and pattern breakdown is ready',
      time: '1h ago',
      borderColor: 'border-l-purple-500',
      bgColor: 'bg-purple-50/50 dark:bg-purple-950/20',
      iconColor: 'text-purple-500',
      icon: (
        <svg
          className="w-4 h-4"
          width={16}
          height={16}
          style={{ width: '16px', height: '16px' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 4,
      title: 'System update',
      description: 'Random Forest ML service latency is running at sub-20ms',
      time: '3h ago',
      borderColor: 'border-l-amber-500',
      bgColor: 'bg-amber-50/50 dark:bg-amber-950/20',
      iconColor: 'text-amber-500',
      icon: (
        <svg
          className="w-4 h-4"
          width={16}
          height={16}
          style={{ width: '16px', height: '16px' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div
      className={`rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md transition-all duration-300 ${paddingClass}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
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
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Notifications</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Real-time alerts & stream events</p>
          </div>
        </div>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
          4 New
        </span>
      </div>

      {/* Notifications List */}
      <div className="space-y-2.5">
        {notifications.map((item) => (
          <div
            key={item.id}
            className={`border-l-4 ${item.borderColor} ${item.bgColor} p-3 rounded-r-xl border border-gray-100 dark:border-gray-700/60 flex items-start justify-between gap-3 transition-transform hover:translate-x-1 duration-150`}
          >
            <div className="flex items-start gap-2.5">
              <span className={`mt-0.5 ${item.iconColor}`}>{item.icon}</span>
              <div>
                <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">{item.title}</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  {item.description}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap">
              {item.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
