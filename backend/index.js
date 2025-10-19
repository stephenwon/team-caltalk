/**
 * Vercel 서버리스 함수 진입점
 * Express 앱을 Vercel 서버리스 환경에서 실행
 */
const { initializeApp } = require('./src/app');

let app = null;
let initError = null;

/**
 * Vercel 서버리스 핸들러 함수
 */
async function handler(req, res) {
  try {
    // 앱이 초기화되지 않았다면 초기화
    if (!app && !initError) {
      console.log('Express 앱 초기화 중...');
      try {
        app = await initializeApp();
        console.log('Express 앱 초기화 완료');
      } catch (error) {
        initError = error;
        console.error('앱 초기화 실패:', error.message);
        throw error;
      }
    }

    // 초기화 실패한 경우
    if (initError) {
      throw initError;
    }

    // Express 앱에 요청 전달
    return app(req, res);
  } catch (error) {
    console.error('서버리스 함수 오류:', error.message);

    return res.status(500).json({
      success: false,
      error: '서버 내부 오류가 발생했습니다',
      message: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
}

// Default export로 핸들러 함수 제공
module.exports = handler;
