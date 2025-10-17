# GitHub Issue #13 테스트 가이드

## 사용자 인증 및 팀 관리 UI 테스트 명세서

이 문서는 GitHub Issue #13 "사용자 인증 및 팀 관리 UI 구현"에 대한 포괄적인 테스트 케이스와 실행 방법을 설명합니다.

## 📋 테스트 개요

### 테스트 대상 기능
1. **인증 시스템**
   - Zustand 인증 스토어 (상태 관리, localStorage 동기화)
   - 로그인/회원가입 페이지 (폼 검증, 에러 처리)
   - AuthService (API 호출, 토큰 관리)

2. **팀 관리 기능**
   - Zustand 팀 스토어 (팀 상태 관리, TanStack Query 연동)
   - 팀 생성/참여 모달 (UI 동작, 초대 코드 기능)
   - 팀원 목록 컴포넌트 (표시, 역할 구분)

### 테스트 목표
- **커버리지 80% 이상** 달성
- **유닛 테스트**: 각 훅, 스토어, 서비스 단위
- **통합 테스트**: 컴포넌트와 스토어 연동
- **E2E 시나리오**: 실제 사용자 플로우
- **MSW 모킹**: API 응답 시뮬레이션

## 🗂️ 테스트 구조

```
src/
├── test/
│   ├── setup.ts                     # 테스트 환경 설정
│   ├── utils/
│   │   └── test-utils.tsx          # 테스트 유틸리티 및 헬퍼
│   ├── mocks/
│   │   ├── server.ts               # MSW 서버 설정
│   │   └── handlers/
│   │       ├── auth.ts             # 인증 API 모킹
│   │       └── team.ts             # 팀 API 모킹
│   ├── e2e/
│   │   └── auth-flow.test.ts       # E2E 플로우 테스트
│   ├── test-runner.ts              # 테스트 실행 스크립트
│   └── README.md                   # 이 문서
├── stores/
│   └── __tests__/
│       ├── auth-store.test.ts      # 인증 스토어 테스트
│       └── team-store.test.ts      # 팀 스토어 테스트
├── services/
│   └── __tests__/
│       ├── auth-service.test.ts    # 인증 서비스 테스트
│       └── team-service.test.ts    # 팀 서비스 테스트
├── hooks/
│   └── __tests__/
│       ├── use-auth.test.ts        # 인증 훅 테스트
│       └── use-teams.test.ts       # 팀 훅 테스트
└── components/
    └── auth/
        └── __tests__/
            └── LoginForm.test.tsx  # 컴포넌트 테스트
```

## 🚀 테스트 실행 방법

### 기본 명령어

```bash
# 모든 테스트 실행
npm run test:all

# 빠른 테스트 (유닛 테스트만)
npm run test:quick

# 커버리지와 함께 실행
npm run test:coverage

# 대화형 UI로 테스트
npm run test:ui

# 와치 모드로 실행
npm run test:watch
```

### 카테고리별 실행

```bash
# 유닛 테스트만
npm run test:unit

# 통합 테스트만
npm run test:integration

# E2E 테스트만
npm run test:e2e

# 인증 관련 테스트
npm run test:auth

# 팀 관리 관련 테스트
npm run test:team
```

### 세부 영역별 실행

```bash
# 스토어 테스트
npm run test:stores

# 서비스 테스트
npm run test:services

# 훅 테스트
npm run test:hooks

# 컴포넌트 테스트
npm run test:components
```

### 고급 옵션

```bash
# CI 환경용 (JUnit XML 출력)
npm run test:ci

# 디버그 모드
npm run test:debug

# 캐시 초기화 후 실행
npm run test:clear
```

## 📊 커버리지 리포트

### 커버리지 확인
```bash
# 전체 커버리지
npm run test:coverage:all

# 유닛 테스트 커버리지
npm run test:coverage:unit

# 통합 테스트 커버리지
npm run test:coverage:integration
```

### 커버리지 목표
- **라인 커버리지**: 80% 이상
- **함수 커버리지**: 80% 이상
- **브랜치 커버리지**: 80% 이상
- **구문 커버리지**: 80% 이상

## 🧪 테스트 유형별 상세 설명

### 1. 유닛 테스트

**위치**: `src/**/__tests__/**/*.test.{ts,tsx}`

**대상**:
- Zustand 스토어 (auth-store, team-store)
- 서비스 클래스 (AuthService, TeamService)
- 커스텀 훅 (useAuth, useTeams)

**특징**:
- 격리된 환경에서 단일 단위 테스트
- MSW로 API 응답 모킹
- 다양한 상황과 에지 케이스 커버

