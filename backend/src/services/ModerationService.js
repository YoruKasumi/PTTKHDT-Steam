'use strict';
const BaseService = require('./BaseService');
const ModerationDAO = require('../dao/ModerationDAO');
const GameDAO = require('../dao/GameDAO');
const { NotFoundException, NotImplementedException, ValidationException, NghiepVuException } = require('../exceptions');
const { ensureDrmWrappedOnApprove } = require('../utils/autoDrmPackager');

/**
 * ModerationService — tầng Business Logic kiểm duyệt game.
 */
class ModerationService extends BaseService {
  constructor() {
    super();
    this.moderationDAO = new ModerationDAO();
    this.gameDAO = new GameDAO();
    this.auditLogService = null;   // gắn trong services/index.js
    this.notificationService = null; // gắn trong services/index.js
  }

  // ─── Phương thức công khai ───────────────────────────────────────────────

  /**
   * UC38. Lấy danh sách game chờ duyệt.
   */
  async yeuCauLayHoSoGameChoDuyet(params = {}) {
    const rows = await this.moderationDAO.truyVanDanhSachGameChoDuyet();
    return rows.map((row) => ({
      gameId: row.GameID,
      title: row.Title,
      status: row.Status,
      price: Number(row.Price),
      releaseDate: row.ReleaseDate,
      developerName: row.DeveloperName,
      developerEmail: row.DeveloperEmail,
      versionId: row.VersionID,
      versionNumber: row.VersionNumber,
      buildFile: row.BuildFile,
      fileSize: row.FileSize ? Number(row.FileSize) : null,
      sha256: row.Sha256,
      uploadDate: row.UploadDate,
    }));
  }

  /**
   * UC38. Lấy chi tiết hồ sơ game.
   */
  async layChiTietHoSoGame(params = {}) {
    const { gameId } = params;
    if (!gameId) throw new ValidationException('Thiếu gameId.');
    const row = await this.moderationDAO.truyVanChiTietGame({ gameId });
    if (!row) throw new NotFoundException('Không tìm thấy game.');
    return {
      gameId: row.GameID,
      developerId: row.DeveloperID,
      developerName: row.DeveloperName,
      title: row.Title,
      description: row.Description,
      price: Number(row.Price),
      status: row.Status,
      coverImage: row.CoverImage,
      minSpec: row.MinSpec,
      recSpec: row.RecSpec,
      releaseDate: row.ReleaseDate,
      versionId: row.VersionID,
      versionNumber: row.VersionNumber,
      buildFile: row.BuildFile,
      fileSize: row.FileSize ? Number(row.FileSize) : null,
      sha256: row.Sha256,
      changeLog: row.ChangeLog,
      uploadDate: row.UploadDate,
    };
  }

  /**
   * UC38. Cập nhật trạng thái đã kiểm tra.
   */
  async capNhatTrangThaiDaKiemTra(params = {}) {
    throw new NotImplementedException('ModerationService.capNhatTrangThaiDaKiemTra');
  }

  /**
   * UC39/40/41. Duyệt / Từ chối / Gỡ khẩn cấp — endpoint chính POST /games/:gameId/review
   *
   * @param {object} params
   * @param {string} params.gameId
   * @param {string} params.decision  - 'Approved' | 'Rejected' | 'EmergencyDelist'
   * @param {string} [params.reason]
   * @param {object} params.user      - { accountId }
   */
  async reviewGame(params = {}) {
    const { gameId, decision, reason, user } = params;

    if (!gameId) throw new ValidationException('Thiếu gameId.');
    if (!['Approved', 'Rejected', 'EmergencyDelist'].includes(decision)) {
      throw new ValidationException('decision phải là Approved | Rejected | EmergencyDelist.');
    }

    // ck_gr_reason: Rejected bắt buộc có Reason không rỗng
    if (decision === 'Rejected' && (!reason || !reason.trim())) {
      throw new ValidationException('Lý do từ chối (reason) là bắt buộc và không được rỗng.');
    }

    // Lấy thông tin game + phiên bản hiện hành
    const gameInfo = await this.moderationDAO.kiemTraTrangThaiGameVaFile({ gameId });
    if (!gameInfo) throw new NotFoundException('Không tìm thấy game.');

    return this.transaction(async (conn) => {
      let autoWrapped = false;
      let newFileSize = gameInfo.FileSize ? Number(gameInfo.FileSize) : null;
      let newSha256 = gameInfo.Sha256;

      if (decision === 'Approved') {
        // ── Kiểm tra Trường hợp A / B / C ──
        const drmResult = await ensureDrmWrappedOnApprove({
          gameId,
          versionId: gameInfo.VersionID,
          versionNumber: gameInfo.VersionNumber,
          gameTitle: gameInfo.Title,
        });

        newFileSize = drmResult.fileSize;
        newSha256 = drmResult.sha256;
        autoWrapped = drmResult.autoWrapped;

        // Cập nhật FileSize + Sha256 nếu đã bọc DRM
        if (autoWrapped && gameInfo.VersionID) {
          await this.gameDAO.capNhatFileInfoSauDrm({
            versionId: gameInfo.VersionID,
            fileSize: newFileSize,
            sha256: newSha256,
          }, conn);
        }

        // Cập nhật GAME.Status = 'Approved'
        await this.gameDAO.pheDuyetGame({ gameId }, conn);

      } else if (decision === 'Rejected') {
        await this.gameDAO.tuChoiGame({ gameId }, conn);

      } else if (decision === 'EmergencyDelist') {
        await this.gameDAO.delistedGame({ gameId }, conn);
      }

      // Ghi GAMEREVIEW
      await this.moderationDAO.capNhatTrangThaiPhatHanhStore({
        gameId,
        managerId: user.accountId,
        decision,
        reason: reason ? reason.trim() : null,
      }, conn);

      // Ghi AUDITLOG
      const auditDetail = decision === 'Approved' && autoWrapped
        ? JSON.stringify({ decision, autoWrapped: true, message: 'Hệ thống đã tự động bọc DRM cho gói game thô.' })
        : JSON.stringify({ decision, reason: reason || null });

      if (this.auditLogService) {
        await this.auditLogService.recordLog({
          accountId: user.accountId,
          action: `game.${decision.toLowerCase()}`,
          target: `GAME:${gameId}`,
          detail: auditDetail,
        }, conn);
      }

      // Gửi NOTIFICATION cho Developer
      const notifContent = decision === 'Approved'
        ? `Game "${gameInfo.Title}" của bạn đã được phê duyệt và phát hành trên SteamStore${autoWrapped ? ' (DRM tự động được áp dụng bởi nền tảng)' : ''}.`
        : decision === 'Rejected'
          ? `Game "${gameInfo.Title}" của bạn đã bị từ chối. Lý do: ${reason}`
          : `Game "${gameInfo.Title}" đã bị gỡ bỏ khẩn cấp${reason ? `. Lý do: ${reason}` : ''}.`;

      await this.moderationDAO.taoThongBaoChoDeveloper({
        accountId: gameInfo.DeveloperID,
        type: `game.${decision.toLowerCase()}`,
        content: notifContent,
      }, conn);

      return {
        gameId,
        decision,
        autoWrapped,
        fileSize: newFileSize,
        sha256: newSha256,
        message: `Game đã được ${decision === 'Approved' ? 'phê duyệt' : decision === 'Rejected' ? 'từ chối' : 'gỡ bỏ khẩn cấp'}.`,
      };
    });
  }

