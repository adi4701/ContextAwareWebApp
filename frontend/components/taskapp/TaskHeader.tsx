'use client';

import React, { useRef, useEffect } from 'react';
import { useTaskStore, TaskFilter } from '../../store/taskStore';
import { useAdaptationStore } from '../../store/adaptationStore';

export default function TaskHeader() {
  const { tasks, filter, setFilter, searchQuery, setSearchQuery } = useTaskStore();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const state = useAdaptationStore((s) => s.state);
  const lastAiSignal = useAdaptationStore((s) => s.lastAiSignal);

  const isExplorer = state === 'explorer';
  const emphasizeSearch = isExplorer || Boolean(lastAiSignal?.adaptation?.emphasizeSearch);

  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const activeCount = totalCount - completedCount;

  // Real keyboard shortcut: '/' focuses the search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/') {
        // If not already typing in an input
        const tag = (document.activeElement?.tagName || '').toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filterOptions: { label: string; value: TaskFilter; count: number }[] = [
    { label: 'All Tasks', value: 'all', count: totalCount },
    { label: 'Active', value: 'active', count: activeCount },
    { label: 'Done', value: 'completed', count: completedCount },
  ];

  return (
    <div
      id="task-header"
      className={`space-y-4 ${
        emphasizeSearch
          ? 'sticky top-16 z-30 p-4 -mx-2 rounded-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-2 border-blue-500/50 shadow-xl'
          : ''
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Adaptive Task Workspace
            </h2>
            {emphasizeSearch && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                Explorer Mode (Search Pinned)
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {completedCount} of {totalCount} completed ({totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)}%)
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700/60 self-start sm:self-auto">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              id={`filter-tab-${opt.value}`}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                filter === opt.value
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>{opt.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  filter === opt.value
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {opt.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          ref={searchInputRef}
          id="task-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tasks or notes... (Press '/' to focus)"
          className={`w-full pl-10 pr-12 py-2.5 rounded-xl border text-sm transition-all outline-hidden ${
            emphasizeSearch
              ? 'border-blue-500 bg-white dark:bg-gray-800 ring-2 ring-blue-500/20 shadow-md text-gray-900 dark:text-white'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
          }`}
        />
        {searchQuery ? (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs"
          >
            Clear
          </button>
        ) : (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
              /
            </kbd>
          </div>
        )}
      </div>
    </div>
  );
}
