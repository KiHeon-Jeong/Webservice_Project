import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { motion, AnimatePresence } from 'motion/react';
import { residents as immuneResidents, residentDetails, type Resident, type ResidentDetail } from './data/immuneResidents';
import { buildFacilityNotices, formatNoticeDate, type FacilityNotice } from './data/facilityNotices';
import { IMMUNE_BATCH_STORAGE_KEY, type StoredImmuneBatch } from './modeling/storage';
import { 
  ArrowRight,
  ChevronRight
} from 'lucide-react';

type RoomEnvironment = {
  temperature: number;
  humidity: number;
  targetTemperature: number;
  targetHumidity: number;
};

type WestWingRoom = {
  id: string;
  name: string;
  type: 'patient' | 'service' | 'stairs' | 'hallway';
  status: 'occupied' | 'available' | 'maintenance' | 'alert' | 'none';
  resident?: string;
  lastCheck?: string;
  vitals?: { heartRate: number; bp: string };
  environment?: RoomEnvironment;
};

const PREDICTION_TARGET_ID = 'r-107';

const westWingRooms: Record<string, WestWingRoom> = {
  T1: {
    id: 'T1',
    name: 'Room 201',
    type: 'patient',
    status: 'occupied',
    resident: 'John Doe',
    lastCheck: '10 min ago',
    vitals: { heartRate: 72, bp: '120/80' },
    environment: { temperature: 24.1, humidity: 42, targetTemperature: 24, targetHumidity: 45 }
  },
  T2: {
    id: 'T2',
    name: 'Room 202',
    type: 'patient',
    status: 'available',
    lastCheck: '2 hours ago',
    environment: { temperature: 23.6, humidity: 40, targetTemperature: 24, targetHumidity: 45 }
  },
  T3: {
    id: 'T3',
    name: 'Room 203',
    type: 'patient',
    status: 'alert',
    resident: 'Sarah Smith',
    lastCheck: '5 min ago',
    vitals: { heartRate: 98, bp: '145/95' },
    environment: { temperature: 24.8, humidity: 38, targetTemperature: 24, targetHumidity: 45 }
  },
  T4: {
    id: 'T4',
    name: 'Room 204',
    type: 'patient',
    status: 'occupied',
    resident: 'Michael Brown',
    lastCheck: '45 min ago',
    vitals: { heartRate: 68, bp: '118/75' },
    environment: { temperature: 24.3, humidity: 44, targetTemperature: 24, targetHumidity: 45 }
  },
  T5: {
    id: 'T5',
    name: 'Room 205',
    type: 'patient',
    status: 'maintenance',
    lastCheck: '1 day ago',
    environment: { temperature: 23.9, humidity: 41, targetTemperature: 24, targetHumidity: 45 }
  },
  T6: {
    id: 'T6',
    name: 'Storage A',
    type: 'service',
    status: 'none',
    environment: { temperature: 22.8, humidity: 35, targetTemperature: 23, targetHumidity: 40 }
  },
  B1: {
    id: 'B1',
    name: 'Room 206',
    type: 'patient',
    status: 'occupied',
    resident: 'Emma Wilson',
    lastCheck: '15 min ago',
    vitals: { heartRate: 75, bp: '122/82' },
    environment: { temperature: 24.0, humidity: 43, targetTemperature: 24, targetHumidity: 45 }
  },
  B2: {
    id: 'B2',
    name: 'Room 207',
    type: 'patient',
    status: 'occupied',
    resident: 'Robert Lee',
    lastCheck: '30 min ago',
    vitals: { heartRate: 70, bp: '115/78' },
    environment: { temperature: 23.7, humidity: 41, targetTemperature: 24, targetHumidity: 45 }
  },
  B3: {
    id: 'B3',
    name: 'Room 208',
    type: 'patient',
    status: 'available',
    lastCheck: '3 hours ago',
    environment: { temperature: 24.5, humidity: 39, targetTemperature: 24, targetHumidity: 45 }
  },
  B4: {
    id: 'B4',
    name: 'Room 209',
    type: 'patient',
    status: 'occupied',
    resident: 'Linda Garcia',
    lastCheck: '20 min ago',
    vitals: { heartRate: 80, bp: '130/85' },
    environment: { temperature: 24.2, humidity: 42, targetTemperature: 24, targetHumidity: 45 }
  },
  B5: {
    id: 'B5',
    name: 'Room 210',
    type: 'patient',
    status: 'alert',
    resident: 'James Miller',
    lastCheck: '2 min ago',
    vitals: { heartRate: 105, bp: '150/100' },
    environment: { temperature: 24.7, humidity: 38, targetTemperature: 24, targetHumidity: 45 }
  },
  S1: { id: 'S1', name: 'North Stairs', type: 'stairs', status: 'none' },
  S2: { id: 'S2', name: 'South Stairs', type: 'stairs', status: 'none' },
  H1: { id: 'H1', name: 'Main Wing Hallway', type: 'hallway', status: 'none' }
};

const defaultRoomEnvironment: RoomEnvironment = {
  temperature: 24,
  humidity: 42,
  targetTemperature: 24,
  targetHumidity: 45
};

