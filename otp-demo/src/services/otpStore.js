// src/services/otpStore.js
// Lưu yêu cầu đăng ký đang chờ xác thực OTP trong RAM (Map) — KHÔNG dùng DB cho OTP.
//
// Các yêu cầu bảo mật đã cài đặt:
//  - OTP chỉ được lưu dưới dạng hash SHA-256 (hoặc HMAC-SHA256 nếu đặt OTP_SECRET), không lưu plain.
//  - OTP có thời hạn 5 phút (TTL), dùng đúng 1 lần rồi bị xóa.
//  - Sai OTP quá 5 lần -> khóa email đó, buộc phải yêu cầu gửi lại mã mới.
//  - Cooldown 10 giây giữa 2 lần gửi mail (resendAfter lưu ngay trong record).
//  - So sánh hash bằng crypto.timingSafeEqual để chống timing attack.

const crypto = require('crypto');

const TTL_MS = 5 * 60 * 1000;          // OTP có hiệu lực 5 phút
const RESEND_COOLDOWN_MS = 10 * 1000;  // phải chờ 10 giây giữa 2 lần gửi
const MAX_ATTEMPTS = 5;                // sai 5 lần -> khóa email

const store = new Map(); // key: email -> record

// Băm OTP. Nếu cấu hình OTP_SECRET thì dùng HMAC (an toàn hơn), không thì SHA-256 thuần.
function hashOtp(otp) {
  if (process.env.OTP_SECRET) {
    return crypto.createHmac('sha256', process.env.OTP_SECRET).update(otp).digest('hex');
  }
  return crypto.createHash('sha256').update(otp).digest('hex');
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

// Ghi đè record của email: mã mới, reset số lần thử và trạng thái khóa.
// pendingData là dữ liệu đăng ký chờ verify (đã hash password, KHÔNG chứa mật khẩu thô).
function save(email, otp, pendingData) {
  const now = Date.now();
  store.set(normalizeEmail(email), {
    otpHash: hashOtp(otp),
    pendingData,
    createdAt: now,
    expiresAt: now + TTL_MS,
    resendAfter: now + RESEND_COOLDOWN_MS,
    attempts: 0,
    locked: false,
  });
}

// Lấy record (nếu đã hết hạn thì tự xóa và trả null).
function get(email) {
  const key = normalizeEmail(email);
  const rec = store.get(key);
  if (!rec) return null;
  if (Date.now() > rec.expiresAt) {
    store.delete(key);
    return null;
  }
  return rec;
}

// Cooldown 10 giây: cho phép gửi lại chỉ khi đã qua mốc resendAfter của lần gửi trước.
function canResend(email) {
  const rec = get(email);
  return !rec || Date.now() >= rec.resendAfter;
}

function secondsUntilResend(email) {
  const rec = get(email);
  if (!rec) return 0;
  return Math.max(0, Math.ceil((rec.resendAfter - Date.now()) / 1000));
}

// Kiểm tra OTP người dùng nhập vào.
// Kết quả: { ok: true, pendingData } hoặc { ok: false, reason, attemptsLeft }
// reason: NOT_FOUND | EXPIRED | LOCKED | WRONG
function verify(email, otp) {
  const key = normalizeEmail(email);
  const rec = store.get(key);
  if (!rec) return { ok: false, reason: 'NOT_FOUND' };

  if (Date.now() > rec.expiresAt) {
    store.delete(key);
    return { ok: false, reason: 'EXPIRED' };
  }

  if (rec.locked || rec.attempts >= MAX_ATTEMPTS) {
    rec.locked = true;
    return { ok: false, reason: 'LOCKED', attemptsLeft: 0 };
  }

  rec.attempts += 1;
  const given = Buffer.from(hashOtp(String(otp || '').trim()));
  const saved = Buffer.from(rec.otpHash);
  const matched = crypto.timingSafeEqual(given, saved); // 2 buffer đều 32 byte sha256

  if (!matched) {
    if (rec.attempts >= MAX_ATTEMPTS) rec.locked = true;
    return {
      ok: false,
      reason: rec.locked ? 'LOCKED' : 'WRONG',
      attemptsLeft: rec.locked ? 0 : MAX_ATTEMPTS - rec.attempts,
    };
  }

  // Đúng mã: record bị xóa ngay (dùng một lần), trả dữ liệu đăng ký chờ để tạo tài khoản.
  store.delete(key);
  return { ok: true, pendingData: rec.pendingData };
}

module.exports = {
  save,
  get,
  verify,
  canResend,
  secondsUntilResend,
  MAX_ATTEMPTS,
  RESEND_COOLDOWN_MS,
};
