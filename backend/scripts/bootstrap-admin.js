'use strict';

require('dotenv').config();
const bcrypt = require('bcryptjs');

const SAMPLE_ADMIN_ID = 'A001';
const SAMPLE_ADMIN_USERNAME = 'admin01';
const SAMPLE_ADMIN_PASSWORD_HASH = 'SAMPLE_ADMIN_DISABLED';
const BOOTSTRAP_LOCK_NAME = 'steam_store_bootstrap_admin';

function validateBootstrapConfig(env = process.env) {
  const username = typeof env.BOOTSTRAP_ADMIN_USERNAME === 'string'
    ? env.BOOTSTRAP_ADMIN_USERNAME.trim()
    : '';
  const email = typeof env.BOOTSTRAP_ADMIN_EMAIL === 'string'
    ? env.BOOTSTRAP_ADMIN_EMAIL.trim()
    : '';
  const displayName = typeof env.BOOTSTRAP_ADMIN_DISPLAY_NAME === 'string'
    ? env.BOOTSTRAP_ADMIN_DISPLAY_NAME.trim()
    : '';
  const password = typeof env.BOOTSTRAP_ADMIN_PASSWORD === 'string'
    ? env.BOOTSTRAP_ADMIN_PASSWORD
    : '';

  if (!/^[A-Za-z0-9._-]{3,30}$/.test(username)) {
    throw new Error('BOOTSTRAP_ADMIN_USERNAME must be 3-30 letters, numbers, dots, underscores or hyphens');
  }
  if (email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('BOOTSTRAP_ADMIN_EMAIL must be a valid email address up to 100 characters');
  }
  if (!displayName || displayName.length > 50) {
    throw new Error('BOOTSTRAP_ADMIN_DISPLAY_NAME must be 1-50 characters');
  }
  if ([...password].length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters and at most 72 UTF-8 bytes');
  }

  return { username, email, displayName, password };
}

function classifyExistingAdmins(admins) {
  if (!Array.isArray(admins)) {
    throw new TypeError('Expected administrator rows');
  }
  if (admins.length === 0) {
    return 'create';
  }
  if (
    admins.length === 1
    && admins[0].AccountID === SAMPLE_ADMIN_ID
    && admins[0].Username === SAMPLE_ADMIN_USERNAME
    && admins[0].PasswordHash === SAMPLE_ADMIN_PASSWORD_HASH
  ) {
    return 'activate-sample';
  }
  throw new Error('Refusing to bootstrap: an administrator already exists and is not the disabled sample account');
}

async function ensureAccountNameAvailable(connection, config, excludedAccountId = null) {
  const identityCondition = excludedAccountId
    ? '(Username = ? OR Email = ?) AND AccountID <> ?'
    : 'Username = ? OR Email = ?';
  const values = excludedAccountId
    ? [config.username, config.email, excludedAccountId]
    : [config.username, config.email];
  const [rows] = await connection.execute(
    `SELECT AccountID FROM ACCOUNT WHERE ${identityCondition} LIMIT 1 FOR UPDATE`,
    values,
  );
  if (rows.length > 0) {
    throw new Error('The requested username or email is already in use');
  }
}

async function bootstrapAdmin(config, pool) {
  const passwordHash = await bcrypt.hash(config.password, 12);
  const connection = await pool.getConnection();
  let lockAcquired = false;
  let transactionOpen = false;

  try {
    const [lockRows] = await connection.execute(
      'SELECT GET_LOCK(?, 10) AS acquired',
      [BOOTSTRAP_LOCK_NAME],
    );
    if (Number(lockRows[0].acquired) !== 1) {
      throw new Error('Could not acquire the administrator bootstrap lock');
    }
    lockAcquired = true;

    await connection.beginTransaction();
    transactionOpen = true;
    const [admins] = await connection.execute(
      `SELECT account.AccountID, account.Username, account.PasswordHash
       FROM ADMIN AS admin
       JOIN ACCOUNT AS account ON account.AccountID = admin.AccountID
       FOR UPDATE`,
    );
    const action = classifyExistingAdmins(admins);

    if (action === 'activate-sample') {
      await ensureAccountNameAvailable(connection, config, SAMPLE_ADMIN_ID);
      await connection.execute(
        `UPDATE ACCOUNT
         SET Username = ?, PasswordHash = ?, Email = ?, DisplayName = ?, Status = 'Active'
         WHERE AccountID = ?`,
        [
          config.username,
          passwordHash,
          config.email,
          config.displayName,
          SAMPLE_ADMIN_ID,
        ],
      );
    } else {
      await ensureAccountNameAvailable(connection, config);
      await connection.execute(
        `INSERT INTO ACCOUNT (Username, PasswordHash, Email, DisplayName, Status, NotifyEnabled)
         VALUES (?, ?, ?, ?, 'Active', 1)`,
        [config.username, passwordHash, config.email, config.displayName],
      );
      const [accounts] = await connection.execute(
        'SELECT AccountID FROM ACCOUNT WHERE Username = ? FOR UPDATE',
        [config.username],
      );
      if (accounts.length !== 1) {
        throw new Error('Could not resolve the newly created administrator account');
      }
      await connection.execute(
        'INSERT INTO ADMIN (AccountID) VALUES (?)',
        [accounts[0].AccountID],
      );
    }

    await connection.commit();
    transactionOpen = false;
    return action;
  } catch (error) {
    if (transactionOpen) {
      await connection.rollback();
    }
    throw error;
  } finally {
    try {
      if (lockAcquired) {
        await connection.execute('SELECT RELEASE_LOCK(?)', [BOOTSTRAP_LOCK_NAME]);
      }
    } finally {
      connection.release();
    }
  }
}

async function main() {
  const config = validateBootstrapConfig();
  const { pool } = require('../src/config/database');
  try {
    const action = await bootstrapAdmin(config, pool);
    console.log(action === 'activate-sample'
      ? 'Disabled sample administrator activated successfully.'
      : 'Initial administrator created successfully.');
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Admin bootstrap failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = {
  classifyExistingAdmins,
  validateBootstrapConfig,
};
