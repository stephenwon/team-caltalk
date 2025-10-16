import express from 'express';
import AuthService from '../services/auth-service.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { userSchemas } from '../utils/validators.js';
import { success } from '../utils/response.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * 회원가입
 */
router.post(
  '/register',
  validate(userSchemas.register),
  asyncHandler(async (req, res) => {
    const result = await AuthService.register(req.body);
    return success(res, result, '회원가입 성공', 201);
  })
);

/**
 * POST /api/auth/login
 * 로그인
 */
router.post(
  '/login',
  validate(userSchemas.login),
  asyncHandler(async (req, res) => {
    const result = await AuthService.login(req.body);
    return success(res, result, '로그인 성공');
  })
);

/**
 * POST /api/auth/logout
 * 로그아웃 (클라이언트에서 토큰 삭제)
 */
router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    return success(res, null, '로그아웃 성공');
  })
);

/**
 * GET /api/auth/me
 * 현재 사용자 정보 조회
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await AuthService.getProfile(req.user.userId);
    return success(res, user, '사용자 정보 조회 성공');
  })
);

/**
 * PUT /api/auth/profile
 * 사용자 프로필 수정
 */
router.put(
  '/profile',
  authenticate,
  validate(userSchemas.updateProfile),
  asyncHandler(async (req, res) => {
    const user = await AuthService.updateProfile(req.user.userId, req.body);
    return success(res, user, '프로필 수정 성공');
  })
);

/**
 * PUT /api/auth/password
 * 비밀번호 변경
 */
router.put(
  '/password',
  authenticate,
  validate(userSchemas.changePassword),
  asyncHandler(async (req, res) => {
    await AuthService.changePassword(req.user.userId, req.body);
    return success(res, null, '비밀번호 변경 성공');
  })
);

/**
 * DELETE /api/auth/account
 * 계정 삭제
 */
router.delete(
  '/account',
  authenticate,
  asyncHandler(async (req, res) => {
    await AuthService.deleteAccount(req.user.userId);
    return success(res, null, '계정 삭제 성공');
  })
);

export default router;
