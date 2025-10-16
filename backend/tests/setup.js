const { Pool } = require('pg');

// 테스트 데이터베이스 설정
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'team_caltalk_test';
process.env.JWT_SECRET = 'test-secret-key-for-jwt-tokens';
process.env.JWT_EXPIRES_IN = '24h';
process.env.BCRYPT_ROUNDS = '10'; // 테스트 속도를 위해 낮춤
process.env.PORT = '3002';

// 테스트 데이터베이스 연결 풀
let testPool;

// 모든 테스트 시작 전 실행
beforeAll(async () => {
  testPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // 테스트 데이터베이스 연결 확인
  try {
    await testPool.query('SELECT NOW()');
    console.log('테스트 데이터베이스 연결 성공');
  } catch (error) {
    console.error('테스트 데이터베이스 연결 실패:', error.message);
    throw error;
  }
});

// 각 테스트 전 실행 - 테이블 정리
beforeEach(async () => {
  // 외래 키 제약 조건을 고려한 순서로 삭제
  await testPool.query('TRUNCATE TABLE messages CASCADE');
  await testPool.query('TRUNCATE TABLE schedule_participants CASCADE');
  await testPool.query('TRUNCATE TABLE schedules CASCADE');
  await testPool.query('TRUNCATE TABLE team_members CASCADE');
  await testPool.query('TRUNCATE TABLE teams CASCADE');
  await testPool.query('TRUNCATE TABLE users CASCADE');

  // 시퀀스 초기화
  await testPool.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
  await testPool.query('ALTER SEQUENCE teams_id_seq RESTART WITH 1');
  await testPool.query('ALTER SEQUENCE team_members_id_seq RESTART WITH 1');
  await testPool.query('ALTER SEQUENCE schedules_id_seq RESTART WITH 1');
  await testPool.query('ALTER SEQUENCE schedule_participants_id_seq RESTART WITH 1');
  await testPool.query('ALTER SEQUENCE messages_id_seq RESTART WITH 1');
});

// 모든 테스트 종료 후 실행
afterAll(async () => {
  if (testPool) {
    await testPool.end();
    console.log('테스트 데이터베이스 연결 종료');
  }
});

// 테스트용 헬퍼 함수들을 전역으로 제공
global.testPool = testPool;

// 테스트 타임아웃 설정
jest.setTimeout(10000);
