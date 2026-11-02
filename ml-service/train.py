"""
train.py
Trains the behaviour-state Random Forest classifier on 8 interaction features.

Features:
  click_count, unique_elements_clicked, avg_scroll_depth, session_duration,
  click_density, navigation_depth, scroll_rate, hour_of_day

Classes:
  power_user, casual_browser, mobile_constrained, accessibility_focused

Run:
  python train.py
"""
import json
import shutil
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

COLUMNS = [
    'click_count', 'unique_elements_clicked', 'avg_scroll_depth',
    'session_duration', 'click_density', 'navigation_depth',
    'scroll_rate', 'hour_of_day'
]

# 1. Generate data if missing
csv_path = BASE_DIR / 'training_data.csv'
if not csv_path.exists():
    print("training_data.csv not found — running generate_data.py...")
    subprocess.run([sys.executable, str(BASE_DIR / 'generate_data.py')], check=True)

df = pd.read_csv(csv_path)
print(f"\nLoaded dataset: {df.shape}")
print("Class distribution:")
print(df['label'].value_counts())

# 2. Features and target
X = df[COLUMNS]
y = df['label']

# 3. Label Encoder
encoder = LabelEncoder()
y_encoded = encoder.fit_transform(y)
joblib.dump(encoder, BASE_DIR / 'label_encoder.joblib')
print(f"\nLabel classes: {list(encoder.classes_)}")

# 4. Stratified 80/20 train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded, test_size=0.2, stratify=y_encoded, random_state=42
)

# 5. Pipeline: StandardScaler + RandomForestClassifier
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('clf', RandomForestClassifier(
        n_estimators=100,
        max_depth=None,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )),
])

pipeline.fit(X_train, y_train)

# 6. Cross validation
cv_scores = cross_val_score(pipeline, X_train, y_train, cv=5, scoring='accuracy')
cv_mean = float(cv_scores.mean())
cv_std = float(cv_scores.std())
print(f"\nCV accuracy: {cv_mean:.4f} ± {cv_std:.4f}")

# 7. Test set evaluation
y_pred = pipeline.predict(X_test)
test_acc = float(accuracy_score(y_test, y_pred))
macro_f1 = float(f1_score(y_test, y_pred, average='macro'))
print(f"Test accuracy : {test_acc:.4f}")
print(f"Test macro-F1 : {macro_f1:.4f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=encoder.classes_))

# 8. Feature importances (normalized to 100%)
rf = pipeline.named_steps['clf']
raw_importances = rf.feature_importances_
importances_pct = {
    col: round(float(imp) * 100, 1)
    for col, imp in zip(COLUMNS, raw_importances)
}
print("\nFeature Importances (%):")
for col, imp in sorted(importances_pct.items(), key=lambda x: x[1], reverse=True):
    print(f"  {col:<26}: {imp}%")
print(f"Sum of feature importances: {sum(importances_pct.values()):.1f}%")

# 9. Save model pipeline
joblib.dump(pipeline, BASE_DIR / 'model.joblib')
print("\nModel saved to model.joblib")

# 10. Metrics file
cm = confusion_matrix(y_test, y_pred).tolist()
metrics_data = {
    "data_note": "Synthetic behavioural interaction dataset (10,000 samples, uniform time-of-day)",
    "data_type": "synthetic",
    "n_samples": int(len(df)),
    "n_classes": int(len(encoder.classes_)),
    "classes": list(encoder.classes_),
    "features": COLUMNS,
    "cv_accuracy_mean": round(cv_mean, 4),
    "cv_accuracy_std": round(cv_std, 4),
    "test_accuracy": round(test_acc, 4),
    "test_macro_f1": round(macro_f1, 4),
    "baseline_accuracy": 0.25,
    "baseline_macro_f1": 0.25,
    "confidence_threshold": 0.45,
    "per_class_f1": {
        str(cls): round(float(f1), 4)
        for cls, f1 in zip(encoder.classes_, f1_score(y_test, y_pred, average=None))
    },
    "confusion_matrix": cm,
    "confusion_matrix_labels": list(encoder.classes_),
    "feature_importances": importances_pct,
}

with open(BASE_DIR / 'metrics.json', 'w') as f:
    json.dump(metrics_data, f, indent=2)
print("Saved metrics.json")

frontend_metrics_path = BASE_DIR.parent / 'frontend' / 'public' / 'model-metrics.json'
if frontend_metrics_path.parent.exists():
    with open(frontend_metrics_path, 'w') as f:
        json.dump(metrics_data, f, indent=2)
    print(f"Updated {frontend_metrics_path}")
