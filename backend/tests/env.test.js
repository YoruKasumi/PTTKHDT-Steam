'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { resolveJwtSecret } = require('../src/config/env');

test('requires a strong JWT secret in production', () => {
  assert.throws(() => resolveJwtSecret('production', undefined), /JWT_SECRET/);
  assert.throws(() => resolveJwtSecret('production', 'short-secret'), /JWT_SECRET/);
  assert.equal(
    resolveJwtSecret('production', 'a'.repeat(32)),
    'a'.repeat(32),
  );
});

test('uses the local-only fallback outside production', () => {
  assert.equal(
    resolveJwtSecret('development', undefined),
    'local-development-only-secret',
  );
});
