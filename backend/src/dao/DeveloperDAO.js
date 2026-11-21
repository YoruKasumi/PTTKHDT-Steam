'use strict';
const BaseDAO = require('./BaseDAO');

class DeveloperDAO extends BaseDAO {

  async kiemTraThongTinPhapNhan(params = {}, conn = null) {
    const sql = `
      SELECT AccountID, CompanyName, VerifyStatus, FeePaid 
      FROM DEVELOPER 
      WHERE AccountID = ? OR LOWER(CompanyName) = LOWER(?)
      LIMIT 1
    `;
    return this.one(sql, [params.accountId, params.companyName], conn);
  }

  async laySoDuVi(accountId, conn = null) {
    const sql = `
      SELECT WalletID, CustomerID, Balance, Currency 
      FROM WALLET 
      WHERE CustomerID = ?
      LIMIT 1
    `;
    return this.one(sql, [accountId], conn);
  }


  async truTienVi({ customerId, amount }, conn = null) {
    const sql = `
      UPDATE WALLET 
      SET Balance = Balance - ? 
      WHERE CustomerID = ? AND Balance >= ?
    `;
    const result = await this.query(sql, [amount, customerId, amount], conn);
    return result.affectedRows > 0;
  }


  async capNhatVaiTroTaiKhoan(params = {}, conn = null) {
    const sql = `
      INSERT INTO DEVELOPER (AccountID, CompanyName, BankAccount, FeePaid, VerifyStatus)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        CompanyName = VALUES(CompanyName),
        BankAccount = VALUES(BankAccount),
        FeePaid = VALUES(FeePaid),
        VerifyStatus = VALUES(VerifyStatus)
    `;
    await this.query(sql, [
      params.accountId,
      params.companyName,
      params.bankAccount,
      params.feePaid !== undefined ? params.feePaid : 1,
      params.verifyStatus || 'Verified'
    ], conn);

    return this.layDeveloperTheoAccountId(params.accountId, conn);
  }


  async layDeveloperTheoAccountId(accountId, conn = null) {
    const sql = `
      SELECT d.AccountID, d.CompanyName, d.BankAccount, d.FeePaid, d.VerifyStatus,
             a.Username, a.Email, a.DisplayName, a.Status AS AccountStatus
      FROM DEVELOPER d
      JOIN ACCOUNT a ON d.AccountID = a.AccountID
      WHERE d.AccountID = ?
      LIMIT 1
    `;
    return this.one(sql, [accountId], conn);
  }
}

module.exports = DeveloperDAO;
