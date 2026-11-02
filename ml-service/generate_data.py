import numpy as np
import pandas as pd

np.random.seed(42)
N = 2500

# 1. power_user: High click density (>22 clicks/min), deep navigation, high unique ratio
session_dur_pu = np.clip(np.random.normal(90, 40, N), 20, 300)
click_density_pu = np.clip(np.random.normal(32, 6, N), 22, 60)
click_count_pu = np.clip((click_density_pu * (session_dur_pu / 60)).round(), 12, 180)
unique_pu = np.clip((click_count_pu * np.random.uniform(0.70, 0.95, N)).round(), 8, click_count_pu)
avg_scroll_pu = np.clip(np.random.normal(75, 12, N), 50, 100)
nav_depth_pu = np.clip(np.random.normal(8, 2, N), 5, 15).round()
hour_pu = np.random.randint(0, 24, N)
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

# 2. casual_browser: Low click density (<8 clicks/min), shallow scroll (15-45%), low nav depth
session_dur_cb = np.clip(np.random.normal(120, 50, N), 20, 400)
click_density_cb = np.clip(np.random.normal(4.5, 1.8, N), 1.0, 8.5)
click_count_cb = np.clip((click_density_cb * (session_dur_cb / 60)).round(), 2, 30)
unique_cb = np.clip((click_count_cb * np.random.uniform(0.65, 0.90, N)).round(), 1, click_count_cb)
avg_scroll_cb = np.clip(np.random.normal(30, 10, N), 10, 50)
nav_depth_cb = np.clip(np.random.normal(2, 0.8, N), 1, 4).round()
hour_cb = np.random.randint(0, 24, N)
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

# 3. mobile_constrained: Moderate click density (11-20 clicks/min), lower unique ratio, fast scroll rate
session_dur_mc = np.clip(np.random.normal(60, 25, N), 15, 180)
click_density_mc = np.clip(np.random.normal(15, 3, N), 10, 21)
click_count_mc = np.clip((click_density_mc * (session_dur_mc / 60)).round(), 5, 50)
unique_mc = np.clip((click_count_mc * np.random.uniform(0.40, 0.65, N)).round(), 2, click_count_mc)
avg_scroll_mc = np.clip(np.random.normal(62, 12, N), 35, 85)
nav_depth_mc = np.clip(np.random.normal(3, 1, N), 1, 5).round()
hour_mc = np.random.randint(0, 24, N)
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

# 4. accessibility_focused: Methodical clicks (7-13 clicks/min), very high scroll depth (85-100%), high unique ratio
session_dur_af = np.clip(np.random.normal(150, 50, N), 30, 400)
click_density_af = np.clip(np.random.normal(9.5, 2.0, N), 6.0, 13.5)
click_count_af = np.clip((click_density_af * (session_dur_af / 60)).round(), 6, 65)
unique_af = np.clip((click_count_af * np.random.uniform(0.88, 1.0, N)).round(), 5, click_count_af)
avg_scroll_af = np.clip(np.random.normal(92, 5, N), 80, 100)
nav_depth_af = np.clip(np.random.normal(5, 1.2, N), 3, 8).round()
hour_af = np.random.randint(0, 24, N)
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

df = pd.concat([df_power, df_casual, df_mobile, df_accessibility], ignore_index=True)
df = df.sample(frac=1, random_state=42).reset_index(drop=True)
df.to_csv('training_data.csv', index=False)
print(f"Dataset shape: {df.shape}")
