from fastapi import FastAPI
from contextlib import asynccontextmanager
import logging

from schemas import FeatureVector, AdaptationSignal
from model_utils import load_model, predict_adaptation

logger = logging.getLogger("uvicorn.error")

ml_state = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    pipeline, encoder = load_model()
    ml_state["pipeline"] = pipeline
    ml_state["encoder"] = encoder
    logger.info("ML model loaded successfully")
    yield
    ml_state.clear()


app = FastAPI(title="ML Adaptation Service", lifespan=lifespan)


@app.get("/")
def root():
    return {
        "service": "ML Adaptation Service",
        "status": "running",
        "endpoints": ["/health", "/predict"],
        "frontend_url": "http://localhost:3000"
    }


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": len(ml_state) > 0}


@app.post("/predict", response_model=AdaptationSignal)
def predict(features: FeatureVector):
    try:
        signal = predict_adaptation(
            features.model_dump(),
            ml_state["pipeline"],
            ml_state["encoder"]
        )
        return signal
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return AdaptationSignal(
            theme="light",
            componentOrder=["dashboard", "analytics", "settings", "notifications"],
            layoutDensity="standard"
        )
