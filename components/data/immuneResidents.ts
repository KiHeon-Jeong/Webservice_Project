export type RiskLevel = 'critical' | 'high' | 'moderate' | 'low';

export type Resident = {
  id: string;
  name: string;
  room: string;
  age: number;
  gender: '남' | '여';
  risk: RiskLevel;
  score: number;
};

export type ResidentDetail = {
  conditions: string[];
  meds: string[];
  baseImmunity: number;
  envMultiplier: number;
  personalAdjust: number;
  labs: Array<{ name: string; value: string; ref: string; status: 'normal' | 'borderline' | 'abnormal' }>;
  actions: Array<{ level: 'urgent' | 'warning' | 'info'; title: string; desc: string }>;
};

export const residents: Resident[] = [
  { id: 'r-101', name: '김영희', room: '201호', age: 87, gender: '여', risk: 'critical', score: 18.2 },
  { id: 'r-102', name: '박철수', room: '201호', age: 82, gender: '남', risk: 'critical', score: 24.5 },
  { id: 'r-105', name: '이순자', room: '201호', age: 91, gender: '여', risk: 'critical', score: 27.3 },
  { id: 'r-103', name: '정민호', room: '201호', age: 79, gender: '남', risk: 'high', score: 38.7 },
  { id: 'r-104', name: '최영자', room: '202호', age: 84, gender: '여', risk: 'high', score: 42.1 },
  { id: 'r-106', name: '한상철', room: '202호', age: 76, gender: '남', risk: 'moderate', score: 55.8 },
  { id: 'r-107', name: '윤미경', room: '203호', age: 81, gender: '여', risk: 'moderate', score: 61.2 },
  { id: 'r-108', name: '강태영', room: '204호', age: 74, gender: '남', risk: 'low', score: 78.4 },
  { id: 'r-109', name: '서정희', room: '205호', age: 72, gender: '여', risk: 'low', score: 82.6 },
  { id: 'r-110', name: '이수현', room: '205호', age: 80, gender: '여', risk: 'moderate', score: 58.9 },
  { id: 'r-111', name: '오춘자', room: '206호', age: 90, gender: '여', risk: 'critical', score: 21.4 },
  { id: 'r-112', name: '김정수', room: '206호', age: 77, gender: '남', risk: 'high', score: 41.8 },
  { id: 'r-113', name: '문선희', room: '207호', age: 83, gender: '여', risk: 'moderate', score: 63.1 },
  { id: 'r-114', name: '배현수', room: '207호', age: 69, gender: '남', risk: 'low', score: 84.9 },
  { id: 'r-115', name: '황미정', room: '208호', age: 86, gender: '여', risk: 'high', score: 36.5 },
  { id: 'r-116', name: '권태식', room: '208호', age: 78, gender: '남', risk: 'moderate', score: 52.7 },
  { id: 'r-117', name: '서영란', room: '209호', age: 92, gender: '여', risk: 'critical', score: 19.6 },
  { id: 'r-118', name: '양기성', room: '209호', age: 73, gender: '남', risk: 'low', score: 76.2 },
  { id: 'r-119', name: '이인주', room: '210호', age: 81, gender: '여', risk: 'high', score: 44.3 },
  { id: 'r-120', name: '유정훈', room: '210호', age: 75, gender: '남', risk: 'moderate', score: 57.4 }
];

export const residentDetails: Record<string, ResidentDetail> = {
  'r-101': {
    conditions: ['치매', '심부전', '당뇨'],
    meds: [],
    baseImmunity: 53,
    envMultiplier: 3.28,
    personalAdjust: -18,
    labs: [
      { name: 'Albumin', value: '2.9', ref: '정상: 3.5-5.0', status: 'abnormal' },
      { name: 'Lymphocyte', value: '1,100', ref: '정상: 1,500+', status: 'abnormal' },
      { name: 'CRP', value: '8.5', ref: '정상: <5.0', status: 'abnormal' },
      { name: 'Total Protein', value: '6.2', ref: '정상: 6.0-8.0', status: 'borderline' }
    ],
    actions: [
      { level: 'urgent', title: '독감 예방접종 즉시 실시', desc: '미접종 상태 · 보건소 연계 필요' },
      { level: 'urgent', title: '격리실 배정 고려', desc: '다인실 감염 전파 위험 높음' },
      { level: 'warning', title: '단백질 보충 강화', desc: 'Albumin 수치 개선 필요 (20g/일)' },
      { level: 'info', title: '매일 2회 체온 측정', desc: '37.5°C 이상 시 즉시 보고' }
    ]
  }
};
