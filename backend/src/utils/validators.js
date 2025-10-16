import Joi from 'joi';

/**
 * Joi 검증 스키마 정의
 * Clean Architecture: Interface Adapters Layer
 */

// 사용자 관련 스키마
export const userSchemas = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': '유효한 이메일 형식이 아닙니다',
      'any.required': '이메일은 필수입니다'
    }),
    name: Joi.string().min(2).max(30).required().messages({
      'string.min': '이름은 최소 2자 이상이어야 합니다',
      'string.max': '이름은 최대 30자까지 입력 가능합니다',
      'any.required': '이름은 필수입니다'
    }),
    password: Joi.string().min(6).max(100).required().messages({
      'string.min': '비밀번호는 최소 6자 이상이어야 합니다',
      'string.max': '비밀번호는 최대 100자까지 입력 가능합니다',
      'any.required': '비밀번호는 필수입니다'
    })
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': '유효한 이메일 형식이 아닙니다',
      'any.required': '이메일은 필수입니다'
    }),
    password: Joi.string().required().messages({
      'any.required': '비밀번호는 필수입니다'
    })
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(30).messages({
      'string.min': '이름은 최소 2자 이상이어야 합니다',
      'string.max': '이름은 최대 30자까지 입력 가능합니다'
    })
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': '현재 비밀번호는 필수입니다'
    }),
    newPassword: Joi.string().min(6).max(100).required().messages({
      'string.min': '새 비밀번호는 최소 6자 이상이어야 합니다',
      'string.max': '새 비밀번호는 최대 100자까지 입력 가능합니다',
      'any.required': '새 비밀번호는 필수입니다'
    })
  })
};

// 팀 관련 스키마
export const teamSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(30).required().messages({
      'string.min': '팀 이름은 최소 2자 이상이어야 합니다',
      'string.max': '팀 이름은 최대 30자까지 입력 가능합니다',
      'any.required': '팀 이름은 필수입니다'
    }),
    description: Joi.string().max(500).allow('', null).messages({
      'string.max': '설명은 최대 500자까지 입력 가능합니다'
    })
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(30).messages({
      'string.min': '팀 이름은 최소 2자 이상이어야 합니다',
      'string.max': '팀 이름은 최대 30자까지 입력 가능합니다'
    }),
    description: Joi.string().max(500).allow('', null).messages({
      'string.max': '설명은 최대 500자까지 입력 가능합니다'
    })
  }).min(1).messages({
    'object.min': '수정할 필드를 최소 1개 이상 입력해주세요'
  }),

  join: Joi.object({
    inviteCode: Joi.string().length(6).required().messages({
      'string.length': '초대 코드는 6자리여야 합니다',
      'any.required': '초대 코드는 필수입니다'
    })
  })
};

// 일정 관련 스키마
export const scheduleSchemas = {
  create: Joi.object({
    title: Joi.string().min(2).max(100).required().messages({
      'string.min': '일정 제목은 최소 2자 이상이어야 합니다',
      'string.max': '일정 제목은 최대 100자까지 입력 가능합니다',
      'any.required': '일정 제목은 필수입니다'
    }),
    content: Joi.string().max(1000).allow('', null).messages({
      'string.max': '일정 내용은 최대 1000자까지 입력 가능합니다'
    }),
    startDatetime: Joi.date().iso().required().messages({
      'date.base': '유효한 날짜 형식이 아닙니다',
      'any.required': '시작 일시는 필수입니다'
    }),
    endDatetime: Joi.date().iso().greater(Joi.ref('startDatetime')).required().messages({
      'date.base': '유효한 날짜 형식이 아닙니다',
      'date.greater': '종료 일시는 시작 일시보다 이후여야 합니다',
      'any.required': '종료 일시는 필수입니다'
    }),
    scheduleType: Joi.string().valid('personal', 'team').required().messages({
      'any.only': '일정 유형은 personal 또는 team이어야 합니다',
      'any.required': '일정 유형은 필수입니다'
    }),
    teamId: Joi.number().integer().when('scheduleType', {
      is: 'team',
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }).messages({
      'any.required': '팀 일정의 경우 팀 ID는 필수입니다',
      'any.unknown': '개인 일정은 팀 ID를 포함할 수 없습니다'
    }),
    participantIds: Joi.array().items(Joi.number().integer()).min(1).messages({
      'array.min': '참가자는 최소 1명 이상이어야 합니다'
    })
  }),

  update: Joi.object({
    title: Joi.string().min(2).max(100).messages({
      'string.min': '일정 제목은 최소 2자 이상이어야 합니다',
      'string.max': '일정 제목은 최대 100자까지 입력 가능합니다'
    }),
    content: Joi.string().max(1000).allow('', null).messages({
      'string.max': '일정 내용은 최대 1000자까지 입력 가능합니다'
    }),
    startDatetime: Joi.date().iso().messages({
      'date.base': '유효한 날짜 형식이 아닙니다'
    }),
    endDatetime: Joi.date().iso().greater(Joi.ref('startDatetime')).messages({
      'date.base': '유효한 날짜 형식이 아닙니다',
      'date.greater': '종료 일시는 시작 일시보다 이후여야 합니다'
    })
  }).min(1).messages({
    'object.min': '수정할 필드를 최소 1개 이상 입력해주세요'
  }),

  query: Joi.object({
    startDate: Joi.date().iso().messages({
      'date.base': '유효한 날짜 형식이 아닙니다'
    }),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).messages({
      'date.base': '유효한 날짜 형식이 아닙니다',
      'date.greater': '종료 날짜는 시작 날짜보다 이후여야 합니다'
    }),
    scheduleType: Joi.string().valid('personal', 'team', 'all').messages({
      'any.only': '일정 유형은 personal, team 또는 all이어야 합니다'
    })
  })
};

// 메시지 관련 스키마
export const messageSchemas = {
  send: Joi.object({
    content: Joi.string().min(1).max(500).required().messages({
      'string.min': '메시지 내용은 최소 1자 이상이어야 합니다',
      'string.max': '메시지는 최대 500자까지 입력 가능합니다',
      'any.required': '메시지 내용은 필수입니다'
    }),
    targetDate: Joi.date().iso().required().messages({
      'date.base': '유효한 날짜 형식이 아닙니다',
      'any.required': '대상 날짜는 필수입니다'
    }),
    messageType: Joi.string()
      .valid('normal', 'schedule_request', 'schedule_approved', 'schedule_rejected')
      .default('normal')
      .messages({
        'any.only': '유효하지 않은 메시지 타입입니다'
      }),
    relatedScheduleId: Joi.number().integer().allow(null).messages({
      'number.base': '유효한 일정 ID가 아닙니다'
    })
  }),

  query: Joi.object({
    targetDate: Joi.date().iso().required().messages({
      'date.base': '유효한 날짜 형식이 아닙니다',
      'any.required': '대상 날짜는 필수입니다'
    }),
    limit: Joi.number().integer().min(1).max(100).default(50).messages({
      'number.min': '최소 1개 이상 조회해야 합니다',
      'number.max': '최대 100개까지 조회 가능합니다'
    }),
    offset: Joi.number().integer().min(0).default(0).messages({
      'number.min': 'offset은 0 이상이어야 합니다'
    })
  })
};

// ID 파라미터 스키마
export const idSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': '유효한 ID가 아닙니다',
    'number.positive': 'ID는 양수여야 합니다',
    'any.required': 'ID는 필수입니다'
  })
});

export default {
  userSchemas,
  teamSchemas,
  scheduleSchemas,
  messageSchemas,
  idSchema
};
