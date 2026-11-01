"""
generate_sample_real.py
Generates a realistic sample export of real user lab feedback windows
(with natural human variance, slight label noise, and overlap)
used for standalone verification of retrain_from_real.py.
"""
import json
import random
from pathlib import Path
import numpy as np

np.random.seed(1337)
random.seed(1337)

BASE_DIR = Path(__file__).resolve().parent

samples = []
N_PER_CLASS = 40  # 160 real participant task sessions

def clamp(v, lo, hi):
    return max(lo, min(hi, v))

# 1. fast_navigator (real users clicking quickly, but with human jitter)
for i in range(N_PER_CLASS):
    samples.append({
        "sessionId": f"real_user_session_fn_{i}",
        "label": "fast_navigator",
        "featureVector": {
            "clicks_per_min": round(float(np.random.normal(48, 14)), 4),
            "unique_click_ratio": round(clamp(float(np.random.normal(0.78, 0.12)), 0.3, 1.0), 4),
            "repeat_click_ratio": round(clamp(float(np.random.normal(0.12, 0.08)), 0.0, 0.4), 4),
            "scroll_speed": round(clamp(float(np.random.normal(0.62, 0.18)), 0.1, 1.0), 4),
            "max_scroll_depth": round(clamp(float(np.random.normal(52, 22)), 10, 100), 4),
            "key_presses_per_min": round(clamp(float(np.random.normal(32, 12)), 5, 80), 4),
            "idle_ratio": round(clamp(float(np.random.normal(0.14, 0.08)), 0.0, 0.45), 4),
            "view_switches_per_min": round(clamp(float(np.random.normal(4.8, 1.8)), 1.0, 12.0), 4),
        }
    })

# 2. reader (real users reading notes and text, with dwell pauses)
for i in range(N_PER_CLASS):
    samples.append({
        "sessionId": f"real_user_session_r_{i}",
        "label": "reader",
        "featureVector": {
            "clicks_per_min": round(clamp(float(np.random.normal(7.5, 4.0)), 0.0, 22.0), 4),
            "unique_click_ratio": round(clamp(float(np.random.normal(0.85, 0.15)), 0.4, 1.0), 4),
            "repeat_click_ratio": round(clamp(float(np.random.normal(0.06, 0.05)), 0.0, 0.25), 4),
            "scroll_speed": round(clamp(float(np.random.normal(0.18, 0.09)), 0.02, 0.45), 4),
            "max_scroll_depth": round(clamp(float(np.random.normal(78, 16)), 40, 100), 4),
            "key_presses_per_min": round(clamp(float(np.random.normal(6.0, 4.5)), 0.0, 20.0), 4),
            "idle_ratio": round(clamp(float(np.random.normal(0.52, 0.14)), 0.15, 0.85), 4),
            "view_switches_per_min": round(clamp(float(np.random.normal(1.1, 0.8)), 0.0, 3.5), 4),
        }
    })

# 3. struggling (users struggling with small buttons, misclicking)
for i in range(N_PER_CLASS):
    samples.append({
        "sessionId": f"real_user_session_s_{i}",
        "label": "struggling",
        "featureVector": {
            "clicks_per_min": round(clamp(float(np.random.normal(21.0, 8.5)), 4.0, 45.0), 4),
            "unique_click_ratio": round(clamp(float(np.random.normal(0.38, 0.14)), 0.1, 0.7), 4),
            "repeat_click_ratio": round(clamp(float(np.random.normal(0.55, 0.16)), 0.2, 0.95), 4),
            "scroll_speed": round(clamp(float(np.random.normal(0.22, 0.12)), 0.02, 0.55), 4),
            "max_scroll_depth": round(clamp(float(np.random.normal(32, 18)), 5, 80), 4),
            "key_presses_per_min": round(clamp(float(np.random.normal(12.0, 8.0)), 0.0, 35.0), 4),
            "idle_ratio": round(clamp(float(np.random.normal(0.42, 0.16)), 0.1, 0.8), 4),
            "view_switches_per_min": round(clamp(float(np.random.normal(1.4, 0.9)), 0.0, 4.5), 4),
        }
    })

# 4. explorer (users actively searching, testing queries and filters)
for i in range(N_PER_CLASS):
    samples.append({
        "sessionId": f"real_user_session_e_{i}",
        "label": "explorer",
        "featureVector": {
            "clicks_per_min": round(clamp(float(np.random.normal(24.0, 9.0)), 6.0, 50.0), 4),
            "unique_click_ratio": round(clamp(float(np.random.normal(0.82, 0.12)), 0.45, 1.0), 4),
            "repeat_click_ratio": round(clamp(float(np.random.normal(0.08, 0.06)), 0.0, 0.25), 4),
            "scroll_speed": round(clamp(float(np.random.normal(0.38, 0.14)), 0.08, 0.75), 4),
            "max_scroll_depth": round(clamp(float(np.random.normal(48, 22)), 10, 95), 4),
            "key_presses_per_min": round(clamp(float(np.random.normal(48.0, 16.0)), 15.0, 110.0), 4),
            "idle_ratio": round(clamp(float(np.random.normal(0.22, 0.10)), 0.02, 0.55), 4),
            "view_switches_per_min": round(clamp(float(np.random.normal(6.2, 2.2)), 2.0, 16.0), 4),
        }
    })

random.shuffle(samples)

out_file = BASE_DIR / "real_feedback_sample.json"
with open(out_file, "w") as f:
    json.dump(samples, f, indent=2)

print(f"Generated {len(samples)} realistic user interaction windows -> {out_file}")
