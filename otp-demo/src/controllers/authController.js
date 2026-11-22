// src/controllers/authController.js
// Logic flow đăng ký 2 bước: register -> gửi OTP -> verify-otp -> tạo tài khoản.

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const otpStore = require('../services/otpStore');
const { sendOtpEmail } = require('../services/mailer');
const userModel = require('../models/userModel');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

// Sinh OTP 6 số ngẫu nhiên (dùng crypto của Node, không phải Math.random).
function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

// Cooldown đang hiệu lực -> trả về response 429, không gửi mail.
function cooldownResponse(res, email) {
  const retryAfterSeconds = otpStore.secondsUntilResend(email);
  return res.status(429).json({
    message: `Vui lòng chờ ${retryAfterSeconds} giây trước khi gửi lại mã OTP.`,
    retryAfterSeconds,
  });
}

/**
 * BƯỚC 1 — POST /auth/register
 * KHÔNG tạo tài khoản ngay. Validate -> hash mật khẩu -> sinh OTP ->
 * lưu dữ liệu chờ trong otpStore (RAM) -> gửi mail OTP.
 */
async function register(req, res) {
  const { email, password, fullName } = req.body || {};

  if (!EMAIL_RE.test(normalizeEmail(email))) {
    return res.status(400).json({ message: 'Email không hợp lệ.' });
  }
  if (!password || String(password).length < 6) {
    return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
  }
  if (userModel.findByEmail(email)) {
    return res.status(409).json({ message: 'Email này đã được đăng ký. Bạn có thể đăng nhập.' });
  }

  // Cooldown áp dụng cả khi người dùng submit lại form đăng ký liên tục (tránh spam mail).
  if (!otpStore.canResend(email)) {
    return cooldownResponse(res, email);
  }

  // Hash mật khẩu NGAY TỪ ĐẦU: dữ liệu chờ xác thực không chứa mật khẩu thô.
  const passwordHash = await bcrypt.hash(String(password), 10);
  const otp = generateOtp();

  otpStore.save(email, otp, {
    email: normalizeEmail(email),
    passwordHash,
    fullName: String(fullName || '').trim(),
  });

  try {
    await sendOtpEmail(email, otp);
  } catch (err) {
    console.error('[auth] Gửi mail thất bại:', err.message);
    return res.status(502).json({
      message: 'Không gửi được email. Kiểm tra MailDev đã chạy chưa (npm run maildev) và cấu hình SMTP trong .env.',
    });
  }

  return res.status(202).json({
    message: 'Đã gửi mã OTP tới email của bạn. Vui lòng kiểm tra hộp thư (mã hiệu lực 5 phút).',
    email: normalizeEmail(email),
  });
}

/**
 * BƯỚC 2 — POST /auth/verify-otp
 * So OTP với hash đã lưu. Đúng -> tạo tài khoản từ dữ liệu chờ; sai -> đếm lần thử.
 */
async function verifyOtp(req, res) {
  const { email, otp } = req.body || {};
  if (!email || !otp) {
    return res.status(400).json({ message: 'Thiếu email hoặc mã OTP.' });
  }

  const result = otpStore.verify(email, otp);

  if (!result.ok) {
    const errors = {
      NOT_FOUND: { code: 400, message: 'Không tìm thấy yêu cầu xác thực cho email này. Vui lòng đăng ký lại.' },
      EXPIRED: { code: 400, message: 'Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới.' },
      LOCKED: {
        code: 429,
        message: `Bạn đã nhập sai quá ${otpStore.MAX_ATTEMPTS} lần — email tạm khóa. Vui lòng bấm "Gửi lại mã" để nhận mã OTP mới.`,
      },
      WRONG: { code: 400, message: `Mã OTP không đúng. Bạn còn ${result.attemptsLeft} lần thử.` },
    };
    const e = errors[result.reason] || { code: 400, message: 'Xác thực thất bại.' };
    return res.status(e.code).json({
      message: e.message,
      reason: result.reason,
      attemptsLeft: result.attemptsLeft ?? 0,
    });
  }

  // Đúng OTP: tạo tài khoản từ dữ liệu đã chờ (passwordHash đã có sẵn, không hash lại).
  const created = userModel.create(result.pendingData);
  if (!created) {
    return res.status(409).json({ message: 'Email này đã được đăng ký. Bạn có thể đăng nhập.' });
  }

  return res.status(201).json({
    message: 'Xác thực thành công — tài khoản đã được tạo!',
    user: userModel.toPublic(created),
  });
}

/**
 * POST /auth/resend-otp
 * Gửi lại mã mới cho email đang chờ xác thực.
 * - Chỉ gửi khi hết cooldown 10 giây.
 * - Ghi đè record: mã mới, reset số lần thử và trạng thái khóa (đây chính là
 *   cách "gỡ khóa" sau khi sai quá 5 lần).
 */
async function resendOtp(req, res) {
  const email = normalizeEmail(req.body && req.body.email);
  if (!email) {
    return res.status(400).json({ message: 'Thiếu email.' });
  }
  if (userModel.findByEmail(email)) {
    return res.status(409).json({ message: 'Email này đã có tài khoản — bạn có thể đăng nhập.' });
  }

  const rec = otpStore.get(email);
  if (!rec) {
    return res.status(404).json({
      message: 'Không có yêu cầu đăng ký nào đang chờ xác thực cho email này. Vui lòng đăng ký lại.',
    });
  }

  if (!otpStore.canResend(email)) {
    return cooldownResponse(res, email);
  }

  const otp = generateOtp();
  otpStore.save(email, otp, rec.pendingData); // mã mới + reset attempts/locked + reset cooldown

  try {
    await sendOtpEmail(email, otp);
  } catch (err) {
    console.error('[auth] Gửi mail thất bại:', err.message);
    return res.status(502).json({
      message: 'Không gửi được email. Kiểm tra MailDev đã chạy chưa (npm run maildev) và cấu hình SMTP trong .env.',
    });
  }

  return res.status(200).json({ message: 'Đã gửi lại mã OTP mới. Vui lòng kiểm tra email.' });
}

module.exports = { register, verifyOtp, resendOtp };
