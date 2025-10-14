# CLAUDE.md

## 🚨 핵심 작업 원칙

- 오버엔지니어링 금지
- 모든 소통,주석,에러메시, 문서화는 한국어로

---

## 프로젝트 개요

**Team CalTalk**는 팀 중심의 일정 관리와 실시간 커뮤니케이션을 통합한 협업 플랫폼입니다. 5일 MVP 개발 목표로 3,000개 팀(30,000명 동시 사용자) 지원을 목표로 합니다.

**핵심 기능:**

- 사용자 인증 (JWT 기반)
- 초대 코드를 통한 팀 관리
- 충돌 감지 기능이 있는 일정 관리
- Long Polling을 통한 실시간 채팅 (30초 타임아웃)
- 일정 변경 요청 워크플로우 (팀원 → 팀장 승인)

## 기술 스택

### 백엔드

- **런타임**: Node.js 24.7
- **프레임워크**: Express 4.19
- **데이터베이스**: PostgreSQL 17.6 (btree_gist 확장 포함)
- **인증**: JWT + bcrypt
- **검증**: joi
- **보안**: helmet, cors, express-rate-limit

### 프론트엔드

- **프레임워크**: React 18.2.0 + TypeScript 5.0
- **빌드 도구**: Vite 5.4
- **상태 관리**: Zustand 4.5 (클라이언트 상태), TanStack Query 5.28 (서버 상태)
- **UI**: Tailwind CSS 3.4 + shadcn/ui
- **라우팅**: React Router v6.22

## 개발 명령어

### Mock 서버 (현재 상태)

```bash
# Mock API 서버 실행
cd mockup
npm install
node server.js
# Swagger UI 접속: http://localhost:3000/docs
# Mock API 엔드포인트: http://localhost:3000/api/*
```

### 데이터베이스 설정 (구현 시)

```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE team_caltalk_dev;
\c team_caltalk_dev

# 스키마 실행
\i database/schema.sql

# 테이블 확인
\dt
```

### 백엔드 (구현 시)

```bash
cd backend
npm install

# 핫 리로드 개발 서버
npm run dev

# 프로덕션 빌드
npm start

# 테스트 실행
npm test
npm run test:integration
```

### 프론트엔드 (구현 시)

```bash
cd frontend
npm install

# 개발 서버
npm run dev

# 프로덕션 빌드
npm run build
npm run preview

# 테스트 실행
npm test
npm run test:e2e
```

## 아키텍처 원칙

### Clean Architecture 계층

```
클라이언트 계층 (React SPA)
  ↓
API 계층 (Express REST + Long Poll)
  ↓
비즈니스 계층 (서비스 로직 + 검증)
  ↓
데이터 계층 (PostgreSQL + 모델)
```

### 주요 설계 패턴

**백엔드 구조:**

- `routes/` - API 라우트 정의 (auth, teams, schedules, messages, poll, activities, users)
- `middleware/` - 인증, 검증, rate-limiting, 에러 처리
- `services/` - 비즈니스 로직 (AuthService, EventService)
- `models/` - 데이터 모델 (User, Team, Schedule, Message)
- `database/` - 커넥션 풀링, 마이그레이션, 시드

**프론트엔드 구조:**

- `components/` - 재사용 가능한 UI 컴포넌트 (common/, calendar/, chat/, Layout/)
- `pages/` - 페이지 컴포넌트 (9개 페이지)
- `stores/` - Zustand 스토어 (auth, team, chat)
- `services/` - API 서비스 레이어 (5개 서비스)
- `hooks/` - 커스텀 훅 (useAuth, useSchedules, useChat, useRealtime)

### 상태 관리 전략

- **로컬 상태 우선**: 컴포넌트 내부 상태는 useState 사용
- **전역 상태 최소화**: Zustand는 auth, team, chat만 사용 (2.5kb 번들)
- **서버 상태 분리**: TanStack Query로 API 데이터 캐싱 및 동기화
- **영속성**: Zustand persist 미들웨어로 localStorage 동기화 (인증 토큰)

## 데이터베이스 스키마 하이라이트

