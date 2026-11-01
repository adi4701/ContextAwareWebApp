import { create } from 'zustand';
import axios from 'axios';
import { trackViewSwitch } from '../lib/telemetry';

export interface Task {
  _id: string;
  title: string;
  completed: boolean;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskFilter = 'all' | 'active' | 'completed';

interface TaskState {
  tasks: Task[];
  filter: TaskFilter;
  searchQuery: string;
  selectedIndex: number;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;

  fetchTasks: () => Promise<void>;
  addTask: (title: string, note?: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  updateTask: (id: string, updates: Partial<Pick<Task, 'title' | 'note' | 'completed'>>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setFilter: (filter: TaskFilter) => void;
  setSearchQuery: (query: string) => void;
  setSelectedIndex: (index: number) => void;
  moveSelection: (direction: 'up' | 'down') => void;
  toggleSelectedTask: () => void;
}

const GUEST_STORAGE_KEY = 'context_ui_guest_tasks';

const getInitialGuestTasks = (): Task[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }

  // Sensible default tasks for first-time visitors
  const defaults: Task[] = [
    {
      _id: 'task_default_1',
      title: 'Review machine learning pipeline architecture',
      completed: true,
      note: 'Random Forest classifier with 8 rolling behavioural features',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      _id: 'task_default_2',
      title: 'Explore UI adaptation modes with natural typing and clicking',
      completed: false,
      note: 'Fast Navigator (compact), Reader (spacious), Struggling (large buttons), Explorer (pinned search)',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      _id: 'task_default_3',
      title: 'Test keyboard shortcuts (n for new, / for search, j/k to move, x to toggle)',
      completed: false,
      note: 'All shortcuts work globally; shortcut bar adapts dynamically for power users',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(defaults));
    } catch {
      // ignore
    }
  }

  return defaults;
};

const saveGuestTasks = (tasks: Task[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // ignore
  }
};

const getBackendUrl = () => {
  return (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');
};

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  filter: 'all',
  searchQuery: '',
  selectedIndex: 0,
  isLoading: false,
  isSyncing: false,
  error: null,

  fetchTasks: async () => {
    const token = getAuthToken();
    if (!token) {
      // Guest mode
      const guestTasks = getInitialGuestTasks();
      set({ tasks: guestTasks, isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const res = await axios.get(`${getBackendUrl()}/api/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });
      if (res.data && res.data.tasks) {
        set({ tasks: res.data.tasks, isLoading: false });
      }
    } catch (err: any) {
      // If backend fails, fallback to local guest tasks
      const guestTasks = getInitialGuestTasks();
      set({
        tasks: guestTasks,
        isLoading: false,
        error: err.response?.data?.error || 'Failed to sync with cloud. Using local storage.',
      });
    }
  },

  addTask: async (title: string, note = '') => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const token = getAuthToken();
    const tempId = 'task_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
    const newTask: Task = {
      _id: tempId,
      title: trimmedTitle,
      note: (note || '').trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistically update store
    set((state) => {
      const nextTasks = [newTask, ...state.tasks];
      if (!token) saveGuestTasks(nextTasks);
      return { tasks: nextTasks, selectedIndex: 0 };
    });

    if (token) {
      set({ isSyncing: true });
      try {
        const res = await axios.post(
          `${getBackendUrl()}/api/tasks`,
          { title: trimmedTitle, note },
          {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            timeout: 5000,
          }
        );
        if (res.data && res.data.task) {
          // Replace temp task with server task
          set((state) => ({
            tasks: state.tasks.map((t) => (t._id === tempId ? res.data.task : t)),
            isSyncing: false,
          }));
        }
      } catch (err) {
        set({ isSyncing: false });
      }
    }
  },

  toggleTask: async (id: string) => {
    const currentTask = get().tasks.find((t) => t._id === id);
    if (!currentTask) return;

    const newCompleted = !currentTask.completed;
    const token = getAuthToken();

    // Optimistic update
    set((state) => {
      const nextTasks = state.tasks.map((t) =>
        t._id === id ? { ...t, completed: newCompleted, updatedAt: new Date().toISOString() } : t
      );
      if (!token) saveGuestTasks(nextTasks);
      return { tasks: nextTasks };
    });

    if (token) {
      try {
        await axios.patch(
          `${getBackendUrl()}/api/tasks/${id}`,
          { completed: newCompleted },
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 4000,
          }
        );
      } catch {
        // preserve optimistic state
      }
    }
  },

  updateTask: async (id: string, updates) => {
    const token = getAuthToken();
    set((state) => {
      const nextTasks = state.tasks.map((t) =>
        t._id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      );
      if (!token) saveGuestTasks(nextTasks);
      return { tasks: nextTasks };
    });

    if (token) {
      try {
        await axios.patch(`${getBackendUrl()}/api/tasks/${id}`, updates, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 4000,
        });
      } catch {
        // ignore
      }
    }
  },

  deleteTask: async (id: string) => {
    const token = getAuthToken();
    set((state) => {
      const nextTasks = state.tasks.filter((t) => t._id !== id);
      if (!token) saveGuestTasks(nextTasks);
      const nextIndex = Math.max(0, Math.min(state.selectedIndex, nextTasks.length - 1));
      return { tasks: nextTasks, selectedIndex: nextIndex };
    });

    if (token) {
      try {
        await axios.delete(`${getBackendUrl()}/api/tasks/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 4000,
        });
      } catch {
        // ignore
      }
    }
  },

  setFilter: (filter: TaskFilter) => {
    trackViewSwitch(`filter:${filter}`);
    set({ filter, selectedIndex: 0 });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query, selectedIndex: 0 });
  },

  setSelectedIndex: (index: number) => {
    set({ selectedIndex: index });
  },

  moveSelection: (direction: 'up' | 'down') => {
    const { tasks, filter, searchQuery, selectedIndex } = get();
    const filtered = tasks.filter((t) => {
      if (filter === 'active' && t.completed) return false;
      if (filter === 'completed' && !t.completed) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return t.title.toLowerCase().includes(q) || (t.note && t.note.toLowerCase().includes(q));
      }
      return true;
    });

    if (filtered.length === 0) return;

    if (direction === 'down') {
      const next = (selectedIndex + 1) % filtered.length;
      set({ selectedIndex: next });
    } else {
      const next = (selectedIndex - 1 + filtered.length) % filtered.length;
      set({ selectedIndex: next });
    }
  },

  toggleSelectedTask: () => {
    const { tasks, filter, searchQuery, selectedIndex } = get();
    const filtered = tasks.filter((t) => {
      if (filter === 'active' && t.completed) return false;
      if (filter === 'completed' && !t.completed) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return t.title.toLowerCase().includes(q) || (t.note && t.note.toLowerCase().includes(q));
      }
      return true;
    });

    if (filtered.length > 0 && filtered[selectedIndex]) {
      get().toggleTask(filtered[selectedIndex]._id);
    }
  },
}));
