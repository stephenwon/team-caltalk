import { AppError } from '../utils/errors.js';
import { error as errorResponse, serverError } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * 전역 에러 핸들러 미들웨어
 * Clean Architecture: Interface Adapters Layer
 */
export const errorHandler = (err, req, res, next) => {
  // 에러 로깅
  if (err.isOperational) {
    logger.warn('운영 에러 발생', {
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
      userId: req.user?.userId
    });
  } else {
    logger.error('예기치 않은 에러 발생', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      userId: req.user?.userId
    });
  }

  // 커스텀 AppError 처리
  if (err instanceof AppError) {
    return errorResponse(
      res,
      err.code,
      err.message,
      err.statusCode,
      err.details
    );
  }

  // PostgreSQL 에러 처리
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        return errorResponse(
          res,
          'DUPLICATE_ENTRY',
          '중복된 데이터입니다',
          409
        );
      case '23503': // foreign_key_violation
        return errorResponse(
          res,
          'FOREIGN_KEY_VIOLATION',
          '참조된 데이터가 존재하지 않습니다',
          400
        );
      case '23502': // not_null_violation
        return errorResponse(
          res,
          'NULL_VALUE_NOT_ALLOWED',
          '필수 값이 누락되었습니다',
          400
        );
      case '23514': // check_violation
        return errorResponse(
          res,
          'CHECK_CONSTRAINT_VIOLATION',
          '데이터 제약 조건을 위반했습니다',
          400
        );
      case '22P02': // invalid_text_representation
        return errorResponse(
          res,
          'INVALID_INPUT_FORMAT',
          '잘못된 입력 형식입니다',
          400
        );
    }
  }

  // JWT 에러 처리
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(
      res,
      'INVALID_TOKEN',
      '유효하지 않은 토큰입니다',
      401
    );
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(
      res,
      'TOKEN_EXPIRED',
      '토큰이 만료되었습니다',
      401
    );
  }

  // Joi 검증 에러 처리
  if (err.isJoi) {
    const details = err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return errorResponse(
      res,
      'VALIDATION_ERROR',
      '유효성 검증 실패',
      400,
      details
    );
  }

  // 개발 환경에서는 상세 에러 반환
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message,
        stack: err.stack
      },
      timestamp: new Date().toISOString()
    });
  }

  // 프로덕션 환경에서는 일반적인 에러 메시지
  return serverError(res);
};

/**
 * 404 Not Found 핸들러
 */
export const notFoundHandler = (req, res) => {
  return errorResponse(
    res,
    'ROUTE_NOT_FOUND',
    `라우트를 찾을 수 없습니다: ${req.method} ${req.path}`,
    404
  );
};

/**
 * 비동기 핸들러 래퍼 (try-catch 자동 처리)
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
