import {
  predictImmuneBatch,
  simulateNutritionPlan,
  type ImmunePredictRequestPayload,
  type NutritionInterventionPayload,
  type NutritionPatientPayload,
  type NutritionSimResponse,
} from '../api/modelBackend';
import {
  IMMUNE_BATCH_STORAGE_KEY,
  NUTRITION_BATCH_STORAGE_KEY,
  type StoredImmuneBatch,
  type StoredNutritionBatch,
} from './storage';

export const IMMUNE_REQUIRED_HEADERS = ['age', 'gender'] as const;
export const NUTRITION_REQUIRED_HEADERS = ['age', 'sex'] as const;

const MAX_BATCH_ROWS = 120;

const splitCsvRow = (line: string) => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  values.push(current.trim());
  return values;
};

type ParsedCsv = {
  headers: string[];
  rows: Array<Record<string, string>>;
};

const parseCsv = (text: string): ParsedCsv => {
  const sanitized = text.replace(/\r/g, '').replace(/^\uFEFF/, '');
  const lines = sanitized
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (!lines.length) {
    return { headers: [], rows: [] };
  }

  const headers = splitCsvRow(lines[0]).map((header) => header.toLowerCase());
  const rows = lines.slice(1, MAX_BATCH_ROWS + 1).map((line) => {
    const values = splitCsvRow(line);
    return headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header] = values[index] ?? '';
      return acc;
    }, {});
  });

  return { headers, rows };
};

