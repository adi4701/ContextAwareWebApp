import axios from 'axios';
import { useTelemetryStore } from '../store/telemetryStore';

export async function flushTelemetry(): Promise<void> {
  if (typeof window === 'undefined') return;

  const store = useTelemetryStore.getState();
  const token = localStorage.getItem('token');
  if (!token) {
    return;
  }

  const buffer = store.flushAndGetBuffer();
  const sessionDuration = store.getSessionDuration();
  const clickCount = store.cumulativeClicks;
  const uniqueElementsClicked = store.uniqueElementsSet.size;
  const avgScrollDepth = store.lastKnownScrollDepth;
  const navigationDepth = store.cumulativeNavigationDepth;

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  try {
    await axios.post(
      `${backendUrl}/api/telemetry`,
      {
        sessionId: store.sessionId,
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
  } catch (error) {
    // Silently handle error (e.g., backend temporarily unavailable)
    // console.debug('Telemetry flush deferred or failed:', error);
  }
}
