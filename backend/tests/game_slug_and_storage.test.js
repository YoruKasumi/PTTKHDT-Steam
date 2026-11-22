'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { generateGameSlug, normalizeGameSlug } = require('../src/utils/gameSlug');
const {
  getGameBuildKey,
  getGameVersionDir,
  resolveStorageKey,
} = require('../src/utils/storagePaths');
const { buildPublicAssetName } = require('../src/integrations/StorageClient');

describe('Game slugs and storage keys', () => {
  it('normalizes Vietnamese titles and preserves explicit catalog slugs', () => {
    assert.equal(generateGameSlug('Đồ Án: Ma Sói!'), 'do-an-ma-soi');
    assert.equal(normalizeGameSlug('dragon-ball', 'Tên khác'), 'dragon-ball');
  });

  it('uses the canonical slug for public cover and trailer filenames', () => {
    assert.equal(buildPublicAssetName('Marvel\'s Spider-Man', 'cover', 'poster.JPEG'), 'marvel-s-spider-man-cover.jpeg');
    assert.equal(buildPublicAssetName('squid-game', 'trailer', 'teaser.MP4'), 'squid-game-trailer.mp4');
    assert.throws(() => buildPublicAssetName('test', 'cover', 'poster.gif'), /không được hỗ trợ/);
  });

  it('isolates private build directories by developer and rejects traversal keys', () => {
    const firstDeveloperPath = getGameVersionDir('developer-one', 'game-123', '1.0.0');
    const secondDeveloperPath = getGameVersionDir('developer-two', 'game-123', '1.0.0');
    assert.notEqual(firstDeveloperPath, secondDeveloperPath);
    assert.equal(
      getGameBuildKey('developer-one', 'game-123', '1.0.0'),
      'developers/developer-one/games/game-123/1.0.0/build.zip',
    );
    assert.throws(() => resolveStorageKey(firstDeveloperPath, '..\\..\\secret.txt'), /vượt ra ngoài/);
  });
});
