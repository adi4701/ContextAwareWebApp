'use client';

import React, { useEffect } from 'react';
import { startTracking, stopTracking } from '../lib/telemetry';
import { flushTelemetry } from '../lib/flushTelemetry';
import { getSocket } from '../lib/socket';
import { useAdaptationStore } from '../store/adaptationStore';

interface AdaptationProviderProps {
  children: React.ReactNode;
}

export default function AdaptationProvider({ children }: AdaptationProviderProps) {
  useEffect(() => {
    // 1. Start interaction tracking
    startTracking();

    // 2. Set up 5-second telemetry flush
    const intervalId = setInterval(() => {
      flushTelemetry();
    }, 5000);

    // 3. Connect socket and listen for real-time adaptations
    const socket = getSocket();
    const handleAdaptationUpdate = (signal: any) => {
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
  }, []);

  return <>{children}</>;
}
