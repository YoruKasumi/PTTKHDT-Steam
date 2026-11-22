'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { ConflictException, NotImplementedException } = require('../exceptions');
const { normalizeGameSlug } = require('../utils/gameSlug');
const {
  DEFAULT_DEVELOPER_ID,
  PRIVATE_STORAGE_ROOT,
  PUBLIC_STORAGE_ROOT,
  getGameBuildKey,
  getGameVersionDir,
  resolveStorageKey,
  safeStorageSegment,
} = require('../utils/storagePaths');

const ASSET_EXTENSIONS = {
  cover: new Set(['.jpg', '.jpeg', '.png', '.webp']),
  trailer: new Set(['.mp4', '.webm', '.mov']),
};

function buildPublicAssetName(slug, assetType, originalName) {
  if (!Object.prototype.hasOwnProperty.call(ASSET_EXTENSIONS, assetType)) {
    throw new Error('Loại media game không hợp lệ.');
  }
  const normalizedSlug = normalizeGameSlug(slug);
  safeStorageSegment(normalizedSlug, 'slug');
  const extension = path.extname(originalName || '').toLowerCase();
  if (!ASSET_EXTENSIONS[assetType].has(extension)) {
    throw new Error(`Định dạng ${assetType === 'cover' ? 'ảnh bìa' : 'trailer'} không được hỗ trợ.`);
  }
  return `${normalizedSlug}-${assetType}${extension}`;
}

function moveFile(sourcePath, destinationPath) {
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.copyFileSync(sourcePath, destinationPath);
  fs.unlinkSync(sourcePath);
}

/**
 * Local storage adapter. Public media and private developer builds have
 * separate roots so a future object-store adapter can preserve this contract.
 */
class StorageClient {
  async luuAnhDaiDien(params = {}) {
    throw new NotImplementedException('StorageClient.luuAnhDaiDien');
  }

  async luuTruBanVa(params = {}) {
    const {
      tempFilePath,
      developerId = DEFAULT_DEVELOPER_ID,
      gameId,
      versionNumber,
    } = params;
    if (!tempFilePath || !fs.existsSync(tempFilePath)) {
      throw new Error('Không tìm thấy tệp build tạm để lưu trữ.');
    }

    const versionDir = getGameVersionDir(developerId, gameId, versionNumber);
    const dest = path.join(versionDir, 'build.zip');
    moveFile(tempFilePath, dest);
    return {
      buildFileKey: getGameBuildKey(developerId, gameId, versionNumber),
      localPath: dest,
    };
  }

  async luuAnhGame(params = {}) {
    return this.savePublicGameAsset({ ...params, assetType: 'cover' });
  }

  async luuTrailerGame(params = {}) {
    return this.savePublicGameAsset({ ...params, assetType: 'trailer' });
  }

  async savePublicGameAsset(params = {}) {
    const { tempFilePath, assetType } = params;
    if (!tempFilePath || !fs.existsSync(tempFilePath)) {
      throw new Error('Không tìm thấy tệp media tạm để lưu trữ.');
    }
    const slug = normalizeGameSlug(params.slug, params.title);
    const filename = buildPublicAssetName(slug, assetType, params.originalName || tempFilePath);
    let maxSize = 10 * 1024 * 1024;
    if (assetType === 'trailer') {
      const maxTrailerSizeMb = Number(process.env.MAX_TRAILER_SIZE_MB || 500);
      if (!Number.isFinite(maxTrailerSizeMb) || maxTrailerSizeMb <= 0) {
        throw new Error('MAX_TRAILER_SIZE_MB phải là số dương hợp lệ.');
      }
      maxSize = maxTrailerSizeMb * 1024 * 1024;
    }
    if (fs.statSync(tempFilePath).size > maxSize) {
      throw new Error(`Tệp ${assetType === 'cover' ? 'ảnh bìa' : 'trailer'} vượt quá giới hạn dung lượng.`);
    }

    const key = path.posix.join('games', slug, filename);
    const localPath = resolveStorageKey(PUBLIC_STORAGE_ROOT, key);
    if (fs.existsSync(localPath) && params.replace !== true) {
      throw new ConflictException('Tệp media công khai đã tồn tại; hãy dùng một slug game khác.');
    }
    moveFile(tempFilePath, localPath);
    return {
      key,
      localPath,
      publicUrl: `/api/media/${key}`,
      filename,
    };
  }

  async taiLenTepCaiDatTam(params = {}) {
    return { tempFilePath: params.tempFilePath };
  }

  async luuTepAnhBanner(params = {}) {
    throw new NotImplementedException('StorageClient.luuTepAnhBanner');
  }

  localPathFromKey(objectKey) {
    return resolveStorageKey(PRIVATE_STORAGE_ROOT, objectKey);
  }

  publicPathFromKey(objectKey) {
    return resolveStorageKey(PUBLIC_STORAGE_ROOT, objectKey);
  }
}

module.exports = StorageClient;
module.exports.buildPublicAssetName = buildPublicAssetName;
