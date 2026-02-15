import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Dialog, DialogContent } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Mail, 
  MessageSquare, 
  Phone,
  Download,
  Calendar,
  Target,
  Plus,
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

export function Nutrition() {
  type NutrientStatus = { nutrient: string; value: number; status: 'good' | 'low' };
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
  const nutrientCatalog = [
    '비타민 A',
    '비타민 B12',
    '비타민 C',
    '비타민 D',
    '비타민 E',
    '칼슘',
    '마그네슘',
    '오메가-3'
  ];
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
    최영자: { status: 'inactive', months: 1, recentSupplements: [] },
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
    }
  };
  const selectedRecommendations =
    recommendationMap[selectedResident] ?? defaultRecommendations;
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
  const conditionMap: Record<string, string[]> = {
    김영희: ['치매', '심부전', '당뇨'],
    박철수: ['고혈압', '관절염'],
    이순자: ['골다공증', '빈혈'],
    정민호: ['고지혈증'],
    최영자: ['당뇨'],
    한상철: ['만성기관지염'],
    윤미경: ['류마티스 관절염'],
    강태영: ['고혈압'],
    서정희: ['불면증'],
    이수현: ['위염'],
    오춘자: ['심부전'],
    김정수: ['전립선 비대']
  };
  const selectedConditions = conditionMap[selectedResident] ?? ['기록 없음'];
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

  const templatePerformance = [
    { template: 'Friendly Reminder', conversion: 15.2, avgDays: 8.3, sent: 450 },
    { template: 'Firm Notice', conversion: 12.8, avgDays: 6.1, sent: 320 },
    { template: 'Final Warning', conversion: 18.7, avgDays: 4.2, sent: 180 },
    { template: 'Payment Due', conversion: 11.4, avgDays: 9.7, sent: 280 }
  ];

  const abTestResults = [
    {
      test: 'Subject Line A/B',
      variantA: { name: 'Payment Reminder', conversion: 12.5, sent: 500 },
      variantB: { name: 'Action Required', conversion: 15.2, sent: 500 },
      significance: 'Significant',
      winner: 'B'
    },
    {
      test: 'Send Time A/B',
      variantA: { name: 'Morning (9 AM)', conversion: 14.1, sent: 300 },
      variantB: { name: 'Afternoon (2 PM)', conversion: 16.8, sent: 300 },
      significance: 'Significant',
      winner: 'B'
    }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1> Clinical Nutrient Precision Guide </h1>
          <p className="text-muted-foreground">Evidence-based Nutritional Optimization for Immune Resilience</p>
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
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="abtesting">A/B Testing</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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

          {hasSelectedResident && selectedResident ? (
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>선택된 이용자</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-slate-700">
                      이용자: <span className="font-semibold">{selectedResident}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setHasSelectedResident(false);
                        setSearchTerm('');
                        setIsResidentListOpen(false);
                      }}
                      className="rounded border border-blue-200 bg-white px-3 py-1 text-xs text-blue-700 hover:bg-blue-100"
                    >
                      선택 해제
                    </button>
                  </div>

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
                    <p className="mt-2 text-xs text-muted-foreground">
                      유지 기간: {subscriptionInfo.months}개월
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      구독 시작일: {getSubscriptionStartDate(subscriptionInfo.months)}
                    </p>
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-slate-500">최근 섭취 영양제</p>
                      {subscriptionInfo.recentSupplements.length === 0 ? (
                        <p className="mt-1 text-xs text-muted-foreground">기록 없음</p>
                      ) : (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {subscriptionInfo.recentSupplements.map((item) => (
                            <span
                              key={item}
                              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {hasSelectedResident && selectedResident ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>영양소 리스트</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-1" aria-hidden="true" />
                  <div className="space-y-3">
                    {selectedNutrientStatus.map((item) => {
                      const safeValue = Math.min(Math.max(item.value, 0), 100);
                      const isGood = item.status === 'good';
                      const markerTone =
                        safeValue < 40 ? 'red' : safeValue < 70 ? 'amber' : 'emerald';
                      const markerLineClass =
                        markerTone === 'red'
                          ? 'bg-red-500'
                          : markerTone === 'amber'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500';
                      const markerTriangleClass =
                        markerTone === 'red'
                          ? 'border-b-red-500'
                          : markerTone === 'amber'
                            ? 'border-b-amber-500'
                            : 'border-b-emerald-500';
                      return (
                        <div
                          key={item.nutrient}
                          className="rounded-md border border-muted px-3 py-3"
                        >
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-slate-700">{item.nutrient}</span>
                            <span
                              className={`font-semibold ${
                                isGood ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {item.value}
                            </span>
                          </div>
                          <div className="mt-2">
                            <div className="relative">
                              <div className="relative h-3 w-full rounded-full overflow-hidden border border-slate-200">
                                <div className="absolute inset-0 flex">
                                  <div className="h-full w-[40%] bg-red-200" />
                                  <div className="h-full w-[30%] bg-amber-200" />
                                  <div className="h-full w-[30%] bg-green-200" />
                                </div>
                              </div>
                              <div
                                className={`absolute -top-3 h-0 w-0 border-l-4 border-r-4 border-b-[6px] border-l-transparent border-r-transparent rotate-180 ${markerTriangleClass}`}
                                style={{ left: `calc(${safeValue}% - 4px)` }}
                              />
                              <div
                                className={`absolute top-0 h-3 w-[2px] ${markerLineClass}`}
                                style={{ left: `calc(${safeValue}% - 1px)` }}
                              />
                            </div>
                            <div className="relative mt-1 h-4 text-[11px] text-muted-foreground">
                              <span className="absolute left-0">위험</span>
                              <span className="absolute left-[40%] -translate-x-1/2">주의</span>
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
                <CardHeader>
                  <CardTitle>보유 기저질환: {selectedConditions.join(' · ')}</CardTitle>
                </CardHeader>
                <CardContent className="pb-28">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                      <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 shadow-sm h-full">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-semibold text-slate-700">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                            추천 영양제
                          </div>
                          <span className="text-xs text-slate-500">권장</span>
                        </div>
                        <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600">
                          {selectedRecommendations.supplements.map((item) => (
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
                      <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-4 shadow-sm h-full">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-semibold text-slate-700">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                            추천 음식
                          </div>
                          <span className="text-xs text-slate-500">식단</span>
                        </div>
                        <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600">
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
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-4">
                        <div className="rounded-lg border border-amber-100 bg-amber-50/40 p-4 shadow-sm">
                          <div className="flex items-center gap-2 font-semibold text-slate-700">
                            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                            제한 영양소
                          </div>
                          <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            {selectedRestrictions.map((item) => (
                              <li
                                key={`${item.nutrient}-${item.reason}`}
                                className="flex items-start gap-3 rounded-md border border-amber-100 bg-white/80 p-2"
                              >
                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400" />
                                <div>
                                  <div className="font-semibold text-slate-700">{item.nutrient}</div>
                                  <div className="text-xs text-slate-500">{item.reason}</div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white/80 p-4 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-semibold text-slate-700">
                              <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
                              섭취 후 예상 수치
                            </div>
                            <span className="text-xs text-slate-500">시뮬레이션</span>
                          </div>
                          {improvementData.length === 0 ? (
                            <p className="mt-3 text-xs text-muted-foreground">
                              개선 데이터가 없습니다.
                            </p>
                          ) : (
                            <div className="mt-3 space-y-3">
                              {improvementData.map((item) => {
                                const safeValue = Math.min(Math.max(item.improved, 0), 100);
                                const markerTone =
                                  safeValue < 40 ? 'red' : safeValue < 70 ? 'amber' : 'emerald';
                                const markerLineClass =
                                  markerTone === 'red'
                                    ? 'bg-red-500'
                                    : markerTone === 'amber'
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500';
                                const markerTriangleClass =
                                  markerTone === 'red'
                                    ? 'border-b-red-500'
                                    : markerTone === 'amber'
                                      ? 'border-b-amber-500'
                                      : 'border-b-emerald-500';
                                return (
                                  <div
                                    key={item.nutrient}
                                    className="rounded-md border border-slate-200 bg-white px-3 py-2"
                                  >
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="font-medium text-slate-700">
                                        {item.nutrient}
                                      </span>
                                      <span className="text-xs font-semibold text-slate-600">
                                        {item.improved}
                                      </span>
                                    </div>
                                    <div className="mt-2">
                                      <div className="relative">
                                        <div className="relative h-3 w-full rounded-full overflow-hidden border border-slate-200">
                                          <div className="absolute inset-0 flex">
                                            <div className="h-full w-[40%] bg-red-200" />
                                            <div className="h-full w-[30%] bg-amber-200" />
                                            <div className="h-full w-[30%] bg-green-200" />
                                          </div>
                                        </div>
                                        <div
                                          className={`absolute -top-3 h-0 w-0 border-l-4 border-r-4 border-b-[6px] border-l-transparent border-r-transparent rotate-180 ${markerTriangleClass}`}
                                          style={{ left: `calc(${safeValue}% - 4px)` }}
                                        />
                                        <div
                                          className={`absolute top-0 h-3 w-[2px] ${markerLineClass}`}
                                          style={{ left: `calc(${safeValue}% - 1px)` }}
                                        />
                                      </div>
                                      <div className="relative mt-1 h-4 text-[11px] text-muted-foreground">
                                        <span className="absolute left-0">위험</span>
                                        <span className="absolute left-[40%] -translate-x-1/2">
                                          주의
                                        </span>
                                        <span className="absolute right-0">정상</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <div className="absolute left-4 right-4 bottom-1.5 rounded-lg border border-muted bg-muted/40 p-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold">비슷한 음식을 추천받은 이용자</span>
                    <span>{similarResidents.length}명</span>
                  </div>
                  {similarResidents.length === 0 ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      비슷한 음식을 추천받은 이용자가 없습니다.
                    </p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {similarResidentPreview.map((name) => (
                          <span
                            key={name}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                      {similarResidentExtra > 0 ? (
                        <div className="flex justify-end">
                          <div className="relative group">
                            <span
                              className="text-xs text-muted-foreground cursor-default"
                              tabIndex={0}
                              aria-label={`외 ${similarResidentExtra}명`}
                            >
                              외 {similarResidentExtra}명
                            </span>
                            <div
                              className="pointer-events-none absolute bottom-full right-0 mb-2 w-max max-w-[16rem] rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-lg opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
                              role="tooltip"
                            >
                              <p className="font-semibold text-slate-500">추가 이용자</p>
                              <p className="mt-1 text-slate-700">
                                {similarResidentOverflow.join(', ')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          ) : null}

          {/* Supplement Search */}
          {hasSelectedResident && selectedResident ? (
            <div className="space-y-6">
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
                      선택한 이용자의 부족 영양소를 기준으로 결과를 표시합니다.
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
                        <p className="text-xs text-muted-foreground">부족 영양소</p>
                        <p className="text-sm font-semibold">{lowNutrientLabels}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {lowNutrients.length === 0 ? (
                        <span className="text-xs text-muted-foreground">
                          부족 영양소가 없습니다.
                        </span>
                      ) : (
                        lowNutrients.map((item) => (
                          <Badge
                            key={item.nutrient}
                            asChild
                            variant="secondary"
                            className="border border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                const nextQuery = normalizeSupplementQuery(item.nutrient);
                                setSupplementQuery(nextQuery);
                                runSupplementSearch(nextQuery);
                              }}
                            >
                              {item.nutrient}
                            </button>
                          </Badge>
                        ))
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
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <span className="flex items-center gap-2">
                    누적 판매액 (1분기)
                    <InfoEmoji
                      label="누적 판매액 설명"
                      description={`분기 동안 추천을 통해\n실제 구매(결제)가 이루어진 총액`}
                    />
                  </span>
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">20,345,670 (₩)</div>
                <div className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +18.2% from last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <span className="flex items-center gap-2">
                    구매 전환율
                    <InfoEmoji
                      label="구매 전환율 설명"
                      description={`영양소 부족 알림을 받은 이용자(보호자) 중\n실제 구매로 이어진 비율`}
                    />
                  </span>
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">68.5 (%)</div>
                <div className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +5.1% from last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <span className="flex items-center gap-2">
                    평균 구독 유지 기간
                    <InfoEmoji
                      label="평균 구독 유지 기간 설명"
                      description={`한 명의 입소자가 건강기능식품 서비스를\n얼마나 지속적으로 이용하는지 나타내는 기간`}
                    />
                  </span>
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8.2 (month)</div>
                <div className="text-xs text-red-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 rotate-180" />
                  -1.2 days improvement
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <span className="flex items-center gap-2">
                    집중 케어 이용자
                    <InfoEmoji
                      label="집중 케어 이용자 설명"
                      description={`영양소 개선 시뮬레이션 및 추천 서비스를\n활발히 이용 중인 이용자 수`}
                    />
                  </span>
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">53 (명)</div>
                <div className="text-xs text-muted-foreground">
                  + 3 new this week
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Template Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle>Template Performance Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Template</th>
                      <th className="text-left p-3">Conversion Rate</th>
                      <th className="text-left p-3">Avg. Days to Pay</th>
                      <th className="text-left p-3">Messages Sent</th>
                      <th className="text-left p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="[&>tr:nth-child(odd)]:bg-muted [&>tr:hover]:bg-muted/80">
                    {templatePerformance.map((template, index) => (
                      <tr key={template.template} className="border-b">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium ${
                              index === 0 ? 'bg-yellow-100 text-yellow-800' :
                              index === 1 ? 'bg-gray-100 text-gray-800' :
                              index === 2 ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              #{index + 1}
                            </div>
                            {template.template}
                          </div>
                        </td>
                        <td className="p-3 font-medium">{template.conversion}%</td>
                        <td className="p-3">{template.avgDays} days</td>
                        <td className="p-3">{template.sent}</td>
                        <td className="p-3">
                          <Badge variant={template.conversion > 15 ? 'default' : 'secondary'}>
                            {template.conversion > 15 ? 'High Performer' : 'Standard'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="abtesting" className="space-y-6">
          {/* A/B Test Results */}
          <Card>
            <CardHeader>
              <CardTitle>A/B Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {abTestResults.map((test, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4>{test.test}</h4>
                      <Badge variant={test.significance === 'Significant' ? 'default' : 'secondary'}>
                        {test.significance}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`p-3 rounded-lg border ${test.winner === 'A' ? 'border-green-200 bg-green-50' : 'border-muted'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Variant A</span>
                          {test.winner === 'A' && <Badge variant="default" className="bg-green-600">Winner</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{test.variantA.name}</p>
                        <div className="flex justify-between text-sm">
                          <span>Conversion: {test.variantA.conversion}%</span>
                          <span>Sent: {test.variantA.sent}</span>
                        </div>
                      </div>
                      
                      <div className={`p-3 rounded-lg border ${test.winner === 'B' ? 'border-green-200 bg-green-50' : 'border-muted'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Variant B</span>
                          {test.winner === 'B' && <Badge variant="default" className="bg-green-600">Winner</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{test.variantB.name}</p>
                        <div className="flex justify-between text-sm">
                          <span>Conversion: {test.variantB.conversion}%</span>
                          <span>Sent: {test.variantB.sent}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button className="w-full mt-6">
                <Plus className="w-4 h-4 mr-2" />
                Create New A/B Test
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="space-y-6">
          {/* Channel Deep Dive */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-500" />
                  Email Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Open Rate</span>
                  <span className="font-medium">68.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Click Rate</span>
                  <span className="font-medium">15.4%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Conversion Rate</span>
                  <span className="font-medium">12.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Bounce Rate</span>
                  <span className="font-medium">2.1%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-green-500" />
                  SMS Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Delivery Rate</span>
                  <span className="font-medium">98.7%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Response Rate</span>
                  <span className="font-medium">24.3%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Conversion Rate</span>
                  <span className="font-medium">18.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Opt-out Rate</span>
                  <span className="font-medium">0.8%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-purple-500" />
                  Voice Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Answer Rate</span>
                  <span className="font-medium">42.1%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Completion Rate</span>
                  <span className="font-medium">78.9%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Conversion Rate</span>
                  <span className="font-medium">24.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Callback Rate</span>
                  <span className="font-medium">8.3%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

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
