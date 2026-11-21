'use strict';
const BaseDAO = require('./BaseDAO');
const { NotImplementedException } = require('../exceptions');

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
              item.GameID, game.Title, game.CoverImage,
              item.UnitPrice, item.PriceAfterDiscount
       FROM ORDERS AS orders
       LEFT JOIN ORDERITEM AS item ON item.OrderID = orders.OrderID
       LEFT JOIN GAME AS game ON game.GameID = item.GameID
       WHERE orders.CustomerID = ?
       ORDER BY orders.OrderDate DESC, orders.OrderID DESC, game.Title`,
      [params.customerId],
      conn,
    );
  }

  /**
   * UC21. Yêu cầu hoàn tiền (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async kiemTraTokenBanQuyen(params = {}, conn = null) {
    throw new NotImplementedException('OrderDAO.kiemTraTokenBanQuyen');
  }

  /**
   * UC21. Yêu cầu hoàn tiền (#5)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async kiemTraThoiGianThanhToanDuoi24h(params = {}, conn = null) {
    throw new NotImplementedException('OrderDAO.kiemTraThoiGianThanhToanDuoi24h');
  }

  /**
   * UC21. Yêu cầu hoàn tiền (#7)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async thuHoiBanQuyenGame(params = {}, conn = null) {
    throw new NotImplementedException('OrderDAO.thuHoiBanQuyenGame');
  }
}

module.exports = OrderDAO;
