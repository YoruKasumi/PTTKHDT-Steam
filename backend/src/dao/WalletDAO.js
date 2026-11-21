'use strict';
const BaseDAO = require('./BaseDAO');

const TRANSACTION_TYPES = ['Deposit', 'Withdraw', 'Purchase', 'Refund', 'Fee'];
const escLike = (s) => String(s).replace(/[\\%_]/g, '\\$&');

class WalletDAO extends BaseDAO {
  /**
   * UC12. Xem số dư ví (#5)
   * Lấy ví của khách hàng, tự động tạo ví nếu chưa có.
   * @param {{ accountId: string }} params
   * @param {object} [conn]
   */
  async truyVanSoDuVi(params = {}, conn = null) {
    await this.query(
      `INSERT IGNORE INTO WALLET (CustomerID, Balance, Currency) VALUES (?, 0, 'VND')`,
      [params.accountId],
      conn,
    );
    return this.one(
      `SELECT WalletID, CustomerID, Balance, Currency
       FROM WALLET
       WHERE CustomerID = ?`,
      [params.accountId],
      conn,
    );
  }

  /**
   * UC13. Nạp tiền vào ví (#5)
   * @param {{ walletId: string, amount: number }} params
   * @param {object} [conn]
   */
  async congTienVaoVi(params = {}, conn = null) {
    const result = await this.query(
      `UPDATE WALLET SET Balance = Balance + ? WHERE WalletID = ?`,
      [params.amount, params.walletId],
      conn,
    );
    return result.affectedRows === 1;
  }

  /**
   * UC13. Nạp tiền vào ví (#7)
   * UC14. Rút tiền (#11)
   * Lưu lịch sử giao dịch vào bảng `TRANSACTION`.
   * @param {{ transactionId: string, walletId: string, orderId?: string|null, type: string, amount: number, status?: string }} params
   * @param {object} [conn]
   */
  async luuLichSuGiaoDich(params = {}, conn = null) {
    if (params.status && params.status !== 'Success') {
      await this.query(
        `INSERT INTO \`TRANSACTION\` (TransID, WalletID, OrderID, Type, Amount, Status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          params.transactionId,
          params.walletId,
          params.orderId || null,
          params.type,
          params.amount,
          params.status,
        ],
        conn,
      );
    } else {
      await this.query(
        `INSERT INTO \`TRANSACTION\` (TransID, WalletID, OrderID, Type, Amount, Status)
         VALUES (?, ?, ?, ?, ?, 'Success')`,
        [
          params.transactionId,
          params.walletId,
          params.orderId || null,
          params.type,
          params.amount,
        ],
        conn,
      );
    }
  }

  /**
   * UC14. Rút tiền (#3)
   * Khóa ví của khách hàng để đọc số dư và kiểm tra trước khi trừ tiền.
   * @param {{ accountId: string }} params
   * @param {object} [conn]
   */
  async truyVanSoDuKhaDung(params = {}, conn = null) {
    await this.query(
      `INSERT IGNORE INTO WALLET (CustomerID, Balance, Currency) VALUES (?, 0, 'VND')`,
      [params.accountId],
      conn,
    );
    return this.one(
      `SELECT WalletID, CustomerID, Balance, Currency
       FROM WALLET
       WHERE CustomerID = ?
       FOR UPDATE`,
      [params.accountId],
      conn,
    );
  }

  /**
   * UC14. Rút tiền (#9)
   * Trừ tiền ví có điều kiện Balance >= amount.
   * @param {{ walletId: string, amount: number }} params
   * @param {object} [conn]
   */
  async truTienTrongVi(params = {}, conn = null) {
    const result = await this.query(
      `UPDATE WALLET SET Balance = Balance - ? WHERE WalletID = ? AND Balance >= ?`,
      [params.amount, params.walletId, params.amount],
      conn,
    );
    return result.affectedRows === 1;
  }

  /**
   * UC15. Thanh toán (#9)
   * @param {{ accountId: string }} params
   * @param {object} [conn]
   */
  async truyVanSoDu(params = {}, conn = null) {
    return this.truyVanSoDuVi(params, conn);
  }

