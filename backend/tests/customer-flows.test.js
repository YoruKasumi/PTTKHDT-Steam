'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const AccountDAO = require('../src/dao/AccountDAO');
const AuthService = require('../src/services/AuthService');
const CatalogService = require('../src/services/CatalogService');
const GameDAO = require('../src/dao/GameDAO');
const ProfileService = require('../src/services/ProfileService');
const password = require('../src/utils/password');

test('new customer registration creates wallet and cart along with account and customer rows', async () => {
  const dao = new AccountDAO();
  const queries = [];
  dao.query = async (sql, params, conn) => {
    queries.push({ sql, params, conn });
    return { affectedRows: 1 };
  };
  dao.one = async (_sql, params, conn) => {
    assert.deepEqual(params, ['customer_1']);
    assert.ok(conn);
    return { AccountID: 'account-1' };
  };
  const conn = {};

  const accountId = await dao.taoTaiKhoanMoi({
    username: 'customer_1',
    email: 'customer@example.test',
    displayName: 'Customer One',
    passwordHash: 'bcrypt-hash',
  }, conn);

  assert.equal(accountId, 'account-1');
  assert.equal(queries.length, 4);
  assert.match(queries[0].sql, /INSERT INTO ACCOUNT/);
  assert.match(queries[1].sql, /INSERT INTO CUSTOMER/);
  assert.match(queries[2].sql, /INSERT INTO WALLET \(CustomerID, Balance, Currency\) VALUES \(\?, 0, 'VND'\)/);
  assert.match(queries[3].sql, /INSERT INTO CART/);
  assert.ok(queries.every((query) => query.conn === conn));
});

test('login returns both Customer and Developer roles when both records exist', async () => {
  const service = new AuthService({
    kiemTraTaiKhoan: async () => ({
      AccountID: 'account-1',
      Username: 'publisher',
      PasswordHash: await password.hash('current-password'),
      Email: 'publisher@example.test',
      DisplayName: 'Publisher',
      Status: 'Active',
      IsCustomer: true,
      IsDeveloper: true,
      IsManager: false,
      IsAdmin: false,
      PermissionCodes: null,
    }),
  });
  const result = await service.guiThongTinDangNhap({ account: 'publisher', password: 'current-password' });
  assert.deepEqual(result.user.roles, ['Customer', 'Developer']);
});

test('profile updates return only public profile fields and validate notification preference', async () => {
  const service = new ProfileService();
  const calls = [];
  service.accountDAO.capNhatHoSoCaNhan = async (params) => calls.push(['profile', params]);
  service.accountDAO.capNhatTrangThaiThongBao = async (params) => calls.push(['notifications', params]);
  service.accountDAO.layHoSoCaNhan = async () => ({
    AccountID: 'account-1',
    Username: 'customer',
    Email: 'customer@example.test',
    DisplayName: 'New Name',
    AvatarUrl: null,
    NotifyEnabled: false,
    PasswordHash: 'must-not-leak',
  });

  const profile = await service.updateProfile({
    user: { accountId: 'account-1' },
    displayName: 'New Name',
    avatarUrl: null,
  });
  assert.equal(profile.displayName, 'New Name');
  assert.equal(profile.notifyEnabled, false);
  assert.equal(Object.hasOwn(profile, 'PasswordHash'), false);

  assert.deepEqual(await service.updateNotifications({
    user: { accountId: 'account-1' },
    enabled: false,
  }), { notifyEnabled: false });
  await assert.rejects(() => service.updateNotifications({
    user: { accountId: 'account-1' },
    enabled: 'false',
  }), { status: 422 });
  assert.equal(calls.length, 2);
});

