'use strict';
const { randomUUID } = require('node:crypto');
const BaseService = require('./BaseService');
const {
  ConflictException,
  NghiepVuException,
  NotFoundException,
  ValidationException,
} = require('../exceptions');
const WalletDAO = require('../dao/WalletDAO');
const PaymentGatewayClient = require('../integrations/PaymentGatewayClient');
const BankClient = require('../integrations/BankClient');

const MAX_MONEY = 9999999999999.99;

/**
 * WalletService - tầng Business Logic cho Ví điện tử & Giao dịch.
 */
class WalletService extends BaseService {
  constructor() {
    super();
    this.walletDAO = new WalletDAO();
    this.paymentGatewayClient = new PaymentGatewayClient();
    this.bankClient = new BankClient();
    this.authService = null; // được gắn trong services/index.js
    this.gameService = null; // được gắn trong services/index.js
  }

  // ---------------------------------------------------------------- Phương thức công khai (Route / Service khác gọi)

  /**
   * UC12. Xem số dư ví - sequence #2: UI → WalletService
   * Vai trò gọi: Customer
   * @param {object} params
   */
  async yeuCauXemSoDu(params = {}) {
    const customerId = this.customerId(params);
    const wallet = await this.walletDAO.truyVanSoDuVi({ accountId: customerId });
    if (!wallet) throw new NotFoundException('Không tìm thấy thông tin ví của tài khoản');
    return {
      walletId: wallet.WalletID,
      customerId: wallet.CustomerID,
      balance: Number(wallet.Balance),
      currency: wallet.Currency || 'VND',
    };
  }

  /**
   * UC13. Nạp tiền vào ví - sequence #2: UI → WalletService
   * Nạp tiền qua PaymentGatewayClient:
   *  - Thành công -> cộng WALLET + ghi TRANSACTION Status='Success'
   *  - Thất bại -> ghi TRANSACTION Status='Failed'
   * @param {object} params
   */
  async guiYeuCauNapTien(params = {}) {
    const customerId = this.customerId(params);
    const amount = Number(params.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_MONEY || Number(amount.toFixed(2)) !== amount) {
      throw new ValidationException('Số tiền nạp phải là số dương hợp lệ, tối đa 2 chữ số thập phân');
    }

    const wallet = await this.walletDAO.truyVanSoDuVi({ accountId: customerId });
    if (!wallet) throw new NotFoundException('Không tìm thấy thông tin ví của tài khoản');

    const paymentResult = await this.paymentGatewayClient.yeuCauXuLyGiaoDich({
      amount,
      customerId,
      paymentMethod: params.paymentMethod || params.method || 'VietQR',
      simulateFailure: Boolean(params.simulateFailure),
    });

    const transactionId = randomUUID();

    if (!paymentResult || !paymentResult.success) {
      await this.walletDAO.luuLichSuGiaoDich({
        transactionId,
        walletId: wallet.WalletID,
        type: 'Deposit',
        amount,
        status: 'Failed',
      });
      throw new NghiepVuException(
        paymentResult?.message || 'Giao dịch nạp tiền bị từ chối từ cổng thanh toán',
        422,
        'ERR_PAYMENT_FAILED',
      );
    }

    return this.transaction(async (conn) => {
      const lockedWallet = await this.walletDAO.truyVanSoDuKhaDung({ accountId: customerId }, conn);
      const prevBalance = Number(lockedWallet.Balance);

      await this.walletDAO.capNhatSoDuVi({
        walletId: wallet.WalletID,
        amount,
        operation: 'credit',
      }, conn);

      await this.walletDAO.luuLichSuGiaoDich({
        transactionId,
        walletId: wallet.WalletID,
        type: 'Deposit',
        amount,
        status: 'Success',
      }, conn);

      return {
        success: true,
        transactionId,
        amount,
        balance: prevBalance + amount,
        message: 'Nạp tiền vào ví thành công',
      };
    });
  }

