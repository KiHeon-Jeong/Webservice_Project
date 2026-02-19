# Model Backend

FastAPI backend for immune (`divs`) and nutrition (`integrated`) inference.

## Run

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Artifact Paths

The backend searches these paths automatically:

- `modeling/artifacts/divs_immune_model_v7.joblib`
- `modeling/artifacts/albumin_predictor_improved.joblib`
- `modeling/artifacts/integrated_guidelines_v3.json`

Fallback paths under `modeling/` are also supported.

If artifacts are missing or fail to load, the server keeps running and returns fallback predictions so frontend rendering does not break.
