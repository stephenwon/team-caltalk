# Team CalTalk 백엔드 테스트

Team CalTalk 백엔드를 위한 포괄적인 테스트 슈트입니다.

## 테스트 구조

```
tests/
├── setup.js                     # 테스트 환경 설정
├── fixtures.js                  # 테스트 데이터 생성 헬퍼
├── unit/                        # 단위 테스트
│   ├── auth-service.test.js     # AuthService 단위 테스트
│   └── models.test.js           # 데이터 모델 단위 테스트
└── integration/                 # 통합 테스트
    ├── auth.test.js             # 인증 API 통합 테스트
    ├── teams.test.js            # 팀 API 통합 테스트
    └── schedules.test.js        # 일정 API 통합 테스트
```

## 테스트 커버리지

### 단위 테스트 (80% 목표)

#### AuthService 테스트
- 회원가입 (유효한 데이터, 중복 이메일, 검증 실패)
- 로그인 (올바른 인증, 잘못된 비밀번호, 존재하지 않는 사용자)
- JWT 토큰 생성 및 검증
- 비밀번호 변경 (현재 비밀번호 확인, 새 비밀번호 변경)
- 비밀번호 해싱 보안 (salt, 원본 복구 불가능)

#### 데이터 모델 테스트
- **User 모델**: CRUD, 이메일 조회, 정보 업데이트
- **Team 모델**: 초대 코드 생성, 팀장 자동 설정, 팀원 관리, CASCADE 삭제
- **Schedule 모델**: 개인/팀 일정 생성, 7일 제한, 충돌 감지
- **Message 모델**: 메시지 생성, 날짜별 조회, 일정 요청 메시지, 길이 제한

### 통합 테스트 (100% 엔드포인트 커버리지)

#### 인증 API
- **POST /api/auth/signup** - 회원가입 (성공, 중복 이메일, 필수 필드 누락, 이름 길이 검증)
- **POST /api/auth/login** - 로그인 (성공, 잘못된 비밀번호, 존재하지 않는 이메일)
- **POST /api/auth/logout** - 로그아웃
- **POST /api/auth/refresh** - 토큰 갱신 (성공, 만료된 토큰, 잘못된 토큰)
- **POST /api/auth/change-password** - 비밀번호 변경 (성공, 잘못된 현재 비밀번호)

#### 팀 API
- **POST /api/teams** - 팀 생성 (성공, 인증 없음, 필수 필드 누락, 이름 길이 검증)
- **GET /api/teams** - 내 팀 목록 조회 (여러 팀, 팀 없음)
- **GET /api/teams/:id** - 팀 상세 조회 (성공, 권한 없음, 존재하지 않는 팀)
- **PATCH /api/teams/:id** - 팀 정보 수정 (팀장만 가능, 팀원 실패)
- **DELETE /api/teams/:id** - 팀 삭제 (팀장만 가능, 팀원 실패)
- **POST /api/teams/join** - 초대 코드로 참여 (성공, 잘못된 코드, 이미 멤버)
- **DELETE /api/teams/:teamId/members/:userId** - 팀원 제거 (팀장만 가능, 자신 제거 불가)

#### 일정 API
- **POST /api/teams/:teamId/schedules** - 일정 생성 (팀장-팀 일정, 팀원-개인 일정, 충돌 감지, 7일 제한)
- **GET /api/teams/:teamId/schedules** - 일정 목록 조회 (전체, 날짜 필터링)
- **GET /api/teams/:teamId/schedules/:id** - 일정 상세 조회 (성공, 존재하지 않는 일정)
- **PATCH /api/teams/:teamId/schedules/:id** - 일정 수정 (팀장/생성자만 가능, 충돌 감지)
- **DELETE /api/teams/:teamId/schedules/:id** - 일정 삭제 (팀장/생성자만 가능)

## 테스트 실행 전 준비사항

### 1. 테스트 데이터베이스 생성

```bash
# PostgreSQL 접속
psql -U postgres

# 테스트 데이터베이스 생성
CREATE DATABASE team_caltalk_test;
\c team_caltalk_test

# 스키마 실행
\i database/schema.sql
```

### 2. 환경 변수 설정

`.env.test` 파일을 생성하거나 테스트 실행 시 환경 변수를 설정합니다:

```bash
NODE_ENV=test
DB_HOST=localhost
DB_PORT=5432
DB_NAME=team_caltalk_test
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=test-secret-key-for-jwt-tokens
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=10
```

### 3. 의존성 설치

```bash
cd backend
npm install
```

필요한 테스트 패키지:
- `jest` - 테스트 프레임워크
- `supertest` - HTTP 테스트 라이브러리
- `@types/jest` - Jest TypeScript 타입 정의

## 테스트 실행

### 전체 테스트 실행

```bash
npm test
```

### 단위 테스트만 실행

```bash
npm run test:unit
```

### 통합 테스트만 실행

```bash
npm run test:integration
```

### Watch 모드 (개발 중)

