'use strict';
const BaseService = require('./BaseService');
const ReportDAO = require('../dao/ReportDAO');

class FinanceService extends BaseService {
  constructor(reportDAO = new ReportDAO()) {
    super();
    this.reportDAO = reportDAO;
  }

  async yeuCauLayDuLieuTongQuan(params = {}) {
    const rawData = await this.reportDAO.truyVanDuLieuTaiChinhRealTime(params);
    const metrics = this.tinhToanCacChiSoTaiChinh(rawData);
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
    const rawData = await this.reportDAO.truyVanDoanhThuDonHangVaTyLeChietKhau(params);
    const commissionData = this.tinhTongHoaHongNenTangThuVe(rawData);
    return {
      success: true,
      data: commissionData
    };
  }

  async yeuCauXuatBaoCaoTaiChinh(params = {}) {
    const periodData = await this.reportDAO.truyVanDuLieuTaiChinhTheoKy(params);
    const reportFile = this.ketXuatTepBaoCaoTaiChinh(periodData);
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
    const walletLogs = await this.reportDAO.truyVanNhatKyGiaoDichViToanSan(params);
    const audited = this.kiemTraDoiSoatCanBangSoDu(walletLogs);
    return {
      success: true,
      data: audited
    };
  }

  tinhToanCacChiSoTaiChinh(params = {}) {
    const totalGrossRevenue = Number(params.totalRevenue || 0);
    const totalRefunds = Number(params.totalRefundAmount || 0);
    const netSales = Math.max(0, totalGrossRevenue - totalRefunds);
    const platformCommission = netSales * 0.3;
    const developerPayoutPool = netSales * 0.7;

    return {
      totalCompletedOrders: Number(params.totalCompletedOrders || 0),
      totalGrossRevenue,
      totalRefunds,
      netSales,
      platformFeeRate: '30%',
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
    return {
      netSales: params.netSales || 0,
      commissionRate: '30%',
      platformCommission: params.platformCommission || 0
    };
  }

  ketXuatTepBaoCaoTaiChinh(params = {}) {
    return {
      reportId: 'FIN_REP_' + Date.now(),
      generatedAt: new Date().toISOString(),
      period: 'Monthly',
      currency: 'VND',
      figures: this.tinhToanCacChiSoTaiChinh(params)
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
      recentRefunds: refundOrders.slice(0, 20)
    };
  }

  kiemTraDoiSoatCanBangSoDu(walletLogs = []) {
    let totalCirculatingBalance = 0;
    for (const w of walletLogs) {
      totalCirculatingBalance += Number(w.Balance || 0);
    }

    return {
      totalWalletsCount: walletLogs.length,
      totalCirculatingBalance,
      topWallets: walletLogs.slice(0, 10)
    };
  }
}

module.exports = FinanceService;
