'use strict';

require('dotenv').config();
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');

const DEMO_ADMIN_USERNAME = 'demo_admin';
const DEMO_STAFF_USERNAME = 'demo_staff';
const DEMO_ADMIN_EMAIL = 'demo.admin@example.test';
const DEMO_STAFF_EMAIL = 'demo.staff@example.test';
const BOOTSTRAP_LOCK_NAME = 'steam_store_bootstrap_demo_accounts';

function createTemporaryPassword() {
  return crypto.randomBytes(18).toString('base64url');
}

async function createDemoAccounts(pool, passwords = {
  admin: createTemporaryPassword(),
  staff: createTemporaryPassword(),
}) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Demo accounts can only be created outside production');
  }
  for (const [label, value] of Object.entries(passwords)) {
    if (typeof value !== 'string' || Buffer.byteLength(value, 'utf8') < 12 || Buffer.byteLength(value, 'utf8') > 72) {
      throw new Error(`${label} password must be between 12 and 72 UTF-8 bytes`);
    }
  }

  const [adminPasswordHash, staffPasswordHash] = await Promise.all([
    bcrypt.hash(passwords.admin, 12),
    bcrypt.hash(passwords.staff, 12),
  ]);
  const connection = await pool.getConnection();
  let lockAcquired = false;
  let transactionOpen = false;

  try {
    const [lockRows] = await connection.execute('SELECT GET_LOCK(?, 10) AS acquired', [BOOTSTRAP_LOCK_NAME]);
    if (Number(lockRows[0].acquired) !== 1) throw new Error('Could not acquire demo account bootstrap lock');
    lockAcquired = true;

    await connection.beginTransaction();
    transactionOpen = true;
    const [existing] = await connection.execute(
      'SELECT Username FROM ACCOUNT WHERE Username IN (?, ?) OR Email IN (?, ?) FOR UPDATE',
      [DEMO_ADMIN_USERNAME, DEMO_STAFF_USERNAME, DEMO_ADMIN_EMAIL, DEMO_STAFF_EMAIL],
    );
    if (existing.length) {
      throw new Error('Demo account username or email already exists; refusing to overwrite an existing account');
    }

    await connection.execute(
      `INSERT INTO ACCOUNT (Username, PasswordHash, Email, DisplayName, Status, NotifyEnabled)
       VALUES (?, ?, ?, ?, 'Active', 1)`,
      [DEMO_ADMIN_USERNAME, adminPasswordHash, DEMO_ADMIN_EMAIL, 'Demo Administrator'],
    );
    const [adminRows] = await connection.execute(
      'SELECT AccountID FROM ACCOUNT WHERE Username = ? FOR UPDATE',
      [DEMO_ADMIN_USERNAME],
    );
    if (adminRows.length !== 1) throw new Error('Could not resolve demo admin account');
    const adminId = adminRows[0].AccountID;
    await connection.execute('INSERT INTO ADMIN (AccountID) VALUES (?)', [adminId]);

    await connection.execute(
      `INSERT INTO ACCOUNT (Username, PasswordHash, Email, DisplayName, Status, NotifyEnabled)
       VALUES (?, ?, ?, ?, 'Active', 1)`,
      [DEMO_STAFF_USERNAME, staffPasswordHash, DEMO_STAFF_EMAIL, 'Demo Staff'],
    );
    const [staffRows] = await connection.execute(
      'SELECT AccountID FROM ACCOUNT WHERE Username = ? FOR UPDATE',
      [DEMO_STAFF_USERNAME],
    );
    if (staffRows.length !== 1) throw new Error('Could not resolve demo staff account');

    const roleName = `DemoStaff-${crypto.randomBytes(3).toString('hex')}`;
    await connection.execute(
      'INSERT INTO `ROLE` (RoleName, ManagedBy) VALUES (?, ?)',
      [roleName, adminId],
    );
    const [roleRows] = await connection.execute(
      'SELECT RoleID FROM `ROLE` WHERE RoleName = ? FOR UPDATE',
      [roleName],
    );
    if (roleRows.length !== 1) throw new Error('Could not resolve demo staff role');
    await connection.execute(
      'INSERT INTO MANAGER (AccountID, RoleID) VALUES (?, ?)',
      [staffRows[0].AccountID, roleRows[0].RoleID],
    );

    await connection.commit();
    transactionOpen = false;
    return {
      admin: { username: DEMO_ADMIN_USERNAME, email: DEMO_ADMIN_EMAIL, password: passwords.admin },
      staff: { username: DEMO_STAFF_USERNAME, email: DEMO_STAFF_EMAIL, password: passwords.staff },
    };
  } catch (error) {
    if (transactionOpen) await connection.rollback();
    throw error;
  } finally {
    try {
      if (lockAcquired) await connection.execute('SELECT RELEASE_LOCK(?)', [BOOTSTRAP_LOCK_NAME]);
    } finally {
      connection.release();
    }
  }
}

async function main() {
  const { pool } = require('../src/config/database');
  try {
    const accounts = await createDemoAccounts(pool);
    console.log('Temporary development accounts created. Save these credentials; passwords are not stored in plaintext:');
    console.log(JSON.stringify(accounts, null, 2));
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Demo account bootstrap failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { createDemoAccounts, createTemporaryPassword };
