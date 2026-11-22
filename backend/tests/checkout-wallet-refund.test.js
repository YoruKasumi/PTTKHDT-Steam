'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const CartService = require('../src/services/CartService');
const WishlistService = require('../src/services/WishlistService');
const OrderService = require('../src/services/OrderService');
const WalletService = require('../src/services/WalletService');
const { NghiepVuException, ConflictException, ValidationException } = require('../src/exceptions');

describe('Luồng 1.3: Giỏ hàng, Wishlist & Thanh toán', () => {
  it('1.3.1 - CartService: Chặn thêm game nếu khách đã sở hữu bản quyền Active', async () => {
    const service = new CartService();
    service.transaction = async (cb) => cb({});
    service.cartDAO.layDonGiaTungSanPham = async () => ({
      GameID: 'game-1',
      GameStatus: 'Approved',
      CurrentPrice: '150000',
    });
    service.cartDAO.kiemTraSanPhamTrongGio = async () => null;
    service.cartDAO.kiemTraDaSoHuu = async () => ({ LicenseID: 'lic-1' });

    await assert.rejects(
      () => service.yeuCauThemSanPham({ user: { accountId: 'cus-1' }, gameId: 'game-1' }),
      (err) => {
        assert.ok(err instanceof ConflictException);
        assert.match(err.message, /đã sở hữu/i);
        return true;
      },
    );
  });

  it('1.3.2 - CartService: Chặn thêm game nếu đã có sẵn trong giỏ', async () => {
    const service = new CartService();
    service.transaction = async (cb) => cb({});
    service.cartDAO.layDonGiaTungSanPham = async () => ({
      GameID: 'game-1',
      GameStatus: 'Approved',
      CurrentPrice: '150000',
    });
    service.cartDAO.kiemTraSanPhamTrongGio = async () => ({ GameID: 'game-1' });

    await assert.rejects(
      () => service.yeuCauThemSanPham({ user: { accountId: 'cus-1' }, gameId: 'game-1' }),
      (err) => {
        assert.ok(err instanceof ConflictException);
        assert.match(err.message, /đã có trong giỏ hàng/i);
        return true;
      },
    );
  });

  it('1.3.3 - WishlistService: Chặn thêm game nếu đã sở hữu hoặc đã có trong wishlist', async () => {
    const service = new WishlistService();
    service.transaction = async (cb) => cb({});
    service.cartDAO.layDonGiaTungSanPham = async () => ({
      GameID: 'game-1',
      GameStatus: 'Approved',
    });
    service.wishlistDAO.kiemTraTrangThaiSoHuu = async () => ({ LicenseID: 'lic-1' });

    await assert.rejects(
      () => service.yeuCauThemWishlist({ user: { accountId: 'cus-1' }, gameId: 'game-1' }),
      (err) => {
        assert.ok(err instanceof ConflictException);
        assert.match(err.message, /đã sở hữu/i);
        return true;
      },
    );

    service.wishlistDAO.kiemTraTrangThaiSoHuu = async () => null;
    service.wishlistDAO.kiemTraTonTaiTrongWishlist = async () => ({ GameID: 'game-1' });

    await assert.rejects(
      () => service.yeuCauThemWishlist({ user: { accountId: 'cus-1' }, gameId: 'game-1' }),
      (err) => {
        assert.ok(err instanceof ConflictException);
        assert.match(err.message, /đã có trong Wishlist/i);
        return true;
      },
    );
  });

  it('1.3.4 - OrderService.checkout: Thiếu số dư ném 422 kèm shortage', async () => {
    const service = new OrderService();
    service.transaction = async (cb) => cb({});
    service.walletDAO.truyVanSoDuKhaDung = async () => ({
      WalletID: 'w-1',
      Balance: '100000.00',
    });
    service.orderDAO.khoaSanPhamTrongGio = async () => [];
    service.cartDAO.layDanhSachSanPhamTrongGio = async () => [
      {
        GameID: 'game-1',
        Title: 'Game A',
        CoverImage: '/cover.png',
        DeveloperID: 'dev-1',
        PriceAtAdd: '200000',
        BasePrice: '200000',
        PercentOff: '0',
        CurrentPrice: '200000',
        GameStatus: 'Approved',
      },
    ];
    service.orderDAO.layGameDaSoHuu = async () => [];

    await assert.rejects(
      () => service.checkout({ user: { accountId: 'cus-1' } }),
      (err) => {
        assert.ok(err instanceof NghiepVuException);
        assert.equal(err.status, 422);
        assert.equal(err.code, 'ERR_INSUFFICIENT_BALANCE');
        assert.equal(err.details.shortage, 100000);
        return true;
      },
    );
  });

  it('1.3.5 - OrderService.checkout: Đơn 0đ hoàn tất không ghi dòng TRANSACTION', async () => {
    const service = new OrderService();
    service.transaction = async (cb) => cb({});
    service.walletDAO.truyVanSoDuKhaDung = async () => ({
      WalletID: 'w-1',
      Balance: '0.00',
    });
    service.orderDAO.khoaSanPhamTrongGio = async () => [];
    service.cartDAO.layDanhSachSanPhamTrongGio = async () => [
      {
        GameID: 'game-free',
        Title: 'Free Game',
        CoverImage: '/free.png',
        DeveloperID: 'dev-1',
        PriceAtAdd: '0',
        BasePrice: '0',
        PercentOff: '0',
        CurrentPrice: '0',
        GameStatus: 'Approved',
      },
    ];
    service.orderDAO.layGameDaSoHuu = async () => [];

    const orderCalls = [];
    service.orderDAO.taoDonHang = async (p) => orderCalls.push(['taoDonHang', p]);
    service.orderDAO.taoChiTietDonHang = async (p) => orderCalls.push(['taoChiTietDonHang', p]);
    service.orderDAO.capPhatLicense = async (p) => orderCalls.push(['capPhatLicense', p]);
    service.orderDAO.xoaGioHang = async (p) => orderCalls.push(['xoaGioHang', p]);
    service.orderDAO.xoaGameDaMuaKhoiWishlist = async (p) => orderCalls.push(['xoaWishlist', p]);

    let walletDebitCalled = false;
    service.walletService = {
      truTienVi: async () => {
        walletDebitCalled = true;
      },
    };

    const result = await service.checkout({ user: { accountId: 'cus-1' } });
    assert.equal(result.totalAmount, 0);
    assert.equal(result.status, 'Completed');
    assert.equal(walletDebitCalled, false, 'Đơn 0đ KHÔNG được gọi trừ ví hoặc tạo TRANSACTION');
    assert.ok(orderCalls.some((c) => c[0] === 'capPhatLicense'));
  });
});

