import express from 'express';
import Message from '../models/Message.js';
import Schedule from '../models/Schedule.js';
import Team from '../models/Team.js';
import { authenticate, requireTeamMembership } from '../middleware/auth.js';
import { validate, validateId } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { messageSchemas } from '../utils/validators.js';
import { success, forbidden } from '../utils/response.js';
import eventService from '../services/event-service.js';

const router = express.Router();

/**
 * POST /api/teams/:teamId/messages
 * 메시지 전송
 */
router.post(
  '/:teamId/messages',
  authenticate,
  validateId('teamId'),
  requireTeamMembership(false),
  validate(messageSchemas.send),
  asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const { messageType, relatedScheduleId } = req.body;

    // 일정 관련 메시지인 경우 권한 확인
    if (messageType === 'schedule_request' && relatedScheduleId) {
      const schedule = await Schedule.findById(relatedScheduleId);

      // 팀원만 일정 변경 요청 가능
      const isLeader = await Team.isLeader(schedule.team_id, req.user.userId);
      if (isLeader) {
        return forbidden(res, '팀장은 일정 변경 요청을 할 수 없습니다');
      }
    }

    if ((messageType === 'schedule_approved' || messageType === 'schedule_rejected') && relatedScheduleId) {
      const schedule = await Schedule.findById(relatedScheduleId);

      // 팀장만 일정 승인/거절 가능
      const isLeader = await Team.isLeader(schedule.team_id, req.user.userId);
      if (!isLeader) {
        return forbidden(res, '팀장만 일정 승인/거절을 할 수 있습니다');
      }
    }

    const message = await Message.create({
      ...req.body,
      teamId: parseInt(teamId, 10),
      senderId: req.user.userId
    });

    // Long Polling 이벤트 브로드캐스트
    eventService.broadcastToTeam(parseInt(teamId, 10), {
      type: 'new_message',
      message
    });

    return success(res, message, '메시지 전송 성공', 201);
  })
);

/**
 * GET /api/teams/:teamId/messages
 * 특정 날짜의 메시지 목록 조회
 */
router.get(
  '/:teamId/messages',
  authenticate,
  validateId('teamId'),
  requireTeamMembership(false),
  validate(messageSchemas.query, 'query'),
  asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const { targetDate, limit, offset } = req.query;

    const messages = await Message.findByTeamAndDate(
      parseInt(teamId, 10),
      targetDate,
      { limit, offset }
    );

    return success(res, messages, '메시지 목록 조회 성공');
  })
);

/**
 * DELETE /api/messages/:id
 * 메시지 삭제 (자신의 메시지만)
 */
router.delete(
  '/:id',
  authenticate,
  validateId('id'),
  asyncHandler(async (req, res) => {
    const message = await Message.findById(req.params.id);

    // 발신자만 삭제 가능
    if (message.sender_id !== req.user.userId) {
      return forbidden(res, '자신의 메시지만 삭제할 수 있습니다');
    }

    await Message.delete(req.params.id);

    // Long Polling 이벤트 브로드캐스트
    eventService.broadcastToTeam(message.team_id, {
      type: 'message_deleted',
      messageId: message.id
    });

    return success(res, null, '메시지 삭제 성공');
  })
);

/**
 * GET /api/teams/:teamId/messages/unread-count
 * 읽지 않은 메시지 수 조회
 */
router.get(
  '/:teamId/messages/unread-count',
  authenticate,
  validateId('teamId'),
  requireTeamMembership(false),
  asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const { lastRead } = req.query;

    if (!lastRead) {
      return success(res, { count: 0 }, '읽지 않은 메시지 수 조회 성공');
    }

    const count = await Message.getUnreadCount(
      parseInt(teamId, 10),
      new Date(lastRead)
    );

    return success(res, { count }, '읽지 않은 메시지 수 조회 성공');
  })
);

export default router;
