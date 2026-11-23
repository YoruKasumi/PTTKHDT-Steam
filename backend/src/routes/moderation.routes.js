'use strict';
const express = require('express');
const { authenticate, authorize, requirePermission } = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const { moderationService } = require('../services');

const router = express.Router();
const reviewModerators = [authenticate, authorize('Admin', 'Manager'), requirePermission('review.moderate')];

/** UC38. Danh sách game chờ duyệt */
router.get(
  '/yeuCauLayHoSoGameChoDuyet',
  authenticate, authorize('Admin', 'Manager'), requirePermission('game.approve'),
  asyncHandler(async (req, res) => ok(res, await moderationService.yeuCauLayHoSoGameChoDuyet({ user: req.user, ...req.query }))),
);

/** UC38. Chi tiết hồ sơ game */
router.post(
  '/layChiTietHoSoGame',
  authenticate, authorize('Admin', 'Manager'), requirePermission('game.approve'),
  asyncHandler(async (req, res) => ok(res, await moderationService.layChiTietHoSoGame({ user: req.user, ...req.body, ...req.query }))),
);

/** UC38. Ghi audit khi hoàn tất kiểm tra hồ sơ game */
router.post(
  '/capNhatTrangThaiDaKiemTra',
  authenticate, authorize('Admin', 'Manager'), requirePermission('game.approve'),
  asyncHandler(async (req, res) => ok(res, await moderationService.capNhatTrangThaiDaKiemTra({ ...req.body, user: req.user }))),
);

/**
 * UC39/40/41. Phê duyệt hoặc từ chối hoặc gỡ bỏ game
 * Body: { gameId, decision: 'Approved'|'Rejected'|'EmergencyDelist', reason?: string }
 */
router.post(
  '/pheDuyetHoacTuChoiGame',
  authenticate, authorize('Admin', 'Manager'), requirePermission('game.approve'),
  asyncHandler(async (req, res) => {
    const gameId = req.body.gameId || req.params.gameId;
    const result = await moderationService.reviewGame({
      gameId,
      decision: req.body.decision,
      reason: req.body.reason,
      user: req.user,
    });
    return ok(res, result, 200, `Game đã được ${result.decision}.`);
  }),
);

/** UC39. Phê duyệt game (legacy) */
router.post(
  '/yeuCauPheDuyetGame',
  authenticate, authorize('Admin', 'Manager'), requirePermission('game.approve'),
  asyncHandler(async (req, res) => ok(res, await moderationService.yeuCauPheDuyetGame({ user: req.user, ...req.body }))),
);

/** UC40. Từ chối game (legacy) */
router.post(
  '/guiYeuCauTuChoiKemLyDo',
  authenticate, authorize('Admin', 'Manager'), requirePermission('game.approve'),
  asyncHandler(async (req, res) => ok(res, await moderationService.guiYeuCauTuChoiKemLyDo({ user: req.user, ...req.body }))),
);

/** UC41. Gỡ bỏ game khẩn cấp (legacy) */
router.post(
  '/yeuCauGoBoGameKhanCap',
  authenticate, authorize('Admin', 'Manager'), requirePermission('game.delist'),
  asyncHandler(async (req, res) => ok(res, await moderationService.yeuCauGoBoGameKhanCap({ user: req.user, ...req.body }))),
);

/** Lấy danh sách đánh giá của hệ thống */
router.get(
  '/layDanhSachDanhGia',
  ...reviewModerators,
  asyncHandler(async (req, res) => ok(res, await moderationService.listReviews())),
);

/** Xử lý đánh giá vi phạm */
router.post(
  '/xuLyDanhGiaViPham',
  ...reviewModerators,
  asyncHandler(async (req, res) => ok(res, await moderationService.yeuCauXuLyDanhGiaViPham({ user: req.user, ...req.body }))),
);

/** UC43. Xử lý đánh giá vi phạm (legacy) */
router.post(
  '/yeuCauXuLyDanhGiaViPham',
  ...reviewModerators,
  asyncHandler(async (req, res) => ok(res, await moderationService.yeuCauXuLyDanhGiaViPham({ user: req.user, ...req.body }))),
);

/** UC47. Danh sách nội dung bị gắn cờ */
router.get(
  '/yeuCauDanhSachNoiDungGanCo',
  authenticate, authorize('Admin', 'Manager'), requirePermission('community.moderate'),
  asyncHandler(async (req, res) => ok(res, await moderationService.yeuCauDanhSachNoiDungGanCo({ user: req.user }))),
);

/** UC47. Cập nhật trạng thái kiểm duyệt */
router.post(
  '/capNhatTrangThaiKiemDuyet',
  authenticate, authorize('Admin', 'Manager'), requirePermission('community.moderate'),
  asyncHandler(async (req, res) => ok(res, await moderationService.capNhatTrangThaiKiemDuyet({ user: req.user, ...req.body }))),
);

module.exports = router;
