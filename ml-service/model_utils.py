"""
model_utils.py
Model loading and prediction logic for the behaviour-state classifier.
"""
import joblib
import json
import pandas as pd
import numpy as np
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

FEATURE_COLUMNS = [
    'clicks_per_min',
    'unique_click_ratio',
    'repeat_click_ratio',
    'scroll_speed',
    'max_scroll_depth',
    'key_presses_per_min',
    'idle_ratio',
    'view_switches_per_min',
]

CONFIDENCE_THRESHOLD = 0.45  # below this → balanced (low-confidence fallback)

# ── UI adaptation map ────────────────────────────────────────────────────────
ADAPTATION_MAP: dict[str, dict] = {
    'fast_navigator': {
        'density': 'compact',
        'textScale': 1.0,
        'targetSize': 'normal',
        'showShortcuts': True,
        'showHelp': False,
        'emphasizeSearch': False,
        'showNotes': False,
        # shims
        'theme': 'dark',
        'layoutDensity': 'compact',
        'componentOrder': ['dashboard', 'analytics', 'notifications', 'settings'],
    },
    'reader': {
        'density': 'spacious',
        'textScale': 1.2,
        'targetSize': 'normal',
        'showShortcuts': False,
        'showHelp': False,
        'emphasizeSearch': False,
        'showNotes': True,
        # shims
        'theme': 'light',
        'layoutDensity': 'spacious',
        'componentOrder': ['analytics', 'dashboard', 'notifications', 'settings'],
    },
    'struggling': {
        'density': 'standard',
        'textScale': 1.1,
        'targetSize': 'large',
        'showShortcuts': False,
        'showHelp': True,
        'emphasizeSearch': False,
        'showNotes': False,
        # shims
        'theme': 'light',
        'layoutDensity': 'spacious',
        'componentOrder': ['dashboard', 'notifications', 'analytics', 'settings'],
    },
    'explorer': {
        'density': 'standard',
        'textScale': 1.0,
        'targetSize': 'normal',
        'showShortcuts': False,
        'showHelp': False,
        'emphasizeSearch': True,
        'showNotes': False,
        # shims
        'theme': 'light',
        'layoutDensity': 'standard',
        'componentOrder': ['analytics', 'dashboard', 'settings', 'notifications'],
    },
    'balanced': {
        'density': 'standard',
        'textScale': 1.0,
        'targetSize': 'normal',
        'showShortcuts': False,
        'showHelp': False,
        'emphasizeSearch': False,
        'showNotes': False,
        # shims
        'theme': 'light',
        'layoutDensity': 'standard',
        'componentOrder': ['dashboard', 'analytics', 'settings', 'notifications'],
    },
}

# Human-readable reason generators per state
REASON_MAP: dict[str, list[str]] = {
    'fast_navigator': [
        'You are clicking rapidly across many different elements',
        'Your navigation pattern shows quick, purposeful movements',
        'Low idle time indicates focused, efficient usage',
    ],
    'reader': [
        'You are scrolling slowly and reading deeply',
        'Long idle pauses suggest you are processing content',
        'Few view switches indicate focused reading',
    ],
    'struggling': [
        'You are re-clicking the same elements repeatedly',
        'Long pauses and low scroll depth suggest difficulty finding content',
        'Your interaction pattern indicates you may need clearer affordances',
    ],
    'explorer': [
        'You are typing frequently, suggesting active search behaviour',
        'Many view switches indicate you are exploring the interface',
        'High unique-element clicks show broad curiosity',
    ],
    'balanced': [
        'Confidence is below threshold — using default layout',
        'Not enough signal yet to reliably detect your usage pattern',
    ],
}

CHANGES_MAP: dict[str, list[str]] = {
    'fast_navigator': [
        'Layout switched to compact density',
        'Keyboard shortcut bar shown',
        'Theme set to dark',
    ],
    'reader': [
        'Layout switched to spacious density',
        'Text scale increased to 120%',
        'Task notes automatically expanded',
    ],
    'struggling': [
        'Button targets enlarged for easier clicking',
        'Help tips shown at top of interface',
        'Layout density increased for clarity',
    ],
    'explorer': [
        'Search bar pinned to top',
        'Quick filters highlighted',
        'Layout density set to standard',
    ],
    'balanced': [
        'Default layout restored',
        'Adaptation paused until clearer signal detected',
    ],
}


def load_model():
    """Load the trained pipeline and label encoder from disk."""
    model_path = BASE_DIR / 'model.joblib'
    encoder_path = BASE_DIR / 'label_encoder.joblib'
    if not model_path.exists() or not encoder_path.exists():
        raise FileNotFoundError(
            f"Model files missing at {BASE_DIR}. Run 'python train.py' first."
        )
    pipeline = joblib.load(model_path)
    encoder = joblib.load(encoder_path)
    return pipeline, encoder


def predict_adaptation(features_dict: dict, pipeline, encoder) -> dict:
    """
    Predict the behaviour state from a feature dict and return the full
    AdaptationSignal-compatible dictionary.
    """
    row = [features_dict.get(c, 0.0) for c in FEATURE_COLUMNS]
    df_features = pd.DataFrame([row], columns=FEATURE_COLUMNS)

    probas = pipeline.predict_proba(df_features)[0]
    classes = list(encoder.classes_)
    proba_dict = {cls: float(round(p, 4)) for cls, p in zip(classes, probas)}

    predicted_idx = int(np.argmax(probas))
    predicted_state = classes[predicted_idx]
    confidence = float(round(probas[predicted_idx], 4))
    low_confidence = confidence < CONFIDENCE_THRESHOLD

    state = 'balanced' if low_confidence else predicted_state

    adaptation_hints = ADAPTATION_MAP.get(state, ADAPTATION_MAP['balanced']).copy()

    # Extract shim fields before building the structured adaptation dict
    shim_theme = adaptation_hints.pop('theme', 'light')
    shim_layout_density = adaptation_hints.pop('layoutDensity', 'standard')
    shim_component_order = adaptation_hints.pop('componentOrder', ['dashboard', 'analytics', 'settings', 'notifications'])

    return {
        # New contract
        'state': state,
        'predictedState': predicted_state,
        'confidence': confidence,
        'lowConfidence': low_confidence,
        'probabilities': proba_dict,
        'reasons': REASON_MAP.get(state, REASON_MAP['balanced']),
        'changes': CHANGES_MAP.get(state, CHANGES_MAP['balanced']),
        'adaptation': adaptation_hints,
        # Compatibility shims
        'theme': shim_theme,
        'componentOrder': shim_component_order,
        'layoutDensity': shim_layout_density,
        'detectedClass': state,
    }
