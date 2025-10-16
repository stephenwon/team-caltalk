import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

/**
 * PostgreSQL 커넥션 풀 설정
 * Clean Architecture: Infrastructure Layer
 */
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'team_caltalk_dev',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  min: parseInt(process.env.DB_POOL_MIN || '5', 10),
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '2000', 10),
});

// 풀 에러 핸들링
pool.on('error', (err) => {
  logger.error('데이터베이스 풀 예기치 않은 오류', { error: err.message, stack: err.stack });
});

// 연결 테스트
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    logger.error('데이터베이스 연결 실패', { error: err.message });
  } else {
    logger.info('데이터베이스 연결 성공', {
      database: process.env.DB_NAME,
      timestamp: res.rows[0].now
    });
  }
});

/**
 * 쿼리 실행 헬퍼 (Prepared Statement 자동 적용)
 * @param {string} text - SQL 쿼리
 * @param {Array} params - 쿼리 파라미터
 * @returns {Promise<Object>} - 쿼리 결과
 */
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    logger.debug('쿼리 실행 완료', {
      query: text.substring(0, 100),
      duration: `${duration}ms`,
      rows: result.rowCount
    });

    return result;
  } catch (error) {
    logger.error('쿼리 실행 실패', {
      query: text.substring(0, 100),
      error: error.message,
      params
    });
    throw error;
  }
};

/**
 * 트랜잭션 실행 헬퍼
 * @param {Function} callback - 트랜잭션 내부 로직
 * @returns {Promise<any>} - 콜백 반환값
 */
export const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    logger.debug('트랜잭션 커밋 성공');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('트랜잭션 롤백', { error: error.message });
    throw error;
  } finally {
    client.release();
  }
};

/**
 * 커넥션 풀 종료
 */
export const closePool = async () => {
  await pool.end();
  logger.info('데이터베이스 커넥션 풀 종료');
};

export default pool;
