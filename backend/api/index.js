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
    // 환경 변수 체크
    const requiredEnvVars = ['DB_CONNECTION_STRING', 'JWT_SECRET'];
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingEnvVars.length > 0) {
      const errorMsg = `필수 환경 변수가 설정되지 않았습니다: ${missingEnvVars.join(', ')}`;
      logger.error('Vercel:', errorMsg);
      logger.error('Vercel 대시보드에서 Environment Variables를 설정해주세요.');
      throw new Error(errorMsg);
    }

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

    // CORS 헤더 설정 (에러 응답에도 CORS 허용)
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
    }

    // 환경 변수 누락 에러인 경우 더 명확한 메시지 제공
    const isEnvError = error.message.includes('환경 변수') || error.message.includes('DB_CONNECTION_STRING');

    res.status(500).json({
      success: false,
      error: isEnvError
        ? '서버 설정 오류: Vercel 환경 변수를 확인해주세요'
        : '서버 초기화 중 오류가 발생했습니다',
      code: isEnvError ? 'MISSING_ENV_VARS' : 'SERVERLESS_INIT_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
