import express from 'express';
import { query } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { success } from '../utils/response.js';

const router = express.Router();

/**
 * GET /api/activities
 * 최근 활동 내역 조회 (대시보드용)
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit, 10) || 20;

    // 최근 1개월 활동 조회
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // 사용자가 속한 팀들의 최근 활동
    const result = await query(
      `
      WITH user_teams AS (
        SELECT team_id FROM team_members WHERE user_id = $1
      ),
      recent_schedules AS (
        SELECT
          'schedule' as activity_type,
          s.id as activity_id,
          s.title as activity_title,
          s.created_at as activity_time,
          s.team_id,
          t.name as team_name,
          u.name as user_name
        FROM schedules s
        JOIN teams t ON s.team_id = t.id
        JOIN users u ON s.creator_id = u.id
        WHERE s.team_id IN (SELECT team_id FROM user_teams)
          AND s.created_at >= $2
      ),
      recent_messages AS (
        SELECT
          'message' as activity_type,
          m.id as activity_id,
          SUBSTRING(m.content, 1, 50) as activity_title,
          m.sent_at as activity_time,
          m.team_id,
          t.name as team_name,
          u.name as user_name
        FROM messages m
        JOIN teams t ON m.team_id = t.id
        JOIN users u ON m.sender_id = u.id
        WHERE m.team_id IN (SELECT team_id FROM user_teams)
          AND m.sent_at >= $2
      ),
      recent_team_joins AS (
        SELECT
          'team_join' as activity_type,
          tm.id as activity_id,
          '팀 참여' as activity_title,
          tm.joined_at as activity_time,
          tm.team_id,
          t.name as team_name,
          u.name as user_name
        FROM team_members tm
        JOIN teams t ON tm.team_id = t.id
        JOIN users u ON tm.user_id = u.id
        WHERE tm.team_id IN (SELECT team_id FROM user_teams)
          AND tm.joined_at >= $2
      )
      SELECT * FROM (
        SELECT * FROM recent_schedules
        UNION ALL
        SELECT * FROM recent_messages
        UNION ALL
        SELECT * FROM recent_team_joins
      ) AS all_activities
      ORDER BY activity_time DESC
      LIMIT $3
      `,
      [userId, oneMonthAgo.toISOString(), limit]
    );

    return success(res, result.rows, '활동 내역 조회 성공');
  })
);

/**
 * GET /api/activities/summary
 * 활동 요약 정보 조회
 */
router.get(
  '/summary',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    // 팀 수, 일정 수, 메시지 수 조회
    const result = await query(
      `
      WITH user_teams AS (
        SELECT team_id FROM team_members WHERE user_id = $1
      )
      SELECT
        (SELECT COUNT(*) FROM user_teams) as team_count,
        (SELECT COUNT(*) FROM schedules s
         WHERE s.team_id IN (SELECT team_id FROM user_teams)
           OR s.creator_id = $1) as schedule_count,
        (SELECT COUNT(*) FROM messages m
         WHERE m.team_id IN (SELECT team_id FROM user_teams)) as message_count,
        (SELECT COUNT(*) FROM team_members tm
         WHERE tm.team_id IN (SELECT team_id FROM user_teams)) as total_member_count
      `,
      [userId]
    );

    const summary = result.rows[0];

    return success(res, {
      teamCount: parseInt(summary.team_count, 10),
      scheduleCount: parseInt(summary.schedule_count, 10),
      messageCount: parseInt(summary.message_count, 10),
      totalMemberCount: parseInt(summary.total_member_count, 10)
    }, '활동 요약 조회 성공');
  })
);

export default router;
