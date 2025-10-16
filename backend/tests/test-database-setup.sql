-- Team CalTalk 테스트 데이터베이스 설정 스크립트
-- PostgreSQL 17.6 이상 필요

-- 1. 테스트 데이터베이스 생성
-- psql -U postgres 로 접속 후 실행:
-- CREATE DATABASE team_caltalk_test;

-- 2. 테스트 데이터베이스에 연결
-- \c team_caltalk_test

-- 3. btree_gist 확장 활성화 (일정 충돌 감지용)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 4. 메인 스키마 적용
-- \i database/schema.sql

-- 5. 테스트용 헬퍼 함수들

-- 테스트 데이터 전체 삭제 함수
CREATE OR REPLACE FUNCTION truncate_all_test_data()
RETURNS void AS $$
BEGIN
    -- 외래 키 제약 조건을 고려한 순서로 삭제
    TRUNCATE TABLE messages CASCADE;
    TRUNCATE TABLE schedule_participants CASCADE;
    TRUNCATE TABLE schedules CASCADE;
    TRUNCATE TABLE team_members CASCADE;
    TRUNCATE TABLE teams CASCADE;
    TRUNCATE TABLE users CASCADE;

    -- 시퀀스 초기화
    ALTER SEQUENCE users_id_seq RESTART WITH 1;
    ALTER SEQUENCE teams_id_seq RESTART WITH 1;
    ALTER SEQUENCE team_members_id_seq RESTART WITH 1;
    ALTER SEQUENCE schedules_id_seq RESTART WITH 1;
    ALTER SEQUENCE schedule_participants_id_seq RESTART WITH 1;
    ALTER SEQUENCE messages_id_seq RESTART WITH 1;
END;
$$ LANGUAGE plpgsql;

-- 테스트 데이터 카운트 함수
CREATE OR REPLACE FUNCTION get_test_data_counts()
RETURNS TABLE(
    table_name TEXT,
    row_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'users'::TEXT, COUNT(*)::BIGINT FROM users
    UNION ALL
    SELECT 'teams'::TEXT, COUNT(*)::BIGINT FROM teams
    UNION ALL
    SELECT 'team_members'::TEXT, COUNT(*)::BIGINT FROM team_members
    UNION ALL
    SELECT 'schedules'::TEXT, COUNT(*)::BIGINT FROM schedules
    UNION ALL
    SELECT 'schedule_participants'::TEXT, COUNT(*)::BIGINT FROM schedule_participants
    UNION ALL
    SELECT 'messages'::TEXT, COUNT(*)::BIGINT FROM messages;
END;
$$ LANGUAGE plpgsql;

-- 사용 예시:
-- SELECT truncate_all_test_data();
-- SELECT * FROM get_test_data_counts();

COMMENT ON FUNCTION truncate_all_test_data() IS '모든 테스트 데이터를 삭제하고 시퀀스를 초기화합니다';
COMMENT ON FUNCTION get_test_data_counts() IS '각 테이블의 데이터 개수를 반환합니다';