  /**
   * UC14. Rút tiền - sequence #2: UI → WalletService
   * Rút tiền qua BankClient:
   *  - Kiểm tra Balance >= Amount
   *  - Chuyển khoản thành công -> trừ WALLET + ghi TRANSACTION Status='Success'
   * @param {object} params
   */
  async guiYeuCauRutTien(params = {}) {
    const customerId = this.customerId(params);
    const amount = Number(params.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_MONEY || Number(amount.toFixed(2)) !== amount) {
      throw new ValidationException('Số tiền rút phải là số dương hợp lệ, tối đa 2 chữ số thập phân');
    }

    const bankInfo = typeof params.bankInfo === 'string' ? params.bankInfo.trim() : 'Ngân hàng mặc định';

    return this.transaction(async (conn) => {
      const wallet = await this.walletDAO.truyVanSoDuKhaDung({ accountId: customerId }, conn);
      if (!wallet) throw new NotFoundException('Không tìm thấy thông tin ví của tài khoản');

      const available = Number(wallet.Balance);
      if (available < amount) {
        throw new NghiepVuException(
          'Số dư ví không đủ để thực hiện rút tiền',
          422,
          'ERR_INSUFFICIENT_BALANCE',
          { required: amount, available },
        );
      }

      const bankResult = await this.bankClient.yeuCauChuyenTien({
        amount,
        bankInfo,
        customerId,
        simulateFailure: Boolean(params.simulateFailure),
      });

      if (!bankResult || !bankResult.success) {
        throw new NghiepVuException(
          bankResult?.message || 'Yêu cầu chuyển tiền bị từ chối bởi hệ thống ngân hàng',
          422,
          'ERR_BANK_TRANSFER_FAILED',
        );
      }

      const updated = await this.walletDAO.capNhatSoDuVi({
        walletId: wallet.WalletID,
        amount,
        operation: 'debit',
      }, conn);

      if (!updated) {
        throw new ConflictException('Số dư ví đã thay đổi; vui lòng thử lại');
      }

      const transactionId = randomUUID();
      await this.walletDAO.luuLichSuGiaoDich({
        transactionId,
        walletId: wallet.WalletID,
        type: 'Withdraw',
        amount,
        status: 'Success',
      }, conn);

      return {
        success: true,
        transactionId,
        amount,
        balance: available - amount,
        message: 'Rút tiền từ ví thành công',
      };
    });
  }

  /**
   * UC15. Thanh toán - sequence #8: Service khác → WalletService
   * @param {object} params
   */
  async kiemTraSoDuKhaDung(params = {}) {
    const customerId = this.customerId(params);
    const wallet = await this.walletDAO.truyVanSoDuVi({ accountId: customerId });
    if (!wallet) throw new NotFoundException('Không tìm thấy ví của tài khoản');
    return {
      balance: Number(wallet.Balance),
      currency: wallet.Currency || 'VND',
    };
  }

  /**
   * UC15. Thanh toán - sequence #15: UI → WalletService
   */
  async chuyenHuongNapTien(params = {}) {
    return {
      redirectUrl: '/wallet',
      message: 'Chuyển hướng đến trang Ví điện tử để nạp tiền',
    };
  }

  /**
   * Deducts a purchase or Steam Direct fee and records it atomically.
   * Pass conn to participate in an existing transaction; Fee records have no OrderID.
   * @param {{ accountId: string, amount: number|string, type?: 'Purchase'|'Fee', orderId?: string }} params
   * @param {object|null} conn
   */
  async truTienVi(params = {}, conn = null) {
    const accountId = typeof params.accountId === 'string' ? params.accountId.trim() : '';
    const amount = Number(params.amount);
    const type = params.type === undefined ? 'Purchase' : params.type;
    if (!accountId) throw new ValidationException('accountId là bắt buộc');
    if (!Number.isFinite(amount) || amount <= 0
      || amount > MAX_MONEY || Number(amount.toFixed(2)) !== amount) {
      throw new ValidationException('amount phải là số dương, tối đa 2 chữ số thập phân');
    }
    if (!['Purchase', 'Fee'].includes(type)) {
      throw new ValidationException('type chỉ được là Purchase hoặc Fee');
    }

    const operation = async (conn) => {
      const wallet = await this.walletDAO.truyVanSoDuKhaDung({ accountId }, conn);
      if (!wallet) throw new NotFoundException('Không tìm thấy ví của tài khoản');

      const available = Number(wallet.Balance);
      if (available < amount) {
        throw new ValidationException('Số dư ví không đủ để thanh toán', {
          required: amount,
          available,
        });
      }

      const updated = await this.walletDAO.capNhatSoDuVi({
        walletId: wallet.WalletID,
        amount,
        operation: 'debit',
      }, conn);
      if (!updated) {
        throw new ConflictException('Số dư ví đã thay đổi; vui lòng thử lại');
      }

      const transactionId = randomUUID();
      await this.walletDAO.luuLichSuGiaoDich({
        transactionId,
        walletId: wallet.WalletID,
        orderId: params.orderId || null,
        type,
        amount,
        status: 'Success',
      }, conn);

      return {
        transactionId,
        walletId: wallet.WalletID,
        amount,
        type,
        balance: available - amount,
      };
    };

    return conn ? operation(conn) : this.transaction(operation);
  }

