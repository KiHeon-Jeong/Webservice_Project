from __future__ import annotations

import math
from typing import Any, Dict, Optional

import numpy as np
import pandas as pd

from .model_registry import ModelRegistry
from .schemas import (
    ImmuneFeatures,
    ImmunePredictResponse,
    NutritionIntervention,
    NutritionPatient,
    NutritionResult,
    NutritionSimResponse,
)


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def _risk_level_from_divs(divs_score: float) -> str:
    if divs_score < 30.0:
        return "critical"
    if divs_score < 50.0:
        return "high"
    if divs_score < 70.0:
        return "moderate"
    return "low"


class ImmunePredictor:
    def __init__(self, registry: ModelRegistry) -> None:
        self.registry = registry

    def _base_features(self, features: ImmuneFeatures) -> Dict[str, float]:
        gender_value = 1.0 if features.gender in {"M", "남"} else 0.0
        return {
            "AGE": float(features.age),
            "GENDER": gender_value,
            "DEMENTIA_YN": float(features.dementia_yn),
            "PARKINSON_YN": float(features.parkinson_yn),
            "CHF_YN": float(features.chf_yn),
            "CKD_YN": float(features.ckd_yn),
            "COPD_YN": float(features.copd_yn),
            "CANCER_YN": float(features.cancer_yn),
            "STEROID_YN": float(features.steroid_yn),
            "IMMUNOSUP_YN": float(features.immunosup_yn),
            "ANTIPSYCHOTIC_YN": float(features.antipsychotic_yn),
        }

    def _with_derived_features(self, base: Dict[str, float]) -> Dict[str, float]:
        enriched = dict(base)
        age = base["AGE"]
        frailty_index = float(
            (age >= 75) and (base["DEMENTIA_YN"] == 1.0 or base["PARKINSON_YN"] == 1.0)
        )
        severe_immune_low = float(
            (base["CANCER_YN"] == 1.0)
            and (base["STEROID_YN"] == 1.0 or base["IMMUNOSUP_YN"] == 1.0)
        )
        disease_burden = (
            base["CHF_YN"] + base["CKD_YN"] + base["COPD_YN"] + base["CANCER_YN"]
        )
        if age < 65:
            age_bin = 0.0
        elif age < 75:
            age_bin = 1.0
        elif age < 85:
            age_bin = 2.0
        else:
            age_bin = 3.0

        enriched.update(
            {
                "FRAILTY_INDEX": frailty_index,
                "SEVERE_IMMUNE_LOW": severe_immune_low,
                "DISEASE_BURDEN": disease_burden,
                "AGE_BIN": age_bin,
                "AGE_SQ": age**2,
                "AGE_x_DISEASE": age * disease_burden,
                "AGE_x_FRAILTY": age * frailty_index,
            }
        )
        return enriched

    def _environment_rr(self, features: ImmuneFeatures) -> float:
        factors = [
            features.temp_rr,
            features.season_rr,
            features.hum_rr,
            features.outbreak_rr,
            features.room_rr,
            features.epi_rr,
        ]
        geometric_mean = float(math.prod(factors) ** (1.0 / len(factors)))
        return _clamp(geometric_mean, 0.5, 2.5)

    def _predict_probability_with_model(
        self, model: Any, row: Dict[str, float], feature_names: Optional[list[str]]
    ) -> float:
        ordered_names = feature_names or list(row.keys())
        payload = {name: float(row.get(name, 0.0)) for name in ordered_names}
        frame = pd.DataFrame([payload], columns=ordered_names)

        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(frame)
            return float(proba[0][1])
        if hasattr(model, "decision_function"):
            decision = float(model.decision_function(frame)[0])
            return float(1.0 / (1.0 + np.exp(-decision)))
        prediction = float(model.predict(frame)[0])
        return _clamp(prediction, 0.0, 1.0)

    def _fallback_probability(self, row: Dict[str, float]) -> float:
        age = row["AGE"]
        disease_burden = row["DISEASE_BURDEN"]
        risk = (
            0.12
            + max(age - 65.0, 0.0) * 0.007
            + disease_burden * 0.08
            + row["FRAILTY_INDEX"] * 0.06
            + row["SEVERE_IMMUNE_LOW"] * 0.08
            + row["STEROID_YN"] * 0.04
            + row["IMMUNOSUP_YN"] * 0.06
            + row["ANTIPSYCHOTIC_YN"] * 0.02
        )
        return _clamp(float(risk), 0.05, 0.95)

    def predict(self, resident_id: Optional[str], features: ImmuneFeatures) -> ImmunePredictResponse:
        base = self._base_features(features)
        full = self._with_derived_features(base)
        environment_rr = self._environment_rr(features)

        bundle = self.registry.artifacts.immune_bundle or {}
        model = bundle.get("model")
        feature_names = bundle.get("feature_names")
        source = "fallback"

        if model is not None:
            try:
                risk_probability = self._predict_probability_with_model(model, full, feature_names)
                source = "model"
            except Exception:
                risk_probability = self._fallback_probability(full)
        else:
            risk_probability = self._fallback_probability(full)

        risk_probability = _clamp(float(risk_probability), 0.0, 1.0)
        immunity_score = _clamp((1.0 - risk_probability) * 100.0, 0.0, 100.0)
        divs_score = _clamp(immunity_score / environment_rr, 0.0, 100.0)
        risk_level = _risk_level_from_divs(divs_score)

        used = dict(full)
        used["ENV_RR"] = environment_rr

        return ImmunePredictResponse(
            resident_id=resident_id,
            source=source,  # type: ignore[arg-type]
            risk_probability=round(risk_probability, 4),
            immunity_score=round(immunity_score, 2),
            divs_score=round(divs_score, 2),
            risk_level=risk_level,  # type: ignore[arg-type]
            used_features=used,
        )


