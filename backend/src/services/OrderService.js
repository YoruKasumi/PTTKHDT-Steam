'use strict';
const { randomUUID, randomBytes, createHash } = require('node:crypto');
const BaseService = require('./BaseService');
const {
  ConflictException,
  NghiepVuException,
  NotFoundException,
  NotImplementedException,
  ValidationException,
} = require('../exceptions');
const OrderDAO = require('../dao/OrderDAO');
const CartDAO = require('../dao/CartDAO');
const WalletDAO = require('../dao/WalletDAO');

const MAX_MONEY = 9999999999999.99;

function toCents(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0 || amount > MAX_MONEY) {
    throw new ValidationException('Giá trị tiền không hợp lệ');
  }
  return BigInt(Math.round(amount * 100));
}

function money(cents) {
  return Number(cents) / 100;
}

function allocateDiscount(items, coupon) {
  const allocations = new Map(items.map((item) => [item.gameId, 0n]));
  if (!coupon) return { allocations, discountCents: 0n };

  const eligible = items.filter((item) => (
    (!coupon.DeveloperID || item.developerId === coupon.DeveloperID)
    && (!coupon.GameID || item.gameId === coupon.GameID)
  ));
  if (!eligible.length) {
    throw new ValidationException('Mã giảm giá không áp dụng cho sản phẩm trong giỏ hàng');
  }

  const eligibleTotal = eligible.reduce((sum, item) => sum + item.unitPriceCents, 0n);
  const discountCents = eligibleTotal < toCents(coupon.DiscountValue)
    ? eligibleTotal
    : toCents(coupon.DiscountValue);
  if (discountCents === 0n) return { allocations, discountCents };

  const shares = eligible.map((item) => {
    const weighted = discountCents * item.unitPriceCents;
    const amount = weighted / eligibleTotal;
    return {
      gameId: item.gameId,
      amount,
      remainder: weighted % eligibleTotal,
    };
  });
  let remainder = discountCents - shares.reduce((sum, share) => sum + share.amount, 0n);
  shares.sort((left, right) => (
    left.remainder === right.remainder ? 0 : left.remainder > right.remainder ? -1 : 1
  ));
  for (let index = 0; remainder > 0n; index += 1, remainder -= 1n) {
    shares[index].amount += 1n;
  }
  shares.forEach((share) => allocations.set(share.gameId, share.amount));
  return { allocations, discountCents };
}

/**
 * OrderService - tầng Business Logic.
 * Tên phương thức lấy đúng từ sơ đồ sequence; nội dung bên dưới chỉ là khung cần cài đặt.
 */
class OrderService extends BaseService {
  constructor() {
    super();
    this.orderDAO = new OrderDAO();
    this.cartDAO = new CartDAO();
    this.walletDAO = new WalletDAO();
    this.walletService = null; // được gắn trong services/index.js
  }

  // ---------------------------------------------------------------- Phương thức công khai (Route / Service khác gọi)

  /**
   * UC15. Thanh toán - sequence #2: UI → OrderService
   * Vai trò gọi: Customer
   * @param {object} params
   */
  async yeuCauThanhToan(params = {}) {
    return this.checkout(params);
  }

  /**
   * UC15. Thanh toán - sequence #4: UI → OrderService
   * Vai trò gọi: Customer
   * Luồng theo sơ đồ:
   *   #5 → OrderDAO.truyVanMaGiamGia()
   *   #6 ← traVeThongTinGiamGia()
   *   #8 → WalletService.kiemTraSoDuKhaDung
   *   #9 → WalletDAO.truyVanSoDu()
   *   #10 ← traVeSoDu()
   *   #11 ← traVeKetQuaSoDu()
   *   #12 ← thongBaoSoDuKhongDu()
   * @param {object} params
   */
  async kiemTraMaGiamGia(params = {}) {
    return this.preview(params);
  }

  async preview(params = {}) {
    const customerId = this.customerId(params);
    return this.transaction(async (conn) => {
      const prepared = await this.prepareCheckout({ ...params, customerId }, conn);
      return this.toPreview(prepared);
    });
  }

