const multer = require('multer');
const path = require('path');
const env = require('../config/env');

/** Upload tạm vào storage/uploads; BLL chuyển sang kho chính thức qua StorageClient. */
const upload = multer({
  dest: path.join(env.storage.localDir, 'uploads'),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB cho gói cài đặt mô phỏng
});

module.exports = upload;
