import User from '../models/User.js';
import { generateToken } from '../config/jwt.js';
import { AuthenticationError, ValidationError } from '../utils/errors.js';
import logger from '../config/logger.js';

/**
 * 인증 서비스
 * Clean Architecture: Application Layer
 */
class AuthService {
  /**
   * 사용자 회원가입
   * @param {Object} userData - 사용자 정보
   * @returns {Promise<Object>} - 사용자 정보 및 토큰
   */
  static async register(userData) {
    const { email, name, password } = userData;

    // 사용자 생성
    const user = await User.create({ email, name, password });

    // JWT 토큰 생성
    const token = generateToken({
      userId: user.id,
      email: user.email
    });

    logger.info('회원가입 완료', { userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at
      },
      token
    };
  }

  /**
   * 사용자 로그인
   * @param {Object} credentials - 로그인 정보
   * @returns {Promise<Object>} - 사용자 정보 및 토큰
   */
  static async login(credentials) {
    const { email, password } = credentials;

    // 사용자 조회
    const user = await User.findByEmail(email);
    if (!user) {
      throw new AuthenticationError('이메일 또는 비밀번호가 일치하지 않습니다');
    }

    // 비밀번호 검증
    const isValid = await User.verifyPassword(password, user.password_hash);
    if (!isValid) {
      throw new AuthenticationError('이메일 또는 비밀번호가 일치하지 않습니다');
    }

    // JWT 토큰 생성
    const token = generateToken({
      userId: user.id,
      email: user.email
    });

    logger.info('로그인 성공', { userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at
      },
      token
    };
  }

  /**
   * 비밀번호 변경
   * @param {number} userId - 사용자 ID
   * @param {Object} passwordData - 비밀번호 정보
   * @returns {Promise<void>}
   */
  static async changePassword(userId, passwordData) {
    const { currentPassword, newPassword } = passwordData;

    await User.changePassword(userId, currentPassword, newPassword);

    logger.info('비밀번호 변경 완료', { userId });
  }

  /**
   * 사용자 프로필 조회
   * @param {number} userId - 사용자 ID
   * @returns {Promise<Object>} - 사용자 정보
   */
  static async getProfile(userId) {
    const user = await User.findById(userId);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
  }

  /**
   * 사용자 프로필 수정
   * @param {number} userId - 사용자 ID
   * @param {Object} updates - 수정할 정보
   * @returns {Promise<Object>} - 수정된 사용자 정보
   */
  static async updateProfile(userId, updates) {
    const user = await User.update(userId, updates);

    logger.info('프로필 수정 완료', { userId });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
  }

  /**
   * 사용자 계정 삭제
   * @param {number} userId - 사용자 ID
   * @returns {Promise<void>}
   */
  static async deleteAccount(userId) {
    await User.delete(userId);

    logger.info('계정 삭제 완료', { userId });
  }
}

export default AuthService;