### 핵심 테이블

1. **users** - 사용자 인증 및 프로필
2. **teams** - 고유 초대 코드가 있는 팀 정보
3. **team_members** - 역할(팀장/팀원)이 있는 팀 멤버십
4. **schedules** - 개인 및 팀 일정 (최대 7일 기간)
5. **schedule_participants** - 일정 참가자 추적
6. **messages** - 날짜별 분리된 팀 채팅 메시지

### 성능 기능

- **GIST 인덱스**: 일정 충돌 감지를 위한 `tsrange(start_datetime, end_datetime)`
- **21개 인덱스** - 쿼리 성능 최적화
- **3개 트리거** - 자동 타임스탬프 업데이트
- **2개 뷰** - 자주 조회되는 조인 데이터
- **커넥션 풀링** - 동시 요청 처리

### 주요 함수

- `check_schedule_conflict()` - GIST 인덱스를 사용한 시간 겹침 감지
- `generate_invite_code()` - 고유한 6자리 팀 초대 코드 생성

## API 설계

### RESTful 엔드포인트 패턴

```
/api/auth/*           - 인증 (회원가입, 로그인, 로그아웃, 토큰 갱신)
/api/teams/*          - 팀 관리 (CRUD, 초대, 멤버)
/api/teams/:id/schedules/*  - 일정 관리 (CRUD, 충돌 감지)
/api/teams/:id/messages/*   - 채팅 메시지 (전송, 날짜별 조회)
/api/teams/:id/poll         - 실시간 업데이트를 위한 Long polling
/api/activities             - 최근 활동 대시보드
```

### 응답 포맷

```json
{
  "success": true,
  "data": {...},
  "message": "성공",
  "timestamp": "2025-10-14T10:30:00Z"
}
```

### 에러 포맷

```json
{
  "success": false,
  "error": {
    "code": "SCHEDULE_CONFLICT",
    "message": "일정이 겹칩니다",
    "details": {...}
  },
  "timestamp": "2025-10-14T10:30:00Z"
}
```

## 실시간 통신

### Long Polling 구현

- **클라이언트**: `/api/teams/:id/poll`에 30초 타임아웃 폴링
- **서버**: 새 메시지가 도착하거나 타임아웃까지 요청 유지
- **재시도**: 연결 실패 시 3초 대기
- **성능 목표**: 1초 이내 메시지 전달

### 메시지 타입

- `normal` - 일반 채팅 메시지
- `schedule_request` - 팀원의 일정 변경 요청
- `schedule_approved` - 팀장의 요청 승인
- `schedule_rejected` - 팀장의 요청 거절

## 보안 요구사항

### 인증 플로우

1. 사용자 회원가입/로그인 → JWT 토큰 발급
2. Zustand에 토큰 저장 (localStorage에 영속화)
3. 모든 보호된 API 호출에 `Authorization: Bearer <token>` 포함
4. 토큰 만료 시 갱신 또는 재로그인 필요

### 권한 규칙

- **팀장**: 팀 일정 전체 CRUD, 팀 관리, 요청 승인/거절
- **팀원**: 팀 일정 읽기 전용, 개인 일정 전체 CRUD, 변경 요청
- **팀 격리**: 팀 간 엄격한 데이터 분리 (미들웨어에서 강제)

### 보안 조치

- bcrypt를 통한 비밀번호 해싱 (12 rounds)
- Prepared statements (SQL 인젝션 방지)
- joi 스키마를 통한 입력 검증
- helmet을 통한 XSS 보호
- Rate limiting (15분당 100 요청)
- CORS 설정 (개발/프로덕션 분리)

## 성능 목표

- **일정 조회**: < 2초
- **메시지 전달**: < 1초
- **API 응답**: < 100ms (단순), < 50ms (복잡한 조인)
- **동시 사용자**: 30,000명 (3,000팀 × 평균 10명)

## 테스트 전략

### 테스트 피라미드 (MVP)

