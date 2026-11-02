import axios from 'axios';
import { useTelemetryStore } from '../store/telemetryStore';
import { computeRollingFeatures, hasConsent } from './telemetry';

export async function flushTelemetry(): Promise<void> {
  if (typeof window === 'undefined') return;

  // 1. Consent Check: When off, NOTHING is sent
  if (!hasConsent()) {
    return;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    return;
  }

  const store = useTelemetryStore.getState();
  const buffer = store.flushAndGetBuffer();
  const sessionDuration = store.getSessionDuration();
  const clickCount = store.cumulativeClicks;
  const uniqueElementsClicked = store.uniqueElementsSet.size;
  const avgScrollDepth = store.lastKnownScrollDepth;
  const navigationDepth = store.cumulativeNavigationDepth;
  const sessionStartMs = store.sessionStart.getTime();

  // Compute 8 behavioural features over rolling 20s window
  const features = computeRollingFeatures();

  const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');

  try {
    const res = await axios.post(
      `${backendUrl}/api/telemetry`,
      {
        sessionId: store.sessionId,

        // 8-feature rolling window vector
        features,
        featureVector: features,
        clicks_per_min: features.clicks_per_min,
        unique_click_ratio: features.unique_click_ratio,
        repeat_click_ratio: features.repeat_click_ratio,
        scroll_speed: features.scroll_speed,
        max_scroll_depth: features.max_scroll_depth,
        key_presses_per_min: features.key_presses_per_min,
        idle_ratio: features.idle_ratio,
        view_switches_per_min: features.view_switches_per_min,

        // Extended session context
        sessionScrollDepthMax: store.maxScrollDepth,
        viewSwitchCount: navigationDepth,
        sessionStartMs,

        // Legacy fields for backward compatibility
        clickCount,
        uniqueElementsClicked,
        avgScrollDepth: parseFloat(avgScrollDepth.toFixed(2)),
        sessionDuration: parseFloat(sessionDuration.toFixed(2)),
        navigationDepth,
        rawEvents: buffer,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 4000,
      }
    );

    // Fallback: If HTTP returned adaptation, sync to adaptation store
    if (res.data?.adaptation) {
      const { useAdaptationStore } = await import('../store/adaptationStore');
      useAdaptationStore.getState().setAdaptation(res.data.adaptation);
    }
  } catch (error) {
    // Mark connection degraded if backend is unreachable
    try {
      const { useAdaptationStore } = await import('../store/adaptationStore');
      useAdaptationStore.getState().setAdaptation({
        mlServiceAvailable: false,
        state: 'balanced',
        reasons: ['Inference connection unreachable — standard layout maintained'],
      });
    } catch {
      // Ignore
    }
  }
}