  /**
   * UC15. Thanh toán (#17)
   * UC21. Yêu cầu hoàn tiền (#10)
   * Cập nhật số dư ví (debit hoặc credit).
   * @param {{ walletId: string, amount: number, operation?: 'credit'|'debit' }} params
   * @param {object} [conn]
   */
  async capNhatSoDuVi(params = {}, conn = null) {
    const operation = params.operation || 'debit';
    if (!['credit', 'debit'].includes(operation)) {
      throw new TypeError('Wallet balance operation must be credit or debit');
    }
    const balanceExpression = operation === 'credit'
      ? 'Balance + ?'
      : 'Balance - ?';
    const balanceCondition = operation === 'credit' ? '' : ' AND Balance >= ?';
    const values = operation === 'credit'
      ? [params.amount, params.walletId]
      : [params.amount, params.walletId, params.amount];
    const result = await this.query(
      `UPDATE WALLET
       SET Balance = ${balanceExpression}
       WHERE WalletID = ?${balanceCondition}`,
      values,
      conn,
    );
    return result.affectedRows === 1;
  }

  /**
   * UC20. Xem lịch sử giao dịch (#3)
   * Lấy danh sách giao dịch có hỗ trợ lọc theo loại, khoảng ngày, và tên sản phẩm.
   * @param {{ customerId: string, type?: string, from?: string, to?: string, keyword?: string, page?: number, limit?: number }} params
   * @param {object} [conn]
   */
  async layDanhSachGiaoDich(params = {}, conn = null) {
    const customerId = params.customerId;
    const where = ['w.CustomerID = ?'];
    const args = [customerId];

    if (params.type && params.type !== 'All' && TRANSACTION_TYPES.includes(params.type)) {
      where.push('t.Type = ?');
      args.push(params.type);
    }
    if (params.from) {
      where.push('t.TransDate >= ?');
      args.push(params.from);
    }
    if (params.to) {
      where.push('t.TransDate < DATE_ADD(?, INTERVAL 1 DAY)');
      args.push(params.to);
    }
    if (params.keyword) {
      where.push(`EXISTS (
        SELECT 1 FROM ORDERITEM oi
        JOIN GAME g ON g.GameID = oi.GameID
        WHERE oi.OrderID = t.OrderID AND g.Title LIKE ?
      )`);
      args.push(`%${escLike(params.keyword)}%`);
    }

    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
    const offset = (page - 1) * limit;

    const sql = `
      SELECT t.TransID, t.OrderID, t.Type, t.Amount, t.TransDate, t.Status,
             (SELECT GROUP_CONCAT(g.Title SEPARATOR ', ')
              FROM ORDERITEM oi
              JOIN GAME g ON g.GameID = oi.GameID
              WHERE oi.OrderID = t.OrderID) AS ProductNames
      FROM \`TRANSACTION\` t
      JOIN WALLET w ON w.WalletID = t.WalletID
      WHERE ${where.join(' AND ')}
      ORDER BY t.TransDate DESC
      LIMIT ? OFFSET ?
    `;

    return this.query(sql, [...args, limit, offset], conn);
  }

  /**
   * UC20. Xem lịch sử giao dịch (#9)
   * @param {{ customerId: string, transactionId: string }} params
   * @param {object} [conn]
   */
  async layChiTietGiaoDich(params = {}, conn = null) {
    return this.one(
      `SELECT t.TransID, t.OrderID, t.Type, t.Amount, t.TransDate, t.Status,
              (SELECT GROUP_CONCAT(g.Title SEPARATOR ', ')
               FROM ORDERITEM oi
               JOIN GAME g ON g.GameID = oi.GameID
               WHERE oi.OrderID = t.OrderID) AS ProductNames
       FROM \`TRANSACTION\` t
       JOIN WALLET w ON w.WalletID = t.WalletID
       WHERE t.TransID = ? AND w.CustomerID = ?`,
      [params.transactionId, params.customerId],
      conn,
    );
  }

  /**
   * UC20. Xem lịch sử giao dịch (#15)
   * @param {{ customerId: string, productName: string }} params
   * @param {object} [conn]
   */
  async timGiaoDichTheoTenSanPham(params = {}, conn = null) {
    return this.layDanhSachGiaoDich({
      customerId: params.customerId,
      keyword: params.productName,
    }, conn);
  }

  /**
   * UC20. Xem lịch sử giao dịch (#17)
   * @param {{ customerId: string, fromDate?: string, toDate?: string }} params
   * @param {object} [conn]
   */
  async timGiaoDichTheoNgay(params = {}, conn = null) {
    return this.layDanhSachGiaoDich({
      customerId: params.customerId,
      from: params.fromDate,
      to: params.toDate,
    }, conn);
  }
}

module.exports = WalletDAO;