- **단위 테스트** (Jest): 비즈니스 로직 (최소 80% 커버리지)
- **통합 테스트** (Jest + Supertest): API 엔드포인트 (100% 성공/실패 케이스)
- **E2E 테스트** (Playwright): 핵심 사용자 시나리오 (최소한, 중요 경로만)

### 중요 테스트 시나리오

1. 사용자 회원가입 → 팀 생성 → 멤버 초대 → 일정 생성
2. 팀원의 일정 변경 요청 → 팀장 승인
3. 겹치는 시간에 대한 일정 충돌 감지
4. Long Polling을 통한 실시간 메시지 전달
5. 권한 강제 (팀장 vs 팀원 역할)

## 코드 품질 기준

### 네이밍 규칙

- **파일**: kebab-case (예: `user-service.js`)
- **React 컴포넌트**: PascalCase (예: `TeamCalendar.jsx`)
- **변수/함수**: camelCase (예: `getUserById`)
- **상수**: UPPER_SNAKE_CASE (예: `MAX_TEAM_SIZE`)

### 코드 구성

- **컴포넌트 구조**: Import → 타입 → 상수 → 컴포넌트 → 헬퍼 → 이벤트 핸들러 → 렌더 → Export
- **의존성 규칙**: 단방향 하향 의존성 (순환 참조 금지)
- **모듈 분리**: Auth → Database, Schedule → Auth + Database, Chat → Auth + Database

## 환경 설정

### 필수 환경 변수

```bash
# Backend (.env)
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=team_caltalk_dev
DB_USER=caltalk_user
DB_PASSWORD=<secure_password>
JWT_SECRET=<secure_random_string>
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### 빌드 및 배포

```bash
# 백엔드 프로덕션 빌드
npm run build
npm start

# 프론트엔드 프로덕션 빌드
npm run build
npm run preview

# Docker (향후 확장)
docker-compose up -d
```

## 구현 로드맵

이 프로젝트는 11단계 실행 계획을 따릅니다 (`docs/7-execution-plan.md` 참조):

1. 데이터베이스 설정 (PostgreSQL 17.6 + 스키마)
2. 백엔드 기반 + 인증
3. 팀 관리 API
4. 일정 관리 API
5. 실시간 채팅 시스템
6. 프론트엔드 기반 (React + Vite)
7. 인증 UI
8. 팀 관리 UI
9. 캘린더 UI
10. 채팅 UI
11. 대시보드

**현재 상태**: Swagger UI가 있는 Mock 서버 (0단계)
**다음 단계**: 데이터베이스 설정 → 백엔드 인증 → 팀/일정 API

## 중요 제약사항

- **일정 기간**: 일정당 최대 7일
- **메시지 길이**: 최대 500자
- **팀 크기**: 팀당 2-50명
- **일정 제목**: 2-100자
- **팀 이름**: 2-30자

## 문서 참조

- **도메인 정의**: `docs/1-domain-definition.md`
- **PRD**: `docs/2-PRD.md`
- **아키텍처 원칙**: `docs/4-project-architecture-principles.md`
- **실행 계획**: `docs/7-execution-plan.md`
- **데이터베이스 스키마**: `database/schema.sql`
- **API 명세**: `swagger/swagger.json` (OpenAPI 3.0.3)
- **Swagger UI**: http://localhost:3000/docs (mock 서버 실행 시)

## 이 프로젝트에서 작업할 때

1. **실행 계획 확인** (`docs/7-execution-plan.md`)에서 현재 단계와 체크리스트 확인
2. **아키텍처 원칙 준수** (`docs/4-project-architecture-principles.md` 참조)
3. **PRD 검증** (`docs/2-PRD.md`)에서 기능 요구사항 확인
4. **데이터베이스 스키마 사용** (`database/schema.sql`)을 데이터 모델의 기준으로 사용
5. **Swagger 명세 참조** (`swagger/swagger.json`)에서 API 계약 확인
6. **보안 규칙 강제** (팀 격리, 역할 기반 권한, 입력 검증)
7. **성능 목표 달성** (< 2초 일정 조회, < 1초 메시지 전달)
8. **테스트 커버리지 유지** (80% 단위, API 100% 통합)
