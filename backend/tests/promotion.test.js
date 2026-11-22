'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const PromotionService = require('../src/services/PromotionService');

test('sale discount validation accepts free sales up to 100 percent', () => {
  const service = new PromotionService();

  assert.equal(service.kiemTraPhanTramGiaSale({ percentOff: 100 }), 100);
  assert.throws(() => service.kiemTraPhanTramGiaSale({ percentOff: 101 }), { status: 422 });
});
