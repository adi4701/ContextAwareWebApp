'use client';

import React, { useEffect } from 'react';
import { useTaskStore } from '../../store/taskStore';
import KeyboardShortcutBar from './KeyboardShortcutBar';
import TaskHelpTips from './TaskHelpTips';
import TaskHeader from './TaskHeader';
import TaskInput from './TaskInput';
import TaskList from './TaskList';

export default function TaskManager() {
  const fetchTasks = useTaskStore((s) => s.fetchTasks);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <div id="task-manager-root" className="w-full max-w-4xl mx-auto space-y-6">
      {/* Keyboard Shortcut Banner (Adapts dynamically to fast_navigator) */}
      <KeyboardShortcutBar />

      {/* Helpful Tips (Adapts dynamically to struggling) */}
      <TaskHelpTips />

      {/* Main Task Card */}
      <div className="space-y-6">
        <TaskHeader />
        <TaskInput />
        <TaskList />
      </div>
    </div>
  );
}
