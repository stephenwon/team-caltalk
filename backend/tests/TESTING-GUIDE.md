# Team CalTalk 테스트 실행 가이드

이 문서는 Team CalTalk 백엔드 테스트를 처음 실행하는 개발자를 위한 단계별 가이드입니다.

## 목차

1. [사전 준비사항](#사전-준비사항)
2. [테스트 환경 설정](#테스트-환경-설정)
3. [테스트 실행](#테스트-실행)
4. [문제 해결](#문제-해결)
5. [테스트 작성 가이드](#테스트-작성-가이드)

## 사전 준비사항

### 필수 소프트웨어

- **Node.js** 18.0.0 이상
- **PostgreSQL** 17.6 이상
- **npm** 10.0.0 이상

### 설치 확인

```bash
# Node.js 버전 확인
node --version
# v18.0.0 이상이어야 함

# PostgreSQL 버전 확인
psql --version
# PostgreSQL 17.6 이상이어야 함

# npm 버전 확인
npm --version
# 10.0.0 이상이어야 함
```

## 테스트 환경 설정

### 1단계: 테스트 데이터베이스 생성

```bash
# PostgreSQL에 postgres 사용자로 접속
psql -U postgres

# 테스트 데이터베이스 생성
CREATE DATABASE team_caltalk_test;

# 데이터베이스 목록 확인
\l

# 생성한 데이터베이스로 연결
\c team_caltalk_test

# btree_gist 확장 활성화 (일정 충돌 감지용)
CREATE EXTENSION IF NOT EXISTS btree_gist;

# 확장 확인
\dx

# PostgreSQL 종료
\q
```

### 2단계: 데이터베이스 스키마 생성

```bash
# 프로젝트 루트 디렉토리에서 실행
cd C:\_vibe\team-caltalk

# 테스트 데이터베이스에 스키마 적용
psql -U postgres -d team_caltalk_test -f database/schema.sql

# 스키마 적용 확인
psql -U postgres -d team_caltalk_test -c "\dt"
```

예상 출력:
```
                    List of relations
 Schema |          Name          | Type  |  Owner
--------+------------------------+-------+----------
 public | messages               | table | postgres
 public | schedule_participants  | table | postgres
 public | schedules              | table | postgres
 public | team_members           | table | postgres
 public | teams                  | table | postgres
 public | users                  | table | postgres
```

### 3단계: 테스트 헬퍼 함수 추가

```bash
# 테스트 헬퍼 함수 적용
psql -U postgres -d team_caltalk_test -f backend/tests/test-database-setup.sql

# 함수 확인
psql -U postgres -d team_caltalk_test -c "\df truncate_all_test_data"
```

### 4단계: 환경 변수 설정

```bash
# backend 디렉토리로 이동
cd backend

# .env.test 파일 생성
cp .env.test.example .env.test

# .env.test 파일 수정 (비밀번호 변경)
# DB_PASSWORD=your_test_password 부분을 실제 PostgreSQL 비밀번호로 변경
```

`.env.test` 파일 내용:
```bash
NODE_ENV=test
DB_HOST=localhost
DB_PORT=5432
DB_NAME=team_caltalk_test
DB_USER=postgres
DB_PASSWORD=your_actual_password  # 실제 비밀번호로 변경
JWT_SECRET=test-secret-key-for-jwt-tokens
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=10
```

### 5단계: npm 패키지 설치

```bash
# backend 디렉토리에서 실행
npm install

# 설치 확인 (테스트 관련 패키지)
npm list jest supertest
```

예상 출력:
```
team-caltalk-backend@1.0.0
├── jest@29.7.0
└── supertest@6.3.3
```

## 테스트 실행

### 전체 테스트 실행

```bash
# backend 디렉토리에서 실행
npm test
```

예상 출력:
```
PASS  tests/unit/auth-service.test.js
PASS  tests/unit/models.test.js
PASS  tests/integration/auth.test.js
PASS  tests/integration/teams.test.js
PASS  tests/integration/schedules.test.js

Test Suites: 5 passed, 5 total
Tests:       XX passed, XX total
Snapshots:   0 total
Time:        X.XXs
```

### 단위 테스트만 실행

```bash
npm run test:unit
```

### 통합 테스트만 실행

```bash
npm run test:integration
```

### Watch 모드로 실행 (개발 중)

```bash
npm run test:watch
```

이 모드에서는 파일이 변경될 때마다 자동으로 테스트가 재실행됩니다.

### 커버리지 리포트 생성

```bash
npm run test:coverage
```

커버리지 리포트는 `coverage/` 디렉토리에 생성됩니다.
HTML 리포트를 보려면:

```bash
# Windows
start coverage/lcov-report/index.html

# macOS
open coverage/lcov-report/index.html

# Linux
xdg-open coverage/lcov-report/index.html
```

### 상세 모드로 실행

```bash
npm run test:verbose
```

## 문제 해결

### 문제 1: 데이터베이스 연결 실패

**증상:**
```
테스트 데이터베이스 연결 실패: connection refused
```

**해결 방법:**

1. PostgreSQL 서비스 실행 확인:
```bash
# Windows
pg_isready

# 또는
net start postgresql-x64-17
```

2. 데이터베이스 존재 확인:
```bash
psql -U postgres -l | grep team_caltalk_test
```

3. `.env.test` 파일의 DB 설정 확인:
```bash
cat .env.test
# DB_HOST, DB_PORT, DB_USER, DB_PASSWORD 확인
```

### 문제 2: 스키마 테이블이 없음

**증상:**
```
error: relation "users" does not exist
```

**해결 방법:**

```bash
# 스키마 재적용
psql -U postgres -d team_caltalk_test -f database/schema.sql

# 테이블 확인
psql -U postgres -d team_caltalk_test -c "\dt"
```

### 문제 3: 테스트 타임아웃

**증상:**
```
Timeout - Async callback was not invoked within the 10000 ms timeout
```

**해결 방법:**

`jest.config.js`에서 타임아웃 증가:

```javascript
module.exports = {
  testTimeout: 15000, // 10000에서 15000으로 증가
  // ...
};
```

### 문제 4: 외래 키 제약 위반

**증상:**
```
error: insert or update on table violates foreign key constraint
```

**해결 방법:**

테스트 데이터 초기화:

```bash
psql -U postgres -d team_caltalk_test -c "SELECT truncate_all_test_data();"
```

### 문제 5: Jest ESM 모듈 오류

**증상:**
```
Jest encountered an unexpected token
```

**해결 방법:**

`jest.config.js` 설정 확인:

```javascript
module.exports = {
  testEnvironment: 'node',
  // CommonJS 사용
};
```

또는 `package.json`에서 `"type": "module"` 제거

## 테스트 작성 가이드

### 테스트 파일 구조

```javascript
const request = require('supertest');
const { createTestUser, generateTestToken } = require('../fixtures');

describe('API 그룹 이름', () => {
  let pool;

  beforeAll(() => {
    pool = global.testPool;
  });

  describe('POST /api/endpoint - 기능 설명', () => {
    test('성공 케이스 설명', async () => {
      // Given: 전제 조건
      const user = await createTestUser(pool);
      const token = generateTestToken(user.id);

      // When: 테스트할 동작
      const response = await request(app)
        .post('/api/endpoint')
        .set('Authorization', `Bearer ${token}`)
        .send({ data: 'value' })
        .expect(200);

      // Then: 결과 검증
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    test('실패 케이스 설명', async () => {
      // ...
    });
  });
});
```

### 픽스처 활용 예시

```javascript
// 사용자 생성
const user = await createTestUser(pool, {
  email: 'test@example.com',
  name: '테스트사용자',
  password: 'Pass123!'
});

// 팀 생성
const team = await createTestTeam(pool, user.id, {
  name: '개발팀'
});

// 기본 시나리오 (사용자 3명 + 팀 1개)
const { users, team, tokens } = await setupBasicScenario(pool);

// 첫 번째 사용자로 API 호출
const response = await request(app)
  .get('/api/teams')
  .set('Authorization', `Bearer ${tokens[0]}`)
  .expect(200);
```

### 테스트 명명 규칙

- **describe**: API 엔드포인트 그룹화
- **test**: 구체적인 시나리오 설명 (한국어)

예시:
```javascript
describe('POST /api/auth/signup - 회원가입', () => {
  test('유효한 데이터로 회원가입 성공', async () => {});
  test('중복된 이메일로 회원가입 실패', async () => {});
  test('필수 필드 누락 시 실패', async () => {});
});
```

### Assertion 패턴

```javascript
// 성공 응답
expect(response.body.success).toBe(true);
expect(response.body.data).toBeDefined();

// 에러 응답
expect(response.body.success).toBe(false);
expect(response.body.error).toBeDefined();
expect(response.body.error.message).toContain('에러 메시지');

// 데이터 검증
expect(response.body.data.email).toBe('test@example.com');
expect(response.body.data.id).toBeGreaterThan(0);
expect(Array.isArray(response.body.data)).toBe(true);
```

## 테스트 디버깅

### console.log 사용

```javascript
test('디버깅 예시', async () => {
  const user = await createTestUser(pool);
  console.log('Created user:', user);

  const response = await request(app)
    .post('/api/endpoint')
    .send({ data: 'value' });

  console.log('Response:', response.body);

  expect(response.body.success).toBe(true);
});
```

### 특정 테스트만 실행

```javascript
// test.only - 이 테스트만 실행
test.only('디버깅할 테스트', async () => {
  // ...
});

// test.skip - 이 테스트 건너뛰기
test.skip('나중에 수정할 테스트', async () => {
  // ...
});
```

### 데이터베이스 상태 확인

```javascript
test('데이터 확인', async () => {
  const user = await createTestUser(pool);

  // DB에서 직접 조회
  const result = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [user.id]
  );

  console.log('DB User:', result.rows[0]);

  expect(result.rows).toHaveLength(1);
});
```

## CI/CD 통합

### GitHub Actions 설정 예시

`.github/workflows/test.yml`:

```yaml
name: Backend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:17.6
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd backend
          npm ci

      - name: Setup test database
        run: |
          psql -U postgres -h localhost -c "CREATE DATABASE team_caltalk_test;"
          psql -U postgres -h localhost -d team_caltalk_test -f database/schema.sql
          psql -U postgres -h localhost -d team_caltalk_test -f backend/tests/test-database-setup.sql
        env:
          PGPASSWORD: postgres

      - name: Run tests
        run: |
          cd backend
          npm test
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: team_caltalk_test
          DB_USER: postgres
          DB_PASSWORD: postgres
          JWT_SECRET: test-secret-key
          JWT_EXPIRES_IN: 24h
          BCRYPT_ROUNDS: 10

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info
```

## 추가 리소스

- [Jest 공식 문서](https://jestjs.io/)
- [Supertest GitHub](https://github.com/visionmedia/supertest)
- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## 문의

테스트 관련 문제가 발생하면:

1. 이 가이드의 [문제 해결](#문제-해결) 섹션 확인
2. `backend/tests/README.md` 참조
3. GitHub Issues에 문의

---

**마지막 업데이트**: 2025-10-16
**문서 버전**: 1.0
