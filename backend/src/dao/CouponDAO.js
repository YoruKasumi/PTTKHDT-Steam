'use strict';

const BaseDAO = require('./BaseDAO');

class CouponDAO extends BaseDAO {
  async listCoupons() {
    return this.query(
      `SELECT CouponID, Code, DiscountValue, ExpiryDate, UsageLimit, UsedCount
         FROM COUPON
        ORDER BY ExpiryDate DESC, Code`,
    );
  }

  async findByCode(code) {
    return this.one('SELECT CouponID FROM COUPON WHERE Code = ? LIMIT 1', [code]);
  }

  async createCoupon(params) {
    await this.query(
      `INSERT INTO COUPON (CouponID, Code, DiscountValue, ExpiryDate, UsageLimit, UsedCount, DeveloperID, GameID)
       VALUES (?, ?, ?, ?, ?, 0, NULL, NULL)`,
      [params.couponId, params.code, params.discountValue, params.expiryDate, params.usageLimit],
    );
    return this.one(
      `SELECT CouponID, Code, DiscountValue, ExpiryDate, UsageLimit, UsedCount
         FROM COUPON WHERE CouponID = ?`,
      [params.couponId],
    );
  }
}

module.exports = CouponDAO;
