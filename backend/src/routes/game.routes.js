'use strict';
const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const asyncHandler = require('../utils/asyncHandler');
const requestContext = require('../utils/requestContext');
const { ok } = require('../utils/response');
const { gameService } = require('../services');

const router = express.Router();

/** UC24. Cập nhật Patch & Changelog (#2); UC25. Khởi tạo dự án game mới (#4)  | quyền: Developer */
router.post('/kiemTraThongTinGame', authenticate, authorize('Developer'), asyncHandler(async (req, res) => ok(res, await gameService.kiemTraThongTinGame(requestContext(req)))));

/** UC24. Cập nhật Patch & Changelog (#9)  | quyền: Developer */
router.post('/guiGoiCapNhat', authenticate, authorize('Developer'), asyncHandler(async (req, res) => ok(res, await gameService.guiGoiCapNhat(requestContext(req)))));

/** UC25. Khởi tạo dự án game mới (#9)  | quyền: Developer */
router.post('/guiYeuCauQuetVirus', authenticate, authorize('Developer'), asyncHandler(async (req, res) => ok(res, await gameService.guiYeuCauQuetVirus(requestContext(req)))));

/** UC25. Khởi tạo dự án game mới (#12)  | quyền: Developer */
router.post('/luuHoSoDuAnGame', authenticate, authorize('Developer'), asyncHandler(async (req, res) => ok(res, await gameService.luuHoSoDuAnGame(requestContext(req)))));

/** UC26. Thiết lập giá bán VND (#2)  | quyền: Developer */
router.post('/yeuCauThietLapGia', authenticate, authorize('Developer'), asyncHandler(async (req, res) => ok(res, await gameService.yeuCauThietLapGia(requestContext(req)))));

/** UC29. Rollback phiên bản Build (#2)  | quyền: Developer */
router.post('/yeuCauRollbackPhienBan', authenticate, authorize('Developer'), asyncHandler(async (req, res) => ok(res, await gameService.yeuCauRollbackPhienBan(requestContext(req)))));

/** UC29. Rollback phiên bản Build (#9)  | quyền: Developer */
router.post('/xacNhanKhoiPhucPhienBan', authenticate, authorize('Developer'), asyncHandler(async (req, res) => ok(res, await gameService.xacNhanKhoiPhucPhienBan(requestContext(req)))));

/** UC34. Cập nhật trạng thái Game (#2)  | quyền: Developer */
router.post('/yeuCauCapNhatTrangThaiGame', authenticate, authorize('Developer'), asyncHandler(async (req, res) => ok(res, await gameService.yeuCauCapNhatTrangThaiGame(requestContext(req)))));

/** UC35. Gỡ game khỏi hệ thống (#2)  | quyền: Developer */
router.post('/yeuCauGoGame', authenticate, authorize('Developer'), asyncHandler(async (req, res) => ok(res, await gameService.yeuCauGoGame(requestContext(req)))));

/** UC35. Gỡ game khỏi hệ thống (#7)  | quyền: Developer */
router.post('/thucHienGoGameKhoiHeThong', authenticate, authorize('Developer'), asyncHandler(async (req, res) => ok(res, await gameService.thucHienGoGameKhoiHeThong(requestContext(req)))));

/** UC36. Ẩn game (#2)  | quyền: Developer */
router.post('/yeuCauAnGame', authenticate, authorize('Developer'), asyncHandler(async (req, res) => ok(res, await gameService.yeuCauAnGame(requestContext(req)))));

module.exports = router;
