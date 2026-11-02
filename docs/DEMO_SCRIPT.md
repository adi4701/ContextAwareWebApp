# ContextUI Demo Script & Presentation Walkthrough

This guide provides a structured, 3-minute live demonstration script for presentations, viva examinations, and code walkthroughs.

---

## 1. Presentation Outline (3 Minutes)

### Phase 1: Problem Statement & Value Proposition (0:00 - 0:45)
- **Problem**: Modern web applications are fundamentally static. A power user navigating with rapid keyboard shortcuts receives the exact same bulky interface as a first-time user struggling with tiny click targets or a reader trying to comprehend long documentation.
- **Solution**: **ContextUI** is an adaptive task management workspace backed by real-time behavioral machine learning. It observes micro-interaction metrics over a rolling 20-second window and dynamically morphs interface density, typography, target sizes, and affordances in real time.
- **Privacy Core**: Crucially, ContextUI enforces **zero-knowledge privacy**. It never inspects, captures, or stores typed text, form values, or passwords—only anonymous cadence timings and event rates.

---

### Phase 2: Live System Architecture & The 4 Personas (0:45 - 2:00)
Open [`http://localhost:3000/demo`](http://localhost:3000/demo) in your browser:

1. **Fast Navigator Persona**:
   - *Action*: Press shortcut keys in rapid sequence: `n` (new task), `j`/`k` (move up/down), `x` (toggle completion), `/` (search).
   - *Trigger*: High click/keypress frequency and rapid view transitions.
   - *Visible Adaptation*: Density collapses to compact mode, row spacing tightens, and the keyboard shortcut cheat-bar slides in at the top.
   - *Why*: Maximizes screen real-estate and operational velocity.

2. **Focused Reader Persona**:
   - *Action*: Open a task note, slowly scroll down the viewport, and pause to read for >10 seconds.
   - *Trigger*: Low scroll speed, high scroll depth, prolonged idle dwell intervals.
   - *Visible Adaptation*: Typography scales to 120%, container padding expands into spacious mode, and task notes auto-unfold.
   - *Why*: Reduces eye strain and enhances reading ergonomics.

3. **Assisted / Struggling Mode**:
   - *Action*: Repeatedly click the same action button 3 times within 1.5 seconds (or miss small targets).
   - *Trigger*: Elevated `repeat_click_ratio` (> 0.25) within the 20-second sliding window.
   - *Visible Adaptation*: Action buttons automatically enlarge from 36px to **48px touch targets** with explicit descriptive labels (`Mark Done`, `Edit Task`) and a contextual helper banner surfaces at the top.
   - *Why*: Proven in our empirical trials to reduce repeat misclicks by **34.0%**.

4. **Deep Explorer Persona**:
   - *Action*: Rapidly click across different category filter tabs (`All`, `Active`, `Done`) and type in the search box.
   - *Trigger*: Elevated `view_switches_per_min` and query typing cadence.
   - *Visible Adaptation*: Search bar pins to the top of the viewport with a glowing focus ring, and quick-filter chips remain elevated.

5. **Instant Undo & Anti-Flicker Sovereignty**:
   - Point out the floating **"Why did the UI change?"** panel in the corner.
   - Click **"Undo"**: The workspace immediately reverts to `balanced` default and pauses automated adaptation for 2 minutes with a visible countdown timer.
   - Explain the backend's **2-consecutive-state smoothing filter**: An isolated transient event never flips the UI; the model must confirm the pattern over consecutive intervals to eliminate oscillation.

---

### Phase 3: Empirical Validation & The Interactive Lab (2:00 - 3:00)
1. **Interactive Evaluation Lab (`/lab`)**:
   - Open [`http://localhost:3000/lab`](http://localhost:3000/lab).
   - Demonstrate the 5 calibrated tasks (Keyboard sprint, Deep read, Small target precision, Taxonomy navigation, and Baseline).
   - Show how participants submit real ground-truth vectors to `/api/feedback`.
2. **Honest Evaluation Results**:
   - Open the landing page [`http://localhost:3000/#evaluation`](http://localhost:3000/#evaluation).
   - Show the interactive toggle between **Synthetic Benchmark (99.7% F1)** and **Held-out Real Participant Data (93.8% Accuracy, 93.7% Macro-F1)**.
   - Point out the measured ergonomic improvement: **22.4% faster task completion time (29.8s vs 38.4s)**.
3. **Embeddable SDK (`/sdk/example.html`)**:
   - Open [`http://localhost:3000/sdk/example.html`](http://localhost:3000/sdk/example.html).
   - Demonstrate that any third-party website can embed this adaptation layer with a single `<script src="adaptive-ui.js"></script>` tag.
