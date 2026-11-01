from pydantic import BaseModel
from typing import List


class FeatureVector(BaseModel):
    click_count: float = 0.0
    unique_elements_clicked: float = 0.0
    avg_scroll_depth: float = 0.0
    session_duration: float = 0.0
    click_density: float = 0.0
    navigation_depth: float = 0.0
    scroll_rate: float = 0.0
    hour_of_day: float = 0.0


class AdaptationSignal(BaseModel):
    theme: str
    componentOrder: List[str]
    layoutDensity: str
    detectedClass: str = ""
