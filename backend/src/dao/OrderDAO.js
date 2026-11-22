'use strict';
const BaseDAO = require('./BaseDAO');

class OrderDAO extends BaseDAO {
  /**
   * UC15. Thanh toán (#5)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanMaGiamGia(params = {}, conn = null) {
    return this.one(
      `SELECT CouponID, Code, DiscountValue, ExpiryDate, UsageLimit,
              UsedCount, DeveloperID, GameID,
              (ExpiryDate > NOW()) AS IsUnexpired
       FROM COUPON
       WHERE Code = ?
       FOR UPDATE`,
      [params.code],
      conn,
    );
  }

  /**
   * UC15. Thanh toán (#22)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async xoaGioHang(params = {}, conn = null) {
    await this.query(
      `DELETE FROM CARTITEM WHERE CustomerID = ?`,
      [params.customerId],
      conn,
    );
  }

  async khoaSanPhamTrongGio(params = {}, conn = null) {
    return this.query(
      `SELECT GameID
       FROM CARTITEM
       WHERE CustomerID = ?
       FOR UPDATE`,
      [params.customerId],
      conn,
    );
  }

  async layGameDaSoHuu(params = {}, conn = null) {
    if (!Array.isArray(params.gameIds) || params.gameIds.length === 0) return [];
    const placeholders = params.gameIds.map(() => '?').join(', ');
    return this.query(
      `SELECT GameID
       FROM LICENSE
       WHERE CustomerID = ? AND Status = 'Active' AND GameID IN (${placeholders})
       FOR UPDATE`,
      [params.customerId, ...params.gameIds],
      conn,
    );
  }

  async taoDonHang(params = {}, conn = null) {
    await this.query(
      `INSERT INTO ORDERS (OrderID, CustomerID, CouponID, TotalAmount, Status)
       VALUES (?, ?, ?, ?, 'Completed')`,
      [params.orderId, params.customerId, params.couponId || null, params.totalAmount],
      conn,
    );
  }

  async taoChiTietDonHang(params = {}, conn = null) {
    await this.query(
      `INSERT INTO ORDERITEM (OrderID, GameID, UnitPrice, PriceAfterDiscount)
       VALUES (?, ?, ?, ?)`,
      [params.orderId, params.gameId, params.unitPrice, params.priceAfterDiscount],
      conn,
    );
  }

  async capNhatSoLanSuDungCoupon(params = {}, conn = null) {
    const result = await this.query(
      `UPDATE COUPON
       SET UsedCount = UsedCount + 1
       WHERE CouponID = ? AND UsedCount < UsageLimit AND ExpiryDate > NOW()`,
      [params.couponId],
      conn,
    );
    return result.affectedRows === 1;
  }

  async capPhatLicense(params = {}, conn = null) {
    await this.query(
      `INSERT INTO LICENSE (LicenseID, CustomerID, GameID, Source, AccessToken, Status)
       VALUES (?, ?, ?, 'Purchase', ?, 'Active')`,
      [params.licenseId, params.customerId, params.gameId, params.accessTokenHash],
      conn,
    );
  }

  async xoaGameDaMuaKhoiWishlist(params = {}, conn = null) {
    if (!Array.isArray(params.gameIds) || params.gameIds.length === 0) return;
    const placeholders = params.gameIds.map(() => '?').join(', ');
    await this.query(
      `DELETE FROM WISHLISTITEM
       WHERE CustomerID = ? AND GameID IN (${placeholders})`,
      [params.customerId, ...params.gameIds],
      conn,
    );
  }

  async layDanhSachDonHang(params = {}, conn = null) {
    return this.query(
      `SELECT orders.OrderID, orders.OrderDate, orders.TotalAmount, orders.Status,
              TIMESTAMPDIFF(HOUR, orders.OrderDate, NOW()) AS HoursSincePurchase,
              item.GameID, game.Title, game.CoverImage,
              item.UnitPrice, item.PriceAfterDiscount,
              license.Status AS LicenseStatus,
              license.RevokedReason,
              (orders.Status = 'Refunded' OR EXISTS (
                SELECT 1
                  FROM REFUNDREQUEST refund
                 WHERE refund.OrderID = orders.OrderID
                   AND refund.GameID = item.GameID
                   AND refund.Status = 'Approved'
              )) AS IsGameRefunded
       FROM ORDERS AS orders
       LEFT JOIN ORDERITEM AS item ON item.OrderID = orders.OrderID
       LEFT JOIN GAME AS game ON game.GameID = item.GameID
       LEFT JOIN LICENSE AS license ON license.LicenseID = (
         SELECT candidate.LicenseID
           FROM LICENSE AS candidate
          WHERE candidate.CustomerID = orders.CustomerID
            AND candidate.GameID = item.GameID
            AND candidate.Source = 'Purchase'
          ORDER BY candidate.PurchaseDate DESC
          LIMIT 1
       )
       WHERE orders.CustomerID = ?
       ORDER BY orders.OrderDate DESC, orders.OrderID DESC, game.Title`,
      [params.customerId],
      conn,
    );
  }

  /**
   * UC21. Yêu cầu hoàn tiền (#3)
   * Kiểm tra thông tin đơn hàng và bản quyền Active của các game trong đơn.
   * @param {{ orderId: string, customerId: string }} params
   * @param {object} [conn]
   */
  async layDonHangDeHoanTien(params = {}, conn = null) {
    return this.one(
      `SELECT OrderID, CustomerID, TotalAmount, Status, OrderDate,
              TIMESTAMPDIFF(HOUR, OrderDate, NOW()) AS HoursSincePurchase,
              TIMESTAMPDIFF(SECOND, OrderDate, NOW()) AS SecondsSincePurchase
       FROM ORDERS
       WHERE OrderID = ? AND CustomerID = ?
       FOR UPDATE`,
      [params.orderId, params.customerId],
      conn,
    );
  }

