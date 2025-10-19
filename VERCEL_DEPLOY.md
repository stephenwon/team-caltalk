# Vercel 배포 가이드

## 📋 목차
- [백엔드 배포](#백엔드-배포)
- [프론트엔드 배포](#프론트엔드-배포)
- [환경 변수 설정](#환경-변수-설정)
- [CORS 설정](#cors-설정)
- [문제 해결](#문제-해결)

## 백엔드 배포

### 1. Vercel 프로젝트 생성

```bash
cd backend
vercel
```

프롬프트에서:
- **Set up and deploy**: Yes
- **Which scope**: 개인 계정 선택
- **Link to existing project**: No
- **Project name**: team-caltalk-backend
- **Directory**: `./` (현재 디렉토리)

### 2. 환경 변수 설정

Vercel 대시보드 → Settings → Environment Variables에서 다음 변수 추가:

#### 필수 환경 변수

```env
# Database (Supabase, Neon, 또는 기타 PostgreSQL)
DB_CONNECTION_STRING=postgresql://user:password@host:port/database

# JWT
JWT_SECRET=your-secure-random-string-here
JWT_REFRESH_SECRET=your-secure-refresh-string-here
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# CORS - 중요!
CORS_ORIGIN=https://team-caltalk-frontend2.vercel.app
CORS_CREDENTIALS=true

# Security
BCRYPT_ROUNDS=12
NODE_ENV=production

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### CORS_ORIGIN 설정 예시

**단일 프론트엔드:**
```
CORS_ORIGIN=https://your-frontend.vercel.app
```

**여러 프론트엔드 (개발 + 프로덕션):**
```
CORS_ORIGIN=https://your-frontend.vercel.app,https://your-frontend-dev.vercel.app
```

### 3. 데이터베이스 설정

**권장: Vercel Postgres 또는 Supabase**

#### Option 1: Vercel Postgres

1. Vercel 대시보드 → Storage → Create Database
2. Postgres 선택
3. 자동으로 연결 문자열이 환경 변수에 추가됨

#### Option 2: Supabase

1. [Supabase](https://supabase.com) 프로젝트 생성
2. Settings → Database → Connection String 복사
3. Vercel 환경 변수에 `DB_CONNECTION_STRING` 추가

#### Option 3: Neon

1. [Neon](https://neon.tech) 프로젝트 생성
2. Connection String 복사
3. Vercel 환경 변수에 추가

### 4. 데이터베이스 스키마 적용

```bash
# 로컬에서 원격 DB에 스키마 적용
psql "your-connection-string" -f database/schema.sql
```

또는 Supabase/Neon SQL 에디터에서 `database/schema.sql` 내용 실행

### 5. 배포

```bash
vercel --prod
```

## 프론트엔드 배포

### 1. Vercel 프로젝트 생성

```bash
cd frontend
vercel
```

### 2. 환경 변수 설정

Vercel 대시보드 → Settings → Environment Variables:

```env
VITE_API_BASE_URL=https://team-caltalk-backend2.vercel.app
```

**중요:** 백엔드 URL을 정확히 입력하세요 (끝에 슬래시 없음)

### 3. 빌드 설정 확인

Vercel은 자동으로 Vite 프로젝트를 감지하지만, 확인:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 4. 배포

```bash
vercel --prod
```

## 환경 변수 설정

### 환경 변수 적용 우선순위

1. Vercel 환경 변수 (Production)
2. Vercel 환경 변수 (Preview)
3. Vercel 환경 변수 (Development)

### 환경별 설정

**Production 환경:**
- 프로덕션 데이터베이스 사용
- 프로덕션 프론트엔드 URL만 CORS 허용

**Preview 환경:**
- 테스트 데이터베이스 사용 (선택)
- Preview URL도 CORS 허용

## CORS 설정

### 문제: Access-Control-Allow-Origin 에러

```
Access to XMLHttpRequest has been blocked by CORS policy
```

### 해결 방법

#### 1. Vercel 대시보드에서 환경 변수 확인

백엔드 프로젝트 → Settings → Environment Variables:

```env
CORS_ORIGIN=https://team-caltalk-frontend2.vercel.app
```

#### 2. 여러 도메인 허용

개발 환경 + 프로덕션 환경:

```env
CORS_ORIGIN=https://team-caltalk-frontend2.vercel.app,https://team-caltalk-frontend-dev.vercel.app,http://localhost:5173
```

**중요:**
- 쉼표로 구분
- 공백 없이
- `http://` 또는 `https://` 프로토콜 포함
- 끝에 슬래시(`/`) 없음

#### 3. 재배포

환경 변수 변경 후:

```bash
vercel --prod
```

또는 Vercel 대시보드 → Deployments → ... → Redeploy

### 동적 CORS 설정 (선택사항)

모든 Vercel Preview URL 자동 허용하려면:

`backend/src/middleware/security.js` 수정:

```javascript
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = config.cors.origin;
    
    // Vercel Preview URL 패턴 허용 (선택사항)
    const isVercelPreview = origin?.includes('vercel.app');
    
    if (!origin || allowedOrigins.includes(origin) || isVercelPreview) {
      callback(null, true);
    } else {
      callback(new Error('CORS 정책에 의해 차단되었습니다'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
```

## 문제 해결

### 1. CORS 에러

**증상:**
```
No 'Access-Control-Allow-Origin' header is present
```

**해결:**
1. 백엔드 `CORS_ORIGIN` 환경 변수에 프론트엔드 URL 추가
2. 재배포
3. 브라우저 캐시 삭제

### 2. 환경 변수가 적용되지 않음

**해결:**
1. Vercel 대시보드에서 환경 변수 확인
2. "Redeploy" 클릭 (환경 변수 변경 시 필수)
3. Production, Preview, Development 모두 체크했는지 확인

### 3. 데이터베이스 연결 실패

**증상:**
```
Error: connect ECONNREFUSED
```

**해결:**
1. `DB_CONNECTION_STRING` 확인
2. 데이터베이스가 외부 연결 허용하는지 확인
3. Vercel IP를 데이터베이스 방화벽에 추가

### 4. 빌드 실패

**해결:**
1. `package.json`의 `engines` 필드 확인
2. Node.js 버전 호환성 확인
3. 빌드 로그에서 오류 메시지 확인

### 5. API 요청 타임아웃

**Vercel 서버리스 함수 제한:**
- Hobby 플랜: 10초
- Pro 플랜: 60초

**해결:**
- 긴 작업은 백그라운드 작업으로 분리
- 데이터베이스 쿼리 최적화

## 유용한 명령어

```bash
# 로그 확인
vercel logs

# 환경 변수 확인
vercel env ls

# 환경 변수 추가
vercel env add VARIABLE_NAME

# 도메인 확인
vercel domains ls

# 프로젝트 정보
vercel inspect
```

## 배포 체크리스트

### 백엔드 배포 전

- [ ] 데이터베이스 준비 완료
- [ ] 데이터베이스 스키마 적용
- [ ] 모든 환경 변수 설정
- [ ] `CORS_ORIGIN`에 프론트엔드 URL 추가
- [ ] JWT 시크릿 키 생성

### 프론트엔드 배포 전

- [ ] `VITE_API_BASE_URL`에 백엔드 URL 설정
- [ ] 백엔드가 먼저 배포되어 있는지 확인
- [ ] 로컬에서 프로덕션 빌드 테스트 (`npm run build`)

### 배포 후

- [ ] 백엔드 Health Check: `https://your-backend.vercel.app/health`
- [ ] API 문서: `https://your-backend.vercel.app/api/docs`
- [ ] 프론트엔드 접속 테스트
- [ ] 회원가입/로그인 테스트
- [ ] CORS 정상 작동 확인

## 참고 자료

- [Vercel 문서](https://vercel.com/docs)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Supabase](https://supabase.com/docs)
- [Neon](https://neon.tech/docs)
