const { NghiepVuException } = require('../exceptions');

function notFound(req, res) {
  res.status(404).json({ ok: false, code: 'NOT_FOUND', message: `Không có đường dẫn ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof NghiepVuException) {
    return res.status(err.status).json({ ok: false, code: err.code, message: err.message });
  }
  console.error(err);
  res.status(500).json({ ok: false, code: 'INTERNAL', message: 'Lỗi hệ thống' });
}

module.exports = { notFound, errorHandler };
