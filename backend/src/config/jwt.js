import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'team_caltalk_dev_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * JWT 토큰 생성
 * @param {Object} payload - 토큰에 포함할 데이터 (userId, email)
 * @returns {string} - JWT 토큰
 */
export const generateToken = (payload) => {
  try {
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });
    logger.debug('JWT 토큰 생성 성공', { userId: payload.userId });
    return token;
  } catch (error) {
    logger.error('JWT 토큰 생성 실패', { error: error.message });
    throw error;
  }
};

/**
 * JWT 토큰 검증
 * @param {string} token - JWT 토큰
 * @returns {Object} - 디코딩된 페이로드
 */
export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.warn('JWT 토큰 만료', { error: error.message });
      throw new Error('토큰이 만료되었습니다');
    } else if (error.name === 'JsonWebTokenError') {
      logger.warn('JWT 토큰 검증 실패', { error: error.message });
      throw new Error('유효하지 않은 토큰입니다');
    } else {
      logger.error('JWT 토큰 검증 오류', { error: error.message });
      throw error;
    }
  }
};

/**
 * JWT 토큰 디코딩 (검증 없이)
 * @param {string} token - JWT 토큰
 * @returns {Object} - 디코딩된 페이로드
 */
export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.error('JWT 토큰 디코딩 실패', { error: error.message });
    throw error;
  }
};

export default {
  generateToken,
  verifyToken,
  decodeToken
};
