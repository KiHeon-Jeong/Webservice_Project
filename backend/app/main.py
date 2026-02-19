from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .model_registry import ModelRegistry
from .predictors import ImmunePredictor, NutritionPredictor
from .schemas import (
    ImmunePredictBatchRequest,
    ImmunePredictRequest,
    ImmunePredictResponse,
    NutritionSimRequest,
    NutritionSimResponse,
)


app = FastAPI(
    title="Immune/Nutrition Model Backend",
    version="1.0.0",
    description="Backend service for DIVS immune and integrated nutrition model inference.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

registry = ModelRegistry()
immune_predictor = ImmunePredictor(registry)
nutrition_predictor = NutritionPredictor(registry)


@app.get("/")
def root() -> dict:
    return {"service": "model-backend", "status": "ok"}


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "models": registry.status()}


@app.post("/api/admin/reload-models")
def reload_models() -> dict:
    registry.reload()
    return {"status": "reloaded", "models": registry.status()}


@app.post("/api/immune/predict", response_model=ImmunePredictResponse)
def predict_immune(payload: ImmunePredictRequest) -> ImmunePredictResponse:
    return immune_predictor.predict(payload.resident_id, payload.features)


@app.post("/api/immune/predict/batch")
def predict_immune_batch(payload: ImmunePredictBatchRequest) -> dict:
    items = [immune_predictor.predict(item.resident_id, item.features) for item in payload.items]
    return {"items": items}


@app.post("/api/nutrition/simulate", response_model=NutritionSimResponse)
def simulate_nutrition(payload: NutritionSimRequest) -> NutritionSimResponse:
    return nutrition_predictor.simulate(payload.patient, payload.intervention)

