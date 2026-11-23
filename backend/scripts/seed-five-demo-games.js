'use strict';

require('dotenv').config();

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { randomUUID, createHash } = require('node:crypto');
const AdmZip = require('adm-zip');
const { pool } = require('../src/config/database');
const services = require('../src/services');
const { PACKAGED_PUBLIC_ROOT } = require('../src/utils/storagePaths');

const GAMES = [
  { slug: 'lanterns-of-lacquer', title: 'Lanterns of Lacquer', description: 'Khôi phục một phố cổ ven sông bằng cách chế tác đèn lồng, gặp gỡ cư dân và khám phá những câu chuyện được truyền qua nhiều thế hệ.', price: 249000, discount: 20, genre: 'Adventure', cover: 'lanterns-of-lacquer-cover.jpg' },
  { slug: 'monsoon-drift', title: 'Monsoon Drift', description: 'Lái xe qua những cung đường nhiệt đới trong mùa mưa, tinh chỉnh chiếc xe của bạn và cạnh tranh để lập kỷ lục trên từng chặng đua.', price: 199000, discount: 25, genre: 'Racing', cover: 'monsoon-drift-cover.jpg' },
  { slug: 'echoes-beneath', title: 'Echoes Beneath', description: 'Khám phá một thành phố chìm dưới lòng biển, giải mã tín hiệu bí ẩn và quản lý nguồn năng lượng trước khi căn cứ im lặng hoàn toàn.', price: 159000, discount: 30, genre: 'Sci-fi', cover: 'echoes-of-the-deep-cover.jpg' },
  { slug: 'skyline-ronin', title: 'Skyline Ronin', description: 'Một kiếm sĩ lang thang vượt qua những mái nhà neon, đối đầu các băng nhóm máy móc và tìm lại ký ức đã bị đánh cắp.', price: 129000, discount: 15, genre: 'Action', cover: 'skyline-ronin-cover.webp' },
  { slug: 'clockwork-garden', title: 'Clockwork Garden', description: 'Xây dựng khu vườn cơ khí, kết hợp các bánh răng và dẫn dòng nước để đánh thức một thung lũng máy móc đã ngủ quên.', price: 99000, discount: 35, genre: 'Puzzle', cover: 'clockwork-garden-cover.jpg' },
];

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const coverUrl = (game) => `/api/media/games/${game.slug}/${game.cover}`;

async function one(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows[0] || null;
}

async function ensureGenre(name) {
  let row = await one('SELECT GenreID FROM GENRE WHERE GenreName = ?', [name]);
  if (!row) {
    const genreId = randomUUID();
    await pool.query('INSERT INTO GENRE (GenreID, GenreName, Description) VALUES (?, ?, ?)', [genreId, name, `Thể loại demo: ${name}`]);
    row = { GenreID: genreId };
  }
  return row.GenreID;
}

async function ensureDemoGame(game, developerId, managerId, genreId) {
  let row = await one('SELECT GameID, DeveloperID, Title, Status FROM GAME WHERE Slug = ?', [game.slug]);
  if (!row) {
    const archivePath = path.join(os.tmpdir(), `steam-text-demo-${randomUUID()}.zip`);
    const archive = new AdmZip();
    archive.addFile('index.html', Buffer.from(`<!doctype html><html lang="vi"><meta charset="utf-8"><title>${escapeHtml(game.title)}</title><body><h1>${escapeHtml(game.title)}</h1><p>Đây là bản game giả lập dạng văn bản dùng để kiểm thử thư viện, tải xuống và DRM. Không chứa gameplay thương mại.</p></body></html>`, 'utf8'));
    archive.writeZip(archivePath);
    try {
      const result = await services.gameService.luuHoSoDuAnGame({
        title: game.title,
        slug: game.slug,
        description: game.description,
        price: game.price,
        minSpec: 'Trình duyệt hiện đại, RAM 4GB.',
        recSpec: 'Trình duyệt hiện đại, RAM 8GB.',
        coverImage: coverUrl(game),
        genreIds: [genreId],
        versionNumber: '1.0.0',
        changeLog: 'Bản demo giả lập văn bản đầu tiên.',
        tempFilePath: archivePath,
        user: { accountId: developerId },
      });
      row = await one('SELECT GameID, DeveloperID, Title, Status FROM GAME WHERE GameID = ?', [result.gameId]);
    } finally {
      if (fs.existsSync(archivePath)) fs.unlinkSync(archivePath);
    }
  } else if (row.Title !== game.title) {
    throw new Error(`Slug ${game.slug} đang thuộc game khác: ${row.Title}`);
  }

  await pool.query('UPDATE GAME SET Description = ?, Price = ?, CoverImage = ? WHERE GameID = ?', [game.description, game.price, coverUrl(game), row.GameID]);
  await pool.query('INSERT IGNORE INTO GAME_GENRE (GameID, GenreID) VALUES (?, ?)', [row.GameID, genreId]);

  if (row.Status !== 'Approved') {
    await services.moderationService.reviewGame({ gameId: row.GameID, decision: 'Approved', user: { accountId: managerId } });
  }
  return row.GameID;
}

