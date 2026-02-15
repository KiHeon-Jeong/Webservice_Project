import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  AlertTriangle,
  BarChart3,
  FileText,
  HeartPulse,
  MessageSquare,
  Users
} from 'lucide-react';

export function ComplianceCenter() {
  const now = new Date();
  const updateLabel = `${now.toLocaleDateString('ko-KR')} ${now.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit'
  })}`;

  const nutritionOverview = [
    { label: '구독 이용자', value: '86명', detail: '전체 118명 중' },
    { label: '이번달 신규', value: '12명', detail: '전월 대비 +3' },
    { label: '만료 예정', value: '6명', detail: '7일 내 갱신' },
    { label: '보류', value: '2명', detail: '보호자 확인 필요' }
  ];

  const nutritionPlans = [
    { plan: '면역 강화 기본', count: '42명', renewal: '2월 21일', status: '정상' },
    { plan: '맞춤 영양 프리미엄', count: '28명', renewal: '2월 18일', status: '만료예정' },
    { plan: '재활 영양 케어', count: '10명', renewal: '2월 25일', status: '정상' },
    { plan: '특별식 관리', count: '6명', renewal: '미확정', status: '보류' }
  ];

  const notices = [
    {
      id: 1,
      title: '독감 예방접종 일정 안내',
      detail: '2층 접종 진행 · 보호자 안내 발송 완료',
      type: '필독',
      date: '2026-02-18'
    },
    {
      id: 2,
      title: '야간 근무 교대 시간 변경',
      detail: '야간 교대 19:00 → 18:30 적용',
      type: '안내',
      date: '2026-02-16'
    },
    {
      id: 3,
      title: '면회실 방역 점검 예정',
      detail: '소독 작업으로 오전 10~12시 이용 제한',
      type: '필독',
      date: '2026-02-17'
    },
    {
      id: 4,
      title: '응급 대응 매뉴얼 업데이트',
      detail: '신규 대응 절차 공유 및 교육 예정',
      type: '긴급',
      date: '2026-02-19'
    }
  ];

  const attendanceSummary = [
    { label: '근무중', value: '28명', detail: '야간 6명' },
    { label: '출근 전', value: '2명', detail: '' },
    { label: '휴가', value: '3명', detail: '연차 2, 병가 1' },
    { label: '결근', value: '1명', detail: '대체근무 배정' },
    { label: '연장근무', value: '4명', detail: '1.5시간 이상' }
  ];

  const staffAttendance = [
    {
      name: '박지훈',
      role: '간호팀장',
      shift: '07:00-15:00',
      checkIn: '06:55',
      checkOut: '-',
      status: '정상',
      location: '2층 간호스테이션'
    },
    {
      name: '김소연',
      role: '요양보호사',
      shift: '07:00-19:00',
      checkIn: '07:12',
      checkOut: '-',
      status: '지각',
      location: '3층 생활실'
    },
    {
      name: '장민수',
      role: '물리치료사',
      shift: '09:00-18:00',
      checkIn: '08:57',
      checkOut: '-',
      status: '정상',
      location: '재활실'
    },
    {
      name: '오현정',
      role: '간호사',
      shift: '19:00-07:00',
      checkIn: '-',
      checkOut: '-',
      status: '결근',
      location: '대체 요청'
    },
    {
      name: '윤하늘',
      role: '영양사',
      shift: '06:30-15:30',
      checkIn: '06:25',
      checkOut: '-',
      status: '정상',
      location: '식당'
    }
  ];

  const environmentRooms = [
    {
      room: '201호',
      temperature: '24.1°C',
      humidity: '42%',
      airQuality: '좋음',
      co2: '720ppm',
      noise: '38dB',
      status: '정상',
      updated: '09:05'
    },
    {
      room: '302호',
      temperature: '25.8°C',
      humidity: '28%',
      airQuality: '보통',
      co2: '930ppm',
      noise: '41dB',
      status: '주의',
      updated: '09:02'
    },
    {
      room: '305호',
      temperature: '23.7°C',
      humidity: '48%',
      airQuality: '좋음',
      co2: '680ppm',
      noise: '35dB',
      status: '정상',
      updated: '08:58'
    },
    {
      room: '401호',
      temperature: '22.9°C',
      humidity: '55%',
      airQuality: '주의',
      co2: '1,120ppm',
      noise: '52dB',
      status: '경고',
      updated: '09:01'
    },
    {
      room: '공용 라운지',
      temperature: '24.8°C',
      humidity: '44%',
      airQuality: '보통',
      co2: '860ppm',
      noise: '55dB',
      status: '주의',
      updated: '08:55'
    },
    {
      room: '식당',
      temperature: '23.5°C',
      humidity: '46%',
      airQuality: '좋음',
      co2: '710ppm',
      noise: '39dB',
      status: '정상',
      updated: '09:07'
    }
  ];

  const environmentAlerts = [
    '401호 CO₂ 1,120ppm (환기 필요)',
    '302호 습도 28% (가습기 가동 권장)',
    '공용 라운지 소음 55dB (휴식 시간 안내)'
  ];

  const guardianRequests = [
    {
      id: 1,
      guardian: '이민정 보호자',
      patient: '김영숙',
      request: '물리치료 일정 오후로 변경',
      priority: '중간',
      status: '처리중',
      due: '오늘 15:00',
      owner: '재활팀'
    },
    {
      id: 2,
      guardian: '박소희 보호자',
      patient: '박준호',
      request: '식단 저염 변경 요청',
      priority: '높음',
      status: '대기',
      due: '오늘 12:00',
      owner: '영양팀'
    },
    {
      id: 3,
      guardian: '오민석 보호자',
      patient: '이정희',
      request: '병원 진료 결과 공유 요청',
      priority: '중간',
      status: '처리중',
      due: '내일 10:00',
      owner: '간호팀'
    },
    {
      id: 4,
      guardian: '김하늘 보호자',
      patient: '정미자',
      request: '면회 시간 조정 요청',
      priority: '낮음',
      status: '완료',
      due: '완료',
      owner: '행정팀'
    }
  ];

  const badgePalette: Record<string, string> = {
    정상: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    주의: 'bg-amber-100 text-amber-700 border-amber-200',
    경고: 'bg-red-100 text-red-700 border-red-200',
    지각: 'bg-orange-100 text-orange-700 border-orange-200',
    결근: 'bg-red-100 text-red-700 border-red-200',
    휴가: 'bg-slate-100 text-slate-700 border-slate-200',
    완료: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    처리중: 'bg-blue-100 text-blue-700 border-blue-200',
    대기: 'bg-slate-100 text-slate-700 border-slate-200',
    높음: 'bg-red-100 text-red-700 border-red-200',
    중간: 'bg-amber-100 text-amber-700 border-amber-200',
    낮음: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    필독: 'bg-red-100 text-red-700 border-red-200',
    안내: 'bg-blue-100 text-blue-700 border-blue-200',
    긴급: 'bg-red-100 text-red-700 border-red-200',
    만료예정: 'bg-amber-100 text-amber-700 border-amber-200',
    보류: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  const renderBadge = (label: string) => (
    <Badge className={badgePalette[label] ?? 'bg-slate-100 text-slate-700 border-slate-200'}>
      {label}
    </Badge>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">요양원 원장 관리 센터</h1>
          <p className="text-sm text-muted-foreground">데이터 기준: {updateLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline">알림 설정</Button>
          <Button>
            <FileText className="w-4 h-4 mr-2" />
            일일 운영 리포트
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-6">
        <div className="space-y-6">
          <Card className="xl:h-[560px] flex flex-col">
            <CardHeader className="border-b border-border">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  직원관리
                </CardTitle>
                <Button variant="outline" size="sm">
                  근태 기록 내보내기
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4 flex-1 min-h-0 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5 shrink-0">
                {attendanceSummary.map((item) => (
                  <div key={item.label} className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-lg font-semibold text-foreground">{item.value}</p>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                ))}
              </div>

              <div className="flex-1 min-h-0 overflow-auto">
                <table className="w-full min-w-[920px] text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">직원</th>
                      <th className="text-left p-3">직무</th>
                      <th className="text-left p-3">근무시간</th>
                      <th className="text-left p-3">출근</th>
                      <th className="text-left p-3">퇴근</th>
                      <th className="text-left p-3">상태</th>
                      <th className="text-left p-3">현재 위치</th>
                      <th className="text-left p-3">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffAttendance.map((staff) => (
                      <tr
                        key={`${staff.name}-${staff.shift}`}
                        className="border-b odd:bg-muted hover:bg-muted/80"
                      >
                        <td className="p-3 font-medium">{staff.name}</td>
                        <td className="p-3 text-muted-foreground">{staff.role}</td>
                        <td className="p-3">{staff.shift}</td>
                        <td className="p-3">{staff.checkIn}</td>
                        <td className="p-3">{staff.checkOut}</td>
                        <td className="p-3">{renderBadge(staff.status)}</td>
                        <td className="p-3 text-muted-foreground">{staff.location}</td>
                        <td className="p-3">
                          <Button size="sm" variant="ghost">
                            수정
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="xl:h-[360px] flex flex-col">
            <CardHeader className="border-b border-border">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  보호자 요구사항 관리
                </CardTitle>
                <Button variant="outline" size="sm">
                  요청 관리
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4 flex-1 min-h-0">
              <div className="h-full overflow-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">보호자</th>
                      <th className="text-left p-3">어르신</th>
                      <th className="text-left p-3">요청 내용</th>
                      <th className="text-left p-3">우선순위</th>
                      <th className="text-left p-3">상태</th>
                      <th className="text-left p-3">기한</th>
                      <th className="text-left p-3">담당</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guardianRequests.map((request) => (
                      <tr key={request.id} className="border-b odd:bg-muted hover:bg-muted/80">
                        <td className="p-3 font-medium">{request.guardian}</td>
                        <td className="p-3">{request.patient}</td>
                        <td className="p-3 text-muted-foreground">{request.request}</td>
                        <td className="p-3">{renderBadge(request.priority)}</td>
                        <td className="p-3">{renderBadge(request.status)}</td>
                        <td className="p-3 text-muted-foreground">{request.due}</td>
                        <td className="p-3 text-muted-foreground">{request.owner}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="xl:h-[560px] flex flex-col">
            <CardHeader className="border-b border-border">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <HeartPulse className="w-5 h-5" />
                  영양 구독서비스 현황
                </CardTitle>
                <Button variant="outline" size="sm">
                  구독 관리
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {nutritionOverview.map((item) => (
                  <div key={item.label} className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-lg font-semibold text-foreground">{item.value}</p>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {nutritionPlans.map((plan) => (
                  <div key={plan.plan} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{plan.plan}</p>
                        <p className="text-xs text-muted-foreground">
                          구독자 {plan.count} · 갱신 {plan.renewal}
                        </p>
                      </div>
                      {renderBadge(plan.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="xl:h-[360px] flex flex-col">
            <CardHeader className="border-b border-border">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  공지사항
                </CardTitle>
                <Button variant="outline" size="sm">
                  전체 보기
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 flex-1 overflow-y-auto">
              {notices.map((notice) => (
                <div key={notice.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{notice.title}</p>
                      <p className="text-xs text-muted-foreground">{notice.detail}</p>
                    </div>
                    {renderBadge(notice.type)}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{notice.date}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              생활실 전체 모니터링
            </CardTitle>
            <Button variant="outline" size="sm">
              센서 상태 보기
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {environmentRooms.map((room) => (
              <div key={room.room} className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">생활실</p>
                    <p className="text-lg font-semibold text-foreground">{room.room}</p>
                  </div>
                  {renderBadge(room.status)}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div>
                    온도 <span className="font-semibold text-foreground">{room.temperature}</span>
                  </div>
                  <div>
                    습도 <span className="font-semibold text-foreground">{room.humidity}</span>
                  </div>
                  <div>
                    공기질 <span className="font-semibold text-foreground">{room.airQuality}</span>
                  </div>
                  <div>
                    CO₂ <span className="font-semibold text-foreground">{room.co2}</span>
                  </div>
                  <div>
                    소음 <span className="font-semibold text-foreground">{room.noise}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">최근 업데이트 {room.updated}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-semibold">환경 경보</p>
            </div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {environmentAlerts.map((alert) => (
                <li key={alert}>• {alert}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
