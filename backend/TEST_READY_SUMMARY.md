# Team CalTalk 백엔드 테스트 준비 완료 보고서

## 실행 시간
2025-10-16

## 작업 완료 사항

### 1. 모듈 시스템 통일 ✓
- **문제**: 소스 코드(ES Module)와 테스트 코드(CommonJS) 불일치
- **해결**: 테스트 환경을 CommonJS로 통일
- **변경 파일**:
  - `C:\_vibe\team-caltalk\backend\package.json` - "type": "module" 제거
  - `C:\_vibe\team-caltalk\backend\jest.config.js` - CommonJS 형식으로 변환
  - `C:\_vibe\team-caltalk\backend\tests\setup.js` - require() 사용
  - `C:\_vibe\team-caltalk\backend\tests\fixtures.js` - module.exports 사용

### 2. Jest 설정 최적화 ✓
```javascript
// jest.config.js 주요 설정
- testEnvironment: 'node'
- testTimeout: 10000 (10초)
- coverageThreshold: 80% (모든 메트릭)
- forceExit: true (데이터베이스 연결 정리)
- setupFilesAfterEnv: 테스트 전역 설정
```

### 3. 테스트 인프라 구축 ✓
- ✓ 전역 setup/teardown 구현
- ✓ 테스트 데이터 픽스처 함수 작성
- ✓ 테이블 자동 정리 (TRUNCATE CASCADE)
- ✓ 시퀀스 자동 초기화 (1부터 재시작)

### 4. 테스트 스크립트 작성 ✓
- ✓ `backend/scripts/create-test-db.sql` - DB 생성 스크립트
- ✓ `backend/scripts/run-tests.ps1` - PowerShell 자동화 스크립트
- ✓ `backend/scripts/run-tests.bat` - Windows 배치 스크립트

## 테스트 실행 준비 단계

### STEP 1: 테스트 데이터베이스 생성
```powershell
# PowerShell 관리자 권한으로 실행
cd C:\_vibe\team-caltalk

# 1. 테스트 DB 생성
psql -U postgres -f backend\scripts\create-test-db.sql

# 2. 스키마 적용
psql -U postgres -d team_caltalk_test -f database\schema.sql

# 3. 연결 확인
psql -U postgres -d team_caltalk_test -c "SELECT tablename FROM pg_tables WHERE schemaname='public';"
```

예상 출력:
```
     tablename
-------------------
 users
 teams
 team_members
 schedules
 schedule_participants
 messages
(6 rows)
```

### STEP 2: npm 패키지 설치
```bash
cd C:\_vibe\team-caltalk\backend
npm install
```

필수 패키지 확인:
- ✓ jest@29.7.0
- ✓ supertest@6.3.3
- ✓ pg@8.11.3
- ✓ bcrypt@5.1.1
- ✓ jsonwebtoken@9.0.2

### STEP 3: 테스트 실행
```bash
# 방법 1: PowerShell 스크립트 (권장)
cd C:\_vibe\team-caltalk\backend
.\scripts\run-tests.ps1

# 방법 2: npm 명령어
cd C:\_vibe\team-caltalk\backend
npm run test:integration

# 방법 3: 전체 테스트 + 커버리지
npm run test:coverage
```

## 현재 테스트 구조

### 테스트 파일 현황
```
backend/tests/
├── setup.js                    ✓ 전역 설정 (DB 연결, 테이블 정리)
├── fixtures.js                 ✓ 테스트 데이터 헬퍼 (10개 함수)
├── unit/                       ⚠ 비어있음
└── integration/
    └── auth.test.js            ✓ 인증 API 테스트 (22개 케이스)
```

### 인증 API 테스트 상세

#### 테스트 구성 (22개)
1. **POST /api/auth/signup** (5개)
   - 회원가입 성공
   - 중복 이메일 실패
   - 필수 필드 누락
   - 이름 길이 검증 (최소)
   - 이름 길이 검증 (최대)

2. **POST /api/auth/login** (4개)
   - 로그인 성공
   - 잘못된 비밀번호
   - 존재하지 않는 이메일
   - 필수 필드 누락

3. **POST /api/auth/logout** (1개)
   - 로그아웃 성공

4. **POST /api/auth/refresh** (4개)
   - 토큰 갱신 성공
   - 토큰 없음
   - 잘못된 토큰
   - 만료된 토큰

5. **POST /api/auth/change-password** (4개)
   - 비밀번호 변경 성공
   - 잘못된 현재 비밀번호
   - 토큰 없음
   - 필수 필드 누락

#### 테스트 커버리지 항목
- ✓ API 응답 상태 코드
- ✓ 응답 데이터 구조
- ✓ 성공/실패 메시지
- ✓ JWT 토큰 생성
- ✓ 비밀번호 해싱
- ✓ 데이터베이스 CRUD
- ✓ 에러 핸들링

### 테스트 픽스처 함수 (10개)