async function seedFiveDemoGames() {
  if (process.env.NODE_ENV === 'production') throw new Error('Demo seed is disabled in production.');
  const developers = (await pool.query("SELECT AccountID FROM DEVELOPER WHERE VerifyStatus = 'Verified' ORDER BY AccountID"))[0];
  const customers = (await pool.query('SELECT AccountID FROM CUSTOMER ORDER BY AccountID LIMIT 10'))[0];
  const manager = await one('SELECT AccountID FROM MANAGER ORDER BY AccountID LIMIT 1');
  if (developers.length < 3) throw new Error('Cần ít nhất 3 nhà phát hành đã xác minh để chia game demo.');
  if (customers.length < GAMES.length) throw new Error('Cần ít nhất 5 tài khoản khách hàng để cấp bản quyền demo.');
  if (!manager) throw new Error('Cần có tài khoản Manager để phê duyệt game demo.');

  const report = [];
  for (let index = 0; index < GAMES.length; index += 1) {
    const game = GAMES[index];
    const coverPath = path.join(PACKAGED_PUBLIC_ROOT, 'games', game.slug, game.cover);
    if (!fs.existsSync(coverPath)) throw new Error(`Thiếu ảnh bìa: ${coverPath}`);
    const gameId = await ensureDemoGame(game, developers[index % developers.length].AccountID, manager.AccountID, await ensureGenre(game.genre));

    const activeCampaign = await one('SELECT CampaignID FROM SALECAMPAIGN WHERE GameID = ? AND NOW() BETWEEN StartDate AND EndDate LIMIT 1', [gameId]);
    if (activeCampaign) {
      await pool.query('UPDATE SALECAMPAIGN SET PercentOff = ?, EndDate = DATE_ADD(NOW(), INTERVAL 30 DAY) WHERE CampaignID = ?', [game.discount, activeCampaign.CampaignID]);
    } else {
      await pool.query('INSERT INTO SALECAMPAIGN (CampaignID, GameID, PercentOff, StartDate, EndDate) VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY))', [randomUUID(), gameId, game.discount]);
    }

    const customerId = customers[index].AccountID;
    const license = await one("SELECT LicenseID FROM LICENSE WHERE CustomerID = ? AND GameID = ? AND Status = 'Active'", [customerId, gameId]);
    if (!license) {
      const token = createHash('sha256').update(randomUUID()).digest('hex');
      await pool.query("INSERT INTO LICENSE (LicenseID, CustomerID, GameID, Source, AccessToken, Status) VALUES (?, ?, ?, 'Key', ?, 'Active')", [randomUUID(), customerId, gameId, token]);
    }
    report.push({ title: game.title, developerId: developers[index % developers.length].AccountID, gameId, customerId, discount: game.discount, coverImage: coverUrl(game) });
  }
  return report;
}

if (require.main === module) {
  seedFiveDemoGames()
    .then((report) => console.log(JSON.stringify(report, null, 2)))
    .catch((error) => { console.error(`Seed 5 game demo thất bại: ${error.message}`); process.exitCode = 1; })
    .finally(() => pool.end());
}

module.exports = { GAMES, seedFiveDemoGames };
