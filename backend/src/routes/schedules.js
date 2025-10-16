import express from 'express';
import Schedule from '../models/Schedule.js';
import Team from '../models/Team.js';
import { authenticate, requireTeamMembership } from '../middleware/auth.js';
import { validate, validateId } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { scheduleSchemas } from '../utils/validators.js';
import { success, forbidden } from '../utils/response.js';
import eventService from '../services/event-service.js';

const router = express.Router();

/**
 * POST /api/teams/:teamId/schedules
 * 일정 생성
 */
router.post(
  '/:teamId/schedules',
  authenticate,
  validateId('teamId'),
  requireTeamMembership(false),
  validate(scheduleSchemas.create),
  asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const { scheduleType } = req.body;

    // 팀 일정은 팀장만 생성 가능
    if (scheduleType === 'team') {
      const isLeader = await Team.isLeader(teamId, req.user.userId);
      if (!isLeader) {
        return forbidden(res, '팀 일정은 팀장만 생성할 수 있습니다');
      }
    }

    const schedule = await Schedule.create({
      ...req.body,
      creatorId: req.user.userId,
      teamId: scheduleType === 'team' ? teamId : null
    });

    // Long Polling 이벤트 브로드캐스트
    eventService.broadcastToTeam(parseInt(teamId, 10), {
      type: 'schedule_created',
      schedule
    });

    return success(res, schedule, '일정 생성 성공', 201);
  })
);

/**
 * GET /api/teams/:teamId/schedules
 * 팀 일정 목록 조회
 */
router.get(
  '/:teamId/schedules',
  authenticate,
  validateId('teamId'),
  requireTeamMembership(false),
  validate(scheduleSchemas.query, 'query'),
  asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const { startDate, endDate, scheduleType = 'all' } = req.query;

    const schedules = await Schedule.findAll({
      userId: req.user.userId,
      teamId: parseInt(teamId, 10),
      startDate,
      endDate,
      scheduleType
    });

    return success(res, schedules, '일정 목록 조회 성공');
  })
);

/**
 * GET /api/schedules/:id
 * 일정 상세 조회
 */
router.get(
  '/:id',
  authenticate,
  validateId('id'),
  asyncHandler(async (req, res) => {
    const schedule = await Schedule.findById(req.params.id);

    // 접근 권한 확인
    const participants = await Schedule.getParticipants(schedule.id);
    const isParticipant = participants.some(p => p.user_id === req.user.userId);

    if (!isParticipant) {
      return forbidden(res, '일정 참가자만 조회할 수 있습니다');
    }

    // 참가자 정보 포함
    const scheduleWithParticipants = {
      ...schedule,
      participants
    };

    return success(res, scheduleWithParticipants, '일정 조회 성공');
  })
);

/**
 * PUT /api/schedules/:id
 * 일정 수정
 */
router.put(
  '/:id',
  authenticate,
  validateId('id'),
  validate(scheduleSchemas.update),
  asyncHandler(async (req, res) => {
    const schedule = await Schedule.findById(req.params.id);

    // 권한 확인 (팀 일정은 팀장만, 개인 일정은 생성자만)
    if (schedule.schedule_type === 'team') {
      const isLeader = await Team.isLeader(schedule.team_id, req.user.userId);
      if (!isLeader) {
        return forbidden(res, '팀 일정은 팀장만 수정할 수 있습니다');
      }
    } else {
      if (schedule.creator_id !== req.user.userId) {
        return forbidden(res, '일정 생성자만 수정할 수 있습니다');
      }
    }

    const updatedSchedule = await Schedule.update(req.params.id, req.body);

    // Long Polling 이벤트 브로드캐스트
    if (schedule.team_id) {
      eventService.broadcastToTeam(schedule.team_id, {
        type: 'schedule_updated',
        schedule: updatedSchedule
      });
    }

    return success(res, updatedSchedule, '일정 수정 성공');
  })
);

/**
 * DELETE /api/schedules/:id
 * 일정 삭제
 */
router.delete(
  '/:id',
  authenticate,
  validateId('id'),
  asyncHandler(async (req, res) => {
    const schedule = await Schedule.findById(req.params.id);

    // 권한 확인 (팀 일정은 팀장만, 개인 일정은 생성자만)
    if (schedule.schedule_type === 'team') {
      const isLeader = await Team.isLeader(schedule.team_id, req.user.userId);
      if (!isLeader) {
        return forbidden(res, '팀 일정은 팀장만 삭제할 수 있습니다');
      }
    } else {
      if (schedule.creator_id !== req.user.userId) {
        return forbidden(res, '일정 생성자만 삭제할 수 있습니다');
      }
    }

    await Schedule.delete(req.params.id);

    // Long Polling 이벤트 브로드캐스트
    if (schedule.team_id) {
      eventService.broadcastToTeam(schedule.team_id, {
        type: 'schedule_deleted',
        scheduleId: schedule.id
      });
    }

    return success(res, null, '일정 삭제 성공');
  })
);

/**
 * GET /api/schedules/:id/participants
 * 일정 참가자 목록 조회
 */
router.get(
  '/:id/participants',
  authenticate,
  validateId('id'),
  asyncHandler(async (req, res) => {
    const schedule = await Schedule.findById(req.params.id);

    // 접근 권한 확인
    const participants = await Schedule.getParticipants(schedule.id);
    const isParticipant = participants.some(p => p.user_id === req.user.userId);

    if (!isParticipant) {
      return forbidden(res, '일정 참가자만 조회할 수 있습니다');
    }

    return success(res, participants, '참가자 목록 조회 성공');
  })
);

export default router;
