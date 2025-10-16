import express from 'express';
import dotenv from 'dotenv';
import {
  helmetConfig,
  corsConfig,
  rateLimitConfig,
  sanitizeInput
} from './middleware/security.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import logger from './config/logger.js';

// 라우터 임포트
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import teamsRouter from './routes/teams.js';
import schedulesRouter from './routes/schedules.js';
import messagesRouter from './routes/messages.js';
import pollRouter from './routes/poll.js';
import activitiesRouter from './routes/activities.js';

// 환경 변수 로드
dotenv.config();

/**
 * Express 애플리케이션 생성 및 설정
 * Clean Architecture: Interface Adapters Layer
 */
const app = express();

// ============================================================================
// 미들웨어 설정
// ============================================================================

// 보안 헤더 설정
app.use(helmetConfig);

// CORS 설정
app.use(corsConfig);

// Rate Limiting
app.use('/api', rateLimitConfig);

// Body 파싱
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// XSS 방지
app.use(sanitizeInput);

// 요청 로깅
app.use((req, res, next) => {
  logger.debug('HTTP 요청', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// ============================================================================
// 라우터 설정
// ============================================================================

// Health Check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV
    },
    message: '서버 정상 작동 중'
  });
});

// API 라우터 등록
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/teams', messagesRouter);
app.use('/api/teams', pollRouter);
app.use('/api/activities', activitiesRouter);

// 루트 경로
app.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Team CalTalk API',
      version: '1.0.0',
      description: '팀 중심 일정 관리 및 실시간 채팅 플랫폼',
      endpoints: {
        health: '/health',
        auth: '/api/auth',
        teams: '/api/teams',
        schedules: '/api/schedules',
        messages: '/api/teams/:teamId/messages',
        poll: '/api/teams/:teamId/poll',
        activities: '/api/activities'
      }
    },
    message: 'Team CalTalk API에 오신 것을 환영합니다'
  });
});

// ============================================================================
// 에러 핸들링
// ============================================================================

// 404 에러 핸들러
app.use(notFoundHandler);

// 전역 에러 핸들러
app.use(errorHandler);

export default app;
