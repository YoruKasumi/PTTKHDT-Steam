'use strict';

function generateGameSlug(title) {
  return String(title || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeGameSlug(slug, title) {
  const normalized = generateGameSlug(slug || title);
  if (!normalized) throw new Error('Tên game không tạo được slug hợp lệ.');
  return normalized;
}

module.exports = { generateGameSlug, normalizeGameSlug };
