const request = require('supertest');
const express = require('express');
const {
  createTestUser,
  createTestTeam,
  generateTestToken,
  setupBasicScenario,
} = require('../fixtures');

/**
 * 팀 API 통합 테스트
 *
 * 테스트 엔드포인트:
 * - POST /api/teams - 팀 생성
 * - GET /api/teams - 내 팀 목록 조회
 * - GET /api/teams/:id - 팀 상세 조회
 * - PATCH /api/teams/:id - 팀 정보 수정
 * - DELETE /api/teams/:id - 팀 삭제
 * - POST /api/teams/join - 초대 코드로 팀 참여
 * - DELETE /api/teams/:id/members/:userId - 팀원 제거
 */

describe('팀 API 통합 테스트', () => {
  let pool;
  let app;

  beforeAll(() => {
    pool = global.testPool;

    // Express 앱 설정
    app = express();
    app.use(express.json());

    // 인증 미들웨어 Mock
    const authMiddleware = (req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: { message: '인증이 필요합니다' }
        });
      }

      try {
        const jwt = require('jsonwebtoken');
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
      } catch (error) {
        return res.status(401).json({
          success: false,
          error: { message: '유효하지 않은 토큰입니다' }
        });
      }
    };

    // Mock 라우터
    app.post('/api/teams', authMiddleware, async (req, res) => {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: { message: '팀 이름은 필수입니다' }
        });
      }

      if (name.length < 2 || name.length > 30) {
        return res.status(400).json({
          success: false,
          error: { message: '팀 이름은 2-30자여야 합니다' }
        });
      }

      try {
        const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const result = await pool.query(
          `INSERT INTO teams (name, description, invite_code, creator_id)
           VALUES ($1, $2, $3, $4)
           RETURNING id, name, description, invite_code, creator_id, created_at`,
          [name, description, inviteCode, req.userId]
        );

        // 팀장을 team_members에 추가
        await pool.query(
          `INSERT INTO team_members (team_id, user_id, role)
           VALUES ($1, $2, $3)`,
          [result.rows[0].id, req.userId, 'leader']
        );

        res.status(201).json({
          success: true,
          data: result.rows[0],
          message: '팀이 생성되었습니다'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: { message: '서버 오류가 발생했습니다' }
        });
      }
    });

    app.get('/api/teams', authMiddleware, async (req, res) => {
      try {
        const result = await pool.query(
          `SELECT t.*, tm.role
           FROM teams t
           JOIN team_members tm ON t.id = tm.team_id
           WHERE tm.user_id = $1
           ORDER BY t.created_at DESC`,
          [req.userId]
        );

        res.json({
          success: true,
          data: result.rows
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: { message: '서버 오류가 발생했습니다' }
        });
      }
    });

    app.get('/api/teams/:id', authMiddleware, async (req, res) => {
      const { id } = req.params;

      try {
        // 팀 정보 조회
        const teamResult = await pool.query(
          'SELECT * FROM teams WHERE id = $1',
          [id]
        );

        if (teamResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: { message: '팀을 찾을 수 없습니다' }
          });
        }

        // 사용자가 팀 멤버인지 확인
        const memberResult = await pool.query(
          'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
          [id, req.userId]
        );

        if (memberResult.rows.length === 0) {
          return res.status(403).json({
            success: false,
            error: { message: '팀에 접근할 권한이 없습니다' }
          });
        }

        // 팀 멤버 목록 조회
        const membersResult = await pool.query(
          `SELECT u.id, u.name, u.email, tm.role, tm.joined_at
           FROM users u
           JOIN team_members tm ON u.id = tm.user_id
           WHERE tm.team_id = $1
           ORDER BY tm.role DESC, tm.joined_at`,
          [id]
        );

        res.json({
          success: true,
          data: {
            team: teamResult.rows[0],
            members: membersResult.rows,
            myRole: memberResult.rows[0].role
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: { message: '서버 오류가 발생했습니다' }
        });
      }
    });

    app.patch('/api/teams/:id', authMiddleware, async (req, res) => {
      const { id } = req.params;
      const { name, description } = req.body;

      try {
        // 팀장 권한 확인
        const roleResult = await pool.query(
          'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
          [id, req.userId]
        );

        if (roleResult.rows.length === 0) {
          return res.status(403).json({
            success: false,
            error: { message: '팀에 접근할 권한이 없습니다' }
          });
        }

        if (roleResult.rows[0].role !== 'leader') {
          return res.status(403).json({
            success: false,
            error: { message: '팀장만 팀 정보를 수정할 수 있습니다' }
          });
        }

        if (name && (name.length < 2 || name.length > 30)) {
          return res.status(400).json({
            success: false,
            error: { message: '팀 이름은 2-30자여야 합니다' }
          });
        }

        const result = await pool.query(
          `UPDATE teams
           SET name = COALESCE($1, name),
               description = COALESCE($2, description)
           WHERE id = $3
           RETURNING *`,
          [name, description, id]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: { message: '팀을 찾을 수 없습니다' }
          });
        }

        res.json({
          success: true,
          data: result.rows[0],
          message: '팀 정보가 수정되었습니다'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: { message: '서버 오류가 발생했습니다' }
        });
      }
    });

    app.delete('/api/teams/:id', authMiddleware, async (req, res) => {
      const { id } = req.params;

      try {
        // 팀장 권한 확인
        const roleResult = await pool.query(
          'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
          [id, req.userId]
        );

        if (roleResult.rows.length === 0) {
          return res.status(403).json({
            success: false,
            error: { message: '팀에 접근할 권한이 없습니다' }
          });
        }

        if (roleResult.rows[0].role !== 'leader') {
          return res.status(403).json({
            success: false,
            error: { message: '팀장만 팀을 삭제할 수 있습니다' }
          });
        }

        await pool.query('DELETE FROM teams WHERE id = $1', [id]);

        res.json({
          success: true,
          message: '팀이 삭제되었습니다'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: { message: '서버 오류가 발생했습니다' }
        });
      }
    });

    app.post('/api/teams/join', authMiddleware, async (req, res) => {
      const { inviteCode } = req.body;

      if (!inviteCode) {
        return res.status(400).json({
          success: false,
          error: { message: '초대 코드는 필수입니다' }
        });
      }

      try {
        // 초대 코드로 팀 조회
        const teamResult = await pool.query(
          'SELECT id, name FROM teams WHERE invite_code = $1',
          [inviteCode.toUpperCase()]
        );

        if (teamResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: { message: '유효하지 않은 초대 코드입니다' }
          });
        }

        const team = teamResult.rows[0];

        // 이미 팀 멤버인지 확인
        const memberResult = await pool.query(
          'SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2',
          [team.id, req.userId]
        );

        if (memberResult.rows.length > 0) {
          return res.status(409).json({
            success: false,
            error: { message: '이미 팀에 참여하고 있습니다' }
          });
        }

        // 팀원으로 추가
        await pool.query(
          `INSERT INTO team_members (team_id, user_id, role)
           VALUES ($1, $2, $3)`,
          [team.id, req.userId, 'member']
        );

        res.status(201).json({
          success: true,
          data: team,
          message: '팀에 참여했습니다'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: { message: '서버 오류가 발생했습니다' }
        });
      }
    });

    app.delete('/api/teams/:teamId/members/:userId', authMiddleware, async (req, res) => {
      const { teamId, userId } = req.params;

      try {
        // 팀장 권한 확인
        const roleResult = await pool.query(
          'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
          [teamId, req.userId]
        );

        if (roleResult.rows.length === 0) {
          return res.status(403).json({
            success: false,
            error: { message: '팀에 접근할 권한이 없습니다' }
          });
        }

        if (roleResult.rows[0].role !== 'leader') {
          return res.status(403).json({
            success: false,
            error: { message: '팀장만 팀원을 제거할 수 있습니다' }
          });
        }

        // 자기 자신은 제거할 수 없음
        if (req.userId === parseInt(userId)) {
          return res.status(400).json({
            success: false,
            error: { message: '자신을 팀에서 제거할 수 없습니다' }
          });
        }

        const result = await pool.query(
          'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2 RETURNING id',
          [teamId, userId]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: { message: '팀원을 찾을 수 없습니다' }
          });
        }

        res.json({
          success: true,
          message: '팀원이 제거되었습니다'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: { message: '서버 오류가 발생했습니다' }
        });
      }
    });
  });

  describe('POST /api/teams - 팀 생성', () => {
    test('유효한 데이터로 팀 생성 성공', async () => {
      // Given: 인증된 사용자
      const user = await createTestUser(pool);
      const token = generateTestToken(user.id);

      // When: 팀 생성 요청
      const response = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: '개발팀',
          description: '개발 프로젝트 팀'
        })
        .expect(201);

      // Then: 응답 검증
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('개발팀');
      expect(response.body.data.invite_code).toBeDefined();
      expect(response.body.data.invite_code).toHaveLength(6);
      expect(response.body.data.creator_id).toBe(user.id);
    });

    test('인증 없이 팀 생성 실패', async () => {
      // When: 토큰 없이 팀 생성 시도
      const response = await request(app)
        .post('/api/teams')
        .send({
          name: '개발팀'
        })
        .expect(401);

      // Then: 인증 실패
      expect(response.body.success).toBe(false);
    });

    test('팀 이름 누락 시 실패', async () => {
      // Given: 인증된 사용자
      const user = await createTestUser(pool);
      const token = generateTestToken(user.id);

      // When: 팀 이름 없이 요청
      const response = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: '설명만 있음'
        })
        .expect(400);

      // Then: 검증 에러
      expect(response.body.success).toBe(false);
    });

    test('팀 이름 길이 검증 실패', async () => {
      // Given: 인증된 사용자
      const user = await createTestUser(pool);
      const token = generateTestToken(user.id);

      // When: 긴 팀 이름으로 요청
      const response = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'A'.repeat(31)
        })
        .expect(400);

      // Then: 검증 에러
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/teams - 내 팀 목록 조회', () => {
    test('내가 속한 팀 목록 조회 성공', async () => {
      // Given: 기본 시나리오 (사용자가 1개 팀에 속함)
      const { users, tokens } = await setupBasicScenario(pool);

      // When: 팀 목록 조회
      const response = await request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .expect(200);

      // Then: 팀 목록 확인
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].role).toBe('leader');
    });

    test('여러 팀에 속한 경우', async () => {
      // Given: 사용자가 여러 팀에 속함
      const user = await createTestUser(pool);
      const token = generateTestToken(user.id);

      // 3개 팀 생성
      await createTestTeam(pool, user.id, { name: '팀1' });
      await createTestTeam(pool, user.id, { name: '팀2' });
      await createTestTeam(pool, user.id, { name: '팀3' });

      // When: 팀 목록 조회
      const response = await request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Then: 3개 팀 조회
      expect(response.body.data).toHaveLength(3);
    });

    test('속한 팀이 없는 경우', async () => {
      // Given: 팀에 속하지 않은 사용자
      const user = await createTestUser(pool);
      const token = generateTestToken(user.id);

      // When: 팀 목록 조회
      const response = await request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Then: 빈 배열
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/teams/:id - 팀 상세 조회', () => {
    test('팀 상세 정보 조회 성공', async () => {
      // Given: 기본 시나리오
      const { team, tokens } = await setupBasicScenario(pool);

      // When: 팀 상세 조회
      const response = await request(app)
        .get(`/api/teams/${team.id}`)
        .set('Authorization', `Bearer ${tokens[0]}`)
        .expect(200);

      // Then: 팀 정보 및 멤버 목록 확인
      expect(response.body.success).toBe(true);
      expect(response.body.data.team.id).toBe(team.id);
      expect(response.body.data.members).toHaveLength(3);
      expect(response.body.data.myRole).toBe('leader');
    });

    test('팀 멤버가 아닌 경우 조회 실패', async () => {
      // Given: 팀과 외부 사용자
      const leader = await createTestUser(pool);
      const outsider = await createTestUser(pool);
      const team = await createTestTeam(pool, leader.id);
      const outsiderToken = generateTestToken(outsider.id);

      // When: 외부 사용자가 팀 조회 시도
      const response = await request(app)
        .get(`/api/teams/${team.id}`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .expect(403);

      // Then: 권한 없음
      expect(response.body.success).toBe(false);
    });

    test('존재하지 않는 팀 조회 실패', async () => {
      // Given: 사용자
      const user = await createTestUser(pool);
      const token = generateTestToken(user.id);

      // When: 존재하지 않는 팀 ID로 조회
      const response = await request(app)
        .get('/api/teams/99999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      // Then: 팀 없음
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/teams/:id - 팀 정보 수정', () => {
    test('팀장이 팀 정보 수정 성공', async () => {
      // Given: 팀장
      const { team, tokens } = await setupBasicScenario(pool);

      // When: 팀 정보 수정
      const response = await request(app)
        .patch(`/api/teams/${team.id}`)
        .set('Authorization', `Bearer ${tokens[0]}`)
        .send({
          name: '수정된팀',
          description: '수정된 설명'
        })
        .expect(200);

      // Then: 수정 확인
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('수정된팀');
      expect(response.body.data.description).toBe('수정된 설명');
    });

    test('팀원이 팀 정보 수정 실패', async () => {
      // Given: 팀원
      const { team, tokens } = await setupBasicScenario(pool);

      // When: 팀원이 수정 시도
      const response = await request(app)
        .patch(`/api/teams/${team.id}`)
        .set('Authorization', `Bearer ${tokens[1]}`)
        .send({
          name: '수정된팀'
        })
        .expect(403);

      // Then: 권한 없음
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/teams/:id - 팀 삭제', () => {
    test('팀장이 팀 삭제 성공', async () => {
      // Given: 팀장
      const { team, tokens } = await setupBasicScenario(pool);

      // When: 팀 삭제
      const response = await request(app)
        .delete(`/api/teams/${team.id}`)
        .set('Authorization', `Bearer ${tokens[0]}`)
        .expect(200);

      // Then: 삭제 확인
      expect(response.body.success).toBe(true);

      // 팀이 삭제되었는지 확인
      const checkResult = await pool.query(
        'SELECT * FROM teams WHERE id = $1',
        [team.id]
      );
      expect(checkResult.rows).toHaveLength(0);
    });

    test('팀원이 팀 삭제 실패', async () => {
      // Given: 팀원
      const { team, tokens } = await setupBasicScenario(pool);

      // When: 팀원이 삭제 시도
      const response = await request(app)
        .delete(`/api/teams/${team.id}`)
        .set('Authorization', `Bearer ${tokens[1]}`)
        .expect(403);

      // Then: 권한 없음
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/teams/join - 초대 코드로 팀 참여', () => {
    test('유효한 초대 코드로 팀 참여 성공', async () => {
      // Given: 팀과 외부 사용자
      const leader = await createTestUser(pool);
      const newMember = await createTestUser(pool);
      const team = await createTestTeam(pool, leader.id);
      const memberToken = generateTestToken(newMember.id);

      // When: 초대 코드로 참여
      const response = await request(app)
        .post('/api/teams/join')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          inviteCode: team.invite_code
        })
        .expect(201);

      // Then: 참여 성공
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(team.id);

      // 팀 멤버로 추가되었는지 확인
      const memberResult = await pool.query(
        'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
        [team.id, newMember.id]
      );
      expect(memberResult.rows).toHaveLength(1);
      expect(memberResult.rows[0].role).toBe('member');
    });

    test('잘못된 초대 코드로 참여 실패', async () => {
      // Given: 사용자
      const user = await createTestUser(pool);
      const token = generateTestToken(user.id);

      // When: 잘못된 초대 코드로 참여 시도
      const response = await request(app)
        .post('/api/teams/join')
        .set('Authorization', `Bearer ${token}`)
        .send({
          inviteCode: 'INVALID'
        })
        .expect(404);

      // Then: 참여 실패
      expect(response.body.success).toBe(false);
    });

    test('이미 팀 멤버인 경우 참여 실패', async () => {
      // Given: 팀 멤버
      const { team, users, tokens } = await setupBasicScenario(pool);

      // When: 이미 멤버인 사용자가 다시 참여 시도
      const response = await request(app)
        .post('/api/teams/join')
        .set('Authorization', `Bearer ${tokens[1]}`)
        .send({
          inviteCode: team.invite_code
        })
        .expect(409);

      // Then: 참여 실패
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/teams/:teamId/members/:userId - 팀원 제거', () => {
    test('팀장이 팀원 제거 성공', async () => {
      // Given: 팀장과 팀원
      const { team, users, tokens } = await setupBasicScenario(pool);

      // When: 팀장이 팀원 제거
      const response = await request(app)
        .delete(`/api/teams/${team.id}/members/${users[1].id}`)
        .set('Authorization', `Bearer ${tokens[0]}`)
        .expect(200);

      // Then: 제거 성공
      expect(response.body.success).toBe(true);

      // 팀원이 제거되었는지 확인
      const checkResult = await pool.query(
        'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
        [team.id, users[1].id]
      );
      expect(checkResult.rows).toHaveLength(0);
    });

    test('팀원이 다른 팀원 제거 실패', async () => {
      // Given: 팀원
      const { team, users, tokens } = await setupBasicScenario(pool);

      // When: 팀원이 다른 팀원 제거 시도
      const response = await request(app)
        .delete(`/api/teams/${team.id}/members/${users[2].id}`)
        .set('Authorization', `Bearer ${tokens[1]}`)
        .expect(403);

      // Then: 권한 없음
      expect(response.body.success).toBe(false);
    });

    test('자기 자신 제거 실패', async () => {
      // Given: 팀장
      const { team, users, tokens } = await setupBasicScenario(pool);

      // When: 팀장이 자신을 제거 시도
      const response = await request(app)
        .delete(`/api/teams/${team.id}/members/${users[0].id}`)
        .set('Authorization', `Bearer ${tokens[0]}`)
        .expect(400);

      // Then: 제거 실패
      expect(response.body.success).toBe(false);
    });
  });
});
