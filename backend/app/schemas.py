from __future__ import annotations

from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field


RiskLevel = Literal["critical", "high", "moderate", "low"]
ImmuneSource = Literal["model", "fallback"]
NutritionSource = Literal["ml+rule", "rule-based"]


class ImmuneFeatures(BaseModel):
    age: float = Field(..., ge=0, le=120)
    gender: Literal["M", "F", "남", "여"] = "F"
    dementia_yn: int = Field(0, ge=0, le=1)
    parkinson_yn: int = Field(0, ge=0, le=1)
    chf_yn: int = Field(0, ge=0, le=1)
    ckd_yn: int = Field(0, ge=0, le=1)
    copd_yn: int = Field(0, ge=0, le=1)
    cancer_yn: int = Field(0, ge=0, le=1)
    steroid_yn: int = Field(0, ge=0, le=1)
    immunosup_yn: int = Field(0, ge=0, le=1)
    antipsychotic_yn: int = Field(0, ge=0, le=1)
    temp_rr: float = Field(1.0, gt=0.0, le=3.0)
    season_rr: float = Field(1.0, gt=0.0, le=3.0)
    hum_rr: float = Field(1.0, gt=0.0, le=3.0)
    outbreak_rr: float = Field(1.0, gt=0.0, le=3.0)
    room_rr: float = Field(1.0, gt=0.0, le=3.0)
    epi_rr: float = Field(1.0, gt=0.0, le=3.0)


class ImmunePredictRequest(BaseModel):
    resident_id: Optional[str] = None
    features: ImmuneFeatures


class ImmunePredictBatchRequest(BaseModel):
    items: List[ImmunePredictRequest] = Field(default_factory=list)


class ImmunePredictResponse(BaseModel):
    resident_id: Optional[str] = None
    source: ImmuneSource
    risk_probability: float
    immunity_score: float
    divs_score: float
    risk_level: RiskLevel
    used_features: Dict[str, float] = Field(default_factory=dict)


class NutritionPatient(BaseModel):
    age: int = Field(..., ge=0, le=120)
    sex: Literal["M", "F"] = "F"
    hemoglobin: Optional[float] = None
    ferritin: Optional[float] = None
    tsat: Optional[float] = None
    albumin: Optional[float] = None
    vitamin_d: Optional[float] = None
    calcium: Optional[float] = None
    crp: Optional[float] = None
    bun: Optional[float] = None
    creatinine: Optional[float] = None
    glucose: Optional[float] = None
    sodium: Optional[float] = None
    potassium: Optional[float] = None
    chloride: Optional[float] = None
    bicarbonate: Optional[float] = None
    wbc: Optional[float] = None
    platelet: Optional[float] = None
    ckd_stage: int = Field(0, ge=0, le=5)
    smoker: bool = False
    immune_compromised: bool = False
    chronic_inflammation: bool = False
    kidney_stone_history: bool = False
    hemochromatosis: bool = False
    hypercalcemia: bool = False
    fracture_risk_high: bool = False


class NutritionIntervention(BaseModel):
    iron_mg: Optional[float] = None
    vitamin_d_iu: Optional[float] = None
    calcium_mg: Optional[float] = None
    omega3_epa_dha_g: Optional[float] = None
    vitamin_c_mg: Optional[float] = None
    protein_g: Optional[float] = None
    duration_weeks: int = Field(4, ge=1, le=52)


class NutritionSimRequest(BaseModel):
    patient: NutritionPatient
    intervention: NutritionIntervention


class NutritionResult(BaseModel):
    parameter: str
    current_value: Optional[float] = None
    expected_value: Optional[float] = None
    expected_change: Optional[float] = None
    interpretation: str
    warnings: List[str] = Field(default_factory=list)
    contraindications: List[str] = Field(default_factory=list)
    monitoring_recommendations: List[str] = Field(default_factory=list)
    model_type: str = "rule-based"


class NutritionSimResponse(BaseModel):
    source: NutritionSource
    results: Dict[str, NutritionResult] = Field(default_factory=dict)
    warnings: List[str] = Field(default_factory=list)

