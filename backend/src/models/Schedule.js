import { query, transaction } from '../config/database.js';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors.js';
import logger from '../config/logger.js';

/**
 * Schedule 모델
 * Clean Architecture: Domain Layer
 */
class Schedule {
  /**
   * ID로 일정 조회
   * @param {number} id - 일정 ID
   * @returns {Promise<Object>} - 일정 정보
   */
  static async findById(id) {
    const result = await query(
      `SELECT id, title, content, start_datetime, end_datetime,
              schedule_type, creator_id, team_id, created_at, updated_at
       FROM schedules
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('일정을 찾을 수 없습니다');
    }

    return result.rows[0];
  }

  /**
   * 일정 충돌 감지
   * @param {number} userId - 사용자 ID
   * @param {Date} startDatetime - 시작 일시
   * @param {Date} endDatetime - 종료 일시
   * @param {number|null} excludeScheduleId - 제외할 일정 ID (수정 시)
   * @returns {Promise<boolean>} - 충돌 여부
   */
  static async checkConflict(userId, startDatetime, endDatetime, excludeScheduleId = null) {
    const result = await query(
      `SELECT check_schedule_conflict($1, $2, $3, $4) as has_conflict`,
      [userId, startDatetime, endDatetime, excludeScheduleId]
    );

    return result.rows[0].has_conflict;
  }

  /**
   * 일정 생성 (트랜잭션)
   * @param {Object} scheduleData - 일정 정보
   * @returns {Promise<Object>} - 생성된 일정 정보
   */
  static async create(scheduleData) {
    const {
      title,
      content,
      startDatetime,
      endDatetime,
      scheduleType,
      creatorId,
      teamId,
      participantIds = []
    } = scheduleData;

    // 7일 제한 검증
    const duration = new Date(endDatetime) - new Date(startDatetime);
    const maxDuration = 7 * 24 * 60 * 60 * 1000; // 7일
    if (duration > maxDuration) {
      throw new ValidationError('일정 기간은 최대 7일까지 가능합니다');
    }

    // 참가자 충돌 검사
    const participants = participantIds.length > 0 ? participantIds : [creatorId];
    for (const participantId of participants) {
      const hasConflict = await this.checkConflict(participantId, startDatetime, endDatetime);
      if (hasConflict) {
        throw new ConflictError('일정이 겹칩니다', {
          userId: participantId,
          startDatetime,
          endDatetime
        });
      }
    }

    return await transaction(async (client) => {
      // 일정 생성
      const scheduleResult = await client.query(
        `INSERT INTO schedules (title, content, start_datetime, end_datetime,
                                schedule_type, creator_id, team_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, title, content, start_datetime, end_datetime,
                   schedule_type, creator_id, team_id, created_at, updated_at`,
        [title, content || null, startDatetime, endDatetime, scheduleType, creatorId, teamId || null]
      );

      const schedule = scheduleResult.rows[0];

      // 참가자 추가
      for (const participantId of participants) {
        await client.query(
          `INSERT INTO schedule_participants (schedule_id, user_id, participation_status)
           VALUES ($1, $2, $3)`,
          [schedule.id, participantId, 'confirmed']
        );
      }

      logger.info('일정 생성 완료', {
        scheduleId: schedule.id,
        creatorId,
        scheduleType,
        participantCount: participants.length
      });

      return schedule;
    });
  }

  /**
   * 일정 수정
   * @param {number} id - 일정 ID
   * @param {Object} updates - 수정할 정보
   * @returns {Promise<Object>} - 수정된 일정 정보
   */
  static async update(id, updates) {
    const { title, content, startDatetime, endDatetime } = updates;

    // 시간 변경 시 충돌 검사
    if (startDatetime && endDatetime) {
      const schedule = await this.findById(id);
      const participants = await this.getParticipants(id);

      for (const participant of participants) {
        const hasConflict = await this.checkConflict(
          participant.user_id,
          startDatetime,
          endDatetime,
          id
        );
        if (hasConflict) {
          throw new ConflictError('일정이 겹칩니다', {
            userId: participant.user_id,
            startDatetime,
            endDatetime
          });
        }
      }
    }

    const result = await query(
      `UPDATE schedules
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           start_datetime = COALESCE($3, start_datetime),
           end_datetime = COALESCE($4, end_datetime)
       WHERE id = $5
       RETURNING id, title, content, start_datetime, end_datetime,
                 schedule_type, creator_id, team_id, created_at, updated_at`,
      [title, content, startDatetime, endDatetime, id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('일정을 찾을 수 없습니다');
    }

    logger.info('일정 수정 완료', { scheduleId: id });
    return result.rows[0];
  }

  /**
   * 일정 삭제
   * @param {number} id - 일정 ID
   * @returns {Promise<void>}
   */
  static async delete(id) {
    const result = await query(
      'DELETE FROM schedules WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('일정을 찾을 수 없습니다');
    }

    logger.info('일정 삭제 완료', { scheduleId: id });
  }

  /**
   * 일정 목록 조회
   * @param {Object} filters - 필터 조건
   * @returns {Promise<Array>} - 일정 목록
   */
  static async findAll(filters = {}) {
    const {
      userId,
      teamId,
      startDate,
      endDate,
      scheduleType,
      limit = 100,
      offset = 0
    } = filters;

    let whereClause = [];
    let params = [];
    let paramIndex = 1;

    // 사용자 필터 (참가자 기준)
    if (userId) {
      whereClause.push(`s.id IN (
        SELECT schedule_id FROM schedule_participants WHERE user_id = $${paramIndex}
      )`);
      params.push(userId);
      paramIndex++;
    }

    // 팀 필터
    if (teamId) {
      whereClause.push(`s.team_id = $${paramIndex}`);
      params.push(teamId);
      paramIndex++;
    }

    // 날짜 범위 필터
    if (startDate) {
      whereClause.push(`s.end_datetime >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereClause.push(`s.start_datetime <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    // 일정 타입 필터
    if (scheduleType && scheduleType !== 'all') {
      whereClause.push(`s.schedule_type = $${paramIndex}`);
      params.push(scheduleType);
      paramIndex++;
    }

    const whereString = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

    params.push(limit, offset);

    const result = await query(
      `SELECT s.id, s.title, s.content, s.start_datetime, s.end_datetime,
              s.schedule_type, s.creator_id, s.team_id, s.created_at, s.updated_at
       FROM schedules s
       ${whereString}
       ORDER BY s.start_datetime ASC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    return result.rows;
  }

  /**
   * 일정 참가자 추가
   * @param {number} scheduleId - 일정 ID
   * @param {number} userId - 사용자 ID
   * @param {string} status - 참가 상태
   * @returns {Promise<Object>} - 참가자 정보
   */
  static async addParticipant(scheduleId, userId, status = 'confirmed') {
    // 충돌 검사
    const schedule = await this.findById(scheduleId);
    const hasConflict = await this.checkConflict(
      userId,
      schedule.start_datetime,
      schedule.end_datetime
    );

    if (hasConflict) {
      throw new ConflictError('일정이 겹칩니다');
    }

    const result = await query(
      `INSERT INTO schedule_participants (schedule_id, user_id, participation_status)
       VALUES ($1, $2, $3)
       RETURNING id, schedule_id, user_id, participation_status, created_at`,
      [scheduleId, userId, status]
    );

    logger.info('일정 참가자 추가 완료', { scheduleId, userId, status });
    return result.rows[0];
  }

  /**
   * 일정 참가자 제거
   * @param {number} scheduleId - 일정 ID
   * @param {number} userId - 사용자 ID
   * @returns {Promise<void>}
   */
  static async removeParticipant(scheduleId, userId) {
    const result = await query(
      'DELETE FROM schedule_participants WHERE schedule_id = $1 AND user_id = $2 RETURNING id',
      [scheduleId, userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('참가자를 찾을 수 없습니다');
    }

    logger.info('일정 참가자 제거 완료', { scheduleId, userId });
  }

  /**
   * 일정 참가자 목록 조회
   * @param {number} scheduleId - 일정 ID
   * @returns {Promise<Array>} - 참가자 목록
   */
  static async getParticipants(scheduleId) {
    const result = await query(
      `SELECT sp.id, sp.schedule_id, sp.user_id, sp.participation_status, sp.created_at,
              u.name as user_name, u.email as user_email
       FROM schedule_participants sp
       JOIN users u ON sp.user_id = u.id
       WHERE sp.schedule_id = $1
       ORDER BY sp.created_at ASC`,
      [scheduleId]
    );

    return result.rows;
  }
}

export default Schedule;
