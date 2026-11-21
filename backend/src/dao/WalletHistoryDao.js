'use strict';
// DAO bổ sung cho Ví (UC12-14, UC20, UC21). Mọi hàm nhận (params, conn); không phụ thuộc BaseDAO.

const TYPES = ['Deposit', 'Withdraw', 'Purchase', 'Refund', 'Fee'];
const escLike = (s) => String(s).replace(/[\\%_]/g, '\\$&');

class WalletHistoryDAO {
  /** Lấy ví (tạo nếu chưa có). lock=true => FOR UPDATE. Trả null nếu tài khoản không phải khách hàng. */
  async layVi({ customerId, lock = false }, conn) {
    await conn.query('INSERT IGNORE INTO WALLET (CustomerID) VALUES (?)', [customerId]);
    const [rows] = await conn.query(
      `SELECT WalletID, Balance, Currency FROM WALLET WHERE CustomerID = ?${lock ? ' FOR UPDATE' : ''}`, [customerId]);
    return rows[0] || null;
  }

  async congTien({ walletId, amount }, conn) {
    const [r] = await conn.query('UPDATE WALLET SET Balance = Balance + ? WHERE WalletID = ?', [amount, walletId]);
    return r.affectedRows;
  }

  /** Trừ có điều kiện Balance >= amount; trả số dòng bị ảnh hưởng (0 = không đủ). */
  async truTien({ walletId, amount }, conn) {
    const [r] = await conn.query(
      'UPDATE WALLET SET Balance = Balance - ? WHERE WalletID = ? AND Balance >= ?', [amount, walletId, amount]);
    return r.affectedRows;
  }

  /** Amount phải > 0 (CHECK). Đơn 0đ KHÔNG gọi hàm này. */
  async luuGiaoDich({ transactionId, walletId, orderId = null, type, amount, status = 'Success' }, conn) {
    await conn.query(
      'INSERT INTO `TRANSACTION` (TransID, WalletID, OrderID, Type, Amount, Status) VALUES (?, ?, ?, ?, ?, ?)',
      [transactionId, walletId, orderId, type, amount, status],
    );
  }

  async layThamSoSo({ key, defaultValue }, conn) {
    try {
      const [rows] = await conn.query('SELECT ParamValue FROM SYSTEM_PARAMETER WHERE ParamKey = ?', [key]);
      const n = rows[0] ? Number(rows[0].ParamValue) : NaN;
      return Number.isFinite(n) ? n : defaultValue;
    } catch (_) { return defaultValue; }
  }

  async layDanhSachGiaoDich({ customerId, type, from, to, keyword, page, limit }, conn) {
    const where = ['w.CustomerID = ?'];
    const args = [customerId];
    if (type && TYPES.includes(type)) { where.push('t.Type = ?'); args.push(type); }
    if (from) { where.push('t.TransDate >= ?'); args.push(from); }
    if (to) { where.push('t.TransDate < DATE_ADD(?, INTERVAL 1 DAY)'); args.push(to); }
    if (keyword) {
      where.push(`EXISTS (SELECT 1 FROM ORDERITEM oi JOIN GAME g ON g.GameID = oi.GameID
                           WHERE oi.OrderID = t.OrderID AND g.Title LIKE ?)`);
      args.push(`%${escLike(keyword)}%`);
    }
    const [rows] = await conn.query(
      `SELECT t.TransID, t.OrderID, t.Type, t.Amount, t.TransDate, t.Status,
              (SELECT GROUP_CONCAT(g.Title SEPARATOR ', ') FROM ORDERITEM oi
                 JOIN GAME g ON g.GameID = oi.GameID WHERE oi.OrderID = t.OrderID) AS ProductNames
         FROM \`TRANSACTION\` t JOIN WALLET w ON w.WalletID = t.WalletID
        WHERE ${where.join(' AND ')} ORDER BY t.TransDate DESC LIMIT ? OFFSET ?`,
      [...args, limit, (page - 1) * limit],
    );
    return rows;
  }

  async layChiTietGiaoDich({ customerId, transactionId }, conn) {
    const [rows] = await conn.query(
      `SELECT t.TransID, t.OrderID, t.Type, t.Amount, t.TransDate, t.Status,
              (SELECT GROUP_CONCAT(g.Title SEPARATOR ', ') FROM ORDERITEM oi
                 JOIN GAME g ON g.GameID = oi.GameID WHERE oi.OrderID = t.OrderID) AS ProductNames
         FROM \`TRANSACTION\` t JOIN WALLET w ON w.WalletID = t.WalletID
        WHERE t.TransID = ? AND w.CustomerID = ?`, [transactionId, customerId]);
    return rows[0] || null;
  }
}

module.exports = WalletHistoryDAO;