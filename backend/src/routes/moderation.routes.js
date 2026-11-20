'use strict';
const express = require('express');
const { authenticate, authorize, requirePermission } = require('../middlewares/auth');
const { uploadZip } = require('../middlewares/upload');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const { moderationService } = require('../services');

const router = express.Router();
const reviewModerators = [authenticate, authorize('Admin', 'Manager'), requirePermission('review.moderate')];

/** UC38. Danh sách game chờ duyệt */
router.get(
  '/games',
  authenticate, authorize('Admin', 'Manager'), requirePermission('game.approve'),
  asyncHandler(async (req, res) => ok(res, await moderationService.yeuCauLayHoSoGameChoDuyet({
    user: req.user, ...req.query,
  }))),
);

router.get(
  '/yeuCauLayHoSoGameChoDuyet',
  authenticate, authorize('Admin', 'Manager'), requirePermission('game.approve'),
  asyncHandler(async (req, res) => ok(res, await moderationService.yeuCauLayHoSoGameChoDuyet({ user: req.user }))),
);

/** UC38. Chi tiết hồ sơ game */
router.get(
  '/games/:gameId',
  authenticate, authorize('Admin', 'Manager'), requirePermission('game.approve'),
  asyncHandler(async (req, res) => ok(res, await moderationService.layChiTietHoSoGame({
    gameId: req.params.gameId, user: req.user,
  }))),
);

router.post(
  '/layChiTietHoSoGame',
  authenticate, authorize('Admin', 'Manager'), requirePermission('game.approve'),
  asyncHandler(async (req, res) => ok(res, await moderationService.layChiTietHoSoGame({ user: req.user, ...req.body }))),
);

/** UC38. Lưu trạng thái đã kiểm tra */
router.post(
  '/capNhatTrangThaiDaKiemTra',
  authenticate, authorize('Admin', 'Manager'), requirePermission('game.approve'),
  asyncHandler(async (req, res) => ok(res, await moderationService.capNhatTrangThaiDaKiemTra({ user: req.user, ...req.body }))),
);

/**
 * UC39/40/41. Duyệt / Từ chối / Gỡ game — Endpoint chính (RESTful)
 * POST /api/moderation/games/:gameId/review
 * Body: { decision: 'Approved'|'Rejected'|'EmergencyDelist', reason?: string }
 */
router.post(
  '/games/:gameId/review',
  authenticate, authorize('Admin', 'Manager'), requirePermission('game.approve'),
  asyncHandler(async (req, res) => {
    const result = await moderationService.reviewGame({
      gameId: req.params.gameId,
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

/** UC43. Xử lý đánh giá vi phạm */
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

/** Danh sách đánh giá */
router.get('/reviews', ...reviewModerators, asyncHandler(async (req, res) => (
  ok(res, await moderationService.listReviews())
)));

router.patch('/reviews/:reviewId/status', ...reviewModerators, asyncHandler(async (req, res) => (
  ok(res, await moderationService.yeuCauXuLyDanhGiaViPham({ user: req.user, reviewId: req.params.reviewId, ...req.body }))
)));

module.exports = router;
