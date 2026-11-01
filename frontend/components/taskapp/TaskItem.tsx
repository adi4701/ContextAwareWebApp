'use client';

import React, { useState } from 'react';
import { Task, useTaskStore } from '../../store/taskStore';
import { useAdaptationStore } from '../../store/adaptationStore';

interface TaskItemProps {
  task: Task;
  index: number;
  isSelected: boolean;
}

export default function TaskItem({ task, isSelected }: TaskItemProps) {
  const { toggleTask, deleteTask, updateTask } = useTaskStore();
  const state = useAdaptationStore((s) => s.state);
  const layoutDensity = useAdaptationStore((s) => s.layoutDensity);
  const lastAiSignal = useAdaptationStore((s) => s.lastAiSignal);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editNote, setEditNote] = useState(task.note);
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);

  // Adaptation parameters
  const isReader = state === 'reader';
  const isStruggling = state === 'struggling';
  const isCompact = layoutDensity === 'compact' || state === 'fast_navigator';
  const showNotesAdaptive = isReader || Boolean(lastAiSignal?.adaptation?.showNotes);
  const targetSizeLarge = isStruggling || lastAiSignal?.adaptation?.targetSize === 'large';

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;
    await updateTask(task._id, { title: editTitle.trim(), note: editNote.trim() });
    setIsEditing(false);
  };

  return (
    <div
      id={`task-item-${task._id}`}
      className={`group rounded-2xl border transition-all duration-200 ${
        isSelected
          ? 'ring-2 ring-blue-500 border-blue-500 shadow-md bg-blue-50/20 dark:bg-blue-950/20'
          : 'border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-800/80 hover:border-gray-300 dark:hover:border-gray-700 shadow-xs'
      } ${
        isCompact
          ? 'p-2.5 sm:p-3'
          : isReader
          ? 'p-5'
          : targetSizeLarge
          ? 'p-4 sm:p-5'
          : 'p-3.5 sm:p-4'
      }`}
    >
      {isEditing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-blue-400 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white outline-hidden focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            value={editNote}
            onChange={(e) => setEditNote(e.target.value)}
            rows={2}
            placeholder="Edit task note..."
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-white outline-hidden resize-none"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          {/* Left: Checkbox + Title + Note */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Checkbox Target */}
            <button
              type="button"
              id={`toggle-task-${task._id}`}
              onClick={() => toggleTask(task._id)}
              className={`shrink-0 rounded-xl transition-all flex items-center justify-center ${
                targetSizeLarge
                  ? 'w-8 h-8 sm:w-9 sm:h-9 mt-0.5 border-2'
                  : 'w-5 h-5 sm:w-6 sm:h-6 mt-0.5 border'
              } ${
                task.completed
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 bg-white dark:bg-gray-700/50'
              }`}
              aria-label={task.completed ? 'Mark task as incomplete' : 'Mark task as complete'}
            >
              {task.completed && (
                <svg
                  className={targetSizeLarge ? 'w-5 h-5' : 'w-3.5 h-3.5'}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            {/* Task Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  onClick={() => toggleTask(task._id)}
                  className={`cursor-pointer transition-colors break-words font-medium ${
                    isReader
                      ? 'text-base sm:text-lg leading-relaxed'
                      : isCompact
                      ? 'text-xs leading-snug'
                      : 'text-sm leading-normal'
                  } ${
                    task.completed
                      ? 'line-through text-gray-400 dark:text-gray-500'
                      : 'text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  {task.title}
                </span>

                {isSelected && (
                  <span className="shrink-0 text-[10px] uppercase font-black px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                    Selected
                  </span>
                )}
              </div>

              {/* Note Display (Auto expanded in Reader state or if toggled) */}
              {task.note && (
                <div className="mt-1.5">
                  {showNotesAdaptive || isNoteExpanded ? (
                    <div
                      className={`rounded-xl p-2.5 border border-gray-100 dark:border-gray-700/60 bg-gray-50/80 dark:bg-gray-900/40 text-gray-600 dark:text-gray-300 ${
                        isReader ? 'text-sm leading-relaxed' : 'text-xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{task.note}</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsNoteExpanded(true)}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <span>Show note preview</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {targetSizeLarge ? (
              // Struggling persona: explicit larger buttons with labels
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  id={`edit-task-${task._id}`}
                  onClick={() => setIsEditing(true)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200"
                >
                  Edit
                </button>
                <button
                  type="button"
                  id={`delete-task-${task._id}`}
                  onClick={() => deleteTask(task._id)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 border border-red-200 dark:border-red-800"
                >
                  Delete
                </button>
              </div>
            ) : (
              // Standard & Compact personas: icon buttons with hover reveal
              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  id={`edit-task-${task._id}`}
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Edit task"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  type="button"
                  id={`delete-task-${task._id}`}
                  onClick={() => deleteTask(task._id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  title="Delete task"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
