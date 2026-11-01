"""
main.py
FastAPI entry point for the behaviour-state adaptation service.
"""
from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from schemas import AdaptationSignal, FeatureVector
from model_utils import load_model, predict_adaptation

logger = logging.getLogger("uvicorn.error")

ml_state: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        pipeline, encoder = load_model()
        ml_state["pipeline"] = pipeline
        ml_state["encoder"] = encoder
        logger.info("ML model loaded successfully")
    except FileNotFoundError as exc:
        logger.error(str(exc))
        logger.error("Start the service with 'python train.py' first.")
    yield
    ml_state.clear()


app = FastAPI(
    title="Behaviour-State Adaptation Service",
    description="Predicts user behaviour state from 8 interaction features.",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tightened per-deployment in Phase 7
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "service": "Behaviour-State Adaptation Service",
        "version": "2.0.0",
        "status": "running",
        "model_loaded": bool(ml_state),
        "endpoints": ["/health", "/predict"],
    }


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": bool(ml_state)}


@app.post("/predict", response_model=AdaptationSignal)
def predict(features: FeatureVector):
    if not ml_state:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Run 'python train.py' and restart the service.",
        )
    try:
        signal = predict_adaptation(
            features.model_dump(exclude_none=False),
            ml_state["pipeline"],
            ml_state["encoder"],
        )
        return signal
    except Exception as exc:
        logger.error(f"Prediction error: {exc}")
        # Return a safe balanced default
        return AdaptationSignal(
            state="balanced",
            predictedState="balanced",
            confidence=0.0,
            lowConfidence=True,
            probabilities={},
            reasons=["Prediction failed — using default layout"],
            changes=["Default layout applied"],
            adaptation={
                "density": "standard",
                "textScale": 1.0,
                "targetSize": "normal",
                "showShortcuts": False,
                "showHelp": False,
                "emphasizeSearch": False,
                "showNotes": False,
            },
            theme="light",
            componentOrder=["dashboard", "analytics", "settings", "notifications"],
            layoutDensity="standard",
            detectedClass="",
        )
