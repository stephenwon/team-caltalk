# Team CalTalk 📅💬

> 팀 기반 일정 관리 및 실시간 커뮤니케이션 플랫폼

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17.6-blue.svg)](https://www.postgresql.org/)

## 📋 목차

- [프로젝트 소개](#프로젝트-소개)
- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [시작하기](#시작하기)
- [사용 방법](#사용-방법)
- [프로젝트 구조](#프로젝트-구조)
- [API 문서](#api-문서)
- [테스트](#테스트)
- [개발 가이드](#개발-가이드)
- [기여하기](#기여하기)
- [라이선스](#라이선스)

## 프로젝트 소개

**Team CalTalk**는 팀 중심의 협업을 위한 올인원 플랫폼입니다. 일정 관리와 실시간 커뮤니케이션을 하나의 플랫폼에서 제공하여, 팀원들이 효율적으로 협업할 수 있도록 돕습니다.

### 왜 Team CalTalk인가?

- **통합 협업**: 일정 관리와 채팅을 한 곳에서
- **권한 기반 관리**: 팀장/팀원 역할 구분으로 체계적인 팀 운영
- **지능형 충돌 감지**: PostgreSQL GIST 인덱스 기반 일정 겹침 자동 감지
- **실시간 동기화**: Long Polling을 통한 즉각적인 업데이트

### 목표

- 3,000개 팀 (30,000명 동시 사용자) 지원
- 5일 MVP 개발
- 직관적이고 빠른 사용자 경험

## 주요 기능

### 1. 사용자 인증
- JWT 기반 안전한 인증 시스템
- 회원가입 및 로그인
- 자동 세션 관리

### 2. 팀 관리
- 팀 생성 및 고유 초대 코드 자동 생성
- 초대 코드를 통한 간편한 팀원 초대
- 팀장/팀원 역할 기반 권한 관리

### 3. 일정 관리
- 개인 및 팀 일정 생성
- 캘린더 UI로 직관적인 일정 확인
- **지능형 충돌 감지**: GIST 인덱스 기반 시간 겹침 자동 감지
- 일정별 참가자 관리
- 최대 7일 기간 일정 지원

### 4. 실시간 채팅
- Long Polling 방식의 실시간 메시지 전달 (30초 타임아웃)
- 팀별 채팅방
- 일정별 대화 스레드
- 메시지 타입: 일반, 일정 변경 요청, 승인/거절

### 5. 일정 변경 요청 워크플로우
- 팀원의 일정 변경 요청
- 팀장의 승인/거절
- 실시간 알림

## 기술 스택

### Backend

| 카테고리 | 기술 |
|---------|------|
| **런타임** | Node.js 18+ |
| **프레임워크** | Express 4.18 |
| **데이터베이스** | PostgreSQL 17.6 (btree_gist 확장) |
| **인증** | JWT + bcrypt |
| **검증** | Joi |
| **보안** | Helmet, CORS, Express Rate Limit |
| **로깅** | Winston + Morgan |
| **API 문서** | Swagger (OpenAPI 3.0.3) |
| **테스트** | Jest + Supertest |

### Frontend

| 카테고리 | 기술 |
|---------|------|
| **프레임워크** | React 18.3 + TypeScript 5.8 |
| **빌드 도구** | Vite 7.1 |
| **상태 관리** | Zustand 5.0 (클라이언트), TanStack Query 5.90 (서버) |
| **UI** | Tailwind CSS 3.4 + shadcn/ui |
| **라우팅** | React Router 7.9 |
| **폼 관리** | React Hook Form + Zod |
| **날짜 처리** | date-fns 4.1 |
| **캘린더** | React Big Calendar 1.19 |
| **테스트** | Vitest + Testing Library |

### Database

- **PostgreSQL 17.6** with btree_gist extension
- **GIST 인덱스** for efficient schedule conflict detection
- **21개 인덱스** for query optimization
- **3개 트리거** for automatic timestamp updates
- **Connection pooling** for concurrent requests

## 시작하기

### Prerequisites

다음 소프트웨어가 설치되어 있어야 합니다:

- **Node.js** 18.0.0 이상
- **npm** 8.0.0 이상
- **PostgreSQL** 17.6 이상
- **Git**

### 설치

1. **저장소 클론**

```bash
git clone https://github.com/stephenwon/team-caltalk.git
cd team-caltalk
```

2. **데이터베이스 설정**

```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE team_caltalk;
\c team_caltalk

# btree_gist 확장 활성화
CREATE EXTENSION IF NOT EXISTS btree_gist;

# 스키마 실행
\i database/schema.sql

# 테이블 확인
\dt
```

3. **백엔드 설정**

```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 데이터베이스 연결 정보 입력

# 개발 서버 실행
npm run dev
```

**필수 환경 변수** (`backend/.env`):

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=team_caltalk
DB_USER=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

4. **프론트엔드 설정**

```bash
cd ../frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

5. **애플리케이션 접속**

- **프론트엔드**: http://localhost:5173
- **백엔드 API**: http://localhost:3000
- **Swagger UI**: http://localhost:3000/api/docs

## 사용 방법

### 1. 회원가입 및 로그인

1. 브라우저에서 http://localhost:5173 접속
2. **회원가입** 버튼 클릭
3. 이메일과 비밀번호 입력 후 가입
4. 자동으로 로그인 페이지로 이동
5. 로그인 후 대시보드 접속

### 2. 팀 생성하기 (팀장)

1. 대시보드에서 **"팀 생성"** 버튼 클릭
2. 팀 이름과 설명 입력
3. **생성** 버튼 클릭
4. 자동으로 생성된 **6자리 초대 코드** 확인
5. 초대 코드를 팀원들에게 공유

### 3. 팀 참여하기 (팀원)

1. 대시보드에서 **"팀 참여"** 버튼 클릭
2. 팀장으로부터 받은 **초대 코드** 입력
3. **참여하기** 버튼 클릭
4. 팀 멤버십 자동 생성

### 4. 일정 생성하기

**팀장만 팀 일정 생성 가능**

1. 캘린더 페이지로 이동
2. **"+ 새 일정"** 버튼 클릭
3. 일정 정보 입력:
   - 일정 제목 (필수, 2-100자)
   - 시작/종료 날짜 및 시간
   - 설명 (선택사항)
   - 참가자 선택 (팀원 목록에서)
4. **저장** 버튼 클릭

**일정 충돌 감지:**
- 다른 일정과 시간이 겹치면 HTTP 409 Conflict 응답
- 사용자에게 명확한 에러 메시지 표시
- 충돌 발생 시 일정 생성 차단

### 5. 실시간 채팅

1. 팀을 선택하면 우측에 채팅 패널 표시
2. 메시지 입력창에 메시지 작성
3. Enter로 전송, Shift+Enter로 줄바꿈
4. Long Polling으로 실시간 메시지 수신 (1초 이내)

### 6. 일정 변경 요청 (팀원)

1. 변경이 필요한 경우 채팅으로 요청
2. 또는 **"일정 변경 요청"** 기능 사용
3. 팀장에게 자동 알림 전송
4. 팀장의 승인/거절 대기

## 프로젝트 구조

```
team-caltalk/
├── backend/                 # 백엔드 서버
│   ├── src/
│   │   ├── routes/         # API 라우트 (auth, teams, schedules, chat, poll, users)
│   │   ├── middleware/     # 인증, 검증, rate-limiting, 에러 처리
│   │   ├── services/       # 비즈니스 로직 (AuthService, EventService)
│   │   ├── models/         # 데이터 모델 (User, Team, Schedule, Message)
│   │   ├── database/       # 커넥션 풀링, 마이그레이션, 시드
│   │   ├── utils/          # 유틸리티 함수
│   │   ├── config/         # 설정 파일
│   │   └── server.js       # 서버 진입점
│   ├── tests/              # 테스트 (unit, integration)
│   └── package.json
│
├── frontend/               # 프론트엔드 애플리케이션
│   ├── src/
│   │   ├── components/     # 재사용 가능한 UI 컴포넌트
│   │   │   ├── common/     # 공통 컴포넌트
│   │   │   ├── calendar/   # 캘린더 컴포넌트
│   │   │   ├── chat/       # 채팅 컴포넌트
│   │   │   └── Layout/     # 레이아웃
│   │   ├── pages/          # 페이지 컴포넌트 (9개 페이지)
│   │   ├── stores/         # Zustand 스토어 (auth, team, chat)
│   │   ├── services/       # API 서비스 레이어 (5개 서비스)
│   │   ├── hooks/          # 커스텀 훅 (useAuth, useSchedules, useChat, useRealtime)
│   │   ├── types/          # TypeScript 타입 정의
│   │   ├── utils/          # 유틸리티 함수
│   │   └── App.tsx         # 앱 진입점
│   └── package.json
│
├── database/               # 데이터베이스 스키마 및 마이그레이션
│   ├── schema.sql          # PostgreSQL 스키마
│   └── seed.sql            # 시드 데이터
│
├── docs/                   # 프로젝트 문서
│   ├── 1-domain-definition.md
│   ├── 2-PRD.md
│   ├── 3-user-scenarios.md
│   ├── 4-project-architecture-principles.md
│   └── 7-execution-plan.md
│
├── test/                   # E2E 테스트 결과
│   └── e2e/
│       ├── test-report.md  # 상세 테스트 보고서
│       └── *.png           # 스크린샷 (20개)
│
├── swagger/                # API 문서
│   └── swagger.json        # OpenAPI 3.0.3 명세
│
├── CLAUDE.md              # AI 개발 가이드라인
└── README.md              # 이 파일
```

## API 문서

### RESTful Endpoints

#### 인증 (Authentication)

```
POST   /api/auth/register     # 회원가입
POST   /api/auth/login        # 로그인
POST   /api/auth/logout       # 로그아웃
POST   /api/auth/refresh      # 토큰 갱신
```

#### 팀 (Teams)

```
POST   /api/teams                      # 팀 생성
GET    /api/teams/:id                  # 팀 조회
PUT    /api/teams/:id                  # 팀 수정
DELETE /api/teams/:id                  # 팀 삭제
POST   /api/teams/join                 # 팀 참여 (초대 코드)
POST   /api/teams/:id/leave            # 팀 탈퇴
GET    /api/teams/:id/members          # 팀원 목록
DELETE /api/teams/:id/members/:userId  # 팀원 제거
POST   /api/teams/:id/regenerate-code  # 초대 코드 재생성
```

#### 일정 (Schedules)

```
GET    /api/schedules                  # 일정 목록
POST   /api/schedules                  # 일정 생성
GET    /api/schedules/:id              # 일정 조회
PUT    /api/schedules/:id              # 일정 수정
DELETE /api/schedules/:id              # 일정 삭제
POST   /api/schedules/check-conflict   # 충돌 검사
```

#### 채팅 (Chat)

```
GET    /api/chat/teams/:id/messages            # 메시지 목록
POST   /api/chat/teams/:id/messages            # 메시지 전송
PUT    /api/chat/messages/:id                  # 메시지 수정
DELETE /api/chat/messages/:id                  # 메시지 삭제
POST   /api/chat/teams/:id/messages/:id/read   # 읽음 처리
GET    /api/chat/teams/:id/unread-count        # 안 읽은 메시지 수
```

#### Long Polling

```
GET    /api/poll                       # 실시간 업데이트 폴링
POST   /api/poll/disconnect            # 연결 해제
```

#### 사용자 (Users)

```
GET    /api/users/profile              # 내 프로필
GET    /api/users/teams                # 내가 속한 팀 목록
GET    /api/users/:id                  # 사용자 조회
GET    /api/users/search/:query        # 사용자 검색
```

### API 응답 포맷

**성공 응답:**

```json
{
  "success": true,
  "data": {...},
  "message": "성공",
  "timestamp": "2025-10-19T10:30:00Z"
}
```

**에러 응답:**

```json
{
  "success": false,
  "error": {
    "code": "SCHEDULE_CONFLICT",
    "message": "일정이 겹칩니다",
    "details": {...}
  },
  "timestamp": "2025-10-19T10:30:00Z"
}
```

### Swagger UI

상세한 API 문서는 Swagger UI에서 확인하세요:
- http://localhost:3000/api/docs

## 테스트

### E2E 테스트 결과

✅ **전체 테스트**: 통과
✅ **테스트 시나리오**: 4개 완료
📸 **스크린샷**: 20개 캡처됨

**테스트한 시나리오:**

1. **시나리오 1**: 신규 팀 생성 및 팀원 초대
   - 김개발 회원가입 및 팀 생성
   - 초대 코드 "SZU3CS" 자동 생성
   - 이코더 회원가입 및 팀 참여

2. **시나리오 2**: 일정 관리
   - 김개발(팀장)이 "주간 스프린트 계획" 일정 생성
   - 캘린더에 즉시 반영

3. **시나리오 3**: 일정 충돌 감지
   - 겹치는 시간대 일정 생성 시도
   - HTTP 409 Conflict 응답 정상 반환
   - GIST 인덱스 기반 충돌 감지 작동

4. **시나리오 4**: 권한 제한 및 예외 처리
   - 팀장/팀원 역할 구분 검증
   - 팀장만 팀 일정 생성/수정 가능

**상세 테스트 보고서**: [test/e2e/test-report.md](test/e2e/test-report.md)

### 백엔드 테스트

```bash
cd backend

# 단위 테스트
npm run test:unit

# 커버리지 포함 전체 테스트
npm run test:coverage

# Lint 검사
npm run lint
```

### 프론트엔드 테스트

```bash
cd frontend

# 단위 테스트
npm run test:unit

# 커버리지 포함 테스트
npm run test:coverage

# 타입 체크
npm run type-check

# Lint 검사
npm run lint
```

## 개발 가이드

### 백엔드 개발

- **오버엔지니어링 금지**: 지침에 있는 기능만 정확하게 구현
- **SOLID 원칙** 반드시 준수
- **Clean Architecture** 반드시 적용
- 모든 소통, 주석, 에러 메시지, 문서화는 **한국어**로

**코드 스타일:**
- ESLint + Prettier 설정 준수
- 네이밍: kebab-case (파일), camelCase (변수/함수), UPPER_SNAKE_CASE (상수)

### 프론트엔드 개발

- **단일 책임 원칙**: 각 컴포넌트는 하나의 역할만
- **재사용성**: 공통 UI는 `components/ui/`에 분리
- **타입 안정성**: 모든 Props는 TypeScript 인터페이스로 정의

**상태 관리 전략:**
- 로컬 상태 우선: `useState` 사용
- 전역 상태 최소화: Zustand는 auth, team, chat만
- 서버 상태 분리: TanStack Query로 API 데이터 관리

### 데이터베이스

**주요 테이블:**
- `users`: 사용자 인증 및 프로필
- `teams`: 팀 정보 (고유 초대 코드)
- `team_members`: 팀 멤버십 (role: leader/member)
- `schedules`: 일정 (최대 7일 기간)
- `schedule_participants`: 일정 참가자
- `messages`: 채팅 메시지

**성능 최적화:**
- GIST 인덱스: `tsrange(start_datetime, end_datetime)` for 충돌 감지
- 21개 인덱스로 쿼리 성능 최적화
- Connection pooling (min: 2, max: 20)

## 성능 목표

- **일정 조회**: < 2초
- **메시지 전달**: < 1초
- **API 응답**: < 100ms (단순), < 50ms (복잡한 조인)
- **동시 사용자**: 30,000명 (3,000팀 × 평균 10명)

## 보안

- **인증**: JWT + bcrypt (12 rounds)
- **입력 검증**: Joi 스키마
- **SQL 인젝션 방지**: Prepared statements
- **XSS 보호**: Helmet
- **Rate Limiting**: 15분당 100 요청
- **CORS**: 개발/프로덕션 분리 설정

## 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

**코딩 컨벤션:**
- ESLint 및 Prettier 설정 준수
- 커밋 메시지는 Conventional Commits 형식
- 모든 문서화는 한국어로

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 문의

프로젝트 링크: [https://github.com/stephenwon/team-caltalk](https://github.com/stephenwon/team-caltalk)

---

**Made with ❤️ by Team CalTalk**
