'use strict';
const multer = require('multer');
const path = require('path');
const env = require('../config/env');

/** Upload tạm vào storage/uploads; BLL chuyển sang kho chính thức qua StorageClient. */
const upload = multer({
  dest: path.join(env.storage.localDir, 'uploads'),
  limits: {
    fileSize: parseInt(process.env.MAX_ZIP_SIZE_MB || '500', 10) * 1024 * 1024,
  },
});

/**
 * Middleware dành riêng cho file .zip (gói game).
 * Cho phép đặt tên field khác nhau (mặc định 'buildFile').
 * @param {string} [fieldName='buildFile']
 */
function uploadZip(fieldName = 'buildFile') {
  return multer({
    dest: path.join(env.storage.localDir, 'uploads'),
    limits: {
      fileSize: parseInt(process.env.MAX_ZIP_SIZE_MB || '500', 10) * 1024 * 1024,
    },
    fileFilter(_req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase();
      const mime = file.mimetype;
      const isZip = ext === '.zip' || mime === 'application/zip' || mime === 'application/x-zip-compressed';
      if (!isZip) {
        return cb(new Error('Chỉ chấp nhận tệp định dạng .zip'));
      }
      cb(null, true);
    },
  }).single(fieldName);
}

function uploadGameFiles() {
  const allowedExtensions = {
    buildFile: new Set(['.zip']),
    coverFile: new Set(['.jpg', '.jpeg', '.png', '.webp']),
    trailerFile: new Set(['.mp4', '.webm', '.mov']),
  };
  return multer({
    dest: path.join(env.storage.localDir, 'uploads'),
    limits: {
      fileSize: parseInt(process.env.MAX_ZIP_SIZE_MB || '500', 10) * 1024 * 1024,
      files: 3,
    },
    fileFilter(_req, file, cb) {
      const extensions = allowedExtensions[file.fieldname];
      const extension = path.extname(file.originalname).toLowerCase();
      if (!extensions || !extensions.has(extension)) {
        return cb(new Error(`Định dạng tệp không được hỗ trợ cho trường ${file.fieldname}.`));
      }
      cb(null, true);
    },
  }).fields([
    { name: 'buildFile', maxCount: 1 },
    { name: 'coverFile', maxCount: 1 },
    { name: 'trailerFile', maxCount: 1 },
  ]);
}

/** Middleware upload ảnh thông thường (avatar, banner, cover). */
const uploadImage = multer({
  dest: path.join(env.storage.localDir, 'uploads'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter(_req, file, cb) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Chỉ chấp nhận ảnh JPEG / PNG / WebP / GIF'));
    }
    cb(null, true);
  },
}).single('image');

module.exports = upload;
module.exports.uploadZip = uploadZip;
module.exports.uploadGameFiles = uploadGameFiles;
module.exports.uploadImage = uploadImage;