const toFloat = (value: string, fallback = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toIntFlag = (value: string, fallback = 0): 0 | 1 => {
  const normalized = value.trim().toLowerCase();
  if (['1', 'y', 'yes', 'true', 't', '예', '네'].includes(normalized)) {
    return 1;
  }
  if (['0', 'n', 'no', 'false', 'f', '아니오', '아니요'].includes(normalized)) {
    return 0;
  }
  return fallback ? 1 : 0;
};

const toBool = (value: string, fallback = false) => toIntFlag(value, fallback ? 1 : 0) === 1;

const toText = (value: string, fallback = '') => (value?.trim() ? value.trim() : fallback);

const resolveResidentId = (row: Record<string, string>, rowIndex: number) =>
  toText(row.resident_id || row.id, `row-${rowIndex + 1}`);

const normalizeImmuneGender = (value: string): 'M' | 'F' | '남' | '여' => {
  const normalized = value.trim().toLowerCase();
  if (['m', 'male', '남', '남자'].includes(normalized)) {
    return 'M';
  }
  if (['f', 'female', '여', '여자'].includes(normalized)) {
    return 'F';
  }
  return 'F';
};

const normalizeSex = (value: string): 'M' | 'F' => {
  const normalized = value.trim().toLowerCase();
  if (['m', 'male', '남', '남자'].includes(normalized)) {
    return 'M';
  }
  return 'F';
};

export type CsvInferenceResult<T> = {
  ok: boolean;
  message: string;
  missingHeaders: string[];
  batch: T | null;
};

const persist = (key: string, payload: unknown) => {
  window.localStorage.setItem(key, JSON.stringify(payload));
};

export const runImmuneCsvInference = async (file: File): Promise<CsvInferenceResult<StoredImmuneBatch>> => {
  const text = await file.text();
  const parsed = parseCsv(text);
  const missingHeaders = IMMUNE_REQUIRED_HEADERS.filter((header) => !parsed.headers.includes(header));

  if (missingHeaders.length) {
    return {
      ok: false,
      message: `필수 컬럼이 없습니다: ${missingHeaders.join(', ')}`,
      missingHeaders: [...missingHeaders],
      batch: null,
    };
  }

  if (!parsed.rows.length) {
    return {
      ok: false,
      message: 'CSV 데이터 행이 없습니다.',
      missingHeaders: [],
      batch: null,
    };
  }

  const payload: ImmunePredictRequestPayload[] = parsed.rows.map((row, index) => ({
    resident_id: resolveResidentId(row, index),
    features: {
      age: toFloat(row.age, 75),
      gender: normalizeImmuneGender(toText(row.gender, 'F')),
      dementia_yn: toIntFlag(row.dementia_yn, 0),
      parkinson_yn: toIntFlag(row.parkinson_yn, 0),
      chf_yn: toIntFlag(row.chf_yn, 0),
      ckd_yn: toIntFlag(row.ckd_yn, 0),
      copd_yn: toIntFlag(row.copd_yn, 0),
      cancer_yn: toIntFlag(row.cancer_yn, 0),
      steroid_yn: toIntFlag(row.steroid_yn, 0),
      immunosup_yn: toIntFlag(row.immunosup_yn, 0),
      antipsychotic_yn: toIntFlag(row.antipsychotic_yn, 0),
      temp_rr: toFloat(row.temp_rr, 1.0),
      season_rr: toFloat(row.season_rr, 1.0),
      hum_rr: toFloat(row.hum_rr, 1.0),
      outbreak_rr: toFloat(row.outbreak_rr, 1.0),
      room_rr: toFloat(row.room_rr, 1.0),
      epi_rr: toFloat(row.epi_rr, 1.0),
    },
  }));

  const predictions = await predictImmuneBatch(payload);
  if (!predictions.length) {
    return {
      ok: false,
      message: '면역 모델 예측 호출에 실패했습니다. 백엔드 상태를 확인해주세요.',
      missingHeaders: [],
      batch: null,
    };
  }

  const items = predictions.map((prediction, index) => ({
    resident_id: prediction.resident_id || resolveResidentId(parsed.rows[index], index),
    name: toText(parsed.rows[index].name),
    room: toText(parsed.rows[index].room),
    prediction,
  }));

  const batch: StoredImmuneBatch = {
    updated_at: new Date().toISOString(),
    model: 'immune',
    count: items.length,
    items,
  };

  persist(IMMUNE_BATCH_STORAGE_KEY, batch);
  return {
    ok: true,
    message: `면역 모델 추론 완료 (${items.length}건)`,
    missingHeaders: [],
    batch,
  };
};

const toNutritionPatient = (row: Record<string, string>): NutritionPatientPayload => ({
  age: Math.max(0, Math.round(toFloat(row.age, 75))),
  sex: normalizeSex(toText(row.sex, 'F')),
  hemoglobin: row.hemoglobin ? toFloat(row.hemoglobin) : undefined,
  ferritin: row.ferritin ? toFloat(row.ferritin) : undefined,
  tsat: row.tsat ? toFloat(row.tsat) : undefined,
  albumin: row.albumin ? toFloat(row.albumin) : undefined,
  vitamin_d: row.vitamin_d ? toFloat(row.vitamin_d) : undefined,
  calcium: row.calcium ? toFloat(row.calcium) : undefined,
  crp: row.crp ? toFloat(row.crp) : undefined,
  bun: row.bun ? toFloat(row.bun) : undefined,
  creatinine: row.creatinine ? toFloat(row.creatinine) : undefined,
  glucose: row.glucose ? toFloat(row.glucose) : undefined,
  sodium: row.sodium ? toFloat(row.sodium) : undefined,
  potassium: row.potassium ? toFloat(row.potassium) : undefined,
  chloride: row.chloride ? toFloat(row.chloride) : undefined,
  bicarbonate: row.bicarbonate ? toFloat(row.bicarbonate) : undefined,
  wbc: row.wbc ? toFloat(row.wbc) : undefined,
  platelet: row.platelet ? toFloat(row.platelet) : undefined,
  ckd_stage: Math.max(0, Math.round(toFloat(row.ckd_stage, 0))),
  smoker: toBool(row.smoker, false),
  immune_compromised: toBool(row.immune_compromised, false),
  chronic_inflammation: toBool(row.chronic_inflammation, false),
  kidney_stone_history: toBool(row.kidney_stone_history, false),
  hemochromatosis: toBool(row.hemochromatosis, false),
  hypercalcemia: toBool(row.hypercalcemia, false),
  fracture_risk_high: toBool(row.fracture_risk_high, false),
});

const toNutritionIntervention = (row: Record<string, string>): NutritionInterventionPayload => ({
  iron_mg: row.iron_mg ? toFloat(row.iron_mg) : undefined,
  vitamin_d_iu: row.vitamin_d_iu ? toFloat(row.vitamin_d_iu) : undefined,
  calcium_mg: row.calcium_mg ? toFloat(row.calcium_mg) : undefined,
  omega3_epa_dha_g: row.omega3_epa_dha_g ? toFloat(row.omega3_epa_dha_g) : undefined,
  vitamin_c_mg: row.vitamin_c_mg ? toFloat(row.vitamin_c_mg) : undefined,
  protein_g: row.protein_g ? toFloat(row.protein_g) : undefined,
  duration_weeks: row.duration_weeks ? Math.max(1, Math.round(toFloat(row.duration_weeks, 4))) : 4,
});

const hasAnyIntervention = (intervention: NutritionInterventionPayload) =>
  Object.entries(intervention).some(([key, value]) => key !== 'duration_weeks' && value !== undefined);

export const runNutritionCsvInference = async (
  file: File
): Promise<CsvInferenceResult<StoredNutritionBatch>> => {
  const text = await file.text();
  const parsed = parseCsv(text);
  const missingHeaders = NUTRITION_REQUIRED_HEADERS.filter((header) => !parsed.headers.includes(header));

  if (missingHeaders.length) {
    return {
      ok: false,
      message: `필수 컬럼이 없습니다: ${missingHeaders.join(', ')}`,
      missingHeaders: [...missingHeaders],
      batch: null,
    };
  }

  if (!parsed.rows.length) {
    return {
      ok: false,
      message: 'CSV 데이터 행이 없습니다.',
      missingHeaders: [],
      batch: null,
    };
  }

  const simulationResults = await Promise.all(
    parsed.rows.map(async (row, index) => {
      const patient = toNutritionPatient(row);
      const intervention = toNutritionIntervention(row);
      if (!hasAnyIntervention(intervention)) {
        return null;
      }
      const prediction = await simulateNutritionPlan({ patient, intervention });
      if (!prediction) {
        return null;
      }
      return {
        resident_id: resolveResidentId(row, index),
        name: toText(row.name),
        prediction,
      };
    })
  );

  const items = simulationResults.filter((item): item is { resident_id: string; name?: string; prediction: NutritionSimResponse } => item !== null);

  if (!items.length) {
    return {
      ok: false,
      message: '영양 모델 예측 결과가 없습니다. 중재 컬럼(iron_mg, vitamin_d_iu 등)을 확인해주세요.',
      missingHeaders: [],
      batch: null,
    };
  }

  const batch: StoredNutritionBatch = {
    updated_at: new Date().toISOString(),
    model: 'nutrition',
    count: items.length,
    items,
  };

  persist(NUTRITION_BATCH_STORAGE_KEY, batch);
  return {
    ok: true,
    message: `영양 모델 추론 완료 (${items.length}건)`,
    missingHeaders: [],
    batch,
  };
};
