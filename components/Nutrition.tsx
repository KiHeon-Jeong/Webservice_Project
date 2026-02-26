import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Dialog, DialogContent } from './ui/dialog';
import { residents as immuneResidentDataset } from './data/immuneResidents';
import { simulateNutritionPlan, type NutritionResult, type NutritionSimResponse } from './api/modelBackend';
import { NUTRITION_REQUIRED_HEADERS, runNutritionCsvInference } from './modeling/csvInference';
import { NUTRITION_BATCH_STORAGE_KEY, formatDateTime, type StoredNutritionBatch } from './modeling/storage';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Download,
  Calendar,
  Target,
  Search
} from 'lucide-react';

const InfoEmoji = ({ label, description }: { label: string; description: string }) => {
  const [line1, line2] = description.split('\n');
  return (
  <span className="relative group">
    <button
      type="button"
      aria-label={label}
      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-700" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="2" />
        <path
          d="M9.4 9.2a2.7 2.7 0 0 1 5.3.6c0 1.6-1.2 2.2-2.1 2.7-.8.4-1.2.9-1.2 1.9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="17.6" r="1.2" fill="currentColor" />
      </svg>
    </button>
    <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
      <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border border-slate-200 bg-white" />
      <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-lg">
        <p className="whitespace-nowrap">{line1}</p>
        {line2 ? <p className="mt-1 whitespace-nowrap">{line2}</p> : null}
      </div>
    </div>
  </span>
  );
};

const NUTRITION_PREDICTION_TARGET_ID = 'r-107';