  async checkout(params = {}) {
    const customerId = this.customerId(params);
    try {
      return await this.transaction(async (conn) => {
        const prepared = await this.prepareCheckout({ ...params, customerId }, conn);
        if (!prepared.items.length) throw new ValidationException('Giỏ hàng đang trống');
        if (prepared.balance < prepared.totalAmount) {
          throw new NghiepVuException(
            'Số dư ví không đủ để thanh toán đơn hàng',
            422,
            'ERR_INSUFFICIENT_BALANCE',
            {
              required: prepared.totalAmount,
              available: prepared.balance,
              shortage: Number((prepared.totalAmount - prepared.balance).toFixed(2)),
            },
          );
        }

        const orderId = randomUUID();
        await this.orderDAO.taoDonHang({
          orderId,
          customerId,
          couponId: prepared.coupon ? prepared.coupon.CouponID : null,
          totalAmount: prepared.totalAmount,
        }, conn);

        for (const item of prepared.items) {
          await this.orderDAO.taoChiTietDonHang({
            orderId,
            gameId: item.gameId,
            unitPrice: item.unitPrice,
            priceAfterDiscount: item.priceAfterDiscount,
          }, conn);
        }

        let balance = prepared.balance;
        if (prepared.totalAmount > 0) {
          const debit = await this.walletService.truTienVi({
            accountId: customerId,
            amount: prepared.totalAmount,
            type: 'Purchase',
            orderId,
          }, conn);
          balance = debit.balance;
        }

        if (prepared.coupon) {
          const updated = await this.orderDAO.capNhatSoLanSuDungCoupon({
            couponId: prepared.coupon.CouponID,
          }, conn);
          if (!updated) throw new ConflictException('Mã giảm giá vừa hết lượt sử dụng');
        }

        for (const item of prepared.items) {
          const token = randomBytes(32).toString('hex');
          await this.orderDAO.capPhatLicense({
            licenseId: randomUUID(),
            customerId,
            gameId: item.gameId,
            accessTokenHash: createHash('sha256').update(token).digest('hex'),
          }, conn);
        }

        await this.orderDAO.xoaGioHang({ customerId }, conn);
        await this.orderDAO.xoaGameDaMuaKhoiWishlist({
          customerId,
          gameIds: prepared.items.map((item) => item.gameId),
        }, conn);

        return {
          orderId,
          orderDate: new Date().toISOString(),
          status: 'Completed',
          items: prepared.items.map((item) => ({
            gameId: item.gameId,
            title: item.title,
            coverImage: item.coverImage,
            unitPrice: item.unitPrice,
            priceAfterDiscount: item.priceAfterDiscount,
          })),
          subtotal: prepared.subtotal,
          couponCode: prepared.coupon ? prepared.coupon.Code : null,
          couponDiscount: prepared.couponDiscount,
          totalAmount: prepared.totalAmount,
          balance,
        };
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('Một trò chơi trong giỏ hàng đã được sở hữu');
      }
      throw error;
    }
  }

  async yeuCauXemDonHang(params = {}) {
    const customerId = this.customerId(params);
    const rows = await this.orderDAO.layDanhSachDonHang({ customerId });
    const orders = new Map();
    for (const row of rows) {
      let order = orders.get(row.OrderID);
      if (!order) {
        order = {
          orderId: row.OrderID,
          orderDate: row.OrderDate,
          totalAmount: Number(row.TotalAmount),
          status: row.Status,
          items: [],
        };
        orders.set(row.OrderID, order);
      }
      if (row.GameID) {
        order.items.push({
          gameId: row.GameID,
          title: row.Title,
          coverImage: row.CoverImage,
          unitPrice: Number(row.UnitPrice),
          priceAfterDiscount: Number(row.PriceAfterDiscount),
        });
      }
    }
    return [...orders.values()];
  }

  async prepareCheckout(params, conn) {
    const wallet = await this.walletDAO.truyVanSoDuKhaDung({
      accountId: params.customerId,
    }, conn);
    if (!wallet) throw new NotFoundException('Không tìm thấy ví của tài khoản');

    await this.orderDAO.khoaSanPhamTrongGio({ customerId: params.customerId }, conn);
    const rows = await this.cartDAO.layDanhSachSanPhamTrongGio({
      customerId: params.customerId,
    }, conn);
    const gameIds = rows.map((row) => row.GameID);
    if (gameIds.length) {
      const ownedGames = await this.orderDAO.layGameDaSoHuu({
        customerId: params.customerId,
        gameIds,
      }, conn);
      if (ownedGames.length) {
        throw new ConflictException('Giỏ hàng có trò chơi bạn đã sở hữu', {
          gameIds: ownedGames.map((row) => row.GameID),
        });
      }
    }
    if (rows.some((row) => row.GameStatus !== 'Approved')) {
      throw new ConflictException('Giỏ hàng có trò chơi hiện không còn được bán');
    }

    const couponCode = typeof params.couponCode === 'string'
      ? params.couponCode.trim().toUpperCase()
      : typeof params.code === 'string' ? params.code.trim().toUpperCase() : '';
    let coupon = null;
    if (couponCode) {
      coupon = await this.orderDAO.truyVanMaGiamGia({ code: couponCode }, conn);
      if (!coupon
        || Number(coupon.IsUnexpired) !== 1
        || Number(coupon.UsedCount) >= Number(coupon.UsageLimit)) {
        throw new ValidationException('Mã giảm giá không hợp lệ, đã hết hạn hoặc hết lượt sử dụng');
      }
    }

    const pricedItems = rows.map((row) => ({
      gameId: row.GameID,
      title: row.Title,
      coverImage: row.CoverImage,
      developerId: row.DeveloperID,
      priceAtAdd: Number(row.PriceAtAdd),
      basePrice: Number(row.BasePrice),
      percentOff: Number(row.PercentOff),
      unitPriceCents: toCents(row.CurrentPrice),
      unitPrice: Number(row.CurrentPrice),
    }));
    const subtotalCents = pricedItems.reduce((sum, item) => sum + item.unitPriceCents, 0n);
    const { allocations, discountCents } = allocateDiscount(pricedItems, coupon);
    const items = pricedItems.map((item) => ({
      gameId: item.gameId,
      title: item.title,
      coverImage: item.coverImage,
      genres: rows.find((row) => row.GameID === item.gameId)?.GenreNames
        ? rows.find((row) => row.GameID === item.gameId).GenreNames.split(',')
        : [],
      priceAtAdd: item.priceAtAdd,
      basePrice: item.basePrice,
      percentOff: item.percentOff,
      unitPrice: item.unitPrice,
      priceAfterDiscount: money(item.unitPriceCents - allocations.get(item.gameId)),
    }));
    const totalCents = items.reduce((sum, item) => sum + toCents(item.priceAfterDiscount), 0n);
    const totalAmount = money(totalCents);
    if (totalAmount > MAX_MONEY) throw new ValidationException('Tổng đơn hàng vượt giới hạn cho phép');

    const balance = Number(wallet.Balance);
    return {
      customerId: params.customerId,
      items,
      coupon,
      subtotal: money(subtotalCents),
      couponDiscount: money(discountCents),
      totalAmount,
      balance,
      canCheckout: balance >= totalAmount,
      shortage: balance >= totalAmount ? 0 : Number((totalAmount - balance).toFixed(2)),
    };
  }

  toPreview(prepared) {
    return {
      items: prepared.items,
      subtotal: prepared.subtotal,
      couponCode: prepared.coupon ? prepared.coupon.Code : null,
      couponDiscount: prepared.couponDiscount,
      totalAmount: prepared.totalAmount,
      balance: prepared.balance,
      canCheckout: prepared.canCheckout,
      shortage: prepared.shortage,
    };
  }

  customerId(params = {}) {
    const customerId = params.user && params.user.accountId;
    if (!customerId) throw new ValidationException('Tài khoản khách hàng không hợp lệ');
    return customerId;
  }

  /**
   * UC21. Yêu cầu hoàn tiền - sequence #2: UI → OrderService
   * Vai trò gọi: Customer
   * Luồng theo sơ đồ:
   *   #3 → OrderDAO.kiemTraTokenBanQuyen()
   *   #4 ← traVeThongTinBanQuyen()
   *   #5 → OrderDAO.kiemTraThoiGianThanhToanDuoi24h()
   *   #6 ← traVeKetQuaKiemTraThoiGian()
   *   #7 → OrderDAO.thuHoiBanQuyenGame()
   *   #8 ← xacNhanThuHoiThanhCong()
   *   #9 → WalletService.congTienHoanTraVaoVi
   *   #10 → WalletDAO.capNhatSoDuVi()
   *   #11 ← xacNhanHoanTien()
   *   #12 ← thongBaoHoanTienThanhCong()
   *   #14 ← thongBaoHoanTienThatBai()
   * @param {object} params
   */
  async guiYeuCauHoanTien(params = {}) {
    throw new NotImplementedException('OrderService.guiYeuCauHoanTien');
  }
}

module.exports = OrderService;
