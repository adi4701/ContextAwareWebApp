import pandas as pd
import numpy as np
import joblib
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report

# 1. Load data
df = pd.read_csv('training_data.csv')

# 2. Define features and target
features = [
    'click_count', 'unique_elements_clicked', 'avg_scroll_depth',
    'session_duration', 'click_density', 'navigation_depth',
    'scroll_rate', 'hour_of_day'
]
target = 'label'

X = df[features]
y = df[target]

# 3. Encode labels
encoder = LabelEncoder()
y_encoded = encoder.fit_transform(y)

# 4. Save encoder
joblib.dump(encoder, 'label_encoder.joblib')
print(f"Label classes: {list(encoder.classes_)}")

# 5. Train/test split (80/20, stratified)
X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded, test_size=0.2, stratify=y_encoded, random_state=42
)

# 6. Build pipeline
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('clf', RandomForestClassifier(n_estimators=100, random_state=42))
])

# 7. Fit
pipeline.fit(X_train, y_train)

# 8. Cross-validation
cv_scores = cross_val_score(pipeline, X_train, y_train, cv=5, scoring='accuracy')
print(f"\nCross-validation accuracy: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

# 9. Test set evaluation
y_pred = pipeline.predict(X_test)
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=encoder.classes_))

# 10. Feature importances
rf = pipeline.named_steps['clf']
importances = rf.feature_importances_
sorted_idx = np.argsort(importances)[::-1]
print("Feature Importances (descending):")
for idx in sorted_idx:
    print(f"  {features[idx]:<30} {importances[idx]:.4f}")

# 11. Save pipeline
joblib.dump(pipeline, 'model.joblib')
print("\nModel saved to model.joblib")
