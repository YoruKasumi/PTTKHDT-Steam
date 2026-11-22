'use strict';
const BaseDAO = require('./BaseDAO');
// DAO bổ sung cho UC21 (hoàn tiền); write operations receive the caller's transaction connection.

class RefundDAO extends BaseDAO {
  /** Khóa đơn của khách; trả thêm số giây kể từ lúc mua (so sánh theo giây, không làm tròn giờ). */
  async layDonHangDeHoanTien({ orderId, customerId }, conn) {
    return this.one(
      `SELECT OrderID, TotalAmount, Status, TIMESTAMPDIFF(SECOND, OrderDate, NOW()) AS SecondsSincePurchase
         FROM ORDERS WHERE OrderID = ? AND CustomerID = ? FOR UPDATE`,
      [orderId, customerId],
      conn,
    );
  }

  /** Lấy các bản quyền của game đã chọn để xác nhận trạng thái và khóa các dòng trong transaction. */
  async layBanQuyenGame({ customerId, gameIds }, conn) {
    if (!Array.isArray(gameIds) || gameIds.length === 0) return [];
    const placeholders = gameIds.map(() => '?').join(', ');
    return this.query(
      `SELECT LicenseID, GameID, Source, Status, RevokedReason, PurchaseDate
         FROM LICENSE
        WHERE CustomerID = ? AND GameID IN (${placeholders})
        ORDER BY PurchaseDate DESC
        FOR UPDATE`,
      [customerId, ...gameIds],
      conn,
    );
  }

  /** Lấy các game đã được hoàn tiền trước đó trong đơn. */
  async layGameDaHoanTien({ orderId, gameIds }, conn) {
    if (!Array.isArray(gameIds) || gameIds.length === 0) return [];
    const placeholders = gameIds.map(() => '?').join(', ');
    return this.query(
      `SELECT DISTINCT GameID
         FROM REFUNDREQUEST
        WHERE OrderID = ? AND Status = 'Approved' AND GameID IN (${placeholders})`,
      [orderId, ...gameIds],
      conn,
    );
  }

  async layHanMucHoanTien(conn) {
    try {
      const row = await this.one(
        `SELECT ParamValue FROM SYSTEM_PARAMETER WHERE ParamKey = 'REFUND_WINDOW_HOURS' LIMIT 1`,
        [],
        conn,
      );
      const n = row ? Number(row.ParamValue) : NaN;
      return Number.isFinite(n) && n > 0 ? n : 24;
    } catch (_) { return 24; }
  }

  /** Số giây từ lúc mua của nhiều đơn (để FE biết nút "Hoàn tiền" còn hiệu lực). */
  async laySoGiayTuLucMua({ orderIds }, conn) {
    if (!orderIds.length) return new Map();
    const [rows] = await conn.query(
      'SELECT OrderID, TIMESTAMPDIFF(SECOND, OrderDate, NOW()) AS Secs FROM ORDERS WHERE OrderID IN (?)', [orderIds]);
    return new Map(rows.map((r) => [r.OrderID, Number(r.Secs)]));
  }

  async ghiYeuCauHoanTien({ orderId, gameId, reason, status, hours, hoursSincePurchase }, conn) {
    const recordedHours = Number.isFinite(Number(hoursSincePurchase))
      ? Number(hoursSincePurchase)
      : Number(hours);
    await this.query(
      'INSERT INTO REFUNDREQUEST (OrderID, GameID, Reason, Status, HoursSincePurchase) VALUES (?, ?, ?, ?, ?)',
      [orderId, gameId, reason, status, Math.floor(recordedHours)],
      conn,
    );
  }

  /** Thu hồi bản quyền + vô hiệu hóa thiết bị gắn với bản quyền đó. */
  async thuHoiBanQuyenGame({ licenseIds }, conn) {
    if (!Array.isArray(licenseIds) || licenseIds.length === 0) return;
    const placeholders = licenseIds.map(() => '?').join(', ');
    await this.query(
      `UPDATE LICENSE
          SET Status = 'Revoked', RevokedAt = NOW(), RevokedReason = 'Refund'
        WHERE LicenseID IN (${placeholders}) AND Status = 'Active'`,
      licenseIds,
      conn,
    );
    await this.query(
      `UPDATE LICENSE_DEVICE
          SET Status = 'Revoked', RevokedReason = 'Refund'
        WHERE LicenseID IN (${placeholders}) AND Status = 'Active'`,
      licenseIds,
      conn,
    );
  }

  async capNhatDonDaHoan({ orderId, status }, conn) {
    await this.query(
      `UPDATE ORDERS SET Status = ? WHERE OrderID = ?`,
      [status, orderId],
      conn,
    );
  }
}

module.exports = RefundDAO;