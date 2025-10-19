/**
 * Vercel 서버리스 함수 진입점
 *
 * Vercel은 이 파일을 서버리스 함수로 실행합니다.
 * Express 앱을 초기화하고 요청을 처리합니다.
 */

const { createApp } = require('../src/app');
const db = require('../src/config/database');
const logger = require('../src/config/logger');

// Express 앱 인스턴스 캐싱 (콜드 스타트 최적화)
let cachedApp = null;
let isDbInitialized = false;

/**
 * 애플리케이션 초기화 (캐시 사용)
 */
async function getApp() {
  if (cachedApp) {
    return cachedApp;
  }

  try {
    // 데이터베이스 연결 초기화 (한 번만)
    if (!isDbInitialized) {
      await db.initialize();
      isDbInitialized = true;
      logger.info('Vercel: 데이터베이스 연결 완료');
    }

    // Express 앱 생성
    cachedApp = await createApp();
    logger.info('Vercel: Express 애플리케이션 초기화 완료');

    return cachedApp;
  } catch (error) {
    logger.error('Vercel: 애플리케이션 초기화 실패:', error);
    throw error;
  }
}

/**
 * Vercel 서버리스 함수 핸들러
 *
 * 모든 HTTP 요청을 Express 앱으로 전달합니다.
 */
module.exports = async (req, res) => {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (error) {
    logger.error('Vercel: 요청 처리 중 오류:', error);

    res.status(500).json({
      success: false,
      error: '서버 초기화 중 오류가 발생했습니다',
      code: 'SERVERLESS_INIT_ERROR',
    });
  }
};
