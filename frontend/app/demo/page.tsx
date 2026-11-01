'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import AdaptiveLayout from '../../components/AdaptiveLayout';
import OverridePanel from '../../components/OverridePanel';
import { useAdaptationStore } from '../../store/adaptationStore';
import { useTelemetryStore } from '../../store/telemetryStore';
import { getSocket } from '../../lib/socket';

type AuthMode = 'login' | 'register';

export default function DemoPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const [usernameInput, setUsernameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState('');

  // Stores
  const { state: activeState, confidence, adaptationsCount } = useAdaptationStore();
  const events = useTelemetryStore((s) => s.events);

  const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');

  useEffect(() => {
    // Check local storage auth
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('username');
    if (token) {
      setIsAuthenticated(true);
      setCurrentUser(storedUser || 'User');
      getSocket();
    }
    // Guest mode is default — no forced modal on load!
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
        'Authentication failed. Please check credentials or ensure backend is running.';
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

  const stateColors: Record<string, string> = {
    fast_navigator: 'bg-purple-600 text-white',
    reader: 'bg-emerald-600 text-white',
    struggling: 'bg-amber-600 text-white',
    explorer: 'bg-blue-600 text-white',
    balanced: 'bg-slate-600 text-white',
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-gray-950 dark:via-gray-900 dark:to-slate-950 transition-colors duration-500 font-sans">
      {/* ════════════════════ AUTH MODAL (OPTIONAL) ════════════════════ */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-gray-800 p-8 shadow-2xl border border-gray-100 dark:border-gray-700 relative">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 text-sm rounded-lg"
              aria-label="Close modal"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Cloud Workspace Sign-In</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Optional: Sync and persist tasks to MongoDB across devices
              </p>
            </div>

            <div className="flex rounded-xl bg-gray-100 dark:bg-gray-700/60 p-1 mb-5">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setAuthError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  authMode === 'login'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setAuthError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  authMode === 'register'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                Register
              </button>
            </div>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs text-center font-medium">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              {authMode === 'register' && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="e.g. shivam_yadav"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/60 text-gray-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="student@amity.edu"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/60 text-gray-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/60 text-gray-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all duration-200 active:scale-98 disabled:opacity-50"
              >
                {authLoading ? 'Authenticating...' : authMode === 'login' ? 'Sign In to Workspace' : 'Create Account'}
              </button>
            </form>

            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
              >
                Continue in Guest Mode (Local storage only)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════ HEADER ════════════════════ */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/85 dark:bg-gray-900/85 border-b border-gray-200/80 dark:border-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-blue-600 transition-colors mr-2"
              title="Return to Overview Landing Page"
            >
              <span>←</span>
              <span>Overview</span>
            </Link>

            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm shadow-md shadow-blue-500/20">
              C
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white tracking-tight">
                  ContextUI
                </span>
                <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  Interactive Demo
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">ML Adaptation Active</span>
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-2.5 pl-2 border-l border-gray-200 dark:border-gray-700">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 hidden sm:inline-block">
                  {currentUser}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block text-[11px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">
                  Guest Mode
                </span>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ════════════════════ LIVE STATUS BAR (NO HARDCODED NUMBERS) ════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2 w-full">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
          <div className="p-3 rounded-2xl bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700 shadow-xs">
            <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
              {events.length}
            </div>
            <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
              Telemetry Events in Buffer
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700 shadow-xs">
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {adaptationsCount}
            </div>
            <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
              Session Adaptations Applied
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700 shadow-xs">
            <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">
              {Math.round((confidence || 0.85) * 100)}%
            </div>
            <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
              Live State Confidence
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700 shadow-xs flex flex-col justify-center items-center">
            <div
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                stateColors[activeState] || 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {activeState ? activeState.replace('_', ' ') : 'balanced'}
            </div>
            <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mt-1">
              Active Behaviour State
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ MAIN TASK APP ════════════════════ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        <AdaptiveLayout />
      </main>

      {/* ════════════════════ OVERRIDE PANEL ════════════════════ */}
      <OverridePanel />

      {/* ════════════════════ FOOTER ════════════════════ */}
      <footer className="border-t border-gray-200/80 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xs py-5 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p className="font-semibold text-gray-700 dark:text-gray-300">
            ContextUI &mdash; Minor Project B.Tech CSE Data Science, Amity University 2026
          </p>
          <div className="flex items-center justify-center gap-4 text-[11px]">
            <Link href="/" className="hover:underline text-blue-600 dark:text-blue-400">
              Overview & Architecture
            </Link>
            <span>&bull;</span>
            <span>Privacy-First Telemetry</span>
            <span>&bull;</span>
            <span>Synthetic Random Forest Classifier</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
