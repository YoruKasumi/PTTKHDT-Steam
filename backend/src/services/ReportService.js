'use strict';
const BaseService = require('./BaseService');
const ReportDAO = require('../dao/ReportDAO');
const SystemConfigDAO = require('../dao/SystemConfigDAO');
const { getPlatformCommissionRate } = require('../utils/platformCommission');
const { ValidationException } = require('../exceptions');

class ReportService extends BaseService {
  constructor(reportDAO = new ReportDAO(), systemConfigDAO = new SystemConfigDAO()) {
    super();
    this.reportDAO = reportDAO;
    this.systemConfigDAO = systemConfigDAO;
  }


  async yeuCauBaoCaoDoanhThuRealTime(params = {}) {
    const developerId = params.user?.accountId || params.developerId;
    if (!developerId) throw new ValidationException('Thiếu định danh Nhà phát hành');

    const [transactions, totalRefunds, commissionRate] = await Promise.all([
      this.reportDAO.truyVanGiaoDichThanhCong({
        developerId,
        fromDate: params.fromDate,
        toDate: params.toDate
      }),
      this.reportDAO.truyVanTongTienHoanTra({ developerId }),
      getPlatformCommissionRate(this.systemConfigDAO),
    ]);

    const summary = this.tinhTongDoanhThuVaSoLuongBan({ transactions, totalRefunds, commissionRate });

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
        devShareEstimate: Number(t.GrossSales || 0) * (1 - commissionRate)
      }))
    };
  }


  async yeuCauKetXuatBangKe(params = {}) {
    const developerId = params.user?.accountId || params.developerId;
    if (!developerId) throw new ValidationException('Thiếu định danh Nhà phát hành');

    const [rawData, totalRefunds, commissionRate] = await Promise.all([
      this.reportDAO.truyVanDuLieuDoiSoatKyNay({
        developerId,
        fromDate: params.fromDate,
        toDate: params.toDate
      }),
      this.reportDAO.truyVanTongTienHoanTra({ developerId }),
      getPlatformCommissionRate(this.systemConfigDAO),
    ]);

    const calculated = this.tinhDoanhThuPhiSanHoanTienThucNhan({ rawData, totalRefunds, commissionRate });
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
    const commissionRate = Number(params.commissionRate ?? 0.3);
    let totalUnitsSold = 0;
    let totalGrossRevenue = 0;

    for (const item of transactions) {
      totalUnitsSold += Number(item.UnitsSold || 0);
      totalGrossRevenue += Number(item.GrossSales || 0);
    }

    const platformFeeRate = commissionRate;
    const netSales = Math.max(0, totalGrossRevenue - totalRefunds);
    const netRevenue = netSales * (1 - platformFeeRate);

    return {
      totalUnitsSold,
      totalGrossRevenue,
      totalRefunds,
      platformFeeRate: `${Number((platformFeeRate * 100).toFixed(2))}%`,
      platformFee: netSales * platformFeeRate,
      netRevenue: Math.max(0, netRevenue)
    };
  }

  tinhDoanhThuPhiSanHoanTienThucNhan(params = {}) {
    return this.tinhTongDoanhThuVaSoLuongBan({
      transactions: params.rawData,
      totalRefunds: params.totalRefunds,
      commissionRate: params.commissionRate,
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
