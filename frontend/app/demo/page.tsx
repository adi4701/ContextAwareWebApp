'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import AdaptiveLayout from '../../components/AdaptiveLayout';
import OverridePanel from '../../components/OverridePanel';
import NewsSandbox from '../../components/NewsSandbox';
import AdaptationReportModal from '../../components/AdaptationReportModal';
import { useAdaptationStore } from '../../store/adaptationStore';
import { useTelemetryStore } from '../../store/telemetryStore';
import { getSocket } from '../../lib/socket';
import { Newspaper, CheckSquare, BarChart2, Sparkles, ExternalLink, Activity, ArrowUpRight } from 'lucide-react';

type AuthMode = 'login' | 'register';
type WorkspaceMode = 'sandbox' | 'tasks';

export default function DemoPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceMode>('sandbox');

  const [usernameInput, setUsernameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState('');

  // Stores
  const { state: activeState, confidence, adaptationsCount, toggleXaiModal } = useAdaptationStore();
  const events = useTelemetryStore((s) => s.events);

  const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('username');
    if (token) {
      setIsAuthenticated(true);
      setCurrentUser(storedUser || 'User');
      getSocket();
    }
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authMode === 'register') {
        if (!usernameInput.trim()) {
          setAuthError('Please enter a username');
          setAuthLoading(false);
          return;
        }

        await axios.post(`${backendUrl}/api/auth/register`, {
          username: usernameInput.trim(),
          email: emailInput.trim(),
          password: passwordInput,
        });
      }

      const loginRes = await axios.post(`${backendUrl}/api/auth/login`, {
        email: emailInput.trim(),
        password: passwordInput,
      });

      const { token, userId, username } = loginRes.data;

      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
      localStorage.setItem('username', username);

      setCurrentUser(username);
      setIsAuthenticated(true);
      setShowAuthModal(false);
      getSocket();
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.error ||
        err?.message ||
        'Authentication failed. Please verify credentials.';
      setAuthError(errorMsg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    window.location.reload();
  };

  const stateBadges: Record<string, { label: string; color: string }> = {
    fast_navigator: { label: 'Terminal / Power', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
    power_user: { label: 'Analyst Terminal', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
    reader: { label: 'Focus Reader', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
    deep_reader: { label: 'Deep Reader', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
    struggling: { label: 'Cognitive Assist', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
    assistive_mode: { label: 'Cognitive Assist', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
    explorer: { label: 'Skimmer Feed', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    fast_scanner: { label: 'Fast Scanner', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    balanced: { label: 'Balanced Baseline', color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30' },
  };

  const currentBadge = stateBadges[activeState] || stateBadges.balanced;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAF9F6] dark:bg-[#070709] text-zinc-900 dark:text-zinc-100 transition-colors duration-500 font-sans selection:bg-emerald-500/20 selection:text-emerald-700 dark:selection:text-emerald-300">
      {/* ════════════════════ AUTH MODAL ════════════════════ */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl glass-panel p-8 shadow-2xl relative border border-zinc-200/80 dark:border-zinc-800">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-200 p-1 text-sm rounded-lg"
              aria-label="Close modal"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-mono font-bold text-lg mb-3 shadow-md">
                C
              </div>
              <h2 className="text-2xl font-display font-extrabold tracking-tight">Cloud Workspace</h2>
              <p className="text-xs text-zinc-500 mt-1 font-mono">
                Sync behavioral vectors & adaptations to MongoDB
              </p>
            </div>

            <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-900 p-1 mb-5 border border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setAuthError(''); }}
                className={`flex-1 py-2 text-xs font-mono font-bold rounded-lg transition-all ${
                  authMode === 'login'
                    ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setAuthError(''); }}
                className={`flex-1 py-2 text-xs font-mono font-bold rounded-lg transition-all ${
                  authMode === 'register'
                    ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Register
              </button>
            </div>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs text-center font-medium">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              {authMode === 'register' && (
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="shivam_yadav"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 text-zinc-900 dark:text-white text-sm focus:outline-hidden focus:border-emerald-500 transition-colors font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="student@amity.edu"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 text-zinc-900 dark:text-white text-sm focus:outline-hidden focus:border-emerald-500 transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 text-zinc-900 dark:text-white text-sm focus:outline-hidden focus:border-emerald-500 transition-colors font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full mt-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all duration-200 active:scale-98 disabled:opacity-50"
              >
                {authLoading ? 'Authenticating...' : authMode === 'login' ? 'Proceed to Workspace' : 'Create Credentials'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="text-[11px] font-mono text-zinc-500 hover:text-zinc-300 underline"
              >
                Remain in Guest Mode (Ephemeral local session)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════ ARCHITECTURAL HEADER ════════════════════ */}
      <header className="sticky top-0 z-40 backdrop-blur-2xl bg-[#FAF9F6]/80 dark:bg-[#070709]/80 border-b border-zinc-200/60 dark:border-zinc-800/60 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mr-2"
              title="Return to Overview"
            >
              <span>&larr;</span>
              <span>INDEX</span>
            </Link>

            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-mono font-extrabold text-sm shadow-sm">
              C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-base sm:text-lg tracking-tight">
                  ContextUI
                </span>
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  v2.0
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel border border-emerald-500/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                ML Pipeline Synced
              </span>
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-2.5 pl-2 border-l border-zinc-200 dark:border-zinc-800">
                <span className="text-xs font-mono text-zinc-400 hidden sm:inline-block">
                  {currentUser}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-widest text-zinc-500 px-2 py-1">
                  Guest
                </span>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-black transition-all shadow-sm"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ════════════════════ DUAL WORKSPACE NAVIGATION BAR ════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2 w-full">
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60">
          {/* Minimalist Switcher Pills */}
          <div className="flex items-center p-1 rounded-2xl bg-zinc-200/50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800">
            <button
              onClick={() => setActiveWorkspace('sandbox')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                activeWorkspace === 'sandbox'
                  ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-zinc-200/60 dark:border-zinc-700'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Newspaper className="w-3.5 h-3.5" />
              <span>ContextPulse News Sandbox</span>
            </button>

            <button
              onClick={() => setActiveWorkspace('tasks')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                activeWorkspace === 'tasks'
                  ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-zinc-200/60 dark:border-zinc-700'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Adaptive Tasks</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleXaiModal(true)}
              className="px-3.5 py-2 rounded-full glass-panel hover:bg-zinc-200/40 dark:hover:bg-zinc-800/50 text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>XAI Audit Log</span>
            </button>

            <Link
              href="/lab"
              className="px-3.5 py-2 rounded-full glass-panel hover:bg-zinc-200/40 dark:hover:bg-zinc-800/50 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <BarChart2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Evaluation Lab</span>
              <ArrowUpRight className="w-3 h-3 text-zinc-400" />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════ LIVE STATUS BAR (MINIMALIST CARDS) ════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 w-full">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto font-mono">
          <div className="p-3.5 rounded-2xl glass-card">
            <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">
              Buffered Events
            </div>
            <div className="text-xl sm:text-2xl font-display font-extrabold text-zinc-900 dark:text-white mt-1">
              {events.length}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl glass-card">
            <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">
              Adaptations
            </div>
            <div className="text-xl sm:text-2xl font-display font-extrabold text-emerald-500 mt-1">
              {adaptationsCount}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl glass-card">
            <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">
              Confidence
            </div>
            <div className="text-xl sm:text-2xl font-display font-extrabold text-indigo-400 mt-1">
              {Math.round((confidence || 0.85) * 100)}%
            </div>
          </div>

          <div className="p-3.5 rounded-2xl glass-card flex flex-col justify-between">
            <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">
              Active Persona
            </div>
            <div className={`mt-1 text-xs font-bold px-2 py-0.5 rounded-full border inline-block w-fit ${currentBadge.color}`}>
              {currentBadge.label}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ MAIN VIEWPORT ════════════════════ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full flex-1">
        {activeWorkspace === 'sandbox' ? (
          <NewsSandbox />
        ) : (
          <AdaptiveLayout />
        )}
      </main>

      {/* ════════════════════ PANELS & AUDIT ════════════════════ */}
      <OverridePanel />
      <AdaptationReportModal />

      {/* ════════════════════ MINIMALIST FOOTER ════════════════════ */}
      <footer className="border-t border-zinc-200/60 dark:border-zinc-800/60 py-6 mt-12 text-xs font-mono text-zinc-500 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            ContextUI &mdash; Minor Project B.Tech CSE Data Science 2026
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/" className="hover:underline hover:text-zinc-200">
              Architecture Index
            </Link>
            <span>&bull;</span>
            <Link href="/lab" className="hover:underline hover:text-zinc-200">
              Model Lab
            </Link>
            <span>&bull;</span>
            <span>Zero-Knowledge Telemetry</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
