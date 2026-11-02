'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdaptationStore } from '../store/adaptationStore';
import DashboardSection from './sections/DashboardSection';
import AnalyticsSection from './sections/AnalyticsSection';
import SettingsSection from './sections/SettingsSection';
import NotificationsSection from './sections/NotificationsSection';
import ActivitySection from './sections/ActivitySection';
import PerformanceSection from './sections/PerformanceSection';
import QuickActionsSection from './sections/QuickActionsSection';

const sectionComponentMap: Record<string, React.ReactNode> = {
  dashboard: <div id="dashboard" className="scroll-mt-20"><DashboardSection /></div>,
  analytics: <div id="analytics" className="scroll-mt-20"><AnalyticsSection /></div>,
  settings: <div id="settings" className="scroll-mt-20"><SettingsSection /></div>,
  notifications: <div id="notifications" className="scroll-mt-20"><NotificationsSection /></div>,
  activity: <div id="activity" className="scroll-mt-20"><ActivitySection /></div>,
  performance: <div id="performance" className="scroll-mt-20"><PerformanceSection /></div>,
  quickactions: <div id="quickactions" className="scroll-mt-20"><QuickActionsSection /></div>,
};

const defaultAllSections = [
  'quickactions',
  'performance',
  'dashboard',
  'analytics',
  'activity',
  'notifications',
  'settings',
];

export default function AdaptiveDashboard() {
  const componentOrder = useAdaptationStore((state) => state.componentOrder);
  const layoutDensity = useAdaptationStore((state) => state.layoutDensity);

  // Preserve ML-directed order with fallback to all 7 sections
  const primaryOrder = componentOrder && componentOrder.length > 0
    ? componentOrder
    : defaultAllSections;

  const effectiveOrder = [
    ...primaryOrder,
    ...defaultAllSections.filter((key) => !primaryOrder.includes(key)),
  ];

  const gridClass =
    layoutDensity === 'compact'
      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5'
      : layoutDensity === 'spacious'
      ? 'grid-cols-1 md:grid-cols-2 gap-7'
      : 'grid-cols-1 md:grid-cols-2 gap-5';

  return (
    <div className={`grid ${gridClass} w-full transition-all duration-300`}>
      <AnimatePresence mode="popLayout">
        {effectiveOrder.map((sectionKey) => {
          const component = sectionComponentMap[sectionKey];
          if (!component) return null;

          return (
            <motion.div
              key={sectionKey}
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, type: 'spring', bounce: 0.15 }}
              className="w-full"
            >
              {component}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
