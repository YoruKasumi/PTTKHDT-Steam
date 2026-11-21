'use strict';
const BaseDAO = require('./BaseDAO');
// DAO bổ sung cho UC21 (hoàn tiền). Mọi hàm nhận (params, conn) và LUÔN chạy trong transaction do Service mở,
// nên không phụ thuộc BaseDAO. Tên hàm lấy theo sơ đồ sequence (kiemTraTokenBanQuyen, thuHoiBanQuyenGame...).

class RefundDAO extends BaseDAO {
  /** Khóa đơn của khách; trả thêm số giây kể từ lúc mua (so sánh theo giây, không làm tròn giờ). */
  async layDonHangDeHoanTien({ orderId, customerId }, conn) {
    const [rows] = await conn.query(
      `SELECT OrderID, TotalAmount, Status, TIMESTAMPDIFF(SECOND, OrderDate, NOW()) AS SecondsSincePurchase
         FROM ORDERS WHERE OrderID = ? AND CustomerID = ? FOR UPDATE`,
      [orderId, customerId],
    );
    return rows[0] || null;
  }

  /** Bản quyền Purchase còn Active ứng với từng game của đơn; `expected` = số dòng ORDERITEM. */
  async kiemTraTokenBanQuyen({ orderId, customerId }, conn) {
    const [items] = await conn.query('SELECT GameID FROM ORDERITEM WHERE OrderID = ?', [orderId]);
    if (!items.length) return { licenseIds: [], expected: 0 };
    const [licenses] = await conn.query(
      `SELECT LicenseID FROM LICENSE
        WHERE CustomerID = ? AND Status = 'Active' AND Source = 'Purchase' AND GameID IN (?) FOR UPDATE`,
      [customerId, items.map((i) => i.GameID)],
    );
    return { licenseIds: licenses.map((l) => l.LicenseID), expected: items.length };
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

  async ghiYeuCauHoanTien({ orderId, reason, status, hours, hoursSincePurchase }, conn) {
    const recordedHours = Number.isFinite(Number(hoursSincePurchase))
      ? Number(hoursSincePurchase)
      : Number(hours);
    await conn.query(
      'INSERT INTO REFUNDREQUEST (OrderID, Reason, Status, HoursSincePurchase) VALUES (?, ?, ?, ?)',
      [orderId, reason, status, recordedHours],
    );
  }

  /** Thu hồi bản quyền + vô hiệu hóa thiết bị gắn với bản quyền đó. */
  async thuHoiBanQuyenGame({ licenseIds }, conn) {
    await conn.query(`UPDATE LICENSE SET Status = 'Revoked', RevokedAt = NOW() WHERE LicenseID IN (?)`, [licenseIds]);
    await conn.query(`UPDATE LICENSE_DEVICE SET Status = 'Revoked' WHERE LicenseID IN (?)`, [licenseIds]);
  }

  async capNhatDonDaHoan({ orderId }, conn) {
    await conn.query(`UPDATE ORDERS SET Status = 'Refunded' WHERE OrderID = ?`, [orderId]);
  }
}

module.exports = RefundDAO;