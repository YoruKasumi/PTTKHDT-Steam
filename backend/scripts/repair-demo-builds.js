'use strict';

require('dotenv').config();

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const AdmZip = require('adm-zip');
const { pool } = require('../src/config/database');
const demoGames = require('../src/config/demoGameCatalog');
const { getGameVersionDir } = require('../src/utils/storagePaths');
const {
  validateAndProcessBuildZip,
  ensureDrmWrappedOnApprove,
} = require('../src/utils/autoDrmPackager');

const DEMO_TEMPLATE_PATH = path.join(__dirname, '..', 'demo-games', 'index.template.html');
const DEMO_TEMPLATE = fs.readFileSync(DEMO_TEMPLATE_PATH, 'utf8');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createDemoArchive(game, destination) {
  const archive = new AdmZip();
  const html = DEMO_TEMPLATE.replace(/\{\{GAME_TITLE\}\}/g, escapeHtml(game.title));
  archive.addFile('index.html', Buffer.from(html, 'utf8'));
  archive.writeZip(destination);
}

function hasRootIndex(buildPath) {
  try {
    return new AdmZip(buildPath).getEntries()
      .some((entry) => entry.entryName === 'index.html' && !entry.isDirectory);
  } catch {
    return false;
  }
}

async function repairMissingDemoBuilds() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Không tạo build demo trong môi trường production.');
  }

  const [games] = await pool.execute(
    `SELECT GameID, DeveloperID, Title, Slug
     FROM GAME
     WHERE Slug IN (${demoGames.map(() => '?').join(', ')})
       AND Status = 'Approved'`,
    demoGames.map((game) => game.slug),
  );
  if (!games.length) throw new Error('Không tìm thấy game demo đã duyệt trong cơ sở dữ liệu.');

  let repaired = 0;
  for (const game of games) {
    const [versions] = await pool.execute(
      `SELECT VersionID, VersionNumber
       FROM GAMEVERSION
       WHERE GameID = ?
       ORDER BY IsCurrent DESC, UploadDate DESC`,
      [game.GameID],
    );
    for (const version of versions) {
      const buildPath = path.join(
        getGameVersionDir(game.DeveloperID, game.GameID, version.VersionNumber),
        'build.zip',
      );
      if (fs.existsSync(buildPath) && fs.statSync(buildPath).size > 0 && hasRootIndex(buildPath)) continue;

      const archivePath = path.join(os.tmpdir(), `steam-demo-repair-${randomUUID()}.zip`);
      try {
        createDemoArchive(game, archivePath);
        const result = await validateAndProcessBuildZip({
          tempFilePath: archivePath,
          developerId: game.DeveloperID,
          gameId: game.GameID,
          versionNumber: version.VersionNumber,
        });
        const drm = await ensureDrmWrappedOnApprove({
          developerId: game.DeveloperID,
          gameId: game.GameID,
          versionId: version.VersionID,
          versionNumber: version.VersionNumber,
          gameTitle: game.Title,
        });
        await pool.execute(
          `UPDATE GAMEVERSION
           SET BuildFile = ?, FileSize = ?, Sha256 = ?
           WHERE VersionID = ?`,
          [result.buildFileKey, drm.fileSize, drm.sha256, version.VersionID],
        );
        repaired += 1;
        console.log(`Đã tạo build demo: ${game.Slug}@${version.VersionNumber}`);
      } finally {
        if (fs.existsSync(archivePath)) fs.unlinkSync(archivePath);
      }
    }
  }

  console.log(`Hoàn tất: đã tạo ${repaired} build demo còn thiếu.`);
  return repaired;
}

if (require.main === module) {
  repairMissingDemoBuilds()
    .catch((error) => {
      console.error(`Sửa build demo thất bại: ${error.message}`);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}

module.exports = { repairMissingDemoBuilds };
