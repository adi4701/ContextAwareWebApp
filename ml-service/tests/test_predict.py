"""
tests/test_predict.py

pytest suite for Phase 0 acceptance criteria:
  1. /health returns 200 with model_loaded=true
  2. /predict returns all required contract fields
  3. probabilities sum to ~1 (within floating-point tolerance)
  4. low-confidence input returns state == "balanced"

Run from ml-service/:
    pytest tests/test_predict.py -v
"""
import sys
from pathlib import Path
import pytest

# Allow importing project modules when running from ml-service/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient

# ── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def client():
    """Spin up the FastAPI app in-process (no uvicorn needed)."""
    from main import app
    with TestClient(app) as c:
        yield c


# ── Sample payloads ───────────────────────────────────────────────────────────

FAST_NAVIGATOR_PAYLOAD = {
    "clicks_per_min": 60.0,
    "unique_click_ratio": 0.85,
    "repeat_click_ratio": 0.05,
    "scroll_speed": 0.75,
    "max_scroll_depth": 55.0,
    "key_presses_per_min": 38.0,
    "idle_ratio": 0.08,
    "view_switches_per_min": 6.0,
}

READER_PAYLOAD = {
    "clicks_per_min": 4.0,
    "unique_click_ratio": 0.95,
    "repeat_click_ratio": 0.02,
    "scroll_speed": 0.12,
    "max_scroll_depth": 88.0,
    "key_presses_per_min": 3.0,
    "idle_ratio": 0.65,
    "view_switches_per_min": 0.5,
}

# All-zero payload → should be low-confidence → balanced
LOW_CONFIDENCE_PAYLOAD = {
    "clicks_per_min": 0.0,
    "unique_click_ratio": 0.5,
    "repeat_click_ratio": 0.5,
    "scroll_speed": 0.0,
    "max_scroll_depth": 0.0,
    "key_presses_per_min": 0.0,
    "idle_ratio": 0.5,
    "view_switches_per_min": 0.0,
}

REQUIRED_FIELDS = {
    "state", "predictedState", "confidence", "lowConfidence",
    "probabilities", "reasons", "changes", "adaptation",
    # shims
    "theme", "componentOrder", "layoutDensity", "detectedClass",
}

VALID_STATES = {"fast_navigator", "reader", "struggling", "explorer", "balanced"}


# ── Tests ─────────────────────────────────────────────────────────────────────

class TestHealth:
    def test_health_ok(self, client):
        r = client.get("/health")
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "ok"
        assert body["model_loaded"] is True


class TestPredict:
    def test_returns_all_contract_fields(self, client):
        r = client.post("/predict", json=FAST_NAVIGATOR_PAYLOAD)
        assert r.status_code == 200
        body = r.json()
        missing = REQUIRED_FIELDS - set(body.keys())
        assert not missing, f"Missing fields: {missing}"

    def test_state_is_valid(self, client):
        for payload in [FAST_NAVIGATOR_PAYLOAD, READER_PAYLOAD]:
            r = client.post("/predict", json=payload)
            assert r.status_code == 200
            assert r.json()["state"] in VALID_STATES

    def test_probabilities_sum_to_one(self, client):
        r = client.post("/predict", json=FAST_NAVIGATOR_PAYLOAD)
        assert r.status_code == 200
        probas = r.json()["probabilities"]
        assert probas, "probabilities dict must not be empty"
        total = sum(probas.values())
        assert abs(total - 1.0) < 0.02, f"Probabilities sum to {total}, expected ~1"

    def test_confidence_in_range(self, client):
        r = client.post("/predict", json=READER_PAYLOAD)
        assert r.status_code == 200
        conf = r.json()["confidence"]
        assert 0.0 <= conf <= 1.0

    def test_reasons_is_non_empty_list(self, client):
        r = client.post("/predict", json=FAST_NAVIGATOR_PAYLOAD)
        assert r.status_code == 200
        reasons = r.json()["reasons"]
        assert isinstance(reasons, list)
        assert len(reasons) >= 1

    def test_changes_is_non_empty_list(self, client):
        r = client.post("/predict", json=FAST_NAVIGATOR_PAYLOAD)
        assert r.status_code == 200
        changes = r.json()["changes"]
        assert isinstance(changes, list)
        assert len(changes) >= 1

    def test_adaptation_is_dict(self, client):
        r = client.post("/predict", json=FAST_NAVIGATOR_PAYLOAD)
        assert r.status_code == 200
        adaptation = r.json()["adaptation"]
        assert isinstance(adaptation, dict)

    def test_low_confidence_returns_balanced(self, client):
        """When all features are ambiguous (all 0.5), confidence should be
        below the threshold and state must be 'balanced'."""
        r = client.post("/predict", json=LOW_CONFIDENCE_PAYLOAD)
        assert r.status_code == 200
        body = r.json()
        if body["lowConfidence"]:
            assert body["state"] == "balanced", (
                f"lowConfidence=True but state={body['state']!r}, expected 'balanced'"
            )

    def test_shim_fields_present(self, client):
        r = client.post("/predict", json=FAST_NAVIGATOR_PAYLOAD)
        assert r.status_code == 200
        body = r.json()
        assert "theme" in body
        assert "componentOrder" in body
        assert "layoutDensity" in body
        assert "detectedClass" in body

    def test_legacy_fields_accepted(self, client):
        """Old backend fields in the payload must not cause a 422."""
        legacy_payload = {
            **FAST_NAVIGATOR_PAYLOAD,
            "click_count": 50.0,
            "hour_of_day": 14.0,
        }
        r = client.post("/predict", json=legacy_payload)
        assert r.status_code == 200
