'use client';

import React, { useState, useEffect } from 'react';
import { useTelemetryStore } from '../store/telemetryStore';
import { setConsent, hasConsent } from '../lib/telemetry';

export default function ConsentBanner() {
  const consentGiven = useTelemetryStore((state) => state.consentGiven);
  const [mounted, setMounted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    setMounted(true);
    // If a consent preference was already stored in localStorage, start minimized
    const stored = localStorage.getItem('telemetry_consent');
    if (stored !== null) {
      setIsMinimized(true);
    }
  }, []);

  if (!mounted) return null;

  const handleToggle = (newVal: boolean) => {
    setConsent(newVal);
  };

  // Minimized floating pill allowing the user to re-open settings anytime
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-in fade-in duration-200">
        <button
          onClick={() => setIsMinimized(false)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-md transition-all border ${
            consentGiven
              ? 'bg-blue-600/90 text-white border-blue-400 hover:bg-blue-700'
              : 'bg-gray-800/90 text-gray-300 border-gray-700 hover:bg-gray-800'
          }`}
          title="Click to adjust adaptive telemetry and privacy settings"
        >
          <span className={`inline-block w-2 h-2 rounded-full ${consentGiven ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
          <span>Telemetry: {consentGiven ? 'Active' : 'Off'}</span>
          <span className="text-[10px] opacity-70 underline ml-1">Settings</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-lg z-50 animate-in slide-in-from-bottom duration-300">
      <div className="rounded-2xl p-4 sm:p-5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-2xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${consentGiven ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Adaptive UI & Telemetry Consent</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Privacy-First Behavioral Adaptation</p>
            </div>
          </div>
          <button
            onClick={() => setIsMinimized(true)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg text-xs"
            aria-label="Minimize consent banner"
          >
            ✕
          </button>
        </div>

        <p className="mt-2.5 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
          ContextUI monitors anonymous interaction timings (click rate, scroll speed, idle intervals) to reshape the UI to your working style.
          <strong className="block mt-1 text-gray-800 dark:text-gray-200">
            🔒 We never capture typed text, keystrokes, or personal data. Only counts and timings are processed.
          </strong>
        </p>

        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              role="switch"
              aria-checked={consentGiven}
              onClick={() => handleToggle(!consentGiven)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                consentGiven ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  consentGiven ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {consentGiven ? 'Telemetry Enabled' : 'Telemetry Disabled'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!consentGiven ? (
              <button
                onClick={() => {
                  handleToggle(true);
                  setIsMinimized(true);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
              >
                Accept & Enable
              </button>
            ) : (
              <button
                onClick={() => setIsMinimized(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all"
              >
                Save & Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
