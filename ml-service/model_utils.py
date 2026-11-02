import time
import joblib
import pandas as pd
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
        'componentOrder': [
            'quickactions', 'performance', 'dashboard', 'analytics',
            'activity', 'notifications', 'settings'
        ]
    },
    'casual_browser': {
        'theme': 'light',
        'layoutDensity': 'spacious',
        'componentOrder': [
            'dashboard', 'analytics', 'notifications', 'activity',
            'quickactions', 'performance', 'settings'
        ]
    },
    'mobile_constrained': {
        'theme': 'light',
        'layoutDensity': 'compact',
        'componentOrder': [
            'quickactions', 'dashboard', 'notifications', 'activity',
            'analytics', 'settings', 'performance'
        ]
    },
    'accessibility_focused': {
        'theme': 'light',
        'layoutDensity': 'spacious',
        'componentOrder': [
            'settings', 'dashboard', 'activity', 'notifications',
            'quickactions', 'analytics', 'performance'
        ]
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
    start_time = time.perf_counter()
    df_features = pd.DataFrame([[features_dict.get(c, 0.0) for c in COLUMNS]], columns=COLUMNS)

    probs = pipeline.predict_proba(df_features)[0]
    best_idx = int(probs.argmax())
    confidence = round(float(probs[best_idx]) * 100, 1)
    class_name = str(encoder.inverse_transform([best_idx])[0])

    probabilities = {
        str(cls): round(float(p) * 100, 1)
        for cls, p in zip(encoder.classes_, probs)
    }

    rf = pipeline.named_steps['clf']
    feature_importances = {
        col: round(float(imp) * 100, 1)
        for col, imp in zip(COLUMNS, rf.feature_importances_)
    }

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

    signal = ADAPTATION_MAP.get(class_name, {
        'theme': 'light',
        'layoutDensity': 'standard',
        'componentOrder': [
            'dashboard', 'analytics', 'performance', 'activity',
            'quickactions', 'notifications', 'settings'
        ]
    }).copy()

    signal['detectedClass'] = class_name
    signal['state'] = class_name
    signal['confidence'] = confidence
    signal['probabilities'] = probabilities
    signal['featureImportances'] = feature_importances
    signal['inferenceTimeMs'] = elapsed_ms
    return signal
