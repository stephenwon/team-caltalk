import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Helmet 보안 설정
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

/**
 * CORS 설정
 */
export const corsConfig = cors({
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')
      : ['http://localhost:5173'];

    // 개발 환경에서는 origin이 undefined일 수 있음 (Postman 등)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS 정책에 의해 차단되었습니다'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

/**
 * Rate Limiting 설정
 */
export const rateLimitConfig = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15분
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 최대 요청 수
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.'
    },
    timestamp: new Date().toISOString()
  },
  standardHeaders: true, // RateLimit-* 헤더 반환
  legacyHeaders: false, // X-RateLimit-* 헤더 비활성화
  // IP 주소 추출 (프록시 뒤에 있을 경우)
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  }
});

/**
 * 인증 엔드포인트용 Rate Limiting (더 엄격)
 */
export const authRateLimitConfig = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5, // 최대 5번의 시도
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '로그인 시도 횟수를 초과했습니다. 15분 후 다시 시도해주세요.'
    },
    timestamp: new Date().toISOString()
  },
  skipSuccessfulRequests: true // 성공한 요청은 카운트하지 않음
});

/**
 * XSS 방지를 위한 입력 검증 미들웨어
 */
export const sanitizeInput = (req, res, next) => {
  // 위험한 문자 패턴 검사
  const dangerousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi
  ];

  const checkValue = (value) => {
    if (typeof value === 'string') {
      return !dangerousPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).every(checkValue);
    }
    return true;
  };

  if (!checkValue(req.body) || !checkValue(req.query) || !checkValue(req.params)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'XSS_DETECTED',
        message: '유효하지 않은 입력이 감지되었습니다'
      },
      timestamp: new Date().toISOString()
    });
  }

  next();
};

export default {
  helmetConfig,
  corsConfig,
  rateLimitConfig,
  authRateLimitConfig,
  sanitizeInput
};