test('password change verifies the current secret, rejects reuse, and stores a new bcrypt hash', async () => {
  const currentHash = await password.hash('current-password');
  let savedHash;
  const service = new AuthService({
    layMatKhauHienTai: async () => currentHash,
    capNhatMatKhauMoi: async ({ passwordHash }) => { savedHash = passwordHash; },
  });

  assert.deepEqual(await service.guiYeuCauThayDoiMatKhau({
    user: { accountId: 'account-1' },
    currentPassword: 'current-password',
    newPassword: 'new-password-123',
  }), { updated: true });
  assert.equal(await password.compare('new-password-123', savedHash), true);
  await assert.rejects(service.guiYeuCauThayDoiMatKhau({
    user: { accountId: 'account-1' },
    currentPassword: 'wrong-password',
    newPassword: 'another-password',
  }), { status: 422 });
  await assert.rejects(service.guiYeuCauThayDoiMatKhau({
    user: { accountId: 'account-1' },
    currentPassword: 'current-password',
    newPassword: 'current-password',
  }), { status: 422 });
});

test('catalog DAO composes approved-only filters and uses the sale-price view', async () => {
  const dao = new GameDAO();
  let query;
  dao.query = async (sql, params) => {
    query = { sql, params };
    return [];
  };
  await dao.listApprovedGames({
    keyword: 'Example',
    genreId: 'genre-1',
    minPrice: 10,
    maxPrice: 100,
    onSale: true,
    sort: 'price',
    direction: 'desc',
  });

  assert.match(query.sql, /g\.Status = 'Approved'/);
  assert.match(query.sql, /INNER JOIN V_GAME_PRICE AS price/);
  assert.match(query.sql, /price\.CurrentPrice >= \?/);
  assert.match(query.sql, /price\.CurrentPrice <= \?/);
  assert.match(query.sql, /price\.PercentOff > 0/);
  assert.match(query.sql, /REVIEW WHERE Status = 'Visible'/);
  assert.match(query.sql, /price\.CurrentPrice DESC/);
  assert.deepEqual(query.params, ['%Example%', '%Example%', 'genre-1', 10, 100]);
});

test('catalog applies combined validated filters and maps database prices to numbers', async () => {
  const service = new CatalogService();
  let received;
  service.gameDAO.listApprovedGames = async (filters) => {
    received = filters;
    return [{
      GameID: 'game-1',
      Title: 'Example',
      Description: 'Description',
      CoverImage: '/media/example.webp',
      CompanyName: 'Studio',
      GenreNames: 'Action,RPG',
      BasePrice: '200000.00',
      CurrentPrice: '150000.00',
      PercentOff: '25',
      AverageRating: '4.5',
      RatingCount: 2,
      Popularity: 10,
    }];
  };

  const result = await service.listGames({
    keyword: 'Example',
    genreId: 'genre-1',
    minPrice: '100000',
    maxPrice: '200000',
    onSale: 'true',
    sort: 'price-desc',
  });

  assert.deepEqual(received, {
    keyword: 'Example',
    genreId: 'genre-1',
    minPrice: 100000,
    maxPrice: 200000,
    onSale: true,
    sort: 'price',
    direction: 'desc',
  });
  assert.equal(result[0].price, 150000);
  assert.equal(result[0].basePrice, 200000);
  assert.deepEqual(result[0].genres, ['Action', 'RPG']);
  assert.throws(() => service.validateFilters({ minPrice: 100, maxPrice: 50 }), { status: 422 });
});

test('catalog review requires ownership and maps duplicate reviews to conflict', async () => {
  const service = new CatalogService();
  service.gameDAO.layThongTinSanPham = async () => ({ GameID: 'game-1' });
  service.gameDAO.kiemTraGameDaSoHuu = async () => ({ LicenseID: 'license-1' });
  service.gameDAO.taoDanhGia = async () => {
    const error = new Error('duplicate');
    error.code = 'ER_DUP_ENTRY';
    throw error;
  };

  await assert.rejects(
    service.createReview({
      user: { accountId: 'account-1' },
      gameId: 'game-1',
      rating: 5,
      content: 'Great game',
    }),
    (error) => error.status === 409,
  );
  service.gameDAO.kiemTraGameDaSoHuu = async () => null;
  await assert.rejects(
    service.createReview({
      user: { accountId: 'account-1' },
      gameId: 'game-1',
      rating: 5,
      content: 'Great game',
    }),
    (error) => error.status === 409,
  );
});