const buildInitialRoomEnvironmentMap = (): Record<string, RoomEnvironment> => {
  return Object.entries(westWingRooms).reduce<Record<string, RoomEnvironment>>((acc, [roomId, room]) => {
    if (room.environment) {
      acc[roomId] = { ...room.environment };
    }
    return acc;
  }, {});
};

const scoreToRiskLevel = (score: number): Resident['risk'] => {
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

const roomRiskStyles: Record<Resident['risk'], { fill: string; stroke: string; dot: string }> = {
  critical: { fill: 'fill-red-50', stroke: 'stroke-red-300', dot: '#ef4444' },
  high: { fill: 'fill-orange-50', stroke: 'stroke-orange-300', dot: '#f97316' },
  moderate: { fill: 'fill-amber-50', stroke: 'stroke-amber-300', dot: '#f59e0b' },
  low: { fill: 'fill-emerald-50', stroke: 'stroke-emerald-300', dot: '#10b981' }
};

const getRoomColor = (risk: Resident['risk'] | null, isSelected: boolean) => {
  if (isSelected) return 'fill-blue-100 stroke-blue-500';
  if (!risk) return 'fill-slate-50 stroke-slate-200';
  const tone = roomRiskStyles[risk];
  return `${tone.fill} ${tone.stroke}`;
};

const getRoomDotFill = (risk: Resident['risk'] | null) => {
  if (!risk) return '#cbd5e1';
  return roomRiskStyles[risk].dot;
};

const getDoorStroke = () => '#9ca3af';
const toResidentRiskLevel = (riskLevel: string): Resident['risk'] => {
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

const facilityStatus = (score: number) => {
  if (score >= 70) {
    return { value: '안전', badge: 'bg-emerald-500', text: 'text-emerald-600', label: '상태: 안전' };
  }
  if (score >= 50) {
    return { value: '주의', badge: 'bg-amber-500', text: 'text-amber-600', label: '상태: 주의' };
  }
  return { value: '경고', badge: 'bg-red-500', text: 'text-red-600', label: '상태: 경고' };
};

export function Dashboard({
  onNavigateToResident,
  onLogout
}: {
  onNavigateToResident?: (residentId: string) => void;
  onLogout?: () => void;
}) {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null);
  const [roomEnvironmentMap, setRoomEnvironmentMap] =
    useState<Record<string, RoomEnvironment>>(buildInitialRoomEnvironmentMap);
  const [predictedResidents, setPredictedResidents] = useState<Record<string, { score: number; risk: Resident['risk'] }>>({});
  const [activeNotice, setActiveNotice] = useState<FacilityNotice | null>(null);
  const residents = useMemo(
    () =>
      immuneResidents.map((resident) => {
        const predicted = predictedResidents[resident.id];
        return predicted
          ? { ...resident, score: predicted.score, risk: predicted.risk }
          : resident;
      }),
    [predictedResidents]
  );
  const selectedData = useMemo(() => {
    if (!selectedRoom) {
      return null;
    }
    const room = westWingRooms[selectedRoom];
    if (!room) {
      return null;
    }
    const environment = roomEnvironmentMap[selectedRoom] ?? room.environment;
    return environment ? { ...room, environment } : room;
  }, [selectedRoom, roomEnvironmentMap]);
  const selectedResident: Resident | null =
    selectedResidentId
      ? residents.find((resident) => resident.id === selectedResidentId) ?? null
      : null;
  const selectedResidentDetail =
    selectedResident
      ? residentDetails[selectedResident.id] ?? residentDetails['r-101']
      : null;

  const adjustRoomEnvironment = (
    roomId: string,
    key: 'targetTemperature' | 'targetHumidity',
    delta: number
  ) => {
    setRoomEnvironmentMap((prev) => {
      const fallback = westWingRooms[roomId]?.environment ?? defaultRoomEnvironment;
      const base = prev[roomId] ?? fallback;
      const rawValue = base[key] + delta;
      const nextValue =
        key === 'targetTemperature'
          ? Math.max(18, Math.min(30, rawValue))
          : Math.max(20, Math.min(70, rawValue));

      return {
        ...prev,
        [roomId]: {
          ...base,
          [key]: Number(nextValue.toFixed(1))
        }
      };
    });
  };

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(IMMUNE_BATCH_STORAGE_KEY);
      if (!raw) {
        return;
      }
      const batch = JSON.parse(raw) as StoredImmuneBatch;
      if (!batch?.items?.length) {
        return;
      }
      const next: Record<string, { score: number; risk: Resident['risk'] }> = {};
      batch.items.forEach((item) => {
        if (!item?.resident_id || !item.prediction) {
          return;
        }
        if (item.resident_id !== PREDICTION_TARGET_ID) {
          return;
        }
        next[item.resident_id] = {
          score: Number(item.prediction.divs_score.toFixed(1)),
          risk: toResidentRiskLevel(item.prediction.risk_level),
        };
      });
      if (Object.keys(next).length) {
        setPredictedResidents((prev) => ({ ...prev, ...next }));
      }
    } catch {
      // ignore malformed storage payload
    }
  }, []);

  const facilityAverageScore = useMemo(() => {
    if (!residents.length) {
      return 0;
    }
    const sum = residents.reduce((acc, resident) => acc + resident.score, 0);
    return Number((sum / residents.length).toFixed(1));
  }, [residents]);
  const facilityState = facilityStatus(facilityAverageScore);
  const cautionResidents = residents.filter((resident) => resident.risk === 'critical' || resident.risk === 'high').length;
  const criticalResidents = residents.filter((resident) => resident.risk === 'critical').length;

  const handleRoomClick = (id: string) => {
    setSelectedRoom((prev) => (prev === id ? null : id));
    setSelectedResidentId(null);
  };

  const handleBedClick = (residentId: string) => {
    if (onNavigateToResident) {
      onNavigateToResident(residentId);
      return;
    }
    setSelectedResidentId((prev) => (prev === residentId ? null : residentId));
    setSelectedRoom(null);
  };

  const metrics = [
    {
      title: '시설 감염 취약도',
      value: facilityAverageScore.toFixed(1),
      unit: '',
      detail: '현재 감염 위험 점수',
      statusLabel: facilityState.value,
      statusColor: facilityState.badge,
      statusText: facilityState.text,
      accentBar:
        facilityState.value === '경고'
          ? 'bg-red-500'
          : facilityState.value === '주의'
            ? 'bg-amber-500'
            : 'bg-emerald-500'
    },
    {
      title: '전체 재원 어르신',
      value: '118',
      unit: '명',
      detail: '일일 입원 제외',
      statusLabel: '정상',
      statusColor: 'bg-emerald-500',
      statusText: 'text-emerald-700',
      accentBar: 'bg-emerald-500'
    },
    {
      title: '오늘 감염 주의군',
      value: `${cautionResidents}`,
      unit: '명',
      detail: '고위험/주의 대상 합산',
      statusLabel: '주의',
      statusColor: 'bg-amber-500',
      statusText: 'text-amber-700',
      accentBar: 'bg-amber-500'
    },
    {
      title: '현재 격리/집중관리',
      value: `${criticalResidents}`,
      unit: '명',
      detail: 'critical 등급 집중 모니터링',
      statusLabel: '경고',
      statusColor: 'bg-red-500',
      statusText: 'text-red-700',
      accentBar: 'bg-red-500'
    }
  ];
  const healthIndices = [
    {
      label: '자외선지수',
      status: '낮음',
      tone: 'text-blue-500',
      ring: 'border-blue-300',
      face: '☀️'
    },
    {
      label: '대기정체지수',
      status: '보통',
      tone: 'text-green-600',
      ring: 'border-green-400',
      face: '☁️'
    },
    {
      label: '감기지수',
      status: '높음',
      tone: 'text-orange-500',
      ring: 'border-orange-400',
      face: '🤒'
    },
    {
      label: '식중독지수',
      status: '관심',
      tone: 'text-sky-500',
      ring: 'border-sky-400',
      face: '🤢'
    }
  ];
  const today = new Date();
  const formatTwo = (value: number) => value.toString().padStart(2, '0');
  const updateLabel = `${today.getFullYear()}.${formatTwo(today.getMonth() + 1)}.${formatTwo(today.getDate())} 09:00 업데이트`;
  const noticeDate = formatNoticeDate(today);
  const recentActivity = buildFacilityNotices(noticeDate);


  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">SILVER Care Plus+</h1>
          <p className="text-muted-foreground">이기조 요양원 시설 관리 프로그램입니다.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="bg-white hover:bg-slate-100" onClick={onLogout}>
            로그아웃
          </Button>
          {/* <Button variant="outline">설정</Button> */}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((metric) => {
          return (
            <Card key={metric.title} className="relative w-full overflow-hidden border-slate-200 bg-white">
              <span className={`absolute inset-y-0 left-0 w-1 ${metric.accentBar}`} />
              <CardHeader className="gap-1 pb-1 pt-4 px-5">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-[21px] font-semibold text-slate-700">{metric.title}</CardTitle>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold ${metric.statusText}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${metric.statusColor}`}></span>
                    {metric.statusLabel}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                <div className="flex items-end gap-1">
                  <span className="text-[42px] font-bold leading-none text-slate-900">{metric.value}</span>
                  {metric.unit ? (
                    <span className="pb-1 text-[26px] font-semibold leading-none text-slate-700">{metric.unit}</span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-slate-500">{metric.detail}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Immune Management Summary */}
      <Card>
        <CardHeader className="border-b border-border px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-lg">
                🧬
              </div>
              <div>
                <CardTitle className="text-[23px]">감염 위험 관리 요약 </CardTitle>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-5 pt-2 pb-5">
          <div className="space-y-2">
            <p className="text-[21px] font-semibold text-muted-foreground">이용자 위치 단면도</p>
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-4">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_690px] lg:items-stretch">
                <WestWingFloorPlan
                  selectedRoom={selectedRoom}
                  onSelect={handleRoomClick}
                  onBedSelect={handleBedClick}
                  residents={residents}
                />
                <div className="relative w-full h-full">
                  <div className="flex h-full flex-col gap-3">
                    <div className="rounded-xl border border-border bg-slate-50 p-4 space-y-4 min-h-[230px] lg:h-full">
                      <div className="flex items-center justify-between">
                        <p className="text-base font-semibold text-muted-foreground">실내 환경 모니터</p>
                        <span className="text-sm text-muted-foreground">Live</span>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        <div className="flex flex-col items-center gap-3 rounded-lg bg-white/80 p-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-rose-200 text-rose-500 text-lg">
                            🌡️
                          </div>
                          <span className="text-sm font-semibold text-rose-600">온도</span>
                          <span className="text-center text-xs text-muted-foreground">24°C (적정)</span>
                        </div>
                        <div className="flex flex-col items-center gap-3 rounded-lg bg-white/80 p-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-sky-200 text-sky-500 text-lg">
                            💧
                          </div>
                          <span className="text-sm font-semibold text-sky-600">습도</span>
                          <span className="text-center text-xs text-muted-foreground">25% (건조)</span>
                        </div>
                        <div className="flex flex-col items-center gap-3 rounded-lg bg-white/80 p-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-amber-200 text-amber-500 text-lg">
                            🌫️
                          </div>
                          <span className="text-sm font-semibold text-amber-600">미세먼지</span>
                          <span className="text-center text-xs text-muted-foreground">28㎍/㎥</span>
                        </div>
                        <div className="flex flex-col items-center gap-3 rounded-lg bg-white/80 p-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-emerald-200 text-emerald-500 text-lg">
                            🧪
                          </div>
                          <span className="text-sm font-semibold text-emerald-600">CO₂</span>
                          <span className="text-center text-xs text-muted-foreground">720ppm</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                        시설 전체 평균 · {updateLabel}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-slate-50 p-4 space-y-4 min-h-[230px] lg:h-full">
                      <div className="flex items-center justify-between">
                        <p className="text-base font-semibold text-muted-foreground">오늘의 생활·보건 지수</p>
                        <span className="text-sm text-muted-foreground">ⓘ</span>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {healthIndices.map((item) => (
                          <div key={item.label} className="flex flex-col items-center gap-3 rounded-lg bg-white/80 p-3">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-full border-4 ${item.ring} ${item.tone} text-lg`}>
                              {item.face}
                            </div>
                            <span className={`text-sm font-semibold ${item.tone}`}>{item.status}</span>
                            <span className="text-center text-xs text-muted-foreground">{item.label}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        기상청, 국민건강보험공단 발표, 웨더아이 제공 · {updateLabel}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-slate-50 p-4 space-y-4 min-h-[230px] lg:h-full">
                      <div className="flex items-center justify-between">
                        <p className="text-base font-semibold text-muted-foreground">요양원 지침</p>
                        <span className="text-sm text-muted-foreground">안내</span>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="rounded-lg bg-white/80 p-3">
                          <div className="flex gap-2 text-sm">
                            <span>⚠️</span>
                            <div className="space-y-1">
                              <p>[경고] 현재 '독감' 유행 중입니다. 면회객 통제 수준을 강화하세요.</p>
                              <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                                <li>발열 확인, 호흡기 증상 확인하여 기록</li>
                                <li>출입시에는 마스크 착용 및 손위생 실시</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                        <div className="rounded-lg bg-white/80 p-3">
                          <div className="flex gap-2 text-sm">
                            <span>💡</span>
                            <div className="space-y-1">
                              <p>[권고] 실내 습도가 낮습니다. 가습기 가동 및 환기 시간을 조정하세요.</p>
                              <p className="text-xs text-muted-foreground">권장 습도: 40~50%를 유지하세요</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {selectedResident && (
                      <ResidentDetailOverlay
                        resident={selectedResident}
                        detail={selectedResidentDetail}
                        onClose={() => setSelectedResidentId(null)}
                      />
                    )}
                    {!selectedResident && selectedData && (
                      <RoomDetailOverlay
                        room={selectedData}
                        onClose={() => setSelectedRoom(null)}
                        onAdjustEnvironment={adjustRoomEnvironment}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 items-stretch">
        <Card className="w-full h-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-[23px]">요양원 공지사항</CardTitle>
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {recentActivity.map((activity, index) => (
              <button
                type="button"
                key={`${activity.title}-${index}`}
                onClick={() => setActiveNotice(activity)}
                className="flex w-full items-start justify-between gap-3 rounded-lg border border-transparent px-3 py-2 text-left transition hover:border-slate-200 hover:bg-slate-50"
              >
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{activity.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{activity.summary}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{activity.postedAt}</p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(activeNotice)} onOpenChange={(open) => !open && setActiveNotice(null)}>
        <DialogContent className="max-w-xl p-6 max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">
              {activeNotice?.title}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              {activeNotice?.summary}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2 text-sm leading-6 text-slate-700">
            {activeNotice?.content ? (
              <div className="whitespace-pre-line">{activeNotice.content}</div>
            ) : (
              <div className="space-y-3">
                {activeNotice?.details?.map((detail, index) => (
                  <div key={`${detail}-${index}`} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 text-xs text-slate-400">
            공지일: {activeNotice?.postedAt}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function WestWingFloorPlan({
  selectedRoom,
  onSelect,
  onBedSelect,
  residents
}: {
  selectedRoom: string | null;
  onSelect: (id: string) => void;
  onBedSelect: (residentId: string) => void;
  residents: Resident[];
}) {
  const bedWidth = 78;
  const bedHeight = 88;
  const bedRadius = 20;
  const bedPillowWidth = 30;
  const bedPillowHeight = 12;
  const bedPillowInset = 6;
  const bedGap = 16;
  const bedGapDouble = 22;

  const roomBedConfig: Record<
    string,
    { x: number; y: number; width: number; height: number; layout: '2x2' | '1x2' | '1x1' }
  > = {
    T1: { x: 88.5, y: 30, width: 226, height: 200, layout: '2x2' },
    T2: { x: 314.5, y: 30, width: 152.9, height: 200, layout: '1x2' },
    T3: { x: 467.4, y: 30, width: 99.85, height: 200, layout: '1x1' },
    T4: { x: 567.25, y: 30, width: 99.85, height: 200, layout: '1x1' },
    T5: { x: 667.1, y: 30, width: 152.9, height: 200, layout: '1x2' },
    B1: { x: 165.5, y: 270, width: 152.9, height: 200, layout: '1x2' },
    B2: { x: 318.4, y: 270, width: 152.9, height: 200, layout: '1x2' },
    B3: { x: 471.3, y: 270, width: 152.9, height: 200, layout: '1x2' },
    B4: { x: 624.2, y: 270, width: 152.9, height: 200, layout: '1x2' },
    B5: { x: 777.1, y: 270, width: 152.9, height: 200, layout: '1x2' }
  };

  const buildBeds = (roomId: string) => {
    const room = roomBedConfig[roomId];
    if (!room) return [];
    const topRoomShift = roomId.startsWith('T') && room.layout !== '1x1' ? -4 : 0;
    const upperBedOffset = room.layout === '1x2' || room.layout === '2x2' ? 6 : 0;
    if (room.layout === '2x2') {
      const totalWidth = bedWidth * 2 + bedGapDouble;
      const totalHeight = bedHeight * 2 + bedGap;
      const startX = room.x + (room.width - totalWidth) / 2;
      const startY = room.y + (room.height - totalHeight) / 2 + topRoomShift;
      return [
        { x: startX, y: startY + upperBedOffset, width: bedWidth, height: bedHeight, rotation: 0 },
        { x: startX + bedWidth + bedGapDouble, y: startY + upperBedOffset, width: bedWidth, height: bedHeight, rotation: 0 },
        { x: startX, y: startY + bedHeight + bedGap, width: bedWidth, height: bedHeight, rotation: 0 },
        { x: startX + bedWidth + bedGapDouble, y: startY + bedHeight + bedGap, width: bedWidth, height: bedHeight, rotation: 0 }
      ];
    }
    if (room.layout === '1x2') {
      const totalHeight = bedHeight * 2 + bedGap;
      const startX = room.x + (room.width - bedWidth) / 2;
      const startY = room.y + (room.height - totalHeight) / 2 + topRoomShift;
      return [
        { x: startX, y: startY + upperBedOffset, width: bedWidth, height: bedHeight, rotation: 0 },
        { x: startX, y: startY + bedHeight + bedGap, width: bedWidth, height: bedHeight, rotation: 0 }
      ];
    }
    const startX = room.x + (room.width - bedWidth) / 2;
    const startY = room.y + (room.height - bedHeight) / 2;
    return [{ x: startX, y: startY, width: bedWidth, height: bedHeight, rotation: 0 }];
  };

  const bedLayouts = Object.keys(roomBedConfig).flatMap((roomId) =>
    buildBeds(roomId).map((bed, index) => ({ roomId, bed, index }))
  );
  const assignedResidents = residents.slice(0, bedLayouts.length);
  const bedLayoutsWithResidents = bedLayouts.map((entry, index) => ({
    ...entry,
    resident: assignedResidents[index]
  }));
  const roomScoreTotals = bedLayoutsWithResidents.reduce<Record<string, { sum: number; count: number }>>(
    (acc, entry) => {
      if (!entry.resident) {
        return acc;
      }
      const current = acc[entry.roomId] ?? { sum: 0, count: 0 };
      current.sum += entry.resident.score;
      current.count += 1;
      acc[entry.roomId] = current;
      return acc;
    },
    {}
  );
  const roomAverageRisk = Object.keys(roomScoreTotals).reduce<Record<string, Resident['risk']>>((acc, roomId) => {
    const total = roomScoreTotals[roomId];
    if (!total || total.count === 0) {
      return acc;
    }
    acc[roomId] = scoreToRiskLevel(total.sum / total.count);
    return acc;
  }, {});
  const getRoomRisk = (roomId: string) => roomAverageRisk[roomId] ?? null;
  const bedFillByRisk: Record<Resident['risk'], string> = {
    critical: '#ffe8ea',
    high: '#fff2e2',
    moderate: '#fff7d6',
    low: '#d1fae5'
  };

  return (
    <div className="west-wing-plan">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3 lg:p-4 max-w-[1640px]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">2F</h2>
            <p className="text-sm text-slate-500"></p>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-medium">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Live Monitoring
            </div>
          </div>
        </div>

        <div className="relative aspect-[1.85/1] w-full">
          <svg
            viewBox="0 0 1000 500"
            className="w-full h-full drop-shadow-md"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="1000" height="500" fill="transparent" />

            <g className="cursor-pointer transition-all duration-300">
              <motion.path
                d="M 88.5 30 L 314.5 30 L 314.5 230 L 88.5 230 Z"
                className={getRoomColor(getRoomRisk('T1'), selectedRoom === 'T1')}
                strokeWidth="2"
                onClick={() => onSelect('T1')}
                whileHover={{ opacity: 0.8 }}
              />
              <motion.path
                d="M 314.5 30 L 467.4 30 L 467.4 230 L 314.5 230 Z"
                className={getRoomColor(getRoomRisk('T2'), selectedRoom === 'T2')}
                strokeWidth="2"
                onClick={() => onSelect('T2')}
                whileHover={{ opacity: 0.8 }}
              />
              <motion.path
                d="M 467.4 30 L 567.25 30 L 567.25 230 L 467.4 230 Z"
                className={getRoomColor(getRoomRisk('T3'), selectedRoom === 'T3')}
                strokeWidth="2"
                onClick={() => onSelect('T3')}
                whileHover={{ opacity: 0.8 }}
              />
              <motion.path
                d="M 567.25 30 L 667.1 30 L 667.1 230 L 567.25 230 Z"
                className={getRoomColor(getRoomRisk('T4'), selectedRoom === 'T4')}
                strokeWidth="2"
                onClick={() => onSelect('T4')}
                whileHover={{ opacity: 0.8 }}
              />
              <motion.path
                d="M 667.1 30 L 820 30 L 820 230 L 667.1 230 Z"
                className={getRoomColor(getRoomRisk('T5'), selectedRoom === 'T5')}
                strokeWidth="2"
                onClick={() => onSelect('T5')}
                whileHover={{ opacity: 0.8 }}
              />
              <motion.path
                d="M 820 30 L 930 30 L 930 140 L 820 140 Z"
                className={getRoomColor(getRoomRisk('T6'), selectedRoom === 'T6')}
                strokeWidth="2"
                onClick={() => onSelect('T6')}
                whileHover={{ opacity: 0.8 }}
              />

              <motion.path
                d="M 165.5 270 L 318.4 270 L 318.4 470 L 165.5 470 Z"
                className={getRoomColor(getRoomRisk('B1'), selectedRoom === 'B1')}
                strokeWidth="2"
                onClick={() => onSelect('B1')}
                whileHover={{ opacity: 0.8 }}
              />
              <motion.path
                d="M 318.4 270 L 471.3 270 L 471.3 470 L 318.4 470 Z"
                className={getRoomColor(getRoomRisk('B2'), selectedRoom === 'B2')}
                strokeWidth="2"
                onClick={() => onSelect('B2')}
                whileHover={{ opacity: 0.8 }}
              />
              <motion.path
                d="M 471.3 270 L 624.2 270 L 624.2 470 L 471.3 470 Z"
                className={getRoomColor(getRoomRisk('B3'), selectedRoom === 'B3')}
                strokeWidth="2"
                onClick={() => onSelect('B3')}
                whileHover={{ opacity: 0.8 }}
              />
              <motion.path
                d="M 624.2 270 L 777.1 270 L 777.1 470 L 624.2 470 Z"
                className={getRoomColor(getRoomRisk('B4'), selectedRoom === 'B4')}
                strokeWidth="2"
                onClick={() => onSelect('B4')}
                whileHover={{ opacity: 0.8 }}
              />
              <motion.path
                d="M 777.1 270 L 930 270 L 930 470 L 777.1 470 Z"
                className={getRoomColor(getRoomRisk('B5'), selectedRoom === 'B5')}
                strokeWidth="2"
                onClick={() => onSelect('B5')}
                whileHover={{ opacity: 0.8 }}
              />

              <motion.path
                d="M 10 250 L 88.5 140"
                fill="none"
                stroke="#0f172a"
                strokeWidth="4"
              />
              <motion.path
                d="M 10 250 L 88.5 360"
                fill="none"
                stroke="#0f172a"
                strokeWidth="4"
              />
            </g>

            <g fill="none" stroke="#0f172a" strokeWidth="4" strokeLinecap="square">
              <path d="M 88.5 30 L 930 30" />
              <path d="M 88.5 230 L 176.5 230" />
              <path d="M 226.5 230 L 365.95 230" />
              <path d="M 415.95 230 L 492.33 230" />
              <path d="M 542.33 230 L 592.17 230" />
              <path d="M 642.17 230 L 718.55 230" />
              <path d="M 768.55 230 L 820 230" />
              <path d="M 820 140 L 930 140" />
              
              <path d="M 88.5 30 L 88.5 230" />
              <path d="M 314.5 30 L 314.5 230" />
              <path d="M 467.4 30 L 467.4 230" />
              <path d="M 567.25 30 L 567.25 230" />
              <path d="M 667.1 30 L 667.1 230" />
              <path d="M 820 30 L 820 230" />
              <path d="M 930 30 L 930 470" />

              <path d="M 165.5 470 L 930 470" />
              <path d="M 165.5 270 L 217 270" />
              <path d="M 267 270 L 369.9 270" />
              <path d="M 419.9 270 L 522.8 270" />
              <path d="M 572.8 270 L 675.7 270" />
              <path d="M 725.7 270 L 828.6 270" />
              <path d="M 878.6 270 L 930 270" />

              <path d="M 165.5 270 L 165.5 470" />
              <path d="M 318.4 270 L 318.4 470" />
              <path d="M 471.3 270 L 471.3 470" />
              <path d="M 624.2 270 L 624.2 470" />
              <path d="M 777.1 270 L 777.1 470" />
              
              <path d="M 88.5 360 L 165.5 360" />
            </g>

            <g fill="none" strokeWidth="4" strokeLinecap="square">
              {/* Door threshold highlights */}
              <path d="M 176.5 230 L 226.5 230" stroke={getDoorStroke()} />
              <path d="M 365.95 230 L 415.95 230" stroke={getDoorStroke()} />
              <path d="M 492.33 230 L 542.33 230" stroke={getDoorStroke()} />
              <path d="M 592.17 230 L 642.17 230" stroke={getDoorStroke()} />
              <path d="M 718.55 230 L 768.55 230" stroke={getDoorStroke()} />
              <path d="M 217 270 L 267 270" stroke={getDoorStroke()} />
              <path d="M 369.9 270 L 419.9 270" stroke={getDoorStroke()} />
              <path d="M 522.8 270 L 572.8 270" stroke={getDoorStroke()} />
              <path d="M 675.7 270 L 725.7 270" stroke={getDoorStroke()} />
              <path d="M 828.6 270 L 878.6 270" stroke={getDoorStroke()} />
            </g>

            <g stroke="#cbd5e1" strokeWidth="1">
              <rect x="940" y="50" width="60" height="150" fill="#f8fafc" stroke="#e2e8f0" />
              {[...Array(8)].map((_, i) => (
                <line key={`st1-${i}`} x1="940" y1={50 + i * 18} x2="1000" y2={50 + i * 18} />
              ))}
              <path d="M 970 180 L 970 70 L 965 80 M 970 70 L 975 80" stroke="#64748b" strokeWidth="2" fill="none" />
              
              <rect x="940" y="410" width="60" height="60" fill="#f8fafc" stroke="#e2e8f0" />
              {[...Array(6)].map((_, i) => (
                <line key={`sb1-${i}`} x1={940 + i * 12} y1="410" x2={940 + i * 12} y2="470" />
              ))}
              <path d="M 952 440 L 988 440 L 978 435 M 988 440 L 978 445" stroke="#64748b" strokeWidth="2" fill="none" />
              <text x="970" y="40" textAnchor="middle" fontSize="13" fontWeight="700" fill="#000000" style={{ animation: 'none' }}>3F</text>
              <text x="970" y="492" textAnchor="middle" fontSize="13" fontWeight="700" fill="#000000" style={{ animation: 'none' }}>1F</text>
            </g>

            <g pointerEvents="none" className="select-none">
              <text x="500" y="255" fill="#808080" fontSize="12" fontWeight="700" textAnchor="middle">MAIN CORRIDOR</text>
            </g>

            <g pointerEvents="none">
              {Object.entries(westWingRooms).map(([id, room]) => {
                if (room.type !== 'patient') return null;
                const coords: Record<string, [number, number]> = {
                  T1: [106.5, 50], T2: [332.5, 50], T3: [485.4, 50], T4: [585.25, 50], T5: [685.1, 50],
                  B1: [183.5, 290], B2: [336.4, 290], B3: [489.3, 290], B4: [642.2, 290], B5: [795.1, 290]
                };
                const [cx, cy] = coords[id] || [0, 0];
                if (cx === 0) return null;

                return (
                  <circle
                    key={`status-${id}`}
                    cx={cx}
                    cy={cy}
                    r="6"
                    fill={getRoomDotFill(getRoomRisk(id))}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                );
              })}
            </g>

            <g>
              {bedLayoutsWithResidents.map(({ roomId, bed, index, resident }) => {
                const cx = bed.x + bed.width / 2;
                const cy = bed.y + bed.height / 2;
                const rotation = bed.rotation ?? 0;
                const labelOffset = 0;
                const bedFill = bedFillByRisk[resident.risk];
                return (
                  <g
                    key={`${roomId}-bed-${index}`}
                    onClick={() => onBedSelect(resident.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onBedSelect(resident.id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`${resident.name} 선택`}
                    style={{ cursor: 'pointer' }}
                  >
                    <g transform={`rotate(${rotation} ${cx} ${cy})`}>
                      <rect
                        x={bed.x}
                        y={bed.y}
                        width={bed.width}
                        height={bed.height}
                        rx={bedRadius}
                        fill={bedFill}
                        stroke="#0f172a"
                        strokeWidth="2"
                      />
                      <rect
                        x={bed.x + (bed.width - bedPillowWidth) / 2}
                        y={bed.y + bedPillowInset}
                        width={bedPillowWidth}
                        height={bedPillowHeight}
                        rx={bedPillowHeight / 2}
                        fill="#f8fafc"
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                      />
                    </g>
                    <text
                      x={cx}
                      y={cy - 6}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="14"
                      fontWeight="600"
                      fill="#334155"
                      style={{ pointerEvents: 'none' }}
                    >
                      {resident.name}
                    </text>
                    <text
                      x={cx}
                      y={cy + 12}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="13"
                      fontWeight="600"
                      fill={resident.risk === 'critical' ? '#ef4444' : '#475569'}
                      style={{ pointerEvents: 'none' }}
                    >
                      {resident.score.toFixed(1)}
                    </text>
                  </g>
                );
              })}
            </g>

          </svg>
        </div>

        <div className="mt-6 flex flex-wrap gap-4 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span>High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Moderate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>Low</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoomDetailOverlay({
  room,
  onClose,
  onAdjustEnvironment
}: {
  room: WestWingRoom;
  onClose: () => void;
  onAdjustEnvironment: (
    roomId: string,
    key: 'targetTemperature' | 'targetHumidity',
    delta: number
  ) => void;
}) {
  const env = room.environment ?? defaultRoomEnvironment;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="absolute inset-0 z-20"
    >
      <div className="h-full w-full rounded-2xl border border-slate-100 bg-white p-6 shadow-lg flex flex-col">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800">{room.name}</h3>
            <span className="text-sm text-slate-500">환경 설정</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-400 rotate-180" />
          </button>
        </div>

        <div className="space-y-6">
          <section className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">온도</p>
                <span className="text-xs text-slate-500">현재 {env.temperature.toFixed(1)}°C</span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  className="h-8 w-8 rounded-full border border-slate-200 bg-white text-slate-500"
                  onClick={() => onAdjustEnvironment(room.id, 'targetTemperature', -0.5)}
                >
                  -
                </button>
                <span className="text-lg font-bold text-slate-800">{env.targetTemperature}°C</span>
                <button
                  type="button"
                  className="h-8 w-8 rounded-full border border-slate-200 bg-white text-slate-500"
                  onClick={() => onAdjustEnvironment(room.id, 'targetTemperature', 0.5)}
                >
                  +
                </button>
              </div>
              <p className="mt-2 text-xs text-center text-slate-400">권장 24~26°C</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">습도</p>
                <span className="text-xs text-slate-500">현재 {env.humidity}%</span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  className="h-8 w-8 rounded-full border border-slate-200 bg-white text-slate-500"
                  onClick={() => onAdjustEnvironment(room.id, 'targetHumidity', -1)}
                >
                  -
                </button>
                <span className="text-lg font-bold text-slate-800">{env.targetHumidity}%</span>
                <button
                  type="button"
                  className="h-8 w-8 rounded-full border border-slate-200 bg-white text-slate-500"
                  onClick={() => onAdjustEnvironment(room.id, 'targetHumidity', 1)}
                >
                  +
                </button>
              </div>
              <p className="mt-2 text-xs text-center text-slate-400">권장 40~50%</p>
            </div>
          </section>
          <div className="rounded-xl border border-slate-100 bg-white p-4 text-xs text-slate-500">
            설정 변경은 관리자 승인 후 적용됩니다.
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
          >
            설정 저장
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ResidentDetailOverlay({
  resident,
  detail,
  onClose
}: {
  resident: Resident;
  detail: ResidentDetail | null;
  onClose: () => void;
}) {
  const riskLabelMap: Record<Resident['risk'], string> = {
    critical: '위험',
    high: '주의',
    moderate: '보통',
    low: '양호'
  };
  const riskToneMap: Record<Resident['risk'], { badge: string; text: string }> = {
    critical: { badge: 'bg-red-100 text-red-700', text: 'text-red-600' },
    high: { badge: 'bg-amber-100 text-amber-700', text: 'text-amber-600' },
    moderate: { badge: 'bg-sky-100 text-sky-700', text: 'text-sky-600' },
    low: { badge: 'bg-emerald-100 text-emerald-700', text: 'text-emerald-600' }
  };
  const tones = riskToneMap[resident.risk];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="absolute inset-0 z-20"
    >
      <div className="h-full w-full rounded-2xl border border-slate-100 bg-white p-6 shadow-lg flex flex-col">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-xl font-bold text-slate-800">{resident.name}</h3>
            <p className="text-sm text-slate-500">{resident.room} · {resident.age}세 · {resident.gender}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-400 rotate-180" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tones.badge}`}>
            {riskLabelMap[resident.risk]}
          </span>
          <span className={`text-sm font-semibold ${tones.text}`}>감염 취약도 {resident.score.toFixed(1)}</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">기저질환</p>
            <p className="mt-2 text-sm text-slate-700">
              {detail?.conditions?.length ? detail.conditions.join(', ') : '기록 없음'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">복용 약</p>
            <p className="mt-2 text-sm text-slate-700">
              {detail?.meds?.length ? detail.meds.join(', ') : '기록 없음'}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-100 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">특이사항</p>
          <p className="mt-2 text-sm text-slate-600">
            {detail?.actions?.length ? detail.actions[0].title : '추가 알림 없음'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