  /**
   * UC20. Xem lịch sử giao dịch - sequence #2: UI → WalletService
   * Tra cứu giao dịch có lọc theo loại, khoảng ngày, tên sản phẩm.
   * @param {object} params
   */
  async yeuCauXemLichSuGiaoDich(params = {}) {
    const customerId = this.customerId(params);
    const filters = {
      customerId,
      type: params.type || params.transactionType,
      from: params.from || params.fromDate,
      to: params.to || params.toDate,
      keyword: params.keyword || params.productName,
      page: params.page ? Number(params.page) : 1,
      limit: params.limit ? Number(params.limit) : 50,
    };

    const rows = await this.walletDAO.layDanhSachGiaoDich(filters);
    return rows.map((row) => ({
      id: row.TransID,
      transId: row.TransID,
      orderId: row.OrderID,
      type: row.Type,
      amount: Number(row.Amount),
      date: row.TransDate,
      transDate: row.TransDate,
      status: row.Status,
      productNames: row.ProductNames || null,
    }));
  }

  /**
   * UC20. Xem lịch sử giao dịch - sequence #8: UI → WalletService
   * @param {object} params
   */
  async yeuCauXemChiTiet(params = {}) {
    const customerId = this.customerId(params);
    const transactionId = params.transactionId || params.id;
    if (!transactionId) throw new ValidationException('transactionId là bắt buộc');

    const row = await this.walletDAO.layChiTietGiaoDich({ customerId, transactionId });
    if (!row) throw new NotFoundException('Không tìm thấy giao dịch');
    return {
      id: row.TransID,
      transId: row.TransID,
      orderId: row.OrderID,
      type: row.Type,
      amount: Number(row.Amount),
      date: row.TransDate,
      transDate: row.TransDate,
      status: row.Status,
      productNames: row.ProductNames || null,
    };
  }

  /**
   * UC20. Xem lịch sử giao dịch - sequence #14: UI → WalletService
   * @param {object} params
   */
  async guiTieuChiTimKiem(params = {}) {
    return this.yeuCauXemLichSuGiaoDich(params);
  }

  /**
   * UC21. Yêu cầu hoàn tiền - sequence #9: Service khác → WalletService
   * Cộng tiền hoàn trả vào ví và ghi giao dịch 'Refund'.
   * Không ghi TRANSACTION nếu amount === 0 (do CHECK amount > 0).
   * @param {{ accountId: string, amount: number, orderId?: string, detail?: string }} params
   * @param {object|null} conn
   */
  async congTienHoanTraVaoVi(params = {}, conn = null) {
    const accountId = typeof params.accountId === 'string' ? params.accountId.trim() : '';
    const amount = Number(params.amount);
    if (!accountId) throw new ValidationException('accountId là bắt buộc');
    if (!Number.isFinite(amount) || amount < 0) {
      throw new ValidationException('Số tiền hoàn trả không hợp lệ');
    }

    const operation = async (conn) => {
      const wallet = await this.walletDAO.truyVanSoDuKhaDung({ accountId }, conn);
      if (!wallet) throw new NotFoundException('Không tìm thấy ví của tài khoản');

      if (amount > 0) {
        await this.walletDAO.capNhatSoDuVi({
          walletId: wallet.WalletID,
          amount,
          operation: 'credit',
        }, conn);

        const transactionId = randomUUID();
        await this.walletDAO.luuLichSuGiaoDich({
          transactionId,
          walletId: wallet.WalletID,
          orderId: params.orderId || null,
          type: 'Refund',
          amount,
          status: 'Success',
          detail: params.detail || null,
        }, conn);
      }

      return {
        walletId: wallet.WalletID,
        amount,
        balance: Number(wallet.Balance) + amount,
      };
    };

    return conn ? operation(conn) : this.transaction(operation);
  }

  customerId(params = {}) {
    const customerId = params.user && params.user.accountId;
    if (!customerId) throw new ValidationException('Tài khoản khách hàng không hợp lệ');
    return customerId;
  }
}

module.exports = WalletService;
