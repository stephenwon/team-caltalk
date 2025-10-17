# Team CalTalk Frontend

## 프로젝트 개요

Team CalTalk의 프론트엔드 애플리케이션입니다. React 18 + TypeScript + Vite를 기반으로 구축되었습니다.

## 기술 스택

- **프레임워크**: React 18.2.0
- **언어**: TypeScript 5.3+
- **빌드 도구**: Vite 5.4.0
- **상태 관리**:
  - Zustand 4.5.0 (전역 상태)
  - TanStack Query 5.28.0 (서버 상태)
- **라우팅**: React Router v6.22.0
- **스타일링**: Tailwind CSS 3.4.0
- **HTTP 클라이언트**: Axios 1.6.0

## 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

개발 서버가 http://localhost:5173 에서 실행됩니다.

### 프로덕션 빌드

```bash
npm run build
```

### 빌드 결과물 미리보기

```bash
npm run preview
```

## 프로젝트 구조

```
src/
├── components/
│   ├── common/          # 공통 컴포넌트
│   └── layout/          # 레이아웃 컴포넌트
├── pages/               # 페이지 컴포넌트
├── services/            # API 서비스 레이어
├── stores/              # Zustand 스토어
├── hooks/               # 커스텀 훅
├── lib/                 # 유틸리티 함수
├── types/               # TypeScript 타입 정의
└── constants/           # 상수 정의
```

## 환경 설정

백엔드 API는 Vite 프록시를 통해 `/api` 경로로 접근할 수 있습니다.

- 개발 환경: http://localhost:5173/api → http://localhost:3000/api
- 백엔드 서버는 포트 3000에서 실행 중이어야 합니다.

## Issue #6 완료 사항

### ✅ 구현 완료

- [x] Vite + React + TypeScript 프로젝트 생성
- [x] 필수 의존성 설치 및 설정
- [x] Tailwind CSS 설정
- [x] TypeScript 및 Vite 설정
- [x] 폴더 구조 생성
- [x] 기본 라우팅 설정
- [x] TanStack Query 설정
- [x] 프로덕션 빌드 성공

### 📦 설치된 주요 패키지

- react: ^18.2.0
- react-router-dom: ^6.22.0
- zustand: ^4.5.0
- @tanstack/react-query: ^5.28.0
- axios: ^1.6.0
- tailwindcss: ^3.4.0

## 다음 단계 (Stage 7-11)

1. **Stage 7**: 인증 UI (로그인/회원가입)
2. **Stage 8**: 팀 관리 UI
3. **Stage 9**: 캘린더 UI
4. **Stage 10**: 채팅 UI
5. **Stage 11**: 대시보드

## 빌드 결과

```
✓ 81 modules transformed
dist/index.html                  0.47 kB │ gzip:  0.30 kB
dist/assets/index-D7sUujDW.css   5.90 kB │ gzip:  1.74 kB
dist/assets/index-C5YWc0Ls.js  187.21 kB │ gzip: 60.11 kB
✓ built in 3.92s
```

## 라이선스

MIT
