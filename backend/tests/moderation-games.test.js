'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const ModerationDAO = require('../src/dao/ModerationDAO');
const ModerationService = require('../src/services/ModerationService');

describe('Game moderation', () => {
  it('lists the requested status and defaults to pending games', async () => {
    const service = new ModerationService();
    const requests = [];
    service.moderationDAO.truyVanDanhSachGameChoDuyet = async (params) => {
      requests.push(params);
      return [];
    };

    await service.yeuCauLayHoSoGameChoDuyet({});
    await service.yeuCauLayHoSoGameChoDuyet({ status: 'Approved' });

    assert.deepEqual(requests, [{ status: 'Pending' }, { status: 'Approved' }]);
    await assert.rejects(
      service.yeuCauLayHoSoGameChoDuyet({ status: 'NotAStatus' }),
      { status: 422 },
    );
  });

  it('requires a reason for rejection and emergency delisting', async () => {
    const service = new ModerationService();
    await assert.rejects(
      service.reviewGame({ gameId: 'game-1', decision: 'Rejected', reason: ' ' }),
      { status: 422 },
    );
    await assert.rejects(
      service.reviewGame({ gameId: 'game-1', decision: 'EmergencyDelist', reason: '' }),
      { status: 422 },
    );
  });

  it('binds requested game status in the moderation list query', async () => {
    const dao = new ModerationDAO();
    let captured;
    dao.query = async (sql, params) => {
      captured = { sql, params };
      return [];
    };

    await dao.truyVanDanhSachGameChoDuyet({ status: 'Approved' });
    assert.match(captured.sql, /WHERE g\.Status = \?/);
    assert.deepEqual(captured.params, ['Approved']);
  });
});
