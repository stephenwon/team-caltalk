import { query } from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';
import logger from '../config/logger.js';

/**
 * Message 모델
 * Clean Architecture: Domain Layer
 */
class Message {
  /**
   * ID로 메시지 조회
   * @param {number} id - 메시지 ID
   * @returns {Promise<Object>} - 메시지 정보
   */
  static async findById(id) {
    const result = await query(
      `SELECT id, team_id, sender_id, content, target_date,
              related_schedule_id, message_type, sent_at, created_at
       FROM messages
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('메시지를 찾을 수 없습니다');
    }

    return result.rows[0];
  }

  /**
   * 메시지 전송
   * @param {Object} messageData - 메시지 정보
   * @returns {Promise<Object>} - 생성된 메시지 정보
   */
  static async create(messageData) {
    const {
      teamId,
      senderId,
      content,
      targetDate,
      messageType = 'normal',
      relatedScheduleId = null
    } = messageData;

    const result = await query(
      `INSERT INTO messages (team_id, sender_id, content, target_date,
                             message_type, related_schedule_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, team_id, sender_id, content, target_date,
                 related_schedule_id, message_type, sent_at, created_at`,
      [teamId, senderId, content, targetDate, messageType, relatedScheduleId]
    );

    logger.info('메시지 전송 완료', {
      messageId: result.rows[0].id,
      teamId,
      senderId,
      messageType
    });

    return result.rows[0];
  }

  /**
   * 메시지 삭제
   * @param {number} id - 메시지 ID
   * @returns {Promise<void>}
   */
  static async delete(id) {
    const result = await query(
      'DELETE FROM messages WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('메시지를 찾을 수 없습니다');
    }

    logger.info('메시지 삭제 완료', { messageId: id });
  }

  /**
   * 팀의 특정 날짜 메시지 목록 조회
   * @param {number} teamId - 팀 ID
   * @param {Date} targetDate - 대상 날짜
   * @param {Object} options - 옵션 (limit, offset)
   * @returns {Promise<Array>} - 메시지 목록
   */
  static async findByTeamAndDate(teamId, targetDate, options = {}) {
    const { limit = 50, offset = 0 } = options;

    const result = await query(
      `SELECT m.id, m.team_id, m.sender_id, m.content, m.target_date,
              m.related_schedule_id, m.message_type, m.sent_at, m.created_at,
              u.name as sender_name, u.email as sender_email
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.team_id = $1 AND m.target_date = $2
       ORDER BY m.sent_at ASC
       LIMIT $3 OFFSET $4`,
      [teamId, targetDate, limit, offset]
    );

    return result.rows;
  }

  /**
   * 팀의 최신 메시지 조회 (Long Polling용)
   * @param {number} teamId - 팀 ID
   * @param {Date} since - 이후 메시지
   * @returns {Promise<Array>} - 메시지 목록
   */
  static async findNewMessages(teamId, since) {
    const result = await query(
      `SELECT m.id, m.team_id, m.sender_id, m.content, m.target_date,
              m.related_schedule_id, m.message_type, m.sent_at, m.created_at,
              u.name as sender_name, u.email as sender_email
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.team_id = $1 AND m.sent_at > $2
       ORDER BY m.sent_at ASC`,
      [teamId, since]
    );

    return result.rows;
  }

  /**
   * 팀의 읽지 않은 메시지 수 조회
   * @param {number} teamId - 팀 ID
   * @param {Date} lastRead - 마지막 읽은 시간
   * @returns {Promise<number>} - 읽지 않은 메시지 수
   */
  static async getUnreadCount(teamId, lastRead) {
    const result = await query(
      `SELECT COUNT(*) as count
       FROM messages
       WHERE team_id = $1 AND sent_at > $2`,
      [teamId, lastRead]
    );

    return parseInt(result.rows[0].count, 10);
  }

  /**
   * 일정 관련 메시지 조회
   * @param {number} scheduleId - 일정 ID
   * @returns {Promise<Array>} - 메시지 목록
   */
  static async findBySchedule(scheduleId) {
    const result = await query(
      `SELECT m.id, m.team_id, m.sender_id, m.content, m.target_date,
              m.related_schedule_id, m.message_type, m.sent_at, m.created_at,
              u.name as sender_name, u.email as sender_email
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.related_schedule_id = $1
       ORDER BY m.sent_at ASC`,
      [scheduleId]
    );

    return result.rows;
  }

  /**
   * 팀의 날짜 범위 내 메시지 조회
   * @param {number} teamId - 팀 ID
   * @param {Date} startDate - 시작 날짜
   * @param {Date} endDate - 종료 날짜
   * @returns {Promise<Array>} - 메시지 목록
   */
  static async findByDateRange(teamId, startDate, endDate) {
    const result = await query(
      `SELECT m.id, m.team_id, m.sender_id, m.content, m.target_date,
              m.related_schedule_id, m.message_type, m.sent_at, m.created_at,
              u.name as sender_name, u.email as sender_email
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.team_id = $1
         AND m.target_date >= $2
         AND m.target_date <= $3
       ORDER BY m.sent_at ASC`,
      [teamId, startDate, endDate]
    );

    return result.rows;
  }

  /**
   * 메시지 타입별 조회
   * @param {number} teamId - 팀 ID
   * @param {string} messageType - 메시지 타입
   * @param {Object} options - 옵션
   * @returns {Promise<Array>} - 메시지 목록
   */
  static async findByType(teamId, messageType, options = {}) {
    const { limit = 50, offset = 0 } = options;

    const result = await query(
      `SELECT m.id, m.team_id, m.sender_id, m.content, m.target_date,
              m.related_schedule_id, m.message_type, m.sent_at, m.created_at,
              u.name as sender_name, u.email as sender_email
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.team_id = $1 AND m.message_type = $2
       ORDER BY m.sent_at DESC
       LIMIT $3 OFFSET $4`,
      [teamId, messageType, limit, offset]
    );

    return result.rows;
  }
}

export default Message;
