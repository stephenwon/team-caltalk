# Team CalTalk Backend

팀 중심 일정 관리 및 실시간 채팅 플랫폼의 백엔드 서버입니다.

## 기술 스택

- **런타임**: Node.js 18+
- **프레임워크**: Express 4.19
- **데이터베이스**: PostgreSQL 17.6
- **인증**: JWT + bcrypt
- **검증**: Joi
- **로깅**: Winston
- **보안**: helmet, cors, express-rate-limit

## 프로젝트 구조

```
backend/
├── src/
│   ├── config/           # 설정 파일
│   │   ├── database.js   # PostgreSQL 커넥션 풀
│   │   ├── jwt.js        # JWT 토큰 설정
│   │   └── logger.js     # Winston 로거
│   ├── utils/            # 유틸리티
│   │   ├── response.js   # 표준 응답 포맷
│   │   ├── errors.js     # 커스텀 에러 클래스
│   │   └── validators.js # Joi 검증 스키마
│   ├── models/           # 데이터 모델
│   │   ├── User.js       # 사용자 모델
│   │   ├── Team.js       # 팀 모델
│   │   ├── Schedule.js   # 일정 모델
│   │   └── Message.js    # 메시지 모델
│   ├── middleware/       # 미들웨어
│   │   ├── auth.js       # 인증 미들웨어
│   │   ├── security.js   # 보안 미들웨어
│   │   ├── validation.js # 검증 미들웨어
│   │   └── error-handler.js # 에러 핸들러
│   ├── services/         # 비즈니스 로직
│   │   ├── auth-service.js  # 인증 서비스
│   │   └── event-service.js # Long Polling 이벤트 서비스
│   ├── routes/           # API 라우터
│   │   ├── auth.js       # 인증 라우터
│   │   ├── users.js      # 사용자 라우터
│   │   ├── teams.js      # 팀 라우터
│   │   ├── schedules.js  # 일정 라우터
│   │   ├── messages.js   # 메시지 라우터
│   │   ├── poll.js       # Long Polling 라우터
│   │   └── activities.js # 활동 라우터
│   ├── app.js            # Express 앱 설정
│   └── server.js         # 서버 엔트리포인트
├── .env                  # 환경 변수
├── .env.example          # 환경 변수 예제
├── .gitignore            # Git 제외 파일
├── package.json          # 의존성 관리
└── README.md             # 프로젝트 문서

```

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example`을 복사하여 `.env` 파일을 생성하고 값을 설정합니다.

```bash
cp .env.example .env
```

### 3. 데이터베이스 설정

PostgreSQL 데이터베이스를 생성하고 스키마를 실행합니다.

```bash
psql -U postgres
CREATE DATABASE team_caltalk_dev;
\c team_caltalk_dev
\i ../database/schema.sql
```

### 4. 서버 실행

#### 개발 모드 (Hot Reload)

```bash
npm run dev
```

#### 프로덕션 모드

```bash
npm start
```

서버는 기본적으로 `http://localhost:3001`에서 실행됩니다.

## API 엔드포인트

### 인증 (Auth)

- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/me` - 현재 사용자 정보
- `PUT /api/auth/profile` - 프로필 수정
- `PUT /api/auth/password` - 비밀번호 변경
- `DELETE /api/auth/account` - 계정 삭제

### 팀 (Teams)

- `POST /api/teams` - 팀 생성
- `GET /api/teams` - 내 팀 목록
- `GET /api/teams/:id` - 팀 상세 정보
- `PUT /api/teams/:id` - 팀 정보 수정 (팀장)
- `DELETE /api/teams/:id` - 팀 삭제 (팀장)
- `POST /api/teams/join` - 초대 코드로 팀 참여
- `POST /api/teams/:id/regenerate-code` - 초대 코드 재생성 (팀장)
- `GET /api/teams/:id/members` - 팀 멤버 목록
- `DELETE /api/teams/:teamId/members/:userId` - 팀 멤버 제거 (팀장)
- `POST /api/teams/:id/leave` - 팀 탈퇴

### 일정 (Schedules)

- `POST /api/teams/:teamId/schedules` - 일정 생성
- `GET /api/teams/:teamId/schedules` - 팀 일정 목록
- `GET /api/schedules/:id` - 일정 상세 정보
- `PUT /api/schedules/:id` - 일정 수정
- `DELETE /api/schedules/:id` - 일정 삭제
- `GET /api/schedules/:id/participants` - 일정 참가자 목록

### 메시지 (Messages)

- `POST /api/teams/:teamId/messages` - 메시지 전송
- `GET /api/teams/:teamId/messages` - 메시지 목록 (날짜별)
- `DELETE /api/messages/:id` - 메시지 삭제
- `GET /api/teams/:teamId/messages/unread-count` - 읽지 않은 메시지 수

### Long Polling

- `GET /api/teams/:teamId/poll` - Long Polling 연결 (30초 타임아웃)
- `GET /api/teams/:teamId/poll/status` - Long Polling 상태

### 활동 (Activities)

- `GET /api/activities` - 최근 활동 내역
- `GET /api/activities/summary` - 활동 요약

### 기타

- `GET /health` - 서버 상태 확인
- `GET /` - API 정보

## 보안 기능

- **JWT 인증**: Bearer 토큰 기반 인증
- **bcrypt**: 비밀번호 해싱 (12 rounds)
- **Helmet**: 보안 헤더 설정
- **CORS**: 교차 출처 리소스 공유 제어
- **Rate Limiting**: 15분당 100 요청 제한
- **XSS 방지**: 입력 검증 및 필터링
- **SQL Injection 방지**: Parameterized Query 사용

## 에러 코드

- `UNAUTHORIZED` (401) - 인증 실패
- `FORBIDDEN` (403) - 권한 없음
- `NOT_FOUND` (404) - 리소스 없음
- `VALIDATION_ERROR` (400) - 유효성 검증 실패
- `CONFLICT` (409) - 리소스 충돌
- `RATE_LIMIT_EXCEEDED` (429) - Rate Limit 초과
- `INTERNAL_SERVER_ERROR` (500) - 서버 내부 오류

## 테스트

```bash
# 단위 테스트
npm test

# 통합 테스트
npm run test:integration

# 테스트 커버리지
npm run test:coverage
```

## 로깅

Winston을 사용하여 다음 레벨로 로깅합니다:

- `error` - 에러 메시지
- `warn` - 경고 메시지
- `info` - 정보 메시지
- `debug` - 디버그 메시지

로그 레벨은 `.env` 파일의 `LOG_LEVEL`로 설정할 수 있습니다.

## 성능 목표

- **API 응답**: < 100ms (일반), < 50ms (복잡한 조인)
- **일정 조회**: < 2초
- **메시지 전달**: < 1초
- **동시 접속**: 30,000명 지원

## 라이선스

MIT
