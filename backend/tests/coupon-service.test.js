'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const CouponService = require('../src/services/CouponService');

test('coupon creation normalizes the code and validates the inputs', async () => {
  let saved;
  const service = new CouponService({
    listCoupons: async () => [],
    findByCode: async () => null,
    createCoupon: async (coupon) => { saved = coupon; return {
      CouponID: coupon.couponId,
      Code: coupon.code,
      DiscountValue: coupon.discountValue,
      ExpiryDate: coupon.expiryDate,
      UsageLimit: coupon.usageLimit,
      UsedCount: 0,
    }; },
  });
  const expiryDate = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
  const result = await service.createCoupon({ code: ' spring-25 ', discountValue: '25000', usageLimit: '50', expiryDate });
  assert.equal(result.code, 'SPRING-25');
  assert.equal(result.discountValue, 25000);
  assert.equal(saved.usageLimit, 50);
  assert.match(saved.expiryDate, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:00$/);
});

test('coupon creation rejects expired dates, invalid codes, and duplicate codes', async () => {
  const service = new CouponService({
    findByCode: async (code) => code === 'TAKEN' ? { CouponID: 'existing' } : null,
  });
  assert.throws(() => service.normalizeExpiry('2020-01-01T00:00'), { status: 422 });
  await assert.rejects(service.createCoupon({ code: 'bad code', discountValue: 1000, usageLimit: 10, expiryDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16) }), { status: 422 });
  await assert.rejects(service.createCoupon({ code: 'TAKEN', discountValue: 1000, usageLimit: 10, expiryDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16) }), { status: 409 });
});
