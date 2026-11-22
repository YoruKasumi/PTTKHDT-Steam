'use strict';

const path = require('node:path');
const env = require('../config/env');

const STORAGE_ROOT = path.resolve(env.storage.localDir);
const PUBLIC_STORAGE_ROOT = path.join(STORAGE_ROOT, 'public');
const PRIVATE_STORAGE_ROOT = path.join(STORAGE_ROOT, 'private');
const TEMP_STORAGE_ROOT = path.join(STORAGE_ROOT, 'uploads');
const LEGACY_BUILDS_ROOT = path.join(STORAGE_ROOT, 'builds');
const PACKAGED_PUBLIC_ROOT = path.resolve(__dirname, '../../assets/public');
const DEFAULT_DEVELOPER_ID = 'unassigned';

function safeStorageSegment(value, label) {
  const segment = String(value || '');
  if (!/^[a-zA-Z0-9._-]+$/.test(segment) || segment === '.' || segment === '..') {
    throw new Error(`${label} chứa ký tự không hợp lệ.`);
  }
  return segment;
}

function getGameVersionDir(developerId, gameId, versionNumber) {
  return path.join(
    PRIVATE_STORAGE_ROOT,
    'developers',
    safeStorageSegment(developerId || DEFAULT_DEVELOPER_ID, 'developerId'),
    'games',
    safeStorageSegment(gameId, 'gameId'),
    safeStorageSegment(versionNumber, 'versionNumber'),
  );
}

function getGameBuildKey(developerId, gameId, versionNumber) {
  return [
    'developers',
    safeStorageSegment(developerId || DEFAULT_DEVELOPER_ID, 'developerId'),
    'games',
    safeStorageSegment(gameId, 'gameId'),
    safeStorageSegment(versionNumber, 'versionNumber'),
    'build.zip',
  ].join('/');
}

function getLegacyGameVersionDir(gameId, versionNumber) {
  return path.join(
    LEGACY_BUILDS_ROOT,
    'games',
    safeStorageSegment(gameId, 'gameId'),
    safeStorageSegment(versionNumber, 'versionNumber'),
  );
}

function resolveStorageKey(root, key) {
  const resolvedRoot = path.resolve(root);
  const resolvedPath = path.resolve(resolvedRoot, String(key || ''));
  if (resolvedPath !== resolvedRoot && !resolvedPath.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error('Storage key vượt ra ngoài thư mục lưu trữ.');
  }
  return resolvedPath;
}

module.exports = {
  DEFAULT_DEVELOPER_ID,
  LEGACY_BUILDS_ROOT,
  PACKAGED_PUBLIC_ROOT,
  PRIVATE_STORAGE_ROOT,
  PUBLIC_STORAGE_ROOT,
  TEMP_STORAGE_ROOT,
  getGameBuildKey,
  getLegacyGameVersionDir,
  getGameVersionDir,
  resolveStorageKey,
  safeStorageSegment,
};
