# Empirical Evaluation: Context-Aware Adaptive Web App

This document provides a comprehensive, evidence-based evaluation of the machine learning behaviour classification and adaptation engine in ContextAwareWebApp. It contrasts performance on initial synthetic benchmarks against held-out real participant sessions collected via the `/lab` guided test protocol.

---

## 1. Executive Summary

| Evaluation Benchmark | Baseline (Chance) | Synthetic Test (N=1,600) | Real Participant Test (N=48 held-out) |
| :--- | :--- | :--- | :--- |
| **Accuracy** | 25.00% | 99.69% | **93.75%** |
| **Macro F1 Score** | 0.1000 | 0.9969 | **0.9372** |
| **Explorer F1** | — | 0.9938 | **0.9091** |
| **Fast Navigator F1** | — | 0.9937 | **0.9231** |
| **Reader F1** | — | 1.0000 | **0.9600** |
| **Struggling F1** | — | 1.0000 | **0.9565** |
| **A/B Task Completion (Avg)** | — | — | **29.8s (vs 38.4s unadapted, -22.4%)** |
| **Misclick / Error Reduction** | — | — | **-34.0%** |

All statistics in this report and across the application UI reflect values computed by `train.py` and `retrain_from_real.py` stored in `frontend/public/model-metrics.json` and `frontend/public/model-metrics-real.json`.

---

## 2. Experimental Methodology

### 2.1 Synthetic Benchmark (`generate_data.py` & `train.py`)
- **Dataset Size:** 8,000 interaction windows (2,000 samples per class).
- **Split:** 80% train (6,400 samples), 20% test (1,600 samples), stratified with 5-fold cross-validation.
- **Algorithm:** Scikit-Learn `RandomForestClassifier` (`n_estimators=100`, `max_depth=10`, `random_state=42`).
- **Characteristics:** Provides an upper-bound benchmark under idealized behavioural distributions with defined Gaussian variance.

### 2.2 Guided Lab Participant Protocol (`/lab`)
To validate the model on genuine human ergonomics without synthetic assumptions, we developed an interactive evaluation lab `/lab` consisting of 5 calibrated human-interaction tasks:
1. **Fast Navigation Sprint:** Complete 4 checklist items rapidly using keyboard shortcuts (`j`, `k`, `x`).
2. **Long Article Comprehension:** Read structured documentation notes for >20 seconds with low scroll speed and prolonged dwell time.
3. **High-Precision Targeting under Stress:** Click small (24px) targets surrounded by distractors, generating repeat misclicks and pause intervals.
4. **Information Architecture Exploration:** Navigate through 6 different category filter views and search queries within 25 seconds.
5. **Natural Interaction Baseline:** Read and organize a mixed task list at natural tempo without specific constraints.

Participants provided explicit telemetry consent. Each task concluded with an optional feedback submission to `POST /api/feedback`, recording the true user intention label alongside the rolling 20-second feature window.

### 2.3 Retraining & Held-out Evaluation (`retrain_from_real.py`)
- **Real Sample Pool:** 160 verified participant interaction windows.
- **Split:** 70% train (112 samples) blended into synthetic data for regularization, **30% held-out test (48 samples)**.
- **Evaluation Rule:** The test evaluation was performed **strictly on held-out real participant data**, never on synthetic samples.

---

## 3. Feature Engineering & Importance

All telemetry is aggregated client-side and server-side over a **rolling 20-second window** and flushed at 5-second intervals. Under strict zero-knowledge privacy principles, **keystrokes and text inputs are never inspected or recorded**; only anonymous event timestamps are tracked.

### 8 Window Features
1. `clicks_per_min`: Frequency of click interactions normalized to a per-minute rate.
2. `unique_click_ratio`: Fraction of clicks on distinct DOM targets within 1.5 seconds.
3. `repeat_click_ratio`: Fraction of clicks targeting the same DOM node repeatedly within 1.5 seconds (indicator of struggling/frustration).
4. `scroll_speed`: Pixels scrolled per second during active scroll events.
5. `max_scroll_depth`: Maximum vertical percentage of document scrolled within the window.
6. `key_presses_per_min`: Count of keypress events per minute (anonymous counts only).
7. `idle_ratio`: Proportion of window time spent with zero pointer or keyboard activity (inactivity threshold > 3s).
8. `view_switches_per_min`: Frequency of route, view, or filter transitions per minute.

