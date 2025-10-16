import { verifyToken } from '../config/jwt.js';
import { unauthorized, forbidden } from '../utils/response.js';
import { AuthenticationError, AuthorizationError } from '../utils/errors.js';
import Team from '../models/Team.js';
import logger from '../config/logger.js';

/**
 * JWT 인증 미들웨어
 * Clean Architecture: Interface Adapters Layer
 */
export const authenticate = async (req, res, next) => {
  try {
    // Authorization 헤더 확인
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, '인증 토큰이 필요합니다');
    }

    // 토큰 추출 및 검증
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    // 사용자 정보를 request에 추가
    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };

    logger.debug('인증 성공', { userId: decoded.userId });
    next();
  } catch (error) {
    logger.warn('인증 실패', { error: error.message });
    return unauthorized(res, error.message);
  }
};

/**
 * 팀 멤버십 검증 미들웨어
 * @param {boolean} requireLeader - 팀장 권한 필요 여부
 */
export const requireTeamMembership = (requireLeader = false) => {
  return async (req, res, next) => {
    try {
      const teamId = parseInt(req.params.teamId || req.body.teamId, 10);
      const userId = req.user.userId;

      if (!teamId) {
        return forbidden(res, '팀 ID가 필요합니다');
      }

      // 팀 멤버십 확인
      const membership = await Team.getMembership(teamId, userId);
      if (!membership) {
        return forbidden(res, '팀 멤버가 아닙니다');
      }

      // 팀장 권한 확인
      if (requireLeader && membership.role !== 'leader') {
        return forbidden(res, '팀장 권한이 필요합니다');
      }

      // 멤버십 정보를 request에 추가
      req.teamMembership = membership;

      logger.debug('팀 멤버십 검증 성공', {
        userId,
        teamId,
        role: membership.role,
        requireLeader
      });

      next();
    } catch (error) {
      logger.error('팀 멤버십 검증 실패', { error: error.message });
      next(error);
    }
  };
};

/**
 * 리소스 소유권 검증 미들웨어
 * @param {Function} getResourceOwnerId - 리소스 소유자 ID를 가져오는 함수
 */
export const requireOwnership = (getResourceOwnerId) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const ownerId = await getResourceOwnerId(req);

      if (userId !== ownerId) {
        return forbidden(res, '소유자만 접근할 수 있습니다');
      }

      logger.debug('소유권 검증 성공', { userId, ownerId });
      next();
    } catch (error) {
      logger.error('소유권 검증 실패', { error: error.message });
      next(error);
    }
  };
};

/**
 * 선택적 인증 미들웨어 (토큰이 있으면 검증, 없으면 통과)
 */
export const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      req.user = {
        userId: decoded.userId,
        email: decoded.email
      };

      logger.debug('선택적 인증 성공', { userId: decoded.userId });
    }

    next();
  } catch (error) {
    logger.debug('선택적 인증 실패 (통과)', { error: error.message });
    next();
  }
};

export default {
  authenticate,
  requireTeamMembership,
  requireOwnership,
  optionalAuthenticate
};
