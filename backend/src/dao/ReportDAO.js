'use strict';
const BaseDAO = require('./BaseDAO');

class ReportDAO extends BaseDAO {
  async truyVanGiaoDichThanhCong(params = {}, conn = null) {
    let filterDate = '';
    const queryParams = [params.developerId];

    if (params.fromDate) {
      filterDate += ' AND o.OrderDate >= ?';
      queryParams.push(params.fromDate);
    }
    if (params.toDate) {
      filterDate += ' AND o.OrderDate <= ?';
      queryParams.push(params.toDate);
    }

    const sql = `
      SELECT 
        g.GameID,
        g.Title,
        g.Price,
        COUNT(oi.OrderID) AS UnitsSold,
        COALESCE(SUM(oi.PriceAfterDiscount), 0) AS GrossSales
      FROM GAME g
      LEFT JOIN ORDERITEM oi ON g.GameID = oi.GameID
      LEFT JOIN ORDERS o ON oi.OrderID = o.OrderID AND o.Status = 'Completed' ${filterDate}
      WHERE g.DeveloperID = ?
      GROUP BY g.GameID, g.Title, g.Price
    `;
    return this.query(sql, queryParams, conn);
  }

  async truyVanTongTienHoanTra(params = {}, conn = null) {
    const sql = `
      SELECT COALESCE(SUM(oi.PriceAfterDiscount), 0) AS TotalRefunds
      FROM ORDERITEM oi
      JOIN GAME g ON oi.GameID = g.GameID
      JOIN ORDERS o ON oi.OrderID = o.OrderID
      JOIN REFUNDREQUEST r ON o.OrderID = r.OrderID
      WHERE g.DeveloperID = ? AND r.Status = 'Approved'
    `;
    const row = await this.one(sql, [params.developerId], conn);
    return Number(row?.TotalRefunds || 0);
  }

  async truyVanDuLieuDoiSoatKyNay(params = {}, conn = null) {
    return this.truyVanGiaoDichThanhCong(params, conn);
  }

  async truyVanLuotWishlistVaRefund(params = {}, conn = null) {
    const sql = `
      SELECT 
        g.GameID,
        g.Title,
        (SELECT COUNT(*) FROM WISHLISTITEM w WHERE w.GameID = g.GameID) AS WishlistCount,
        (
          SELECT COUNT(r.RequestID) 
          FROM REFUNDREQUEST r 
          JOIN ORDERS o ON r.OrderID = o.OrderID 
          JOIN ORDERITEM oi ON o.OrderID = oi.OrderID 
          WHERE oi.GameID = g.GameID AND r.Status = 'Approved'
        ) AS RefundCount
      FROM GAME g
      WHERE g.DeveloperID = ?
    `;
    return this.query(sql, [params.developerId], conn);
  }

  async truyVanDuLieuTaiChinhRealTime(params = {}, conn = null) {
    const salesSql = `
      SELECT COALESCE(SUM(TotalAmount), 0) AS TotalRevenue, COUNT(*) AS TotalCompletedOrders 
      FROM ORDERS WHERE Status = 'Completed'
    `;
    const refundSql = `
      SELECT COALESCE(SUM(oi.PriceAfterDiscount), 0) AS TotalRefundAmount 
      FROM ORDERITEM oi 
      JOIN ORDERS o ON oi.OrderID = o.OrderID 
      JOIN REFUNDREQUEST r ON o.OrderID = r.OrderID 
      WHERE r.Status = 'Approved'
    `;
    const sales = await this.one(salesSql, [], conn);
    const refunds = await this.one(refundSql, [], conn);

    return {
      totalRevenue: Number(sales?.TotalRevenue || 0),
      totalCompletedOrders: Number(sales?.TotalCompletedOrders || 0),
      totalRefundAmount: Number(refunds?.TotalRefundAmount || 0)
    };
  }

  async truyVanDonHangThanhCongTheoThoiGian(params = {}, conn = null) {
    const sql = `
      SELECT DATE(OrderDate) AS OrderDate, COUNT(*) AS OrderCount, SUM(TotalAmount) AS DailyRevenue
      FROM ORDERS
      WHERE Status = 'Completed'
      GROUP BY DATE(OrderDate)
      ORDER BY OrderDate DESC
      LIMIT 30
    `;
    return this.query(sql, [], conn);
  }

  async truyVanDoanhThuDonHangVaTyLeChietKhau(params = {}, conn = null) {
    const data = await this.truyVanDuLieuTaiChinhRealTime(params, conn);
    const netSales = data.totalRevenue - data.totalRefundAmount;
    return {
      netSales,
      commissionRate: 0.3,
      platformCommission: netSales * 0.3
    };
  }

  async truyVanDuLieuTaiChinhTheoKy(params = {}, conn = null) {
    return this.truyVanDuLieuTaiChinhRealTime(params, conn);
  }

  async truyVanSoDuDoanhThuCacNhaPhatHanh(params = {}, conn = null) {
    const sql = `
      SELECT DeveloperID, SUM(Amount) AS PendingWithdrawal 
      FROM WITHDRAWALREQUEST 
      WHERE Status = 'Pending' 
      GROUP BY DeveloperID
    `;
    return this.query(sql, [], conn);
  }

  async truyVanCacDonHangHoanTienThanhCong(params = {}, conn = null) {
    const sql = `
      SELECT r.RequestID, r.OrderID, o.CustomerID, r.Reason, r.RequestDate, r.RequestDate AS ProcessedAt
      FROM REFUNDREQUEST r
      JOIN ORDERS o ON r.OrderID = o.OrderID
      WHERE r.Status = 'Approved'
      ORDER BY r.RequestDate DESC
    `;
    return this.query(sql, [], conn);
  }

  async truyVanNhatKyGiaoDichViToanSan(params = {}, conn = null) {
    return this.query('SELECT WalletID, CustomerID, Balance, Currency FROM WALLET ORDER BY Balance DESC LIMIT 50', [], conn);
  }
}

module.exports = ReportDAO;
