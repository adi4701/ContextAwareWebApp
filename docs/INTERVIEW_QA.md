# Viva & Interview Preparation: 5 Core Technical Questions

This document prepares you for technical defenses, viva examinations, and architectural interviews regarding ContextUI.

---

### Q1: Why did you choose a Random Forest classifier over a Deep Neural Network (e.g. LSTM or Transformer)?

**Answer:**
We evaluated trade-offs across inference latency, model interpretability, and sample complexity:
1. **Sub-10ms Inference Latency:** ContextUI operates on a real-time 5-second polling loop. A Scikit-Learn `RandomForestClassifier` executes inference in under **3 milliseconds** on standard CPU infrastructure, requiring zero GPU overhead and minimal memory footprint (< 15 MB).
2. **Explainability & Gini Feature Importances:** Unlike black-box neural networks, tree ensembles provide native feature importance rankings. This enables our explainability engine in the "Why did the UI change?" panel to cite the exact behavioral dimensions (e.g. `repeat_click_ratio` at 17.6% weight) that triggered the adaptation.
3. **Robustness to Overfitting on Tabular Micro-Interaction Data:** With 8 continuous tabular features computed over a 20-second rolling window, tree ensembles inherently outperform deep neural nets when trained on hundreds or thousands of tabular interaction windows, offering natural resistance to feature collinearity and outliers.

---

### Q2: How does the system strictly guarantee privacy when collecting client-side interactions?

**Answer:**
Privacy is enforced through hardcoded architectural constraints rather than trust:
1. **Zero Keystroke / Text Logging:** Keypress events are captured via passive listeners that increment an anonymous numeric counter only: `{ type: 'keypress', timestamp: Date.now() }`. Character codes, text values, input field content, and passwords are never read or stored.
2. **Strict Backend Sanitization:** Our backend middleware (`backend/src/middleware/validate.js`) inspects every incoming telemetry payload. If any event contains properties like `key`, `keyValue`, `text`, or `value`, the request is immediately rejected with an HTTP 400 Privacy Violation error.
3. **Rolling Client-Side Eviction:** Micro-interaction events older than 20 seconds are purged from memory in the browser.
4. **Explicit Consent & Sovereignty:** Telemetry is governed by a persistent consent switch. When toggled off, event listeners disconnect and network flushes abort. Furthermore, the user can click "Undo" at any time to pause automated adaptation for 2 minutes.

---

### Q3: How do you prevent the interface from flickering between states during natural activity shifts?

**Answer:**
We solved interface instability through a multi-tiered stabilization pipeline:
1. **Anti-Flicker Temporal Smoothing (2-Consecutive-State Hysteresis):** In `backend/src/routes/telemetry.js`, the server tracks an in-memory smoothing buffer per user. A state transition is only emitted if the ML model predicts the *exact same* state in at least **two consecutive intervals** (`SMOOTH_REQUIRED = 2`). Transient spikes or brief pauses are filtered out.
2. **Confidence Thresholding (Fallback to Balanced):** If the highest class probability returned by the model is below **45%** (`confidence < 0.45`), the system classifies the interaction as ambiguous and automatically falls back to `balanced` default.
3. **CSS Custom Properties & Reduced Motion:** Layout shifts are applied using declarative CSS variables (`--adaptive-density`, `--adaptive-text-scale`, `--adaptive-target-size`) and Framer Motion transitions. The system respects the user's `prefers-reduced-motion` operating system setting to eliminate jarring animations for sensitive users.

---

### Q4: Why is there a difference between your synthetic accuracy (99.7%) and real held-out accuracy (93.8%)?

**Answer:**
This distinction highlights our commitment to honest empirical evaluation:
1. **Synthetic Data (`generate_data.py`):** The synthetic benchmark consists of 8,000 generated windows with mathematically defined Gaussian distributions per persona. Because the generative distributions have distinct separation boundaries, the Random Forest easily achieves 99.69% test accuracy. It serves as a proof-of-concept upper bound.
2. **Real Participant Data (`/lab` & `retrain_from_real.py`):** Real human behavior contains natural ergonomic ambiguity. For instance, in our held-out test of 48 real participant sessions, 2 participants in the `explorer` task clicked search chips so rapidly that their initial click velocity mimicked a `fast_navigator`, leading to a brief transient misclassification before settling.
3. **Honest Reporting:** Rather than claiming unrealistic 99.8% perfection, our landing page and `docs/EVALUATION.md` explicitly contrast synthetic results against the **93.75% held-out real participant accuracy**, which is a high-performing and authentic result on genuine human behavioral data.

---

### Q5: How is ContextUI different from traditional responsive web design or user preference settings?

**Answer:**
ContextUI addresses critical blind spots in existing UI paradigms:
1. **Static vs Dynamic:** Traditional responsive design only reacts to physical hardware constraints (e.g. screen width via media queries `@media (max-width: 768px)`). It is completely blind to *how* the user is behaving on that screen.
2. **Implicit vs Explicit Configuration:** While user preference toggles (e.g. dark mode switches, density pickers) are useful, cognitive psychology research shows that over 90% of users never adjust default settings. Furthermore, users who struggle (e.g. suffering from motor fatigue, tremor, or cognitive hesitation) are the least likely to navigate deep into settings menus to enlarge buttons.
3. **Autonomous Assistance:** ContextUI bridges this gap by passively detecting when assistance is needed (such as repeated misclicks or high dwell hesitation) and proactively presenting 48px hit targets, helpful hints, or keyboard hotkeys, while always maintaining full user sovereignty through an instant "Undo" button.
