'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTaskStore } from '../../store/taskStore';
import { useAdaptationStore } from '../../store/adaptationStore';

export default function TaskInput() {
  const addTask = useTaskStore((s) => s.addTask);
  const state = useAdaptationStore((s) => s.state);
  const lastAiSignal = useAdaptationStore((s) => s.lastAiSignal);

  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const isStruggling = state === 'struggling';
  const isReader = state === 'reader';
  const showNotesDefault = isReader || Boolean(lastAiSignal?.adaptation?.showNotes);

  useEffect(() => {
    if (showNotesDefault) {
      setIsNoteExpanded(true);
    }
  }, [showNotesDefault]);

  // Real keyboard shortcut: 'n' focuses new task input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'n' || e.key === 'N') {
        const tag = (document.activeElement?.tagName || '').toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          titleInputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await addTask(title.trim(), note.trim());
    setTitle('');
    setNote('');
    if (!showNotesDefault) {
      setIsNoteExpanded(false);
    }
  };

  return (
    <form
      id="task-create-form"
      onSubmit={handleSubmit}
      className={`rounded-2xl border transition-all ${
        isStruggling
          ? 'p-5 bg-white dark:bg-gray-800 border-blue-400 dark:border-blue-500 shadow-lg'
          : 'p-4 bg-white dark:bg-gray-800/90 border-gray-200 dark:border-gray-700/80 shadow-xs'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <input
            ref={titleInputRef}
            id="task-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done? (Press 'n' to focus)"
            className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-900 transition-all ${
              isStruggling ? 'text-base py-3' : 'text-sm'
            }`}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="task-note-toggle-btn"
            onClick={() => setIsNoteExpanded(!isNoteExpanded)}
            className={`px-3 py-2.5 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5 ${
              isNoteExpanded
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>{isNoteExpanded ? 'Hide Note' : '+ Add Note'}</span>
          </button>

          <button
            type="submit"
            id="task-submit-btn"
            disabled={!title.trim()}
            className={`rounded-xl font-bold text-white transition-all shadow-md active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed ${
              isStruggling
                ? 'px-6 py-3 text-sm bg-blue-600 hover:bg-blue-700 shadow-blue-500/30 font-black'
                : 'px-4 py-2.5 text-xs bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
            }`}
          >
            {isStruggling ? '+ Add New Task' : 'Add Task'}
          </button>
        </div>
      </div>

      {/* Expandable Optional Note */}
      {isNoteExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60 animate-in fade-in slide-in-from-top-1 duration-200">
          <textarea
            id="task-note-input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Add detailed notes, links, or context (optional)..."
            className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all resize-none"
          />
        </div>
      )}
    </form>
  );
}
