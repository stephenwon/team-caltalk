const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * 테스트 데이터 픽스처
 */

// 사용자 생성 헬퍼
async function createTestUser(pool, userData = {}) {
  const defaultUser = {
    email: `test${Date.now()}@example.com`,
    name: '테스트사용자',
    password: 'Test1234!@',
  };

  const user = { ...defaultUser, ...userData };
  const passwordHash = await bcrypt.hash(user.password, 10);

  const result = await pool.query(
    `INSERT INTO users (email, name, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, email, name, created_at, updated_at`,
    [user.email, user.name, passwordHash]
  );

  return {
    ...result.rows[0],
    password: user.password, // 테스트용으로 원본 비밀번호 포함
  };
}

// 여러 사용자 생성
async function createTestUsers(pool, count = 3) {
  const users = [];
  for (let i = 0; i < count; i++) {
    const user = await createTestUser(pool, {
      email: `user${i}@example.com`,
      name: `사용자${i}`,
    });
    users.push(user);
  }
  return users;
}

// 팀 생성 헬퍼
async function createTestTeam(pool, creatorId, teamData = {}) {
  const defaultTeam = {
    name: `테스트팀${Date.now()}`,
    description: '테스트용 팀입니다',
  };

  const team = { ...defaultTeam, ...teamData };

  // 초대 코드 생성
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const result = await pool.query(
    `INSERT INTO teams (name, description, invite_code, creator_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, description, invite_code, creator_id, created_at, updated_at`,
    [team.name, team.description, inviteCode, creatorId]
  );

  // 팀장을 team_members에 추가
  await pool.query(
    `INSERT INTO team_members (team_id, user_id, role)
     VALUES ($1, $2, $3)`,
    [result.rows[0].id, creatorId, 'leader']
  );

  return result.rows[0];
}

// 팀원 추가 헬퍼
async function addTeamMember(pool, teamId, userId, role = 'member') {
  const result = await pool.query(
    `INSERT INTO team_members (team_id, user_id, role)
     VALUES ($1, $2, $3)
     RETURNING id, team_id, user_id, role, joined_at`,
    [teamId, userId, role]
  );

  return result.rows[0];
}

// 일정 생성 헬퍼
async function createTestSchedule(pool, scheduleData) {
  const defaultSchedule = {
    title: '테스트 일정',
    content: '테스트 일정 내용',
    start_datetime: new Date(Date.now() + 3600000).toISOString(), // 1시간 후
    end_datetime: new Date(Date.now() + 7200000).toISOString(), // 2시간 후
    schedule_type: 'personal',
    creator_id: null,
    team_id: null,
  };

  const schedule = { ...defaultSchedule, ...scheduleData };

  const result = await pool.query(
    `INSERT INTO schedules (title, content, start_datetime, end_datetime, schedule_type, creator_id, team_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, title, content, start_datetime, end_datetime, schedule_type, creator_id, team_id, created_at, updated_at`,
    [
      schedule.title,
      schedule.content,
      schedule.start_datetime,
      schedule.end_datetime,
      schedule.schedule_type,
      schedule.creator_id,
      schedule.team_id,
    ]
  );

  // 참가자 추가
  if (schedule.creator_id) {
    await pool.query(
      `INSERT INTO schedule_participants (schedule_id, user_id, participation_status)
       VALUES ($1, $2, $3)`,
      [result.rows[0].id, schedule.creator_id, 'confirmed']
    );
  }

  return result.rows[0];
}

// 메시지 생성 헬퍼
async function createTestMessage(pool, messageData) {
  const defaultMessage = {
    team_id: null,
    sender_id: null,
    content: '테스트 메시지',
    target_date: new Date().toISOString().split('T')[0],
    message_type: 'normal',
    related_schedule_id: null,
  };

  const message = { ...defaultMessage, ...messageData };

  const result = await pool.query(
    `INSERT INTO messages (team_id, sender_id, content, target_date, message_type, related_schedule_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, team_id, sender_id, content, target_date, message_type, related_schedule_id, sent_at, created_at`,
    [
      message.team_id,
      message.sender_id,
      message.content,
      message.target_date,
      message.message_type,
      message.related_schedule_id,
    ]
  );

  return result.rows[0];
}

