import { validationError } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Joi 스키마 검증 미들웨어 팩토리
 * Clean Architecture: Interface Adapters Layer
 */
export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const data = req[property];

    const { error, value } = schema.validate(data, {
      abortEarly: false, // 모든 에러 반환
      stripUnknown: true, // 스키마에 없는 필드 제거
      convert: true // 타입 변환 시도
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn('유효성 검증 실패', {
        property,
        details,
        data
      });

      return validationError(res, '유효성 검증 실패', details);
    }

    // 검증 및 변환된 값으로 교체
    req[property] = value;

    next();
  };
};

/**
 * 숫자 ID 검증 미들웨어
 */
export const validateId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = parseInt(req.params[paramName], 10);

    if (isNaN(id) || id <= 0) {
      return validationError(res, `유효하지 않은 ${paramName}입니다`);
    }

    req.params[paramName] = id;
    next();
  };
};

/**
 * 페이지네이션 검증 미들웨어
 */
export const validatePagination = (req, res, next) => {
  const limit = parseInt(req.query.limit, 10) || 50;
  const offset = parseInt(req.query.offset, 10) || 0;

  if (limit < 1 || limit > 100) {
    return validationError(res, 'limit은 1에서 100 사이여야 합니다');
  }

  if (offset < 0) {
    return validationError(res, 'offset은 0 이상이어야 합니다');
  }

  req.query.limit = limit;
  req.query.offset = offset;

  next();
};

/**
 * 날짜 형식 검증 미들웨어
 */
export const validateDate = (field, required = false) => {
  return (req, res, next) => {
    const dateString = req.query[field] || req.body[field];

    if (!dateString) {
      if (required) {
        return validationError(res, `${field}는 필수입니다`);
      }
      return next();
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return validationError(res, `${field}는 유효한 날짜 형식이어야 합니다`);
    }

    // ISO 형식으로 정규화
    if (req.query[field]) {
      req.query[field] = date.toISOString();
    } else {
      req.body[field] = date.toISOString();
    }

    next();
  };
};

export default {
  validate,
  validateId,
  validatePagination,
  validateDate
};
