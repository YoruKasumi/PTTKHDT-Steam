const mysql = require('mysql2/promise');

function typeCast(field, next) {
  if (field.type === 'TINY' && field.length === 1) {
    const value = field.string();
    return value === null ? null : Number(value) !== 0;
  }
  return next();
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'steam_store',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
  charset: 'utf8mb4',
  decimalNumbers: true,
  typeCast,
});

/**
 * Chạy fn(conn) trong một transaction: BLL quản lý (mở, commit, rollback),
 * DAL thực thi SQL trên cùng kết nối conn.
 */
async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { pool, withTransaction, typeCast };
