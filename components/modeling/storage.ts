import type { ImmunePredictResult, NutritionSimResponse } from '../api/modelBackend';

export const IMMUNE_BATCH_STORAGE_KEY = 'modeling:immune-batch-v1';
export const NUTRITION_BATCH_STORAGE_KEY = 'modeling:nutrition-batch-v1';

export type StoredImmuneBatchItem = {
  resident_id: string;
  name?: string;
  room?: string;
  prediction: ImmunePredictResult;
};

export type StoredImmuneBatch = {
  updated_at: string;
  model: 'immune';
  count: number;
  items: StoredImmuneBatchItem[];
};

export type StoredNutritionBatchItem = {
  resident_id: string;
  name?: string;
  prediction: NutritionSimResponse;
};

export type StoredNutritionBatch = {
  updated_at: string;
  model: 'nutrition';
  count: number;
  items: StoredNutritionBatchItem[];
};

export const formatDateTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

