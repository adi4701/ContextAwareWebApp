'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAdaptationStore } from '../store/adaptationStore';
import TaskManager from './taskapp/TaskManager';

export default function AdaptiveLayout() {
  const layoutDensity = useAdaptationStore((state) => state.layoutDensity);
  const state = useAdaptationStore((s) => s.state);

  const containerPadding =
    layoutDensity === 'compact' || state === 'fast_navigator'
      ? 'p-2 sm:p-4'
      : layoutDensity === 'spacious' || state === 'reader'
      ? 'p-6 sm:p-8'
      : 'p-4 sm:p-6';

  return (
    <motion.div
      layout
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`w-full rounded-3xl transition-all duration-300 ${containerPadding}`}
    >
      <TaskManager />
    </motion.div>
  );
}