### 2. 통합 테스트

**위치**: `src/components/**/__tests__/**/*.test.{ts,tsx}`

**대상**:
- React 컴포넌트와 훅의 상호작용
- 폼 검증 및 사용자 이벤트 처리
- 상태 관리와 UI 연동

**특징**:
- Testing Library 사용
- 사용자 관점에서 테스트
- 접근성 및 사용성 검증

### 3. E2E 테스트

**위치**: `src/test/e2e/**/*.test.{ts,tsx}`

**대상**:
- 전체 사용자 플로우
- 페이지 간 네비게이션
- 실제 사용 시나리오

**특징**:
- 실제 브라우저 환경 시뮬레이션
- 전체 애플리케이션 통합 테스트
- 사용자 여정 검증

## 🔧 테스트 설정 및 도구

### 주요 도구
- **Vitest**: 테스트 러너 및 프레임워크
- **Testing Library**: React 컴포넌트 테스트
- **MSW**: API 모킹
- **TanStack Query**: 서버 상태 관리 테스트

### 설정 파일
- `vitest.config.ts`: Vitest 설정
- `src/test/setup.ts`: 테스트 환경 초기화
- `src/test/utils/test-utils.tsx`: 공통 테스트 유틸리티

## 📋 테스트 체크리스트

### 인증 시스템
- [ ] 로그인 성공/실패 시나리오
- [ ] 회원가입 성공/실패 시나리오
- [ ] 토큰 관리 (저장, 갱신, 삭제)
- [ ] 자동 로그아웃 처리
- [ ] 폼 검증 (이메일, 비밀번호 등)
- [ ] 에러 메시지 표시
- [ ] 로딩 상태 관리
- [ ] localStorage 동기화

### 팀 관리 시스템
- [ ] 팀 목록 조회
- [ ] 팀 생성 성공/실패
- [ ] 팀 참여 (초대 코드)
- [ ] 팀원 역할 변경
- [ ] 팀원 제거
- [ ] 팀 삭제
- [ ] 권한 검증
- [ ] 실시간 상태 업데이트

### UI/UX
- [ ] 반응형 디자인
- [ ] 접근성 (ARIA 레이블)
- [ ] 키보드 네비게이션
- [ ] 로딩 인디케이터
- [ ] 에러 상태 표시
- [ ] 성공 메시지
- [ ] 폼 유효성 검사

## 🐛 디버깅 가이드

### 테스트 실패 시 확인사항
1. **MSW 핸들러**: API 응답이 올바른지 확인
2. **비동기 처리**: `waitFor` 또는 `findBy*` 사용
3. **상태 초기화**: `beforeEach`에서 스토어 초기화
4. **타이밍 이슈**: 적절한 타임아웃 설정

### 자주 발생하는 문제들
```typescript
// ❌ 잘못된 예
expect(screen.getByText('로딩중')).toBeInTheDocument()

// ✅ 올바른 예
await waitFor(() => {
  expect(screen.getByText('성공')).toBeInTheDocument()
})
```

### 디버그 모드 사용
```bash
# 디버거 연결하여 실행
npm run test:debug

# 특정 테스트만 디버그
npx vitest run --inspect-brk src/stores/__tests__/auth-store.test.ts
```

## 📈 성능 모니터링

### 테스트 실행 시간 최적화
- 병렬 실행 활용
- 불필요한 DOM 조작 최소화
- MSW 응답 시간 단축
- 타임아웃 적절히 설정

### 리소스 사용량 확인
```bash
# 메모리 사용량과 함께 실행
node --max-old-space-size=4096 npm run test:coverage
```

## 🔄 CI/CD 통합

### GitHub Actions 설정 예시
```yaml
- name: Run Tests
  run: |
    npm run test:ci
    npm run test:coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

### 테스트 결과 아티팩트
- `test-results.xml`: JUnit 형식 테스트 결과
- `coverage/`: 커버리지 리포트
- `test-report.json`: 상세 테스트 분석

## 📚 추가 자료

### 관련 문서
- [Vitest 공식 문서](https://vitest.dev/)
- [Testing Library 가이드](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW 문서](https://mswjs.io/docs/)

### 베스트 프랙티스
- 사용자 관점에서 테스트 작성
- 구현 세부사항보다 동작에 집중
- 명확하고 의미있는 테스트 이름 사용
- 테스트 격리 및 독립성 유지

---

**작성일**: 2025-09-28
**작성자**: Test Automation Engineer
**이슈**: GitHub Issue #13 - 사용자 인증 및 팀 관리 UI 구현