const { pool } = require('../config/database');

/**
 * Tầng Data Access: chỉ chứa SQL, không chứa quy tắc nghiệp vụ.
 * Mọi hàm nhận `conn` tùy chọn để chạy trong transaction do Service quản lý.
 */
class BaseDAO {
  constructor() {
    this.pool = pool;
  }

  async query(sql, params = [], conn = null) {
    const [rows] = await (conn || this.pool).query(sql, params);
    return rows;
  }

  async one(sql, params = [], conn = null) {
    const rows = await this.query(sql, params, conn);
    return rows[0] || null;
  }
}

module.exports = BaseDAO;
