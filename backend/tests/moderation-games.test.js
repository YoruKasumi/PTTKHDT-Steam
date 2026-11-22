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

  it('records the reviewer and time in audit without changing the game decision', async () => {
    const service = new ModerationService();
    const transactionConnection = { transaction: true };
    const auditEntries = [];
    service.transaction = async (operation) => operation(transactionConnection);
    service.moderationDAO.truyVanChiTietGame = async (params, conn) => {
      assert.deepEqual(params, { gameId: 'game-1' });
      assert.equal(conn, transactionConnection);
      return { GameID: 'game-1', Title: 'Demo Game', Status: 'Pending' };
    };
    service.auditLogService = {
      recordLog: async (params, conn) => auditEntries.push({ params, conn }),
    };

    const result = await service.capNhatTrangThaiDaKiemTra({
      gameId: 'game-1',
      user: { accountId: 'manager-1' },
    });

    assert.deepEqual(result, { gameId: 'game-1', auditLogged: true, reviewerId: 'manager-1' });
    assert.equal(auditEntries.length, 1);
    assert.equal(auditEntries[0].conn, transactionConnection);
    assert.deepEqual(auditEntries[0].params, {
      accountId: 'manager-1',
      action: 'game.pre_review_completed',
      target: 'GAME:game-1',
      detail: JSON.stringify({
        gameTitle: 'Demo Game',
        gameStatus: 'Pending',
        event: 'pre_review_completed',
      }),
    });
  });

  it('rejects a pre-review audit entry for a missing game', async () => {
    const service = new ModerationService();
    service.transaction = async (operation) => operation({});
    service.moderationDAO.truyVanChiTietGame = async () => null;
    service.auditLogService = { recordLog: async () => assert.fail('Unexpected audit write') };

    await assert.rejects(
      service.capNhatTrangThaiDaKiemTra({ gameId: 'missing-game', user: { accountId: 'manager-1' } }),
      { status: 404 },
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
