/**
 * API 응답 포맷 유틸리티
 * Clean Architecture: Interface Adapters Layer
 */

/**
 * 성공 응답 포맷
 * @param {Object} res - Express response 객체
 * @param {any} data - 응답 데이터
 * @param {string} message - 성공 메시지
 * @param {number} statusCode - HTTP 상태 코드
 */
export const success = (res, data = null, message = '성공', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  });
};

/**
 * 에러 응답 포맷
 * @param {Object} res - Express response 객체
 * @param {string} code - 에러 코드
 * @param {string} message - 에러 메시지
 * @param {number} statusCode - HTTP 상태 코드
 * @param {Object} details - 추가 에러 정보
 */
export const error = (res, code, message, statusCode = 400, details = null) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details && { details })
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * 인증 실패 응답
 * @param {Object} res - Express response 객체
 * @param {string} message - 에러 메시지
 */
export const unauthorized = (res, message = '인증이 필요합니다') => {
  return error(res, 'UNAUTHORIZED', message, 401);
};

/**
 * 권한 부족 응답
 * @param {Object} res - Express response 객체
 * @param {string} message - 에러 메시지
 */
export const forbidden = (res, message = '권한이 없습니다') => {
  return error(res, 'FORBIDDEN', message, 403);
};

/**
 * 리소스 없음 응답
 * @param {Object} res - Express response 객체
 * @param {string} message - 에러 메시지
 */
export const notFound = (res, message = '리소스를 찾을 수 없습니다') => {
  return error(res, 'NOT_FOUND', message, 404);
};

/**
 * 유효성 검증 실패 응답
 * @param {Object} res - Express response 객체
 * @param {string} message - 에러 메시지
 * @param {Object} details - 검증 실패 상세 정보
 */
export const validationError = (res, message = '유효성 검증 실패', details = null) => {
  return error(res, 'VALIDATION_ERROR', message, 400, details);
};

/**
 * 서버 내부 오류 응답
 * @param {Object} res - Express response 객체
 * @param {string} message - 에러 메시지
 */
export const serverError = (res, message = '서버 오류가 발생했습니다') => {
  return error(res, 'INTERNAL_SERVER_ERROR', message, 500);
};

/**
 * 충돌 응답
 * @param {Object} res - Express response 객체
 * @param {string} message - 에러 메시지
 * @param {Object} details - 충돌 상세 정보
 */
export const conflict = (res, message = '리소스 충돌이 발생했습니다', details = null) => {
  return error(res, 'CONFLICT', message, 409, details);
};

export default {
  success,
  error,
  unauthorized,
  forbidden,
  notFound,
  validationError,
  serverError,
  conflict
};
