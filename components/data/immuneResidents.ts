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
  { id: 'r-105', name: '윤미경', room: '203호', age: 92, gender: '여', risk: 'high', score: 48.9 },
  { id: 'r-103', name: '정민호', room: '201호', age: 79, gender: '남', risk: 'high', score: 38.7 },
  { id: 'r-104', name: '최영자', room: '202호', age: 84, gender: '여', risk: 'high', score: 42.1 },
  { id: 'r-106', name: '한상철', room: '202호', age: 76, gender: '남', risk: 'moderate', score: 55.8 },
  { id: 'r-107', name: '이순자', room: '201호', age: 91, gender: '여', risk: 'critical', score: 27.3  },
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
    baseImmunity: 69,
    envMultiplier: 3.28,
    personalAdjust: -18,
    labs: [
      { name: 'Albumin', value: '3.03 (3.5-5.5 g/dL)', status: 'abnormal'},
      { name: 'Lymphocyte', value: '17.58 (20-40 %)',  status: 'abnormal'},
      { name: 'CRP', value: '6.5 (0-5 mg/L)', status: 'abnormal'},
      { name: 'Total Protein', value: '104.7 (60-83 g/L)', status:'borderline'}
    ],
    actions: [
      { level: 'warning', title: '창가 외풍 차단 상태 점검', desc: '실내 온도 20-24도 유지' },
      { level: 'warning', title: '가습기 가동 및 물 보충 여부 확인', desc: '실내 습도 40-60% 유지' },
      { level: 'urgent', title: ' 커튼(물리적 차단막) 활용 및 격리실 배정 고려', desc: '감염병 발생 시 감염 취약군 관리' },
      { level: 'info', title: '매일 2회 체온 측정', desc: '37.5°C 이상 시 즉시 보고' }
    ]
  },
  'r-105': {
    conditions: ['뇌혈관질환 후유증', '류마티스 관절염'],
    meds: [],
    baseImmunity: 69,
    envMultiplier: 3.28,
    personalAdjust: -18,
    labs: [
      { name: 'Albumin', value: '3.03 (3.5-5.5 g/dL)', status: 'abnormal'},
      { name: 'Lymphocyte', value: '17.58 (20-40 %)',  status: 'abnormal'},
      { name: 'CRP', value: '6.5 (0-5 mg/L)', status: 'abnormal'},
      { name: 'Total Protein', value: '104.7 (60-83 g/L)', status:'borderline'}
    ],
    actions: [
      { level: 'warning', title: '창가 외풍 차단 상태 점검', desc: '실내 온도 20-24도 유지' },
      { level: 'warning', title: '가습기 가동 및 물 보충 여부 확인', desc: '실내 습도 40-60% 유지' },
      { level: 'urgent', title: ' 커튼(물리적 차단막) 활용 및 격리실 배정 고려', desc: '감염병 발생 시 감염 취약군 관리' },
      { level: 'info', title: '매일 2회 체온 측정', desc: '37.5°C 이상 시 즉시 보고' }
    ]
  }
};
