'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const ProfileService = require('../src/services/ProfileService');
const ModerationService = require('../src/services/ModerationService');
const ModerationDAO = require('../src/dao/ModerationDAO');

describe('Profile and community moderation', () => {
  it('returns persisted profile data including avatar as read-only data', async () => {
    const service = new ProfileService();
    service.accountDAO.layHoSoCaNhan = async () => ({
      AccountID: 'account-1',
      Username: 'player',
      Email: 'player@example.test',
      DisplayName: 'Player One',
      AvatarUrl: '/avatar.png',
      NotifyEnabled: 1,
      CreatedAt: new Date('2025-01-02T00:00:00Z'),
    });

    const profile = await service.getProfile({ user: { accountId: 'account-1' } });

    assert.equal(profile.displayName, 'Player One');
    assert.equal(profile.avatarUrl, '/avatar.png');
    assert.equal(profile.createdAt.toISOString(), '2025-01-02T00:00:00.000Z');
  });

  it('updates display name without calling the avatar update DAO', async () => {
    const service = new ProfileService();
    let updatedName;
    service.accountDAO.capNhatTenHienThi = async (params) => {
      updatedName = params.displayName;
      return true;
    };
    service.accountDAO.capNhatDuongDanAnh = async () => {
      throw new Error('Avatar must not be changed');
    };
    service.accountDAO.layHoSoCaNhan = async () => ({
      AccountID: 'account-1',
      Username: 'player',
      Email: 'player@example.test',
      DisplayName: updatedName,
      AvatarUrl: '/avatar.png',
      NotifyEnabled: 1,
      CreatedAt: new Date('2025-01-02T00:00:00Z'),
    });

    const profile = await service.guiTenHienThiMoi({
      user: { accountId: 'account-1' },
      displayName: '  Updated Player  ',
    });

    assert.equal(updatedName, 'Updated Player');
    assert.equal(profile.avatarUrl, '/avatar.png');
  });

  it('lists existing reviews for community moderation and updates their status', async () => {
    const service = new ModerationService();
    const review = {
      ReviewID: 'review-1',
      CustomerID: 'customer-1',
      Username: 'player',
      GameID: 'game-1',
      GameTitle: 'Game One',
      Rating: '2',
      Content: 'Review text',
      ReviewDate: new Date('2025-01-03T00:00:00Z'),
      Status: 'Visible',
    };
    service.moderationDAO.truyVanNoiDungBiGanCo = async () => [review];
    service.moderationDAO.layDanhGiaTheoId = async () => review;
    service.moderationDAO.luuTrangThaiKiemDuyet = async () => 1;
    service.moderationDAO.taoThongBaoDanhGia = async () => {};
    service.transaction = (operation) => operation({});

    const reviews = await service.yeuCauDanhSachNoiDungGanCo();
    const result = await service.capNhatTrangThaiKiemDuyet({
      reviewId: 'review-1',
      status: 'Hidden',
      reason: 'Vi phạm quy định',
      user: { accountId: 'manager-1' },
    });

    assert.equal(reviews[0].reviewId, 'review-1');
    assert.equal(reviews[0].rating, 2);
    assert.equal(result.status, 'Hidden');
  });

  it('uses the review table for the UC47 list without requiring a flag schema', async () => {
    const dao = new ModerationDAO();
    dao.listReviews = async () => [{ ReviewID: 'review-1' }];
    dao.query = async (sql, params) => {
      assert.match(sql, /UPDATE REVIEW SET Status/);
      assert.deepEqual(params, ['Removed', 'review-1']);
      return { affectedRows: 1 };
    };

    assert.deepEqual(await dao.truyVanNoiDungBiGanCo(), [{ ReviewID: 'review-1' }]);
    assert.equal(await dao.luuTrangThaiKiemDuyet({ reviewId: 'review-1', status: 'Removed' }), 1);
  });
});