```bash
npm run test:watch
```

### 커버리지 리포트 생성

```bash
npm run test:coverage
```

커버리지 리포트는 `coverage/` 디렉토리에 생성됩니다.

## 테스트 작성 가이드

### Given-When-Then 패턴

모든 테스트는 다음 패턴을 따릅니다:

```javascript
test('테스트 설명', async () => {
  // Given: 테스트 전제 조건 설정
  const user = await createTestUser(pool);
  const token = generateTestToken(user.id);

  // When: 테스트할 동작 수행
  const response = await request(app)
    .post('/api/endpoint')
    .set('Authorization', `Bearer ${token}`)
    .send(data)
    .expect(200);

  // Then: 결과 검증
  expect(response.body.success).toBe(true);
  expect(response.body.data).toBeDefined();
});
```

### 픽스처 활용

테스트 데이터 생성을 위한 헬퍼 함수들을 `fixtures.js`에서 제공합니다:

```javascript
// 사용자 생성
const user = await createTestUser(pool, {
  email: 'test@example.com',
  name: '테스트사용자',
  password: 'Pass123!'
});

// 팀 생성
const team = await createTestTeam(pool, userId, {
  name: '개발팀',
  description: '개발 프로젝트 팀'
});

// 일정 생성
const schedule = await createTestSchedule(pool, {
  title: '팀 회의',
  schedule_type: 'team',
  creator_id: userId,
  team_id: teamId
});

// 기본 시나리오 설정 (사용자 3명 + 팀 1개)
const { users, team, tokens } = await setupBasicScenario(pool);

// JWT 토큰 생성
const token = generateTestToken(userId);
```

### 테스트 격리

각 테스트는 독립적으로 실행되어야 합니다:

- `beforeEach`에서 모든 테이블 데이터를 정리합니다
- 테스트 간 공유 상태가 없도록 합니다
- 각 테스트는 순서에 관계없이 실행 가능해야 합니다

## 보안 테스트

다음 보안 시나리오를 테스트합니다:

### 인증 및 권한
- 토큰 없이 보호된 엔드포인트 접근 차단
- 만료된 토큰 거부
- 잘못된 시크릿으로 생성된 토큰 거부
- 팀 멤버가 아닌 사용자의 팀 데이터 접근 차단

### 역할 기반 접근 제어
- 팀장만 팀 일정 생성/수정/삭제 가능
- 팀원은 자신의 개인 일정만 관리 가능
- 팀장만 팀 정보 수정 및 팀원 제거 가능

### 데이터 무결성
- 필수 필드 검증
- 데이터 길이 제한 (이름 2-30자, 제목 2-100자, 메시지 500자)
- 일정 기간 제한 (최대 7일)
- 일정 충돌 감지

## 성능 테스트

현재 구현되지 않았지만, 향후 추가할 성능 테스트:

- 일정 조회 응답 시간 < 2초
- API 응답 시간 < 100ms
- 동시 100명 사용자 부하 테스트
- 데이터베이스 인덱스 효율성 테스트

## CI/CD 통합

### GitHub Actions 예시

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:17.6
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '24.7'

      - name: Install dependencies
        run: npm ci

      - name: Setup database
        run: |
          psql -U postgres -c "CREATE DATABASE team_caltalk_test;"
          psql -U postgres -d team_caltalk_test -f database/schema.sql

      - name: Run tests
        run: npm test
        env:
          DB_HOST: localhost
          DB_NAME: team_caltalk_test
          DB_USER: postgres
          DB_PASSWORD: postgres

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## 문제 해결

### 테스트 데이터베이스 연결 실패

```bash
# PostgreSQL 서비스 실행 확인
pg_isready

# 테스트 데이터베이스 존재 확인
psql -U postgres -l | grep team_caltalk_test

# 권한 확인
psql -U postgres -c "\du"
```

### 테스트 타임아웃

Jest 타임아웃이 부족한 경우:

```javascript
// 개별 테스트 타임아웃 설정
test('긴 작업', async () => {
  // ...
}, 15000); // 15초

// 전역 타임아웃 설정 (jest.config.js)
module.exports = {
  testTimeout: 10000
};
```

### 테스트 격리 문제

테스트 간 데이터가 공유되는 경우:

```bash
# 수동으로 테스트 DB 초기화
psql -U postgres -d team_caltalk_test -c "
  TRUNCATE TABLE messages, schedule_participants, schedules, team_members, teams, users CASCADE;
"
```

## 기여 가이드

새로운 테스트를 추가할 때:

1. 적절한 디렉토리에 테스트 파일 생성 (`unit/` 또는 `integration/`)
2. Given-When-Then 패턴 준수
3. 명확한 한국어 테스트 설명 작성
4. 픽스처 활용하여 테스트 데이터 생성
5. 테스트 격리 보장
6. 커버리지 80% 이상 유지

## 참고 자료

- [Jest 공식 문서](https://jestjs.io/)
- [Supertest 공식 문서](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