// JWT 토큰 생성 헬퍼
function generateTestToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
}

// 만료된 JWT 토큰 생성 헬퍼
function generateExpiredToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '-1h' } // 이미 만료됨
  );
}

// 잘못된 JWT 토큰 생성 헬퍼
function generateInvalidToken(userId) {
  return jwt.sign(
    { userId },
    'wrong-secret-key',
    { expiresIn: '1h' }
  );
}

// 테스트 시나리오 생성 헬퍼
async function setupBasicScenario(pool) {
  // 사용자 3명 생성
  const users = await createTestUsers(pool, 3);

  // 팀 생성 (첫 번째 사용자가 팀장)
  const team = await createTestTeam(pool, users[0].id, {
    name: '개발팀',
    description: '개발 프로젝트 팀',
  });

  // 두 번째, 세 번째 사용자를 팀원으로 추가
  await addTeamMember(pool, team.id, users[1].id);
  await addTeamMember(pool, team.id, users[2].id);

  // JWT 토큰 생성
  const tokens = users.map(user => generateTestToken(user.id));

  return {
    users,
    team,
    tokens,
  };
}

// 충돌하는 일정 시나리오 생성
async function setupConflictScenario(pool, userId, teamId) {
  const baseTime = new Date();
  baseTime.setMinutes(0, 0, 0);

  // 기존 일정: 10:00 - 12:00
  const existingSchedule = await createTestSchedule(pool, {
    title: '기존 회의',
    start_datetime: new Date(baseTime.getTime() + 10 * 3600000).toISOString(),
    end_datetime: new Date(baseTime.getTime() + 12 * 3600000).toISOString(),
    schedule_type: 'team',
    creator_id: userId,
    team_id: teamId,
  });

  // 충돌하는 시간대들
  const conflictTimes = [
    // 완전히 겹침: 10:00 - 12:00
    {
      start: new Date(baseTime.getTime() + 10 * 3600000),
      end: new Date(baseTime.getTime() + 12 * 3600000),
    },
    // 시작 시간이 겹침: 09:00 - 11:00
    {
      start: new Date(baseTime.getTime() + 9 * 3600000),
      end: new Date(baseTime.getTime() + 11 * 3600000),
    },
    // 종료 시간이 겹침: 11:00 - 13:00
    {
      start: new Date(baseTime.getTime() + 11 * 3600000),
      end: new Date(baseTime.getTime() + 13 * 3600000),
    },
    // 포함됨: 10:30 - 11:30
    {
      start: new Date(baseTime.getTime() + 10.5 * 3600000),
      end: new Date(baseTime.getTime() + 11.5 * 3600000),
    },
  ];

  // 충돌하지 않는 시간대들
  const nonConflictTimes = [
    // 이전: 08:00 - 09:00
    {
      start: new Date(baseTime.getTime() + 8 * 3600000),
      end: new Date(baseTime.getTime() + 9 * 3600000),
    },
    // 이후: 13:00 - 14:00
    {
      start: new Date(baseTime.getTime() + 13 * 3600000),
      end: new Date(baseTime.getTime() + 14 * 3600000),
    },
    // 정확히 붙어있음 (시작): 09:00 - 10:00
    {
      start: new Date(baseTime.getTime() + 9 * 3600000),
      end: new Date(baseTime.getTime() + 10 * 3600000),
    },
    // 정확히 붙어있음 (종료): 12:00 - 13:00
    {
      start: new Date(baseTime.getTime() + 12 * 3600000),
      end: new Date(baseTime.getTime() + 13 * 3600000),
    },
  ];

  return {
    existingSchedule,
    conflictTimes,
    nonConflictTimes,
  };
}

module.exports = {
  createTestUser,
  createTestUsers,
  createTestTeam,
  addTeamMember,
  createTestSchedule,
  createTestMessage,
  generateTestToken,
  generateExpiredToken,
  generateInvalidToken,
  setupBasicScenario,
  setupConflictScenario,
};
