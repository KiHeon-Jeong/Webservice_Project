export type ImmuneRiskLevel = 'critical' | 'high' | 'moderate' | 'low';

export type ImmuneFeaturesPayload = {
  age: number;
  gender: 'M' | 'F' | '남' | '여';
  dementia_yn?: 0 | 1;
  parkinson_yn?: 0 | 1;
  chf_yn?: 0 | 1;
  ckd_yn?: 0 | 1;
  copd_yn?: 0 | 1;
  cancer_yn?: 0 | 1;
  steroid_yn?: 0 | 1;
  immunosup_yn?: 0 | 1;
  antipsychotic_yn?: 0 | 1;
  temp_rr?: number;
  season_rr?: number;
  hum_rr?: number;
  outbreak_rr?: number;
  room_rr?: number;
  epi_rr?: number;
};

export type ImmunePredictRequestPayload = {
  resident_id?: string;
  features: ImmuneFeaturesPayload;
};

export type ImmunePredictResult = {
  resident_id?: string;
  source: 'model' | 'fallback';
  risk_probability: number;
  immunity_score: number;
  divs_score: number;
  risk_level: ImmuneRiskLevel;
  used_features: Record<string, number>;
};

export type NutritionPatientPayload = {
  age: number;
  sex: 'M' | 'F';
  hemoglobin?: number;
  ferritin?: number;
  tsat?: number;
  albumin?: number;
  vitamin_d?: number;
  calcium?: number;
  crp?: number;
  bun?: number;
  creatinine?: number;
  glucose?: number;
  sodium?: number;
  potassium?: number;
  chloride?: number;
  bicarbonate?: number;
  wbc?: number;
  platelet?: number;
  ckd_stage?: number;
  smoker?: boolean;
  immune_compromised?: boolean;
  chronic_inflammation?: boolean;
  kidney_stone_history?: boolean;
  hemochromatosis?: boolean;
  hypercalcemia?: boolean;
  fracture_risk_high?: boolean;
};

export type NutritionInterventionPayload = {
  iron_mg?: number;
  vitamin_d_iu?: number;
  calcium_mg?: number;
  omega3_epa_dha_g?: number;
  vitamin_c_mg?: number;
  protein_g?: number;
  duration_weeks?: number;
};

export type NutritionSimPayload = {
  patient: NutritionPatientPayload;
  intervention: NutritionInterventionPayload;
};

export type NutritionResult = {
  parameter: string;
  current_value: number | null;
  expected_value: number | null;
  expected_change: number | null;
  interpretation: string;
  warnings: string[];
  contraindications: string[];
  monitoring_recommendations: string[];
  model_type: string;
};

export type NutritionSimResponse = {
  source: 'ml+rule' | 'rule-based';
  results: Record<string, NutritionResult>;
  warnings: string[];
};

const REQUEST_TIMEOUT_MS = 4500;

const postJson = async <TResponse>(path: string, body: unknown): Promise<TResponse | null> => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as TResponse;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
};

export const predictImmuneBatch = async (
  items: ImmunePredictRequestPayload[]
): Promise<ImmunePredictResult[]> => {
  if (!items.length) {
    return [];
  }
  const response = await postJson<{ items: ImmunePredictResult[] }>('/api/immune/predict/batch', {
    items,
  });
  if (!response || !Array.isArray(response.items)) {
    return [];
  }
  return response.items;
};

export const simulateNutritionPlan = async (
  payload: NutritionSimPayload
): Promise<NutritionSimResponse | null> => {
  return postJson<NutritionSimResponse>('/api/nutrition/simulate', payload);
};

