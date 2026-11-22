'use strict';

const SystemConfigDAO = require('../dao/SystemConfigDAO');
const { NghiepVuException } = require('../exceptions');

async function getPlatformCommissionRate(systemConfigDAO = new SystemConfigDAO()) {
  const parameters = await systemConfigDAO.truyVanThamSoToanCuc();
  const parameter = parameters.find((item) => item.ParamKey === 'PLATFORM_COMMISSION_PERCENT');
  const rawPercent = parameter?.ParamValue;
  const percent = typeof rawPercent === 'string' && rawPercent.trim()
    ? Number(rawPercent)
    : Number.NaN;
  if (!Number.isFinite(percent) || percent < 0 || percent > 50) {
    throw new NghiepVuException('Tỷ lệ hoa hồng sàn chưa được cấu hình hợp lệ');
  }
  return percent / 100;
}

module.exports = { getPlatformCommissionRate };
