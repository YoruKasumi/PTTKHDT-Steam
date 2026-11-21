'use strict';
const BaseService = require('./BaseService');
const DeveloperDAO = require('../dao/DeveloperDAO');
const { NghiepVuException, ConflictException, ValidationException, NotFoundException } = require('../exceptions');

class DeveloperService extends BaseService {
  constructor(developerDAO = new DeveloperDAO()) {
    super();
    this.developerDAO = developerDAO;
  }

  async guiThongTinDangKy(params = {}) {
    const accountId = params.user?.accountId || params.accountId;
    const companyName = typeof params.companyName === 'string' ? params.companyName.trim() : '';
    const bankAccount = typeof params.bankAccount === 'string' ? params.bankAccount.trim() : '';
    const feeAmount = Number(params.feeAmount || 100000);
    if (!accountId) {
      throw new ValidationException('Thiếu định danh tài khoản người dùng');
    }
    if (!companyName || companyName.length < 2 || companyName.length > 150) {
      throw new ValidationException('Tên công ty/studio phải từ 2 đến 150 ký tự', 'ERR_INVALID_PUBLISHER_INFO');
    }
    if (!bankAccount || bankAccount.length < 6 || bankAccount.length > 50) {
      throw new ValidationException('Thông tin tài khoản ngân hàng không hợp lệ (từ 6 đến 50 ký tự)', 'ERR_INVALID_PUBLISHER_INFO');
    }

    return this.transaction(async (conn) => {
      const existing = await this.developerDAO.kiemTraThongTinPhapNhan({ accountId, companyName }, conn);
      if (existing) {
        if (existing.AccountID === accountId) {
          throw new ConflictException('Tài khoản này đã đăng ký làm Nhà phát hành', 'ERR_ALREADY_DEVELOPER');
        }
        throw new ConflictException(`Tên công ty '${companyName}' đã được đăng ký trên hệ thống`, 'ERR_ALREADY_DEVELOPER');
      }

      const wallet = await this.developerDAO.laySoDuVi(accountId, conn);
      if (!wallet || Number(wallet.Balance) < feeAmount) {
        const currentBalance = wallet ? Number(wallet.Balance).toLocaleString() : 0;
        throw new NghiepVuException(
          `Số dư ví (${currentBalance} VND) không đủ để thanh toán phí đăng ký Nhà phát triển (${feeAmount.toLocaleString()} VND)`,
          400,
          'ERR_DIRECT_FEE_FAILED'
        );
      }

      const deducted = await this.developerDAO.truTienVi({ customerId: accountId, amount: feeAmount }, conn);
      if (!deducted) {
        throw new NghiepVuException('Không thể trừ phí đăng ký từ ví', 500, 'ERR_DIRECT_FEE_FAILED');
      }

      const newDev = await this.developerDAO.capNhatVaiTroTaiKhoan({
        accountId,
        companyName,
        bankAccount,
        feePaid: 1,
        verifyStatus: 'Verified'
      }, conn);

      return {
        success: true,
        message: 'Đăng ký hồ sơ Nhà phát hành thành công và đã thanh toán phí Steam Direct',
        data: {
          developerId: newDev.AccountID,
          companyName: newDev.CompanyName,
          bankAccount: newDev.BankAccount,
          feePaid: Boolean(newDev.FeePaid),
          verifyStatus: newDev.VerifyStatus,
          feeDeducted: feeAmount
        }
      };
    });
  }

  async nangCapVaiTroDeveloper(params = {}) {
    return this.guiThongTinDangKy(params);
  }

  async layThongTinHoSo(params = {}) {
    const accountId = params.user?.accountId || params.accountId;
    if (!accountId) throw new ValidationException('Thiếu accountId');
    const dev = await this.developerDAO.layDeveloperTheoAccountId(accountId);
    if (!dev) throw new NotFoundException('Không tìm thấy thông tin Nhà phát hành');
    return dev;
  }
}

module.exports = DeveloperService;