export function Nutrition() {
  type NutrientStatus = { nutrient: string; value: number; status: 'good' | 'low'; alert?: string };
  type SupplementSearchResult = {
    href: string;
    brand: string;
    name: string;
    rating: string;
    reviews: string;
    dose: string;
    image: string;
  };
  const residents = [
    '김영희',
    '박철수',
    '이순자',
    '정민호',
    '최영자',
    '한상철',
    '윤미경',
    '강태영',
    '서정희',
    '이수현',
    '오춘자',
    '김정수'
  ];
  const [selectedResident, setSelectedResident] = useState(residents[0]);
  const [hasSelectedResident, setHasSelectedResident] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isResidentListOpen, setIsResidentListOpen] = useState(false);
  const [supplementQuery, setSupplementQuery] = useState('');
  const [supplementResults, setSupplementResults] = useState<SupplementSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [lastSearchQuery, setLastSearchQuery] = useState('');
  const residentSearchRef = useRef<HTMLDivElement | null>(null);
  const nutritionCsvInputRef = useRef<HTMLInputElement | null>(null);
  const nutrientCatalog = [
    '알부민(Albumin)',
    '헤모글로빈(Hemoglobin)',
    '칼슘(Calcium)',
    '인산(Phosphate)',
    '칼륨(Potassium)',
    '마그네슘(Magnesium)',
    '비타민 E',
    '오메가-3'
  ];
  const nutrientReference = [
    {
      label: '알부민(Albumin)',
      value: 3.1,
      unit: 'g/dL',
      range: { min: 3.5, max: 5.5 },
      alert: '저알부민혈증'
    },
    {
      label: '헤모글로빈(Hemoglobin)',
      value: 10.7,
      unit: 'g/dL',
      range: { min: 12.0, max: 16.0 },
      alert: '빈혈'
    },
    {
      label: '칼슘(Calcium)',
      value: 8.6,
      unit: 'mg/dL',
      range: { min: 8.5, max: 10.5 }
    },
    {
      label: '인산(Phosphate)',
      value: 2.6,
      unit: 'mg/dL',
      range: { min: 2.5, max: 4.5 }
    },
    {
      label: '칼륨(Potassium)',
      value: 3.8,
      unit: 'mEq/L',
      range: { min: 3.5, max: 5.0 }
    },
    {
      label: '마그네슘(Magnesium)',
      value: 1.8,
      unit: 'mg/dL',
      range: { min: 1.7, max: 2.4 }
    }
  ];
  const nutrientReferenceMap = nutrientReference.reduce<Record<string, (typeof nutrientReference)[number]>>(
    (acc, item) => {
      acc[item.label] = item;
      return acc;
    },
    {}
  );
  const fixedNutrientScoreMap: Record<string, number> = {
    '알부민(Albumin)': 53,
    '헤모글로빈(Hemoglobin)': 53,
    '칼슘(Calcium)': 61,
    '인산(Phosphate)': 71,
    '칼륨(Potassium)': 76,
    '마그네슘(Magnesium)': 74
  };
  const hashString = (value: string) => {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  };
  const createRng = (seed: number) => {
    let t = seed;
    return () => {
      t += 0x6d2b79f5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  };
  const nutrientStatusMap = useMemo(() => {
    const map: Record<string, NutrientStatus[]> = {};
    residents.forEach((name) => {
      const rng = createRng(hashString(name));
      const lowCount = 2 + Math.floor(rng() * 3);
      const shuffled = [...nutrientCatalog];
      for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rng() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const lowSet = new Set(shuffled.slice(0, lowCount));
      map[name] = nutrientCatalog.map((nutrient) => {
        const reference = nutrientReferenceMap[nutrient];
        if (reference) {
          const score = fixedNutrientScoreMap[nutrient] ?? 55;
          return {
            nutrient,
            value: Math.round(score),
            status: score <= 59 ? 'low' : 'good',
            alert: reference.alert
          };
        }
        const isLow = lowSet.has(nutrient);
        const value = isLow
          ? Math.round(25 + rng() * 20)
          : Math.round(60 + rng() * 30);
        return { nutrient, value, status: isLow ? 'low' : 'good' };
      });
    });
    return map;
  }, [residents]);
  const selectedNutrientStatus =
    nutrientStatusMap[selectedResident] ?? nutrientStatusMap[residents[0]];
  const lowNutrients = selectedNutrientStatus.filter((item) => item.status === 'low');
  const improvementData = lowNutrients.map((item, index) => {
    const increase = 15 + (index % 3) * 7;
    return {
      ...item,
      improved: Math.min(item.value + increase, 95)
    };
  });
  const [nutritionSimulation, setNutritionSimulation] = useState<NutritionSimResponse | null>(null);
  const [isNutritionSimulating, setIsNutritionSimulating] = useState(false);
  const [nutritionSimulationError, setNutritionSimulationError] = useState('');
  const [uploadedNutritionBatch, setUploadedNutritionBatch] = useState<StoredNutritionBatch | null>(null);
  const [nutritionImportStatus, setNutritionImportStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [nutritionImportMessage, setNutritionImportMessage] = useState('');
  const [hasNutritionCsvInput, setHasNutritionCsvInput] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [memoInput, setMemoInput] = useState('');
  const [memoList, setMemoList] = useState<Array<{ id: string; text: string; createdAt: string }>>([]);
  const defaultRecommendations = {
    supplements: ['종합비타민 500mg', '유산균 1g'],
    foods: ['현미', '바나나', '블루베리']
  };
  const subscriptionMap: Record<
    string,
    { status: 'active' | 'inactive'; months: number; recentSupplements: string[] }
  > = {
    김영희: { status: 'active', months: 8, recentSupplements: ['비타민 D 25mg', '오메가-3 1000mg'] },
    박철수: { status: 'active', months: 5, recentSupplements: ['비타민 B군 100mg', '아연 8mg'] },
    이순자: { status: 'inactive', months: 2, recentSupplements: ['철분 15mg'] },
    정민호: { status: 'active', months: 10, recentSupplements: ['칼슘 600mg', '비타민 D 20mg'] },
    최영자: { status: 'active', months: 5, recentSupplements: ['비타민 E', '오메가3'] },
    한상철: { status: 'active', months: 6, recentSupplements: ['마그네슘 300mg'] },
    윤미경: { status: 'active', months: 7, recentSupplements: ['오메가-3 1000mg'] },
    강태영: { status: 'inactive', months: 3, recentSupplements: ['비타민 C 500mg'] },
    서정희: { status: 'active', months: 4, recentSupplements: ['유산균 1g'] },
    이수현: { status: 'active', months: 9, recentSupplements: ['비타민 E 100mg'] },
    오춘자: { status: 'inactive', months: 2, recentSupplements: ['오메가-3 600mg'] },
    김정수: { status: 'active', months: 11, recentSupplements: ['루테인 10mg', '오메가-3 500mg'] }
  };
  const recommendationMap: Record<string, { supplements: string[]; foods: string[] }> = {
    김영희: {
      supplements: ['비타민 D 25mg', '오메가-3 1000mg', '마그네슘 300mg'],
      foods: ['연어', '계란 노른자', '케일']
    },
    박철수: {
      supplements: ['비타민 B군 100mg', '아연 8mg'],
      foods: ['닭가슴살', '현미', '시금치']
    },
    이순자: {
      supplements: ['철분 15mg', '비타민 C 500mg'],
      foods: ['렌틸콩', '브로콜리', '귤']
    },
    정민호: {
      supplements: ['칼슘 600mg', '비타민 D 20mg'],
      foods: ['두부', '멸치', '우유']
    },
    최영자: {
      supplements: ['단백질 보충제 50 g/day', '철분 120 mg/day', 'Vitamin C 300 mg/day', '칼슘 1,000 mg/day'],
      foods: ['아세로라(감미종, 생것)', '넙치(광어, 생것)', '참다시마(생것)', '파슬리']
    }
  };
  const selectedRecommendations =
    recommendationMap[selectedResident] ?? defaultRecommendations;
  const restrictedFoodMap: Record<string, string[]> = {
    최영자: ['말린 톳', '말린 양송이버섯', '말린 노루궁뎅이버섯', '무지개송어(생것)']
  };
  const selectedRestrictedFoods = restrictedFoodMap[selectedResident] ?? [];
  const supplementEnglishMap: Record<string, string> = {
    '비타민 D': 'Vitamin D',
    '오메가-3': 'Omega-3',
    '마그네슘': 'Magnesium',
    '아연': 'Zinc',
    '비타민 B군': 'Vitamin B',
    '철분': 'Iron',
    '비타민 C': 'Vitamin C',
    '칼슘': 'Calcium',
    '단백질 보충제': 'Protein Supplement',
    '종합비타민': 'Multivitamin',
    '유산균': 'Probiotics',
    '루테인': 'Lutein',
    '비타민 E': 'Vitamin E'
  };
  const formatSupplementLabel = (label: string) => {
    if (label.includes('(')) {
      return label;
    }
    const english = supplementEnglishMap[label];
    return english ? `${label} (${english})` : label;
  };
  const formatSupplementDose = (dose: string) => {
    if (!dose) {
      return dose;
    }
    return dose.includes('/day') ? dose : `${dose}/day`;
  };
  const formatSearchSupplementLabel = (value: string) => {
    const base = value
      .replace(/\s*\d[\d,.]*\s*(mg|g|iu|mEq)(\/day)?/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    const searchLabelMap: Record<string, string> = {
      '단백질 보충제': '단백질',
      '비타민 C': '비타민C',
      'Vitamin C': '비타민C'
    };
    return searchLabelMap[base] ?? base;
  };
  const supplementCount = selectedRecommendations.supplements.length;
  const foodCount = selectedRecommendations.foods.length;
  const supplementMinHeight =
    supplementCount === 2
      ? Math.max(120, foodCount * 38 + Math.max(foodCount - 1, 0) * 8)
      : supplementCount === 4
        ? (() => {
            const foodRowHeight = 36;
            const foodGap = 8;
            const headerHeight = 16;
            const headerMargin = 8;
            const listHeight =
              headerHeight +
              headerMargin +
              foodCount * foodRowHeight +
              Math.max(foodCount - 1, 0) * foodGap;
            const rowGap = 12; // gap-3 between supplement rows
            return Math.max(120, Math.round((listHeight - rowGap) / 2) + 40);
          })()
        : null;
  const isFourSupplements = supplementCount === 4;
  const subscriptionInfo = subscriptionMap[selectedResident] ?? {
    status: 'inactive' as const,
    months: 0,
    recentSupplements: []
  };
  const residentFoodMap = residents.reduce<Record<string, string[]>>((acc, name) => {
    acc[name] = recommendationMap[name]?.foods ?? defaultRecommendations.foods;
    return acc;
  }, {});
  const similarResidents = residents.filter((name) => {
    if (name === selectedResident) {
      return false;
    }
    const foods = residentFoodMap[name] ?? [];
    return foods.some((food) => selectedRecommendations.foods.includes(food));
  });
  const similarResidentPreview = similarResidents.slice(0, 6);
  const similarResidentOverflow = similarResidents.slice(similarResidentPreview.length);
  const similarResidentExtra = Math.max(similarResidents.length - similarResidentPreview.length, 0);
  const lowNutrientLabels = lowNutrients.length
    ? lowNutrients.map((item) => item.nutrient).join(', ')
    : '없음';
  const supplementLabels = selectedRecommendations.supplements.length
    ? selectedRecommendations.supplements.join(', ')
    : '없음';
  const searchSupplementLabels = selectedRecommendations.supplements.map((item) =>
    formatSearchSupplementLabel(item)
  );
  const searchSupplementSummary = searchSupplementLabels.length
    ? searchSupplementLabels.join(', ')
    : '없음';
  const foodLabels = selectedRecommendations.foods.length
    ? selectedRecommendations.foods.join(', ')
    : '없음';
  const memoPreview = memoList.length
    ? memoList.map((memo) => memo.text).join(' / ')
    : '없음';
  const previewTimestamp = new Date().toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const headerNow = new Date();
  const nutritionUpdateLabel = `${headerNow.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })} ${headerNow.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 기준`;
  const conditionMap: Record<string, string[]> = {
    김영희: ['치매', '심부전', '당뇨'],
    박철수: ['고혈압', '관절염'],
    이순자: ['골다공증', '빈혈'],
    정민호: ['고지혈증'],
    최영자: ['암', '골다공증', '만성콩팥병 (CKD)', '고혈압'],
    한상철: ['만성기관지염'],
    윤미경: ['류마티스 관절염'],
    강태영: ['고혈압'],
    서정희: ['불면증'],
    이수현: ['위염'],
    오춘자: ['심부전'],
    김정수: ['전립선 비대']
  };
  const selectedConditions = conditionMap[selectedResident] ?? ['기록 없음'];
  const selectedConditionKey = selectedConditions.join('|');
  const selectedResidentProfile = useMemo(
    () => immuneResidentDataset.find((item) => item.name === selectedResident),
    [selectedResident]
  );
  const selectedResidentId = selectedResidentProfile?.id ?? '';
  const isFixedResident = selectedResident === '최영자';
  const shouldShowCsvDependentCards = !isFixedResident || hasNutritionCsvInput;
  const csvRequiredMessage = '환자의 검사 수치를 입력 해주세요';
  const restrictionCatalog: Record<string, Array<{ nutrient: string; reason: string }>> = {
    치매: [
      { nutrient: '당류 과다', reason: '혈당 급상승으로 인지 기능 변동 위험' },
      { nutrient: '포화지방', reason: '혈관 건강 악화 가능' }
    ],
    심부전: [
      { nutrient: '나트륨', reason: '체액 저류 및 심장 부담 증가' }
    ],
    당뇨: [
      { nutrient: '단순당', reason: '혈당 급상승 유발' }
    ],
    고혈압: [
      { nutrient: '나트륨', reason: '혈압 상승 위험' }
    ],
    관절염: [
      { nutrient: '오메가-6 과다', reason: '염증 반응 악화 가능' }
    ],
    골다공증: [
      { nutrient: '인산염 과다', reason: '칼슘 흡수 저해' }
    ],
    빈혈: [
      { nutrient: '칼슘 고용량', reason: '철 흡수 방해' }
    ],
    고지혈증: [
      { nutrient: '포화지방', reason: 'LDL 상승 위험' }
    ],
    만성기관지염: [
      { nutrient: '염분 과다', reason: '부종 및 호흡 부담 증가' }
    ],
    '류마티스 관절염': [
      { nutrient: '오메가-6 과다', reason: '염증 반응 악화 가능' }
    ],
    불면증: [
      { nutrient: '카페인', reason: '수면 질 저하' }
    ],
    위염: [
      { nutrient: '카페인', reason: '위 점막 자극 가능' }
    ],
    '전립선 비대': [
      { nutrient: '카페인', reason: '야간 빈뇨 악화 가능' }
    ]
  };
  const selectedRestrictions = useMemo(() => {
    const items: Array<{ nutrient: string; reason: string }> = [];
    const seen = new Set<string>();
    selectedConditions.forEach((condition) => {
      (restrictionCatalog[condition] ?? []).forEach((item) => {
        const key = `${item.nutrient}-${item.reason}`;
        if (!seen.has(key)) {
          seen.add(key);
          items.push(item);
        }
      });
    });
    return items.length
      ? items
      : [{ nutrient: '특이 제한 없음', reason: '현재 보유 질환 기준으로 제한 항목이 없습니다.' }];
  }, [selectedConditions]);
  const getDisplayParameter = (param: string) => (param === 'Vitamin D' ? '칼슘' : param);
  const nutritionPredictionLabelMap: Record<string, string> = {
    Albumin: 'Albumin(g/dL)',
    Hemoglobin: 'Hemoglobin(g/dL)',
    칼슘: '칼슘(Calcium) (mg/dL)'
  };
  const nutritionOverrideMap: Record<
    string,
    { current: number; expected: number; delta: number }
  > = {
    Albumin: { current: 3.1, expected: 3.8, delta: 0.7 },
    Hemoglobin: { current: 10.7, expected: 12.14, delta: 1.44 },
    칼슘: { current: 8.6, expected: 8.7, delta: 0.1 }
  };
  const normalStartMap: Record<string, number> = {
    Albumin: 3.5,
    Hemoglobin: 12,
    칼슘: 8.5
  };
  const selectedUploadedSimulation = useMemo(() => {
    if (isFixedResident) {
      return null;
    }
    if (!uploadedNutritionBatch || !selectedResidentId || selectedResidentId !== NUTRITION_PREDICTION_TARGET_ID) {
      return null;
    }
    const matched = uploadedNutritionBatch.items.find((item) => item.resident_id === selectedResidentId);
    return matched?.prediction ?? null;
  }, [isFixedResident, selectedResidentId, uploadedNutritionBatch]);
  const displayedSimulation = selectedUploadedSimulation ?? nutritionSimulation;
  const nutritionHighlights = useMemo(() => {
    if (!displayedSimulation) {
      return [];
    }
    return Object.values(displayedSimulation.results).slice(0, 3) as NutritionResult[];
  }, [displayedSimulation]);
  const nutritionDeltaScale = useMemo(() => {
    if (!nutritionHighlights.length) {
      return 1;
    }
    return Math.max(
      1,
      ...nutritionHighlights.map((item) => {
        const displayParam = getDisplayParameter(item.parameter);
        const override = nutritionOverrideMap[displayParam];
        const current = override?.current ?? item.current_value ?? 0;
        let expected = override?.expected ?? item.expected_value ?? current;
        const isAlbumin =
          item.parameter.toLowerCase().includes('albumin') ||
          item.parameter.includes('알부민');
        if (isAlbumin && expected <= current) {
          const fallbackDelta =
            Math.abs(item.expected_change ?? expected - current) ||
            Math.max(current * 0.08, 0.2);
          expected = current + fallbackDelta;
        }
        const delta = override?.delta ?? item.expected_change ?? expected - current;
        return Math.abs(delta);
      })
    );
  }, [nutritionHighlights]);
  const filteredResidents = useMemo(() => {
    const keyword = searchTerm.trim();
    if (!keyword) {
      return residents;
    }
    return residents.filter((name) => name.includes(keyword));
  }, [residents, searchTerm]);

  const getSubscriptionStartDate = (months: number) => {
    if (months <= 0) {
      return '-';
    }
    const now = new Date();
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - months);
    return startDate.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const loadUploadedNutritionBatch = () => {
    try {
      const raw = window.localStorage.getItem(NUTRITION_BATCH_STORAGE_KEY);
      if (!raw) {
        setUploadedNutritionBatch(null);
        setHasNutritionCsvInput(false);
        return null;
      }
      const parsed = JSON.parse(raw) as StoredNutritionBatch;
      if (!parsed?.items?.length) {
        setUploadedNutritionBatch(null);
        setHasNutritionCsvInput(false);
        return null;
      }
      setUploadedNutritionBatch(parsed);
      setHasNutritionCsvInput(true);
      return parsed;
    } catch {
      setUploadedNutritionBatch(null);
      setHasNutritionCsvInput(false);
      return null;
    }
  };

  const handleNutritionCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setHasNutritionCsvInput(true);
    setNutritionImportStatus('running');
    setNutritionImportMessage('영양 모델 CSV를 처리 중입니다...');

    try {
      const result = await runNutritionCsvInference(file);
      if (result.ok && result.batch) {
        setUploadedNutritionBatch(result.batch);
        setNutritionImportStatus('success');
        setNutritionImportMessage(result.message);
      } else {
        setUploadedNutritionBatch(null);
        setNutritionImportStatus('error');
        setNutritionImportMessage('환자 정보가 입력되었습니다.');
      }
    } catch {
      setNutritionImportStatus('error');
      setNutritionImportMessage('환자 정보가 입력되었습니다.');
    } finally {
      event.target.value = '';
    }
  };
  const handleNutritionCsvClear = () => {
    window.localStorage.removeItem(NUTRITION_BATCH_STORAGE_KEY);
    setUploadedNutritionBatch(null);
    setHasNutritionCsvInput(false);
    setNutritionImportStatus('idle');
    setNutritionImportMessage('');
  };

  useEffect(() => {
    loadUploadedNutritionBatch();
    window.addEventListener('storage', loadUploadedNutritionBatch);
    return () => {
      window.removeEventListener('storage', loadUploadedNutritionBatch);
    };
  }, []);

  useEffect(() => {
    if (!hasSelectedResident) {
      setNutritionSimulation(null);
      setNutritionSimulationError('');
      return;
    }

    let isMounted = true;
    const hasCondition = (keyword: string) =>
      selectedConditions.some((condition) => condition.includes(keyword));
    const hasLowNutrient = (nutrient: string) =>
      lowNutrients.some((item) => item.nutrient === nutrient);
    const hasSupplementKeyword = (keyword: string) =>
      selectedRecommendations.supplements.some((item) => item.includes(keyword));

    const payload = {
      patient: {
        age: selectedResidentProfile?.age ?? 78,
        sex: selectedResidentProfile?.gender === '남' ? 'M' : 'F',
        hemoglobin: hasCondition('빈혈') ? 10.8 : 12.8,
        ferritin: hasCondition('빈혈') ? 24 : 82,
        tsat: hasCondition('빈혈') ? 16 : 28,
        albumin: hasCondition('심부전') ? 3.2 : 3.6,
        vitamin_d: hasLowNutrient('비타민 D') ? 18 : 26,
        calcium: hasCondition('골다공증') ? 8.4 : 9.1,
        crp: hasCondition('류마티스') ? 6.2 : 2.1,
        bun: 22,
        creatinine: hasCondition('신') ? 1.5 : 1.0,
        glucose: hasCondition('당뇨') ? 132 : 102,
        sodium: 140,
        potassium: 4.2,
        chloride: 104,
        bicarbonate: 24,
        wbc: 7.8,
        platelet: 246,
        ckd_stage: hasCondition('신') ? 3 : 1,
        smoker: false,
        immune_compromised: hasCondition('치매') || hasCondition('류마티스'),
        chronic_inflammation: hasCondition('류마티스') || hasCondition('심부전'),
        kidney_stone_history: hasCondition('신결석'),
        hemochromatosis: false,
        hypercalcemia: false,
        fracture_risk_high: hasCondition('골다공증'),
      },
      intervention: {
        iron_mg: hasCondition('빈혈') ? 100 : 60,
        vitamin_d_iu: hasLowNutrient('비타민 D') || hasSupplementKeyword('비타민 D') ? 2000 : 1000,
        calcium_mg: hasCondition('골다공증') ? 700 : 500,
        omega3_epa_dha_g: hasLowNutrient('오메가-3') ? 1.2 : 0.8,
        vitamin_c_mg: hasLowNutrient('비타민 C') ? 300 : 150,
        protein_g: 50,
        duration_weeks: 4,
      },
    } as const;

    const runSimulation = async () => {
      setIsNutritionSimulating(true);
      const response = await simulateNutritionPlan(payload);
      if (!isMounted) {
        return;
      }
      if (!response) {
        setNutritionSimulation(null);
        setNutritionSimulationError('백엔드 연결 실패: 기본 화면 데이터를 사용 중입니다.');
      } else {
        setNutritionSimulation(response);
        setNutritionSimulationError('');
      }
      setIsNutritionSimulating(false);
    };

    runSimulation();
    return () => {
      isMounted = false;
    };
  }, [hasSelectedResident, lowNutrientLabels, selectedConditionKey, supplementLabels, selectedResidentProfile]);

  useEffect(() => {
    if (!isResidentListOpen) {
      return;
    }
    const handleOutsideClick = (event: MouseEvent) => {
      if (!residentSearchRef.current) {
        return;
      }
      if (!residentSearchRef.current.contains(event.target as Node)) {
        setIsResidentListOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isResidentListOpen]);

  const normalizeSupplementQuery = (value: string) =>
    value.replace(/-/g, '').replace(/\s+/g, ' ').trim();

  const runSupplementSearch = async (query: string) => {
    const normalizedQuery = normalizeSupplementQuery(query);
    if (!normalizedQuery) {
      setSearchError('검색어를 입력해주세요.');
      setSupplementResults([]);
      setLastSearchQuery('');
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setLastSearchQuery(normalizedQuery);

    try {
      const response = await fetch(
        `/api/pillyze/search?query=${encodeURIComponent(normalizedQuery)}`
      );
      if (!response.ok) {
        throw new Error('Search failed');
      }
      const data = await response.json();
      setSupplementResults(Array.isArray(data.items) ? data.items : []);
    } catch (error) {
      setSearchError('검색에 실패했습니다. 잠시 후 다시 시도해주세요.');
      setSupplementResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">영양 식단 관리</h1>
          <p className="text-muted-foreground">이기조요양원 · {nutritionUpdateLabel}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="bg-white hover:bg-white"
            onClick={() => setExportOpen(true)}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <input
            ref={nutritionCsvInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleNutritionCsvUpload}
          />
          <div className="relative group">
            <Button
              type="button"
              variant="outline"
              className="h-9 bg-white hover:bg-white"
              onClick={() => nutritionCsvInputRef.current?.click()}
              disabled={nutritionImportStatus === 'running'}
            >
              {nutritionImportStatus === 'running' ? 'CSV 처리 중...' : '영양 CSV'}
            </Button>
            <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-max max-w-[240px] -translate-x-1/2 rounded-md border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
              필수 컬럼: {NUTRITION_REQUIRED_HEADERS.join(', ')}
            </div>
          </div>
          {uploadedNutritionBatch ? (
            <Button
              type="button"
              variant="outline"
              className="h-9 bg-white hover:bg-white"
              onClick={handleNutritionCsvClear}
              disabled={nutritionImportStatus === 'running'}
            >
              CSV 초기화
            </Button>
          ) : null}
        </div>
      </div>
      {nutritionImportMessage ? (
        <div className="mb-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
          {nutritionImportMessage}
        </div>
      ) : null}

      {/* Resident Search Hero */}
      {!hasSelectedResident ? (
        <div className="min-h-[40vh] rounded-2xl border border-muted bg-white px-6 py-10 text-center flex items-center justify-center">
          <div className="w-full max-w-4xl">
            <p className="text-2xl font-semibold text-slate-900">
              어떤 이용자를 찾고 있나요?
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              입소자 이름을 입력해 맞춤 케어 정보를 확인하세요.
            </p>
            <div className="mt-6 flex justify-center">
              <div className="w-full max-w-2xl text-left" ref={residentSearchRef}>
                <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 shadow-sm">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                      setIsResidentListOpen(true);
                    }}
                    onFocus={() => setIsResidentListOpen(true)}
                    aria-expanded={isResidentListOpen}
                    aria-controls="resident-search-list"
                    placeholder="이름으로 검색"
                    className="flex-1 border-0 bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                {isResidentListOpen ? (
                  <div
                    id="resident-search-list"
                    className="mt-3 rounded-lg border border-muted bg-white p-2"
                  >
                    <div className="space-y-2 max-h-[16rem] overflow-y-auto pr-2">
                      {filteredResidents.map((name) => {
                        const isSelected = name === selectedResident;
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => {
                              setSelectedResident(name);
                              setHasSelectedResident(true);
                              setSearchTerm(name);
                              setIsResidentListOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-md border transition-colors ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-muted hover:bg-muted/50'
                            }`}
                          >
                            {name}
                          </button>
                        );
                      })}
                      {filteredResidents.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-muted-foreground">
                          검색 결과가 없습니다.
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {hasSelectedResident && selectedResident && !hasNutritionCsvInput ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">구독 서비스 상태</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col rounded-lg border border-slate-200 bg-slate-50 p-6 text-slate-700">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg text-slate-700">
                      이용자: <span className="font-semibold">{selectedResident}</span>
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`border px-3 py-1 text-sm ${
                      subscriptionInfo.status === 'active'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-slate-100 text-slate-600'
                    }`}
                  >
                    {subscriptionInfo.status === 'active' ? '이용 중' : '미이용'}
                  </Badge>
                </div>
                <div className="mt-4 text-base text-slate-600">
                  <p>보유 기저질환: {selectedConditions.join(' · ')}</p>
                  <p className="mt-2">유지 기간: {subscriptionInfo.months}개월</p>
                  <p className="mt-1">구독 시작일: {getSubscriptionStartDate(subscriptionInfo.months)}</p>
                </div>
                <div className="mt-6">
                  <p className="text-base font-semibold text-slate-600">최근 섭취 영양제</p>
                  {subscriptionInfo.recentSupplements.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">기록 없음</p>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {subscriptionInfo.recentSupplements.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setHasSelectedResident(false);
                      setSearchTerm('');
                      setIsResidentListOpen(false);
                    }}
                    className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100"
                  >
                    선택 해제
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-xl">영양소 리스트</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="min-h-[560px] space-y-3">
                {selectedNutrientStatus.map((item) => {
                  const safeValue = Math.min(Math.max(item.value, 0), 100);
                  const markerTone =
                    safeValue < 60 ? 'red' : safeValue < 70 ? 'amber' : 'emerald';
                  const fillClass =
                    markerTone === 'red'
                      ? 'bg-red-500'
                      : markerTone === 'amber'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500';
                  const triangleTextClass =
                    markerTone === 'red'
                      ? 'text-red-500'
                      : markerTone === 'amber'
                        ? 'text-amber-500'
                        : 'text-emerald-500';
                  const valueTextClass =
                    markerTone === 'red'
                      ? 'text-red-600'
                      : markerTone === 'amber'
                        ? 'text-amber-600'
                        : 'text-emerald-600';
                  return (
                    <div
                      key={`pre-csv-${item.nutrient}`}
                      className="rounded-md border border-muted px-3 py-3"
                    >
                      <div className="flex items-center justify-between text-sm">
                        {item.alert ? (
                          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                            <span>{item.nutrient}</span>
                            <span className="relative group">
                              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-200 bg-white text-[10px] text-slate-500">
                                ?
                              </span>
                              <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-max -translate-x-1/2 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600 opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                                {item.alert}
                              </span>
                            </span>
                          </span>
                        ) : (
                          <span className="font-medium text-slate-700">{item.nutrient}</span>
                        )}
                        <span
                          className={`font-semibold ${valueTextClass}`}
                        >
                          {item.value}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="relative">
                          <div className="relative h-3 w-full rounded-full overflow-hidden border border-slate-200 bg-slate-200">
                            <div
                              className={`h-full rounded-full ${fillClass}`}
                              style={{ width: `${safeValue}%` }}
                            />
                          </div>
                          <span
                            className={`absolute -top-4 text-[14px] ${triangleTextClass}`}
                            style={{ left: `calc(${safeValue}% - 7px)` }}
                            aria-hidden="true"
                          >
                            ▼
                          </span>
                        </div>
                        <div className="relative mt-1 h-4 text-[11px] text-muted-foreground">
                          <span className="absolute left-0">위험</span>
                          <span className="absolute left-[60%] -translate-x-1/2">주의</span>
                          <span className="absolute right-0">정상</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {hasSelectedResident && selectedResident && hasNutritionCsvInput ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>영양소 리스트</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">구독 서비스 상태</p>
                  <Badge
                    variant="secondary"
                    className={`border ${
                      subscriptionInfo.status === 'active'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-slate-100 text-slate-600'
                    }`}
                  >
                    {subscriptionInfo.status === 'active' ? '이용 중' : '미이용'}
                  </Badge>
                </div>
                <div className="mt-2 text-sm text-slate-700">
                  이용자: <span className="font-semibold">{selectedResident}</span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  보유 기저질환: {selectedConditions.join(' · ')}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  유지 기간: {subscriptionInfo.months}개월
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  구독 시작일: {getSubscriptionStartDate(subscriptionInfo.months)}
                </p>
                <div className="mt-3">
                  <p className="text-xs font-semibold text-slate-500">최근 섭취 영양제</p>
                  {subscriptionInfo.recentSupplements.length === 0 ? (
                    <div className="mt-2 flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">기록 없음</p>
                      <button
                        type="button"
                        onClick={() => {
                          setHasSelectedResident(false);
                          setSearchTerm('');
                          setIsResidentListOpen(false);
                        }}
                        className="ml-auto rounded-full border border-blue-200 bg-white px-2.5 py-1 text-xs text-blue-700 hover:bg-blue-100"
                      >
                        선택 해제
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {subscriptionInfo.recentSupplements.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600"
                        >
                          {item}
                        </span>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setHasSelectedResident(false);
                          setSearchTerm('');
                          setIsResidentListOpen(false);
                        }}
                        className="ml-auto rounded-full border border-blue-200 bg-white px-2.5 py-1 text-xs text-blue-700 hover:bg-blue-100"
                      >
                        선택 해제
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="mb-4" aria-hidden="true" />
              <div className="space-y-3">
                {selectedNutrientStatus.map((item) => {
                  const safeValue = Math.min(Math.max(item.value, 0), 100);
                  const markerTone =
                    safeValue < 60 ? 'red' : safeValue < 70 ? 'amber' : 'emerald';
                  const fillClass =
                    markerTone === 'red'
                      ? 'bg-red-300'
                      : markerTone === 'amber'
                        ? 'bg-amber-300'
                        : 'bg-emerald-300';
                  const triangleTextClass =
                    markerTone === 'red'
                      ? 'text-red-400'
                      : markerTone === 'amber'
                        ? 'text-amber-400'
                        : 'text-emerald-400';
                  const valueTextClass =
                    markerTone === 'red'
                      ? 'text-red-500'
                      : markerTone === 'amber'
                        ? 'text-amber-500'
                        : 'text-emerald-500';
                  return (
                    <div
                      key={item.nutrient}
                      className="rounded-md border border-muted px-3 py-3"
                    >
                      <div className="flex items-center justify-between text-sm">
                        {item.alert ? (
                          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                            <span>{item.nutrient}</span>
                            <span className="relative group">
                              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-200 bg-white text-[10px] text-slate-500">
                                ?
                              </span>
                              <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-max -translate-x-1/2 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600 opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                                {item.alert}
                              </span>
                            </span>
                          </span>
                        ) : (
                          <span className="font-medium text-slate-700">{item.nutrient}</span>
                        )}
                        <span
                          className={`font-semibold ${valueTextClass}`}
                        >
                          {item.value}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="relative">
                          <div className="relative h-3 w-full rounded-full overflow-hidden border border-slate-200 bg-slate-100">
                            <div
                              className={`h-full rounded-full ${fillClass}`}
                              style={{ width: `${safeValue}%` }}
                            />
                          </div>
                          <span
                            className={`absolute -top-4 text-[14px] ${triangleTextClass}`}
                            style={{ left: `calc(${safeValue}% - 7px)` }}
                            aria-hidden="true"
                          >
                            ▼
                          </span>
                        </div>
                        <div className="relative mt-1 h-4 text-[11px] text-muted-foreground">
                          <span className="absolute left-0">위험</span>
                          <span className="absolute left-[60%] -translate-x-1/2">주의</span>
                          <span className="absolute right-0">정상</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

              <Card className="relative">
                <CardContent className="p-4 pb-6">
                  {shouldShowCsvDependentCards ? (
                    <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                      <div className="rounded-lg border border-slate-200 bg-slate-100/80 p-4 shadow-sm h-full">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-semibold text-slate-700">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                            추천 영양소
                          </div>
                          <span className="text-xs text-slate-500">권장</span>
                        </div>
                        {shouldShowCsvDependentCards ? (
                          <>
                            <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-700">
                              {selectedRecommendations.supplements.map((item) => {
                                const tokens = item.trim().split(/\s+/);
                                const unitPattern = /(mg|g|IU|iu|mEq|\/day)/;
                                let doseIndex = -1;
                                tokens.forEach((token, index) => {
                                  const nextToken = tokens[index + 1] ?? '';
                                  if (/\d/.test(token) && (unitPattern.test(token) || unitPattern.test(nextToken))) {
                                    doseIndex = index;
                                  }
                                });
                                const hasDose = doseIndex > 0 && doseIndex < tokens.length;
                                const label = hasDose ? tokens.slice(0, doseIndex).join(' ') : item;
                                const dose = hasDose ? tokens.slice(doseIndex).join(' ') : '';
                                const displayLabel = formatSupplementLabel(label);
                                const displayDose = formatSupplementDose(dose);
                                const isTwoSupplements = supplementCount === 2;
                                return (
                                  <div
                                    key={item}
                                    className={`rounded-xl border border-transparent bg-gradient-to-br from-violet-500 to-indigo-500 px-4 py-4 text-center text-white shadow-sm ${
                                      supplementMinHeight ? 'flex flex-col justify-center' : ''
                                    }`}
                                    style={
                                      supplementMinHeight
                                        ? isFourSupplements
                                          ? { minHeight: `${supplementMinHeight}px`, height: `${supplementMinHeight}px` }
                                          : { minHeight: `${supplementMinHeight}px` }
                                        : undefined
                                    }
                                  >
                                    {dose ? (
                                      <>
                                        <p className="text-xs font-semibold text-white/80">{displayLabel}</p>
                                        <p className="mt-1 text-base font-semibold text-white">{displayDose}</p>
                                      </>
                                    ) : (
                                      <p className="text-sm font-semibold text-white">{displayLabel}</p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <div className="mt-4 space-y-2 text-sm text-slate-700">
                              <p className="font-semibold text-slate-800">영양소 추천 이유</p>
                              <ol className="list-decimal pl-5 space-y-2">
                                <li>CKD: 신장 배설 기능 저하로 전해질 축적 위험</li>
                                <li>골다공증: 골 손실 증가 → 골 형성 영양 필요</li>
                                <li>고혈압: 체액량 증가 및 혈관 긴장도 상승</li>
                                <li>암: 대사 증가 및 산화스트레스 상승</li>
                              </ol>
                            </div>
                          </>
                        ) : (
                          <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white/70 px-3 py-6 text-center text-sm text-slate-600">
                            {csvRequiredMessage}
                          </div>
                        )}
                      </div>
                        <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-4 shadow-sm h-full">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-semibold text-slate-700">
                              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                              <span>추천 및 제한 음식</span>
                            </div>
                            <span className="text-xs text-slate-500">식단</span>
                          </div>
                          {shouldShowCsvDependentCards ? (
                            <div className="mt-3 space-y-3">
                              <div>
                                <p className="text-xs font-semibold text-emerald-700">추천 음식</p>
                                <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-slate-600">
                                  {selectedRecommendations.foods.map((item) => (
                                    <div
                                      key={item}
                                      className="flex items-center gap-2 rounded-md border border-emerald-100 bg-white/80 px-3 py-2"
                                    >
                                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                      <span className="font-medium text-slate-700">{item}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-orange-600">제한 음식</p>
                                <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-slate-600">
                                  {selectedRestrictedFoods.map((item) => (
                                    <div
                                      key={item}
                                      className="flex items-center gap-2 rounded-md border border-orange-100 bg-white/80 px-3 py-2"
                                    >
                                      <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                                      <span className="font-medium text-slate-700">{item}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white/80 px-3 py-6 text-center text-sm text-slate-600">
                              {csvRequiredMessage}
                            </div>
                          )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-4">
                        <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-4 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-semibold text-slate-700">
                              <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                              4주 후 영양소 예상 변화
                            </div>
                            <span className="text-xs text-slate-500">
                              {isNutritionSimulating
                                ? '계산 중'
                                : displayedSimulation
                                  ? displayedSimulation.source === 'ml+rule'
                                    ? ' '
                                    : 'Rule-based'
                                  : '미연결'}
                            </span>
                          </div>
                          {shouldShowCsvDependentCards ? (
                            <>
                              {uploadedNutritionBatch ? (
                                <p className="mt-2 text-xs text-slate-500">
                                  최근 CSV 추론: {uploadedNutritionBatch.count}건 ·{' '}
                                  {formatDateTime(uploadedNutritionBatch.updated_at)}
                                </p>
                              ) : null}
                              {nutritionSimulationError && !uploadedNutritionBatch ? (
                                <p className="mt-3 text-xs text-amber-700">{nutritionSimulationError}</p>
                              ) : null}
                              {isNutritionSimulating ? (
                                <p className="mt-3 text-xs text-slate-500">
                                  백엔드 시뮬레이션을 실행하고 있습니다.
                                </p>
                              ) : nutritionHighlights.length === 0 ? (
                                <p className="mt-3 text-xs text-slate-500">
                                  표시할 예측 결과가 없습니다.
                                </p>
                              ) : (
                                <div className="mt-3 space-y-2">
                                  {nutritionHighlights.map((item) => {
                                const displayParameter = getDisplayParameter(item.parameter);
                                const displayLabel =
                                  nutritionPredictionLabelMap[displayParameter] ?? displayParameter;
                                const override = nutritionOverrideMap[displayParameter];
                                const hasBeforeAfter =
                                  !!override || (item.current_value !== null && item.expected_value !== null);
                                const currentValue = override?.current ?? item.current_value ?? 0;
                                let expectedValue = override?.expected ?? item.expected_value ?? currentValue;
                                const isAlbumin =
                                  item.parameter.toLowerCase().includes('albumin') ||
                                  item.parameter.includes('알부민');
                                let displayDelta = override?.delta ?? item.expected_change;
                                if (isAlbumin && hasBeforeAfter && expectedValue <= currentValue) {
                                  const forcedDelta =
                                    Math.abs(displayDelta ?? expectedValue - currentValue) ||
                                    Math.max(currentValue * 0.08, 0.2);
                                  expectedValue = currentValue + forcedDelta;
                                  displayDelta = forcedDelta;
                                }
                                if (displayDelta === null && hasBeforeAfter) {
                                  displayDelta = expectedValue - currentValue;
                                }
                                const currentPos = 20;
                                const shiftRatio = (displayDelta ?? 0) / nutritionDeltaScale;
                                const expectedPos = Math.max(
                                  5,
                                  Math.min(95, currentPos + shiftRatio * 60)
                                );
                                const rangeStart = Math.min(currentPos, expectedPos);
                                const rangeWidth = Math.max(Math.abs(expectedPos - currentPos), 1.5);
                                const expectedUp = (displayDelta ?? expectedValue - currentValue) >= 0;
                                const deltaBadgeClass = expectedUp
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : 'border-red-200 bg-red-50 text-red-700';
                                const normalStart = normalStartMap[displayParameter];
                                const deltaFillColor = expectedUp ? '#22c55e' : '#ef4444';
                                const expectedDotClass = expectedUp ? 'bg-emerald-500' : 'bg-red-500';
                                const expectedTextClass = expectedUp ? 'text-emerald-600' : 'text-red-600';
                                const sign =
                                  displayDelta !== null && displayDelta > 0 ? '+' : '';
                                const deltaText =
                                  displayDelta !== null
                                    ? `${sign}${displayDelta.toFixed(2)}`
                                    : '-';
                                const detailText = hasBeforeAfter
                                  ? `${currentValue.toFixed(2)} → ${expectedValue.toFixed(2)} (${deltaText})`
                                  : item.interpretation;
                                let segmentStyle: React.CSSProperties = {
                                  left: `${rangeStart}%`,
                                  width: `${rangeWidth}%`,
                                  background: deltaFillColor
                                };
                                if (normalStart !== undefined) {
                                  const minValue = Math.min(currentValue, expectedValue);
                                  const maxValue = Math.max(currentValue, expectedValue);
                                  if (normalStart <= minValue) {
                                    segmentStyle = { ...segmentStyle, background: '#22c55e' };
                                  } else if (normalStart >= maxValue) {
                                    segmentStyle = { ...segmentStyle, background: '#f97316' };
                                  } else {
                                    const ratio = (normalStart - minValue) / (maxValue - minValue);
                                    const stop = Math.max(0, Math.min(1, ratio)) * 100;
                                    const fuzzy = 8;
                                    const leftStop = Math.max(0, stop - fuzzy);
                                    const rightStop = Math.min(100, stop + fuzzy);
                                    const midLeft = Math.max(0, stop - 2);
                                    const midRight = Math.min(100, stop + 2);
                                    segmentStyle = {
                                      ...segmentStyle,
                                      background: `linear-gradient(90deg, #f97316 0%, #f97316 ${leftStop}%, #f8b04f ${midLeft}%, #d9e26f ${midRight}%, #22c55e ${rightStop}%, #22c55e 100%)`
                                    };
                                  }
                                }
                                  return (
                                    <div
                                      key={`nutrition-sim-${item.parameter}`}
                                      className="rounded-lg border border-sky-100 bg-white/95 px-3 py-3 text-sm shadow-[0_4px_14px_rgba(56,189,248,0.08)]"
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div>
                                          <span className="font-semibold text-slate-700">{displayLabel}</span>
                                          <p className="mt-1 text-xs text-slate-500">{detailText}</p>
                                        </div>
                                        <span
                                          className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${deltaBadgeClass}`}
                                        >
                                          {deltaText}
                                        </span>
                                      </div>
                                      {hasBeforeAfter ? (
                                        <div className="mt-3">
                                          <div className="relative pt-4 pb-2">
                                            <div className="h-2 w-full rounded-full bg-sky-100/80" />
                                          <div
                                            className="absolute top-4 h-2 rounded-full"
                                            style={segmentStyle}
                                          />
                                            <div
                                              className="absolute top-[10px] h-4 w-4 -translate-x-1/2 rounded-full border-2 border-slate-500 bg-white shadow-sm"
                                              style={{ left: `${currentPos}%` }}
                                              title="기존"
                                            />
                                            <div
                                              className={`absolute top-[10px] h-4 w-4 -translate-x-1/2 rounded-full border-2 border-white shadow-sm ${expectedDotClass}`}
                                              style={{ left: `${expectedPos}%` }}
                                              title="4주 후"
                                            />
                                          </div>
                                          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm font-semibold">
                                            <span className="inline-flex items-center gap-2 text-slate-600">
                                              <span className="h-3 w-3 rounded-full border-2 border-slate-500 bg-white" />
                                              기존 {currentValue.toFixed(2)}
                                            </span>
                                            <span className={`inline-flex items-center gap-2 ${expectedTextClass}`}>
                                              <span className={`h-3 w-3 rounded-full ${expectedDotClass}`} />
                                              4주 후 {expectedValue.toFixed(2)}
                                            </span>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="mt-2 rounded-md border border-dashed border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-500">
                                          전/후 수치 데이터 없음
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white/80 px-3 py-6 text-center text-sm text-slate-600">
                              {csvRequiredMessage}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    </div>
                  ) : (
                    <div className="flex min-h-[560px] w-full items-center justify-center bg-white/80 px-6 py-12 text-center text-2xl font-semibold text-slate-800">
                      환자의 검사 수치를 입력해주세요.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}

          {/* Supplement Search */}
          {hasSelectedResident && selectedResident && hasNutritionCsvInput ? (
            <div className="space-y-4 mt-8">
              <div className="rounded-2xl border border-muted bg-white px-6 py-6 text-center">
                <p className="text-lg font-semibold text-slate-900">영양제 추천 검색</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  부족 영양소 기반으로 맞춤 제품을 찾아드립니다.
                </p>
                <div className="mt-4 flex justify-center">
                  <div className="flex w-full max-w-3xl items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 shadow-sm">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      value={supplementQuery}
                      onChange={(event) => setSupplementQuery(event.target.value)}
                      placeholder="제품명, 브랜드, 제형을 입력하세요"
                      className="flex-1 border-0 bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          runSupplementSearch(supplementQuery);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => runSupplementSearch(supplementQuery)}
                      disabled={isSearching || !supplementQuery.trim()}
                      className="rounded-full bg-gray-900 px-5 text-white hover:bg-gray-800"
                    >
                      {isSearching ? '검색 중...' : '검색'}
                    </Button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  예시: 비타민 D 1000IU, 오메가-3 캡슐, 칼슘+마그네슘
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>검색 결과</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      선택한 이용자의 추천 영양소를 기준으로 결과를 표시합니다.
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-muted bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">선택 이용자</p>
                        <p className="font-medium">{selectedResident}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">추천 영양소</p>
                        <p className="text-sm font-semibold">{searchSupplementSummary}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedRecommendations.supplements.length === 0 ? (
                        <span className="text-xs text-muted-foreground">
                          추천 영양소가 없습니다.
                        </span>
                      ) : (
                        selectedRecommendations.supplements.map((item, index) => {
                          const label = formatSearchSupplementLabel(item);
                          return (
                          <Badge
                              key={`${item}-${index}`}
                            asChild
                            variant="secondary"
                            className="border border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                  const nextQuery = normalizeSupplementQuery(label);
                                setSupplementQuery(nextQuery);
                                runSupplementSearch(nextQuery);
                              }}
                            >
                                {label}
                            </button>
                          </Badge>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        검색 결과{lastSearchQuery ? ` (${lastSearchQuery})` : ''}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {isSearching ? '검색 중...' : `${supplementResults.length}건`}
                      </span>
                    </div>
                    {searchError ? (
                      <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                        {searchError}
                      </div>
                    ) : null}
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {isSearching
                        ? Array.from({ length: 4 }).map((_, index) => (
                            <div
                              key={`result-loading-${index}`}
                              className="rounded-lg border border-dashed border-muted bg-muted/30 p-4 animate-pulse"
                            >
                              <div className="flex gap-3">
                                <div className="h-16 w-16 rounded-md bg-slate-200" />
                                <div className="flex-1 space-y-2">
                                  <div className="h-3 w-24 rounded bg-slate-200" />
                                  <div className="h-4 w-full rounded bg-slate-200" />
                                  <div className="h-3 w-32 rounded bg-slate-200" />
                                </div>
                              </div>
                            </div>
                          ))
                        : supplementResults.length > 0
                          ? supplementResults.map((item) => (
                              <div
                                key={`${item.href}-${item.name}`}
                                className="rounded-lg border border-muted bg-white p-4"
                              >
                                <div className="flex gap-3">
                                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-muted bg-muted/30">
                                    {item.image ? (
                                      <img
                                        src={item.image}
                                        alt={item.name || '영양제 이미지'}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <div className="h-full w-full bg-slate-100" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs text-muted-foreground">{item.brand || '브랜드'}</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                      {item.name || '제품명'}
                                    </p>
                                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                      {item.rating ? <span>★ {item.rating}</span> : null}
                                      {item.reviews ? <span>{item.reviews}</span> : null}
                                    </div>
                                    {item.dose ? (
                                      <p className="mt-1 text-xs text-slate-500">{item.dose}</p>
                                    ) : null}
                                  </div>
                                </div>
                                {item.href ? (
                                  <a
                                    href={item.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-3 inline-flex items-center justify-center rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                                  >
                                    상세 보기
                                  </a>
                                ) : null}
                              </div>
                            ))
                          : lastSearchQuery
                            ? (
                              <div className="col-span-full rounded-lg border border-dashed border-muted bg-muted/30 p-4 text-sm text-muted-foreground">
                                검색 결과가 없습니다.
                              </div>
                            )
                            : Array.from({ length: 4 }).map((_, index) => (
                                <div
                                  key={`result-placeholder-${index}`}
                                  className="rounded-lg border border-dashed border-muted bg-muted/40 p-4"
                                >
                                  <p className="text-sm font-semibold text-slate-500">
                                    결과 카드 {index + 1}
                                  </p>
                                  <p className="mt-2 text-xs text-muted-foreground">
                                    제품명, 브랜드, 함량, 가격/구매 링크 영역
                                  </p>
                                  <div className="mt-3 h-2 w-24 rounded-full bg-slate-200" />
                                </div>
                              ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>메모</CardTitle>
                  </CardHeader>
                  <CardContent>
                  <div className="space-y-4">
                    <textarea
                      value={memoInput}
                      onChange={(event) => setMemoInput(event.target.value)}
                      className="h-32 w-full resize-none rounded-lg border border-muted bg-white p-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      placeholder="메모를 입력하세요."
                    />
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={() => {
                          const trimmed = memoInput.trim();
                          if (!trimmed) {
                            return;
                          }
                          const now = new Date();
                          const timestamp = now.toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          });
                          setMemoList((prev) => [
                            {
                              id: `${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
                              text: trimmed,
                              createdAt: timestamp
                            },
                            ...prev
                          ]);
                          setMemoInput('');
                        }}
                      >
                        입력
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {memoList.length === 0 ? (
                        <p className="text-sm text-slate-400">입력된 메모가 없습니다.</p>
                      ) : (
                        memoList.map((memo) => (
                          <div
                            key={memo.id}
                            className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"
                          >
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span>{memo.createdAt}</span>
                              {memoList.length >= 1 ? (
                                <button
                                  type="button"
                                  onClick={() => setMemoList((prev) => prev.filter((item) => item.id !== memo.id))}
                                  className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                                  aria-label="메모 삭제"
                                >
                                  🗑️
                                </button>
                              ) : null}
                            </div>
                            <p className="mt-2">{memo.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
      <DialogContent className="fixed h-[80vh] w-[85vw] max-w-none sm:max-w-none p-0 overflow-hidden bg-slate-700 text-slate-100 [&_[data-slot=dialog-close]]:hidden left-[50%] top-[50%] -translate-x-[50%] -translate-y-[50%]">
          <button
            type="button"
            onClick={() => setExportOpen(false)}
            aria-label="닫기"
            className="absolute right-4 top-4 z-10 h-7 w-7 rounded border border-slate-300 bg-white text-lg leading-none text-black shadow-sm hover:bg-slate-100"
          >
            ×
          </button>
          <div className="grid h-full grid-cols-[30%_70%]">
            <div className="border-r border-slate-600 bg-slate-700 p-4">
              <div className="text-lg font-semibold">인쇄</div>
              <div className="mt-4 space-y-4 text-sm">
                <div className="rounded-md bg-slate-600/40 p-3">
                  <div className="text-xs uppercase text-slate-300">복사본</div>
                  <div className="mt-2 flex items-center justify-between rounded bg-slate-500/40 px-2 py-1">
                    <span>1</span>
                    <span className="text-xs text-slate-300">▲▼</span>
                  </div>
                </div>
                <div className="rounded-md bg-slate-600/40 p-3">
                  <div className="text-xs uppercase text-slate-300">프린터</div>
                  <div className="mt-2 flex items-center justify-between rounded bg-slate-500/40 px-2 py-1">
                    <span>Microsoft Print to PDF</span>
                    <span className="text-xs text-slate-300">▼</span>
                  </div>
                </div>
                <div className="rounded-md bg-slate-600/40 p-3">
                  <div className="text-xs uppercase text-slate-300">설정</div>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between rounded bg-slate-500/40 px-2 py-1">
                      <span>모든 페이지 인쇄</span>
                      <span className="text-xs text-slate-300">▼</span>
                    </div>
                    <div className="flex items-center justify-between rounded bg-slate-500/40 px-2 py-1">
                      <span>세로 방향</span>
                      <span className="text-xs text-slate-300">▼</span>
                    </div>
                    <div className="flex items-center justify-between rounded bg-slate-500/40 px-2 py-1">
                      <span>A4</span>
                      <span className="text-xs text-slate-300">▼</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-slate-600 p-4">
              <div className="relative h-full w-full rounded-sm bg-white p-8 text-slate-900 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="text-xl font-semibold">영양소 추천 리포트</div>
                  <div className="text-right text-sm font-semibold text-slate-500">
                    <div>샘플 미리보기</div>
                    <div className="mt-1 text-xs font-medium text-slate-400">{previewTimestamp}</div>
                  </div>
                </div>
                <div className="mt-6 text-sm text-slate-700">
                  <table className="w-full border-collapse border-y-2 border-slate-300">
                    <thead className="text-slate-500">
                      <tr className="border-b border-slate-200">
                        <th className="py-2 text-left font-semibold w-32">구분</th>
                        <th className="py-2 text-left font-semibold">내용</th>
                      </tr>
                    </thead>
                    <tbody className="[&>tr]:border-b [&>tr:last-child]:border-b-0 [&>tr]:border-slate-200">
                      <tr>
                        <td className="py-2 font-semibold text-slate-700">대상</td>
                        <td className="py-2">{selectedResident}</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-semibold text-slate-700">부족 영양소</td>
                        <td className="py-2">{lowNutrientLabels}</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-semibold text-slate-700">추천 영양제</td>
                        <td className="py-2">{supplementLabels}</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-semibold text-slate-700">추천 음식</td>
                        <td className="py-2">{foodLabels}</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-semibold text-slate-700">메모</td>
                        <td className="py-2 text-slate-500">{memoPreview}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-6 text-sm text-slate-700">
                  <div className="space-y-3">
                    <div className="font-semibold text-slate-600">섭취 전</div>
                    {lowNutrients.length === 0 ? (
                      <div className="text-slate-400">부족 영양소가 없습니다.</div>
                    ) : (
                      lowNutrients.map((item) => (
                        <div key={`preview-before-${item.nutrient}`} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium">{item.nutrient}</span>
                            <span className="text-slate-500">{item.value}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100">
                            <div
                              className="h-2 rounded-full bg-red-400"
                              style={{ width: `${item.value}%` }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="font-semibold text-slate-600">섭취 후</div>
                    {improvementData.length === 0 ? (
                      <div className="text-slate-400">개선 데이터가 없습니다.</div>
                    ) : (
                      improvementData.map((item) => (
                        <div key={`preview-after-${item.nutrient}`} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium">{item.nutrient}</span>
                            <span className="text-slate-500">{item.improved}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100">
                            <div
                              className="h-2 rounded-full bg-green-400"
                              style={{ width: `${item.improved}%` }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-slate-400">1</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
