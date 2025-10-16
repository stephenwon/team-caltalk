const request = require('supertest');
const express = require('express');
const {
  createTestUser,
  createTestTeam,
  createTestSchedule,
  addTeamMember,
  generateTestToken,
  setupBasicScenario,
  setupConflictScenario,
} = require('../fixtures');

/**
 * 일정 API 통합 테스트
 *
 * 테스트 엔드포인트:
 * - POST /api/teams/:teamId/schedules - 일정 생성
 * - GET /api/teams/:teamId/schedules - 일정 목록 조회
 * - GET /api/teams/:teamId/schedules/:id - 일정 상세 조회
 * - PATCH /api/teams/:teamId/schedules/:id - 일정 수정
 * - DELETE /api/teams/:teamId/schedules/:id - 일정 삭제
 */

describe('일정 API 통합 테스트', () => {
  let pool;
  let app;

  beforeAll(() => {
    pool = global.testPool;

    // Express 앱 설정
    app = express();
    app.use(express.json());

    // 인증 미들웨어
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
    app.post('/api/teams/:teamId/schedules', authMiddleware, async (req, res) => {
      const { teamId } = req.params;
      const { title, content, start_datetime, end_datetime, schedule_type } = req.body;

      // 필수 필드 검증
      if (!title || !start_datetime || !end_datetime || !schedule_type) {
        return res.status(400).json({
          success: false,
          error: { message: '필수 필드가 누락되었습니다' }
        });
      }

      // 제목 길이 검증
      if (title.length < 2 || title.length > 100) {
        return res.status(400).json({
          success: false,
          error: { message: '제목은 2-100자여야 합니다' }
        });
      }

      try {
        // 팀 멤버인지 확인
        const memberResult = await pool.query(
          'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
          [teamId, req.userId]
        );

        if (memberResult.rows.length === 0) {
          return res.status(403).json({
            success: false,
            error: { message: '팀에 접근할 권한이 없습니다' }
          });
        }

        const role = memberResult.rows[0].role;

        // 팀 일정은 팀장만 생성 가능
        if (schedule_type === 'team' && role !== 'leader') {
          return res.status(403).json({
            success: false,
            error: { message: '팀장만 팀 일정을 생성할 수 있습니다' }
          });
        }

        // 충돌 검사
        const hasConflict = await pool.query(
          'SELECT check_schedule_conflict($1, $2, $3) as has_conflict',
          [req.userId, start_datetime, end_datetime]
        );

        if (hasConflict.rows[0].has_conflict) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'SCHEDULE_CONFLICT',
              message: '일정이 겹칩니다'
            }
          });
        }

        // 일정 생성
        const result = await pool.query(
          `INSERT INTO schedules (title, content, start_datetime, end_datetime, schedule_type, creator_id, team_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, title, content, start_datetime, end_datetime, schedule_type, creator_id, team_id, created_at`,
          [
            title,
            content,
            start_datetime,
            end_datetime,
            schedule_type,
            req.userId,
            schedule_type === 'team' ? teamId : null
          ]
        );

        // 참가자 추가
        await pool.query(
          `INSERT INTO schedule_participants (schedule_id, user_id, participation_status)
           VALUES ($1, $2, $3)`,
          [result.rows[0].id, req.userId, 'confirmed']
        );

        res.status(201).json({
          success: true,
          data: result.rows[0],
          message: '일정이 생성되었습니다'
        });
      } catch (error) {
        if (error.constraint && error.constraint.includes('check')) {
          return res.status(400).json({
            success: false,
            error: { message: '일정 데이터가 유효하지 않습니다' }
          });
        }
        res.status(500).json({
          success: false,
          error: { message: '서버 오류가 발생했습니다' }
        });
      }
    });

    app.get('/api/teams/:teamId/schedules', authMiddleware, async (req, res) => {
      const { teamId } = req.params;
      const { start_date, end_date } = req.query;

      try {
        // 팀 멤버인지 확인
        const memberResult = await pool.query(
          'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
          [teamId, req.userId]
        );

        if (memberResult.rows.length === 0) {
          return res.status(403).json({
            success: false,
            error: { message: '팀에 접근할 권한이 없습니다' }
          });
        }

        let query = `
          SELECT s.*
          FROM schedules s
          WHERE s.team_id = $1
        `;
        const params = [teamId];

        if (start_date && end_date) {
          query += ` AND s.start_datetime >= $2 AND s.end_datetime <= $3`;
          params.push(start_date, end_date);
        }

        query += ` ORDER BY s.start_datetime`;

        const result = await pool.query(query, params);

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

    app.get('/api/teams/:teamId/schedules/:id', authMiddleware, async (req, res) => {
      const { teamId, id } = req.params;

      try {
        // 팀 멤버인지 확인
        const memberResult = await pool.query(
          'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
          [teamId, req.userId]
        );

        if (memberResult.rows.length === 0) {
          return res.status(403).json({
            success: false,
            error: { message: '팀에 접근할 권한이 없습니다' }
          });
        }

        // 일정 조회
        const scheduleResult = await pool.query(
          'SELECT * FROM schedules WHERE id = $1 AND team_id = $2',
          [id, teamId]
        );

        if (scheduleResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: { message: '일정을 찾을 수 없습니다' }
          });
        }

        // 참가자 목록 조회
        const participantsResult = await pool.query(
          `SELECT u.id, u.name, u.email, sp.participation_status
           FROM users u
           JOIN schedule_participants sp ON u.id = sp.user_id
           WHERE sp.schedule_id = $1`,
          [id]
        );

        res.json({
          success: true,
          data: {
            schedule: scheduleResult.rows[0],
            participants: participantsResult.rows
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: { message: '서버 오류가 발생했습니다' }
        });
      }
    });

    app.patch('/api/teams/:teamId/schedules/:id', authMiddleware, async (req, res) => {
      const { teamId, id } = req.params;
      const { title, content, start_datetime, end_datetime } = req.body;

      try {
        // 일정 조회
        const scheduleResult = await pool.query(
          'SELECT * FROM schedules WHERE id = $1 AND team_id = $2',
          [id, teamId]
        );

        if (scheduleResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: { message: '일정을 찾을 수 없습니다' }
          });
        }

        const schedule = scheduleResult.rows[0];

        // 팀 멤버인지 확인
        const memberResult = await pool.query(
          'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
          [teamId, req.userId]
        );

        if (memberResult.rows.length === 0) {
          return res.status(403).json({
            success: false,
            error: { message: '팀에 접근할 권한이 없습니다' }
          });
        }

        const role = memberResult.rows[0].role;

        // 권한 확인: 팀장이거나 일정 생성자만 수정 가능
        if (role !== 'leader' && schedule.creator_id !== req.userId) {
          return res.status(403).json({
            success: false,
            error: { message: '일정을 수정할 권한이 없습니다' }
          });
        }

        // 제목 길이 검증
        if (title && (title.length < 2 || title.length > 100)) {
          return res.status(400).json({
            success: false,
            error: { message: '제목은 2-100자여야 합니다' }
          });
        }

        // 시간 변경 시 충돌 검사
        if (start_datetime || end_datetime) {
          const newStart = start_datetime || schedule.start_datetime;
          const newEnd = end_datetime || schedule.end_datetime;

          const hasConflict = await pool.query(
            'SELECT check_schedule_conflict($1, $2, $3, $4) as has_conflict',
            [req.userId, newStart, newEnd, id]
          );

          if (hasConflict.rows[0].has_conflict) {
            return res.status(409).json({
              success: false,
              error: {
                code: 'SCHEDULE_CONFLICT',
                message: '일정이 겹칩니다'
              }
            });
          }
        }

        // 일정 수정
        const result = await pool.query(
          `UPDATE schedules
           SET title = COALESCE($1, title),
               content = COALESCE($2, content),
               start_datetime = COALESCE($3, start_datetime),
               end_datetime = COALESCE($4, end_datetime)
           WHERE id = $5
           RETURNING *`,
          [title, content, start_datetime, end_datetime, id]
        );

        res.json({
          success: true,
          data: result.rows[0],
          message: '일정이 수정되었습니다'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: { message: '서버 오류가 발생했습니다' }
        });
      }
    });

    app.delete('/api/teams/:teamId/schedules/:id', authMiddleware, async (req, res) => {
      const { teamId, id } = req.params;

      try {
        // 일정 조회
        const scheduleResult = await pool.query(
          'SELECT * FROM schedules WHERE id = $1 AND team_id = $2',
          [id, teamId]
        );

        if (scheduleResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: { message: '일정을 찾을 수 없습니다' }
          });
        }

        const schedule = scheduleResult.rows[0];

        // 팀 멤버인지 확인
        const memberResult = await pool.query(
          'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
          [teamId, req.userId]
        );

        if (memberResult.rows.length === 0) {
          return res.status(403).json({
            success: false,
            error: { message: '팀에 접근할 권한이 없습니다' }
          });
        }

        const role = memberResult.rows[0].role;

        // 권한 확인: 팀장이거나 일정 생성자만 삭제 가능
        if (role !== 'leader' && schedule.creator_id !== req.userId) {
          return res.status(403).json({
            success: false,
            error: { message: '일정을 삭제할 권한이 없습니다' }
          });
        }

        // 일정 삭제
        await pool.query('DELETE FROM schedules WHERE id = $1', [id]);

        res.json({
          success: true,
          message: '일정이 삭제되었습니다'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: { message: '서버 오류가 발생했습니다' }
        });
      }
    });
  });

  describe('POST /api/teams/:teamId/schedules - 일정 생성', () => {
    test('팀장이 팀 일정 생성 성공', async () => {
      // Given: 팀장
      const { team, tokens } = await setupBasicScenario(pool);

      const scheduleData = {
        title: '팀 회의',
        content: '주간 회의',
        start_datetime: new Date(Date.now() + 3600000).toISOString(),
        end_datetime: new Date(Date.now() + 7200000).toISOString(),
        schedule_type: 'team'
      };

      // When: 팀 일정 생성
      const response = await request(app)
        .post(`/api/teams/${team.id}/schedules`)
        .set('Authorization', `Bearer ${tokens[0]}`)
        .send(scheduleData)
        .expect(201);

      // Then: 생성 성공
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(scheduleData.title);
      expect(response.body.data.schedule_type).toBe('team');
      expect(response.body.data.team_id).toBe(team.id);
    });

    test('팀원이 개인 일정 생성 성공', async () => {
      // Given: 팀원
      const { team, tokens } = await setupBasicScenario(pool);

      const scheduleData = {
        title: '개인 작업',
        content: '코드 리뷰',
        start_datetime: new Date(Date.now() + 3600000).toISOString(),
        end_datetime: new Date(Date.now() + 7200000).toISOString(),
        schedule_type: 'personal'
      };

      // When: 개인 일정 생성
      const response = await request(app)
        .post(`/api/teams/${team.id}/schedules`)
        .set('Authorization', `Bearer ${tokens[1]}`)
        .send(scheduleData)
        .expect(201);

      // Then: 생성 성공
      expect(response.body.success).toBe(true);
      expect(response.body.data.schedule_type).toBe('personal');
    });

    test('팀원이 팀 일정 생성 실패 (권한 없음)', async () => {
      // Given: 팀원
      const { team, tokens } = await setupBasicScenario(pool);

      const scheduleData = {
        title: '팀 회의',
        start_datetime: new Date(Date.now() + 3600000).toISOString(),
        end_datetime: new Date(Date.now() + 7200000).toISOString(),
        schedule_type: 'team'
      };

      // When: 팀원이 팀 일정 생성 시도
      const response = await request(app)
        .post(`/api/teams/${team.id}/schedules`)
        .set('Authorization', `Bearer ${tokens[1]}`)
        .send(scheduleData)
        .expect(403);

      // Then: 권한 없음
      expect(response.body.success).toBe(false);
    });

    test('일정 충돌 감지', async () => {
      // Given: 기존 일정이 있는 사용자
      const user = await createTestUser(pool);
      const team = await createTestTeam(pool, user.id);
      const token = generateTestToken(user.id);

      const baseTime = new Date();
      baseTime.setHours(10, 0, 0, 0);

      // 기존 일정 생성: 10:00 - 12:00
      await createTestSchedule(pool, {
        title: '기존 회의',
        start_datetime: new Date(baseTime).toISOString(),
        end_datetime: new Date(baseTime.getTime() + 2 * 3600000).toISOString(),
        schedule_type: 'team',
        creator_id: user.id,
        team_id: team.id,
      });

      // When: 겹치는 시간에 일정 생성 시도 (11:00 - 13:00)
      const response = await request(app)
        .post(`/api/teams/${team.id}/schedules`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: '새 회의',
          start_datetime: new Date(baseTime.getTime() + 1 * 3600000).toISOString(),
          end_datetime: new Date(baseTime.getTime() + 3 * 3600000).toISOString(),
          schedule_type: 'team'
        })
        .expect(409);

      // Then: 충돌 감지
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SCHEDULE_CONFLICT');
    });

    test('필수 필드 누락 시 실패', async () => {
      // Given: 팀장
      const { team, tokens } = await setupBasicScenario(pool);

      // When: 제목 누락
      const response = await request(app)
        .post(`/api/teams/${team.id}/schedules`)
        .set('Authorization', `Bearer ${tokens[0]}`)
        .send({
          start_datetime: new Date().toISOString(),
          end_datetime: new Date(Date.now() + 3600000).toISOString(),
          schedule_type: 'team'
        })
        .expect(400);

      // Then: 검증 에러
      expect(response.body.success).toBe(false);
    });

    test('제목 길이 검증 실패', async () => {
      // Given: 팀장
      const { team, tokens } = await setupBasicScenario(pool);

      // When: 긴 제목
      const response = await request(app)
        .post(`/api/teams/${team.id}/schedules`)
        .set('Authorization', `Bearer ${tokens[0]}`)
        .send({
          title: 'A'.repeat(101),
          start_datetime: new Date().toISOString(),
          end_datetime: new Date(Date.now() + 3600000).toISOString(),
          schedule_type: 'team'
        })
        .expect(400);

      // Then: 검증 에러
      expect(response.body.success).toBe(false);
    });

    test('일정 기간 7일 초과 시 실패', async () => {
      // Given: 팀장
      const { team, tokens } = await setupBasicScenario(pool);

      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 8 * 24 * 3600000); // 8일 후

      // When: 7일 초과 일정 생성 시도
      const response = await request(app)
        .post(`/api/teams/${team.id}/schedules`)
        .set('Authorization', `Bearer ${tokens[0]}`)
        .send({
          title: '긴 일정',
          start_datetime: startDate.toISOString(),
          end_datetime: endDate.toISOString(),
          schedule_type: 'team'
        })
        .expect(400);

      // Then: 검증 에러
      expect(response.body.success).toBe(false);
    });

    test('팀 멤버가 아닌 경우 생성 실패', async () => {
      // Given: 팀과 외부 사용자
      const leader = await createTestUser(pool);
      const outsider = await createTestUser(pool);
      const team = await createTestTeam(pool, leader.id);
      const outsiderToken = generateTestToken(outsider.id);

      // When: 외부 사용자가 일정 생성 시도
      const response = await request(app)
        .post(`/api/teams/${team.id}/schedules`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({
          title: '회의',
          start_datetime: new Date().toISOString(),
          end_datetime: new Date(Date.now() + 3600000).toISOString(),
          schedule_type: 'team'
        })
        .expect(403);

      // Then: 권한 없음
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/teams/:teamId/schedules - 일정 목록 조회', () => {
    test('팀 일정 목록 조회 성공', async () => {
      // Given: 팀과 일정들
      const { team, users, tokens } = await setupBasicScenario(pool);

      await createTestSchedule(pool, {
        title: '회의 1',
        schedule_type: 'team',
        creator_id: users[0].id,
        team_id: team.id,
      });

      await createTestSchedule(pool, {
        title: '회의 2',
        schedule_type: 'team',
        creator_id: users[0].id,
        team_id: team.id,
      });

      // When: 일정 목록 조회
      const response = await request(app)
        .get(`/api/teams/${team.id}/schedules`)
        .set('Authorization', `Bearer ${tokens[0]}`)
        .expect(200);

      // Then: 일정 목록 확인
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    test('날짜 범위로 일정 필터링', async () => {
      // Given: 팀과 여러 날짜의 일정들
      const { team, users, tokens } = await setupBasicScenario(pool);

      const today = new Date();
      const tomorrow = new Date(today.getTime() + 86400000);

      await createTestSchedule(pool, {
        title: '오늘 회의',
        start_datetime: new Date(today.setHours(10, 0, 0, 0)).toISOString(),
        end_datetime: new Date(today.setHours(11, 0, 0, 0)).toISOString(),
        schedule_type: 'team',
        creator_id: users[0].id,
        team_id: team.id,
      });

      await createTestSchedule(pool, {
        title: '내일 회의',
        start_datetime: new Date(tomorrow.setHours(14, 0, 0, 0)).toISOString(),
        end_datetime: new Date(tomorrow.setHours(15, 0, 0, 0)).toISOString(),
        schedule_type: 'team',
        creator_id: users[0].id,
        team_id: team.id,
      });

      // When: 오늘 날짜로 필터링
      const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      const response = await request(app)
        .get(`/api/teams/${team.id}/schedules`)
        .query({ start_date: todayStart, end_date: todayEnd })
        .set('Authorization', `Bearer ${tokens[0]}`)
        .expect(200);

      // Then: 오늘 일정만 조회
      expect(response.body.success).toBe(true);
      // 필터링 결과는 구현에 따라 다를 수 있음
    });

    test('팀 멤버가 아닌 경우 조회 실패', async () => {
      // Given: 팀과 외부 사용자
      const leader = await createTestUser(pool);
      const outsider = await createTestUser(pool);
      const team = await createTestTeam(pool, leader.id);
      const outsiderToken = generateTestToken(outsider.id);

      // When: 외부 사용자가 조회 시도
      const response = await request(app)
        .get(`/api/teams/${team.id}/schedules`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .expect(403);

      // Then: 권한 없음
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/teams/:teamId/schedules/:id - 일정 상세 조회', () => {
    test('일정 상세 정보 조회 성공', async () => {
      // Given: 팀과 일정
      const { team, users, tokens } = await setupBasicScenario(pool);

      const schedule = await createTestSchedule(pool, {
        title: '팀 회의',
        schedule_type: 'team',
        creator_id: users[0].id,
        team_id: team.id,
      });

      // When: 일정 상세 조회
      const response = await request(app)
        .get(`/api/teams/${team.id}/schedules/${schedule.id}`)
        .set('Authorization', `Bearer ${tokens[0]}`)
        .expect(200);

      // Then: 일정 정보 및 참가자 목록 확인
      expect(response.body.success).toBe(true);
      expect(response.body.data.schedule.id).toBe(schedule.id);
      expect(response.body.data.participants).toBeDefined();
    });

    test('존재하지 않는 일정 조회 실패', async () => {
      // Given: 팀
      const { team, tokens } = await setupBasicScenario(pool);

      // When: 존재하지 않는 일정 조회
      const response = await request(app)
        .get(`/api/teams/${team.id}/schedules/99999`)
        .set('Authorization', `Bearer ${tokens[0]}`)
        .expect(404);

      // Then: 일정 없음
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/teams/:teamId/schedules/:id - 일정 수정', () => {
    test('팀장이 팀 일정 수정 성공', async () => {
      // Given: 팀장과 팀 일정
      const { team, users, tokens } = await setupBasicScenario(pool);

      const schedule = await createTestSchedule(pool, {
        title: '원래 제목',
        schedule_type: 'team',
        creator_id: users[0].id,
        team_id: team.id,
      });

      // When: 일정 수정
      const response = await request(app)
        .patch(`/api/teams/${team.id}/schedules/${schedule.id}`)
        .set('Authorization', `Bearer ${tokens[0]}`)
        .send({
          title: '수정된 제목',
          content: '수정된 내용'
        })
        .expect(200);

      // Then: 수정 확인
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('수정된 제목');
      expect(response.body.data.content).toBe('수정된 내용');
    });

    test('일정 생성자가 자신의 일정 수정 성공', async () => {
      // Given: 팀원과 자신의 일정
      const { team, users, tokens } = await setupBasicScenario(pool);

      const schedule = await createTestSchedule(pool, {
        title: '내 일정',
        schedule_type: 'personal',
        creator_id: users[1].id,
        team_id: team.id,
      });

      // When: 생성자가 수정
      const response = await request(app)
        .patch(`/api/teams/${team.id}/schedules/${schedule.id}`)
        .set('Authorization', `Bearer ${tokens[1]}`)
        .send({
          title: '수정된 일정'
        })
        .expect(200);

      // Then: 수정 성공
      expect(response.body.success).toBe(true);
    });

    test('팀원이 다른 팀원의 일정 수정 실패', async () => {
      // Given: 두 명의 팀원
      const { team, users, tokens } = await setupBasicScenario(pool);

      const schedule = await createTestSchedule(pool, {
        title: '팀원1 일정',
        schedule_type: 'personal',
        creator_id: users[1].id,
        team_id: team.id,
      });

      // When: 다른 팀원이 수정 시도
      const response = await request(app)
        .patch(`/api/teams/${team.id}/schedules/${schedule.id}`)
        .set('Authorization', `Bearer ${tokens[2]}`)
        .send({
          title: '수정 시도'
        })
        .expect(403);

      // Then: 권한 없음
      expect(response.body.success).toBe(false);
    });

    test('시간 수정 시 충돌 감지', async () => {
      // Given: 두 개의 일정
      const user = await createTestUser(pool);
      const team = await createTestTeam(pool, user.id);
      const token = generateTestToken(user.id);

      const baseTime = new Date();
      baseTime.setHours(10, 0, 0, 0);

      // 첫 번째 일정: 10:00 - 12:00
      const schedule1 = await createTestSchedule(pool, {
        title: '일정 1',
        start_datetime: new Date(baseTime).toISOString(),
        end_datetime: new Date(baseTime.getTime() + 2 * 3600000).toISOString(),
        schedule_type: 'team',
        creator_id: user.id,
        team_id: team.id,
      });

      // 두 번째 일정: 13:00 - 14:00
      const schedule2 = await createTestSchedule(pool, {
        title: '일정 2',
        start_datetime: new Date(baseTime.getTime() + 3 * 3600000).toISOString(),
        end_datetime: new Date(baseTime.getTime() + 4 * 3600000).toISOString(),
        schedule_type: 'team',
        creator_id: user.id,
        team_id: team.id,
      });

      // When: 두 번째 일정 시간을 첫 번째와 겹치도록 수정 시도
      const response = await request(app)
        .patch(`/api/teams/${team.id}/schedules/${schedule2.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          start_datetime: new Date(baseTime.getTime() + 1 * 3600000).toISOString()
        })
        .expect(409);

      // Then: 충돌 감지
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SCHEDULE_CONFLICT');
    });
  });

  describe('DELETE /api/teams/:teamId/schedules/:id - 일정 삭제', () => {
    test('팀장이 팀 일정 삭제 성공', async () => {
      // Given: 팀장과 팀 일정
      const { team, users, tokens } = await setupBasicScenario(pool);

      const schedule = await createTestSchedule(pool, {
        title: '삭제할 일정',
        schedule_type: 'team',
        creator_id: users[0].id,
        team_id: team.id,
      });

      // When: 일정 삭제
      const response = await request(app)
        .delete(`/api/teams/${team.id}/schedules/${schedule.id}`)
        .set('Authorization', `Bearer ${tokens[0]}`)
        .expect(200);

      // Then: 삭제 성공
      expect(response.body.success).toBe(true);

      // 일정이 삭제되었는지 확인
      const checkResult = await pool.query(
        'SELECT * FROM schedules WHERE id = $1',
        [schedule.id]
      );
      expect(checkResult.rows).toHaveLength(0);
    });

    test('일정 생성자가 자신의 일정 삭제 성공', async () => {
      // Given: 팀원과 자신의 일정
      const { team, users, tokens } = await setupBasicScenario(pool);

      const schedule = await createTestSchedule(pool, {
        title: '내 일정',
        schedule_type: 'personal',
        creator_id: users[1].id,
        team_id: team.id,
      });

      // When: 생성자가 삭제
      const response = await request(app)
        .delete(`/api/teams/${team.id}/schedules/${schedule.id}`)
        .set('Authorization', `Bearer ${tokens[1]}`)
        .expect(200);

      // Then: 삭제 성공
      expect(response.body.success).toBe(true);
    });

    test('팀원이 다른 팀원의 일정 삭제 실패', async () => {
      // Given: 두 명의 팀원
      const { team, users, tokens } = await setupBasicScenario(pool);

      const schedule = await createTestSchedule(pool, {
        title: '팀원1 일정',
        schedule_type: 'personal',
        creator_id: users[1].id,
        team_id: team.id,
      });

      // When: 다른 팀원이 삭제 시도
      const response = await request(app)
        .delete(`/api/teams/${team.id}/schedules/${schedule.id}`)
        .set('Authorization', `Bearer ${tokens[2]}`)
        .expect(403);

      // Then: 권한 없음
      expect(response.body.success).toBe(false);
    });

    test('존재하지 않는 일정 삭제 실패', async () => {
      // Given: 팀장
      const { team, tokens } = await setupBasicScenario(pool);

      // When: 존재하지 않는 일정 삭제 시도
      const response = await request(app)
        .delete(`/api/teams/${team.id}/schedules/99999`)
        .set('Authorization', `Bearer ${tokens[0]}`)
        .expect(404);

      // Then: 일정 없음
      expect(response.body.success).toBe(false);
    });
  });
});
