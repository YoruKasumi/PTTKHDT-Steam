'use strict';
const BaseDAO = require('./BaseDAO');
const { NotImplementedException } = require('../exceptions');

class BannerDAO extends BaseDAO {
  /**
   * UC49. Cấu hình banner trang chủ (#8)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async luuCauHinhBannerVaLichHienThi(params = {}, conn = null) {
    throw new NotImplementedException('BannerDAO.luuCauHinhBannerVaLichHienThi');
  }
}

module.exports = BannerDAO;
