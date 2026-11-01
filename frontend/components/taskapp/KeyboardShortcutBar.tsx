'use client';

import React from 'react';
import { useAdaptationStore } from '../../store/adaptationStore';

interface KeyboardShortcutBarProps {
  forceVisible?: boolean;
}

export default function KeyboardShortcutBar({ forceVisible = false }: KeyboardShortcutBarProps) {
  const state = useAdaptationStore((s) => s.state);
  const lastAiSignal = useAdaptationStore((s) => s.lastAiSignal);

  // Visible if fast_navigator, or adaptation hints showShortcuts, or explicitly requested
  const isFastNavigator = state === 'fast_navigator';
  const showFromSignal = Boolean(lastAiSignal?.adaptation?.showShortcuts);
  const isVisible = forceVisible || isFastNavigator || showFromSignal;

  if (!isVisible) return null;

  return (
    <div
      id="keyboard-shortcut-bar"
      className="w-full flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 text-slate-100 border border-slate-700/80 shadow-md backdrop-blur-sm animate-in fade-in slide-in-from-top-1 duration-200"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
          Fast Navigator Bar
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-800 border border-slate-600 rounded-md text-amber-300 shadow-xs">
            N
          </kbd>
          <span className="text-slate-300 text-[11px]">New task</span>
        </div>

        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-800 border border-slate-600 rounded-md text-amber-300 shadow-xs">
            /
          </kbd>
          <span className="text-slate-300 text-[11px]">Search</span>
        </div>

        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-800 border border-slate-600 rounded-md text-amber-300 shadow-xs">
            J
          </kbd>
          <span className="text-slate-400 text-[10px]">/</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-800 border border-slate-600 rounded-md text-amber-300 shadow-xs">
            K
          </kbd>
          <span className="text-slate-300 text-[11px]">Navigate</span>
        </div>

        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-800 border border-slate-600 rounded-md text-amber-300 shadow-xs">
            X
          </kbd>
          <span className="text-slate-300 text-[11px]">Toggle complete</span>
        </div>

        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-800 border border-slate-600 rounded-md text-slate-400 shadow-xs">
            ESC
          </kbd>
          <span className="text-slate-400 text-[11px]">Unfocus</span>
        </div>
      </div>
    </div>
  );
}
