'use strict';
const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const { uploadZip } = require('../middlewares/upload');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const { gameService } = require('../services');

const router = express.Router();

/** UC24/25. Kiểm tra thông tin game (tiền upload) */
router.post(
  '/kiemTraThongTinGame',
  authenticate, authorize('Developer'),
  asyncHandler(async (req, res) => ok(res, await gameService.kiemTraThongTinGame({ user: req.user, ...req.body }))),
);

/**
 * UC24. Upload Patch & Changelog — multipart/form-data với field 'buildFile'
 * POST /api/games/uploadPatch
 * Fields: gameId, versionNumber, changeLog
 * File: buildFile (.zip)
 */
router.post(
  '/uploadPatch',
  authenticate, authorize('Developer'),
  uploadZip('buildFile'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, code: 'NO_FILE', message: 'Không có tệp .zip được upload.' });
    }
    const result = await gameService.guiGoiCapNhat({
      gameId: req.body.gameId,
      versionNumber: req.body.versionNumber,
      changeLog: req.body.changeLog,
      tempFilePath: req.file.path,
      user: req.user,
    });
    return ok(res, result, 200, 'Upload patch thành công.');
  }),
);

/** UC24. Legacy route */
router.post(
  '/guiGoiCapNhat',
  authenticate, authorize('Developer'),
  uploadZip('buildFile'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, code: 'NO_FILE', message: 'Không có tệp .zip được upload.' });
    }
    const result = await gameService.guiGoiCapNhat({
      gameId: req.body.gameId,
      versionNumber: req.body.versionNumber,
      changeLog: req.body.changeLog,
      tempFilePath: req.file.path,
      user: req.user,
    });
    return ok(res, result);
  }),
);

/** UC25. Gửi yêu cầu quét virus (mô phỏng) */
router.post(
  '/guiYeuCauQuetVirus',
  authenticate, authorize('Developer'),
  asyncHandler(async (req, res) => ok(res, await gameService.guiYeuCauQuetVirus({ user: req.user, ...req.body }))),
);

/**
 * UC25. Khởi tạo dự án game mới — multipart/form-data với field 'buildFile'
 * POST /api/games/createProject
 * Fields: title, description, price, minSpec, recSpec, genreIds (JSON array), versionNumber, changeLog
 * File: buildFile (.zip)
 */
router.post(
  '/createProject',
  authenticate, authorize('Developer'),
  uploadZip('buildFile'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, code: 'NO_FILE', message: 'Không có tệp .zip được upload.' });
    }
    let genreIds = [];
    try { genreIds = JSON.parse(req.body.genreIds || '[]'); } catch (_) { genreIds = []; }

    const result = await gameService.luuHoSoDuAnGame({
      title: req.body.title,
      description: req.body.description,
      price: Number(req.body.price),
      minSpec: req.body.minSpec,
      recSpec: req.body.recSpec,
      genreIds,
      versionNumber: req.body.versionNumber || '1.0.0',
      changeLog: req.body.changeLog,
      coverImage: req.body.coverImage,
      trailerUrl: req.body.trailerUrl,
      tempFilePath: req.file.path,
      user: req.user,
    });
    return ok(res, result, 201, 'Dự án game đã được khởi tạo.');
  }),
);

/** UC25. Legacy route */
router.post(
  '/luuHoSoDuAnGame',
  authenticate, authorize('Developer'),
  uploadZip('buildFile'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, code: 'NO_FILE', message: 'Không có tệp .zip được upload.' });
    }
    let genreIds = [];
    try { genreIds = JSON.parse(req.body.genreIds || '[]'); } catch (_) { genreIds = []; }
    const result = await gameService.luuHoSoDuAnGame({
      ...req.body,
      price: Number(req.body.price),
      genreIds,
      tempFilePath: req.file.path,
      user: req.user,
    });
    return ok(res, result);
  }),
);

/** UC26. Thiết lập giá bán VND */
router.post(
  '/yeuCauThietLapGia',
  authenticate, authorize('Developer'),
  asyncHandler(async (req, res) => ok(res, await gameService.yeuCauThietLapGia({ user: req.user, ...req.body }))),
);

/** UC29. Lấy danh sách phiên bản để rollback */
router.get(
  '/:gameId/versions',
  authenticate, authorize('Developer'),
  asyncHandler(async (req, res) => ok(res, await gameService.yeuCauRollbackPhienBan({
    gameId: req.params.gameId, user: req.user,
  }))),
);

router.post(
  '/yeuCauRollbackPhienBan',
  authenticate, authorize('Developer'),
  asyncHandler(async (req, res) => ok(res, await gameService.yeuCauRollbackPhienBan({ user: req.user, ...req.body }))),
);

/** UC29. Xác nhận rollback */
router.post(
  '/:gameId/rollback',
  authenticate, authorize('Developer'),
  asyncHandler(async (req, res) => ok(res, await gameService.xacNhanKhoiPhucPhienBan({
    gameId: req.params.gameId,
    versionId: req.body.versionId,
    user: req.user,
  }))),
);

router.post(
  '/xacNhanKhoiPhucPhienBan',
  authenticate, authorize('Developer'),
  asyncHandler(async (req, res) => ok(res, await gameService.xacNhanKhoiPhucPhienBan({ user: req.user, ...req.body }))),
);

/** UC34. Cập nhật trạng thái Game */
router.post(
  '/yeuCauCapNhatTrangThaiGame',
  authenticate, authorize('Developer'),
  asyncHandler(async (req, res) => ok(res, await gameService.yeuCauCapNhatTrangThaiGame({ user: req.user, ...req.body }))),
);

/** UC35. Gỡ game khỏi hệ thống */
router.post(
  '/yeuCauGoGame',
  authenticate, authorize('Developer'),
  asyncHandler(async (req, res) => ok(res, await gameService.yeuCauGoGame({ user: req.user, ...req.body }))),
);

router.post(
  '/thucHienGoGameKhoiHeThong',
  authenticate, authorize('Developer'),
  asyncHandler(async (req, res) => ok(res, await gameService.thucHienGoGameKhoiHeThong({ user: req.user, ...req.body }))),
);

/** UC36. Ẩn game */
router.post(
  '/yeuCauAnGame',
  authenticate, authorize('Developer'),
  asyncHandler(async (req, res) => ok(res, await gameService.yeuCauAnGame({ user: req.user, ...req.body }))),
);

module.exports = router;
