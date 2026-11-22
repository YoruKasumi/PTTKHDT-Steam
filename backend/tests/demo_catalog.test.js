'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { describe, it } = require('node:test');
const games = require('../src/config/demoGameCatalog');

describe('Demo game catalog', () => {
  it('contains the requested 12 slugs and VND prices', () => {
    assert.deepEqual(
      games.map((game) => [game.slug, game.price]),
      [
        ['sudoku', 0],
        ['spider-man', 1299000],
        ['repo', 149000],
        ['dragon-ball', 1490000],
        ['ma-soi', 140000],
        ['sky-children-of-the-light', 0],
        ['dr-doom-throne', 450000],
        ['squid-game', 180000],
        ['wuthering-waves', 0],
        ['genshin-impact', 0],
        ['snake', 0],
        ['tetris', 120000],
      ],
    );
  });

  it('has a bundled cover at each canonical public asset path', () => {
    for (const game of games) {
      const coverPath = path.join(
        __dirname,
        '..',
        'assets',
        'public',
        'games',
        game.slug,
        `${game.slug}-cover.${game.coverExtension}`,
      );
      assert.ok(fs.existsSync(coverPath), `Missing cover for ${game.slug}: ${coverPath}`);
      if (game.trailerExtension) {
        const trailerPath = path.join(
          __dirname,
          '..',
          'assets',
          'public',
          'games',
          game.slug,
          `${game.slug}-trailer.${game.trailerExtension}`,
        );
        assert.ok(fs.existsSync(trailerPath), `Missing trailer for ${game.slug}: ${trailerPath}`);
      }
    }
  });
});
