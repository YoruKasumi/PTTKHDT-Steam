'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const ReportService = require('../src/services/ReportService');
const FinanceService = require('../src/services/FinanceService');
const ReportDAO = require('../src/dao/ReportDAO');

describe('UC30/31 & UC50/51/53/55: Báo cáo doanh thu & Tài chính sàn', () => {
  it('UC30 - ReportService.yeuCauBaoCaoDoanhThuRealTime: Chạy thành công không crash', async () => {
    const service = new ReportService();
    service.systemConfigDAO.truyVanThamSoToanCuc = async () => [
      { ParamKey: 'PLATFORM_COMMISSION_PERCENT', ParamValue: '20' },
    ];
    service.reportDAO.truyVanGiaoDichThanhCong = async () => [
      { GameID: 'g-1', Title: 'Cyber City', Price: '250000', UnitsSold: 10, GrossSales: '2500000' },
    ];
    service.reportDAO.truyVanTongTienHoanTra = async () => 250000;

    const result = await service.yeuCauBaoCaoDoanhThuRealTime({
      user: { accountId: 'dev-1' },
      fromDate: '2026-01-01',
      toDate: '2026-12-31',
    });

    assert.equal(result.success, true);
    assert.equal(result.developerId, 'dev-1');
    assert.equal(result.summary.totalUnitsSold, 10);
    assert.equal(result.summary.totalGrossRevenue, 2500000);
    assert.equal(result.summary.totalRefunds, 250000);
    assert.equal(result.summary.platformFeeRate, '20%');
    assert.equal(result.summary.platformFee, (2500000 - 250000) * 0.2);
    assert.equal(result.summary.netRevenue, (2500000 - 250000) * 0.8);
    assert.equal(result.games[0].devShareEstimate, 2500000 * 0.8);
    assert.equal(result.games.length, 1);
  });

  it('UC31 - ReportService.yeuCauKetXuatBangKe: Chạy thành công không crash', async () => {
    const service = new ReportService();
    service.systemConfigDAO.truyVanThamSoToanCuc = async () => [
      { ParamKey: 'PLATFORM_COMMISSION_PERCENT', ParamValue: '20' },
    ];
    service.reportDAO.truyVanDuLieuDoiSoatKyNay = async () => [
      { GameID: 'g-1', Title: 'Cyber City', Price: '250000', UnitsSold: 5, GrossSales: '1250000' },
    ];
    service.reportDAO.truyVanTongTienHoanTra = async () => 0;

    const result = await service.yeuCauKetXuatBangKe({
      user: { accountId: 'dev-1' },
      fromDate: '2026-01-01',
      toDate: '2026-02-01',
    });

    assert.equal(result.success, true);
    assert.ok(result.statement);
    assert.equal(result.statement.developerId, 'dev-1');
    assert.equal(result.statement.metrics.totalUnitsSold, 5);
  });

  it('UC50 - FinanceService.yeuCauLayDuLieuTongQuan: Chạy thành công không crash', async () => {
    const service = new FinanceService();
    service.systemConfigDAO.truyVanThamSoToanCuc = async () => [
      { ParamKey: 'PLATFORM_COMMISSION_PERCENT', ParamValue: '20' },
    ];
    service.reportDAO.truyVanDuLieuTaiChinhRealTime = async () => ({
      totalRevenue: 50000000,
      totalCompletedOrders: 100,
      totalRefundAmount: 2000000,
    });

    const result = await service.yeuCauLayDuLieuTongQuan({});
    assert.equal(result.success, true);
    assert.equal(result.data.totalGrossRevenue, 50000000);
    assert.equal(result.data.totalRefunds, 2000000);
    assert.equal(result.data.netSales, 48000000);
    assert.equal(result.data.platformFeeRate, '20%');
    assert.equal(result.data.platformCommission, 48000000 * 0.2);
    assert.equal(result.data.developerPayoutPool, 48000000 * 0.8);
  });

  it('UC51 - FinanceService.guiYeuCauThongKeDoanhSo: Chạy thành công không crash', async () => {
    const service = new FinanceService();
    service.reportDAO.truyVanDonHangThanhCongTheoThoiGian = async () => [
      { OrderDate: '2026-11-20', OrderCount: 15, DailyRevenue: 4500000 },
      { OrderDate: '2026-11-21', OrderCount: 20, DailyRevenue: 6000000 },
    ];

    const result = await service.guiYeuCauThongKeDoanhSo({});
    assert.equal(result.success, true);
    assert.equal(result.data.summary.totalOrders, 35);
    assert.equal(result.data.summary.totalAmount, 10500000);
    assert.equal(result.data.timeline.length, 2);
  });

  it('UC53 - FinanceService.yeuCauXuatBaoCaoTaiChinh: Chạy thành công không crash', async () => {
    const service = new FinanceService();
    service.systemConfigDAO.truyVanThamSoToanCuc = async () => [
      { ParamKey: 'PLATFORM_COMMISSION_PERCENT', ParamValue: '20' },
    ];
    service.reportDAO.truyVanDuLieuTaiChinhTheoKy = async () => ({
      totalRevenue: 30000000,
      totalCompletedOrders: 50,
      totalRefundAmount: 1000000,
    });

    const result = await service.yeuCauXuatBaoCaoTaiChinh({});
    assert.equal(result.success, true);
    assert.ok(result.report);
    assert.equal(result.report.figures.netSales, 29000000);
    assert.equal(result.report.figures.platformCommission, 5800000);
  });

  it('UC52 - FinanceService.yeuCauThongKeHoaHong uses the configured commission rate', async () => {
    const service = new FinanceService();
    service.systemConfigDAO.truyVanThamSoToanCuc = async () => [
      { ParamKey: 'PLATFORM_COMMISSION_PERCENT', ParamValue: '20' },
    ];
    service.reportDAO.truyVanDoanhThuDonHangVaTyLeChietKhau = async () => ({ netSales: 10000000 });

    const result = await service.yeuCauThongKeHoaHong({});
    assert.equal(result.data.commissionRate, '20%');
    assert.equal(result.data.platformCommission, 2000000);
  });

  it('UC55 - FinanceService.yeuCauThongKeHoanTien: Chạy thành công không crash', async () => {
    const service = new FinanceService();
    service.reportDAO.truyVanCacDonHangHoanTienThanhCong = async () => [
      {
        RequestID: 'req-1',
        OrderID: 'ord-1',
        CustomerID: 'cus-1',
        Reason: 'Game bị lỗi crash',
        RequestDate: new Date(),
        RefundAmount: '125000',
      },
    ];

    const result = await service.yeuCauThongKeHoanTien({});
    assert.equal(result.success, true);
    assert.equal(result.data.totalRefundedOrders, 1);
    assert.equal(result.data.totalRefundedAmount, 125000);
    assert.equal(result.data.recentRefunds[0].CustomerID, 'cus-1');
  });

  it('UC56 - FinanceService.yeuCauNhatKyBienDongSoDu returns ledger movements and balance totals', async () => {
    const service = new FinanceService();
    service.reportDAO.truyVanNhatKyGiaoDichViToanSan = async () => [
      { TransID: 'trans-1', Type: 'Deposit', Amount: '500000', Status: 'Success' },
    ];
    service.reportDAO.truyVanThongKeBienDongSoDu = async () => ({
      TotalTransactions: 12,
      SuccessfulTransactions: 10,
      PendingTransactions: 1,
      FailedTransactions: 1,
      TotalInflows: '900000',
      TotalOutflows: '400000',
    });
    service.reportDAO.truyVanTongSoDuViToanSan = async () => ({
      TotalWalletsCount: 5,
      TotalCirculatingBalance: '2500000',
    });

    const result = await service.yeuCauNhatKyBienDongSoDu({});
    assert.equal(result.data.totalTransactions, 12);
    assert.equal(result.data.totalInflows, 900000);
    assert.equal(result.data.totalOutflows, 400000);
    assert.equal(result.data.totalCirculatingBalance, 2500000);
    assert.equal(result.data.recentTransactions[0].TransID, 'trans-1');
  });

  it('ReportDAO SQL Query syntax verification: Không còn các cột sai lược đồ', async () => {
    const dao = new ReportDAO();
    // Tạo stub query method để bắt lại câu lệnh SQL thực thi
    let capturedQueries = [];
    dao.query = async (sql, params) => {
      capturedQueries.push({ sql, params });
      return [];
    };
    dao.one = async (sql, params) => {
      capturedQueries.push({ sql, params });
      return {};
    };

    await dao.truyVanGiaoDichThanhCong({ developerId: 'dev-1', fromDate: '2026-01-01', toDate: '2026-01-31' });
    await dao.truyVanDuLieuTaiChinhRealTime();
    await dao.truyVanDonHangThanhCongTheoThoiGian();
    await dao.truyVanCacDonHangHoanTienThanhCong();
    await dao.truyVanNhatKyGiaoDichViToanSan();
    await dao.truyVanThongKeBienDongSoDu();
    await dao.truyVanTongSoDuViToanSan();

    for (const { sql } of capturedQueries) {
      assert.doesNotMatch(sql, /OrderItemID/i, 'Không được chứa OrderItemID');
      assert.doesNotMatch(sql, /CreatedAt/i, 'Không được chứa CreatedAt');
      assert.doesNotMatch(sql, /FinalAmount/i, 'Không được chứa FinalAmount');
      assert.doesNotMatch(sql, /RequestedAt/i, 'Không được chứa RequestedAt');
      assert.doesNotMatch(sql, /r\.CustomerID/i, 'CustomerID phải từ bảng ORDERS o');
    }
    const sales = capturedQueries.find(({ sql }) => /UnitsSold/.test(sql));
    assert.match(sales.sql, /COUNT\(CASE WHEN o\.OrderID IS NOT NULL THEN oi\.GameID END\)/);
    assert.deepEqual(sales.params, ['2026-01-01', '2026-01-31', 'dev-1']);
    const refunds = capturedQueries.find(({ sql }) => /RequestDate/.test(sql));
    assert.match(refunds.sql, /r\.RequestDate/);
    assert.doesNotMatch(refunds.sql, /ProcessedAt/);
    const ledger = capturedQueries.find(({ sql }) => /TransID/.test(sql));
    assert.match(ledger.sql, /FROM `TRANSACTION`/);
    assert.match(ledger.sql, /INNER JOIN WALLET/);
  });
});
