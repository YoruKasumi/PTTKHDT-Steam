'use strict';
const BaseDAO = require('./BaseDAO');

class WithdrawalDAO extends BaseDAO {
  async khoaDeveloper(params = {}, conn = null) {
    return this.one(
      'SELECT AccountID, VerifyStatus, BankAccount FROM DEVELOPER WHERE AccountID = ? FOR UPDATE',
      [params.developerId],
      conn,
    );
  }

  async khoaLenhRutTien(params = {}, conn = null) {
    return this.one(
      'SELECT * FROM WITHDRAWALREQUEST WHERE RequestID = ? FOR UPDATE',
      [params.requestId],
      conn,
    );
  }

  async timViCustomer(developerId, conn = null) {
    return this.one(
      'SELECT WalletID, Balance FROM WALLET WHERE CustomerID = ? LIMIT 1',
      [developerId],
      conn,
    );
  }

  async ghiNhanGiaoDichVi(params = {}, conn = null) {
    const sql = `
      INSERT INTO \`TRANSACTION\` (TransID, WalletID, Type, Amount, Status, Detail)
      VALUES (UUID(), ?, 'Withdraw', ?, 'Success', ?)
    `;
    return this.query(sql, [params.walletId, params.amount, params.detail || 'Rút doanh thu NPH'], conn);
  }

  async kiemTraSoTienKhaDung(params = {}, conn = null) {
    const developerId = params.developerId;
    const salesSql = `
      SELECT COALESCE(SUM(oi.PriceAfterDiscount), 0) AS GrossSales
      FROM ORDERITEM oi
      JOIN GAME g ON oi.GameID = g.GameID
      JOIN ORDERS o ON oi.OrderID = o.OrderID
      WHERE g.DeveloperID = ?
        AND o.Status IN ('Completed','PartiallyRefunded','Refunded')
    `;
    const salesRow = await this.one(salesSql, [developerId], conn);
    const grossSales = Number(salesRow?.GrossSales || 0);

    const refundSql = `
      SELECT COALESCE(SUM(oi.PriceAfterDiscount), 0) AS TotalRefunds
      FROM ORDERITEM oi
      JOIN GAME g ON oi.GameID = g.GameID
      JOIN ORDERS o ON oi.OrderID = o.OrderID
      WHERE g.DeveloperID = ?
        AND EXISTS (
          SELECT 1
            FROM REFUNDREQUEST r
           WHERE r.OrderID = o.OrderID
             AND r.Status = 'Approved'
             AND (r.GameID = oi.GameID OR (r.GameID IS NULL AND o.Status = 'Refunded'))
        )
    `;
    const refundRow = await this.one(refundSql, [developerId], conn);
    const totalRefunds = Number(refundRow?.TotalRefunds || 0);

    const withdrawalSql = `
      SELECT COALESCE(SUM(Amount), 0) AS TotalWithdrawn
      FROM WITHDRAWALREQUEST
      WHERE DeveloperID = ? AND Status IN ('Pending', 'Approved')
    `;
    const withRow = await this.one(withdrawalSql, [developerId], conn);
    const totalWithdrawn = Number(withRow?.TotalWithdrawn || 0);

    const commissionRate = typeof params.commissionRate === 'number' && Number.isFinite(params.commissionRate)
      ? params.commissionRate
      : 0.3;
    const devShareRate = Math.max(0, 1 - commissionRate);
    const devShare = (grossSales - totalRefunds) * devShareRate;
    const availableRevenue = Math.max(0, devShare - totalWithdrawn);

    return {
      grossSales,
      totalRefunds,
      devShare,
      totalWithdrawn,
      availableRevenue
    };
  }

  async taoLenhRutTienVaTamGiuSoDu(params = {}, conn = null) {
    const sql = `
      INSERT INTO WITHDRAWALREQUEST (RequestID, DeveloperID, Amount, BankInfo, Status)
      VALUES (?, ?, ?, ?, 'Pending')
    `;
    await this.query(sql, [
      params.requestId,
      params.developerId,
      params.amount,
      params.bankInfo
    ], conn);
    return this.one('SELECT * FROM WITHDRAWALREQUEST WHERE RequestID = ?', [params.requestId], conn);
  }

  async truyVanChiTietLenhRutVaThongTinNganHang(params = {}, conn = null) {
    const sql = `
      SELECT w.RequestID, w.DeveloperID, w.Amount, w.BankInfo, w.Status, w.RequestDate,
             d.CompanyName, d.BankAccount, d.VerifyStatus
      FROM WITHDRAWALREQUEST w
      JOIN DEVELOPER d ON w.DeveloperID = d.AccountID
      WHERE w.RequestID = ?
      LIMIT 1
    `;
    return this.one(sql, [params.requestId], conn);
  }

  async layDanhSachLenhRutTien(params = {}, conn = null) {
    if (params.status === 'all') {
      return this.query(
        `SELECT w.RequestID, w.DeveloperID, w.Amount, w.BankInfo, w.Status, w.RequestDate,
                d.CompanyName, d.BankAccount, d.VerifyStatus
         FROM WITHDRAWALREQUEST AS w
         INNER JOIN DEVELOPER AS d ON d.AccountID = w.DeveloperID
         ORDER BY w.RequestDate DESC
         LIMIT 200`,
        [],
        conn,
      );
    }

    return this.query(
      `SELECT w.RequestID, w.DeveloperID, w.Amount, w.BankInfo, w.Status, w.RequestDate,
              d.CompanyName, d.BankAccount, d.VerifyStatus
       FROM WITHDRAWALREQUEST AS w
       INNER JOIN DEVELOPER AS d ON d.AccountID = w.DeveloperID
       WHERE w.Status = ?
       ORDER BY w.RequestDate DESC
       LIMIT 200`,
      [params.status || 'Pending'],
      conn,
    );
  }

  async hoanLaiSoDuTamGiuVaoViNPH(params = {}, conn = null) {
    const sql = `
      UPDATE WITHDRAWALREQUEST 
      SET Status = 'Rejected'
      WHERE RequestID = ? AND Status = 'Pending'
    `;
    const result = await this.query(sql, [params.requestId], conn);
    return result.affectedRows > 0;
  }

  async capNhatTrangThaiRutTienThanhCong(params = {}, conn = null) {
    const sql = `
      UPDATE WITHDRAWALREQUEST 
      SET Status = 'Approved'
      WHERE RequestID = ? AND Status = 'Pending'
    `;
    const result = await this.query(sql, [params.requestId], conn);
    return result.affectedRows > 0;
  }

  async layLichSuRutTien(developerId, conn = null) {
    const sql = `
      SELECT RequestID, Amount, BankInfo, Status, RequestDate 
      FROM WITHDRAWALREQUEST 
      WHERE DeveloperID = ? 
      ORDER BY RequestDate DESC
    `;
    return this.query(sql, [developerId], conn);
  }
}

module.exports = WithdrawalDAO;
