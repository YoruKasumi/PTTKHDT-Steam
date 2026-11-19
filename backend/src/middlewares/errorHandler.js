const { NghiepVuException } = require('../exceptions');

function notFound(req, res) {
  res.status(404).json({ ok: false, code: 'NOT_FOUND', message: `Không có đường dẫn ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof NghiepVuException) {
    return res.status(err.status).json({ ok: false, code: err.code, message: err.message });
  }
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({
      ok: false,
      code: 'BAD_REQUEST',
      message: 'JSON request body không hợp lệ',
    });
  }
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({
      ok: false,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Request body vượt quá kích thước cho phép',
    });
  }
  console.error(err);
  res.status(500).json({ ok: false, code: 'INTERNAL', message: 'Lỗi hệ thống' });
}

module.exports = { notFound, errorHandler };
