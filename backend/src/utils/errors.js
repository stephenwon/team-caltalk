/**
 * 커스텀 에러 클래스들
 * Clean Architecture: Domain Layer
 */

/**
 * 기본 애플리케이션 에러
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'APP_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 인증 에러
 */
export class AuthenticationError extends AppError {
  constructor(message = '인증이 필요합니다') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

/**
 * 권한 에러
 */
export class AuthorizationError extends AppError {
  constructor(message = '권한이 없습니다') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

/**
 * 리소스 없음 에러
 */
export class NotFoundError extends AppError {
  constructor(message = '리소스를 찾을 수 없습니다') {
    super(message, 404, 'NOT_FOUND');
  }
}

/**
 * 유효성 검증 에러
 */
export class ValidationError extends AppError {
  constructor(message = '유효성 검증 실패', details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

/**
 * 충돌 에러 (일정 충돌, 중복 리소스 등)
 */
export class ConflictError extends AppError {
  constructor(message = '리소스 충돌이 발생했습니다', details = null) {
    super(message, 409, 'CONFLICT');
    this.details = details;
  }
}

/**
 * 데이터베이스 에러
 */
export class DatabaseError extends AppError {
  constructor(message = '데이터베이스 오류가 발생했습니다') {
    super(message, 500, 'DATABASE_ERROR');
  }
}

/**
 * 비즈니스 로직 에러
 */
export class BusinessLogicError extends AppError {
  constructor(message, code = 'BUSINESS_LOGIC_ERROR') {
    super(message, 400, code);
  }
}

export default {
  AppError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  ConflictError,
  DatabaseError,
  BusinessLogicError
};
