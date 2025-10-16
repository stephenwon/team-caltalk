import express from 'express';
import { authenticate, requireTeamMembership } from '../middleware/auth.js';
import { validateId } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/error-handler.js';
import eventService from '../services/event-service.js';
import logger from '../config/logger.js';

const router = express.Router();

/**
 * GET /api/teams/:teamId/poll
 * Long Polling 엔드포인트 (30초 타임아웃)
 */
router.get(
  '/:teamId/poll',
  authenticate,
  validateId('teamId'),
  requireTeamMembership(false),
  asyncHandler(async (req, res) => {
    const teamId = parseInt(req.params.teamId, 10);
    const userId = req.user.userId;
    const lastUpdate = req.query.lastUpdate
      ? new Date(req.query.lastUpdate)
      : new Date();

    logger.debug('Long Polling 연결 시도', { teamId, userId });

    // 클라이언트 등록 (30초 대기)
    eventService.registerClient(teamId, userId, res, lastUpdate);
  })
);

/**
 * GET /api/teams/:teamId/poll/status
 * Long Polling 상태 조회
 */
router.get(
  '/:teamId/poll/status',
  authenticate,
  validateId('teamId'),
  requireTeamMembership(false),
  asyncHandler(async (req, res) => {
    const teamId = parseInt(req.params.teamId, 10);
    const clientCount = eventService.getClientCount(teamId);

    return res.json({
      success: true,
      data: {
        teamId,
        connectedClients: clientCount
      },
      message: 'Long Polling 상태 조회 성공',
      timestamp: new Date().toISOString()
    });
  })
);

export default router;
