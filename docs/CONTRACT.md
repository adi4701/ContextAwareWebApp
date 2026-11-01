# API Contract — ContextAwareWebApp

> **Status:** Phase 0 baseline  
> **Last updated:** 2026-11-01  
> **Data note:** All ML models are trained on **synthetic (simulated) interaction data**. See `ml-service/metrics.json` for honest evaluation metrics.

---

## 1. Telemetry endpoint

### `POST /api/telemetry`

**Auth:** `Authorization: Bearer <JWT>`  
**Rate limit:** 20 req / 30 s per user  
**Content-Type:** `application/json`

#### Request body

| Field | Type | Required | Description |
|---|---|---|---|
| `sessionId` | string | yes | UUID identifying the current browser session |
| `features` | object | no | 8-feature rolling 20s vector computed on client (see §2) |
| `sessionScrollDepthMax` | number | no | Max scroll depth (0–100) reached this session |
| `viewSwitchCount` | number | no | Total route/tab/filter changes this session |
| `sessionStartMs` | number | no | Epoch ms when session started |
| `clickCount` | number | no | Cumulative clicks since session start (legacy) |
| `uniqueElementsClicked` | number | no | Count of distinct DOM targets clicked (legacy) |
| `avgScrollDepth` | number | no | Percentage (0–100) of page scrolled (legacy) |
| `sessionDuration` | number | no | Seconds since session start (legacy) |
| `navigationDepth` | number | no | Number of route/view changes (legacy) |
| `rawEvents` | array | no | Raw event buffer within rolling window (see §1.1) |

> **Privacy:** `rawEvents` must contain only counts and positions — **never** key values or text content. Telemetry collection is strictly conditional on user consent (persisted in `localStorage.getItem('telemetry_consent')`). When consent is false, no events are recorded and zero HTTP requests are emitted.

#### §1.1 Raw event object

```json
{ "type": "click", "elementId": "btn.search", "x": 320, "y": 240, "timestamp": 1730472000000 }
{ "type": "scroll", "depth": 42, "timestamp": 1730472001000 }
{ "type": "keypress", "timestamp": 1730472002000 }
{ "type": "view_switch", "route": "active-tasks", "timestamp": 1730472003000 }
{ "type": "navigate", "route": "/demo", "timestamp": 1730472004000 }
```

#### Response body

```json
{
  "success": true,
  "adaptation": { /* AdaptationSignal — see §3 */ }
}
```

---

### `POST /api/feedback`

Recorded when a user manually locks or overrides an adaptation dimension via `OverridePanel`. This logs ground-truth user preferences alongside the live 8-feature vector for real-world model retraining.

**Auth:** Optional `Authorization: Bearer <JWT>`  
**Content-Type:** `application/json`

#### Request body

| Field | Type | Required | Description |
|---|---|---|---|
| `sessionId` | string | yes | Browser session ID |
| `featureVector` | object | yes | Current 8-feature rolling window vector |
| `chosenSetting` | object | yes | Selected setting (e.g. `{ dimension: "state", value: "reader" }`) |
| `previousState` | string | no | State active before override |
| `targetState` | string | no | Target state resulting from override |

#### Response body

```json
{
  "success": true,
  "message": "Feedback recorded successfully for real model retraining",
  "feedbackId": "65432..."
}
```

---

## 2. ML Service feature vector

### `POST /predict` (ML service, internal)

The backend computes these 8 window features and sends them to the ML service:

| Field | Type | Description |
|---|---|---|
| `clicks_per_min` | float | Click rate over the 20 s window |
| `unique_click_ratio` | float [0–1] | Fraction of clicks on unique targets |
| `repeat_click_ratio` | float [0–1] | Fraction of clicks re-hitting the same target |
| `scroll_speed` | float | Normalised scroll velocity (px/s, normalised 0–1) |
| `max_scroll_depth` | float [0–100] | Maximum scroll depth percentage in the window |
| `key_presses_per_min` | float | Key press count rate (no key values stored) |
| `idle_ratio` | float [0–1] | Fraction of window time with no user events |
| `view_switches_per_min` | float | Route or filter-change rate |

> **Backward compatibility:** The old fields (`click_count`, `unique_elements_clicked`, `avg_scroll_depth`, `session_duration`, `click_density`, `navigation_depth`, `scroll_rate`, `hour_of_day`) are still accepted by the ML service and silently ignored. They will be removed in Phase 9.

---

## 3. AdaptationSignal (`/predict` response)

```json
{
  "state": "fast_navigator",
  "predictedState": "fast_navigator",
  "confidence": 0.87,
  "lowConfidence": false,
  "probabilities": {
    "explorer": 0.05,
    "fast_navigator": 0.87,
    "reader": 0.03,
    "struggling": 0.05
  },
  "reasons": [
    "You are clicking rapidly across many different elements",
    "Your navigation pattern shows quick, purposeful movements",
    "Low idle time indicates focused, efficient usage"
  ],
  "changes": [
    "Layout switched to compact density",
    "Keyboard shortcut bar shown",
    "Theme set to dark"
  ],
  "adaptation": {
    "density": "compact",
    "textScale": 1.0,
    "targetSize": "normal",
    "showShortcuts": true,
    "showHelp": false,
    "emphasizeSearch": false,
    "showNotes": false
  },

  "theme": "dark",
  "componentOrder": ["dashboard", "analytics", "notifications", "settings"],
  "layoutDensity": "compact",
  "detectedClass": "fast_navigator"
}
```

### 3.1 States

| State | Trigger condition | Key UI adaptation |
|---|---|---|
| `fast_navigator` | High click rate, low idle, many view switches | Compact density, keyboard shortcut bar |
| `reader` | Slow scroll, high depth, high idle, few switches | Spacious layout, larger text, notes expanded |
| `struggling` | High repeat clicks, low unique ratio, high idle | Large buttons, help tips visible |
| `explorer` | High key presses, high view switches, high unique clicks | Search pinned, quick filters highlighted |
| `balanced` | Confidence < 0.45 (low-confidence fallback) | Default layout — no adaptation applied |

### 3.2 Confidence threshold

When `confidence < 0.45`, `lowConfidence` is `true` and `state` is overridden to `"balanced"` regardless of `predictedState`.

### 3.3 Compatibility shims (removed in Phase 9)

`theme`, `componentOrder`, `layoutDensity`, `detectedClass` are legacy fields kept for the old frontend. New code should read from `state`, `adaptation`, `reasons`, `changes`.

---

## 4. Socket.io events

| Event | Direction | Payload |
|---|---|---|
| `adaptation:update` | server → client | Full `AdaptationSignal` (§3) |

The backend emits `adaptation:update` to the room `user:<userId>` after every successful `/api/telemetry` POST.

---

## 5. State smoothing

The backend applies a **2-consecutive-same-state** filter before emitting. A state change is only propagated to the client when the same predicted state is returned in two consecutive telemetry flushes. This prevents flickering from noisy one-off readings.

---

## 6. Metrics

Model evaluation metrics live in `ml-service/metrics.json` and are copied to `frontend/public/model-metrics.json` by `train.py`. The landing page reads this file at build time. **No metrics are hard-coded in UI components.**

---

## 7. Privacy

- Key values are **never** logged, stored, or transmitted.  
- Only counts and timings are in telemetry payloads.  
- Consent is required before any telemetry is collected (Phase 2).  
- Raw events are stored temporarily in the telemetry document; they contain only element IDs (CSS selector style), positions, and scroll percentages.
