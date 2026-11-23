'use strict';

const { randomUUID } = require('node:crypto');
const BaseService = require('./BaseService');
const CouponDAO = require('../dao/CouponDAO');
const { ConflictException, ValidationException } = require('../exceptions');

class CouponService extends BaseService {
  constructor(couponDAO = new CouponDAO()) {
    super();
    this.couponDAO = couponDAO;
  }

  async listCoupons() {
    return (await this.couponDAO.listCoupons()).map((row) => this.toCoupon(row));
  }

  async createCoupon(params = {}) {
    const code = typeof params.code === 'string' ? params.code.trim().toUpperCase() : '';
    const discountValue = Number(params.discountValue);
    const usageLimit = Number(params.usageLimit);
    const expiryDate = this.normalizeExpiry(params.expiryDate);

    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
      throw new ValidationException('Mã giảm giá chỉ gồm 3–30 chữ cái, số, dấu gạch ngang hoặc gạch dưới.');
    }
    if (!Number.isFinite(discountValue) || discountValue <= 0 || discountValue > 5000000) {
      throw new ValidationException('Mức giảm phải lớn hơn 0 và không quá 5.000.000 ₫.');
    }
    if (!Number.isInteger(usageLimit) || usageLimit < 1 || usageLimit > 1000000) {
      throw new ValidationException('Số lượt sử dụng phải là số nguyên từ 1 đến 1.000.000.');
    }
    if (await this.couponDAO.findByCode(code)) {
      throw new ConflictException('Mã giảm giá này đã tồn tại.');
    }

    try {
      const row = await this.couponDAO.createCoupon({
        couponId: randomUUID(), code, discountValue, expiryDate, usageLimit,
      });
      return this.toCoupon(row);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') throw new ConflictException('Mã giảm giá này đã tồn tại.');
      throw error;
    }
  }

  normalizeExpiry(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
      throw new ValidationException('Ngày hết hạn không hợp lệ.');
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
      throw new ValidationException('Ngày hết hạn phải nằm trong tương lai.');
    }
    return `${value.replace('T', ' ')}:00`;
  }

  toCoupon(row) {
    return {
      couponId: row.CouponID,
      code: row.Code,
      discountValue: Number(row.DiscountValue),
      expiryDate: row.ExpiryDate,
      usageLimit: Number(row.UsageLimit),
      usedCount: Number(row.UsedCount),
    };
  }
}

module.exports = CouponService;
