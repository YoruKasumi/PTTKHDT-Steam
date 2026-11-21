'use strict';
const BaseDAO = require('./BaseDAO');

class PromotionDAO extends BaseDAO {
  async luuLichTrinhChienDichSale(params = {}, conn = null) {
    const sql = `
      INSERT INTO SALECAMPAIGN (CampaignID, GameID, PercentOff, StartDate, EndDate)
      VALUES (?, ?, ?, ?, ?)
    `;
    await this.query(sql, [
      params.campaignId,
      params.gameId,
      params.percentOff,
      params.startDate,
      params.endDate
    ], conn);
    return this.one('SELECT * FROM SALECAMPAIGN WHERE CampaignID = ?', [params.campaignId], conn);
  }
  async kiemTraTrungLapSale(params = {}, conn = null) {
    const sql = `
      SELECT CampaignID, PercentOff, StartDate, EndDate 
      FROM SALECAMPAIGN 
      WHERE GameID = ? 
        AND (
          (? BETWEEN StartDate AND EndDate) OR
          (? BETWEEN StartDate AND EndDate) OR
          (StartDate BETWEEN ? AND ?)
        )
      LIMIT 1
    `;
    return this.one(sql, [
      params.gameId,
      params.startDate,
      params.endDate,
      params.startDate,
      params.endDate
    ], conn);
  }
  async kiemTraGameCoThuPhi(params = {}, conn = null) {
    const sql = `
      SELECT GameID, DeveloperID, Title, Price, Status 
      FROM GAME 
      WHERE GameID = ? AND DeveloperID = ?
      LIMIT 1
    `;
    return this.one(sql, [params.gameId, params.developerId], conn);
  }
  async kiemTraTongKeyChuaKichHoatDuoi2000(params = {}, conn = null) {
    const sql = `
      SELECT COUNT(*) AS TotalUnused 
      FROM ACTIVATIONKEY 
      WHERE GameID = ? AND Status = 'Unused'
    `;
    const row = await this.one(sql, [params.gameId], conn);
    return Number(row?.TotalUnused || 0);
  }

  async luuDanhSachMaKeyMoi(params = {}, conn = null) {
    const keys = Array.isArray(params) ? params : (params.keys || []);
    if (keys.length === 0) return 0;

    const sql = `
      INSERT INTO ACTIVATIONKEY (KeyID, KeyCode, GameID, Status)
      VALUES ?
    `;
    const values = keys.map(k => [k.keyId, k.keyCode, k.gameId, 'Unused']);
    const result = await this.query(sql, [values], conn);
    return result.affectedRows;
  }
}

module.exports = PromotionDAO;
