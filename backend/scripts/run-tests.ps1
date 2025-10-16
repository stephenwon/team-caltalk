# Team CalTalk 백엔드 테스트 실행 스크립트

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Team CalTalk 백엔드 테스트 실행" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 현재 위치를 backend 디렉토리로 변경
Set-Location -Path $PSScriptRoot\..

Write-Host "[1/5] 데이터베이스 연결 확인..." -ForegroundColor Yellow
$dbCheck = psql -U postgres -d team_caltalk_test -c "SELECT NOW();" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "테스트 데이터베이스가 없습니다. 생성을 시도합니다..." -ForegroundColor Yellow

    # 테스트 DB 생성
    psql -U postgres -f scripts\create-test-db.sql

    # 스키마 적용
    $schemaPath = Join-Path (Split-Path $PSScriptRoot) "database\schema.sql"
    psql -U postgres -d team_caltalk_test -f $schemaPath

    if ($LASTEXITCODE -ne 0) {
        Write-Host "오류: 테스트 데이터베이스 생성 실패!" -ForegroundColor Red
        exit 1
    }
    Write-Host "테스트 데이터베이스 생성 완료!" -ForegroundColor Green
} else {
    Write-Host "데이터베이스 연결 성공!" -ForegroundColor Green
}
Write-Host ""

Write-Host "[2/5] npm 패키지 확인..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "패키지 설치 중..." -ForegroundColor Yellow
    npm install
}
Write-Host "패키지 확인 완료!" -ForegroundColor Green
Write-Host ""

Write-Host "[3/5] 단위 테스트 실행..." -ForegroundColor Yellow
npm run test:unit
if ($LASTEXITCODE -ne 0) {
    Write-Host "단위 테스트 실패!" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "[4/5] 통합 테스트 실행..." -ForegroundColor Yellow
npm run test:integration
if ($LASTEXITCODE -ne 0) {
    Write-Host "통합 테스트 실패!" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "[5/5] 전체 커버리지 리포트 생성..." -ForegroundColor Yellow
npm run test:coverage
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "모든 테스트 완료!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
