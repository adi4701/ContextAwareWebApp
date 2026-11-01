"""
train.py
Trains the behaviour-state Random Forest classifier.

Steps:
  1. Generate data (runs generate_data.py logic)
  2. Train pipeline (StandardScaler + RandomForestClassifier)
  3. Evaluate: cross-validation + held-out test set
  4. Save model.joblib, label_encoder.joblib
  5. Write metrics.json and model_meta.json (small — committed to git)

Run: python train.py
"""
import json
import subprocess
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    f1_score,
    accuracy_score,
)
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, StandardScaler

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

# ── 1. Generate data if missing ───────────────────────────────────────────────
csv_path = BASE_DIR / 'training_data.csv'
if not csv_path.exists():
    print("training_data.csv not found — running generate_data.py …")
    subprocess.run([sys.executable, str(BASE_DIR / 'generate_data.py')], check=True)

df = pd.read_csv(csv_path)
print(f"\nLoaded dataset: {df.shape}")
print("Class distribution:")
print(df['label'].value_counts())

# ── 2. Features & target ──────────────────────────────────────────────────────
X = df[FEATURE_COLUMNS]
y = df['label']

encoder = LabelEncoder()
y_encoded = encoder.fit_transform(y)
joblib.dump(encoder, BASE_DIR / 'label_encoder.joblib')
print(f"\nLabel classes: {list(encoder.classes_)}")

# ── 3. Train/test split (stratified 80/20) ────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded, test_size=0.2, stratify=y_encoded, random_state=42
)

# ── 4. Pipeline ───────────────────────────────────────────────────────────────
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('clf', RandomForestClassifier(
        n_estimators=200,
        max_depth=None,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )),
])
pipeline.fit(X_train, y_train)

# ── 5. Cross-validation ───────────────────────────────────────────────────────
cv_scores = cross_val_score(pipeline, X_train, y_train, cv=5, scoring='accuracy')
print(f"\nCV accuracy: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

# ── 6. Test-set evaluation ────────────────────────────────────────────────────
y_pred = pipeline.predict(X_test)
test_acc = accuracy_score(y_test, y_pred)
macro_f1 = f1_score(y_test, y_pred, average='macro')
print(f"Test accuracy : {test_acc:.4f}")
print(f"Test macro-F1 : {macro_f1:.4f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=encoder.classes_))

cm = confusion_matrix(y_test, y_pred)
print("Confusion Matrix:")
print(cm)

# ── 7. Feature importances ────────────────────────────────────────────────────
rf = pipeline.named_steps['clf']
importances = rf.feature_importances_
sorted_idx = np.argsort(importances)[::-1]
print("\nFeature Importances:")
for idx in sorted_idx:
    print(f"  {FEATURE_COLUMNS[idx]:<30} {importances[idx]:.4f}")

# ── 8. Compute rule-based baseline (majority-class per feature threshold) ──────
# Simplest possible baseline: always predict the most frequent class
majority_class_idx = np.bincount(y_train).argmax()
baseline_pred = np.full_like(y_test, majority_class_idx)
baseline_acc = accuracy_score(y_test, baseline_pred)
baseline_f1 = f1_score(y_test, baseline_pred, average='macro', zero_division=0)
print(f"\nMajority-class baseline — accuracy: {baseline_acc:.4f}, macro-F1: {baseline_f1:.4f}")

# ── 9. Save model ─────────────────────────────────────────────────────────────
joblib.dump(pipeline, BASE_DIR / 'model.joblib')
print("\nSaved model.joblib")

# ── 10. Write metrics.json (committed to git, used by landing page) ───────────
metrics = {
    "data_note": "Trained on simulated interaction data only",
    "data_type": "synthetic",
    "n_samples": int(len(df)),
    "n_classes": int(len(encoder.classes_)),
    "classes": list(encoder.classes_),
    "features": FEATURE_COLUMNS,
    "cv_accuracy_mean": round(float(cv_scores.mean()), 4),
    "cv_accuracy_std": round(float(cv_scores.std()), 4),
    "test_accuracy": round(float(test_acc), 4),
    "test_macro_f1": round(float(macro_f1), 4),
    "baseline_accuracy": round(float(baseline_acc), 4),
    "baseline_macro_f1": round(float(baseline_f1), 4),
    "confidence_threshold": 0.45,
    "per_class_f1": {
        cls: round(float(f1_score(y_test, y_pred, labels=[i], average='micro')), 4)
        for i, cls in enumerate(encoder.classes_)
    },
    "confusion_matrix": cm.tolist(),
    "confusion_matrix_labels": list(encoder.classes_),
    "feature_importances": {
        FEATURE_COLUMNS[i]: round(float(importances[i]), 4)
        for i in range(len(FEATURE_COLUMNS))
    },
}

metrics_path = BASE_DIR / 'metrics.json'
with open(metrics_path, 'w') as f:
    json.dump(metrics, f, indent=2)
print(f"Saved {metrics_path}")

# Also copy to frontend public/ so the landing page can read it
frontend_public = BASE_DIR.parent / 'frontend' / 'public'
if frontend_public.exists():
    import shutil
    shutil.copy(metrics_path, frontend_public / 'model-metrics.json')
    print(f"Copied metrics to {frontend_public / 'model-metrics.json'}")

# ── 11. Write model_meta.json ─────────────────────────────────────────────────
meta = {
    "model": "RandomForestClassifier",
    "n_estimators": 200,
    "scaler": "StandardScaler",
    "states": ["fast_navigator", "reader", "struggling", "explorer"],
    "fallback_state": "balanced",
    "confidence_threshold": 0.45,
    "feature_window_seconds": 20,
    "feature_columns": FEATURE_COLUMNS,
    "training_data": "synthetic (generate_data.py)",
}

meta_path = BASE_DIR / 'model_meta.json'
with open(meta_path, 'w') as f:
    json.dump(meta, f, indent=2)
print(f"Saved {meta_path}")
