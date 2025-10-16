-- 테스트 데이터베이스 생성 스크립트
-- 이 스크립트는 postgres 사용자로 실행해야 합니다

-- 기존 테스트 데이터베이스가 있다면 삭제
DROP DATABASE IF EXISTS team_caltalk_test;

-- 테스트 데이터베이스 생성
CREATE DATABASE team_caltalk_test
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'C'
    LC_CTYPE = 'C'
    TEMPLATE = template0;

-- 생성 확인 메시지
\echo '테스트 데이터베이스가 생성되었습니다: team_caltalk_test'
\echo '다음 명령으로 스키마를 적용하세요:'
\echo 'psql -U postgres -d team_caltalk_test -f database/schema.sql'
