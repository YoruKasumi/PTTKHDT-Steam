'use strict';

const revokedJtis = new Map(); // jti -> expiresAtMs

/**
 * Đưa jti vào danh sách thu hồi.
 * @param {string} jti
 * @param {number} [expTimestampSec] thời điểm hết hạn của JWT (tính bằng giây)
 */
function revokeToken(jti, expTimestampSec) {
  if (!jti) return;
  // Mặc định lưu 2 giờ nếu không có exp
  const expiresAtMs = typeof expTimestampSec === 'number' && expTimestampSec > 0
    ? expTimestampSec * 1000
    : Date.now() + 2 * 60 * 60 * 1000;

  revokedJtis.set(jti, expiresAtMs);
}

/**
 * Kiểm tra xem jti có nằm trong danh sách đã thu hồi hay không.
 * @param {string} jti
 * @returns {boolean}
 */
function isTokenRevoked(jti) {
  if (!jti) return false;
  const expiresAtMs = revokedJtis.get(jti);
  if (!expiresAtMs) return false;

  if (Date.now() > expiresAtMs) {
    revokedJtis.delete(jti);
    return false;
  }
  return true;
}

// Dọn dẹp định kỳ các token hết hạn
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [jti, expiresAtMs] of revokedJtis.entries()) {
    if (now > expiresAtMs) {
      revokedJtis.delete(jti);
    }
  }
}, 60000).unref();

module.exports = {
  revokeToken,
  isTokenRevoked,
  clearAllRevoked: () => revokedJtis.clear(),
};
