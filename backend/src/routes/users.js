import express from 'express';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { validateId } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { success } from '../utils/response.js';

const router = express.Router();

/**
 * GET /api/users/:id
 * 사용자 정보 조회 (공개 프로필)
 */
router.get(
  '/:id',
  authenticate,
  validateId('id'),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    // 공개 프로필 정보만 반환
    const publicProfile = {
      id: user.id,
      name: user.name,
      email: user.email
    };

    return success(res, publicProfile, '사용자 정보 조회 성공');
  })
);

export default router;
