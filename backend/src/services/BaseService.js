const { withTransaction } = require('../config/database');

/** Tầng Business Logic: kiểm tra quy định nghiệp vụ, quản lý transaction. */
class BaseService {
  /** Chạy fn(conn) trong một transaction. */
  transaction(fn) {
    return withTransaction(fn);
  }
}

module.exports = BaseService;
