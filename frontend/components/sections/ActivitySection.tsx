'use client';

import React from 'react';
import { useAdaptationStore } from '../../store/adaptationStore';
import { useTelemetryStore } from '../../store/telemetryStore';
import { Activity, MousePointer, ArrowDownUp, Compass, Clock } from 'lucide-react';

export default function ActivitySection() {
  const layoutDensity = useAdaptationStore((state) => state.layoutDensity);
  const events = useTelemetryStore((state) => state.events);
  const cumulativeClicks = useTelemetryStore((state) => state.cumulativeClicks);
  const lastKnownScrollDepth = useTelemetryStore((state) => state.lastKnownScrollDepth);
  const cumulativeNav = useTelemetryStore((state) => state.cumulativeNavigationDepth);
  const [duration, setDuration] = React.useState(0);

  React.useEffect(() => {
    const update = () => {
      setDuration(Math.round(useTelemetryStore.getState().getSessionDuration()));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const paddingClass =
    layoutDensity === 'compact'
      ? 'p-3'
      : layoutDensity === 'spacious'
      ? 'p-8'
      : 'p-5';

  const recentEvents = [...events].slice(-5).reverse();

  return (
    <div
      className={`rounded-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 shadow-md transition-all duration-300 ${paddingClass}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Live Activity Stream</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Real-time telemetry event buffer</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/50 dark:border-teal-800/50">
          Live Stream
        </span>
      </div>

      {/* Metric Badges */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600/40 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
            <MousePointer className="w-3 h-3 text-blue-500" />
            <span>Clicks</span>
          </div>
          <div className="text-base font-bold text-gray-900 dark:text-white mt-0.5">{cumulativeClicks}</div>
        </div>

        <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600/40 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
            <ArrowDownUp className="w-3 h-3 text-emerald-500" />
            <span>Scroll</span>
          </div>
          <div className="text-base font-bold text-gray-900 dark:text-white mt-0.5">{Math.round(lastKnownScrollDepth)}%</div>
        </div>

        <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600/40 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
            <Compass className="w-3 h-3 text-indigo-500" />
            <span>Nav Depth</span>
          </div>
          <div className="text-base font-bold text-gray-900 dark:text-white mt-0.5">{cumulativeNav}</div>
        </div>

        <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600/40 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
            <Clock className="w-3 h-3 text-purple-500" />
            <span>Duration</span>
          </div>
          <div suppressHydrationWarning className="text-base font-bold text-gray-900 dark:text-white mt-0.5">{duration}s</div>
        </div>
      </div>

      {/* Event List */}
      <div className="space-y-2">
        {recentEvents.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-400 dark:text-gray-500 italic bg-gray-50/50 dark:bg-gray-700/30 rounded-xl">
            Awaiting user interactions... Click or scroll anywhere on the page to generate live events!
          </div>
        ) : (
          recentEvents.map((evt, idx) => {
            const timeStr = evt.timestamp
              ? new Date(evt.timestamp).toTimeString().split(' ')[0]
              : 'Now';

            return (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-600/30 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      evt.type === 'click'
                        ? 'bg-blue-500'
                        : evt.type === 'scroll'
                        ? 'bg-emerald-500'
                        : 'bg-indigo-500'
                    }`}
                  />
                  <span className="font-semibold text-gray-800 dark:text-gray-200 capitalize">
                    {evt.type}
                  </span>
                  <span className="text-gray-400 dark:text-gray-500 text-[11px] truncate max-w-[140px]">
                    {evt.elementId ? `#${evt.elementId}` : evt.depth !== undefined ? `${evt.depth}% depth` : 'window'}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-gray-400 dark:text-gray-500">{timeStr}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
