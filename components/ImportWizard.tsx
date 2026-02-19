import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Dialog, DialogContent } from './ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import {
  AlertTriangle,
  Download,
  Search,
  Users
} from 'lucide-react';
import { residents, residentDetails, type RiskLevel } from './data/immuneResidents';
import {
  IMMUNE_REQUIRED_HEADERS,
  runImmuneCsvInference
} from './modeling/csvInference';
import {
  IMMUNE_BATCH_STORAGE_KEY,
  formatDateTime,
  type StoredImmuneBatch
} from './modeling/storage';

const IMMUNE_CSV_HELP = `필수 컬럼: ${IMMUNE_REQUIRED_HEADERS.join(', ')}`;

const riskStyles: Record<
  RiskLevel,
  { label: string; dot: string; text: string; badge: string; soft: string; border: string; borderFull: string }
> = {
  critical: {
    label: 'CRITICAL',
    dot: 'bg-red-500',
    text: 'text-red-600',
    badge: 'bg-red-100 text-red-700 border-red-200',
    soft: 'bg-red-50',
    border: 'border-l-red-500',
    borderFull: 'border-red-200'
  },
  high: {
    label: 'HIGH',
    dot: 'bg-orange-500',
    text: 'text-orange-600',
    badge: 'bg-orange-100 text-orange-700 border-orange-200',
    soft: 'bg-orange-50',
    border: 'border-l-orange-500',
    borderFull: 'border-orange-200'
  },
  moderate: {
    label: 'MODERATE',
    dot: 'bg-amber-500',
    text: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    soft: 'bg-amber-50',
    border: 'border-l-amber-500',
    borderFull: 'border-amber-200'
  },
  low: {
    label: 'LOW',
    dot: 'bg-emerald-500',
    text: 'text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    soft: 'bg-emerald-50',
    border: 'border-l-emerald-500',
    borderFull: 'border-emerald-200'
  }
};

const riskMentions: Record<RiskLevel, string> = {
  critical: '즉시 점검 필요',
  high: '즉시 점검 필요',
  moderate: '주의 관찰 필요',
  low: '정기 점검 권장'
};

const PREDICTION_TARGET_ID = 'r-107';

const scoreToRiskLevel = (score: number): RiskLevel => {
  if (score < 30) {
    return 'critical';
  }
  if (score < 50) {
    return 'high';
  }
  if (score < 70) {
    return 'moderate';
  }
  return 'low';
};

const toResidentRiskLevel = (riskLevel: string): RiskLevel => {
  if (riskLevel === 'critical') {
    return 'critical';
  }
  if (riskLevel === 'high') {
    return 'high';
  }
  if (riskLevel === 'moderate') {
    return 'moderate';
  }
  return 'low';
};

const conditionPool = [
  '알츠하이머병에서의 치매',
  '혈관성 치매',
  '달리 분류된 기타 질환에서의 치매',
  '상세불명의 치매',
  '알츠하이머병',
  '지주막하출혈',
  '뇌내출혈',
  '기타 비외상성 두개내출혈',
  '뇌경색증',
  '출혈 또는 경색증으로 명시되지 않은 뇌졸중',
  '뇌경색증을 유발하지 않은 뇌전동맥의 폐쇄 및 협착',
  '뇌경색증을 유발하지 않은 대뇌동맥의 폐쇄 및 협착',
  '기타 뇌혈관질환',
  '달리 분류된 질환에서의 뇌혈관장애',
  '뇌혈관질환의 후유증',
  '파킨슨병',
  '이차성 파킨슨증',
  '달리 분류된 질환에서의 파킨슨증',
  '기저핵의 기타 퇴행성 질환',
  '중풍후유증',
  '진전(震顫)',
  '척수성 근위축 및 관련 증후군'
];

