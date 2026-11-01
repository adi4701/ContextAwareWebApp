import { useTelemetryStore } from '../store/telemetryStore';

let clickHandler: ((e: MouseEvent) => void) | null = null;
let scrollHandler: (() => void) | null = null;
let popstateHandler: (() => void) | null = null;

export function startTracking(): void {
  if (typeof window === 'undefined') return;

  const store = useTelemetryStore.getState();

  // Track initial navigation route
  store.addEvent({
    type: 'navigate',
    route: window.location.pathname,
  });

  // Track clicks
  clickHandler = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    let elementId = 'unknown';
    if (target) {
      if (target.id) {
        elementId = target.id;
      } else {
        const tag = target.tagName ? target.tagName.toLowerCase() : 'element';
        const className = target.className && typeof target.className === 'string'
          ? '.' + target.className.trim().split(/\s+/).slice(0, 2).join('.')
          : '';
        elementId = `${tag}${className}`;
      }
    }

    useTelemetryStore.getState().addEvent({
      type: 'click',
      elementId,
      x: e.clientX,
      y: e.clientY,
    });
  };

  // Track scrolls
  scrollHandler = () => {
    const scrollHeight = document.body.scrollHeight - window.innerHeight;
    const scrollDepth = scrollHeight > 0
      ? Math.min(100, Math.max(0, (window.scrollY / scrollHeight) * 100))
      : 0;

    useTelemetryStore.getState().addEvent({
      type: 'scroll',
      depth: Math.round(scrollDepth),
    });
  };

  // Track navigation changes
  popstateHandler = () => {
    useTelemetryStore.getState().addEvent({
      type: 'navigate',
      route: window.location.pathname,
    });
  };

  window.addEventListener('click', clickHandler);
  window.addEventListener('scroll', scrollHandler, { passive: true });
  window.addEventListener('popstate', popstateHandler);
}

export function stopTracking(): void {
  if (typeof window === 'undefined') return;

  if (clickHandler) {
    window.removeEventListener('click', clickHandler);
    clickHandler = null;
  }
  if (scrollHandler) {
    window.removeEventListener('scroll', scrollHandler);
    scrollHandler = null;
  }
  if (popstateHandler) {
    window.removeEventListener('popstate', popstateHandler);
    popstateHandler = null;
  }
}
