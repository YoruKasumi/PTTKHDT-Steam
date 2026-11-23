'use strict';
const { randomUUID, randomBytes, createHash } = require('node:crypto');
const BaseService = require('./BaseService');
const {
  ConflictException,
  NghiepVuException,
  NotFoundException,
  ValidationException,
} = require('../exceptions');
const OrderDAO = require('../dao/OrderDAO');
const CartDAO = require('../dao/CartDAO');
const WalletDAO = require('../dao/WalletDAO');
const RefundDAO = require('../dao/RefundDao');

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
 * OrderService - tầng Business Logic cho Đơn hàng & Hoàn tiền.
 */
class OrderService extends BaseService {
  constructor() {
    super();
    this.orderDAO = new OrderDAO();
    this.cartDAO = new CartDAO();
    this.walletDAO = new WalletDAO();
    this.refundDAO = new RefundDAO();
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

  async layDanhSachDonHang(params = {}) {
    return this.yeuCauXemDonHang(params);
  }

  async yeuCauXemDonHang(params = {}) {
    const customerId = this.customerId(params);
    const rows = await this.orderDAO.layDanhSachDonHang({ customerId });
    const refundWindowHours = await this.refundDAO.layHanMucHoanTien();
    const orders = new Map();
    for (const row of rows) {
      let order = orders.get(row.OrderID);
      if (!order) {
        order = {
          orderId: row.OrderID,
          orderDate: row.OrderDate,
          totalAmount: Number(row.TotalAmount),
          status: row.Status,
          hoursSincePurchase: row.HoursSincePurchase !== undefined && row.HoursSincePurchase !== null ? Number(row.HoursSincePurchase) : null,
          refundWindowHours,
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
          licenseStatus: row.LicenseStatus || null,
          revokedReason: row.RevokedReason || null,
          refunded: Boolean(Number(row.IsGameRefunded)),
          canRefund: order.status !== 'Refunded'
            && row.LicenseStatus === 'Active'
            && !Boolean(Number(row.IsGameRefunded)),
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
   * Hoàn tiền cho các game được chọn trong một đơn hàng.
   * @param {object} params
   */
  async guiYeuCauHoanTien(params = {}) {
    const customerId = this.customerId(params);
    const orderId = typeof params.orderId === 'string'
      ? params.orderId.trim()
      : typeof params.id === 'string' ? params.id.trim() : '';
    if (!orderId) throw new ValidationException('orderId là bắt buộc');
    const rawGameIds = params.gameIds;
    const gameIds = Array.isArray(rawGameIds)
      ? [...new Set(rawGameIds.filter((gameId) => typeof gameId === 'string').map((gameId) => gameId.trim()).filter(Boolean))]
      : [];
    if (!Array.isArray(rawGameIds) || gameIds.length === 0 || rawGameIds.some((gameId) => typeof gameId !== 'string' || !gameId.trim())) {
      throw new NghiepVuException(
        'Vui lòng chọn ít nhất một trò chơi hợp lệ để hoàn tiền',
        422,
        'ERR_INVALID_REFUND_GAMES',
        { invalidGameIds: [] },
      );
    }
    const reason = typeof params.reason === 'string' && params.reason.trim()
      ? params.reason.trim()
      : 'Yêu cầu hoàn tiền từ khách hàng';
    if (reason.length > 500) throw new ValidationException('Lý do hoàn tiền tối đa 500 ký tự');

    const result = await this.transaction(async (conn) => {
      const order = await this.orderDAO.layDonHangDeHoanTien({ orderId, customerId }, conn);
      if (!order) {
        throw new NotFoundException('Không tìm thấy đơn hàng của bạn');
      }
      if (!['Completed', 'PartiallyRefunded'].includes(order.Status)) {
        throw new NghiepVuException('Đơn hàng không ở trạng thái có thể hoàn tiền', 422, 'ERR_INVALID_ORDER_STATUS');
      }

      const items = await this.orderDAO.layItemsDonHang({ orderId }, conn);
      if (!items.length) {
        throw new NghiepVuException('Đơn hàng không có sản phẩm hợp lệ', 422);
      }
      const itemsByGameId = new Map(items.map((item) => [item.GameID, item]));
      const invalidGameIds = gameIds.filter((gameId) => !itemsByGameId.has(gameId));
      if (invalidGameIds.length) {
        throw new NghiepVuException(
          'Một số trò chơi không thuộc đơn hàng này',
          422,
          'ERR_INVALID_REFUND_GAMES',
          { invalidGameIds },
        );
      }

      const alreadyRefundedRows = await this.refundDAO.layGameDaHoanTien({
        orderId,
        gameIds: items.map((item) => item.GameID),
      }, conn);
      const alreadyRefundedGameIds = new Set(alreadyRefundedRows.map((row) => row.GameID));
      const previouslyRefunded = gameIds.filter((gameId) => alreadyRefundedGameIds.has(gameId));
      if (previouslyRefunded.length) {
        throw new NghiepVuException(
          'Một số trò chơi trong yêu cầu đã được hoàn tiền',
          422,
          'ERR_GAME_ALREADY_REFUNDED',
          { invalidGameIds: previouslyRefunded },
        );
      }

      const licenses = await this.refundDAO.layBanQuyenGame({ customerId, gameIds }, conn);
      const licenseByGameId = new Map();
      for (const license of licenses) {
        const current = licenseByGameId.get(license.GameID);
        if (!current || (license.Status === 'Active' && license.Source === 'Purchase')) {
          licenseByGameId.set(license.GameID, license);
        }
      }
      const ineligibleGames = gameIds.filter((gameId) => {
        const license = licenseByGameId.get(gameId);
        return !license || license.Status !== 'Active' || license.Source !== 'Purchase';
      }).map((gameId) => {
        const license = licenseByGameId.get(gameId);
        return {
          gameId,
          reason: license?.RevokedReason === 'AccountSuspended'
            ? 'Bản quyền đã bị thu hồi khi tài khoản bị tạm khóa'
            : license?.RevokedReason === 'Refund'
              ? 'Bản quyền đã bị thu hồi do hoàn tiền'
              : 'Bản quyền Purchase của trò chơi không còn hoạt động',
        };
      });
      if (ineligibleGames.length) {
        throw new NghiepVuException(
          'Một số trò chơi không còn bản quyền hợp lệ để hoàn tiền',
          422,
          'ERR_LICENSE_NOT_ACTIVE',
          { ineligibleGames },
        );
      }

      const seconds = Number.isFinite(Number(order.SecondsSincePurchase))
        ? Number(order.SecondsSincePurchase)
        : Number(order.HoursSincePurchase || 0) * 3600;
      const refundWindowHours = await this.refundDAO.layHanMucHoanTien(conn);
      const hours = seconds / 3600;

      if (seconds > refundWindowHours * 3600) {
        for (const gameId of gameIds) {
          await this.refundDAO.ghiYeuCauHoanTien({
            orderId,
            gameId,
            reason,
            status: 'Rejected',
            hoursSincePurchase: hours,
          }, conn);
        }
        return {
          expired: true,
          details: { hoursSincePurchase: hours, refundWindowHours, orderId, gameIds },
        };
      }

      const selectedItems = gameIds.map((gameId) => itemsByGameId.get(gameId));
      const refundCents = selectedItems.reduce((sum, item) => sum + toCents(item.PriceAfterDiscount), 0n);
      const refundedAmount = money(refundCents);
      for (const gameId of gameIds) {
        await this.refundDAO.ghiYeuCauHoanTien({
          orderId,
          gameId,
          reason,
          status: 'Approved',
          hoursSincePurchase: hours,
        }, conn);
      }

      const refundedIds = new Set([...alreadyRefundedGameIds, ...gameIds]);
      const status = items.every((item) => refundedIds.has(item.GameID))
        ? 'Refunded'
        : 'PartiallyRefunded';
      await this.refundDAO.capNhatDonDaHoan({ orderId, status }, conn);

      const selectedLicenses = gameIds.map((gameId) => licenseByGameId.get(gameId));
      const licenseIds = selectedLicenses.map((license) => license.LicenseID);
      await this.refundDAO.thuHoiBanQuyenGame({ licenseIds }, conn);

      if (this.walletService) {
        await this.walletService.congTienHoanTraVaoVi({
          accountId: customerId,
          amount: refundedAmount,
          orderId,
          detail: `Game hoàn tiền: ${selectedItems.map((item) => `${item.Title} (${item.GameID})`).join(', ')}`,
        }, conn);
      }

      return {
        orderId,
        status,
        totalAmount: refundedAmount,
        refundedAmount,
        refundedGameIds: gameIds,
        hoursSincePurchase: hours,
        refundWindowHours,
        message: status === 'Refunded'
          ? 'Đã hoàn tiền toàn bộ các trò chơi còn lại trong đơn hàng.'
          : 'Đã hoàn tiền cho các trò chơi đã chọn. Các trò chơi còn lại vẫn được giữ trong thư viện.',
      };
    });

    if (result.expired) {
      throw new NghiepVuException(
        `Đã quá thời hạn ${result.details.refundWindowHours} giờ kể từ thời điểm thanh toán. Yêu cầu hoàn tiền bị từ chối.`,
        422,
        'ERR_REFUND_EXPIRED',
        result.details,
      );
    }
    return result;
  }
}

module.exports = OrderService;
