'use strict';
const BaseService = require('./BaseService');
const ReportDAO = require('../dao/ReportDAO');
const SystemConfigDAO = require('../dao/SystemConfigDAO');
const { getPlatformCommissionRate } = require('../utils/platformCommission');

class FinanceService extends BaseService {
  constructor(reportDAO = new ReportDAO(), systemConfigDAO = new SystemConfigDAO()) {
    super();
    this.reportDAO = reportDAO;
    this.systemConfigDAO = systemConfigDAO;
  }

  async getPlatformCommissionRate() {
    return getPlatformCommissionRate(this.systemConfigDAO);
  }

  async yeuCauLayDuLieuTongQuan(params = {}) {
    const [rawData, commissionRate] = await Promise.all([
      this.reportDAO.truyVanDuLieuTaiChinhRealTime(params),
      this.getPlatformCommissionRate(),
    ]);
    const metrics = this.tinhToanCacChiSoTaiChinh(rawData, commissionRate);
    return {
      success: true,
      data: metrics
    };
  }

  async guiYeuCauThongKeDoanhSo(params = {}) {
    const dailyOrders = await this.reportDAO.truyVanDonHangThanhCongTheoThoiGian(params);
    const summary = this.tongHopTongDoanhSo(dailyOrders);
    return {
      success: true,
      data: {
        summary,
        timeline: dailyOrders
      }
    };
  }

  async yeuCauThongKeHoaHong(params = {}) {
    const [rawData, commissionRate] = await Promise.all([
      this.reportDAO.truyVanDoanhThuDonHangVaTyLeChietKhau(params),
      this.getPlatformCommissionRate(),
    ]);
    const commissionData = this.tinhTongHoaHongNenTangThuVe({ ...rawData, commissionRate });
    return {
      success: true,
      data: commissionData
    };
  }

  async yeuCauXuatBaoCaoTaiChinh(params = {}) {
    const [periodData, commissionRate] = await Promise.all([
      this.reportDAO.truyVanDuLieuTaiChinhTheoKy(params),
      this.getPlatformCommissionRate(),
    ]);
    const reportFile = this.ketXuatTepBaoCaoTaiChinh(periodData, commissionRate);
    return {
      success: true,
      report: reportFile
    };
  }

  async yeuCauDuLieuDongTienChoRut(params = {}) {
    const pendingRows = await this.reportDAO.truyVanSoDuDoanhThuCacNhaPhatHanh(params);
    const classified = this.phanLoaiSoDuKhaDungVaTamGiu(pendingRows);
    return {
      success: true,
      data: classified
    };
  }

  async yeuCauThongKeHoanTien(params = {}) {
    const refundOrders = await this.reportDAO.truyVanCacDonHangHoanTienThanhCong(params);
    const refundStats = this.tinhTongGiaTriVaTyLeHoanTien(refundOrders);
    return {
      success: true,
      data: refundStats
    };
  }

  async yeuCauNhatKyBienDongSoDu(params = {}) {
    const [transactions, movementSummary, balanceSummary] = await Promise.all([
      this.reportDAO.truyVanNhatKyGiaoDichViToanSan(params),
      this.reportDAO.truyVanThongKeBienDongSoDu(params),
      this.reportDAO.truyVanTongSoDuViToanSan(params),
    ]);
    const audited = this.kiemTraDoiSoatCanBangSoDu({ transactions, movementSummary, balanceSummary });
    return {
      success: true,
      data: audited
    };
  }

  tinhToanCacChiSoTaiChinh(params = {}, commissionRate = 0.3) {
    const totalGrossRevenue = Number(params.totalRevenue || 0);
    const totalRefunds = Number(params.totalRefundAmount || 0);
    const netSales = Math.max(0, totalGrossRevenue - totalRefunds);
    const platformCommission = netSales * commissionRate;
    const developerPayoutPool = netSales * (1 - commissionRate);

    return {
      totalCompletedOrders: Number(params.totalCompletedOrders || 0),
      totalGrossRevenue,
      totalRefunds,
      netSales,
      platformFeeRate: `${Number((commissionRate * 100).toFixed(2))}%`,
      platformCommission,
      developerPayoutPool
    };
  }

  tongHopTongDoanhSo(dailyOrders = []) {
    let totalOrders = 0;
    let totalAmount = 0;

    for (const row of dailyOrders) {
      totalOrders += Number(row.OrderCount || 0);
      totalAmount += Number(row.DailyRevenue || 0);
    }

    return {
      daysTracked: dailyOrders.length,
      totalOrders,
      totalAmount
    };
  }

  tinhTongHoaHongNenTangThuVe(params = {}) {
    const commissionRate = Number(params.commissionRate ?? 0.3);
    const netSales = Math.max(0, Number(params.netSales || 0));
    return {
      netSales,
      commissionRate: `${Number((commissionRate * 100).toFixed(2))}%`,
      platformCommission: netSales * commissionRate
    };
  }

  ketXuatTepBaoCaoTaiChinh(params = {}, commissionRate = 0.3) {
    return {
      reportId: 'FIN_REP_' + Date.now(),
      generatedAt: new Date().toISOString(),
      period: 'Monthly',
      currency: 'VND',
      figures: this.tinhToanCacChiSoTaiChinh(params, commissionRate)
    };
  }

  phanLoaiSoDuKhaDungVaTamGiu(pendingRows = []) {
    let totalPendingAmount = 0;
    const items = pendingRows.map(r => {
      const amt = Number(r.PendingWithdrawal || 0);
      totalPendingAmount += amt;
      return {
        developerId: r.DeveloperID,
        pendingAmount: amt
      };
    });

    return {
      totalPendingDevelopers: items.length,
      totalPendingAmount,
      developers: items
    };
  }

  tinhTongGiaTriVaTyLeHoanTien(refundOrders = []) {
    return {
      totalRefundedOrders: refundOrders.length,
      totalRefundedAmount: refundOrders.reduce((total, order) => total + Number(order.RefundAmount || 0), 0),
      recentRefunds: refundOrders.slice(0, 20)
    };
  }

  kiemTraDoiSoatCanBangSoDu({ transactions = [], movementSummary = {}, balanceSummary = {} } = {}) {
    return {
      totalWalletsCount: Number(balanceSummary.TotalWalletsCount || 0),
      totalCirculatingBalance: Number(balanceSummary.TotalCirculatingBalance || 0),
      totalTransactions: Number(movementSummary.TotalTransactions || 0),
      successfulTransactions: Number(movementSummary.SuccessfulTransactions || 0),
      pendingTransactions: Number(movementSummary.PendingTransactions || 0),
      failedTransactions: Number(movementSummary.FailedTransactions || 0),
      totalInflows: Number(movementSummary.TotalInflows || 0),
      totalOutflows: Number(movementSummary.TotalOutflows || 0),
      recentTransactions: transactions.slice(0, 50)
    };
  }
}

module.exports = FinanceService;
