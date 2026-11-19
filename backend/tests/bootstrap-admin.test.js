'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  classifyExistingAdmins,
  validateBootstrapConfig,
} = require('../scripts/bootstrap-admin');

const validAdminInput = {
  BOOTSTRAP_ADMIN_USERNAME: 'first.admin',
  BOOTSTRAP_ADMIN_EMAIL: 'admin@example.test',
  BOOTSTRAP_ADMIN_DISPLAY_NAME: 'Initial Admin',
  BOOTSTRAP_ADMIN_PASSWORD: 'a-safe-password-42',
};

test('validates bootstrap fields and trims non-secret values', () => {
  const config = validateBootstrapConfig({
    ...validAdminInput,
    BOOTSTRAP_ADMIN_USERNAME: '  first.admin  ',
    BOOTSTRAP_ADMIN_EMAIL: ' admin@example.test ',
    BOOTSTRAP_ADMIN_DISPLAY_NAME: ' Initial Admin ',
  });

  assert.deepEqual(config, {
    username: 'first.admin',
    email: 'admin@example.test',
    displayName: 'Initial Admin',
    password: 'a-safe-password-42',
  });
});

test('rejects missing credentials, weak passwords, and overlong bcrypt input', () => {
  assert.throws(() => validateBootstrapConfig({}), /USERNAME/);
  assert.throws(() => validateBootstrapConfig({
    ...validAdminInput,
    BOOTSTRAP_ADMIN_PASSWORD: 'short',
  }), /PASSWORD/);
  assert.throws(() => validateBootstrapConfig({
    ...validAdminInput,
    BOOTSTRAP_ADMIN_PASSWORD: 'é'.repeat(37),
  }), /PASSWORD/);
});

test('allows an empty admin table or only the disabled sample admin', () => {
  assert.equal(classifyExistingAdmins([]), 'create');
  assert.equal(classifyExistingAdmins([{
    AccountID: 'A001',
    Username: 'admin01',
    PasswordHash: 'SAMPLE_ADMIN_DISABLED',
  }]), 'activate-sample');
});

test('refuses to modify an existing non-sample administrator', () => {
  assert.throws(() => classifyExistingAdmins([{
    AccountID: 'A001',
    Username: 'admin01',
    PasswordHash: '$2b$12$already-configured',
  }]), /Refusing to bootstrap/);
  assert.throws(() => classifyExistingAdmins([{
    AccountID: 'other-id',
    Username: 'another-admin',
    PasswordHash: 'SAMPLE_ADMIN_DISABLED',
  }]), /Refusing to bootstrap/);
});
