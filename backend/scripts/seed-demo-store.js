'use strict';

require('dotenv').config();

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const AdmZip = require('adm-zip');
const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/database');
const services = require('../src/services');
const demoGames = require('../src/config/demoGameCatalog');
const {
  LEGACY_BUILDS_ROOT,
  PRIVATE_STORAGE_ROOT,
  getGameBuildKey,
  getGameVersionDir,
  getLegacyGameVersionDir,
  safeStorageSegment,
} = require('../src/utils/storagePaths');
const {
  validateAndProcessBuildZip,
  ensureDrmWrappedOnApprove,
} = require('../src/utils/autoDrmPackager');

const DEMO_GAMES = demoGames.map((game) => ({
  ...game,
  coverImage: `/api/media/games/${game.slug}/${game.slug}-cover.${game.coverExtension}`,
  trailerUrl: game.trailerExtension
    ? `/api/media/games/${game.slug}/${game.slug}-trailer.${game.trailerExtension}`
    : null,
  versions: [{ versionNumber: '1.0.0' }],
}));

const DEMO_MANAGER_PERMISSIONS = ['finance.read', 'community.moderate', 'audit.read'];

const DEMO_CUSTOMERS = Array.from({ length: 5 }, (_, index) => ({
  username: `demo_customer_0${index + 1}`,
  email: `demo_customer_0${index + 1}@example.test`,
  displayName: `Khách hàng Demo ${index + 1}`,
}));

const PURCHASE_PLAN = [
  { customerIndex: 0, gameSlugs: ['tetris', 'snake'] },
  { customerIndex: 1, gameSlugs: ['repo'] },
  { customerIndex: 2, gameSlugs: ['sudoku', 'genshin-impact'] },
  { customerIndex: 3, gameSlugs: ['ma-soi'] },
  { customerIndex: 4, gameSlugs: ['squid-game'] },
];

const REVIEW_PLAN = [
  { customerIndex: 0, gameSlug: 'tetris', rating: 5, content: 'Bản demo giả lập mở được từ thư viện sau khi mua.' },
  { customerIndex: 0, gameSlug: 'snake', rating: 5, content: 'Đã kiểm tra được luồng mua và khởi chạy bản demo.' },
  { customerIndex: 1, gameSlug: 'repo', rating: 4, content: 'Hóa đơn và bản quyền game được ghi nhận chính xác.' },
  { customerIndex: 2, gameSlug: 'sudoku', rating: 5, content: 'Bản demo Sudoku mở được trong thư viện game.' },
  { customerIndex: 2, gameSlug: 'genshin-impact', rating: 4, content: 'Đã kiểm tra được quyền sở hữu game miễn phí.' },
  { customerIndex: 3, gameSlug: 'ma-soi', rating: 5, content: 'Game demo đã được duyệt và có thể khởi chạy.' },
  { customerIndex: 4, gameSlug: 'squid-game', rating: 3, content: 'Đã kiểm tra được hóa đơn và quy trình yêu cầu hoàn tiền.' },
];

