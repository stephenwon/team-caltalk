import { query, transaction } from '../config/database.js';
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/errors.js';
import logger from '../config/logger.js';

/**
 * Team 모델
 * Clean Architecture: Domain Layer
 */
class Team {
  /**
   * ID로 팀 조회
   * @param {number} id - 팀 ID
   * @returns {Promise<Object>} - 팀 정보
   */
  static async findById(id) {
    const result = await query(
      `SELECT id, name, description, invite_code, creator_id, created_at, updated_at
       FROM teams
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('팀을 찾을 수 없습니다');
    }

    return result.rows[0];
  }

  /**
   * 초대 코드로 팀 조회
   * @param {string} inviteCode - 초대 코드
   * @returns {Promise<Object|null>} - 팀 정보
   */
  static async findByInviteCode(inviteCode) {
    const result = await query(
      `SELECT id, name, description, invite_code, creator_id, created_at, updated_at
       FROM teams
       WHERE invite_code = $1`,
      [inviteCode]
    );

    return result.rows[0] || null;
  }

  /**
   * 팀 생성 (트랜잭션)
   * @param {Object} teamData - 팀 정보
   * @param {string} teamData.name - 팀 이름
   * @param {string} teamData.description - 팀 설명
   * @param {number} teamData.creatorId - 생성자 ID
   * @returns {Promise<Object>} - 생성된 팀 정보
   */
  static async create({ name, description, creatorId }) {
    return await transaction(async (client) => {
      // 초대 코드 생성
      const inviteCodeResult = await client.query('SELECT generate_invite_code() as code');
      const inviteCode = inviteCodeResult.rows[0].code;

      // 팀 생성
      const teamResult = await client.query(
        `INSERT INTO teams (name, description, invite_code, creator_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, description, invite_code, creator_id, created_at, updated_at`,
        [name, description || null, inviteCode, creatorId]
      );

      const team = teamResult.rows[0];

      // 생성자를 팀장으로 추가
      await client.query(
        `INSERT INTO team_members (team_id, user_id, role)
         VALUES ($1, $2, $3)`,
        [team.id, creatorId, 'leader']
      );

      logger.info('팀 생성 완료', { teamId: team.id, creatorId, inviteCode });
      return team;
    });
  }

  /**
   * 팀 정보 수정
   * @param {number} id - 팀 ID
   * @param {Object} updates - 수정할 정보
   * @returns {Promise<Object>} - 수정된 팀 정보
   */
  static async update(id, updates) {
    const { name, description } = updates;

    const result = await query(
      `UPDATE teams
       SET name = COALESCE($1, name),
           description = COALESCE($2, description)
       WHERE id = $3
       RETURNING id, name, description, invite_code, creator_id, created_at, updated_at`,
      [name, description, id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('팀을 찾을 수 없습니다');
    }

    logger.info('팀 정보 수정 완료', { teamId: id });
    return result.rows[0];
  }

  /**
   * 팀 삭제
   * @param {number} id - 팀 ID
   * @returns {Promise<void>}
   */
  static async delete(id) {
    const result = await query(
      'DELETE FROM teams WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('팀을 찾을 수 없습니다');
    }

    logger.info('팀 삭제 완료', { teamId: id });
  }

  /**
   * 초대 코드 재생성
   * @param {number} teamId - 팀 ID
   * @returns {Promise<string>} - 새 초대 코드
   */
  static async regenerateInviteCode(teamId) {
    const inviteCodeResult = await query('SELECT generate_invite_code() as code');
    const newCode = inviteCodeResult.rows[0].code;

    const result = await query(
      `UPDATE teams
       SET invite_code = $1
       WHERE id = $2
       RETURNING invite_code`,
      [newCode, teamId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('팀을 찾을 수 없습니다');
    }

    logger.info('초대 코드 재생성 완료', { teamId, newCode });
    return result.rows[0].invite_code;
  }

  /**
   * 팀 멤버 추가
   * @param {number} teamId - 팀 ID
   * @param {number} userId - 사용자 ID
   * @param {string} role - 역할 (leader, member)
   * @returns {Promise<Object>} - 멤버 정보
   */
  static async addMember(teamId, userId, role = 'member') {
    // 이미 멤버인지 확인
    const existing = await query(
      'SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, userId]
    );

    if (existing.rows.length > 0) {
      throw new ValidationError('이미 팀 멤버입니다');
    }

    const result = await query(
      `INSERT INTO team_members (team_id, user_id, role)
       VALUES ($1, $2, $3)
       RETURNING id, team_id, user_id, role, joined_at`,
      [teamId, userId, role]
    );

    logger.info('팀 멤버 추가 완료', { teamId, userId, role });
    return result.rows[0];
  }

  /**
   * 팀 멤버 제거
   * @param {number} teamId - 팀 ID
   * @param {number} userId - 사용자 ID
   * @returns {Promise<void>}
   */
  static async removeMember(teamId, userId) {
    const result = await query(
      'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2 RETURNING id',
      [teamId, userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('팀 멤버를 찾을 수 없습니다');
    }

    logger.info('팀 멤버 제거 완료', { teamId, userId });
  }

  /**
   * 팀 멤버 목록 조회
   * @param {number} teamId - 팀 ID
   * @returns {Promise<Array>} - 멤버 목록
   */
  static async getMembers(teamId) {
    const result = await query(
      `SELECT tm.id, tm.team_id, tm.user_id, tm.role, tm.joined_at,
              u.name as user_name, u.email as user_email
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = $1
       ORDER BY tm.role DESC, tm.joined_at ASC`,
      [teamId]
    );

    return result.rows;
  }

  /**
   * 사용자의 팀 멤버십 조회
   * @param {number} teamId - 팀 ID
   * @param {number} userId - 사용자 ID
   * @returns {Promise<Object|null>} - 멤버십 정보
   */
  static async getMembership(teamId, userId) {
    const result = await query(
      `SELECT id, team_id, user_id, role, joined_at
       FROM team_members
       WHERE team_id = $1 AND user_id = $2`,
      [teamId, userId]
    );

    return result.rows[0] || null;
  }

  /**
   * 사용자가 속한 팀 목록 조회
   * @param {number} userId - 사용자 ID
   * @returns {Promise<Array>} - 팀 목록
   */
  static async getUserTeams(userId) {
    const result = await query(
      `SELECT t.id, t.name, t.description, t.invite_code, t.creator_id,
              t.created_at, t.updated_at, tm.role, tm.joined_at
       FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       WHERE tm.user_id = $1
       ORDER BY tm.joined_at DESC`,
      [userId]
    );

    return result.rows;
  }

  /**
   * 사용자가 팀장인지 확인
   * @param {number} teamId - 팀 ID
   * @param {number} userId - 사용자 ID
   * @returns {Promise<boolean>} - 팀장 여부
   */
  static async isLeader(teamId, userId) {
    const result = await query(
      `SELECT role FROM team_members
       WHERE team_id = $1 AND user_id = $2`,
      [teamId, userId]
    );

    return result.rows.length > 0 && result.rows[0].role === 'leader';
  }

  /**
   * 사용자가 팀 멤버인지 확인
   * @param {number} teamId - 팀 ID
   * @param {number} userId - 사용자 ID
   * @returns {Promise<boolean>} - 멤버 여부
   */
  static async isMember(teamId, userId) {
    const result = await query(
      `SELECT id FROM team_members
       WHERE team_id = $1 AND user_id = $2`,
      [teamId, userId]
    );

    return result.rows.length > 0;
  }
}

export default Team;