const riskConditionCounts: Record<RiskLevel, { min: number; max: number }> = {
  low: { min: 0, max: 1 },
  moderate: { min: 1, max: 2 },
  high: { min: 2, max: 3 },
  critical: { min: 3, max: 4 }
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

const labTrendMap: Record<string, number[]> = {
  Albumin: [3.4, 3.3, 3.25, 3.15, 3.05, 2.95, 2.85],
  Lymphocyte: [1650, 1580, 1500, 1380, 1280, 1200, 1100],
  CRP: [4.2, 5.1, 6.0, 6.8, 7.4, 8.1, 8.5],
  'Total Protein': [6.8, 6.7, 6.55, 6.4, 6.35, 6.25, 6.2]
};

const labNormalLine: Record<string, number> = {
  Albumin: 3.5,
  Lymphocyte: 1500,
  CRP: 5.0,
  'Total Protein': 6.0
};

type ImportStatus = 'idle' | 'running' | 'success' | 'error';

type ImportUiState<T> = {
  status: ImportStatus;
  message: string;
  batch: T | null;
};

export function ImportWizard({
  selectedResidentId: externalSelectedResidentId,
  onNavigateToTemplateEditor,
  onNavigateToTemplateHistory
}: {
  selectedResidentId?: string | null;
  onNavigateToTemplateEditor?: (residentId?: string) => void;
  onNavigateToTemplateHistory?: (residentId?: string) => void;
} = {}) {
  const detailColumnRef = useRef<HTMLDivElement | null>(null);
  const immuneCsvInputRef = useRef<HTMLInputElement | null>(null);
  const scoreAnimationRef = useRef<number | null>(null);
  const animatedScoreRef = useRef(0);
  const previousResidentIdRef = useRef<string | null>(null);
  const [selectedId, setSelectedId] = useState(externalSelectedResidentId ?? residents[0].id);
  const [predictedResidents, setPredictedResidents] = useState<Record<string, { score: number; risk: RiskLevel }>>({});
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'high'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [listHeight, setListHeight] = useState<number | null>(null);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);
  const [immuneImportState, setImmuneImportState] = useState<ImportUiState<StoredImmuneBatch>>({
    status: 'idle',
    message: '',
    batch: null
  });
  const resolvedResidents = useMemo(
    () =>
      residents.map((resident) => {
        const predicted = predictedResidents[resident.id];
        return predicted ? { ...resident, score: predicted.score, risk: predicted.risk } : resident;
      }),
    [predictedResidents]
  );
  const applyPredictionFromBatch = (batch: StoredImmuneBatch | null) => {
    if (!batch?.items?.length) {
      return;
    }
    const targetItem = batch.items.find(
      (item) => item?.resident_id === PREDICTION_TARGET_ID && item.prediction
    );
    if (!targetItem?.prediction) {
      return;
    }
    setPredictedResidents((prev) => ({
      ...prev,
      [PREDICTION_TARGET_ID]: {
        score: Number(targetItem.prediction.divs_score.toFixed(1)),
        risk: toResidentRiskLevel(targetItem.prediction.risk_level)
      }
    }));
  };
  useEffect(() => {
    if (externalSelectedResidentId) {
      setSelectedId(externalSelectedResidentId);
      setActiveFilter('all');
    }
  }, [externalSelectedResidentId]);
  useEffect(() => {
    try {
      const immuneRaw = window.localStorage.getItem(IMMUNE_BATCH_STORAGE_KEY);
      if (immuneRaw) {
        const immuneBatch = JSON.parse(immuneRaw) as StoredImmuneBatch;
        setImmuneImportState({
          status: 'success',
          message: `최근 면역 CSV 추론 ${immuneBatch.count}건`,
          batch: immuneBatch
        });
        applyPredictionFromBatch(immuneBatch);
      }
    } catch {
      // ignore storage parse errors and keep defaults
    }
  }, []);
  const residentConditions = useMemo(() => {
    const map: Record<string, string[]> = {};
    resolvedResidents.forEach((resident) => {
      const rng = createRng(hashString(resident.id));
      const { min, max } = riskConditionCounts[resident.risk];
      const count = min + Math.floor(rng() * (max - min + 1));
      const shuffled = [...conditionPool];
      for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rng() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      map[resident.id] = shuffled.slice(0, count);
    });
    return map;
  }, [resolvedResidents]);
  const selectedResident = resolvedResidents.find((resident) => resident.id === selectedId) ?? resolvedResidents[0];
  const details =
    residentDetails[selectedResident.id] ??
    residentDetails['r-101'];
  const conditions =
    residentDetails[selectedResident.id]?.conditions?.length
      ? residentDetails[selectedResident.id].conditions
      : residentConditions[selectedResident.id] ?? [];
  const prescriptionList = [
    { id: 'rx-1', name: '혈압약 (Amlodipine)', dose: '5mg · 1정', schedule: 'AM 09:00', note: '식후' },
    { id: 'rx-2', name: '당뇨약 (Metformin)', dose: '500mg · 1정', schedule: 'PM 12:00', note: '식후' },
    { id: 'rx-3', name: '고지혈증약 (Atorvastatin)', dose: '10mg · 1정', schedule: 'PM 06:00', note: '취침 전' },
    { id: 'rx-4', name: '비타민 D', dose: '1000IU · 1정', schedule: 'PM 06:30', note: '식후' }
  ];
  const [checkedPrescriptions, setCheckedPrescriptions] = useState<Record<string, boolean>>(() =>
    prescriptionList.reduce(
      (acc, item) => {
        acc[item.id] = false;
        return acc;
      },
      {} as Record<string, boolean>
    )
  );
  const [checkedActions, setCheckedActions] = useState<Record<string, { checked: boolean; time?: string; staff?: string }>>(() =>
    details.actions.reduce(
      (acc, action) => {
        acc[action.title] = { checked: false };
        return acc;
      },
      {} as Record<string, { checked: boolean; time?: string; staff?: string }>
    )
  );
  useEffect(() => {
    setCheckedActions(
      details.actions.reduce(
        (acc, action) => {
          acc[action.title] = { checked: false };
          return acc;
        },
        {} as Record<string, { checked: boolean; time?: string; staff?: string }>
      )
    );
  }, [selectedResident.id]);
  const completedActionCount = Object.values(checkedActions).filter((item) => item.checked).length;
  const totalActions = details.actions.length;
  const allActionsChecked = totalActions === 4 && completedActionCount === totalActions;
  const scoreTarget = Math.min(100, selectedResident.score + (allActionsChecked ? 6.1 : 0));
  const scoreRiskLevel = scoreToRiskLevel(scoreTarget);
  const conditionPreview = [...conditions, ...details.meds].length
    ? [...conditions, ...details.meds].join(', ')
    : '없음';
  const actionPreview = details.actions?.length
    ? details.actions.map((action) => action.title).join(' / ')
    : '없음';
  const updateLabel = `${new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })} ${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 기준`;
  const previewTimestamp = new Date().toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const displayResidents = useMemo(() => {
    if (!allActionsChecked) {
      return resolvedResidents;
    }
    return resolvedResidents.map((resident) =>
      resident.id === selectedId
        ? { ...resident, score: scoreTarget, risk: scoreRiskLevel }
        : resident
    );
  }, [allActionsChecked, resolvedResidents, scoreRiskLevel, scoreTarget, selectedId]);

  const riskCounts = useMemo(() => {
    return displayResidents.reduce(
      (acc, resident) => {
        acc[resident.risk] += 1;
        return acc;
      },
      { critical: 0, high: 0, moderate: 0, low: 0 }
    );
  }, [displayResidents]);

  const filteredResidents = useMemo(() => {
    if (activeFilter === 'all') {
      return displayResidents;
    }
    return displayResidents.filter((resident) => resident.risk === activeFilter);
  }, [activeFilter, displayResidents]);

  const visibleResidents = useMemo(() => {
    const list = [...filteredResidents];
    list.sort((a, b) => (sortOrder === 'desc' ? b.score - a.score : a.score - b.score));
    return list;
  }, [filteredResidents, sortOrder]);

  useEffect(() => {
    if (!filteredResidents.some((resident) => resident.id === selectedId)) {
      setSelectedId(filteredResidents[0]?.id ?? displayResidents[0].id);
    }
  }, [displayResidents, filteredResidents, selectedId]);

  useEffect(() => {
    if (!detailColumnRef.current) {
      return;
    }
    const element = detailColumnRef.current;
    const updateHeight = () => {
      const nextHeight = Math.round(element.getBoundingClientRect().height);
      setListHeight(nextHeight || null);
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    window.addEventListener('resize', updateHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  useEffect(() => {
    const target = scoreTarget;
    const duration = 520;
    const start = performance.now();
    const isNewResident = previousResidentIdRef.current !== selectedResident.id;
    previousResidentIdRef.current = selectedResident.id;
    const startValue = isNewResident ? 0 : animatedScoreRef.current;

    if (scoreAnimationRef.current !== null) {
      cancelAnimationFrame(scoreAnimationRef.current);
    }

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = startValue + (target - startValue) * eased;
      animatedScoreRef.current = nextValue;
      setAnimatedScore(nextValue);
      if (progress < 1) {
        scoreAnimationRef.current = requestAnimationFrame(tick);
      }
    };

    scoreAnimationRef.current = requestAnimationFrame(tick);

    return () => {
      if (scoreAnimationRef.current !== null) {
        cancelAnimationFrame(scoreAnimationRef.current);
        scoreAnimationRef.current = null;
      }
    };
  }, [selectedResident.id, scoreTarget]);

  const riskDotColors: Record<RiskLevel, string> = {
    critical: '#ef4444',
    high: '#f97316',
    moderate: '#eab308',
    low: '#22c55e'
  };

  const buildSparkline = (
    points: number[],
    normalValue?: number,
    width = 440,
    height = 220,
    padding = 16,
    labelSpace = 24
  ) => {
    const min = Math.min(...points, ...(normalValue !== undefined ? [normalValue] : []));
    const max = Math.max(...points, ...(normalValue !== undefined ? [normalValue] : []));
    const span = Math.max(max - min, 1);
    const plotHeight = height - labelSpace;
    const coords = points.map((value, index) => {
      const x = padding + (index / (points.length - 1)) * (width - padding * 2);
      const y = padding + (1 - (value - min) / span) * (plotHeight - padding * 2);
      return { x, y };
    });
    const linePath = coords
      .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`)
      .join(' ');
    const areaPath = `${linePath} L ${width - padding} ${plotHeight - padding} L ${padding} ${
      plotHeight - padding
    } Z`;
    const normalY =
      normalValue === undefined
        ? null
        : padding + (1 - (normalValue - min) / span) * (plotHeight - padding * 2);
    const labelY = plotHeight + labelSpace - 6;
    return { linePath, areaPath, coords, width, height, plotHeight, normalY, labelY, min, max, padding };
  };

  const formatLabValue = (value: number) => {
    if (value >= 1000) {
      return value.toLocaleString('ko-KR');
    }
    if (value >= 100) {
      return value.toFixed(0);
    }
    if (value >= 10) {
      return value.toFixed(1);
    }
    return value.toFixed(2);
  };

  const handleImmuneCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setImmuneImportState({
      status: 'running',
      message: '면역 모델 추론을 실행 중입니다...',
      batch: immuneImportState.batch
    });

    try {
      const result = await runImmuneCsvInference(file);
      setImmuneImportState({
        status: result.ok ? 'success' : 'error',
        message: result.message,
        batch: result.batch
      });
      if (result.ok && result.batch) {
        applyPredictionFromBatch(result.batch);
      }
    } catch {
      setImmuneImportState({
        status: 'error',
        message: '면역 CSV 처리 중 오류가 발생했습니다.',
        batch: null
      });
    } finally {
      event.target.value = '';
    }
  };
  const handleImmuneCsvClear = () => {
    window.localStorage.removeItem(IMMUNE_BATCH_STORAGE_KEY);
    setImmuneImportState({
      status: 'idle',
      message: '',
      batch: null
    });
    setPredictedResidents({});
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">감염 취약성 관리</h1>
          <p className="text-muted-foreground">이기조요양원 · {updateLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            onClick={() => setExportOpen(true)}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <input
            ref={immuneCsvInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleImmuneCsvUpload}
          />
          <div className="relative group">
            <Button
              type="button"
              variant="outline"
              className="h-9 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              onClick={() => immuneCsvInputRef.current?.click()}
              disabled={immuneImportState.status === 'running'}
            >
              {immuneImportState.status === 'running' ? 'CSV 처리 중...' : '면역 CSV'}
            </Button>
            <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-max max-w-[240px] -translate-x-1/2 rounded-md border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
              {IMMUNE_CSV_HELP}
            </div>
          </div>
          {immuneImportState.batch ? (
            <Button
              type="button"
              variant="outline"
              className="h-9 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              onClick={handleImmuneCsvClear}
              disabled={immuneImportState.status === 'running'}
            >
              CSV 초기화
            </Button>
          ) : null}
          {immuneImportState.batch ? (
            <span className="self-center text-xs text-slate-500">
              {immuneImportState.batch.count}건 · {formatDateTime(immuneImportState.batch.updated_at)}
            </span>
          ) : null}
        </div>
      </div>
      {immuneImportState.message ? (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
          {immuneImportState.message}
        </div>
      ) : null}
      
      <>
          <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-100 p-4 text-red-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">독감 경보 발령 중 (질병관리청)</p>
            <p className="text-sm text-red-600">CRITICAL 위험군 5명에 대한 즉시 예방 조치가 필요합니다.</p>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50">
                조치 가이드 보기
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[96vw] sm:max-w-5xl">
              <SheetHeader className="pb-2">
                <SheetTitle>2026 독감 조치사항</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-hidden px-4 pb-4">
                <iframe
                  title="2026 독감 조치사항"
                  src="/2026_%EB%8F%85%EA%B0%90%20%EC%A1%B0%EC%B9%98%EC%82%AC%ED%95%AD.pdf#zoom=139"
                  className="h-full w-full rounded-lg border"
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:items-start lg:grid-cols-[400px_1fr]">
        <Card
          className="overflow-hidden"
          style={listHeight ? { height: listHeight } : undefined}
        >
          <CardHeader className="space-y-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">이용자 목록</CardTitle>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="이름 또는 호실 검색"
                className="pl-4 pr-10 border border-border bg-white"
              />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 min-h-0 overflow-y-auto">
            <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 bg-white pb-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    activeFilter === 'all'
                      ? 'border-slate-300 bg-slate-300 text-slate-900'
                      : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  전체 <span className="ml-1">{displayResidents.length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('critical')}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    activeFilter === 'critical'
                      ? 'border-red-200 bg-red-200 text-red-700'
                      : 'border-red-100 bg-red-100 text-red-600 hover:bg-red-200'
                  }`}
                >
                  위험 <span className="ml-1">{riskCounts.critical}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('high')}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    activeFilter === 'high'
                      ? 'border-orange-200 bg-orange-200 text-orange-700'
                      : 'border-orange-100 bg-orange-100 text-orange-600 hover:bg-orange-200'
                  }`}
                >
                  주의 <span className="ml-1">{riskCounts.high}</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">정렬 ⇅</span>
                <select
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value as 'desc' | 'asc')}
                  className="h-8 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700"
                >
                  <option value="asc">점수 낮은순</option>
                  <option value="desc">점수 높은순</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              {visibleResidents.map((resident) => {
                const risk = riskStyles[resident.risk];
                const isActive = resident.id === selectedId;
                return (
                  <button
                    key={resident.id}
                    onClick={() => setSelectedId(resident.id)}
                    className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${
                      isActive
                        ? 'border-slate-200 bg-slate-100 shadow-sm'
                        : 'border-transparent hover:border-slate-200 hover:bg-slate-100 hover:shadow-sm'
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white"
                      style={{
                        backgroundColor: riskDotColors[resident.risk],
                        boxShadow: `0 0 0 2px rgba(255,255,255,0.75)`
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-semibold">{resident.name}</span>
                        <span className="text-xs text-muted-foreground">
                          | {resident.room} | {resident.age}세 | {resident.gender === '남' ? '남성' : '여성'}
                        </span>
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${risk.badge}`}>
                      {resident.score.toFixed(1)}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div ref={detailColumnRef} className="flex flex-col gap-2">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr] items-start">
            <div className="space-y-3">
              <Card>
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">이용자 상세</CardTitle>
                    <Badge className={riskStyles[scoreRiskLevel].badge}>
                      {riskStyles[scoreRiskLevel].label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xl font-semibold">{selectedResident.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedResident.room} · {selectedResident.age}세 · {selectedResident.gender}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {(conditions.length > 0 || details.meds.length > 0) && (
                        <span className="text-sm font-semibold text-muted-foreground leading-none">
                          보유 기저질환:
                        </span>
                      )}
                      {conditions.map((condition) => (
                        <span
                          key={condition}
                          className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm leading-none text-blue-700"
                        >
                          {condition}
                        </span>
                      ))}
                      {details.meds.map((med) => (
                        <span
                          key={med}
                          className="inline-flex items-center rounded-full bg-pink-50 px-3 py-1 text-sm leading-none text-pink-700"
                        >
                          {med}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className={`rounded-xl border ${riskStyles[scoreRiskLevel].borderFull} bg-white p-4 text-center`}
                  >
                    <p className="text-xs text-muted-foreground">DIVS Score</p>
                    <p
                      className={`font-black leading-none tracking-tight ${riskStyles[scoreRiskLevel].text}`}
                      style={{
                        fontSize: 'clamp(4.5rem, 5.3vw, 9.5rem)',
                        textShadow: 'none'
                      }}
                    >
                      {animatedScore.toFixed(1)}
                    </p>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-foreground shadow-[0_2px_10px_rgba(15,23,42,0.12)]">
                      <span className={`h-2 w-2 rounded-full ${riskStyles[scoreRiskLevel].dot}`} />
                      {riskStyles[scoreRiskLevel].label} - {riskMentions[scoreRiskLevel]}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-muted-foreground">맞춤 권장 조치</p>
                    {details.actions.map((action) => {
                      const actionState = checkedActions[action.title] ?? { checked: false };
                      const isChecked = actionState.checked;
                      const tone =
                        action.level === 'urgent'
                          ? 'border-red-200 bg-red-50'
                          : action.level === 'warning'
                            ? 'border-orange-200 bg-orange-50'
                            : 'border-blue-200 bg-blue-50';
                      const checkedTone = 'border-emerald-200 bg-emerald-50';
                      return (
                        <label
                          key={action.title}
                          className={`flex items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${
                            isChecked ? checkedTone : tone
                          }`}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              setCheckedActions((prev) => ({
                                ...prev,
                                [action.title]:
                                  checked === true
                                    ? {
                                        checked: true,
                                        time: new Date().toLocaleTimeString('ko-KR', {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        }),
                                        staff: '김지현'
                                      }
                                    : { checked: false }
                              }));
                            }}
                            className="mt-0.5"
                          />
                          <div className="grid gap-1">
                            <span className="font-semibold text-foreground">{action.title}</span>
                            <span className="text-xs text-muted-foreground">{action.desc}</span>
                            {isChecked && (
                              <span className="text-xs text-emerald-700">
                                체크 시각: {actionState.time} · 담당자: {actionState.staff}
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">투약 관리</CardTitle>
                  <span className="text-xs text-muted-foreground">체크 시 복용 완료</span>
                </CardHeader>
                <CardContent className="space-y-3">
                  {prescriptionList.map((item) => {
                    const isChecked = checkedPrescriptions[item.id];
                    return (
                      <label
                        key={item.id}
                        className={`flex items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${
                          isChecked ? 'border-emerald-200 bg-emerald-50' : 'border-border bg-white'
                        }`}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            setCheckedPrescriptions((prev) => ({
                              ...prev,
                              [item.id]: checked === true
                            }));
                          }}
                          className="mt-0.5"
                        />
                        <div className="grid flex-1 grid-cols-[1fr_auto] gap-x-2 gap-y-1">
                          <span className="font-semibold text-foreground">{item.name}</span>
                          <span className="text-xs text-muted-foreground text-right">{item.schedule}</span>
                          <p className="text-xs text-muted-foreground">
                            {item.dose} · {item.note}
                          </p>
                          <span
                            className={`text-xs font-semibold text-emerald-700 text-right ${
                              isChecked ? 'visible' : 'invisible'
                            }`}
                          >
                            투약 시간: {item.schedule}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-5 w-5 text-amber-600" />
                    점수 구성 · 주요 검사 수치
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground">점수 구성</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">기초 면역력</span>
                        <span className="font-medium">{details.baseImmunity} / 100</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground">주요 검사 수치</p>
                    <div className="grid grid-cols-2 gap-3">
                    {details.labs.map((lab) => {
                      const labTone =
                        lab.status === 'abnormal'
                          ? 'border-red-200 bg-red-50 hover:bg-red-100'
                          : lab.status === 'borderline'
                            ? 'border-amber-200 bg-amber-50 hover:bg-amber-100'
                            : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100';
                      const labTrend = labTrendMap[lab.name] ?? [10, 12, 11, 13, 12, 13, 12];
                      const labNormal = labNormalLine[lab.name];
                      const labChart = buildSparkline(labTrend, labNormal, 220, 90, 12, 18);
                      return (
                        <div
                          key={lab.name}
                          className={`group rounded-lg border ${labTone} p-3 transition-colors`}
                        >
                          <p className="text-xs text-muted-foreground">{lab.name}</p>
                          <p
                            className={`text-lg font-semibold ${
                              lab.status === 'abnormal'
                                ? 'text-red-600'
                                : lab.status === 'borderline'
                                  ? 'text-amber-600'
                                  : 'text-emerald-600'
                            }`}
                          >
                            {lab.value}
                          </p>
                          <p className="text-xs text-muted-foreground">{lab.ref}</p>
                          <svg
                            viewBox={`0 0 ${labChart.width} ${labChart.height}`}
                            className="mt-2 h-16 w-full"
                            fill="none"
                          >
                            <defs>
                              <linearGradient
                                id={`lab-inline-${lab.name.toLowerCase().replace(/\\s+/g, '')}`}
                                x1="0%"
                                y1="0%"
                                x2="0%"
                                y2="100%"
                              >
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                              </linearGradient>
                            </defs>
                            <path
                              d={labChart.areaPath}
                              fill={`url(#lab-inline-${lab.name.toLowerCase().replace(/\\s+/g, '')})`}
                            />
                            {labChart.normalY !== null ? (
                              <line
                                x1="0"
                                x2={labChart.width}
                                y1={labChart.normalY}
                                y2={labChart.normalY}
                                stroke="#ef4444"
                                strokeWidth="2"
                                strokeDasharray="6 6"
                              />
                            ) : null}
                            <path d={labChart.linePath} className="stroke-blue-600 stroke-[2.2]" />
                            {labChart.coords.map((point, index) => (
                              <circle
                                key={index}
                                cx={point.x}
                                cy={point.y}
                                r="2.5"
                                fill="#2563eb"
                              />
                            ))}
                          </svg>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">보호자에게 연락 바로가기</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="border border-slate-200"
                    onClick={() => onNavigateToTemplateHistory?.(selectedResident.id)}
                  >
                    연락 기록 보기 →
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">주 보호자: 김보호</p>
                        <p className="text-xs text-muted-foreground">관계: 자녀 · 010-2345-6789</p>
                      </div>
                      <span className="text-xs text-emerald-600">최근 연락: 2일 전</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="border-slate-200 bg-white"
                        onClick={() => onNavigateToTemplateEditor?.(selectedResident.id)}
                      >
                        보호자에게 연락하기
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-500">
                    기록은 보호자 동의 이후에만 공유됩니다.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

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
                  <div className="text-xl font-semibold">감염 취약성 리포트</div>
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
                        <td className="py-2">{selectedResident.name}</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-semibold text-slate-700">위험 등급</td>
                        <td className="py-2">{riskStyles[scoreRiskLevel].label}</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-semibold text-slate-700">DIVS 점수</td>
                        <td className="py-2">{selectedResident.score.toFixed(1)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-semibold text-slate-700">기저질환</td>
                        <td className="py-2">{conditionPreview}</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-semibold text-slate-700">주요 조치</td>
                        <td className="py-2 text-slate-500">{actionPreview}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-6 text-sm text-slate-700">
                  <div className="space-y-3">
                    <div className="font-semibold text-slate-600">검사 수치</div>
                    {details.labs.map((lab) => (
                      <div key={`preview-lab-${lab.name}`} className="flex items-center justify-between text-xs">
                        <span className="font-medium">{lab.name}</span>
                        <span className="text-slate-500">{lab.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <div className="font-semibold text-slate-600">권장 조치</div>
                    {details.actions.map((action) => (
                      <div key={`preview-action-${action.title}`} className="text-xs text-slate-500">
                        {action.title}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      
      </>
    </div>
  );
}
