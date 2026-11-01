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
  dashboard: <DashboardSection />,
  analytics: <AnalyticsSection />,
  settings: <SettingsSection />,
  notifications: <NotificationsSection />,
  activity: <ActivitySection />,
  performance: <PerformanceSection />,
  quickactions: <QuickActionsSection />,
};

const defaultAllSections = [
  'dashboard',
  'analytics',
  'performance',
  'activity',
  'quickactions',
  'notifications',
  'settings',
];

export default function AdaptiveLayout() {
  const componentOrder = useAdaptationStore((state) => state.componentOrder);
  const layoutDensity = useAdaptationStore((state) => state.layoutDensity);

  // Preserve ML-directed order first, then append any remaining sections
  const primaryOrder = componentOrder && componentOrder.length > 0
    ? componentOrder
    : ['dashboard', 'analytics', 'settings', 'notifications'];

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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, type: 'spring', bounce: 0.2 }}
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
