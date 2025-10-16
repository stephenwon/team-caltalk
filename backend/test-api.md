# Team CalTalk API 테스트 가이드

## 서버 시작

```bash
npm run dev
```

## 테스트 시나리오

### 1. Health Check

```bash
curl http://localhost:3001/health
```

### 2. 회원가입

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "테스트 사용자",
    "password": "password123"
  }'
```

### 3. 로그인

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**응답에서 `token` 값을 복사하여 이후 요청에 사용합니다.**

### 4. 현재 사용자 정보 조회

```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. 팀 생성

```bash
curl -X POST http://localhost:3001/api/teams \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "개발팀",
    "description": "백엔드 개발팀입니다"
  }'
```

**응답에서 `id`와 `invite_code` 값을 확인합니다.**

### 6. 팀 목록 조회

```bash
curl -X GET http://localhost:3001/api/teams \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 7. 팀 일정 생성

```bash
curl -X POST http://localhost:3001/api/teams/1/schedules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "팀 회의",
    "content": "주간 회의입니다",
    "startDatetime": "2025-10-20T10:00:00Z",
    "endDatetime": "2025-10-20T11:00:00Z",
    "scheduleType": "team",
    "teamId": 1
  }'
```

### 8. 팀 일정 목록 조회

```bash
curl -X GET "http://localhost:3001/api/teams/1/schedules?startDate=2025-10-01&endDate=2025-10-31" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 9. 메시지 전송

```bash
curl -X POST http://localhost:3001/api/teams/1/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "content": "안녕하세요! 테스트 메시지입니다.",
    "targetDate": "2025-10-16",
    "messageType": "normal"
  }'
```

### 10. 메시지 목록 조회

```bash
curl -X GET "http://localhost:3001/api/teams/1/messages?targetDate=2025-10-16" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 11. Long Polling 연결

```bash
curl -X GET "http://localhost:3001/api/teams/1/poll?lastUpdate=2025-10-16T00:00:00Z" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

이 요청은 30초 동안 대기하며, 새 이벤트가 발생하면 즉시 응답합니다.

### 12. 활동 내역 조회

```bash
curl -X GET http://localhost:3001/api/activities \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 13. 활동 요약 조회

```bash
curl -X GET http://localhost:3001/api/activities/summary \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Postman 컬렉션

Postman을 사용하는 경우:

1. 새 컬렉션 생성
2. 환경 변수 설정:
   - `baseUrl`: `http://localhost:3001`
   - `token`: 로그인 후 받은 JWT 토큰
3. Authorization 탭에서 Bearer Token 선택하고 `{{token}}` 사용

## 에러 테스트

### 잘못된 토큰

```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer invalid_token"
```

### 유효성 검증 실패

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "name": "a",
    "password": "123"
  }'
```

### 권한 없음

```bash
# 다른 사용자의 리소스 수정 시도
curl -X PUT http://localhost:3001/api/teams/999 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "해킹 시도"
  }'
```

## 통합 테스트 시나리오

### 시나리오 1: 팀 생성 및 일정 관리

1. 사용자 A 회원가입 및 로그인
2. 팀 생성 (초대 코드 받기)
3. 사용자 B 회원가입 및 로그인
4. 사용자 B가 초대 코드로 팀 참여
5. 사용자 A(팀장)가 팀 일정 생성
6. 사용자 B가 일정 조회
7. 사용자 B가 개인 일정 생성 (충돌 테스트)

### 시나리오 2: 실시간 채팅

1. 사용자 A가 Long Polling 연결
2. 사용자 B가 메시지 전송
3. 사용자 A가 실시간으로 메시지 수신 확인
4. 사용자 A가 메시지 읽음 처리

### 시나리오 3: 일정 변경 요청

1. 사용자 B(팀원)가 일정 변경 요청 메시지 전송
2. 사용자 A(팀장)가 승인 메시지 전송
3. 일정 수정
4. 모든 팀원에게 알림 전송
