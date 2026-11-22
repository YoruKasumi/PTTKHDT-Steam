'use strict';
const BaseDAO = require('./BaseDAO');

class ReportDAO extends BaseDAO {
  async truyVanGiaoDichThanhCong(params = {}, conn = null) {
    let filterDate = '';
    const queryParams = [];

    if (params.fromDate) {
      filterDate += ' AND o.OrderDate >= ?';
      queryParams.push(params.fromDate);
    }
    if (params.toDate) {
      filterDate += ' AND o.OrderDate <= ?';
      queryParams.push(params.toDate);
    }
    queryParams.push(params.developerId);

    const sql = `
      SELECT 
        g.GameID,
        g.Title,
        g.Price,
        COUNT(CASE WHEN o.OrderID IS NOT NULL AND NOT EXISTS (
          SELECT 1
            FROM REFUNDREQUEST refund
           WHERE refund.OrderID = o.OrderID
             AND refund.Status = 'Approved'
             AND (refund.GameID = oi.GameID OR (refund.GameID IS NULL AND o.Status = 'Refunded'))
        ) THEN oi.GameID END) AS UnitsSold,
        COALESCE(SUM(CASE WHEN o.OrderID IS NOT NULL THEN oi.PriceAfterDiscount ELSE 0 END), 0) AS GrossSales
      FROM GAME g
      LEFT JOIN ORDERITEM oi ON g.GameID = oi.GameID
      LEFT JOIN ORDERS o ON oi.OrderID = o.OrderID
        AND o.Status IN ('Completed','PartiallyRefunded','Refunded') ${filterDate}
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
        AND (r.GameID = oi.GameID OR (r.GameID IS NULL AND o.Status = 'Refunded'))
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
          SELECT COUNT(DISTINCT r.RequestID)
          FROM REFUNDREQUEST r 
          JOIN ORDERS o ON r.OrderID = o.OrderID 
          JOIN ORDERITEM oi ON o.OrderID = oi.OrderID
            AND (r.GameID = oi.GameID OR (r.GameID IS NULL AND o.Status = 'Refunded'))
          WHERE oi.GameID = g.GameID AND r.Status = 'Approved'
        ) AS RefundCount
      FROM GAME g
      WHERE g.DeveloperID = ?
    `;
    return this.query(sql, [params.developerId], conn);
  }

  async truyVanDuLieuTaiChinhRealTime(params = {}, conn = null) {
    const salesSql = `
      SELECT COALESCE(SUM(TotalAmount), 0) AS TotalRevenue,
             SUM(CASE WHEN Status IN ('Completed','PartiallyRefunded') THEN 1 ELSE 0 END) AS TotalCompletedOrders
      FROM ORDERS WHERE Status IN ('Completed','PartiallyRefunded','Refunded')
    `;
    const refundSql = `
      SELECT COALESCE(SUM(oi.PriceAfterDiscount), 0) AS TotalRefundAmount 
      FROM ORDERITEM oi 
      JOIN ORDERS o ON oi.OrderID = o.OrderID 
      JOIN REFUNDREQUEST r ON o.OrderID = r.OrderID
        AND (r.GameID = oi.GameID OR (r.GameID IS NULL AND o.Status = 'Refunded'))
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
      SELECT orders.OrderDay AS OrderDate,
             SUM(CASE WHEN orders.Status IN ('Completed','PartiallyRefunded') THEN 1 ELSE 0 END) AS OrderCount,
             SUM(orders.TotalAmount - COALESCE((
               SELECT SUM(item.PriceAfterDiscount)
                 FROM ORDERITEM item
                WHERE item.OrderID = orders.OrderID
                  AND EXISTS (
                    SELECT 1
                      FROM REFUNDREQUEST refund
                     WHERE refund.OrderID = orders.OrderID
                       AND refund.Status = 'Approved'
                       AND (refund.GameID = item.GameID OR (refund.GameID IS NULL AND orders.Status = 'Refunded'))
                  )
             ), 0)) AS DailyRevenue
      FROM (
        SELECT OrderID, DATE(OrderDate) AS OrderDay, TotalAmount, Status
          FROM ORDERS
         WHERE Status IN ('Completed','PartiallyRefunded','Refunded')
      ) AS orders
      GROUP BY orders.OrderDay
      ORDER BY orders.OrderDay DESC
      LIMIT 30
    `;
    return this.query(sql, [], conn);
  }

  async truyVanDoanhThuDonHangVaTyLeChietKhau(params = {}, conn = null) {
    const data = await this.truyVanDuLieuTaiChinhRealTime(params, conn);
    const netSales = data.totalRevenue - data.totalRefundAmount;
    return { netSales };
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
      SELECT r.RequestID, r.OrderID, r.GameID, game.Title AS GameTitle,
             o.CustomerID, r.Reason, r.RequestDate,
             COALESCE(SUM(oi.PriceAfterDiscount), 0) AS RefundAmount
      FROM REFUNDREQUEST r
      JOIN ORDERS o ON r.OrderID = o.OrderID
      JOIN ORDERITEM oi ON oi.OrderID = o.OrderID
        AND (r.GameID = oi.GameID OR (r.GameID IS NULL AND o.Status = 'Refunded'))
      LEFT JOIN GAME game ON game.GameID = r.GameID
      WHERE r.Status = 'Approved'
      GROUP BY r.RequestID, r.OrderID, r.GameID, game.Title,
               o.CustomerID, r.Reason, r.RequestDate
      ORDER BY r.RequestDate DESC
    `;
    return this.query(sql, [], conn);
  }

  async truyVanNhatKyGiaoDichViToanSan(params = {}, conn = null) {
    return this.query(
      `SELECT t.TransID, t.WalletID, w.CustomerID, t.OrderID, t.Type, t.Amount, t.TransDate, t.Status, t.Detail
       FROM \`TRANSACTION\` t
       INNER JOIN WALLET w ON w.WalletID = t.WalletID
       ORDER BY t.TransDate DESC
       LIMIT 50`,
      [],
      conn,
    );
  }

  async truyVanThongKeBienDongSoDu(params = {}, conn = null) {
    return this.one(
      `SELECT COUNT(*) AS TotalTransactions,
              SUM(CASE WHEN Status = 'Success' THEN 1 ELSE 0 END) AS SuccessfulTransactions,
              SUM(CASE WHEN Status = 'Pending' THEN 1 ELSE 0 END) AS PendingTransactions,
              SUM(CASE WHEN Status = 'Failed' THEN 1 ELSE 0 END) AS FailedTransactions,
              COALESCE(SUM(CASE WHEN Status = 'Success' AND Type IN ('Deposit', 'Refund') THEN Amount ELSE 0 END), 0) AS TotalInflows,
              COALESCE(SUM(CASE WHEN Status = 'Success' AND Type IN ('Withdraw', 'Purchase', 'Fee') THEN Amount ELSE 0 END), 0) AS TotalOutflows
       FROM \`TRANSACTION\``,
      [],
      conn,
    );
  }

  async truyVanTongSoDuViToanSan(params = {}, conn = null) {
    return this.one(
      `SELECT COUNT(*) AS TotalWalletsCount,
              COALESCE(SUM(Balance), 0) AS TotalCirculatingBalance
       FROM WALLET`,
      [],
      conn,
    );
  }
}

module.exports = ReportDAO;