  /**
   * Lấy danh sách GameID trong đơn hàng.
   * @param {{ orderId: string }} params
   * @param {object} [conn]
   */
  async layItemsDonHang(params = {}, conn = null) {
    return this.query(
      `SELECT item.GameID, game.Title, item.PriceAfterDiscount
         FROM ORDERITEM AS item
         INNER JOIN GAME AS game ON game.GameID = item.GameID
        WHERE item.OrderID = ?
        FOR UPDATE`,
      [params.orderId],
      conn,
    );
  }

  /**
   * UC21. Yêu cầu hoàn tiền (#3)
   * Lấy danh sách License Active của các game trong đơn hàng.
   * @param {{ customerId: string, gameIds: string[] }} params
   * @param {object} [conn]
   */
  async kiemTraTokenBanQuyen(params = {}, conn = null) {
    if (!Array.isArray(params.gameIds) || params.gameIds.length === 0) return [];
    const placeholders = params.gameIds.map(() => '?').join(', ');
    return this.query(
      `SELECT LicenseID, GameID, Status
       FROM LICENSE
       WHERE CustomerID = ? AND Status = 'Active' AND Source = 'Purchase' AND GameID IN (${placeholders})
       FOR UPDATE`,
      [params.customerId, ...params.gameIds],
      conn,
    );
  }

  /**
   * UC21. Yêu cầu hoàn tiền (#5)
   * @param {{ orderId: string }} params
   * @param {object} [conn]
   */
  async kiemTraThoiGianThanhToanDuoi24h(params = {}, conn = null) {
    const row = await this.one(
      `SELECT (TIMESTAMPDIFF(HOUR, OrderDate, NOW()) <= 24) AS IsWithin24h,
              TIMESTAMPDIFF(HOUR, OrderDate, NOW()) AS HoursSincePurchase
       FROM ORDERS
       WHERE OrderID = ?`,
      [params.orderId],
      conn,
    );
    return row ? Boolean(row.IsWithin24h) : false;
  }

  /**
   * Ghi nhận yêu cầu hoàn tiền vào bảng REFUNDREQUEST.
   * @param {{ orderId: string, reason: string, status: 'Pending'|'Approved'|'Rejected', hoursSincePurchase: number }} params
   * @param {object} [conn]
   */
  async ghiYeuCauHoanTien(params = {}, conn = null) {
    await this.query(
      `INSERT INTO REFUNDREQUEST (OrderID, GameID, Reason, Status, HoursSincePurchase)
       VALUES (?, ?, ?, ?, ?)`,
      [params.orderId, params.gameId, params.reason, params.status, params.hoursSincePurchase],
      conn,
    );
  }

  /**
   * UC21. Yêu cầu hoàn tiền (#7)
   * Thu hồi bản quyền game (LICENSE).
   * @param {{ licenseIds: string[] }} params
   * @param {object} [conn]
   */
  async thuHoiBanQuyenGame(params = {}, conn = null) {
    if (!Array.isArray(params.licenseIds) || params.licenseIds.length === 0) return;
    const placeholders = params.licenseIds.map(() => '?').join(', ');
    await this.query(
      `UPDATE LICENSE
          SET Status = 'Revoked', RevokedAt = NOW(), RevokedReason = 'Refund'
        WHERE LicenseID IN (${placeholders}) AND Status = 'Active'`,
      params.licenseIds,
      conn,
    );
  }

  /**
   * Cập nhật trạng thái đơn hàng sau khi hoàn tiền.
   * @param {{ orderId: string, status?: 'PartiallyRefunded'|'Refunded' }} params
   * @param {object} [conn]
   */
  async capNhatDonDaHoan(params = {}, conn = null) {
    await this.query(
      `UPDATE ORDERS SET Status = ? WHERE OrderID = ?`,
      [params.status || 'Refunded', params.orderId],
      conn,
    );
  }
}

module.exports = OrderDAO;
