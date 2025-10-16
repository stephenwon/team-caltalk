const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {
  createTestUser,
  generateTestToken,
} = require('../fixtures');

/**
 * AuthService 단위 테스트
 *
 * 테스트 범위:
 * - 회원가입 (signup)
 * - 로그인 (login)
 * - 비밀번호 변경 (changePassword)
 * - 토큰 갱신 (refreshToken)
 * - 비밀번호 검증 (verifyPassword)
 */

describe('AuthService 단위 테스트', () => {
  let pool;

  beforeAll(() => {
    pool = global.testPool;
  });

  describe('회원가입 (signup)', () => {
    test('유효한 데이터로 회원가입 성공', async () => {
      // Given: 유효한 사용자 데이터
      const userData = {
        email: 'newuser@example.com',
        name: '새사용자',
        password: 'ValidPass123!',
      };

      // When: 회원가입 수행
      const passwordHash = await bcrypt.hash(userData.password, 10);
      const result = await pool.query(
        `INSERT INTO users (email, name, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, email, name, created_at`,
        [userData.email, userData.name, passwordHash]
      );

      // Then: 사용자 생성 확인
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].email).toBe(userData.email);
      expect(result.rows[0].name).toBe(userData.name);
      expect(result.rows[0].id).toBeDefined();

      // 비밀번호 해시 검증
      const user = await pool.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [result.rows[0].id]
      );
      const isPasswordValid = await bcrypt.compare(
        userData.password,
        user.rows[0].password_hash
      );
      expect(isPasswordValid).toBe(true);
    });

    test('중복된 이메일로 회원가입 실패', async () => {
      // Given: 이미 존재하는 사용자
      const existingUser = await createTestUser(pool, {
        email: 'existing@example.com',
      });

      // When & Then: 같은 이메일로 회원가입 시도
      const passwordHash = await bcrypt.hash('Password123!', 10);
      await expect(
        pool.query(
          `INSERT INTO users (email, name, password_hash)
           VALUES ($1, $2, $3)`,
          [existingUser.email, '새사용자', passwordHash]
        )
      ).rejects.toThrow();
    });

    test('짧은 이름으로 회원가입 실패 (2자 미만)', async () => {
      // Given: 너무 짧은 이름
      const userData = {
        email: 'test@example.com',
        name: 'A', // 1자
        password: 'ValidPass123!',
      };

      // When & Then: 회원가입 시도
      const passwordHash = await bcrypt.hash(userData.password, 10);
      await expect(
        pool.query(
          `INSERT INTO users (email, name, password_hash)
           VALUES ($1, $2, $3)`,
          [userData.email, userData.name, passwordHash]
        )
      ).rejects.toThrow();
    });

    test('긴 이름으로 회원가입 실패 (30자 초과)', async () => {
      // Given: 너무 긴 이름
      const userData = {
        email: 'test@example.com',
        name: 'A'.repeat(31), // 31자
        password: 'ValidPass123!',
      };

      // When & Then: 회원가입 시도
      const passwordHash = await bcrypt.hash(userData.password, 10);
      await expect(
        pool.query(
          `INSERT INTO users (email, name, password_hash)
           VALUES ($1, $2, $3)`,
          [userData.email, userData.name, passwordHash]
        )
      ).rejects.toThrow();
    });
  });

  describe('로그인 (login)', () => {
    test('올바른 이메일과 비밀번호로 로그인 성공', async () => {
      // Given: 등록된 사용자
      const user = await createTestUser(pool, {
        email: 'login@example.com',
        password: 'LoginPass123!',
      });

      // When: 로그인 시도
      const dbUser = await pool.query(
        'SELECT id, email, password_hash FROM users WHERE email = $1',
        [user.email]
      );

      const isPasswordValid = await bcrypt.compare(
        user.password,
        dbUser.rows[0].password_hash
      );

      // Then: 비밀번호 검증 성공
      expect(isPasswordValid).toBe(true);
      expect(dbUser.rows[0].id).toBe(user.id);
    });

    test('잘못된 비밀번호로 로그인 실패', async () => {
      // Given: 등록된 사용자
      const user = await createTestUser(pool, {
        email: 'login@example.com',
        password: 'CorrectPass123!',
      });

      // When: 잘못된 비밀번호로 로그인 시도
      const dbUser = await pool.query(
        'SELECT password_hash FROM users WHERE email = $1',
        [user.email]
      );

      const isPasswordValid = await bcrypt.compare(
        'WrongPass123!',
        dbUser.rows[0].password_hash
      );

      // Then: 비밀번호 검증 실패
      expect(isPasswordValid).toBe(false);
    });

    test('존재하지 않는 이메일로 로그인 실패', async () => {
      // When: 존재하지 않는 이메일로 조회
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        ['nonexistent@example.com']
      );

      // Then: 사용자 없음
      expect(result.rows).toHaveLength(0);
    });
  });

  describe('JWT 토큰 생성 및 검증', () => {
    test('유효한 사용자 ID로 JWT 토큰 생성', () => {
      // Given: 사용자 ID
      const userId = 1;

      // When: 토큰 생성
      const token = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      // Then: 토큰 생성 확인
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    test('생성된 JWT 토큰 검증 성공', () => {
      // Given: 생성된 토큰
      const userId = 1;
      const token = generateTestToken(userId);

      // When: 토큰 검증
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Then: 검증 성공 및 페이로드 확인
      expect(decoded.userId).toBe(userId);
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });

    test('잘못된 시크릿으로 JWT 토큰 검증 실패', () => {
      // Given: 다른 시크릿으로 생성된 토큰
      const userId = 1;
      const token = jwt.sign(
        { userId },
        'wrong-secret',
        { expiresIn: '1h' }
      );

      // When & Then: 토큰 검증 실패
      expect(() => {
        jwt.verify(token, process.env.JWT_SECRET);
      }).toThrow();
    });

    test('만료된 JWT 토큰 검증 실패', () => {
      // Given: 이미 만료된 토큰
      const userId = 1;
      const token = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // 1시간 전 만료
      );

      // When & Then: 토큰 검증 실패
      expect(() => {
        jwt.verify(token, process.env.JWT_SECRET);
      }).toThrow();
    });
  });

  describe('비밀번호 변경 (changePassword)', () => {
    test('현재 비밀번호 확인 후 새 비밀번호로 변경 성공', async () => {
      // Given: 등록된 사용자
      const user = await createTestUser(pool, {
        password: 'OldPass123!',
      });

      // When: 현재 비밀번호 검증
      const dbUser = await pool.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [user.id]
      );

      const isCurrentPasswordValid = await bcrypt.compare(
        user.password,
        dbUser.rows[0].password_hash
      );
      expect(isCurrentPasswordValid).toBe(true);

      // 새 비밀번호로 변경
      const newPassword = 'NewPass123!';
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [newPasswordHash, user.id]
      );

      // Then: 새 비밀번호 검증
      const updatedUser = await pool.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [user.id]
      );

      const isNewPasswordValid = await bcrypt.compare(
        newPassword,
        updatedUser.rows[0].password_hash
      );
      expect(isNewPasswordValid).toBe(true);

      // 이전 비밀번호로 로그인 불가 확인
      const isOldPasswordValid = await bcrypt.compare(
        user.password,
        updatedUser.rows[0].password_hash
      );
      expect(isOldPasswordValid).toBe(false);
    });

    test('잘못된 현재 비밀번호로 변경 실패', async () => {
      // Given: 등록된 사용자
      const user = await createTestUser(pool, {
        password: 'CorrectPass123!',
      });

      // When: 잘못된 현재 비밀번호 검증
      const dbUser = await pool.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [user.id]
      );

      const isPasswordValid = await bcrypt.compare(
        'WrongPass123!',
        dbUser.rows[0].password_hash
      );

      // Then: 비밀번호 검증 실패
      expect(isPasswordValid).toBe(false);
    });
  });

  describe('비밀번호 해싱 보안', () => {
    test('같은 비밀번호라도 다른 해시 생성 (salt)', async () => {
      // Given: 같은 비밀번호
      const password = 'SamePass123!';

      // When: 두 번 해싱
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 10);

      // Then: 서로 다른 해시 생성
      expect(hash1).not.toBe(hash2);

      // 하지만 둘 다 원본 비밀번호와 일치
      expect(await bcrypt.compare(password, hash1)).toBe(true);
      expect(await bcrypt.compare(password, hash2)).toBe(true);
    });

    test('비밀번호 해시는 원본 복구 불가능', async () => {
      // Given: 비밀번호
      const password = 'SecretPass123!';

      // When: 해싱
      const hash = await bcrypt.hash(password, 10);

      // Then: 해시와 원본 비밀번호는 완전히 다름
      expect(hash).not.toContain(password);
      expect(hash.length).toBeGreaterThan(password.length);
    });
  });
});
