import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  FileText,
  HeartPulse,
  MessageSquare,
  Search,
  Users
} from 'lucide-react';

export function ComplianceCenter() {
  const now = new Date();
  const updateLabel = `${now.toLocaleDateString('ko-KR')} ${now.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit'
  })}`;

  const overviewCards = [
    {
      title: '고위험군',
      value: '5명',
      detail: '격리 1명 포함',
      icon: AlertTriangle,
      tone: 'text-red-600'
    },
    {
      title: '근무중 직원',
      value: '28명',
      detail: '야간 6명 포함',
      icon: Users,
      tone: 'text-blue-600'
    },
    {
      title: '환경 경보',
      value: '2건',
      detail: 'CO₂ · 습도',
      icon: BarChart3,
      tone: 'text-amber-600'
    },
    {
      title: '보호자 요청',
      value: '7건',
      detail: '미처리 3건',
      icon: MessageSquare,
      tone: 'text-emerald-600'
    }
  ];

  const patientStatus = [
    {
      id: 'P-102',
      name: '김영숙',
      room: '201호',
      careLevel: '2등급',
      vitals: '혈압 128/78 · 체온 36.6°C',
      risk: '정상',
      lastCheck: '09:10',
      notes: '식사 완료 · 산책 예정'
    },
    {
      id: 'P-114',
      name: '박준호',
      room: '305호',
      careLevel: '3등급',
      vitals: '혈압 142/85 · 체온 37.4°C',
      risk: '주의',
      lastCheck: '08:45',
      notes: '가벼운 기침 · 수분 섭취 강조'
    },
    {
      id: 'P-087',
      name: '이정희',
      room: '401호',
      careLevel: '1등급',
      vitals: '산소포화도 93% · 체온 37.8°C',
      risk: '경고',
      lastCheck: '09:05',
      notes: '호흡 모니터링 필요'
    },
    {
      id: 'P-133',
      name: '최문식',
      room: '210호',
      careLevel: '2등급',
      vitals: '혈압 118/70 · 체온 36.4°C',
      risk: '정상',
      lastCheck: '08:30',
      notes: '물리치료 대기'
    },
    {
      id: 'P-096',
      name: '정미자',
      room: '318호',
      careLevel: '3등급',
      vitals: '혈압 136/80 · 체온 36.9°C',
      risk: '주의',
      lastCheck: '09:00',
      notes: '야간 수면 부족'
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

  const staffOverview = [
    { team: '간호팀', onDuty: 9, leave: 1, training: 1, note: '신규 교육 1명' },
    { team: '요양보호팀', onDuty: 14, leave: 2, training: 0, note: '대체근무 1명' },
    { team: '재활팀', onDuty: 3, leave: 0, training: 1, note: '외부 진료 동행' },
    { team: '조리·위생', onDuty: 4, leave: 0, training: 0, note: '정상 운영' }
  ];

  const patientOverview = [
    { label: '안정', count: '83명', detail: '식사·수면 양호' },
    { label: '주의', count: '12명', detail: '낙상 위험 4명' },
    { label: '중점관리', count: '5명', detail: '발열 2명 · 호흡 1명' },
    { label: '격리', count: '1명', detail: '감염 관리 대상' }
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
    낮음: 'bg-emerald-100 text-emerald-700 border-emerald-200'
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
          <p className="text-muted-foreground">
          </p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {overviewCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-semibold text-muted-foreground">{card.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${card.tone}`} />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-semibold text-foreground">{card.value}</div>
                <p className="text-sm text-muted-foreground">{card.detail}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <HeartPulse className="w-5 h-5" />
              어르신 개인별 상태
            </CardTitle>
            <Button variant="outline" size="sm">
              개별 기록 열기
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="어르신 또는 생활실 검색"
                className="pl-10 border border-border bg-white"
              />
            </div>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option>전체 위험도</option>
              <option>정상</option>
              <option>주의</option>
              <option>경고</option>
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option>전체 생활실</option>
              <option>2층</option>
              <option>3층</option>
              <option>4층</option>
            </select>
            <Button variant="outline" size="sm">
              필터 적용
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">어르신</th>
                  <th className="text-left p-3">생활실</th>
                  <th className="text-left p-3">케어 등급</th>
                  <th className="text-left p-3">오늘 상태</th>
                  <th className="text-left p-3">위험도</th>
                  <th className="text-left p-3">최근 확인</th>
                  <th className="text-left p-3">비고</th>
                  <th className="text-left p-3">작업</th>
                </tr>
              </thead>
              <tbody>
                {patientStatus.map((patient) => (
                  <tr key={patient.id} className="border-b odd:bg-muted hover:bg-muted/80">
                    <td className="p-3 font-medium">{patient.name}</td>
                    <td className="p-3 text-muted-foreground">{patient.room}</td>
                    <td className="p-3">{patient.careLevel}</td>
                    <td className="p-3">{patient.vitals}</td>
                    <td className="p-3">{renderBadge(patient.risk)}</td>
                    <td className="p-3 text-muted-foreground">{patient.lastCheck}</td>
                    <td className="p-3 text-muted-foreground">{patient.notes}</td>
                    <td className="p-3">
                      <Button size="sm" variant="ghost">
                        기록 보기
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              직원 전자 근태 기록 관리
            </CardTitle>
            <Button variant="outline" size="sm">
              근태 기록 내보내기
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {attendanceSummary.map((item) => (
              <div key={item.label} className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-lg font-semibold text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
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

      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              생활실 환경 모니터링
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_1.4fr]">
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              직원 및 어르신 상태 요약
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">직원 운영 현황</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">팀</th>
                      <th className="text-left p-3">근무중</th>
                      <th className="text-left p-3">휴가</th>
                      <th className="text-left p-3">교육/외부</th>
                      <th className="text-left p-3">비고</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffOverview.map((team) => (
                      <tr key={team.team} className="border-b odd:bg-muted hover:bg-muted/80">
                        <td className="p-3 font-medium">{team.team}</td>
                        <td className="p-3">{team.onDuty}명</td>
                        <td className="p-3">{team.leave}명</td>
                        <td className="p-3">{team.training}명</td>
                        <td className="p-3 text-muted-foreground">{team.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">어르신 상태 요약</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {patientOverview.map((item) => (
                  <div key={item.label} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.label}</span>
                      {renderBadge(item.label === '안정' ? '정상' : item.label === '주의' ? '주의' : item.label)}
                    </div>
                    <p className="text-lg font-semibold text-foreground">{item.count}</p>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                보호자 요구사항
              </CardTitle>
              <Button variant="outline" size="sm">
                요청 관리
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
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
    </div>
  );
}
