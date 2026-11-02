"""
schemas.py
Pydantic schemas for the ContextUI behavioural adaptation ML service.
"""
from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Optional, Any


class FeatureVector(BaseModel):
    model_config = ConfigDict(extra="allow")

    click_count: float = 0.0
    unique_elements_clicked: float = 0.0
    avg_scroll_depth: float = 0.0
    session_duration: float = 0.0
    click_density: float = 0.0
    navigation_depth: float = 0.0
    scroll_rate: float = 0.0
    hour_of_day: float = 0.0


class AdaptationSignal(BaseModel):
    model_config = ConfigDict(extra="allow")

    theme: str
    componentOrder: List[str]
    layoutDensity: str
    detectedClass: str = ""
    confidence: float = 0.0
    probabilities: Dict[str, float] = {}
    featureImportances: Dict[str, float] = {}
    inferenceTimeMs: float = 0.0