describe('Luồng 1.4: Ví điện tử & Hoàn tiền (Refund 24 giờ)', () => {
  it('orders list exposes per-game refund and license eligibility', async () => {
    const service = new OrderService();
    service.orderDAO.layDanhSachDonHang = async () => [
      {
        OrderID: 'ord-list',
        OrderDate: '2026-11-20T10:00:00Z',
        TotalAmount: '150000',
        Status: 'PartiallyRefunded',
        GameID: 'game-1',
        Title: 'Refunded Game',
        UnitPrice: '50000',
        PriceAfterDiscount: '50000',
        LicenseStatus: 'Revoked',
        RevokedReason: 'Refund',
        IsGameRefunded: 1,
      },
      {
        OrderID: 'ord-list',
        OrderDate: '2026-11-20T10:00:00Z',
        TotalAmount: '150000',
        Status: 'PartiallyRefunded',
        GameID: 'game-2',
        Title: 'Eligible Game',
        UnitPrice: '100000',
        PriceAfterDiscount: '100000',
        LicenseStatus: 'Active',
        IsGameRefunded: 0,
      },
    ];
    service.refundDAO.layHanMucHoanTien = async () => 24;

    const [order] = await service.yeuCauXemDonHang({ user: { accountId: 'cus-1' } });

    assert.equal(order.status, 'PartiallyRefunded');
    assert.equal(order.items[0].refunded, true);
    assert.equal(order.items[0].canRefund, false);
    assert.equal(order.items[1].refunded, false);
    assert.equal(order.items[1].canRefund, true);
  });

  it('1.4.1 - WalletService.guiYeuCauNapTien: Thành công cộng số dư và ghi Status=Success', async () => {
    const service = new WalletService();
    service.walletDAO.truyVanSoDuVi = async () => ({
      WalletID: 'w-1',
      CustomerID: 'cus-1',
      Balance: '50000.00',
    });
    service.transaction = async (cb) => cb({});
    service.walletDAO.truyVanSoDuKhaDung = async () => ({
      WalletID: 'w-1',
      Balance: '50000.00',
    });

    const txRecords = [];
    service.walletDAO.capNhatSoDuVi = async ({ amount, operation }) => {
      assert.equal(operation, 'credit');
      assert.equal(amount, 100000);
      return true;
    };
    service.walletDAO.luuLichSuGiaoDich = async (p) => txRecords.push(p);

    const result = await service.guiYeuCauNapTien({
      user: { accountId: 'cus-1' },
      amount: 100000,
    });

    assert.equal(result.success, true);
    assert.equal(result.balance, 150000);
    assert.equal(txRecords.length, 1);
    assert.equal(txRecords[0].type, 'Deposit');
    assert.equal(txRecords[0].status, 'Success');
  });

  it('1.4.2 - WalletService.guiYeuCauNapTien: Thất bại ghi Status=Failed', async () => {
    const service = new WalletService();
    service.walletDAO.truyVanSoDuVi = async () => ({
      WalletID: 'w-1',
      CustomerID: 'cus-1',
      Balance: '50000.00',
    });

    const txRecords = [];
    service.walletDAO.luuLichSuGiaoDich = async (p) => txRecords.push(p);

    await assert.rejects(
      () =>
        service.guiYeuCauNapTien({
          user: { accountId: 'cus-1' },
          amount: 100000,
          simulateFailure: true,
        }),
      (err) => {
        assert.ok(err instanceof NghiepVuException);
        assert.equal(err.code, 'ERR_PAYMENT_FAILED');
        return true;
      },
    );

    assert.equal(txRecords.length, 1);
    assert.equal(txRecords[0].type, 'Deposit');
    assert.equal(txRecords[0].status, 'Failed');
  });

  it('1.4.3 - WalletService.guiYeuCauRutTien: Kiểm tra Balance >= Amount', async () => {
    const service = new WalletService();
    service.transaction = async (cb) => cb({});
    service.walletDAO.truyVanSoDuKhaDung = async () => ({
      WalletID: 'w-1',
      Balance: '50000.00',
    });

    await assert.rejects(
      () =>
        service.guiYeuCauRutTien({
          user: { accountId: 'cus-1' },
          amount: 100000,
          bankInfo: 'VCB - 123456789',
        }),
      (err) => {
        assert.ok(err instanceof NghiepVuException);
        assert.equal(err.code, 'ERR_INSUFFICIENT_BALANCE');
        return true;
      },
    );
  });

  it('1.4.4 - OrderService.guiYeuCauHoanTien: Đơn quá 24h VẪN ghi REFUNDREQUEST Status=Rejected rồi ném 422', async () => {
    const service = new OrderService();
    let transactionCommitted = false;
    service.transaction = async (cb) => {
      const result = await cb({});
      transactionCommitted = true;
      return result;
    };

    service.orderDAO.layDonHangDeHoanTien = async () => ({
      OrderID: 'ord-old',
      CustomerID: 'cus-1',
      TotalAmount: '250000',
      Status: 'Completed',
      HoursSincePurchase: 30, // > 24 giờ
    });
    service.orderDAO.layItemsDonHang = async () => [{ GameID: 'game-1', Title: 'Game 1', PriceAfterDiscount: '250000' }];
    service.refundDAO.layGameDaHoanTien = async () => [];
    service.refundDAO.layBanQuyenGame = async () => [{
      LicenseID: 'lic-1', GameID: 'game-1', Source: 'Purchase', Status: 'Active',
    }];

    const refundRequests = [];
    service.refundDAO.layHanMucHoanTien = async () => 24;
    service.refundDAO.ghiYeuCauHoanTien = async (p) => refundRequests.push(p);

    await assert.rejects(
      () =>
        service.guiYeuCauHoanTien({
          user: { accountId: 'cus-1' },
          orderId: 'ord-old',
          gameIds: ['game-1'],
          reason: 'Chơi không hợp',
        }),
      (err) => {
        assert.ok(err instanceof NghiepVuException);
        assert.equal(err.status, 422);
        assert.equal(err.code, 'ERR_REFUND_EXPIRED');
        return true;
      },
    );

    assert.equal(refundRequests.length, 1);
    assert.equal(refundRequests[0].status, 'Rejected');
    assert.equal(refundRequests[0].hoursSincePurchase, 30);
    assert.equal(transactionCommitted, true, 'Rejected request must commit before the service returns 422');
  });

  it('1.4.5 - OrderService refund: đúng biên 23h59, 24h05 và cửa sổ 48 giờ', async () => {
    const makeService = (seconds, windowHours) => {
      const service = new OrderService();
      service.transaction = async (cb) => cb({});
      service.refundDAO.one = async (sql) => {
        assert.match(sql, /REFUND_WINDOW_HOURS/);
        return { ParamValue: String(windowHours) };
      };
      service.orderDAO.layDonHangDeHoanTien = async () => ({
        OrderID: 'ord-boundary',
        CustomerID: 'cus-1',
        TotalAmount: '200000',
        Status: 'Completed',
        SecondsSincePurchase: seconds,
      });
      service.orderDAO.layItemsDonHang = async () => [{ GameID: 'game-1', Title: 'Game 1', PriceAfterDiscount: '200000' }];
      service.refundDAO.layGameDaHoanTien = async () => [];
      service.refundDAO.layBanQuyenGame = async () => [{
        LicenseID: 'lic-1', GameID: 'game-1', Source: 'Purchase', Status: 'Active',
      }];
      service.refundDAO.ghiYeuCauHoanTien = async () => {};
      service.refundDAO.capNhatDonDaHoan = async () => {};
      service.refundDAO.thuHoiBanQuyenGame = async () => {};
      service.walletService = { congTienHoanTraVaoVi: async () => {} };
      return service;
    };

    const accepted = await makeService(23 * 3600 + 59 * 60, 24).guiYeuCauHoanTien({
      user: { accountId: 'cus-1' },
      orderId: 'ord-boundary',
      gameIds: ['game-1'],
    });
    assert.equal(accepted.status, 'Refunded');

    await assert.rejects(
      () => makeService(24 * 3600 + 5 * 60, 24).guiYeuCauHoanTien({
        user: { accountId: 'cus-1' },
        orderId: 'ord-boundary',
        gameIds: ['game-1'],
      }),
      (err) => err.code === 'ERR_REFUND_EXPIRED',
    );

    const window48 = await makeService(30 * 3600, 48).guiYeuCauHoanTien({
      user: { accountId: 'cus-1' },
      orderId: 'ord-boundary',
      gameIds: ['game-1'],
    });
    assert.equal(window48.status, 'Refunded');
    assert.equal(window48.refundWindowHours, 48);

    await assert.rejects(
      () => makeService(48 * 3600 + 1, 48).guiYeuCauHoanTien({
        user: { accountId: 'cus-1' },
        orderId: 'ord-boundary',
        gameIds: ['game-1'],
      }),
      (err) => err.code === 'ERR_REFUND_EXPIRED',
    );
  });

  it('1.4.6 - OrderService.guiYeuCauHoanTien: Đơn <= 24h thu hồi bản quyền, ghi Approved và hoàn tiền ví', async () => {
    const service = new OrderService();
    service.transaction = async (cb) => cb({});

    service.orderDAO.layDonHangDeHoanTien = async () => ({
      OrderID: 'ord-recent',
      CustomerID: 'cus-1',
      TotalAmount: '200000',
      Status: 'Completed',
      HoursSincePurchase: 2, // <= 24 giờ
    });
    service.orderDAO.layItemsDonHang = async () => [{ GameID: 'game-1', Title: 'Game 1', PriceAfterDiscount: '200000' }];
    service.refundDAO.layGameDaHoanTien = async () => [];
    service.refundDAO.layBanQuyenGame = async () => [{
      LicenseID: 'lic-1', GameID: 'game-1', Source: 'Purchase', Status: 'Active',
    }];

    const auditTrail = [];
    service.refundDAO.layHanMucHoanTien = async () => 24;
    service.refundDAO.ghiYeuCauHoanTien = async (p) => auditTrail.push(['ghiRefund', p]);
    service.refundDAO.capNhatDonDaHoan = async (p) => auditTrail.push(['setRefunded', p]);
    service.refundDAO.thuHoiBanQuyenGame = async (p) => auditTrail.push(['thuHoiLicense', p]);

    service.walletService = {
      congTienHoanTraVaoVi: async (p) => auditTrail.push(['congTienVi', p]),
    };

    const res = await service.guiYeuCauHoanTien({
      user: { accountId: 'cus-1' },
      orderId: 'ord-recent',
      gameIds: ['game-1'],
      reason: 'Game phát sinh lỗi đồ họa',
    });

    assert.equal(res.status, 'Refunded');
    assert.equal(res.refundedAmount, 200000);
    assert.ok(auditTrail.some((a) => a[0] === 'ghiRefund' && a[1].status === 'Approved'));
    assert.ok(auditTrail.some((a) => a[0] === 'setRefunded'));
    assert.ok(auditTrail.some((a) => a[0] === 'thuHoiLicense'));
    assert.ok(auditTrail.some((a) => a[0] === 'congTienVi'));
  });

  it('1.4.7 - OrderService refund: hoàn đúng game đã chọn và giữ đơn ở PartiallyRefunded', async () => {
    const service = new OrderService();
    service.transaction = async (cb) => cb({});
    service.orderDAO.layDonHangDeHoanTien = async () => ({
      OrderID: 'ord-partial',
      Status: 'Completed',
      SecondsSincePurchase: 3600,
    });
    service.orderDAO.layItemsDonHang = async () => [
      { GameID: 'game-1', Title: 'Game 1', PriceAfterDiscount: '50000.00' },
      { GameID: 'game-2', Title: 'Game 2', PriceAfterDiscount: '100000.00' },
    ];
    service.refundDAO.layGameDaHoanTien = async () => [];
    service.refundDAO.layBanQuyenGame = async () => [
      { LicenseID: 'lic-1', GameID: 'game-1', Source: 'Purchase', Status: 'Active' },
    ];
    service.refundDAO.layHanMucHoanTien = async () => 24;

    const requests = [];
    const revoked = [];
    const orderStatuses = [];
    const walletCredits = [];
    service.refundDAO.ghiYeuCauHoanTien = async (params) => requests.push(params);
    service.refundDAO.capNhatDonDaHoan = async (params) => orderStatuses.push(params);
    service.refundDAO.thuHoiBanQuyenGame = async (params) => revoked.push(params);
    service.walletService = {
      congTienHoanTraVaoVi: async (params) => walletCredits.push(params),
    };

    const result = await service.guiYeuCauHoanTien({
      user: { accountId: 'cus-1' },
      orderId: 'ord-partial',
      gameIds: ['game-1'],
    });

    assert.equal(result.status, 'PartiallyRefunded');
    assert.equal(result.refundedAmount, 50000);
    assert.deepEqual(result.refundedGameIds, ['game-1']);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].gameId, 'game-1');
    assert.equal(requests[0].status, 'Approved');
    assert.deepEqual(orderStatuses, [{ orderId: 'ord-partial', status: 'PartiallyRefunded' }]);
    assert.deepEqual(revoked, [{ licenseIds: ['lic-1'] }]);
    assert.equal(walletCredits[0].amount, 50000);
    assert.match(walletCredits[0].detail, /Game 1/);
  });

  it('1.4.8 - OrderService refund rejects games outside the order and suspended licenses with reasons', async () => {
    const service = new OrderService();
    service.transaction = async (cb) => cb({});
    service.orderDAO.layDonHangDeHoanTien = async () => ({
      OrderID: 'ord-check',
      Status: 'Completed',
      SecondsSincePurchase: 3600,
    });
    service.orderDAO.layItemsDonHang = async () => [
      { GameID: 'game-1', Title: 'Game 1', PriceAfterDiscount: '50000' },
    ];

    await assert.rejects(
      service.guiYeuCauHoanTien({
        user: { accountId: 'cus-1' },
        orderId: 'ord-check',
        gameIds: ['not-in-order'],
      }),
      (error) => error.code === 'ERR_INVALID_REFUND_GAMES'
        && error.status === 422
        && error.details.invalidGameIds[0] === 'not-in-order',
    );

    service.refundDAO.layGameDaHoanTien = async () => [];
    service.refundDAO.layBanQuyenGame = async () => [{
      LicenseID: 'lic-1',
      GameID: 'game-1',
      Source: 'Purchase',
      Status: 'Revoked',
      RevokedReason: 'AccountSuspended',
    }];
    await assert.rejects(
      service.guiYeuCauHoanTien({
        user: { accountId: 'cus-1' },
        orderId: 'ord-check',
        gameIds: ['game-1'],
      }),
      (error) => error.code === 'ERR_LICENSE_NOT_ACTIVE'
        && error.status === 422
        && error.details.ineligibleGames[0].reason.includes('tạm khóa'),
    );
  });
});
