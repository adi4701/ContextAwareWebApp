'use client';

import React, { useEffect } from 'react';
import { useTaskStore } from '../../store/taskStore';
import { useAdaptationStore } from '../../store/adaptationStore';
import TaskItem from './TaskItem';

export default function TaskList() {
  const {
    tasks,
    filter,
    searchQuery,
    selectedIndex,
    moveSelection,
    toggleSelectedTask,
    isLoading,
  } = useTaskStore();

  const layoutDensity = useAdaptationStore((s) => s.layoutDensity);
  const state = useAdaptationStore((s) => s.state);

  // Filter tasks based on status and search query
  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active' && t.completed) return false;
    if (filter === 'completed' && !t.completed) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchNote = t.note && t.note.toLowerCase().includes(q);
      return matchTitle || matchNote;
    }
    return true;
  });

  // Global Keyboard Shortcuts:
  // j / k: navigate up / down
  // x: toggle completion of selected task
  // Escape: unfocus active element
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      const isInputFocused = activeTag === 'input' || activeTag === 'textarea';

      if (e.key === 'Escape') {
        if (isInputFocused) {
          (document.activeElement as HTMLElement)?.blur();
        }
        return;
      }

      // If user is actively typing in an input, do not trigger navigation/toggle shortcuts
      if (isInputFocused) return;

      if (e.key === 'j' || e.key === 'J' || e.key === 'ArrowDown') {
        e.preventDefault();
        moveSelection('down');
      } else if (e.key === 'k' || e.key === 'K' || e.key === 'ArrowUp') {
        e.preventDefault();
        moveSelection('up');
      } else if (e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        toggleSelectedTask();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveSelection, toggleSelectedTask]);

  if (isLoading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-400">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold">Loading task workspace...</span>
      </div>
    );
  }

  if (filteredTasks.length === 0) {
    return (
      <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-400 mb-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">No tasks found</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
          {searchQuery
            ? `No tasks matched your search "${searchQuery}". Try a different keyword.`
            : filter !== 'all'
            ? `You have no ${filter} tasks right now.`
            : "Your task list is empty. Press 'n' or use the input above to add your first task!"}
        </p>
      </div>
    );
  }

  const isCompact = layoutDensity === 'compact' || state === 'fast_navigator';
  const isSpacious = layoutDensity === 'spacious' || state === 'reader';

  const spacingClass = isCompact ? 'space-y-2' : isSpacious ? 'space-y-4' : 'space-y-3';

  return (
    <div className={`w-full ${spacingClass} transition-all duration-300`}>
      {filteredTasks.map((task, idx) => (
        <TaskItem
          key={task._id}
          task={task}
          index={idx}
          isSelected={idx === selectedIndex}
        />
      ))}
    </div>
  );
}
