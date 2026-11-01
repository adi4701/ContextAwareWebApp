'use client';

import React, { useState } from 'react';
import { useAdaptationStore } from '../../store/adaptationStore';

export default function TaskHelpTips() {
  const state = useAdaptationStore((s) => s.state);
  const lastAiSignal = useAdaptationStore((s) => s.lastAiSignal);
  const [dismissed, setDismissed] = useState(false);

  const isStruggling = state === 'struggling';
  const showFromSignal = Boolean(lastAiSignal?.adaptation?.showHelp);
  const isVisible = (isStruggling || showFromSignal) && !dismissed;

  if (!isVisible) return null;

  return (
    <div
      id="task-help-tips"
      className="w-full p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 shadow-sm animate-in slide-in-from-top duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-100">
              Helpful Tips & Assisted Mode
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-200 mt-1 leading-relaxed">
              We noticed repeated clicks or hesitation. Button targets have been enlarged with prominent text labels to make actions easier:
            </p>
            <ul className="mt-2 space-y-1 text-xs text-amber-700 dark:text-amber-300">
              <li className="flex items-center gap-1.5">
                <span className="font-bold">•</span>
                <span>Click the checkbox or press <strong>X</strong> to complete tasks.</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="font-bold">•</span>
                <span>Type in the top input to create a task, or click <strong>+ Add Task</strong>.</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="font-bold">•</span>
                <span>Filter between All, Active, and Done using the tabs above.</span>
              </li>
            </ul>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 p-1 text-xs rounded-lg"
          aria-label="Dismiss help tips"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
