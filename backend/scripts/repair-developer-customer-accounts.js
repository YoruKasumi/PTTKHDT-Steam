'use strict';

require('dotenv').config();

const { pool } = require('../src/config/database');

async function repairDeveloperCustomerAccounts(db = pool) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [developers] = await conn.execute('SELECT AccountID FROM DEVELOPER FOR UPDATE');
    for (const { AccountID } of developers) {
      await conn.execute('INSERT IGNORE INTO CUSTOMER (AccountID) VALUES (?)', [AccountID]);
      await conn.execute('INSERT IGNORE INTO WALLET (CustomerID) VALUES (?)', [AccountID]);
      await conn.execute('INSERT IGNORE INTO CART (CustomerID) VALUES (?)', [AccountID]);
    }
    await conn.commit();
    return { repairedDeveloperAccounts: developers.length };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

if (require.main === module) {
  repairDeveloperCustomerAccounts()
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => { console.error(`Không thể sửa hồ sơ khách hàng cho nhà phát hành: ${error.message}`); process.exitCode = 1; })
    .finally(() => pool.end());
}

module.exports = { repairDeveloperCustomerAccounts };
