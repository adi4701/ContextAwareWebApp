'use client';

import React, { useEffect } from 'react';
import { startTracking, stopTracking } from '../lib/telemetry';
import { flushTelemetry } from '../lib/flushTelemetry';
import { getSocket } from '../lib/socket';
import { useAdaptationStore, AdaptationSignal } from '../store/adaptationStore';
import { useTelemetryStore } from '../store/telemetryStore';
import ConsentBanner from './ConsentBanner';

interface AdaptationProviderProps {
  children: React.ReactNode;
}

export default function AdaptationProvider({ children }: AdaptationProviderProps) {
  const consentGiven = useTelemetryStore((state) => state.consentGiven);

  useEffect(() => {
    // 1. Manage tracking based on consent
    if (consentGiven) {
      startTracking();
    } else {
      stopTracking();
    }

    // 2. Set up 5-second telemetry flush
    const intervalId = setInterval(() => {
      flushTelemetry();
    }, 5000);

    // 3. Connect socket and listen for real-time adaptations
    const socket = getSocket();
    const handleAdaptationUpdate = (signal: AdaptationSignal) => {
      if (signal) {
        useAdaptationStore.getState().setAdaptation(signal);
      }
    };

    if (socket) {
      socket.on('adaptation:update', handleAdaptationUpdate);
    }

    // 4. Cleanup on unmount
    return () => {
      stopTracking();
      clearInterval(intervalId);
      if (socket) {
        socket.off('adaptation:update', handleAdaptationUpdate);
      }
    };
  }, [consentGiven]);

  return (
    <>
      {children}
      <ConsentBanner />
    </>
  );
}