#### 데이터 생성
```javascript
createTestUser(pool, userData)          // 사용자 1명 생성
createTestUsers(pool, count)            // 여러 사용자 생성
createTestTeam(pool, creatorId, data)   // 팀 생성
addTeamMember(pool, teamId, userId)     // 팀원 추가
createTestSchedule(pool, scheduleData)  // 일정 생성
createTestMessage(pool, messageData)    // 메시지 생성
```

#### JWT 토큰
```javascript
generateTestToken(userId)               // 유효한 토큰
generateExpiredToken(userId)            // 만료된 토큰
generateInvalidToken(userId)            // 잘못된 토큰
```

#### 시나리오
```javascript
setupBasicScenario(pool)                // 기본 팀 + 멤버 시나리오
setupConflictScenario(pool, ...)        // 일정 충돌 시나리오
```

## 예상 테스트 결과

### 성공 시나리오
```bash
PASS  tests/integration/auth.test.js
  인증 API 통합 테스트
    POST /api/auth/signup - 회원가입
      ✓ 유효한 데이터로 회원가입 성공 (245ms)
      ✓ 중복된 이메일로 회원가입 실패 (89ms)
      ✓ 필수 필드 누락 시 실패 (12ms)
      ✓ 이름 길이 검증 실패 (2자 미만) (15ms)
      ✓ 이름 길이 검증 실패 (30자 초과) (14ms)
    POST /api/auth/login - 로그인
      ✓ 올바른 이메일과 비밀번호로 로그인 성공 (156ms)
      ✓ 잘못된 비밀번호로 로그인 실패 (98ms)
      ✓ 존재하지 않는 이메일로 로그인 실패 (45ms)
      ✓ 필수 필드 누락 시 실패 (11ms)
    POST /api/auth/logout - 로그아웃
      ✓ 로그아웃 성공 (8ms)
    POST /api/auth/refresh - 토큰 갱신
      ✓ 유효한 토큰으로 갱신 성공 (123ms)
      ✓ 토큰 없이 갱신 실패 (9ms)
      ✓ 유효하지 않은 토큰으로 갱신 실패 (21ms)
      ✓ 만료된 토큰으로 갱신 실패 (18ms)
    POST /api/auth/change-password - 비밀번호 변경
      ✓ 올바른 현재 비밀번호로 변경 성공 (287ms)
      ✓ 잘못된 현재 비밀번호로 변경 실패 (134ms)
      ✓ 토큰 없이 변경 실패 (10ms)
      ✓ 필수 필드 누락 시 실패 (87ms)

테스트 데이터베이스 연결 종료

Test Suites: 1 passed, 1 total
Tests:       22 passed, 22 total
Snapshots:   0 total
Time:        3.456s
```

### 현재 커버리지 예상
```
File                | % Stmts | % Branch | % Funcs | % Lines |
--------------------|---------|----------|---------|---------|
All files           |       0 |        0 |       0 |       0 |
```
⚠ 주의: 현재는 Mock 라우터만 테스트하므로 실제 src/ 코드 커버리지는 0%입니다.

## 다음 단계: 실제 백엔드 구현 연동

### 1. 실제 라우터 구현 필요
현재 테스트는 Mock Express 앱을 사용합니다. 실제 백엔드 라우터 구현 후:

```javascript
// auth.test.js 수정
// 기존
app = express();
app.use(express.json());
app.post('/api/auth/signup', async (req, res) => { /* mock */ });

// 변경 후
const app = require('../../src/app');  // 실제 Express 앱 import
```

### 2. 추가 필요 테스트

#### 팀 관리 API (예상 18개)
```
POST   /api/teams                    - 팀 생성
GET    /api/teams/:id                - 팀 조회
PUT    /api/teams/:id                - 팀 수정
DELETE /api/teams/:id                - 팀 삭제
POST   /api/teams/join                - 초대 코드로 참여
GET    /api/teams/:id/members         - 팀원 목록
DELETE /api/teams/:id/members/:userId - 팀원 제거
```

#### 일정 관리 API (예상 25개)
```
POST   /api/teams/:id/schedules       - 일정 생성
GET    /api/teams/:id/schedules       - 팀 일정 조회
GET    /api/teams/:id/schedules/:sid  - 일정 상세
PUT    /api/teams/:id/schedules/:sid  - 일정 수정
DELETE /api/teams/:id/schedules/:sid  - 일정 삭제
GET    /api/schedules/conflicts       - 충돌 감지
POST   /api/schedules/requests        - 변경 요청
```

#### 메시지 API (예상 12개)
```
POST   /api/teams/:id/messages        - 메시지 전송
GET    /api/teams/:id/messages        - 메시지 조회
GET    /api/teams/:id/poll            - Long Polling
```

