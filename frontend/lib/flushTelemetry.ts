import axios from 'axios';
import { useTelemetryStore } from '../store/telemetryStore';
import { useAdaptationStore } from '../store/adaptationStore';

export async function flushTelemetry(): Promise<void> {
  if (typeof window === 'undefined') return;

  const store = useTelemetryStore.getState();
  if (!store.trackingEnabled) return;

  const token = localStorage.getItem('token');
  if (!token) return;

  const currentEvents = [...store.events];
  const sessionDuration = store.getSessionDuration();
  const clickCount = store.cumulativeClicks;
  const uniqueElementsClicked = store.uniqueElementsSet.size;
  const avgScrollDepth = store.lastKnownScrollDepth;
  const navigationDepth = store.cumulativeNavigationDepth;

  const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');

  try {
    const res = await axios.post(
      `${backendUrl}/api/telemetry`,
      {
        sessionId: store.sessionId,
        clickCount,
        uniqueElementsClicked,
        avgScrollDepth: parseFloat(avgScrollDepth.toFixed(2)),
        sessionDuration: parseFloat(sessionDuration.toFixed(2)),
        navigationDepth,
        rawEvents: currentEvents,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 4000,
      }
    );

    // Clear only the events that were successfully sent
    useTelemetryStore.getState().clearEventsCount(currentEvents.length);

    if (res.data?.adaptation?.detectedClass || res.data?.adaptation) {
      useAdaptationStore.getState().setAdaptation(res.data.adaptation);
    }
  } catch (err) {
    // Keep buffered events for next retry
    console.debug('Telemetry flush deferred (offline or retry pending):', err);
  }
}