class NutritionPredictor:
    def __init__(self, registry: ModelRegistry) -> None:
        self.registry = registry

    @staticmethod
    def _result(
        parameter: str,
        interpretation: str,
        *,
        current_value: Optional[float] = None,
        expected_value: Optional[float] = None,
        expected_change: Optional[float] = None,
        warnings: Optional[list[str]] = None,
        contraindications: Optional[list[str]] = None,
        monitoring_recommendations: Optional[list[str]] = None,
        model_type: str = "rule-based",
    ) -> NutritionResult:
        return NutritionResult(
            parameter=parameter,
            current_value=current_value,
            expected_value=expected_value,
            expected_change=expected_change,
            interpretation=interpretation,
            warnings=warnings or [],
            contraindications=contraindications or [],
            monitoring_recommendations=monitoring_recommendations or [],
            model_type=model_type,
        )

    def _prepare_albumin_features(
        self, patient: NutritionPatient, intervention: NutritionIntervention
    ) -> Dict[str, float]:
        defaults = {
            "hemoglobin": 13.0,
            "bun": 20.0,
            "creatinine": 1.0,
            "glucose": 100.0,
            "sodium": 140.0,
            "potassium": 4.0,
            "chloride": 105.0,
            "bicarbonate": 24.0,
            "wbc": 8.0,
            "platelet": 250.0,
        }

        age = float(patient.age)
        sex_m = 1.0 if patient.sex == "M" else 0.0
        glucose = float(patient.glucose if patient.glucose is not None else defaults["glucose"])
        ckd = 1.0 if patient.ckd_stage >= 3 else 0.0
        diabetes = 1.0 if glucose >= 126.0 else 0.0
        initial_albumin = float(patient.albumin if patient.albumin is not None else 3.5)
        protein_intake = float(intervention.protein_g if intervention.protein_g is not None else 50.0)
        cci = ckd + diabetes

        features: Dict[str, float] = {
            # Legacy lab-driven features (if model expects them)
            "age": age,
            "sex_M": sex_m,
        }

        for name, default in defaults.items():
            value = getattr(patient, name)
            features[name] = float(value if value is not None else default)

        features["bun_creatinine_ratio"] = features["bun"] / max(features["creatinine"], 0.1)

        # Albumin-change model features (uppercase)
        features.update(
            {
                "AGE": age,
                "GENDER": sex_m,
                "CKD": ckd,
                "DIABETES": diabetes,
                "CCI": cci,
                "INITIAL_ALBUMIN": initial_albumin,
                "PROTEIN_INTAKE": protein_intake,
            }
        )

        # Derived features (match notebook)
        weight_proxy = age * 0.5 + 50.0
        features["protein_per_kg"] = protein_intake / weight_proxy
        features["high_protein"] = 1.0 if protein_intake > 60.0 else 0.0
        features["low_protein"] = 1.0 if protein_intake < 40.0 else 0.0
        features["low_baseline_albumin"] = 1.0 if initial_albumin < 3.5 else 0.0
        features["very_low_baseline"] = 1.0 if initial_albumin < 3.0 else 0.0
        features["CKD_protein"] = ckd * protein_intake
        features["DIABETES_protein"] = diabetes * protein_intake
        features["baseline_protein"] = initial_albumin * protein_intake
        features["CKD_baseline"] = ckd * initial_albumin
        features["elderly"] = 1.0 if age > 75.0 else 0.0
        features["AGE_CKD"] = age * ckd
        features["high_risk"] = 1.0 if (ckd == 1.0 or diabetes == 1.0 or initial_albumin < 3.0) else 0.0
        features["comorbidity_count"] = cci
        features["protein_squared"] = protein_intake ** 2
        features["protein_log"] = float(np.log1p(protein_intake))
        features["albumin_squared"] = initial_albumin ** 2
        features["albumin_log"] = float(np.log(max(initial_albumin, 0.1)))

        # Lowercase/alternate aliases for compatibility
        features["cci"] = features["CCI"]
        features["ckd_protein"] = features["CKD_protein"]
        features["diabetes_protein"] = features["DIABETES_protein"]
        features["ckd_baseline"] = features["CKD_baseline"]
        features["age_ckd"] = features["AGE_CKD"]
        return features

    def _simulate_albumin(
        self, patient: NutritionPatient, intervention: NutritionIntervention
    ) -> Optional[NutritionResult]:
        bundle = self.registry.artifacts.albumin_bundle or {}
        model = bundle.get("model")
        if model is None:
            return None

        features = self._prepare_albumin_features(patient, intervention)
        feature_names = bundle.get("feature_names") or list(features.keys())

        try:
            ordered = [float(features.get(name, 0.0)) for name in feature_names]
            predicted = float(model.predict(np.array(ordered).reshape(1, -1))[0])
        except Exception:
            return None

        current = patient.albumin if patient.albumin is not None else 3.5
        protein_g = intervention.protein_g if intervention.protein_g is not None else 50.0
        duration_factor = max(min(float(intervention.duration_weeks) / 4.0, 2.0), 0.25)
        adjustment = predicted * duration_factor
        expected = current + adjustment
        warnings = ["CKD: 고단백 주의"] if patient.ckd_stage >= 3 else []

        return self._result(
            "Albumin",
            f"ML 예측: 단백질 {protein_g}g/day, {intervention.duration_weeks}주",
            current_value=current,
            expected_value=expected,
            expected_change=adjustment,
            warnings=warnings,
            monitoring_recommendations=["4주 후 알부민 재검사", "신기능 모니터링"],
            model_type="ml",
        )

    def simulate(self, patient: NutritionPatient, intervention: NutritionIntervention) -> NutritionSimResponse:
        gl = self.registry.artifacts.guidelines
        results: Dict[str, NutritionResult] = {}
        albumin_result = self._simulate_albumin(patient, intervention)

        if albumin_result:
            results["albumin"] = albumin_result

        if intervention.iron_mg:
            factor = 1.0
            warnings: list[str] = []
            if patient.ckd_stage >= 3:
                factor *= float(gl["iron"]["ckd_absorption_factor"])
                warnings.append("CKD: 흡수율 ↓30%")
            if patient.chronic_inflammation or (patient.crp is not None and patient.crp > 5):
                factor *= float(gl["iron"]["inflammation_factor"])
                warnings.append("염증: 효과 감소")

            expected_change = (
                float(gl["iron"]["baseline_hgb_increase"])
                * factor
                * (float(intervention.iron_mg) / 100.0)
                * (float(intervention.duration_weeks) / 4.0)
            )
            expected_value = (
                patient.hemoglobin + expected_change if patient.hemoglobin is not None else None
            )
            results["hemoglobin"] = self._result(
                "Hemoglobin",
                f"철분 {intervention.iron_mg}mg/day, {intervention.duration_weeks}주 → Hgb +{expected_change:.1f} g/dL",
                current_value=patient.hemoglobin,
                expected_value=expected_value,
                expected_change=expected_change,
                warnings=warnings,
                monitoring_recommendations=["4주 후 CBC", "Ferritin/TSAT 추적"],
            )

        if intervention.vitamin_d_iu:
            time_factor = min(float(intervention.duration_weeks) / 12.0, 1.0)
            increase = (
                float(intervention.vitamin_d_iu) / 1000.0
            ) * float(gl["vitamin_d"]["increase_per_1000iu"]) * time_factor
            expected_value = patient.vitamin_d + increase if patient.vitamin_d is not None else None
            warnings = []
            if float(intervention.vitamin_d_iu) > float(gl["vitamin_d"]["upper_limit_iu"]):
                warnings.append(
                    f"UL 초과: {intervention.vitamin_d_iu} > {gl['vitamin_d']['upper_limit_iu']} IU/day"
                )
            results["vitamin_d"] = self._result(
                "Vitamin D",
                f"비타민 D {intervention.vitamin_d_iu} IU/day, {intervention.duration_weeks}주 → +{increase:.1f} ng/mL",
                current_value=patient.vitamin_d,
                expected_value=expected_value,
                expected_change=increase,
                warnings=warnings,
                monitoring_recommendations=["3개월 후 25(OH)D", "칼슘 모니터링"],
            )

        if intervention.calcium_mg:
            baseline_risk = 0.20 if patient.fracture_risk_high else 0.10
            vitd_ok = bool(intervention.vitamin_d_iu and intervention.vitamin_d_iu >= 800)
            reduction = float(gl["calcium"]["fracture_risk_reduction"]) if vitd_ok else 0.0
            expected = baseline_risk * (1.0 - reduction)
            interpretation = (
                f"칼슘 {intervention.calcium_mg}mg + VitD {intervention.vitamin_d_iu} IU → 골절 위험 -15%"
                if vitd_ok
                else f"칼슘 {intervention.calcium_mg}mg (VitD 병용 권장)"
            )
            results["fracture_risk"] = self._result(
                "Fracture Risk",
                interpretation,
                current_value=baseline_risk,
                expected_value=expected,
                expected_change=-(baseline_risk - expected),
                monitoring_recommendations=["DEXA 골밀도", "낙상 위험 평가"],
            )

        if intervention.omega3_epa_dha_g:
            baseline_cvd = 0.15 if patient.age >= 70 else 0.10
            dose = float(intervention.omega3_epa_dha_g)
            reduction = float(gl["omega3"]["cvd_risk_reduction"]) if dose >= 1.0 else 0.0
            expected_cvd = baseline_cvd * (1.0 - reduction)
            interpretation = (
                f"오메가-3 {dose}g/day → CVD 위험 -8%"
                if dose >= 1.0
                else f"오메가-3 {dose}g/day (1.0g 이상 권장)"
            )
            results["cvd_risk"] = self._result(
                "CVD Risk",
                interpretation,
                current_value=baseline_cvd,
                expected_value=expected_cvd,
                expected_change=-(baseline_cvd - expected_cvd),
                monitoring_recommendations=["지질 프로필", "출혈 경향 (항응고제 복용 시)"],
            )

        if intervention.vitamin_c_mg:
            vit_c = gl["vitamin_c"]
            dose = float(intervention.vitamin_c_mg)
            warnings: list[str] = []
            contraindications: list[str] = []
            monitoring: list[str] = []
            optimal_low, optimal_high = vit_c["optimal_range"]

            if dose < vit_c["rni"]:
                interp = f"{dose}mg/day - 권장섭취량 미달 (결핍 위험)"
            elif dose < optimal_low:
                interp = f"{dose}mg/day - 권장섭취량 충족"
            elif dose <= optimal_high:
                interp = f"{dose}mg/day - 최적 범위 (항산화, 면역 지원)"
            elif dose <= vit_c["upper_limit"]:
                interp = f"{dose}mg/day - 고용량이나 안전 범위"
                warnings.append("1000mg↑ 시 분할 복용 권장")
            else:
                interp = f"{dose}mg/day - UL 초과 (설사, 위장 불편)"
                warnings.append(f"UL {vit_c['upper_limit']}mg 초과")

            if patient.smoker and dose < 150:
                warnings.append("흡연자 → +50-100mg 권장 (150-200mg/day)")
            if patient.immune_compromised and dose < 200:
                warnings.append("면역저하 → 200-500mg/day 권장")
            if patient.sex == "M" and dose >= vit_c["kidney_stone_risk_threshold_male"]:
                if patient.kidney_stone_history:
                    contraindications.append("신결석 병력 남성: ≥1000mg 금기 (위험 2배↑)")
                else:
                    warnings.append("남성 ≥1000mg: 신결석 위험↑")
            if patient.hemochromatosis:
                contraindications.append("혈색소침착증: VitC가 철분 흡수↑")
            if patient.ferritin is not None and patient.ferritin < 30:
                monitoring.append("철결핍 빈혈: VitC+철분 병용 시 흡수 67%↑")

            results["vitamin_c"] = self._result(
                "Vitamin C Status",
                interp,
                warnings=warnings,
                contraindications=contraindications,
                monitoring_recommendations=monitoring,
            )

        source = "ml+rule" if albumin_result else "rule-based"
        warnings = []
        if not results:
            warnings.append("중재 계획 값이 없어 시뮬레이션 결과가 비어 있습니다.")

        return NutritionSimResponse(source=source, results=results, warnings=warnings)  # type: ignore[arg-type]
