import axios from 'axios';
import { useTelemetryStore } from '../store/telemetryStore';
import { useAdaptationStore } from '../store/adaptationStore';
import { computeRollingFeatures, hasConsent } from './telemetry';
import { classifyBehaviorClient } from './clientClassifier';

export async function flushTelemetry(): Promise<void> {
  if (typeof window === 'undefined') return;

  // Consent Check: When consent is revoked, do not track or send
  if (!hasConsent()) return;

  const store = useTelemetryStore.getState();
  if (!store.trackingEnabled) return;

  const adaptationStore = useAdaptationStore.getState();
  // If simulation is manually locked by user, skip auto-adapting over the lock
  const isSimulationLocked = 'state' in adaptationStore.userOverrides;

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const currentEvents = [...store.events];
  const sessionDuration = store.getSessionDuration();
  const clickCount = store.cumulativeClicks;
  const uniqueElementsClicked = store.uniqueElementsSet.size;
  const avgScrollDepth = store.lastKnownScrollDepth;
  const navigationDepth = store.cumulativeNavigationDepth;
  const sessionStartMs = store.sessionStart.getTime();

  // Compute 8 behavioural features over rolling 20s window
  const features = computeRollingFeatures();

  const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');

  const payload = {
    sessionId: store.sessionId,
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
    sessionScrollDepthMax: store.maxScrollDepth,
    viewSwitchCount: navigationDepth,
    sessionStartMs,
    clickCount,
    uniqueElementsClicked,
    avgScrollDepth: parseFloat(avgScrollDepth.toFixed(2)),
    sessionDuration: parseFloat(sessionDuration.toFixed(2)),
    navigationDepth,
    rawEvents: currentEvents,
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const res = await axios.post(`${backendUrl}/api/telemetry`, payload, {
      headers,
      timeout: 3500,
    });

    // Clear only the events that were successfully transmitted
    useTelemetryStore.getState().clearEventsCount(currentEvents.length);

    if (res.data?.adaptation?.detectedClass || res.data?.adaptation?.state) {
      if (!isSimulationLocked) {
        useAdaptationStore.getState().setAdaptation(res.data.adaptation);
      }
      return;
    }
  } catch (err) {
    // Offline, Render sleeping, or unauthenticated guest fallback:
    // Execute instant client-side behavioral classification
    if (!isSimulationLocked) {
      const clientSignal = classifyBehaviorClient(features);
      if (clientSignal && (clientSignal.state || clientSignal.detectedClass)) {
        useAdaptationStore.getState().setAdaptation(clientSignal);
      }
    }
    console.debug('Telemetry flush routed to client-side classifier fallback:', err);
  }
}
