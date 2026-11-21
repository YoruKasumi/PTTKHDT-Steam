'use strict';
const BaseService = require('./BaseService');
const ReportDAO = require('../dao/ReportDAO');
const { ValidationException } = require('../exceptions');

class ReportService extends BaseService {
  constructor(reportDAO = new ReportDAO()) {
    super();
    this.reportDAO = reportDAO;
  }


  async yeuCauBaoCaoDoanhThuRealTime(params = {}) {
    const developerId = params.user?.accountId || params.developerId;
    if (!developerId) throw new ValidationException('Thiếu định danh Nhà phát hành');

    const transactions = await this.reportDAO.truyVanGiaoDichThanhCong({
      developerId,
      fromDate: params.fromDate,
      toDate: params.toDate
    });
    const totalRefunds = await this.reportDAO.truyVanTongTienHoanTra({ developerId });

    const summary = this.tinhTongDoanhThuVaSoLuongBan({ transactions, totalRefunds });

    return {
      success: true,
      developerId,
      summary,
      games: transactions.map(t => ({
        gameId: t.GameID,
        title: t.Title,
        price: Number(t.Price),
        unitsSold: Number(t.UnitsSold || 0),
        grossRevenue: Number(t.GrossSales || 0),
        devShareEstimate: Number(t.GrossSales || 0) * 0.7
      }))
    };
  }


  async yeuCauKetXuatBangKe(params = {}) {
    const developerId = params.user?.accountId || params.developerId;
    if (!developerId) throw new ValidationException('Thiếu định danh Nhà phát hành');

    const rawData = await this.reportDAO.truyVanDuLieuDoiSoatKyNay({
      developerId,
      fromDate: params.fromDate,
      toDate: params.toDate
    });
    const totalRefunds = await this.reportDAO.truyVanTongTienHoanTra({ developerId });

    const calculated = this.tinhDoanhThuPhiSanHoanTienThucNhan({ rawData, totalRefunds });
    const statementFile = this.taoTepBangKeDoiSoat({ developerId, calculated });

    return {
      success: true,
      statement: statementFile
    };
  }


  async yeuCauThongKeTuongTac(params = {}) {
    const developerId = params.user?.accountId || params.developerId;
    if (!developerId) throw new ValidationException('Thiếu định danh Nhà phát hành');

    const stats = await this.reportDAO.truyVanLuotWishlistVaRefund({ developerId });
    return this.tinhTyLeChuyenDoiVaTyLeHoanTien({ stats });
  }


  tinhTongDoanhThuVaSoLuongBan(params = {}) {
    const { transactions = [], totalRefunds = 0 } = params;
    let totalUnitsSold = 0;
    let totalGrossRevenue = 0;

    for (const item of transactions) {
      totalUnitsSold += Number(item.UnitsSold || 0);
      totalGrossRevenue += Number(item.GrossSales || 0);
    }

    const platformFeeRate = 0.3; // Phí sàn Steam 30%
    const netRevenue = (totalGrossRevenue - totalRefunds) * (1 - platformFeeRate);

    return {
      totalUnitsSold,
      totalGrossRevenue,
      totalRefunds,
      platformFeeRate: '30%',
      platformFee: (totalGrossRevenue - totalRefunds) * platformFeeRate,
      netRevenue: Math.max(0, netRevenue)
    };
  }

  tinhDoanhThuPhiSanHoanTienThucNhan(params = {}) {
    return this.tinhTongDoanhThuVaSoLuongBan({
      transactions: params.rawData,
      totalRefunds: params.totalRefunds
    });
  }

  taoTepBangKeDoiSoat(params = {}) {
    return {
      statementId: 'STM_' + Date.now(),
      developerId: params.developerId,
      issuedAt: new Date().toISOString(),
      currency: 'VND',
      metrics: params.calculated
    };
  }

  tinhTyLeChuyenDoiVaTyLeHoanTien(params = {}) {
    const stats = params.stats || [];
    return {
      success: true,
      totalGames: stats.length,
      data: stats.map(s => ({
        gameId: s.GameID,
        title: s.Title,
        wishlistCount: Number(s.WishlistCount || 0),
        refundCount: Number(s.RefundCount || 0)
      }))
    };
  }
}

module.exports = ReportService;
