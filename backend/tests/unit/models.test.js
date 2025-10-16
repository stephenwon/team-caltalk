const {
  createTestUser,
  createTestTeam,
  addTeamMember,
  createTestSchedule,
  createTestMessage,
} = require('../fixtures');

/**
 * 데이터 모델 단위 테스트
 *
 * 테스트 범위:
 * - User 모델: CRUD, 검증
 * - Team 모델: CRUD, 초대 코드, 멤버 관리
 * - Schedule 모델: CRUD, 충돌 감지
 * - Message 모델: CRUD, 날짜별 조회
 */

describe('데이터 모델 단위 테스트', () => {
  let pool;

  beforeAll(() => {
    pool = global.testPool;
  });

  describe('User 모델', () => {
    test('사용자 생성 및 조회', async () => {
      // Given & When: 사용자 생성
      const user = await createTestUser(pool, {
        email: 'model-test@example.com',
        name: '모델테스트',
      });

      // Then: 조회 확인
      const result = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [user.id]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].email).toBe(user.email);
      expect(result.rows[0].name).toBe(user.name);
    });

    test('이메일로 사용자 조회', async () => {
      // Given: 생성된 사용자
      const user = await createTestUser(pool, {
        email: 'findby@example.com',
      });

      // When: 이메일로 조회
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [user.email]
      );

      // Then: 조회 성공
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].id).toBe(user.id);
    });

    test('사용자 정보 업데이트', async () => {
      // Given: 생성된 사용자
      const user = await createTestUser(pool);

      // When: 이름 업데이트
      const newName = '업데이트된이름';
      await pool.query(
        'UPDATE users SET name = $1 WHERE id = $2',
        [newName, user.id]
      );

      // Then: 업데이트 확인
      const result = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [user.id]
      );

      expect(result.rows[0].name).toBe(newName);
      expect(result.rows[0].updated_at).not.toBe(result.rows[0].created_at);
    });

    test('사용자 삭제', async () => {
      // Given: 생성된 사용자
      const user = await createTestUser(pool);

      // When: 삭제
      await pool.query('DELETE FROM users WHERE id = $1', [user.id]);

      // Then: 조회 실패
      const result = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [user.id]
      );

      expect(result.rows).toHaveLength(0);
    });
  });

  describe('Team 모델', () => {
    test('팀 생성 시 초대 코드 자동 생성', async () => {
      // Given: 사용자
      const user = await createTestUser(pool);

      // When: 팀 생성
      const team = await createTestTeam(pool, user.id);

      // Then: 초대 코드 생성 확인
      expect(team.invite_code).toBeDefined();
      expect(team.invite_code).toHaveLength(6);
      expect(team.creator_id).toBe(user.id);
    });

    test('초대 코드는 유니크해야 함', async () => {
      // Given: 두 개의 팀
      const user1 = await createTestUser(pool);
      const user2 = await createTestUser(pool);

      const team1 = await createTestTeam(pool, user1.id);
      const team2 = await createTestTeam(pool, user2.id);

      // Then: 서로 다른 초대 코드
      expect(team1.invite_code).not.toBe(team2.invite_code);
    });

    test('팀 생성자는 자동으로 팀장이 됨', async () => {
      // Given: 사용자
      const user = await createTestUser(pool);

      // When: 팀 생성
      const team = await createTestTeam(pool, user.id);

      // Then: 팀장 확인
      const result = await pool.query(
        'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
        [team.id, user.id]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].role).toBe('leader');
    });

    test('팀원 추가', async () => {
      // Given: 팀과 사용자
      const leader = await createTestUser(pool);
      const member = await createTestUser(pool);
      const team = await createTestTeam(pool, leader.id);

      // When: 팀원 추가
      await addTeamMember(pool, team.id, member.id);

      // Then: 팀원 확인
      const result = await pool.query(
        'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
        [team.id, member.id]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].role).toBe('member');
    });

    test('팀 멤버 목록 조회', async () => {
      // Given: 팀과 여러 멤버
      const leader = await createTestUser(pool);
      const team = await createTestTeam(pool, leader.id);

      const members = await Promise.all([
        createTestUser(pool),
        createTestUser(pool),
        createTestUser(pool),
      ]);

      for (const member of members) {
        await addTeamMember(pool, team.id, member.id);
      }

      // When: 팀 멤버 조회
      const result = await pool.query(
        'SELECT * FROM team_members WHERE team_id = $1',
        [team.id]
      );

      // Then: 팀장 + 팀원 3명 = 총 4명
      expect(result.rows).toHaveLength(4);
    });

    test('팀원 제거', async () => {
      // Given: 팀과 팀원
      const leader = await createTestUser(pool);
      const member = await createTestUser(pool);
      const team = await createTestTeam(pool, leader.id);
      await addTeamMember(pool, team.id, member.id);

      // When: 팀원 제거
      await pool.query(
        'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2',
        [team.id, member.id]
      );

      // Then: 팀원 제거 확인
      const result = await pool.query(
        'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
        [team.id, member.id]
      );

      expect(result.rows).toHaveLength(0);
    });

    test('팀 삭제 시 관련 데이터 CASCADE 삭제', async () => {
      // Given: 팀과 팀원
      const leader = await createTestUser(pool);
      const member = await createTestUser(pool);
      const team = await createTestTeam(pool, leader.id);
      await addTeamMember(pool, team.id, member.id);

      // When: 팀 삭제
      await pool.query('DELETE FROM teams WHERE id = $1', [team.id]);

      // Then: team_members도 삭제됨
      const result = await pool.query(
        'SELECT * FROM team_members WHERE team_id = $1',
        [team.id]
      );

      expect(result.rows).toHaveLength(0);
    });
  });

  describe('Schedule 모델', () => {
    test('개인 일정 생성', async () => {
      // Given: 사용자
      const user = await createTestUser(pool);

      // When: 개인 일정 생성
      const schedule = await createTestSchedule(pool, {
        title: '개인 미팅',
        schedule_type: 'personal',
        creator_id: user.id,
        team_id: null,
      });

      // Then: 생성 확인
      expect(schedule.id).toBeDefined();
      expect(schedule.schedule_type).toBe('personal');
      expect(schedule.creator_id).toBe(user.id);
      expect(schedule.team_id).toBeNull();
    });

    test('팀 일정 생성', async () => {
      // Given: 팀
      const user = await createTestUser(pool);
      const team = await createTestTeam(pool, user.id);

      // When: 팀 일정 생성
      const schedule = await createTestSchedule(pool, {
        title: '팀 회의',
        schedule_type: 'team',
        creator_id: user.id,
        team_id: team.id,
      });

      // Then: 생성 확인
      expect(schedule.schedule_type).toBe('team');
      expect(schedule.team_id).toBe(team.id);
    });

    test('일정 기간은 7일을 초과할 수 없음', async () => {
      // Given: 사용자
      const user = await createTestUser(pool);

      // When & Then: 7일 초과 일정 생성 시도
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 8 * 24 * 3600000); // 8일 후

      await expect(
        createTestSchedule(pool, {
          start_datetime: startDate.toISOString(),
          end_datetime: endDate.toISOString(),
          creator_id: user.id,
        })
      ).rejects.toThrow();
    });

    test('종료 시간이 시작 시간보다 이전일 수 없음', async () => {
      // Given: 사용자
      const user = await createTestUser(pool);

      // When & Then: 잘못된 시간 범위로 생성 시도
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() - 3600000); // 1시간 전

      await expect(
        createTestSchedule(pool, {
          start_datetime: startDate.toISOString(),
          end_datetime: endDate.toISOString(),
          creator_id: user.id,
        })
      ).rejects.toThrow();
    });

    test('일정 충돌 감지 함수', async () => {
      // Given: 기존 일정 (10:00 - 12:00)
      const user = await createTestUser(pool);
      const baseTime = new Date();
      baseTime.setHours(10, 0, 0, 0);

      await createTestSchedule(pool, {
        start_datetime: new Date(baseTime).toISOString(),
        end_datetime: new Date(baseTime.getTime() + 2 * 3600000).toISOString(),
        creator_id: user.id,
      });

      // When: 충돌 확인 (11:00 - 13:00)
      const newStart = new Date(baseTime.getTime() + 1 * 3600000);
      const newEnd = new Date(baseTime.getTime() + 3 * 3600000);

      const result = await pool.query(
        'SELECT check_schedule_conflict($1, $2, $3) as has_conflict',
        [user.id, newStart.toISOString(), newEnd.toISOString()]
      );

      // Then: 충돌 감지
      expect(result.rows[0].has_conflict).toBe(true);
    });

    test('일정 충돌 없음', async () => {
      // Given: 기존 일정 (10:00 - 12:00)
      const user = await createTestUser(pool);
      const baseTime = new Date();
      baseTime.setHours(10, 0, 0, 0);

      await createTestSchedule(pool, {
        start_datetime: new Date(baseTime).toISOString(),
        end_datetime: new Date(baseTime.getTime() + 2 * 3600000).toISOString(),
        creator_id: user.id,
      });

      // When: 충돌 확인 (13:00 - 14:00)
      const newStart = new Date(baseTime.getTime() + 3 * 3600000);
      const newEnd = new Date(baseTime.getTime() + 4 * 3600000);

      const result = await pool.query(
        'SELECT check_schedule_conflict($1, $2, $3) as has_conflict',
        [user.id, newStart.toISOString(), newEnd.toISOString()]
      );

      // Then: 충돌 없음
      expect(result.rows[0].has_conflict).toBe(false);
    });
  });

  describe('Message 모델', () => {
    test('메시지 생성', async () => {
      // Given: 팀과 사용자
      const user = await createTestUser(pool);
      const team = await createTestTeam(pool, user.id);

      // When: 메시지 생성
      const message = await createTestMessage(pool, {
        team_id: team.id,
        sender_id: user.id,
        content: '안녕하세요!',
        message_type: 'normal',
      });

      // Then: 생성 확인
      expect(message.id).toBeDefined();
      expect(message.content).toBe('안녕하세요!');
      expect(message.message_type).toBe('normal');
    });

    test('날짜별 메시지 조회', async () => {
      // Given: 팀과 여러 날짜의 메시지
      const user = await createTestUser(pool);
      const team = await createTestTeam(pool, user.id);

      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      await createTestMessage(pool, {
        team_id: team.id,
        sender_id: user.id,
        content: '오늘 메시지',
        target_date: today,
      });

      await createTestMessage(pool, {
        team_id: team.id,
        sender_id: user.id,
        content: '어제 메시지',
        target_date: yesterday,
      });

      // When: 오늘 날짜 메시지만 조회
      const result = await pool.query(
        'SELECT * FROM messages WHERE team_id = $1 AND target_date = $2',
        [team.id, today]
      );

      // Then: 오늘 메시지만 조회됨
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].content).toBe('오늘 메시지');
    });

    test('일정 요청 메시지 생성', async () => {
      // Given: 팀, 사용자, 일정
      const user = await createTestUser(pool);
      const team = await createTestTeam(pool, user.id);
      const schedule = await createTestSchedule(pool, {
        schedule_type: 'team',
        creator_id: user.id,
        team_id: team.id,
      });

      // When: 일정 요청 메시지 생성
      const message = await createTestMessage(pool, {
        team_id: team.id,
        sender_id: user.id,
        content: '일정 변경 요청드립니다',
        message_type: 'schedule_request',
        related_schedule_id: schedule.id,
      });

      // Then: 생성 확인
      expect(message.message_type).toBe('schedule_request');
      expect(message.related_schedule_id).toBe(schedule.id);
    });

    test('메시지 길이 제한 (500자)', async () => {
      // Given: 팀과 사용자
      const user = await createTestUser(pool);
      const team = await createTestTeam(pool, user.id);

      // When & Then: 500자 초과 메시지 생성 시도
      const longContent = 'A'.repeat(501);

      await expect(
        createTestMessage(pool, {
          team_id: team.id,
          sender_id: user.id,
          content: longContent,
        })
      ).rejects.toThrow();
    });
  });
});
