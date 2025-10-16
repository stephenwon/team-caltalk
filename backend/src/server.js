import app from './app.js';
import { closePool } from './config/database.js';
import logger from './config/logger.js';
import eventService from './services/event-service.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3001;

/**
 * 서버 시작
 */
const server = app.listen(PORT, () => {
  logger.info('서버 시작', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });

  logger.info('API 엔드포인트 정보', {
    health: `http://localhost:${PORT}/health`,
    auth: `http://localhost:${PORT}/api/auth`,
    teams: `http://localhost:${PORT}/api/teams`,
    schedules: `http://localhost:${PORT}/api/schedules`,
    messages: `http://localhost:${PORT}/api/teams/:teamId/messages`,
    poll: `http://localhost:${PORT}/api/teams/:teamId/poll`,
    activities: `http://localhost:${PORT}/api/activities`
  });
});

/**
 * Graceful Shutdown 처리
 */
const gracefulShutdown = async (signal) => {
  logger.info('서버 종료 시작', { signal });

  // 새로운 연결 거부
  server.close(async () => {
    logger.info('HTTP 서버 종료');

    try {
      // EventService 정리
      eventService.cleanup();

      // 데이터베이스 커넥션 풀 종료
      await closePool();

      logger.info('서버 종료 완료');
      process.exit(0);
    } catch (error) {
      logger.error('서버 종료 중 오류 발생', {
        error: error.message,
        stack: error.stack
      });
      process.exit(1);
    }
  });

  // 강제 종료 타임아웃 (30초)
  setTimeout(() => {
    logger.error('강제 서버 종료', {
      reason: '종료 타임아웃 (30초)'
    });
    process.exit(1);
  }, 30000);
};

/**
 * 프로세스 시그널 핸들러
 */
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

/**
 * 처리되지 않은 예외 및 거부 핸들러
 */
process.on('uncaughtException', (error) => {
  logger.error('처리되지 않은 예외 발생', {
    error: error.message,
    stack: error.stack
  });
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('처리되지 않은 Promise 거부', {
    reason,
    promise
  });
  gracefulShutdown('unhandledRejection');
});

export default server;
