import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { 
  Users, 
  HeartPulse,
  AlertTriangle,
  Syringe,
  ArrowUp,
  ArrowDown,
  Minus,
  Mail, 
  Phone, 
  MessageSquare,
  ArrowRight,
  Upload,
  FileText,
  BarChart3
} from 'lucide-react';

type RiskLevel = 'critical' | 'high' | 'moderate' | 'low';

export function Dashboard() {
  const metrics = [
    {
      title: '전체 재원 어르신',
      value: '118 명',
      detail: '(입원 2명 제외)',
      statusLabel: '상태: 정상',
      statusColor: 'bg-emerald-500',
      statusText: 'text-emerald-600',
      trend: 'flat',
      icon: Users
    },
    {
      title: '오늘 면역 주의군',
      value: '5 명 (▲2)',
      detail: '전일 대비 2명 증가',
      statusLabel: '상태: 주의',
      statusColor: 'bg-red-500',
      statusText: 'text-red-600',
      trend: 'up',
      icon: HeartPulse
    },
    {
      title: '현재 격리/집중관리',
      value: '3 명 (독감 2, 코로나 1)',
      detail: '302호, 501호 집중 모니터링',
      statusLabel: '상태: 경고',
      statusColor: 'bg-orange-500',
      statusText: 'text-orange-600',
      trend: 'down',
      icon: AlertTriangle
    },
    {
      title: '시즌 백신 접종률',
      value: '92% (대상자 115/125)',
      detail: '미접종 10명 확인 필요',
      statusLabel: '상태: 양호',
      statusColor: 'bg-blue-500',
      statusText: 'text-blue-600',
      trend: 'flat',
      icon: Syringe
    }
  ];
  const riskSummaryStyles: Record<RiskLevel, { text: string; border: string }> = {
    critical: { text: 'text-red-600', border: 'border-l-red-500' },
    high: { text: 'text-orange-600', border: 'border-l-orange-500' },
    moderate: { text: 'text-amber-600', border: 'border-l-amber-500' },
    low: { text: 'text-emerald-600', border: 'border-l-emerald-500' }
  };
  const riskSummaryStats = [
    { key: 'critical', label: 'CRITICAL (0-30)', value: 5, delta: '+2', trend: 'up' },
    { key: 'high', label: 'HIGH (30-50)', value: 5, delta: '변동 없음', trend: 'flat' },
    { key: 'moderate', label: 'MODERATE (50-70)', value: 6, delta: '-1', trend: 'down' },
    { key: 'low', label: 'LOW (70-100)', value: 4, delta: '-1', trend: 'down' }
  ] as const;
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
    },
    {
      label: '천식질환지수',
      status: '경고',
      tone: 'text-amber-500',
      ring: 'border-amber-400',
      face: '😷'
    },
    {
      label: '심뇌혈관질환지수',
      status: '위험',
      tone: 'text-red-500',
      ring: 'border-red-400',
      face: '❤️‍🩹'
    }
  ];
  const today = new Date();
  const formatTwo = (value: number) => value.toString().padStart(2, '0');
  const updateLabel = `${today.getFullYear()}.${formatTwo(today.getMonth() + 1)}.${formatTwo(today.getDate())} 09:00 업데이트`;
  const seriesConfig = {
    '30d': {
      label: '최근 30일',
      points: [
        58, 60, 61, 59, 62, 64, 63, 65, 67, 66,
        68, 69, 70, 69, 71, 72, 70, 73, 74, 73,
        75, 76, 77, 76, 78, 79, 80, 82, 83, 85
      ],
      labelFn: (index: number) => {
        const date = new Date(today);
        date.setDate(today.getDate() - 29 + index);
        return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
      }
    },
    '7d': {
      label: '최근 7일',
      points: [62, 68, 70, 75, 72, 80, 85],
      labelFn: (index: number) => {
        const date = new Date(today);
        date.setDate(today.getDate() - 6 + index);
        return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
      }
    },
    '6h': {
      label: '최근 6시간',
      points: [72, 74, 73, 76, 79, 82],
      labelFn: (index: number) => {
        const date = new Date(today);
        date.setHours(today.getHours() - 5 + index);
        return date.toLocaleTimeString('ko-KR', { hour: 'numeric' });
      }
    }
  } as const;
  const [selectedRange, setSelectedRange] = useState<keyof typeof seriesConfig>('7d');
  const selectedSeries = seriesConfig[selectedRange];
  const immuneSnapshots = selectedSeries.points.map((score, index) => ({
    score,
    residents: 118 + (index % 3 === 0 ? 1 : 0),
    caution: 4 + (index % 4 === 0 ? 1 : 0),
    temperature: 23 + (index % 3),
    humidity: selectedRange === '6h' ? 35 + index : 25 + (index % 6)
  }));
  const immuneScoreTrend = immuneSnapshots.map((snapshot, index) => ({
    label: selectedSeries.labelFn(index),
    value: snapshot.score,
    ...snapshot
  }));
  const trendValues = immuneScoreTrend.map((item) => item.value);
  const minTrend = Math.min(...trendValues);
  const maxTrend = Math.max(...trendValues);
  const chartPadding = 6;
  const chartSpan = 100 - chartPadding * 2;
  const range = Math.max(maxTrend - minTrend, 1);
  const trendCoordinates = immuneScoreTrend.map((item, index) => {
    const x = chartPadding + (index / (immuneScoreTrend.length - 1)) * chartSpan;
    const y = chartPadding + (1 - (item.value - minTrend) / range) * chartSpan;
    return { x, y, value: item.value, label: item.label };
  });
  const trendPoints = trendCoordinates.map((point) => `${point.x},${point.y}`).join(' ');
  const trendDeltas = immuneScoreTrend.map((item, index) =>
    index === 0 ? 0 : item.value - immuneScoreTrend[index - 1].value
  );
  const shouldShowAxisLabel = (index: number) => {
    if (selectedRange === '30d') {
      return index % 5 === 0 || index === immuneScoreTrend.length - 1;
    }
    return true;
  };
  const currentScore = immuneScoreTrend[immuneScoreTrend.length - 1].value;
  const scoreDelta = currentScore - immuneScoreTrend[0].value;
  const scoreDeltaLabel = `${scoreDelta >= 0 ? '+' : ''}${scoreDelta}`;
  const scoreTrendLabel = scoreDelta > 0 ? '상승' : scoreDelta < 0 ? '하락' : '유지';
  const scoreTrendColor =
    scoreDelta > 0 ? 'text-emerald-600' : scoreDelta < 0 ? 'text-red-600' : 'text-muted-foreground';
  const getRiskTrendTone = (key: RiskLevel, trend: 'up' | 'down' | 'flat') => {
    if (trend === 'flat') {
      return 'text-muted-foreground';
    }
    if (key === 'low') {
      return trend === 'up' ? 'text-emerald-600' : 'text-red-600';
    }
    if (key === 'moderate') {
      return trend === 'down' ? 'text-emerald-600' : 'text-red-600';
    }
    return trend === 'up' ? 'text-red-600' : 'text-emerald-600';
  };

  const recentActivity = [
    { action: 'Payment received', amount: '$1,250', customer: 'Smith Corp', time: '2m ago' },
    { action: 'Email sequence completed', customer: 'Johnson LLC', time: '15m ago' },
    { action: 'New import processed', details: '450 records', time: '1h ago' },
    { action: 'Campaign started', customer: 'Anderson Inc', time: '2h ago' }
  ];

  const channelStats = [
    { name: 'Email', sent: 1250, opened: 845, responded: 234, icon: Mail, color: 'bg-blue-500' },
    { name: 'SMS', sent: 680, opened: 612, responded: 156, icon: MessageSquare, color: 'bg-green-500' },
    { name: 'Voice', sent: 320, opened: 298, responded: 89, icon: Phone, color: 'bg-purple-500' }
  ];

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>이기조 Nursing home Immunization system</h1>
          <p className="text-muted-foreground">Overview of your collections performance</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">로그아웃</Button>
          {/* <Button variant="outline">설정</Button> */}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const TrendIcon = metric.trend === 'up'
            ? ArrowUp
            : metric.trend === 'down'
              ? ArrowDown
              : Minus;
          return (
            <Card key={metric.title}>
              <CardHeader className="gap-1 pb-1 pt-4 px-5">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-[21px] font-semibold text-foreground">{metric.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1 px-5 pb-4">
                <div className="text-xl font-semibold text-foreground">{metric.value}</div>
                <p className="text-sm text-muted-foreground">{metric.detail}</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className={`h-2.5 w-2.5 rounded-full ${metric.statusColor}`}></span>
                  <TrendIcon className={`h-3.5 w-3.5 ${metric.statusText}`} />
                  <span className={metric.statusText}>{metric.statusLabel}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Immune Management Summary */}
      <Card>
        <CardHeader className="border-b border-border pb-2 pt-4 px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-lg">
                🧬
              </div>
              <div>
                <CardTitle className="text-[23px]">면역 관리 요약 대시보드</CardTitle>
                <p className="text-sm text-muted-foreground"></p>
              </div>
            </div>
            <div className="flex gap-2">
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-5 pt-4 pb-5">
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 lg:items-stretch">
            <div className="space-y-2">
              <p className="text-[21px] font-semibold text-muted-foreground">현재 상태 요약</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="rounded-lg border border-border p-3 space-y-1">
                  <p className="text-sm text-muted-foreground">시설 감염 취약도</p>
                  <p className="text-2xl font-semibold text-emerald-600">안전</p>
                  <p className="text-sm text-muted-foreground">(현재 면역 점수: 85점)</p>
                </div>
                <div className="rounded-lg border border-border p-3 space-y-1">
                  <p className="text-sm text-muted-foreground">실내 환경 모니터</p>
                  <p className="text-sm">온도: <span className="text-foreground">24°C</span> (적정)</p>
                  <p className="text-sm">습도: <span className="text-orange-600">25%</span> (건조)</p>
                  <p className="text-sm">실내 미세먼지: <span className="text-foreground">28㎍/㎥</span></p>
                  <p className="text-sm">CO₂ 농도: <span className="text-foreground">720ppm</span></p>
                </div>
                <div className="rounded-lg border border-border p-3 space-y-1">
                  <p className="text-sm text-muted-foreground">외부 위험요인</p>
                  <p className="text-sm">계절: <span className="">겨울</span> ❄️</p>
                  <p className="text-sm">독감 유행: <span className="text-red-600">O</span></p>
                  <p className="text-sm">PM10: <span className="text-foreground">42㎍/㎥</span></p>
                  <p className="text-sm">PM2.5: <span className="text-foreground">18㎍/㎥</span></p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 lg:h-full">
              <p className="text-[21px] font-semibold text-muted-foreground">환자 집단 통계</p>
              <div className="rounded-lg border border-border p-3 space-y-2 text-sm lg:flex-1">
                <p>👥 전체 인원: 50명 / 고위험군: 5명 / 발열 환자: 2명</p>
                <p>🩺 주요 만성질환 보유 비율: 65%</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[21px] font-semibold text-muted-foreground">시설 면역 점수 변화</p>
            <div className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  {(['30d', '7d', '6h'] as const).map((range) => (
                    <Button
                      key={range}
                      variant={selectedRange === range ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedRange(range)}
                    >
                      {range === '30d' ? '30일' : range === '7d' ? '7일' : '6시간'}
                    </Button>
                  ))}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{selectedSeries.label} 추이</p>
                    <p className="text-base font-semibold text-foreground">현재 {currentScore}점</p>
                  </div>
                  <span className={`text-sm font-semibold ${scoreTrendColor}`}>
                    {scoreDeltaLabel} {scoreTrendLabel}
                  </span>
                </div>
              </div>
              <div className="relative h-40 w-full overflow-visible">
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="absolute inset-0 h-full w-full"
                >
                  <defs>
                    <linearGradient id="immuneScoreFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polygon
                    points={`${chartPadding},${100 - chartPadding} ${trendPoints} ${100 - chartPadding},${100 - chartPadding}`}
                    fill="url(#immuneScoreFill)"
                  />
                  {trendCoordinates.slice(1).map((point, index) => {
                    const prev = trendCoordinates[index];
                    const delta = trendDeltas[index + 1];
                    const segmentColor =
                      delta <= -5 ? '#ef4444' : delta < 0 ? '#f59e0b' : '#10b981';
                    return (
                      <path
                        key={`${prev.label}-${point.label}`}
                        d={`M ${prev.x} ${prev.y} L ${point.x} ${point.y}`}
                        fill="none"
                        stroke={segmentColor}
                        strokeWidth="3"
                        vectorEffect="non-scaling-stroke"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    );
                  })}
                </svg>
                {trendCoordinates.map((point, index) => {
                  const snapshot = immuneScoreTrend[index];
                  const delta = trendDeltas[index];
                  const pointColor =
                    delta <= -5 ? 'bg-red-500' : delta < 0 ? 'bg-orange-500' : 'bg-emerald-500';
                  return (
                    <div
                      key={point.label}
                      className="absolute group"
                      style={{ left: `${point.x}%`, top: `${point.y}%` }}
                    >
                      <span className={`block h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${pointColor} ring-2 ring-white`}></span>
                      <div className="pointer-events-none absolute left-1/2 top-0 z-10 w-56 -translate-x-1/2 -translate-y-[110%] rounded-lg border border-border bg-white/95 p-3 text-xs text-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                        <p className="mb-2 text-sm font-semibold">{snapshot.label}</p>
                        <div className="space-y-1 text-muted-foreground">
                          <p>재원 어르신: <span className="font-semibold text-foreground">{snapshot.residents}명</span></p>
                          <p>면역 주의군 수: <span className="font-semibold text-foreground">{snapshot.caution}명</span></p>
                          <p>
                            실내 환경 모니터:
                            <span className="font-semibold text-foreground"> {snapshot.temperature}°C / {snapshot.humidity}%</span>
                          </p>
                          <p>면역 점수: <span className="font-semibold text-foreground">{snapshot.value}점</span></p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="relative h-6 text-xs text-muted-foreground">
                {trendCoordinates.map((point, index) => (
                  <span
                    key={point.label}
                    className="absolute -translate-x-1/2"
                    style={{
                      left: `${point.x}%`,
                      opacity: shouldShowAxisLabel(index) ? 1 : 0
                    }}
                  >
                    {immuneScoreTrend[index].label}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {riskSummaryStats.map((stat) => {
                const risk = riskSummaryStyles[stat.key];
                return (
                  <Card key={stat.key} className={`border-l-4 ${risk.border}`}>
                    <CardHeader className="pb-0">
                      <CardTitle className="text-[19px] font-semibold text-muted-foreground">{stat.label}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className={`text-4xl sm:text-5xl font-semibold ${risk.text}`}>{stat.value}</div>
                      <p className={`text-xs ${getRiskTrendTone(stat.key, stat.trend)}`}>
                        {stat.trend === 'up' ? '▲' : stat.trend === 'down' ? '▼' : '―'} {stat.delta}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Health Indices */}
        <Card>
          <CardHeader className="pb-1 pt-4 px-5">
            <div className="flex items-center gap-2">
              <CardTitle className="text-[23px]">오늘의 생활·보건 지수</CardTitle>
              <span className="text-xs text-muted-foreground">ⓘ</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-5 pb-4">
            <div className="flex flex-wrap justify-between gap-4">
              {healthIndices.map((item) => (
                <div key={item.label} className="flex min-w-[96px] flex-1 flex-col items-center gap-2">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-full border-4 ${item.ring} ${item.tone} text-lg`}>
                    {item.face}
                  </div>
                  <span className={`text-xs font-semibold ${item.tone}`}>{item.status}</span>
                  <span className="text-center text-xs text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              기상청, 국민건강보험공단 발표, 웨더아이 제공 · {updateLabel}
            </p>
          </CardContent>
        </Card>

        {/* Admin Alerts */}
        <Card>
          <CardHeader className="pb-1 pt-4 px-5">
            <CardTitle className="text-[23px]">관리자 알림</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-5 pb-4 text-sm">
            <div className="rounded-lg border border-border p-3 space-y-1.5">
              <div className="flex gap-2">
                <span>⚠️</span>
                <div className="space-y-1">
                  <p>[경고] 현재 '독감' 유행 중입니다. 면회객 통제 수준을 강화하세요.</p>
                  <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                    <li>발열 확인, 호흡기 증상 확인하여 기록</li>
                    <li>출입시에는 마스크 착용 및 손위생 실시</li>
                  </ul>
                </div>
              </div>
              <div className="h-3"></div>
              <div className="flex gap-2">
                <span>💡</span>
                <div className="space-y-1">
                  <p>[권고] 실내 습도가 낮습니다. 가습기 가동 및 환기 시간을 조정하세요.</p>
                  <p className="text-xs text-muted-foreground">권장 습도: 40~50%를 유지하세요</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Channel Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[23px]">Channel Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {channelStats.map((channel) => {
              const Icon = channel.icon;
              const responseRate = ((channel.responded / channel.sent) * 100).toFixed(1);
              
              return (
                <div key={channel.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${channel.color} flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{channel.name}</p>
                      <p className="text-sm text-muted-foreground">{channel.sent} sent</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{responseRate}%</p>
                    <p className="text-sm text-muted-foreground">response rate</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-[23px]">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.customer || activity.details}
                  </p>
                </div>
                <div className="text-right">
                  {activity.amount && (
                    <p className="font-medium text-green-600">{activity.amount}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[23px]">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-24 flex-col gap-2">
              <Upload className="w-6 h-6" />
              Import Data
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2">
              <FileText className="w-6 h-6" />
              New Template
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2">
              <Users className="w-6 h-6" />
              Create Campaign
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2">
              <BarChart3 className="w-6 h-6" />
              View Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
