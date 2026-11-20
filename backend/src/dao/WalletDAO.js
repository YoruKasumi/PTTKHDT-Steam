'use strict';
const BaseDAO = require('./BaseDAO');
const { NotImplementedException } = require('../exceptions');

class WalletDAO extends BaseDAO {
  /**
   * UC12. Xem số dư ví (#5)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanSoDuVi(params = {}, conn = null) {
    throw new NotImplementedException('WalletDAO.truyVanSoDuVi');
  }

  /**
   * UC13. Nạp tiền vào ví (#5)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async congTienVaoVi(params = {}, conn = null) {
    throw new NotImplementedException('WalletDAO.congTienVaoVi');
  }

  /**
   * UC13. Nạp tiền vào ví (#7)
   * UC14. Rút tiền (#11)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async luuLichSuGiaoDich(params = {}, conn = null) {
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

  /**
   * UC14. Rút tiền (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanSoDuKhaDung(params = {}, conn = null) {
    return this.one(
      `SELECT WalletID, CustomerID, Balance
       FROM WALLET
       WHERE CustomerID = ?
       FOR UPDATE`,
      [params.accountId],
      conn,
    );
  }

  /**
   * UC14. Rút tiền (#9)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truTienTrongVi(params = {}, conn = null) {
    throw new NotImplementedException('WalletDAO.truTienTrongVi');
  }

  /**
   * UC15. Thanh toán (#9)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanSoDu(params = {}, conn = null) {
    throw new NotImplementedException('WalletDAO.truyVanSoDu');
  }

  /**
   * UC15. Thanh toán (#17)
   * UC21. Yêu cầu hoàn tiền (#10)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
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
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async layDanhSachGiaoDich(params = {}, conn = null) {
    throw new NotImplementedException('WalletDAO.layDanhSachGiaoDich');
  }

  /**
   * UC20. Xem lịch sử giao dịch (#9)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async layChiTietGiaoDich(params = {}, conn = null) {
    throw new NotImplementedException('WalletDAO.layChiTietGiaoDich');
  }

  /**
   * UC20. Xem lịch sử giao dịch (#15)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async timGiaoDichTheoTenSanPham(params = {}, conn = null) {
    throw new NotImplementedException('WalletDAO.timGiaoDichTheoTenSanPham');
  }

  /**
   * UC20. Xem lịch sử giao dịch (#17)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async timGiaoDichTheoNgay(params = {}, conn = null) {
    throw new NotImplementedException('WalletDAO.timGiaoDichTheoNgay');
  }
}

module.exports = WalletDAO;
