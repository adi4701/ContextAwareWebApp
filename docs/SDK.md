# AdaptiveUI Embeddable JavaScript SDK

The **AdaptiveUI SDK** (`adaptive-ui.js`) is an embeddable, framework-agnostic client library that gives any web application real-time behavioral adaptation with a single `<script>` tag.

---

## 1. Quick Start

### Step 1: Include the Script
Host `adaptive-ui.js` on your CDN, static assets folder, or load it from the ContextUI instance:

```html
<script src="https://your-domain.com/sdk/adaptive-ui.js"></script>
```

### Step 2: Initialize the Tracker
```html
<script>
  const tracker = AdaptiveUI.init({
    endpoint: 'http://localhost:5000/api/telemetry',
    flushIntervalMs: 5000,
    applyCssVariables: true,
    showFloatingBadge: true,
    onAdaptation: (signal) => {
      console.log('UI adapted to state:', signal.state, signal.confidence);
    }
  });
</script>
```

---

## 2. Configuration Options

Pass an options object to `AdaptiveUI.init(options)`:

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `endpoint` | `string` | `'/api/telemetry'` | The backend URL where rolling feature windows are ingested. |
| `feedbackEndpoint`| `string` | `'/api/feedback'` | Endpoint for user correction and preference submissions. |
| `token` | `string` | `null` | Optional JWT Bearer token for authenticated user profiles. |
| `sessionId` | `string` | auto-generated | Unique session identifier for telemetry correlation. |
| `consent` | `boolean \| () => boolean` | `true` | Telemetry consent flag. If false, zero events are tracked or sent. |
| `flushIntervalMs` | `number` | `5000` | Ingestion cadence in milliseconds (default 5s). |
| `windowDurationMs`| `number` | `20000` | Duration of the rolling behavioral sliding window (default 20s). |
| `targetElement` | `string \| HTMLElement`| `document.body`| DOM element where CSS custom properties and state attributes are set. |
| `applyCssVariables`| `boolean` | `true` | Automatically sets CSS variables and `data-adaptive-state` attribute. |
| `showFloatingBadge`| `boolean` | `true` | Displays a subtle corner pill showing current persona and an Undo button. |
| `onAdaptation` | `function` | `null` | Callback triggered whenever state changes: `({ state, confidence, config })`. |
| `debug` | `boolean` | `false` | Enables console debug logs (`[AdaptiveUI] ...`). |

---

## 3. CSS Custom Properties & Morphing

When `applyCssVariables: true` is enabled, the SDK dynamically injects the following CSS Custom Properties and dataset attribute onto the target element:

```css
:root {
  /* Dynamic CSS Custom Properties */
  --adaptive-density: standard;       /* 'compact' | 'standard' | 'spacious' */
  --adaptive-text-scale: 1.0;         /* '1.0' | '1.1' | '1.2' */
  --adaptive-target-size: 36px;       /* '36px' | '40px' | '48px' */
  --adaptive-show-shortcuts: none;    /* 'none' | 'block' */
  --adaptive-show-help: none;         /* 'none' | 'block' */
  --adaptive-show-notes: none;        /* 'none' | 'block' */
}

/* State selector attribute */
[data-adaptive-state="fast_navigator"] {
  /* Fast navigator styles */
}

[data-adaptive-state="reader"] {
  /* Focused reader styles */
}

[data-adaptive-state="struggling"] {
  /* High affordance assisted styles */
}

[data-adaptive-state="explorer"] {
  /* Search & discovery styles */
}
```

### Example CSS Styling:
```css
/* Fluid Typography */
body {
  font-size: calc(15px * var(--adaptive-text-scale));
}

/* Touch Targets & Buttons */
button, input, a.btn {
  min-height: var(--adaptive-target-size);
  min-width: var(--adaptive-target-size);
}

/* Shortcut Banner */
.shortcut-bar {
  display: var(--adaptive-show-shortcuts);
}

/* Help & Tooltip Banner */
.help-banner {
  display: var(--adaptive-show-help);
}
```

---

## 4. Privacy & Zero-Knowledge Guarantee

The SDK strictly enforces the following architectural privacy boundaries:
1. **Keystroke Blindness**: Keydown listeners record **timestamp counts only** to estimate typing velocity. Character codes, text input, form values, and passwords are structurally ignored.
2. **Local Sliding Window**: Inactive events are discarded after 20 seconds.
3. **Explicit Opt-out**: Setting `consent: false` or calling `AdaptiveUI.destroy()` immediately halts all event listeners and network activity.

---

## 5. Global API Methods

```javascript
// Get singleton tracker instance
const tracker = AdaptiveUI.getInstance();

// Manually compute current 8-feature vector
const features = AdaptiveUI.computeFeatures();
console.log(features.clicks_per_min, features.unique_click_ratio);

// Trigger manual Undo (reverts to balanced and pauses for 2 minutes)
AdaptiveUI.undo();

// Resume automated adaptation early
AdaptiveUI.resume();

// Clean up listeners and remove injected badges
tracker.destroy();
```
