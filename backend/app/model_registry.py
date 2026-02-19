from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from threading import Lock
from typing import Any, Dict, Optional

import joblib


@dataclass
class LoadedArtifacts:
    immune_bundle: Optional[Dict[str, Any]] = None
    albumin_bundle: Optional[Dict[str, Any]] = None
    guidelines: Dict[str, Any] = field(default_factory=dict)
    errors: Dict[str, str] = field(default_factory=dict)
    paths: Dict[str, Optional[str]] = field(default_factory=dict)


class ModelRegistry:
    def __init__(self, project_root: Optional[Path] = None) -> None:
        self.project_root = project_root or Path(__file__).resolve().parents[2]
        self._lock = Lock()
        self.artifacts = LoadedArtifacts(guidelines=self.default_guidelines())
        self.reload()

    @staticmethod
    def default_guidelines() -> Dict[str, Any]:
        return {
            "iron": {
                "baseline_hgb_increase": 1.0,
                "ckd_absorption_factor": 0.7,
                "inflammation_factor": 0.7,
            },
            "vitamin_d": {
                "increase_per_1000iu": 7.0,
                "upper_limit_iu": 4000,
            },
            "calcium": {
                "fracture_risk_reduction": 0.15,
            },
            "omega3": {
                "cvd_risk_reduction": 0.08,
            },
            "vitamin_c": {
                "rni": 100,
                "optimal_range": [200, 500],
                "upper_limit": 2000,
                "kidney_stone_risk_threshold_male": 1000,
            },
        }

    def _first_existing(self, *paths: Path) -> Optional[Path]:
        for path in paths:
            if path.exists():
                return path
        return None

    def _load_joblib_bundle(self, path: Path) -> Dict[str, Any]:
        loaded = joblib.load(path)
        if isinstance(loaded, dict):
            return loaded
        return {"model": loaded}

    def reload(self) -> None:
        with self._lock:
            artifacts = LoadedArtifacts(guidelines=self.default_guidelines())
            modeling_dir = self.project_root / "modeling"
            artifacts_dir = modeling_dir / "artifacts"

            immune_path = self._first_existing(
                artifacts_dir / "divs_immune_model_v7.joblib",
                artifacts_dir / "divs_immune_model_v7.pkl",
                modeling_dir / "divs_immune_model_v7.joblib",
                modeling_dir / "divs_immune_model_v7.pkl",
            )
            albumin_path = self._first_existing(
                artifacts_dir / "albumin_predictor_improved.joblib",
                artifacts_dir / "albumin_predictor_improved.pkl",
                modeling_dir / "albumin_predictor_improved.joblib",
                modeling_dir / "albumin_predictor_improved.pkl",
            )
            guideline_path = self._first_existing(
                artifacts_dir / "integrated_guidelines_v3.json",
                modeling_dir / "integrated_guidelines_v3.json",
            )

            artifacts.paths = {
                "immune": str(immune_path) if immune_path else None,
                "albumin": str(albumin_path) if albumin_path else None,
                "guidelines": str(guideline_path) if guideline_path else None,
            }

            if immune_path:
                try:
                    artifacts.immune_bundle = self._load_joblib_bundle(immune_path)
                except Exception as exc:  # pragma: no cover
                    artifacts.errors["immune"] = f"{exc}"
            else:
                artifacts.errors["immune"] = "immune artifact not found"

            if albumin_path:
                try:
                    artifacts.albumin_bundle = self._load_joblib_bundle(albumin_path)
                except Exception as exc:  # pragma: no cover
                    artifacts.errors["albumin"] = f"{exc}"
            else:
                artifacts.errors["albumin"] = "albumin artifact not found"

            if guideline_path:
                try:
                    with guideline_path.open("r", encoding="utf-8") as file:
                        loaded = json.load(file)
                    if isinstance(loaded, dict):
                        artifacts.guidelines.update(loaded)
                    else:
                        artifacts.errors["guidelines"] = "guideline JSON must be an object"
                except Exception as exc:  # pragma: no cover
                    artifacts.errors["guidelines"] = f"{exc}"
            else:
                artifacts.errors["guidelines"] = "guideline file not found; default values loaded"

            self.artifacts = artifacts

    def status(self) -> Dict[str, Any]:
        return {
            "project_root": str(self.project_root),
            "loaded": {
                "immune_model": bool(self.artifacts.immune_bundle),
                "albumin_model": bool(self.artifacts.albumin_bundle),
            },
            "paths": self.artifacts.paths,
            "errors": self.artifacts.errors,
        }

