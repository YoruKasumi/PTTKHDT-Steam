const { NghiepVuException } = require('../exceptions');

function notFound(req, res) {
  res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    message: `Không có đường dẫn ${req.method} ${req.originalUrl}`,
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof NghiepVuException) {
    const body = { success: false, code: err.code, message: err.message };
    if (err.details !== undefined) body.details = err.details;
    return res.status(err.status).json(body);
  }
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      code: 'BAD_REQUEST',
      message: 'JSON request body không hợp lệ',
    });
  }
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Request body vượt quá kích thước cho phép',
    });
  }
  if (err && ['ER_DUP_ENTRY', 'ER_ROW_IS_REFERENCED_2'].includes(err.code)) {
    return res.status(409).json({
      success: false,
      code: 'CONFLICT',
      message: err.code === 'ER_DUP_ENTRY'
        ? 'Dữ liệu bị trùng với bản ghi hiện có'
        : 'Không thể xóa dữ liệu đang được bản ghi khác sử dụng',
    });
  }
  console.error(err);
  res.status(500).json({ success: false, code: 'INTERNAL', message: 'Lỗi hệ thống' });
}

module.exports = { notFound, errorHandler };
