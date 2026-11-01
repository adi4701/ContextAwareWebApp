'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useAdaptationStore } from '../store/adaptationStore';
import TaskManager from './taskapp/TaskManager';
import WhyAdaptedPanel from './WhyAdaptedPanel';

export default function AdaptiveLayout() {
  const { state, adaptation } = useAdaptationStore();
  const shouldReduceMotion = useReducedMotion();

  const density = adaptation?.density || 'standard';
  const textScale = adaptation?.textScale || 1.0;
  const targetSize = adaptation?.targetSize || 'normal';

  // Responsive padding based on density
  const containerPadding =
    density === 'compact' || state === 'fast_navigator'
      ? 'p-2 sm:p-3'
      : density === 'spacious' || state === 'reader'
      ? 'p-6 sm:p-8'
      : 'p-4 sm:p-6';

  // CSS variables applied dynamically to container
  const cssVariables = {
    '--app-text-scale': `${textScale}`,
    '--app-target-min-size': targetSize === 'large' ? '48px' : '36px',
    fontSize: `${textScale}rem`,
  } as React.CSSProperties;

  return (
    <div style={cssVariables} className="w-full transition-all duration-300">
      <motion.div
        layout={!shouldReduceMotion}
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 15 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{
          duration: shouldReduceMotion ? 0.05 : 0.35,
          ease: 'easeOut',
        }}
        className={`w-full rounded-3xl transition-all duration-300 ${containerPadding}`}
      >
        <TaskManager />
      </motion.div>

      {/* Floating Explainability Panel ("Why did the UI change?") */}
      <WhyAdaptedPanel />
    </div>
  );
}
