# Webservice Project (Vite + React)

요양원 운영 대시보드와 면역/영양 관리 흐름을 포함한 프론트엔드 프로젝트입니다.

**기술 스택**
- React 18
- Vite 5
- TypeScript
- Tailwind CSS
- Radix UI

**실행 방법**
1. 의존성 설치
```
npm install
```
2. 개발 서버 실행
```
npm run dev
```

## 백엔드 연동 (면역/영양 모델)

모델 API 백엔드는 `backend/`에 있습니다.

1. 백엔드 의존성 설치
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

2. 백엔드 실행 (`http://127.0.0.1:8000`)
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

3. 프론트 실행 (`web/` 루트)
```bash
npm run dev
```

프론트는 `/api/immune`, `/api/nutrition` 경로를 Vite proxy로 백엔드에 전달합니다.  
백엔드가 내려가도 프론트 화면은 기본 더미/폴백 데이터로 계속 동작합니다.

**빌드**
```
npm run build
```
빌드 결과물은 `dist/`에 생성됩니다. `dist/`는 Git에 포함하지 않습니다.

**주요 페이지**
- Dashboard: 환자 병실 단면도, 요약 지표, 실시간 모니터링
- Immune: 감염 취약성 관리 및 상세 정보
- Nutrition: 영양소 리스트, 추천 영양제/음식, 제한 영양소
- Template: 메시지 템플릿 및 전송 준비
- Management: 요양원 원장 관리 센터

**주요 데이터**
- `components/data/immuneResidents.ts`: 이용자 더미 데이터 및 상세 정보

**폴더 구조**
- `components/`: 페이지 및 UI 컴포넌트
- `styles/`: 글로벌 스타일
- `public/`: 정적 파일

**배포**
- 정적 배포 기준으로 `npm run build` 후 `dist/`를 호스팅합니다.
- Vercel, Netlify, Cloudflare Pages 등에서 자동 배포 가능.

**주의사항**
- 배포 산출물(`dist/`)과 임시 리소스는 Git에 포함하지 않습니다.
