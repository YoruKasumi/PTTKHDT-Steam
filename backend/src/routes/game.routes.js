'use strict';
const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const { uploadGameFiles } = require('../middlewares/upload');
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

/** UC24. Upload Patch & Changelog — multipart/form-data */
router.post(
  '/guiGoiCapNhat',
  authenticate, authorize('Developer'),
  uploadGameFiles(),
  asyncHandler(async (req, res) => {
    const files = req.files || {};
    const buildFile = files.buildFile && files.buildFile[0];
    if (!buildFile) {
      return res.status(400).json({ success: false, code: 'NO_FILE', message: 'Không có tệp .zip được upload.' });
    }
    const result = await gameService.guiGoiCapNhat({
      gameId: req.body.gameId,
      versionNumber: req.body.versionNumber,
      changeLog: req.body.changeLog,
      tempFilePath: buildFile.path,
      coverFile: files.coverFile && files.coverFile[0],
      trailerFile: files.trailerFile && files.trailerFile[0],
      user: req.user,
    });
    return ok(res, result, 200, 'Upload patch thành công.');
  }),
);

router.post(
  '/capNhatThongTinGame',
  authenticate, authorize('Developer'),
  asyncHandler(async (req, res) => ok(res, await gameService.capNhatThongTinGame({ ...req.body, user: req.user }))),
);

/** UC25. Khởi tạo dự án game mới — multipart/form-data */
router.post(
  '/luuHoSoDuAnGame',
  authenticate, authorize('Developer'),
  uploadGameFiles(),
  asyncHandler(async (req, res) => {
    const files = req.files || {};
    const buildFile = files.buildFile && files.buildFile[0];
    if (!buildFile) {
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
      slug: req.body.slug,
      genreIds,
      versionNumber: req.body.versionNumber || '1.0.0',
      changeLog: req.body.changeLog,
      coverImage: req.body.coverImage,
      trailerUrl: req.body.trailerUrl,
      coverFile: files.coverFile && files.coverFile[0],
      trailerFile: files.trailerFile && files.trailerFile[0],
      tempFilePath: buildFile.path,
      user: req.user,
    });
    return ok(res, result, 201, 'Dự án game đã được khởi tạo.');
  }),
);

/** UC26. Thiết lập giá bán VND */
router.post(
  '/yeuCauThietLapGia',
  authenticate, authorize('Developer'),
  asyncHandler(async (req, res) => ok(res, await gameService.yeuCauThietLapGia({ user: req.user, ...req.body }))),
);

/** Lấy danh sách dự án game của Developer */
router.get(
  '/layDanhSachDuAnCuaToi',
  authenticate, authorize('Developer'),
  asyncHandler(async (req, res) => ok(res, await gameService.layDanhSachDuAnCuaToi({ user: req.user }))),
);

/** UC29. Lấy danh sách phiên bản để rollback */
router.get(
  '/layDanhSachPhienBan',
  authenticate, authorize('Developer'),
  asyncHandler(async (req, res) => {
    const gameId = req.query.gameId || req.params.gameId || req.body.gameId;
    return ok(res, await gameService.yeuCauRollbackPhienBan({ gameId, user: req.user }));
  }),
);

router.post(
  '/yeuCauRollbackPhienBan',
  authenticate, authorize('Developer'),
  asyncHandler(async (req, res) => ok(res, await gameService.yeuCauRollbackPhienBan({ user: req.user, ...req.body }))),
);

/** UC29. Xác nhận rollback phiên bản */
router.post(
  '/xacNhanKhoiPhucPhienBan',
  authenticate, authorize('Developer'),
  asyncHandler(async (req, res) => {
    const gameId = req.body.gameId || req.params.gameId;
    const versionId = req.body.versionId;
    return ok(res, await gameService.xacNhanKhoiPhucPhienBan({ gameId, versionId, user: req.user }));
  }),
);

/** UC34. Cập nhật trạng thái Game */
router.post(
  '/yeuCauCapNhatTrangThaiGame',
  authenticate, authorize('Developer'),
  asyncHandler(async (req, res) => ok(res, await gameService.yeuCauCapNhatTrangThaiGame({ ...req.body, user: req.user }))),
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