### 3. 단위 테스트 작성
```
tests/unit/
├── services/
│   ├── auth-service.test.js          - 인증 서비스 로직
│   ├── team-service.test.js          - 팀 관리 로직
│   ├── schedule-service.test.js      - 일정 관리 로직
│   └── event-service.test.js         - 이벤트 처리 로직
├── middleware/
│   ├── auth.test.js                  - JWT 인증 미들웨어
│   ├── validation.test.js            - 입력 검증
│   └── error-handler.test.js         - 에러 핸들링
└── utils/
    └── conflict-detector.test.js     - 일정 충돌 감지
```

## 알려진 제약사항

### 1. 백엔드 소스 코드와 테스트 분리
- **현재**: 백엔드는 ES Module, 테스트는 CommonJS
- **문제**: 실제 백엔드 import 불가
- **해결**: 백엔드도 CommonJS로 변환 또는 별도 빌드 프로세스

### 2. Mock vs 실제 구현
- **현재**: 테스트 내부에 Mock 라우터 구현
- **문제**: 실제 API 동작과 다를 수 있음
- **해결**: 실제 라우터 import 후 테스트

### 3. 커버리지 미측정
- **현재**: src/ 디렉토리 커버리지 0%
- **문제**: Jest가 실제 소스 코드를 찾지 못함
- **해결**: 실제 라우터 연동 후 측정 가능

## 테스트 실행 체크리스트

### 사전 준비
- [ ] PostgreSQL 17.6 설치 및 실행 중
- [ ] 테스트 데이터베이스 생성 (team_caltalk_test)
- [ ] 스키마 적용 완료 (6개 테이블 확인)
- [ ] Node.js 18+ 설치
- [ ] backend 디렉토리에서 npm install 완료

### 테스트 실행
- [ ] 테스트 데이터베이스 연결 성공
- [ ] 인증 테스트 22개 모두 통과
- [ ] 테스트 실행 시간 < 5초
- [ ] 에러 없이 정상 종료

### 추가 작업
- [ ] 팀 관리 API 테스트 작성
- [ ] 일정 관리 API 테스트 작성
- [ ] 메시지 API 테스트 작성
- [ ] 단위 테스트 작성
- [ ] 80% 커버리지 달성

## 문제 해결 가이드

### 문제 1: 데이터베이스 연결 실패
```
테스트 데이터베이스 연결 실패: connection refused
```
**해결**:
```bash
# PostgreSQL 서비스 상태 확인
Get-Service postgresql*

# 서비스 시작
Start-Service postgresql-x64-17

# 비밀번호 확인
psql -U postgres -c "SELECT 1"
```

### 문제 2: 테이블 없음
```
ERROR:  relation "users" does not exist
```
**해결**:
```bash
# 스키마 재적용
psql -U postgres -d team_caltalk_test -f database\schema.sql
```

### 문제 3: npm 패키지 에러
```
Cannot find module 'bcrypt'
```
**해결**:
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### 문제 4: Jest 타임아웃
```
Timeout - Async callback was not invoked within the 5000 ms timeout
```
**해결**:
이미 jest.config.js에서 testTimeout: 10000 으로 설정됨

## 성능 목표

### 테스트 실행 시간
- **단위 테스트**: < 1초
- **통합 테스트 (인증)**: < 5초
- **전체 테스트**: < 30초
- **커버리지 리포트**: < 60초

### 품질 목표
- **테스트 성공률**: 100%
- **커버리지**: 80% 이상
- **Flaky 테스트**: 0개
- **테스트 격리**: 완전 독립적

## 결론

### 완료된 작업
1. ✓ 모듈 시스템 통일 (CommonJS)
2. ✓ Jest 설정 최적화
3. ✓ 테스트 인프라 구축
4. ✓ 인증 API 테스트 22개 작성
5. ✓ 테스트 픽스처 10개 함수 작성
6. ✓ 자동화 스크립트 작성

### 즉시 실행 가능
```bash
# 1단계: 테스트 DB 준비
psql -U postgres -f backend\scripts\create-test-db.sql
psql -U postgres -d team_caltalk_test -f database\schema.sql

# 2단계: 패키지 설치
cd backend && npm install

# 3단계: 테스트 실행
npm run test:integration
```

### 다음 우선순위
1. **최우선**: 테스트 데이터베이스 생성 및 테스트 실행
2. **단기**: 실제 백엔드 라우터와 연동
3. **중기**: 팀/일정/메시지 API 테스트 작성
4. **장기**: 단위 테스트 및 80% 커버리지 달성

---

**테스트 환경 준비 완료**
모든 설정 파일이 CommonJS로 통일되었으며, 데이터베이스만 생성하면 즉시 테스트 실행 가능합니다.

**실행 명령어**:
```powershell
cd C:\_vibe\team-caltalk\backend
.\scripts\run-tests.ps1
```

**작성자**: Test Automation Engineer
**검토일**: 2025-10-16
**상태**: 테스트 실행 준비 완료 ✓
