import numpy as np
import pandas as pd

np.random.seed(42)
N = 2500

# ── power_user ──────────────────────────────────────────────────────────────
click_count_pu = np.clip(np.random.normal(85, 15, N), 40, 150)
unique_pu = np.clip(
    click_count_pu * np.random.uniform(0.6, 0.9, N), 0, click_count_pu
)
avg_scroll_pu = np.clip(np.random.normal(75, 10, N), 50, 100)
session_dur_pu = np.clip(np.random.normal(180, 30, N), 120, 300)
nav_depth_pu = np.clip(np.random.normal(8, 2, N), 5, 15)
hour_pu = np.random.choice([9, 10, 11, 14, 15, 16], N)
click_density_pu = click_count_pu / (session_dur_pu / 60)
scroll_rate_pu = (avg_scroll_pu / 10) / session_dur_pu * 100

df_power = pd.DataFrame({
    'click_count': click_count_pu,
    'unique_elements_clicked': unique_pu,
    'avg_scroll_depth': avg_scroll_pu,
    'session_duration': session_dur_pu,
    'click_density': click_density_pu,
    'navigation_depth': nav_depth_pu,
    'scroll_rate': scroll_rate_pu,
    'hour_of_day': hour_pu.astype(float),
    'label': 'power_user'
})

# ── casual_browser ───────────────────────────────────────────────────────────
click_count_cb = np.clip(np.random.normal(15, 5, N), 5, 35)
unique_cb = np.clip(
    click_count_cb * np.random.uniform(0.7, 0.9, N), 0, click_count_cb
)
avg_scroll_cb = np.clip(np.random.normal(35, 15, N), 10, 70)
session_dur_cb = np.clip(np.random.normal(300, 60, N), 120, 600)
nav_depth_cb = np.clip(np.random.normal(2, 1, N), 1, 5)
hour_cb = np.random.randint(0, 24, N)  # 0–23 inclusive
click_density_cb = click_count_cb / (session_dur_cb / 60)
scroll_rate_cb = (avg_scroll_cb / 10) / session_dur_cb * 100

df_casual = pd.DataFrame({
    'click_count': click_count_cb,
    'unique_elements_clicked': unique_cb,
    'avg_scroll_depth': avg_scroll_cb,
    'session_duration': session_dur_cb,
    'click_density': click_density_cb,
    'navigation_depth': nav_depth_cb,
    'scroll_rate': scroll_rate_cb,
    'hour_of_day': hour_cb.astype(float),
    'label': 'casual_browser'
})

# ── mobile_constrained ───────────────────────────────────────────────────────
click_count_mc = np.clip(np.random.normal(25, 8, N), 10, 50)
unique_mc = np.clip(
    click_count_mc * np.random.uniform(0.5, 0.75, N), 0, click_count_mc
)
avg_scroll_mc = np.clip(np.random.normal(60, 20, N), 20, 95)
session_dur_mc = np.clip(np.random.normal(120, 30, N), 60, 240)
nav_depth_mc = np.clip(np.random.normal(3, 1, N), 1, 6)
hour_mc = np.random.choice([19, 20, 21, 22], N)
click_density_mc = click_count_mc / (session_dur_mc / 60)
scroll_rate_mc = (avg_scroll_mc / 10) / session_dur_mc * 100

df_mobile = pd.DataFrame({
    'click_count': click_count_mc,
    'unique_elements_clicked': unique_mc,
    'avg_scroll_depth': avg_scroll_mc,
    'session_duration': session_dur_mc,
    'click_density': click_density_mc,
    'navigation_depth': nav_depth_mc,
    'scroll_rate': scroll_rate_mc,
    'hour_of_day': hour_mc.astype(float),
    'label': 'mobile_constrained'
})

# ── accessibility_focused ────────────────────────────────────────────────────
click_count_af = np.clip(np.random.normal(40, 10, N), 20, 70)
unique_af = np.clip(
    click_count_af * np.random.uniform(0.85, 1.0, N), 0, click_count_af
)
avg_scroll_af = np.clip(np.random.normal(90, 8, N), 70, 100)
session_dur_af = np.clip(np.random.normal(420, 60, N), 300, 600)
nav_depth_af = np.clip(np.random.normal(6, 2, N), 3, 10)
hour_af = np.random.choice([8, 9, 10, 11], N)
click_density_af = click_count_af / (session_dur_af / 60)
scroll_rate_af = (avg_scroll_af / 10) / session_dur_af * 100

df_accessibility = pd.DataFrame({
    'click_count': click_count_af,
    'unique_elements_clicked': unique_af,
    'avg_scroll_depth': avg_scroll_af,
    'session_duration': session_dur_af,
    'click_density': click_density_af,
    'navigation_depth': nav_depth_af,
    'scroll_rate': scroll_rate_af,
    'hour_of_day': hour_af.astype(float),
    'label': 'accessibility_focused'
})

# ── Combine, shuffle, save ───────────────────────────────────────────────────
df = pd.concat([df_power, df_casual, df_mobile, df_accessibility], ignore_index=True)
df = df.sample(frac=1, random_state=42).reset_index(drop=True)
df.to_csv('training_data.csv', index=False)

print(f"Dataset shape: {df.shape}")
print("\nClass distribution:")
print(df['label'].value_counts())
