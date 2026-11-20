'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const requestContext = require('../src/utils/requestContext');

test('authenticated identity and uploaded files cannot be overridden by request input', () => {
  const authenticatedUser = { accountId: 'trusted-account', roles: ['Customer'] };
  const files = [{ filename: 'uploaded-file.zip' }];
  const context = requestContext({
    user: authenticatedUser,
    query: { user: { accountId: 'query-account' } },
    params: { accountId: 'route-account' },
    body: {
      accountId: 'body-account',
      user: { accountId: 'body-account' },
      files: ['forged-file'],
    },
    files,
  });

  assert.equal(context.user, authenticatedUser);
  assert.equal(context.accountId, 'route-account');
  assert.equal(context.files, files);
});
