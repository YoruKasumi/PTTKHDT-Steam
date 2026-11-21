'use strict';
const BaseService = require('./BaseService');
const PromotionDAO = require('../dao/PromotionDAO');
const crypto = require('crypto');
const { NghiepVuException, ConflictException, ValidationException, NotFoundException } = require('../exceptions');

class PromotionService extends BaseService {
  constructor(promotionDAO = new PromotionDAO()) {
    super();
    this.promotionDAO = promotionDAO;
  }

  async yeuCauLenChienDichSale(params = {}) {
    const developerId = params.user?.accountId || params.developerId;
    const { gameId, percentOff, startDate, endDate } = params;

    const discount = this.kiemTraPhanTramGiaSale({ percentOff });
    const { start, end } = this.kiemTraKhungThoiGianSale({ startDate, endDate });

    return this.transaction(async (conn) => {
      // 1. Kiểm tra game và trạng thái
      const game = await this.promotionDAO.kiemTraGameCoThuPhi({ gameId, developerId }, conn);
      if (!game) {
        throw new NotFoundException('Không tìm thấy game hoặc bạn không có quyền');
      }
      if (game.Status !== 'Approved') {
        throw new NghiepVuException('Chỉ game đã được phê duyệt phát hành mới được lên chiến dịch Sale', 400, 'ERR_GAME_NOT_APPROVED');
      }
      if (Number(game.Price) <= 0) {
        throw new NghiepVuException('Game miễn phí không thể tạo chiến dịch giảm giá', 400, 'ERR_FREE_GAME_SALE');
      }

      // 2. Kiểm tra trùng lặp thời gian Sale
      const overlap = await this.promotionDAO.kiemTraTrungLapSale({ gameId, startDate: start, endDate: end }, conn);
      if (overlap) {
        throw new ConflictException(
          `Đã có chiến dịch Sale trùng với khoảng thời gian này (từ ${new Date(overlap.StartDate).toLocaleDateString()} đến ${new Date(overlap.EndDate).toLocaleDateString()})`,
          'ERR_OVERLAPPING_CAMPAIGN'
        );
      }

      const campaignId = crypto.randomUUID();
      const campaign = await this.promotionDAO.luuLichTrinhChienDichSale({
        campaignId,
        gameId,
        percentOff: discount,
        startDate: start,
        endDate: end
      }, conn);

      return {
        success: true,
        message: `Đã thiết lập chiến dịch Sale giảm giá ${discount}% thành công`,
        data: campaign
      };
    });
  }

  async yeuCauSinhMaKichHoat(params = {}) {
    const developerId = params.user?.accountId || params.developerId;
    const { gameId, quantity } = params;

    const qty = this.kiemTraSoLuongKeyYeuCauDuoi200({ quantity });

    return this.transaction(async (conn) => {
      const game = await this.promotionDAO.kiemTraGameCoThuPhi({ gameId, developerId }, conn);
      if (!game) {
        throw new NotFoundException('Game không tồn tại hoặc bạn không sở hữu tựa game này');
      }
      if (Number(game.Price) <= 0) {
        throw new NghiepVuException('Game miễn phí không cần sinh mã key bản quyền', 400, 'ERR_FREE_GAME_KEY');
      }
      const currentUnused = await this.promotionDAO.kiemTraTongKeyChuaKichHoatDuoi2000({ gameId }, conn);
      if (currentUnused + qty > 2000) {
        throw new NghiepVuException(
          `Vượt quá hạn mức: tổng số key chưa kích hoạt tối đa là 2000 (hiện có: ${currentUnused}, yêu cầu thêm: ${qty})`,
          400,
          'ERR_TOTAL_KEY_QUOTA'
        );
      }

      const { keysToInsert, generatedCodes } = this.sinhDanhSachMaKeyNgauNhien({ gameId, quantity: qty });

      await this.promotionDAO.luuDanhSachMaKeyMoi(keysToInsert, conn);

      return {
        success: true,
        message: `Đã sinh thành công ${qty} mã kích hoạt bản quyền`,
        data: {
          gameId,
          totalCreated: qty,
          keys: generatedCodes
        }
      };
    });
  }


  kiemTraPhanTramGiaSale(params = {}) {
    const discount = parseInt(params.percentOff, 10);
    if (isNaN(discount) || discount < 5 || discount > 90) {
      throw new ValidationException('Tỷ lệ giảm giá khuyến mãi phải từ 5% đến 90%', 'ERR_INVALID_SALE_PARAMS');
    }
    return discount;
  }

  kiemTraKhungThoiGianSale(params = {}) {
    const start = new Date(params.startDate);
    const end = new Date(params.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      throw new ValidationException('Khoảng thời gian chiến dịch Sale không hợp lệ (ngày kết thúc phải sau ngày bắt đầu)');
    }
    return { start, end };
  }


  kiemTraSoLuongKeyYeuCauDuoi200(params = {}) {
    const qty = parseInt(params.quantity, 10);
    if (isNaN(qty) || qty <= 0 || qty > 200) {
      throw new ValidationException('Số lượng key sinh trong một lần phải từ 1 đến 200 mã', 'ERR_BATCH_LIMIT_EXCEEDED');
    }
    return qty;
  }

  sinhDanhSachMaKeyNgauNhien(params = {}) {
    const { gameId, quantity } = params;
    const randomSegment = () => crypto.randomBytes(3).toString('hex').toUpperCase().substring(0, 5);
    const keysToInsert = [];
    const generatedCodes = [];

    for (let i = 0; i < quantity; i++) {
      const keyCode = `${randomSegment()}-${randomSegment()}-${randomSegment()}`;
      const keyId = crypto.randomUUID();
      keysToInsert.push({ keyId, keyCode, gameId });
      generatedCodes.push(keyCode);
    }

    return { keysToInsert, generatedCodes };
  }
}

module.exports = PromotionService;
