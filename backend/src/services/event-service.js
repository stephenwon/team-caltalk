import logger from '../config/logger.js';

/**
 * 이벤트 서비스 (Long Polling)
 * Clean Architecture: Application Layer
 */
class EventService {
  constructor() {
    // 팀별 대기 중인 클라이언트 맵
    // teamId -> Set of { userId, res, timeout }
    this.pendingClients = new Map();

    // 타임아웃 설정 (30초)
    this.TIMEOUT_MS = 30000;
  }

  /**
   * 클라이언트 Long Polling 등록
   * @param {number} teamId - 팀 ID
   * @param {number} userId - 사용자 ID
   * @param {Object} res - Express response 객체
   * @param {Date} lastUpdate - 마지막 업데이트 시간
   */
  registerClient(teamId, userId, res, lastUpdate) {
    // 팀별 클라이언트 Set 생성
    if (!this.pendingClients.has(teamId)) {
      this.pendingClients.set(teamId, new Set());
    }

    const clients = this.pendingClients.get(teamId);

    // 타임아웃 설정
    const timeout = setTimeout(() => {
      this.removeClient(teamId, client);
      res.json({
        success: true,
        data: {
          hasUpdate: false,
          timestamp: new Date().toISOString()
        },
        message: '새 업데이트 없음',
        timestamp: new Date().toISOString()
      });
    }, this.TIMEOUT_MS);

    const client = {
      userId,
      res,
      timeout,
      lastUpdate,
      registeredAt: new Date()
    };

    clients.add(client);

    logger.debug('Long Polling 클라이언트 등록', {
      teamId,
      userId,
      clientCount: clients.size
    });

    // 연결 종료 시 클리너업
    res.on('close', () => {
      this.removeClient(teamId, client);
    });
  }

  /**
   * 클라이언트 제거
   * @param {number} teamId - 팀 ID
   * @param {Object} client - 클라이언트 객체
   */
  removeClient(teamId, client) {
    if (client.timeout) {
      clearTimeout(client.timeout);
    }

    const clients = this.pendingClients.get(teamId);
    if (clients) {
      clients.delete(client);

      if (clients.size === 0) {
        this.pendingClients.delete(teamId);
      }

      logger.debug('Long Polling 클라이언트 제거', {
        teamId,
        userId: client.userId,
        remainingClients: clients.size
      });
    }
  }

  /**
   * 팀 이벤트 브로드캐스트
   * @param {number} teamId - 팀 ID
   * @param {Object} eventData - 이벤트 데이터
   */
  broadcastToTeam(teamId, eventData) {
    const clients = this.pendingClients.get(teamId);

    if (!clients || clients.size === 0) {
      logger.debug('브로드캐스트할 클라이언트 없음', { teamId });
      return;
    }

    logger.info('팀 이벤트 브로드캐스트', {
      teamId,
      clientCount: clients.size,
      eventType: eventData.type
    });

    // 모든 대기 중인 클라이언트에게 이벤트 전송
    clients.forEach(client => {
      try {
        if (!client.res.headersSent) {
          client.res.json({
            success: true,
            data: {
              hasUpdate: true,
              event: eventData,
              timestamp: new Date().toISOString()
            },
            message: '새 업데이트 있음',
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        logger.error('이벤트 전송 실패', {
          teamId,
          userId: client.userId,
          error: error.message
        });
      } finally {
        this.removeClient(teamId, client);
      }
    });
  }

  /**
   * 특정 사용자에게 이벤트 전송
   * @param {number} teamId - 팀 ID
   * @param {number} userId - 사용자 ID
   * @param {Object} eventData - 이벤트 데이터
   */
  sendToUser(teamId, userId, eventData) {
    const clients = this.pendingClients.get(teamId);

    if (!clients) {
      return;
    }

    clients.forEach(client => {
      if (client.userId === userId) {
        try {
          if (!client.res.headersSent) {
            client.res.json({
              success: true,
              data: {
                hasUpdate: true,
                event: eventData,
                timestamp: new Date().toISOString()
              },
              message: '새 업데이트 있음',
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          logger.error('사용자 이벤트 전송 실패', {
            teamId,
            userId,
            error: error.message
          });
        } finally {
          this.removeClient(teamId, client);
        }
      }
    });

    logger.debug('사용자 이벤트 전송', { teamId, userId });
  }

  /**
   * 연결된 클라이언트 수 조회
   * @param {number} teamId - 팀 ID
   * @returns {number} - 클라이언트 수
   */
  getClientCount(teamId) {
    const clients = this.pendingClients.get(teamId);
    return clients ? clients.size : 0;
  }

  /**
   * 전체 연결된 클라이언트 수 조회
   * @returns {number} - 전체 클라이언트 수
   */
  getTotalClientCount() {
    let total = 0;
    this.pendingClients.forEach(clients => {
      total += clients.size;
    });
    return total;
  }

  /**
   * 서비스 정리 (서버 종료 시)
   */
  cleanup() {
    logger.info('EventService 정리 시작', {
      teamCount: this.pendingClients.size,
      totalClients: this.getTotalClientCount()
    });

    this.pendingClients.forEach((clients, teamId) => {
      clients.forEach(client => {
        if (client.timeout) {
          clearTimeout(client.timeout);
        }
        if (!client.res.headersSent) {
          client.res.status(503).json({
            success: false,
            error: {
              code: 'SERVER_SHUTDOWN',
              message: '서버가 종료되고 있습니다'
            },
            timestamp: new Date().toISOString()
          });
        }
      });
    });

    this.pendingClients.clear();
    logger.info('EventService 정리 완료');
  }
}

// 싱글톤 인스턴스 생성 및 export
const eventService = new EventService();

export default eventService;
