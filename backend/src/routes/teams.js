import express from 'express';
import Team from '../models/Team.js';
import { authenticate, requireTeamMembership } from '../middleware/auth.js';
import { validate, validateId } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { teamSchemas } from '../utils/validators.js';
import { success, forbidden } from '../utils/response.js';

const router = express.Router();

/**
 * POST /api/teams
 * 팀 생성
 */
router.post(
  '/',
  authenticate,
  validate(teamSchemas.create),
  asyncHandler(async (req, res) => {
    const team = await Team.create({
      ...req.body,
      creatorId: req.user.userId
    });
    return success(res, team, '팀 생성 성공', 201);
  })
);

/**
 * GET /api/teams
 * 사용자가 속한 팀 목록 조회
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const teams = await Team.getUserTeams(req.user.userId);
    return success(res, teams, '팀 목록 조회 성공');
  })
);

/**
 * GET /api/teams/:id
 * 팀 상세 정보 조회
 */
router.get(
  '/:id',
  authenticate,
  validateId('id'),
  requireTeamMembership(false),
  asyncHandler(async (req, res) => {
    const team = await Team.findById(req.params.id);
    return success(res, team, '팀 조회 성공');
  })
);

/**
 * PUT /api/teams/:id
 * 팀 정보 수정 (팀장만)
 */
router.put(
  '/:id',
  authenticate,
  validateId('id'),
  requireTeamMembership(true),
  validate(teamSchemas.update),
  asyncHandler(async (req, res) => {
    const team = await Team.update(req.params.id, req.body);
    return success(res, team, '팀 정보 수정 성공');
  })
);

/**
 * DELETE /api/teams/:id
 * 팀 삭제 (팀장만)
 */
router.delete(
  '/:id',
  authenticate,
  validateId('id'),
  requireTeamMembership(true),
  asyncHandler(async (req, res) => {
    await Team.delete(req.params.id);
    return success(res, null, '팀 삭제 성공');
  })
);

/**
 * POST /api/teams/join
 * 초대 코드로 팀 참여
 */
router.post(
  '/join',
  authenticate,
  validate(teamSchemas.join),
  asyncHandler(async (req, res) => {
    const { inviteCode } = req.body;

    // 초대 코드로 팀 조회
    const team = await Team.findByInviteCode(inviteCode);
    if (!team) {
      return forbidden(res, '유효하지 않은 초대 코드입니다');
    }

    // 팀 멤버 추가
    await Team.addMember(team.id, req.user.userId, 'member');

    return success(res, team, '팀 참여 성공', 201);
  })
);

/**
 * POST /api/teams/:id/regenerate-code
 * 초대 코드 재생성 (팀장만)
 */
router.post(
  '/:id/regenerate-code',
  authenticate,
  validateId('id'),
  requireTeamMembership(true),
  asyncHandler(async (req, res) => {
    const inviteCode = await Team.regenerateInviteCode(req.params.id);
    return success(res, { inviteCode }, '초대 코드 재생성 성공');
  })
);

/**
 * GET /api/teams/:id/members
 * 팀 멤버 목록 조회
 */
router.get(
  '/:id/members',
  authenticate,
  validateId('id'),
  requireTeamMembership(false),
  asyncHandler(async (req, res) => {
    const members = await Team.getMembers(req.params.id);
    return success(res, members, '팀 멤버 조회 성공');
  })
);

/**
 * DELETE /api/teams/:teamId/members/:userId
 * 팀 멤버 제거 (팀장만)
 */
router.delete(
  '/:teamId/members/:userId',
  authenticate,
  validateId('teamId'),
  validateId('userId'),
  requireTeamMembership(true),
  asyncHandler(async (req, res) => {
    const { teamId, userId } = req.params;

    // 팀장 자신은 제거할 수 없음
    if (parseInt(userId, 10) === req.user.userId) {
      return forbidden(res, '팀장은 팀을 탈퇴할 수 없습니다');
    }

    await Team.removeMember(teamId, userId);
    return success(res, null, '팀 멤버 제거 성공');
  })
);

/**
 * POST /api/teams/:id/leave
 * 팀 탈퇴 (팀원만)
 */
router.post(
  '/:id/leave',
  authenticate,
  validateId('id'),
  requireTeamMembership(false),
  asyncHandler(async (req, res) => {
    const teamId = req.params.id;
    const userId = req.user.userId;

    // 팀장은 탈퇴할 수 없음
    const isLeader = await Team.isLeader(teamId, userId);
    if (isLeader) {
      return forbidden(res, '팀장은 팀을 탈퇴할 수 없습니다. 팀을 삭제하거나 다른 멤버를 팀장으로 지정해주세요.');
    }

    await Team.removeMember(teamId, userId);
    return success(res, null, '팀 탈퇴 성공');
  })
);

export default router;
