import joblib
import pandas as pd
import numpy as np
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

COLUMNS = [
    'click_count', 'unique_elements_clicked', 'avg_scroll_depth',
    'session_duration', 'click_density', 'navigation_depth',
    'scroll_rate', 'hour_of_day'
]

ADAPTATION_MAP = {
    'power_user': {
        'theme': 'dark',
        'layoutDensity': 'compact',
        'componentOrder': ['dashboard', 'analytics', 'notifications', 'settings']
    },
    'casual_browser': {
        'theme': 'light',
        'layoutDensity': 'spacious',
        'componentOrder': ['analytics', 'dashboard', 'notifications', 'settings']
    },
    'mobile_constrained': {
        'theme': 'light',
        'layoutDensity': 'compact',
        'componentOrder': ['dashboard', 'notifications', 'analytics', 'settings']
    },
    'accessibility_focused': {
        'theme': 'light',
        'layoutDensity': 'spacious',
        'componentOrder': ['settings', 'dashboard', 'analytics', 'notifications']
    }
}


def load_model():
    model_path = BASE_DIR / 'model.joblib'
    encoder_path = BASE_DIR / 'label_encoder.joblib'
    if not model_path.exists() or not encoder_path.exists():
        raise FileNotFoundError(
            f"Model files missing at {BASE_DIR}. Please run 'python train.py' first."
        )
    pipeline = joblib.load(model_path)
    encoder = joblib.load(encoder_path)
    return pipeline, encoder


def predict_adaptation(features_dict, pipeline, encoder):
    df_features = pd.DataFrame([[features_dict.get(c, 0.0) for c in COLUMNS]], columns=COLUMNS)
    encoded = pipeline.predict(df_features)[0]
    class_name = encoder.inverse_transform([encoded])[0]
    signal = ADAPTATION_MAP.get(class_name, {
        'theme': 'light',
        'layoutDensity': 'standard',
        'componentOrder': ['dashboard', 'analytics', 'settings', 'notifications']
    }).copy()
    signal['detectedClass'] = str(class_name)
    return signal