const DEMO_SOURCE_ROOT = path.join(__dirname, '..', 'demo-games');
const DEMO_TEMPLATE_PATH = path.join(DEMO_SOURCE_ROOT, 'index.template.html');
const DEMO_TEMPLATE = fs.readFileSync(DEMO_TEMPLATE_PATH, 'utf8');
const DEPOSIT_TARGET = 250000;
const LEGACY_GAME_IDS = [
  ...Array.from({ length: 23 }, (_, index) => `G${String(index + 1).padStart(3, '0')}`),
  'bac4ae9f-ff75-4686-9ba9-adcdf3df5e43',
  '87921b9e-4614-4237-aefa-53fe2fe5e559',
  '35447c3c-fe6e-4120-8cb7-10ca5efc1abb',
];
const LEGACY_GAME_TITLES = [
  'Xếp Gạch Tetris',
  'Rắn Săn Mồi Cổ Điển',
  'Sudoku Trí Tuệ',
  'Dò Mìn Cổ Điển',
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createGameArchive(game) {
  const archivePath = path.join(os.tmpdir(), `steam-demo-${randomUUID()}.zip`);
  const html = DEMO_TEMPLATE.replace(/\{\{GAME_TITLE\}\}/g, escapeHtml(game.title));
  const archive = new AdmZip();
  archive.addFile('index.html', Buffer.from(html, 'utf8'));
  archive.writeZip(archivePath);
  return archivePath;
}

async function withGameArchive(game, callback) {
  const archivePath = createGameArchive(game);
  try {
    return await callback(archivePath);
  } finally {
    if (fs.existsSync(archivePath)) fs.unlinkSync(archivePath);
  }
}

function archiveHasRootIndex(archivePath) {
  try {
    const archive = new AdmZip(archivePath);
    return archive.getEntries().some((entry) => entry.entryName === 'index.html' && !entry.isDirectory);
  } catch {
    return false;
  }
}

async function checkDemoGameArchives() {
  const checked = [];
  for (const game of DEMO_GAMES) {
    for (const version of game.versions) {
      await withGameArchive(game, async (archivePath) => {
        if (!archiveHasRootIndex(archivePath)) {
          throw new Error(`Build demo không có index.html ở thư mục gốc: ${game.slug}@${version.versionNumber}`);
        }
      });
      checked.push(`${game.slug}@${version.versionNumber}`);
    }
  }
  return checked;
}

async function queryOne(db, sql, values = []) {
  const [rows] = await db.execute(sql, values);
  return rows[0] || null;
}

async function setRolePermissions(conn, roleId, permissions) {
  await conn.execute('DELETE FROM ROLE_PERMISSION WHERE RoleID = ?', [roleId]);
  for (const permission of permissions) {
    await conn.execute(
      'INSERT INTO ROLE_PERMISSION (RoleID, PermissionCode) VALUES (?, ?)',
      [roleId, permission],
    );
  }
}

async function ensureGameSlugColumn() {
  const [columns] = await pool.execute(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'GAME' AND COLUMN_NAME = 'Slug'`,
  );
  if (!columns.length) {
    await pool.query('ALTER TABLE GAME ADD COLUMN Slug VARCHAR(120) NULL AFTER Title');
  }

  const [indexes] = await pool.execute(
    `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'GAME' AND INDEX_NAME = 'uq_game_slug'`,
  );
  if (!indexes.length) {
    await pool.query('ALTER TABLE GAME ADD UNIQUE KEY uq_game_slug (Slug)');
  }
}

async function resetLegacySampleGames() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [games] = await conn.query(
      'SELECT GameID FROM GAME WHERE GameID IN (?) OR Title IN (?) FOR UPDATE',
      [LEGACY_GAME_IDS, LEGACY_GAME_TITLES],
    );
    const gameIds = games.map((game) => game.GameID);
    if (!gameIds.length) {
      await conn.commit();
      return { removedGameCount: 0, cleanupWarnings: [] };
    }
    const [gameOwners] = await conn.query(
      'SELECT DISTINCT GameID, DeveloperID FROM GAME WHERE GameID IN (?)',
      [gameIds],
    );

    const [mixedOrders] = await conn.query(
      `SELECT item.OrderID
       FROM ORDERITEM AS item
       WHERE item.OrderID IN (
         SELECT sampleItem.OrderID FROM ORDERITEM AS sampleItem
         WHERE sampleItem.GameID IN (?)
       )
       GROUP BY item.OrderID
       HAVING SUM(item.GameID IN (?)) <> COUNT(*)`,
      [gameIds, gameIds],
    );
    if (mixedOrders.length) {
      throw new Error(
        `Dừng xóa dữ liệu mẫu: phát hiện hóa đơn chứa cả game mẫu lẫn game khác (${mixedOrders.map((row) => row.OrderID).join(', ')}).`,
      );
    }

    const [orders] = await conn.query(
      'SELECT DISTINCT OrderID FROM ORDERITEM WHERE GameID IN (?)',
      [gameIds],
    );
    const orderIds = orders.map((order) => order.OrderID);
    if (orderIds.length) {
      await conn.query(
        `UPDATE WALLET AS wallet
         JOIN (
           SELECT transactionRow.WalletID,
                  SUM(CASE transactionRow.Type
                    WHEN 'Purchase' THEN transactionRow.Amount
                    WHEN 'Refund' THEN -transactionRow.Amount
                    ELSE 0
                  END) AS BalanceAdjustment
           FROM \`TRANSACTION\` AS transactionRow
           WHERE transactionRow.OrderID IN (?)
             AND transactionRow.Status = 'Success'
             AND transactionRow.Type IN ('Purchase', 'Refund')
           GROUP BY transactionRow.WalletID
         ) AS ledger ON ledger.WalletID = wallet.WalletID
         SET wallet.Balance = wallet.Balance + ledger.BalanceAdjustment`,
        [orderIds],
      );
      await conn.query('DELETE FROM REFUNDREQUEST WHERE OrderID IN (?)', [orderIds]);
      await conn.query('DELETE FROM `TRANSACTION` WHERE OrderID IN (?)', [orderIds]);
      await conn.query('DELETE FROM ORDERITEM WHERE OrderID IN (?)', [orderIds]);
      await conn.query('DELETE FROM ORDERS WHERE OrderID IN (?)', [orderIds]);
    }

    for (const table of [
      'CARTITEM',
      'WISHLISTITEM',
      'REVIEW',
      'ACTIVATIONKEY',
      'SALECAMPAIGN',
      'COUPON',
      'LICENSE',
      'GAMEREVIEW',
      'GAME_GENRE',
      'GAMEVERSION',
    ]) {
      await conn.query(`DELETE FROM \`${table}\` WHERE GameID IN (?)`, [gameIds]);
    }
    await conn.query(
      'DELETE FROM AUDITLOG WHERE Target IN (?)',
      [gameIds.map((gameId) => `GAME:${gameId}`)],
    );
    await conn.query('DELETE FROM GAME WHERE GameID IN (?)', [gameIds]);
    await conn.commit();

    const cleanupWarnings = [];
    for (const game of gameOwners) {
      try {
        const gameId = safeStorageSegment(game.GameID, 'gameId');
        const developerId = safeStorageSegment(game.DeveloperID, 'developerId');
        const legacyGameDir = path.join(LEGACY_BUILDS_ROOT, 'games', gameId);
        const privateGameDir = path.join(PRIVATE_STORAGE_ROOT, 'developers', developerId, 'games', gameId);
        for (const directory of [legacyGameDir, privateGameDir]) {
          if (fs.existsSync(directory)) fs.rmSync(directory, { recursive: true, force: true });
        }
      } catch (error) {
        cleanupWarnings.push(`${game.GameID}: ${error.message}`);
      }
    }
    return { removedGameCount: gameIds.length, cleanupWarnings };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

async function migrateLegacyBuildStorage() {
  const [versions] = await pool.query(
    `SELECT gv.VersionID, gv.GameID, gv.VersionNumber, gv.BuildFile, game.DeveloperID
     FROM GAMEVERSION AS gv
     INNER JOIN GAME AS game ON game.GameID = gv.GameID
     WHERE gv.BuildFile LIKE 'games/%'`,
  );
  const missingBuilds = [];
  const cleanupWarnings = [];
  let migratedBuildCount = 0;

  for (const version of versions) {
    const legacyDir = getLegacyGameVersionDir(version.GameID, version.VersionNumber);
    const newDir = getGameVersionDir(version.DeveloperID, version.GameID, version.VersionNumber);
    const legacyBuild = path.join(legacyDir, 'build.zip');
    const newBuild = path.join(newDir, 'build.zip');

    if (!fs.existsSync(newBuild) && fs.existsSync(legacyBuild)) {
      fs.mkdirSync(path.dirname(newDir), { recursive: true });
      fs.cpSync(legacyDir, newDir, { recursive: true });
    }

    if (!fs.existsSync(newBuild)) {
      missingBuilds.push({
        gameId: version.GameID,
        versionNumber: version.VersionNumber,
        buildFile: version.BuildFile,
      });
      continue;
    }

    const newBuildKey = getGameBuildKey(version.DeveloperID, version.GameID, version.VersionNumber);
    await pool.execute(
      'UPDATE GAMEVERSION SET BuildFile = ? WHERE VersionID = ?',
      [newBuildKey, version.VersionID],
    );
    migratedBuildCount += 1;

    try {
      if (fs.existsSync(legacyDir)) fs.rmSync(legacyDir, { recursive: true, force: true });
    } catch (error) {
      cleanupWarnings.push(`${version.GameID}@${version.VersionNumber}: ${error.message}`);
    }
  }

  return { migratedBuildCount, missingBuilds, cleanupWarnings };
}

async function ensureAccount(conn, account, passwordHash) {
  const [existingRows] = await conn.execute(
    'SELECT AccountID, Username, Email, Status FROM ACCOUNT WHERE Username = ? OR Email = ? FOR UPDATE',
    [account.username, account.email],
  );
  if (existingRows.length > 1) {
    throw new Error(`Username/email demo đang trỏ tới nhiều tài khoản: ${account.username}`);
  }
  const existing = existingRows[0] || null;
  if (existing) {
    if (existing.Username !== account.username || existing.Email !== account.email) {
      throw new Error(`Tài khoản demo bị trùng username/email với dữ liệu khác: ${account.username}`);
    }
    if (existing.Status !== 'Active') {
      throw new Error(`Tài khoản demo ${account.username} không ở trạng thái Active.`);
    }
    return existing.AccountID;
  }

  const accountId = randomUUID();
  await conn.execute(
    `INSERT INTO ACCOUNT (AccountID, Username, PasswordHash, Email, DisplayName, Status)
     VALUES (?, ?, ?, ?, ?, 'Active')`,
    [accountId, account.username, passwordHash, account.email, account.displayName],
  );
  return accountId;
}

async function ensureGenre(conn, name) {
  let genre = await queryOne(conn, 'SELECT GenreID FROM GENRE WHERE GenreName = ? FOR UPDATE', [name]);
  if (!genre) {
    const genreId = randomUUID();
    await conn.execute(
      'INSERT INTO GENRE (GenreID, GenreName, Description) VALUES (?, ?, ?)',
      [genreId, name, `Thể loại dùng cho dữ liệu game demo: ${name}`],
    );
    genre = { GenreID: genreId };
  }
  return genre.GenreID;
}

async function ensureDemoAccounts(password) {
  const identities = [
    { key: 'admin', username: 'demo_store_admin', email: 'demo_store_admin@example.test', displayName: 'Demo Store Admin' },
    { key: 'manager', username: 'demo_store_moderator', email: 'demo_store_moderator@example.test', displayName: 'Demo Store Moderator' },
    { key: 'developer', username: 'demo_developer', email: 'demo_developer@example.test', displayName: 'Demo Studio' },
    ...DEMO_CUSTOMERS.map((customer, index) => ({ ...customer, key: `customer${index + 1}` })),
  ];
  const hashes = await Promise.all(identities.map(() => bcrypt.hash(password, 12)));
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();
    const accountIds = {};
    for (let index = 0; index < identities.length; index += 1) {
      accountIds[identities[index].key] = await ensureAccount(conn, identities[index], hashes[index]);
    }

    await conn.execute('INSERT IGNORE INTO ADMIN (AccountID) VALUES (?)', [accountIds.admin]);
    const role = await queryOne(conn, 'SELECT RoleID, ManagedBy FROM `ROLE` WHERE RoleName = ? FOR UPDATE', ['DemoGameModerator']);
    let roleId = role?.RoleID;
    if (role && role.ManagedBy !== accountIds.admin) {
      throw new Error('ROLE DemoGameModerator đã được quản lý bởi một tài khoản khác.');
    }
    if (!roleId) {
      roleId = randomUUID();
      await conn.execute(
        'INSERT INTO `ROLE` (RoleID, RoleName, ManagedBy) VALUES (?, ?, ?)',
        [roleId, 'DemoGameModerator', accountIds.admin],
      );
    }
    await setRolePermissions(conn, roleId, DEMO_MANAGER_PERMISSIONS);
    for (const sampleRole of [
      { roleId: 'R01', roleName: 'GameModerator', permissions: DEMO_MANAGER_PERMISSIONS },
      { roleId: 'R02', roleName: 'Support', permissions: [] },
    ]) {
      const existingRole = await queryOne(
        conn,
        'SELECT RoleName FROM `ROLE` WHERE RoleID = ? FOR UPDATE',
        [sampleRole.roleId],
      );
      if (existingRole?.RoleName === sampleRole.roleName) {
        await setRolePermissions(conn, sampleRole.roleId, sampleRole.permissions);
      }
    }
    await conn.execute(
      'INSERT INTO MANAGER (AccountID, RoleID) VALUES (?, ?) ON DUPLICATE KEY UPDATE RoleID = VALUES(RoleID)',
      [accountIds.manager, roleId],
    );

    await conn.execute(
      'INSERT INTO DEVELOPER (AccountID, CompanyName, FeePaid, VerifyStatus) VALUES (?, ?, 1, ?) ON DUPLICATE KEY UPDATE CompanyName = VALUES(CompanyName), FeePaid = 1, VerifyStatus = VALUES(VerifyStatus)',
      [accountIds.developer, 'Demo Studio', 'Verified'],
    );
    await conn.execute('INSERT IGNORE INTO CUSTOMER (AccountID) VALUES (?)', [accountIds.developer]);
    await conn.execute('INSERT IGNORE INTO WALLET (CustomerID) VALUES (?)', [accountIds.developer]);
    await conn.execute('INSERT IGNORE INTO CART (CustomerID) VALUES (?)', [accountIds.developer]);

    for (let index = 0; index < DEMO_CUSTOMERS.length; index += 1) {
      const customerId = accountIds[`customer${index + 1}`];
      await conn.execute('INSERT IGNORE INTO CUSTOMER (AccountID) VALUES (?)', [customerId]);
      await conn.execute('INSERT IGNORE INTO WALLET (CustomerID) VALUES (?)', [customerId]);
      await conn.execute('INSERT IGNORE INTO CART (CustomerID) VALUES (?)', [customerId]);
    }

    const genreNames = new Set(DEMO_GAMES.flatMap((game) => game.genres));
    const genres = {};
    for (const name of genreNames) genres[name] = await ensureGenre(conn, name);

    await conn.commit();
    return { accountIds, genres };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

async function fetchGame(slug) {
  return queryOne(
    pool,
    `SELECT GameID, DeveloperID, Title, Slug, Description, Price, CoverImage, TrailerUrl, Status
     FROM GAME WHERE Slug = ? LIMIT 1`,
    [slug],
  );
}

async function fetchVersions(gameId) {
  const [rows] = await pool.execute(
    `SELECT VersionID, VersionNumber, BuildFile, IsCurrent
     FROM GAMEVERSION WHERE GameID = ? ORDER BY UploadDate, VersionNumber`,
    [gameId],
  );
  return rows;
}

async function addGameVersion(game, definition) {
  const demo = DEMO_GAMES.find((candidate) => candidate.slug === game.Slug);
  return withGameArchive(demo, (tempFilePath) =>
    services.gameService.guiGoiCapNhat({
      gameId: game.GameID,
      versionNumber: definition.versionNumber,
      changeLog: 'Bản game demo giả lập dùng cho kiểm thử local.',
      tempFilePath,
      user: { accountId: game.DeveloperID },
    }));
}

function compareVersions(left, right) {
  const a = String(left || '0').split('.').map(Number);
  const b = String(right || '0').split('.').map(Number);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const diff = (a[index] || 0) - (b[index] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

async function ensureGame(gameDefinition, developerId, managerId, genres) {
  let game = await fetchGame(gameDefinition.slug);
  if (game && game.Title !== gameDefinition.title) {
    throw new Error(`Slug "${gameDefinition.slug}" đang thuộc game khác: "${game.Title}".`);
  }
  if (!game) {
    await withGameArchive(gameDefinition, (tempFilePath) =>
      services.gameService.luuHoSoDuAnGame({
        title: gameDefinition.title,
        slug: gameDefinition.slug,
        description: gameDefinition.description,
        price: gameDefinition.price,
        minSpec: 'Trình duyệt hiện đại, kết nối internet.',
        recSpec: 'Trình duyệt hiện đại, kết nối internet.',
        coverImage: gameDefinition.coverImage,
        trailerUrl: gameDefinition.trailerUrl,
        genreIds: gameDefinition.genres.map((name) => genres[name]),
        versionNumber: '1.0.0',
        changeLog: 'Bản game demo giả lập dùng cho kiểm thử local.',
        tempFilePath,
        user: { accountId: developerId },
      }));
    game = await fetchGame(gameDefinition.slug);
  }
  if (!game) throw new Error(`Không tạo hoặc tìm được game demo "${gameDefinition.title}".`);

  await pool.execute(
    `UPDATE GAME
     SET Title = ?, Slug = ?, Description = ?, Price = ?, CoverImage = ?, TrailerUrl = ?
     WHERE GameID = ?`,
    [
      gameDefinition.title, gameDefinition.slug, gameDefinition.description,
      gameDefinition.price, gameDefinition.coverImage, gameDefinition.trailerUrl, game.GameID,
    ],
  );
  await pool.execute('DELETE FROM GAME_GENRE WHERE GameID = ?', [game.GameID]);
  for (const genreName of gameDefinition.genres) {
    await pool.execute(
      'INSERT IGNORE INTO GAME_GENRE (GameID, GenreID) VALUES (?, ?)',
      [game.GameID, genres[genreName]],
    );
  }

  let versions = await fetchVersions(game.GameID);
  for (const definition of gameDefinition.versions) {
    if (!versions.some((version) => version.VersionNumber === definition.versionNumber)) {
      await addGameVersion(game, definition);
      versions = await fetchVersions(game.GameID);
    }
  }
  if (versions.length && !versions.some((version) => Number(version.IsCurrent) === 1)) {
    const current = versions.reduce((latest, version) =>
      compareVersions(version.VersionNumber, latest.VersionNumber) > 0 ? version : latest);
    await pool.execute('UPDATE GAMEVERSION SET IsCurrent = 1 WHERE VersionID = ?', [current.VersionID]);
    versions = await fetchVersions(game.GameID);
  }

  for (const version of versions) {
    const definition = gameDefinition.versions.find((candidate) => candidate.versionNumber === version.VersionNumber);
    if (!definition) continue;

    const versionDir = getGameVersionDir(game.DeveloperID, game.GameID, version.VersionNumber);
    const buildPath = path.join(versionDir, 'build.zip');
    if (!archiveHasRootIndex(buildPath)) {
      const result = await withGameArchive(gameDefinition, (tempFilePath) =>
        validateAndProcessBuildZip({
          tempFilePath,
          developerId: game.DeveloperID,
          gameId: game.GameID,
          versionNumber: version.VersionNumber,
        }));
      await pool.execute(
        'UPDATE GAMEVERSION SET BuildFile = ?, FileSize = ?, Sha256 = ? WHERE VersionID = ?',
        [result.buildFileKey, result.fileSize, result.sha256, version.VersionID],
      );
    }

    if (game.Status === 'Approved') {
      const drmResult = await ensureDrmWrappedOnApprove({
        developerId: game.DeveloperID,
        gameId: game.GameID,
        versionId: version.VersionID,
        versionNumber: version.VersionNumber,
        gameTitle: game.Title,
      });
      await pool.execute(
        'UPDATE GAMEVERSION SET FileSize = ?, Sha256 = ? WHERE VersionID = ?',
        [drmResult.fileSize, drmResult.sha256, version.VersionID],
      );
    }
  }

  const approval = await queryOne(
    pool,
    `SELECT CheckID FROM GAMEREVIEW
     WHERE GameID = ? AND Decision = 'Approved' LIMIT 1`,
    [game.GameID],
  );
  if (game.Status !== 'Approved' || !approval) {
    await services.moderationService.reviewGame({
      gameId: game.GameID,
      decision: 'Approved',
      user: { accountId: managerId },
    });
  }

  return fetchGame(gameDefinition.slug);
}

async function ensureDeposit(customerId) {
  const row = await queryOne(
    pool,
    `SELECT COALESCE((
       SELECT SUM(t.Amount)
       FROM WALLET w
       INNER JOIN \`TRANSACTION\` t ON t.WalletID = w.WalletID
       WHERE w.CustomerID = ? AND t.Type = 'Deposit' AND t.Status = 'Success'
     ), 0) AS Deposited`,
    [customerId],
  );
  const missing = Number((DEPOSIT_TARGET - Number(row.Deposited)).toFixed(2));
  if (missing > 0) {
    await services.walletService.guiYeuCauNapTien({
      user: { accountId: customerId },
      amount: missing,
      paymentMethod: 'VietQR',
    });
  }
}

async function findPurchase(customerId, gameId) {
  return queryOne(
    pool,
    `SELECT o.OrderID, o.Status, o.OrderDate, o.TotalAmount
     FROM ORDERS o
     INNER JOIN ORDERITEM oi ON oi.OrderID = o.OrderID
     WHERE o.CustomerID = ? AND oi.GameID = ?
     ORDER BY o.OrderDate DESC
     LIMIT 1`,
    [customerId, gameId],
  );
}

async function ensurePurchase(customerId, game) {
  const existing = await findPurchase(customerId, game.GameID);
  if (existing) return existing;

  const license = await queryOne(
    pool,
    `SELECT LicenseID FROM LICENSE
     WHERE CustomerID = ? AND GameID = ? AND Status = 'Active' LIMIT 1`,
    [customerId, game.GameID],
  );
  if (license) {
    throw new Error(`Tài khoản demo ${customerId} đã sở hữu "${game.Title}" nhưng không có hóa đơn tương ứng.`);
  }

  const [cartRows] = await pool.execute('SELECT GameID FROM CARTITEM WHERE CustomerID = ?', [customerId]);
  if (cartRows.some((row) => row.GameID !== game.GameID)) {
    throw new Error(`Giỏ hàng demo ${customerId} có sản phẩm ngoài seed; hãy dọn giỏ hàng trước khi chạy lại.`);
  }
  if (!cartRows.some((row) => row.GameID === game.GameID)) {
    await services.cartService.yeuCauThemSanPham({
      user: { accountId: customerId },
      gameId: game.GameID,
    });
  }
  await services.orderService.checkout({ user: { accountId: customerId } });
  const order = await findPurchase(customerId, game.GameID);
  if (!order) throw new Error(`Không tạo được hóa đơn cho game "${game.Title}".`);
  return order;
}

async function ensureReview(customerId, gameId, rating, content) {
  const existing = await queryOne(
    pool,
    'SELECT ReviewID FROM REVIEW WHERE CustomerID = ? AND GameID = ? LIMIT 1',
    [customerId, gameId],
  );
  if (existing) return existing.ReviewID;

  const review = await services.catalogService.createReview({
    user: { accountId: customerId },
    gameId,
    rating,
    content,
  });
  return review.reviewId;
}

async function ensureRefund(customerId, orderId) {
  const approved = await queryOne(
    pool,
    `SELECT RequestID FROM REFUNDREQUEST
     WHERE OrderID = ? AND Status = 'Approved' LIMIT 1`,
    [orderId],
  );
  if (approved) return approved.RequestID;

  const order = await queryOne(
    pool,
    `SELECT OrderID, Status, TIMESTAMPDIFF(SECOND, OrderDate, NOW()) AS AgeSeconds
     FROM ORDERS WHERE OrderID = ? AND CustomerID = ?`,
    [orderId, customerId],
  );
  if (!order || order.Status !== 'Completed') {
    throw new Error('Không thể tạo hoàn tiền demo: hóa đơn không còn ở trạng thái Completed.');
  }
  const refundWindowHours = await services.orderService.refundDAO.layHanMucHoanTien();
  if (Number(order.AgeSeconds) > Number(refundWindowHours) * 3600) {
    throw new Error(`Hóa đơn demo đã quá thời hạn hoàn tiền (${refundWindowHours} giờ).`);
  }

  await services.orderService.guiYeuCauHoanTien({
    user: { accountId: customerId },
    orderId,
    reason: 'Yêu cầu hoàn tiền mẫu để kiểm thử quy trình local.',
  });
  const result = await queryOne(
    pool,
    `SELECT RequestID FROM REFUNDREQUEST
     WHERE OrderID = ? AND Status = 'Approved'
     ORDER BY RequestDate DESC LIMIT 1`,
    [orderId],
  );
  if (!result) throw new Error('Hoàn tiền demo không được ghi nhận là Approved.');
  return result.RequestID;
}

async function seedDemoStore(options = {}) {
  const password = options.password || process.env.DEMO_ACCOUNT_PASSWORD;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Từ chối chạy seed demo khi NODE_ENV=production.');
  }
  if (process.env.SEED_DEMO_DATA !== '1' || process.env.RESET_DEMO_GAMES !== '1') {
    throw new Error('Đặt SEED_DEMO_DATA=1 và RESET_DEMO_GAMES=1 để xác nhận seed và xóa game mẫu cũ.');
  }
  if (typeof password !== 'string'
    || password.length < 12
    || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('DEMO_ACCOUNT_PASSWORD phải có ít nhất 12 ký tự và tối đa 72 byte.');
  }

  const lockConn = await pool.getConnection();
  let lockAcquired = false;
  try {
    const lock = await queryOne(lockConn, 'SELECT GET_LOCK(?, 10) AS Acquired', ['steam_store_demo_seed']);
    if (Number(lock.Acquired) !== 1) throw new Error('Không lấy được khóa seed demo; có thể một tiến trình khác đang chạy.');
    lockAcquired = true;

    await ensureGameSlugColumn();
    const resetResult = await resetLegacySampleGames();
    const storageMigration = await migrateLegacyBuildStorage();
    const { accountIds, genres } = await ensureDemoAccounts(password);
    const games = {};
    for (const definition of DEMO_GAMES) {
      games[definition.slug] = await ensureGame(
        definition,
        accountIds.developer,
        accountIds.manager,
        genres,
      );
    }

    for (let index = 0; index < DEMO_CUSTOMERS.length; index += 1) {
      await ensureDeposit(accountIds[`customer${index + 1}`]);
    }

    const orders = {};
    for (const entry of PURCHASE_PLAN) {
      const customerId = accountIds[`customer${entry.customerIndex + 1}`];
      for (const slug of entry.gameSlugs) {
        orders[`${entry.customerIndex + 1}:${slug}`] = await ensurePurchase(customerId, games[slug]);
      }
    }

    const reviews = [];
    for (const entry of REVIEW_PLAN) {
      const customerId = accountIds[`customer${entry.customerIndex + 1}`];
      const reviewId = await ensureReview(customerId, games[entry.gameSlug].GameID, entry.rating, entry.content);
      reviews.push({ customer: DEMO_CUSTOMERS[entry.customerIndex].username, game: entry.gameSlug, reviewId });
    }

    const refundCustomerId = accountIds.customer5;
    const refundOrder = orders['5:squid-game'];
    const refundRequestId = await ensureRefund(refundCustomerId, refundOrder.OrderID);
    orders['5:squid-game'] = await findPurchase(refundCustomerId, games['squid-game'].GameID);

    return {
      removedLegacyGameCount: resetResult.removedGameCount,
      legacyBuildCleanupWarnings: resetResult.cleanupWarnings,
      storageMigration,
      accounts: {
        admin: 'demo_store_admin',
        moderator: 'demo_store_moderator',
        developer: 'demo_developer',
        customers: DEMO_CUSTOMERS.map((customer) => customer.username),
        passwordEnvironmentVariable: 'DEMO_ACCOUNT_PASSWORD',
      },
      games: Object.fromEntries(Object.entries(games).map(([slug, game]) => [slug, {
        gameId: game.GameID,
        title: game.Title,
        status: game.Status,
      }])),
      orders: Object.fromEntries(Object.entries(orders).map(([key, order]) => [key, {
        orderId: order.OrderID,
        status: order.Status,
      }])),
      reviews,
      refundRequestId,
    };
  } finally {
    if (lockAcquired) await lockConn.execute('SELECT RELEASE_LOCK(?)', ['steam_store_demo_seed']);
    lockConn.release();
  }
}

async function main() {
  if (process.argv.includes('--check')) {
    const checked = await checkDemoGameArchives();
    console.log(`Đã kiểm tra ${checked.length} build demo: ${checked.join(', ')}`);
    return;
  }
  const summary = await seedDemoStore();
  console.log(JSON.stringify(summary, null, 2));
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(`Seed demo thất bại: ${error.message}`);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}

module.exports = {
  DEMO_GAMES,
  checkDemoGameArchives,
  resetLegacySampleGames,
  seedDemoStore,
};
