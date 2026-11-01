'use client';

import React, { useEffect } from 'react';
import { useAdaptationStore } from '../store/adaptationStore';
import DarkNoiseGradientBg from './ui/noise-dark-blue-gradient-with-squares';

interface ThemeWrapperProps {
  children: React.ReactNode;
}

export default function ThemeWrapper({ children }: ThemeWrapperProps) {
  const theme = useAdaptationStore((state) => state.theme);

  useEffect(() => {
    // Keep documentElement class in sync for global HTML styles
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      {theme === 'dark' && (
        <DarkNoiseGradientBg className="fixed inset-0 z-0 pointer-events-none" />
      )}
      <div className="relative z-10 min-h-screen bg-transparent text-gray-900 dark:text-gray-100 transition-colors duration-500">
        {children}
      </div>
    </div>
  );
}
