@echo off
echo ========================================
echo Team CalTalk 백엔드 테스트 실행
echo ========================================
echo.

echo [1/4] 테스트 데이터베이스 생성 확인...
psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname='team_caltalk_test'" > nul 2>&1
if %errorlevel% neq 0 (
    echo 테스트 데이터베이스를 생성합니다...
    psql -U postgres -f scripts\create-test-db.sql
    psql -U postgres -d team_caltalk_test -f ..\database\schema.sql
) else (
    echo 테스트 데이터베이스가 이미 존재합니다.
)
echo.

echo [2/4] 데이터베이스 연결 확인...
psql -U postgres -d team_caltalk_test -c "SELECT NOW();" > nul 2>&1
if %errorlevel% neq 0 (
    echo 오류: 테스트 데이터베이스에 연결할 수 없습니다.
    exit /b 1
)
echo 연결 성공!
echo.

echo [3/4] 단위 테스트 실행...
npm run test:unit
if %errorlevel% neq 0 (
    echo 단위 테스트 실패!
    exit /b 1
)
echo.

echo [4/4] 통합 테스트 실행...
npm run test:integration
if %errorlevel% neq 0 (
    echo 통합 테스트 실패!
    exit /b 1
)
echo.

echo ========================================
echo 모든 테스트가 성공적으로 완료되었습니다!
echo ========================================
echo.

echo 커버리지 리포트 생성 중...
npm run test:coverage
