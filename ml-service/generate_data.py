"""
generate_data.py
Generates synthetic training data for the behaviour-state classifier.

States: fast_navigator, reader, struggling, explorer
Features (8-window, ~20 s):
  clicks_per_min, unique_click_ratio, repeat_click_ratio,
  scroll_speed, max_scroll_depth, key_presses_per_min,
  idle_ratio, view_switches_per_min

Run: python generate_data.py
"""
import numpy as np
import pandas as pd

np.random.seed(42)
N = 2000  # samples per class


def clip(arr, lo, hi):
    return np.clip(arr, lo, hi)


# ── fast_navigator ───────────────────────────────────────────────────────────
# High click rate, many unique targets, low idle, fast scroll, frequent switches
cpm_fn = clip(np.random.normal(55, 12, N), 25, 100)
ucr_fn = clip(np.random.uniform(0.65, 0.95, N), 0, 1)
rcr_fn = clip(1 - ucr_fn + np.random.normal(0, 0.05, N), 0, 0.5)
ss_fn  = clip(np.random.normal(0.7, 0.15, N), 0.3, 1.0)
msd_fn = clip(np.random.normal(55, 18, N), 20, 95)
kpm_fn = clip(np.random.normal(35, 10, N), 10, 70)
ir_fn  = clip(np.random.normal(0.10, 0.06, N), 0, 0.35)
vsm_fn = clip(np.random.normal(5.5, 1.5, N), 2, 10)

df_fn = pd.DataFrame({
    'clicks_per_min': cpm_fn,
    'unique_click_ratio': ucr_fn,
    'repeat_click_ratio': rcr_fn,
    'scroll_speed': ss_fn,
    'max_scroll_depth': msd_fn,
    'key_presses_per_min': kpm_fn,
    'idle_ratio': ir_fn,
    'view_switches_per_min': vsm_fn,
    'label': 'fast_navigator',
})

# ── reader ───────────────────────────────────────────────────────────────────
# Low click rate, slow scroll, high scroll depth, high idle, few switches
cpm_r = clip(np.random.normal(6, 3, N), 1, 20)
ucr_r = clip(np.random.uniform(0.75, 1.0, N), 0, 1)
rcr_r = clip(np.random.uniform(0, 0.15, N), 0, 0.3)
ss_r  = clip(np.random.normal(0.15, 0.07, N), 0.02, 0.40)
msd_r = clip(np.random.normal(82, 12, N), 50, 100)
kpm_r = clip(np.random.normal(5, 3, N), 0, 18)
ir_r  = clip(np.random.normal(0.55, 0.12, N), 0.2, 0.85)
vsm_r = clip(np.random.normal(0.8, 0.5, N), 0, 3)

df_r = pd.DataFrame({
    'clicks_per_min': cpm_r,
    'unique_click_ratio': ucr_r,
    'repeat_click_ratio': rcr_r,
    'scroll_speed': ss_r,
    'max_scroll_depth': msd_r,
    'key_presses_per_min': kpm_r,
    'idle_ratio': ir_r,
    'view_switches_per_min': vsm_r,
    'label': 'reader',
})

# ── struggling ───────────────────────────────────────────────────────────────
# High repeat clicks (same targets), low unique ratio, high idle, low scroll
cpm_s = clip(np.random.normal(18, 7, N), 5, 40)
ucr_s = clip(np.random.uniform(0.20, 0.55, N), 0, 1)
rcr_s = clip(1 - ucr_s + np.random.normal(0, 0.07, N), 0.3, 0.9)
ss_s  = clip(np.random.normal(0.20, 0.10, N), 0.02, 0.50)
msd_s = clip(np.random.normal(28, 15, N), 5, 65)
kpm_s = clip(np.random.normal(10, 6, N), 0, 30)
ir_s  = clip(np.random.normal(0.45, 0.15, N), 0.15, 0.80)
vsm_s = clip(np.random.normal(1.2, 0.7, N), 0, 4)

df_s = pd.DataFrame({
    'clicks_per_min': cpm_s,
    'unique_click_ratio': ucr_s,
    'repeat_click_ratio': rcr_s,
    'scroll_speed': ss_s,
    'max_scroll_depth': msd_s,
    'key_presses_per_min': kpm_s,
    'idle_ratio': ir_s,
    'view_switches_per_min': vsm_s,
    'label': 'struggling',
})

# ── explorer ─────────────────────────────────────────────────────────────────
# Moderate clicks, high unique ratio, high key presses (search), many view switches
cpm_e = clip(np.random.normal(22, 8, N), 8, 50)
ucr_e = clip(np.random.uniform(0.80, 1.0, N), 0, 1)
rcr_e = clip(np.random.uniform(0, 0.12, N), 0, 0.25)
ss_e  = clip(np.random.normal(0.35, 0.12, N), 0.10, 0.70)
msd_e = clip(np.random.normal(45, 20, N), 10, 90)
kpm_e = clip(np.random.normal(55, 15, N), 20, 100)
ir_e  = clip(np.random.normal(0.20, 0.09, N), 0.03, 0.50)
vsm_e = clip(np.random.normal(7.0, 2.0, N), 3, 15)

df_e = pd.DataFrame({
    'clicks_per_min': cpm_e,
    'unique_click_ratio': ucr_e,
    'repeat_click_ratio': rcr_e,
    'scroll_speed': ss_e,
    'max_scroll_depth': msd_e,
    'key_presses_per_min': kpm_e,
    'idle_ratio': ir_e,
    'view_switches_per_min': vsm_e,
    'label': 'explorer',
})

# ── Combine, shuffle, save ───────────────────────────────────────────────────
df = pd.concat([df_fn, df_r, df_s, df_e], ignore_index=True)
df = df.sample(frac=1, random_state=42).reset_index(drop=True)
df.to_csv('training_data.csv', index=False)

print(f"Dataset shape: {df.shape}")
print("\nClass distribution:")
print(df['label'].value_counts())
