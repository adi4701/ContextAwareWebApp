"""
schemas.py
Pydantic models for the behaviour-state classifier API.

Request:  FeatureVector  (8 window features over ~20 s)
Response: AdaptationSignal (new contract + compatibility shims)
"""
from pydantic import BaseModel, Field
from typing import Dict, List, Optional


class FeatureVector(BaseModel):
    """
    8 behavioural window features computed over the last ~20 seconds.
    All values are non-negative floats; the backend is responsible for computing them.
    """
    clicks_per_min: float = Field(default=0.0, ge=0)
    unique_click_ratio: float = Field(default=0.5, ge=0, le=1)
    repeat_click_ratio: float = Field(default=0.0, ge=0, le=1)
    scroll_speed: float = Field(default=0.0, ge=0)
    max_scroll_depth: float = Field(default=0.0, ge=0, le=100)
    key_presses_per_min: float = Field(default=0.0, ge=0)
    idle_ratio: float = Field(default=0.5, ge=0, le=1)
    view_switches_per_min: float = Field(default=0.0, ge=0)

    # ── Legacy / compatibility fields (old contract) ─────────────────────────
    # Kept so the old backend can still POST without breaking.
    click_count: Optional[float] = None
    unique_elements_clicked: Optional[float] = None
    avg_scroll_depth: Optional[float] = None
    session_duration: Optional[float] = None
    click_density: Optional[float] = None
    navigation_depth: Optional[float] = None
    scroll_rate: Optional[float] = None
    hour_of_day: Optional[float] = None


class AdaptationSignal(BaseModel):
    """
    Full new contract returned by /predict.
    The 'adaptation' sub-object carries concrete UI hints.
    The shim fields (theme, componentOrder, layoutDensity, detectedClass)
    are kept for backward compatibility until Phase 9.
    """
    # ── New fields ───────────────────────────────────────────────────────────
    state: str                          # fast_navigator | reader | struggling | explorer | balanced
    predictedState: str                 # raw classifier output (before low-confidence override)
    confidence: float                   # max class probability
    lowConfidence: bool                 # True when confidence < threshold
    probabilities: Dict[str, float]     # {state: probability, ...}
    reasons: List[str]                  # plain-language explanation (2-3 items)
    changes: List[str]                  # list of UI changes being applied
    adaptation: Dict[str, object]       # structured hints for the frontend

    # ── Compatibility shims (Phase 1–8) ──────────────────────────────────────
    theme: str = "light"
    componentOrder: List[str] = ["dashboard", "analytics", "settings", "notifications"]
    layoutDensity: str = "standard"
    detectedClass: str = ""
