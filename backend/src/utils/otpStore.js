'use strict';
const crypto = require('crypto');
const { NghiepVuException, ValidationException } = require('../exceptions');

const OTP_TTL_MS = 5 * 60 * 1000; // 5 phút
const COOLDOWN_MS = 10 * 1000;    // 10 giây
const MAX_ATTEMPTS = 5;

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
}

function makeKey(email, purpose) {
  return `${String(email).trim().toLowerCase()}::${String(purpose || 'register').trim().toLowerCase()}`;
}

class OtpStore {
  constructor() {
    this.store = new Map();
    // Dọn dẹp định kỳ các record hết hạn
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.store.entries()) {
        if (now > record.expiresAt) {
          this.store.delete(key);
        }
      }
    }, 60000).unref();
  }

  checkCooldown(email, purpose) {
    const key = makeKey(email, purpose);
    const existing = this.store.get(key);
    if (!existing) return 0;
    const now = Date.now();
    if (existing.cooldownUntil && now < existing.cooldownUntil) {
      return Math.ceil((existing.cooldownUntil - now) / 1000);
    }
    return 0;
  }

  saveOtp(email, purpose, otp) {
    const key = makeKey(email, purpose);
    const now = Date.now();
    const hashed = hashOtp(otp);

    this.store.set(key, {
      hashed,
      attempts: 0,
      createdAt: now,
      expiresAt: now + OTP_TTL_MS,
      cooldownUntil: now + COOLDOWN_MS,
    });
  }

  verifyOtp(email, purpose, otp) {
    const key = makeKey(email, purpose);
    const record = this.store.get(key);

    if (!record) {
      throw new NghiepVuException('Mã OTP không tồn tại hoặc đã hết hạn. Vui lòng yêu cầu mã mới.', 400, 'OTP_EXPIRED');
    }

    const now = Date.now();
    if (now > record.expiresAt) {
      this.store.delete(key);
      throw new NghiepVuException('Mã OTP đã hết hiệu lực. Vui lòng yêu cầu mã mới.', 400, 'OTP_EXPIRED');
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      this.store.delete(key);
      throw new NghiepVuException('Bạn đã nhập sai mã OTP quá 5 lần. Vui lòng yêu cầu mã mới.', 400, 'OTP_MAX_ATTEMPTS');
    }

    const inputHashed = hashOtp(otp);
    if (inputHashed !== record.hashed) {
      record.attempts += 1;
      const remaining = MAX_ATTEMPTS - record.attempts;
      throw new NghiepVuException(`Mã OTP không chính xác. Bạn còn ${remaining} lần thử.`, 400, 'OTP_INVALID');
    }

    // Xác thực thành công -> xóa mã OTP để ngăn tái sử dụng
    this.store.delete(key);
    return true;
  }

  clear(email, purpose) {
    const key = makeKey(email, purpose);
    this.store.delete(key);
  }

  // Phương thức hỗ trợ cho test
  setOtpForTest(email, purpose, otp) {
    this.saveOtp(email, purpose, otp);
  }

  clearAll() {
    this.store.clear();
  }
}

const otpStore = new OtpStore();
module.exports = otpStore;
