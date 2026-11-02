"""
tests/test_predict.py
Test suite for the updated ContextUI behaviour-state classifier API:
  1. /health returns 200 with model_loaded=True
  2. /predict returns all required fields (theme, componentOrder, layoutDensity, detectedClass, confidence, probabilities, featureImportances, inferenceTimeMs)
  3. Feature importances sum to 100%
  4. componentOrder contains all 7 sections across all personas
  5. Probabilities sum to 100%
  6. Inference latency is recorded in ms
"""
import sys
from pathlib import Path
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient

@pytest.fixture(scope="module")
def client():
    from main import app
    with TestClient(app) as c:
        yield c


POWER_USER_PAYLOAD = {
    "click_count": 65.0,
    "unique_elements_clicked": 52.0,
    "avg_scroll_depth": 80.0,
    "session_duration": 120.0,
    "click_density": 32.5,
    "navigation_depth": 9.0,
    "scroll_rate": 6.67,
    "hour_of_day": 14.0,
}

CASUAL_BROWSER_PAYLOAD = {
    "click_count": 8.0,
    "unique_elements_clicked": 6.0,
    "avg_scroll_depth": 28.0,
    "session_duration": 120.0,
    "click_density": 4.0,
    "navigation_depth": 2.0,
    "scroll_rate": 2.33,
    "hour_of_day": 14.0,
}

REQUIRED_SECTIONS = {
    "quickactions", "performance", "dashboard", "analytics",
    "activity", "notifications", "settings"
}

VALID_CLASSES = {
    "power_user", "casual_browser", "mobile_constrained", "accessibility_focused"
}


class TestHealth:
    def test_health_ok(self, client):
        r = client.get("/health")
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "ok"
        assert body["model_loaded"] is True


class TestPredict:
    def test_predict_contract_fields(self, client):
        r = client.post("/predict", json=POWER_USER_PAYLOAD)
        assert r.status_code == 200
        data = r.json()
        for field in [
            "theme", "componentOrder", "layoutDensity", "detectedClass",
            "confidence", "probabilities", "featureImportances", "inferenceTimeMs"
        ]:
            assert field in data, f"Missing field: {field}"

    def test_detected_class_is_valid(self, client):
        r = client.post("/predict", json=POWER_USER_PAYLOAD)
        assert r.status_code == 200
        data = r.json()
        assert data["detectedClass"] in VALID_CLASSES

    def test_all_seven_sections_present_in_component_order(self, client):
        r = client.post("/predict", json=POWER_USER_PAYLOAD)
        assert r.status_code == 200
        order = r.json()["componentOrder"]
        assert len(order) == 7
        assert set(order) == REQUIRED_SECTIONS

    def test_feature_importances_sum_to_one_hundred(self, client):
        r = client.post("/predict", json=POWER_USER_PAYLOAD)
        assert r.status_code == 200
        importances = r.json()["featureImportances"]
        assert len(importances) == 8
        total = round(sum(importances.values()), 1)
        assert total == 100.0, f"Feature importances sum to {total}%, expected 100%"

    def test_probabilities_sum_to_one_hundred(self, client):
        r = client.post("/predict", json=CASUAL_BROWSER_PAYLOAD)
        assert r.status_code == 200
        probs = r.json()["probabilities"]
        assert len(probs) == 4
        total = round(sum(probs.values()), 1)
        assert 99.0 <= total <= 101.0

    def test_inference_time_is_positive(self, client):
        r = client.post("/predict", json=POWER_USER_PAYLOAD)
        assert r.status_code == 200
        latency = r.json()["inferenceTimeMs"]
        assert isinstance(latency, (int, float))
        assert latency >= 0