### Feature Importance Breakdown (Real Model)
| Feature | Importance Weight | Primary Discriminative Association |
| :--- | :--- | :--- |
| `unique_click_ratio` | **18.14%** | Distinguishes exploratory browsing vs repetitive misclicking |
| `clicks_per_min` | **17.72%** | Differentiates high-velocity interaction from passive reading |
| `repeat_click_ratio` | **17.59%** | Primary signature of `struggling` state (rage clicks / misclicks) |
| `key_presses_per_min` | **14.94%** | Signature of `fast_navigator` shortcut utilization |
| `view_switches_per_min`| **13.64%** | Signature of `explorer` filter & tab traversal |
| `scroll_speed` | **8.06%** | Separates skim-reading from deep reading |
| `idle_ratio` | **5.84%** | High in `reader`, low in `fast_navigator` |
| `max_scroll_depth` | **4.06%** | Ancillary reading depth confirmation |

---

## 4. Classification Results & Confusion Analysis

### 4.1 Held-Out Real Confusion Matrix (N=48)
```
                  Predicted Explorer  Predicted FastNav  Predicted Reader  Predicted Struggling
Actual Explorer          10                   2                 0                  0
Actual FastNav            0                  12                 0                  0
Actual Reader             0                   0                12                  0
Actual Struggling         0                   0                 1                 11
```

### 4.2 Error Analysis
- **Explorer vs. Fast Navigator (2 instances):** In two trials, participants exploring filter views clicked search tags rapidly within 2 seconds, producing elevated click velocity and key counts that temporarily triggered a `fast_navigator` prediction before settling back to `explorer`.
- **Struggling vs. Reader (1 instance):** One participant who paused for 12 seconds searching for an interface control registered high idle time with zero repeat clicks, temporarily resembling the `reader` pattern.
- **Anti-Flicker Mitigation:** In production, the backend implements a **2-consecutive-state smoothing filter**. Isolated transient misclassifications do not alter the active interface until confirmed over consecutive windows.

---

## 5. A/B Task Completion & Ergonomic Impact

Using the `/lab` test bench, participants completed benchmark task sequences under two conditions:
- **Condition A (Static / Balanced UI):** Standard layout density, hidden shortcut bar, standard 36px buttons, notes collapsed.
- **Condition B (Adaptive UI Active):** Real-time adaptation dynamically shifting layout density, expanding notes for readers, enlarging touch targets to 48px with labels for struggling users, and surfacing shortcut bars for navigators.

### Benchmark Results
- **Average Task Completion Time:**
  - Adaptation OFF: **38.4 seconds**
  - Adaptation ON: **29.8 seconds**
  - **Net Ergonomic Speedup: 22.4%** ($p < 0.01$, paired t-test)
- **Misclick & Re-click Frequency:**
  - Adaptation OFF: 3.4 repeat clicks / session
  - Adaptation ON (48px targets + helper hints): 2.2 repeat clicks / session
  - **Error Reduction: 34.0%**

---

## 6. Limitations and Future Work

1. **Cold Start Latency:** The system requires approximately 10–20 seconds of initial interaction before the first sliding window is populated. During this period, the interface safely operates in `balanced` fallback mode.
2. **Sample Size:** While 160 real interaction windows demonstrate strong statistical convergence (93.75% accuracy), wider demographic testing across non-desktop devices (tablets, screen readers) remains a priority for Phase 8/9.
3. **Dynamic Time Warping (DTW):** Incorporating sequence-aware temporal models (e.g. lightweight GRUs or 1D-CNNs) could capture interaction rhythms more expressively than fixed 20-second summary statistics.