  /**
   * UC39. Phê duyệt game (legacy, gọi reviewGame).
   */
  async yeuCauPheDuyetGame(params = {}) {
    return this.reviewGame({ ...params, decision: 'Approved' });
  }

  /**
   * UC40. Từ chối game (legacy).
   */
  async guiYeuCauTuChoiKemLyDo(params = {}) {
    if (!params.reason || !params.reason.trim()) {
      throw new ValidationException('Lý do từ chối là bắt buộc.');
    }
    return this.reviewGame({ ...params, decision: 'Rejected' });
  }

  /**
   * UC41. Gỡ bỏ game khẩn cấp.
   */
  async yeuCauGoBoGameKhanCap(params = {}) {
    return this.reviewGame({ ...params, decision: 'EmergencyDelist' });
  }

  /**
   * UC43. Xử lý đánh giá vi phạm.
   */
  async yeuCauXuLyDanhGiaViPham(params = {}) {
    const status = params.status;
    const reason = typeof params.reason === 'string' ? params.reason.trim() : '';
    if (!['Visible', 'Hidden', 'Removed'].includes(status)) {
      throw new ValidationException('Trạng thái đánh giá không hợp lệ');
    }
    if (!reason || reason.length > 500) {
      throw new ValidationException('Lý do xử lý là bắt buộc và tối đa 500 ký tự');
    }
    return this.transaction(async (conn) => {
      const review = await this.moderationDAO.layDanhGiaTheoId({ reviewId: params.reviewId }, conn);
      if (!review) throw new NotFoundException('Không tìm thấy đánh giá');
      await this.moderationDAO.capNhatTrangThaiDanhGia({ reviewId: params.reviewId, status }, conn);
      if (this.auditLogService) {
        await this.auditLogService.recordLog({
          accountId: params.user.accountId,
          action: 'REVIEW_MODERATE',
          target: `REVIEW:${params.reviewId}`,
          detail: JSON.stringify({ previousStatus: review.Status, status, reason }),
        }, conn);
      }
      await this.moderationDAO.taoThongBaoDanhGia({
        accountId: review.CustomerID,
        type: 'ReviewModeration',
        content: `Đánh giá của bạn đã được cập nhật: ${status}. Lý do: ${reason}`,
      }, conn);
      return { reviewId: params.reviewId, status, reason };
    });
  }

  async listReviews() {
    const rows = await this.moderationDAO.listReviews();
    return rows.map((row) => ({
      reviewId: row.ReviewID,
      customerId: row.CustomerID,
      username: row.Username,
      gameId: row.GameID,
      gameTitle: row.GameTitle,
      rating: Number(row.Rating),
      content: row.Content,
      reviewDate: row.ReviewDate,
      status: row.Status,
    }));
  }

  /**
   * UC47. Danh sách nội dung bị gắn cờ.
   */
  async yeuCauDanhSachNoiDungGanCo(params = {}) {
    throw new NotImplementedException('ModerationService.yeuCauDanhSachNoiDungGanCo');
  }

  /**
   * UC47. Cập nhật trạng thái kiểm duyệt.
   */
  async capNhatTrangThaiKiemDuyet(params = {}) {
    throw new NotImplementedException('ModerationService.capNhatTrangThaiKiemDuyet');
  }

  // ─── Phương thức nội bộ ──────────────────────────────────────────────────

  async kiemTraLyDoKhongDuocDeTrong(params = {}) {
    throw new NotImplementedException('ModerationService.kiemTraLyDoKhongDuocDeTrong');
  }
}

module.exports = ModerationService;
