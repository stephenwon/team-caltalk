import { query, transaction } from '../config/database.js';
import bcrypt from 'bcrypt';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import logger from '../config/logger.js';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

/**
 * User 모델
 * Clean Architecture: Domain Layer
 */
class User {
  /**
   * 이메일로 사용자 조회
   * @param {string} email - 사용자 이메일
   * @returns {Promise<Object|null>} - 사용자 정보
   */
  static async findByEmail(email) {
    const result = await query(
      'SELECT id, email, name, password_hash, created_at, updated_at FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  /**
   * ID로 사용자 조회
   * @param {number} id - 사용자 ID
   * @returns {Promise<Object>} - 사용자 정보
   */
  static async findById(id) {
    const result = await query(
      'SELECT id, email, name, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('사용자를 찾을 수 없습니다');
    }

    return result.rows[0];
  }

  /**
   * 사용자 생성
   * @param {Object} userData - 사용자 정보
   * @param {string} userData.email - 이메일
   * @param {string} userData.name - 이름
   * @param {string} userData.password - 비밀번호
   * @returns {Promise<Object>} - 생성된 사용자 정보
   */
  static async create({ email, name, password }) {
    // 이메일 중복 확인
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new ValidationError('이미 사용 중인 이메일입니다');
    }

    // 비밀번호 해싱
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const result = await query(
      `INSERT INTO users (email, name, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, created_at, updated_at`,
      [email, name, passwordHash]
    );

    logger.info('사용자 생성 완료', { userId: result.rows[0].id, email });
    return result.rows[0];
  }

  /**
   * 비밀번호 검증
   * @param {string} plainPassword - 평문 비밀번호
   * @param {string} hashedPassword - 해시된 비밀번호
   * @returns {Promise<boolean>} - 일치 여부
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * 사용자 정보 수정
   * @param {number} id - 사용자 ID
   * @param {Object} updates - 수정할 정보
   * @returns {Promise<Object>} - 수정된 사용자 정보
   */
  static async update(id, updates) {
    const { name } = updates;

    const result = await query(
      `UPDATE users
       SET name = COALESCE($1, name)
       WHERE id = $2
       RETURNING id, email, name, created_at, updated_at`,
      [name, id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('사용자를 찾을 수 없습니다');
    }

    logger.info('사용자 정보 수정 완료', { userId: id });
    return result.rows[0];
  }

  /**
   * 비밀번호 변경
   * @param {number} id - 사용자 ID
   * @param {string} currentPassword - 현재 비밀번호
   * @param {string} newPassword - 새 비밀번호
   * @returns {Promise<void>}
   */
  static async changePassword(id, currentPassword, newPassword) {
    // 현재 비밀번호 확인
    const user = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [id]
    );

    if (user.rows.length === 0) {
      throw new NotFoundError('사용자를 찾을 수 없습니다');
    }

    const isValid = await this.verifyPassword(currentPassword, user.rows[0].password_hash);
    if (!isValid) {
      throw new ValidationError('현재 비밀번호가 일치하지 않습니다');
    }

    // 새 비밀번호 해싱 및 업데이트
    const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, id]
    );

    logger.info('비밀번호 변경 완료', { userId: id });
  }

  /**
   * 사용자 삭제
   * @param {number} id - 사용자 ID
   * @returns {Promise<void>}
   */
  static async delete(id) {
    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('사용자를 찾을 수 없습니다');
    }

    logger.info('사용자 삭제 완료', { userId: id });
  }

  /**
   * 사용자 목록 조회
   * @param {Object} filters - 필터 조건
   * @returns {Promise<Array>} - 사용자 목록
   */
  static async findAll(filters = {}) {
    const { limit = 50, offset = 0 } = filters;

    const result = await query(
      `SELECT id, email, name, created_at, updated_at
       FROM users
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows;
  }
}

export default User;
