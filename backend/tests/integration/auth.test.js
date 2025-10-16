const request = require('supertest');
const express = require('express');
const {
  createTestUser,
  generateTestToken,
  generateExpiredToken,
  generateInvalidToken,
} = require('../fixtures');

/**
 * 인증 API 통합 테스트
 *
 * 테스트 엔드포인트:
 * - POST /api/auth/signup - 회원가입
 * - POST /api/auth/login - 로그인
 * - POST /api/auth/logout - 로그아웃
 * - POST /api/auth/refresh - 토큰 갱신
 * - POST /api/auth/change-password - 비밀번호 변경
 */

describe('인증 API 통합 테스트', () => {
  let pool;
  let app;

  beforeAll(() => {
    pool = global.testPool;

    // Express 앱 설정 (실제 백엔드 구현 시 대체)
    app = express();
    app.use(express.json());

    // Mock 라우터 (실제 구현으로 대체 필요)
    app.post('/api/auth/signup', async (req, res) => {
      const { email, name, password } = req.body;

      // 간단한 검증
      if (!email || !name || !password) {
        return res.status(400).json({
          success: false,
          error: { message: '필수 필드가 누락되었습니다' }
        });
      }

      if (name.length < 2 || name.length > 30) {
        return res.status(400).json({
          success: false,
          error: { message: '이름은 2-30자여야 합니다' }
        });
      }

      try {
        const bcrypt = require('bcrypt');
        const jwt = require('jsonwebtoken');

        const passwordHash = await bcrypt.hash(password, 10);
        const result = await pool.query(
          `INSERT INTO users (email, name, password_hash)
           VALUES ($1, $2, $3)
           RETURNING id, email, name, created_at`,
          [email, name, passwordHash]
        );

        const token = jwt.sign(
          { userId: result.rows[0].id },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(201).json({
          success: true,
          data: {
            user: result.rows[0],
            token
          },
          message: '회원가입이 완료되었습니다'
        });
      } catch (error) {
        if (error.code === '23505') { // 중복 키
          return res.status(409).json({
            success: false,
            error: { message: '이미 사용 중인 이메일입니다' }
          });
        }
        res.status(500).json({
          success: false,
          error: { message: '서버 오류가 발생했습니다' }
        });
      }
    });

    app.post('/api/auth/login', async (req, res) => {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: { message: '이메일과 비밀번호를 입력하세요' }
        });
      }

      try {
        const bcrypt = require('bcrypt');
        const jwt = require('jsonwebtoken');

        const result = await pool.query(
          'SELECT id, email, name, password_hash FROM users WHERE email = $1',
          [email]
        );

        if (result.rows.length === 0) {
          return res.status(401).json({
            success: false,
            error: { message: '이메일 또는 비밀번호가 올바르지 않습니다' }
          });
        }

        const user = result.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
          return res.status(401).json({
            success: false,
            error: { message: '이메일 또는 비밀번호가 올바르지 않습니다' }
          });
        }

        const token = jwt.sign(
          { userId: user.id },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
          success: true,
          data: {
            user: {
              id: user.id,
              email: user.email,
              name: user.name
            },
            token
          },
          message: '로그인에 성공했습니다'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: { message: '서버 오류가 발생했습니다' }
        });
      }
    });

    app.post('/api/auth/logout', (req, res) => {
      // JWT는 서버에서 상태를 유지하지 않으므로 클라이언트에서 토큰 삭제
      res.json({
        success: true,
        message: '로그아웃되었습니다'
      });
    });

    app.post('/api/auth/refresh', (req, res) => {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: { message: '인증 토큰이 필요합니다' }
        });
      }

      const token = authHeader.substring(7);

      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const newToken = jwt.sign(
          { userId: decoded.userId },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
          success: true,
          data: { token: newToken },
          message: '토큰이 갱신되었습니다'
        });
      } catch (error) {
        res.status(401).json({
          success: false,
          error: { message: '유효하지 않은 토큰입니다' }
        });
      }
    });

    app.post('/api/auth/change-password', async (req, res) => {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: { message: '인증 토큰이 필요합니다' }
        });
      }

      const token = authHeader.substring(7);
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: { message: '현재 비밀번호와 새 비밀번호를 입력하세요' }
        });
      }

      try {
        const jwt = require('jsonwebtoken');
        const bcrypt = require('bcrypt');

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const result = await pool.query(
          'SELECT password_hash FROM users WHERE id = $1',
          [decoded.userId]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: { message: '사용자를 찾을 수 없습니다' }
          });
        }

        const isPasswordValid = await bcrypt.compare(
          currentPassword,
          result.rows[0].password_hash
        );

        if (!isPasswordValid) {
          return res.status(401).json({
            success: false,
            error: { message: '현재 비밀번호가 올바르지 않습니다' }
          });
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        await pool.query(
          'UPDATE users SET password_hash = $1 WHERE id = $2',
          [newPasswordHash, decoded.userId]
        );

        res.json({
          success: true,
          message: '비밀번호가 변경되었습니다'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: { message: '서버 오류가 발생했습니다' }
        });
      }
    });
  });

  describe('POST /api/auth/signup - 회원가입', () => {
    test('유효한 데이터로 회원가입 성공', async () => {
      // Given: 유효한 회원가입 데이터
      const signupData = {
        email: 'newuser@example.com',
        name: '새로운사용자',
        password: 'ValidPass123!'
      };

      // When: 회원가입 요청
      const response = await request(app)
        .post('/api/auth/signup')
        .send(signupData)
        .expect(201);

      // Then: 응답 검증
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(signupData.email);
      expect(response.body.data.user.name).toBe(signupData.name);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.message).toBe('회원가입이 완료되었습니다');
    });

    test('중복된 이메일로 회원가입 실패', async () => {
      // Given: 이미 존재하는 이메일
      await createTestUser(pool, {
        email: 'existing@example.com'
      });

      // When: 같은 이메일로 회원가입 시도
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'existing@example.com',
          name: '사용자',
          password: 'Pass123!'
        })
        .expect(409);

      // Then: 에러 응답
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('이미 사용 중인 이메일');
    });

    test('필수 필드 누락 시 실패', async () => {
      // When: 필수 필드 누락
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com'
          // name, password 누락
        })
        .expect(400);

      // Then: 검증 에러
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('필수 필드');
    });

    test('이름 길이 검증 실패 (2자 미만)', async () => {
      // When: 짧은 이름
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          name: 'A',
          password: 'Pass123!'
        })
        .expect(400);

      // Then: 검증 에러
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('2-30자');
    });

    test('이름 길이 검증 실패 (30자 초과)', async () => {
      // When: 긴 이름
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          name: 'A'.repeat(31),
          password: 'Pass123!'
        })
        .expect(400);

      // Then: 검증 에러
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('2-30자');
    });
  });

  describe('POST /api/auth/login - 로그인', () => {
    test('올바른 이메일과 비밀번호로 로그인 성공', async () => {
      // Given: 등록된 사용자
      const user = await createTestUser(pool, {
        email: 'login@example.com',
        password: 'LoginPass123!'
      });

      // When: 로그인 요청
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: user.password
        })
        .expect(200);

      // Then: 응답 검증
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(user.id);
      expect(response.body.data.user.email).toBe(user.email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.message).toBe('로그인에 성공했습니다');
    });

    test('잘못된 비밀번호로 로그인 실패', async () => {
      // Given: 등록된 사용자
      const user = await createTestUser(pool, {
        email: 'user@example.com',
        password: 'CorrectPass123!'
      });

      // When: 잘못된 비밀번호로 로그인 시도
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'WrongPass123!'
        })
        .expect(401);

      // Then: 인증 실패
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('올바르지 않습니다');
    });

    test('존재하지 않는 이메일로 로그인 실패', async () => {
      // When: 존재하지 않는 이메일로 로그인 시도
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Pass123!'
        })
        .expect(401);

      // Then: 인증 실패
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('올바르지 않습니다');
    });

    test('필수 필드 누락 시 실패', async () => {
      // When: 이메일 누락
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'Pass123!'
        })
        .expect(400);

      // Then: 검증 에러
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout - 로그아웃', () => {
    test('로그아웃 성공', async () => {
      // When: 로그아웃 요청
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      // Then: 성공 응답
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('로그아웃되었습니다');
    });
  });

  describe('POST /api/auth/refresh - 토큰 갱신', () => {
    test('유효한 토큰으로 갱신 성공', async () => {
      // Given: 사용자 및 토큰
      const user = await createTestUser(pool);
      const token = generateTestToken(user.id);

      // When: 토큰 갱신 요청
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Then: 새 토큰 발급
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.token).not.toBe(token);
    });

    test('토큰 없이 갱신 실패', async () => {
      // When: 토큰 없이 요청
      const response = await request(app)
        .post('/api/auth/refresh')
        .expect(401);

      // Then: 인증 실패
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('인증 토큰');
    });

    test('유효하지 않은 토큰으로 갱신 실패', async () => {
      // Given: 잘못된 토큰
      const invalidToken = generateInvalidToken(1);

      // When: 갱신 요청
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      // Then: 인증 실패
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('유효하지 않은');
    });

    test('만료된 토큰으로 갱신 실패', async () => {
      // Given: 만료된 토큰
      const expiredToken = generateExpiredToken(1);

      // When: 갱신 요청
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      // Then: 인증 실패
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/change-password - 비밀번호 변경', () => {
    test('올바른 현재 비밀번호로 변경 성공', async () => {
      // Given: 사용자 및 토큰
      const user = await createTestUser(pool, {
        password: 'OldPass123!'
      });
      const token = generateTestToken(user.id);

      // When: 비밀번호 변경 요청
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: user.password,
          newPassword: 'NewPass123!'
        })
        .expect(200);

      // Then: 변경 성공
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('비밀번호가 변경되었습니다');

      // 새 비밀번호로 로그인 가능 확인
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'NewPass123!'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    test('잘못된 현재 비밀번호로 변경 실패', async () => {
      // Given: 사용자 및 토큰
      const user = await createTestUser(pool, {
        password: 'CorrectPass123!'
      });
      const token = generateTestToken(user.id);

      // When: 잘못된 현재 비밀번호로 변경 시도
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'WrongPass123!',
          newPassword: 'NewPass123!'
        })
        .expect(401);

      // Then: 변경 실패
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('현재 비밀번호');
    });

    test('토큰 없이 변경 실패', async () => {
      // When: 토큰 없이 요청
      const response = await request(app)
        .post('/api/auth/change-password')
        .send({
          currentPassword: 'Pass123!',
          newPassword: 'NewPass123!'
        })
        .expect(401);

      // Then: 인증 실패
      expect(response.body.success).toBe(false);
    });

    test('필수 필드 누락 시 실패', async () => {
      // Given: 사용자 및 토큰
      const user = await createTestUser(pool);
      const token = generateTestToken(user.id);

      // When: 새 비밀번호 누락
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'Pass123!'
          // newPassword 누락
        })
        .expect(400);

      // Then: 검증 에러
      expect(response.body.success).toBe(false);
    });
  });
});
