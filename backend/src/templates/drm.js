/**
 * SteamStore DRM Client — template dùng chung cho mọi game được Auto-DRM-Wrapped.
 * File này được copy vào unpacked/drm.js khi hệ thống tự động bọc DRM cho gói game thô.
 *
 * Chức năng:
 *  1. Gọi POST /api/library/verify-launch khi game khởi động.
 *  2. Hiển thị màn hình khóa nếu bị từ chối, hoặc nạp game vào iframe nếu hợp lệ.
 *
 * API công khai:
 *   window.SteamStoreDRM.bootWithDRM(onAuthorized)
 *     - onAuthorized(licenseId): callback được gọi khi xác thực thành công.
 */
(function (global) {
  'use strict';

  // ───────────────────────────────── Lấy launchToken từ URL ──────────────────────────────────

  /**
   * Đọc query param ?launchToken=... và ?gameId=... từ URL hiện tại.
   * @returns {{ launchToken: string|null, gameId: string|null }}
   */
  function parseUrlParams() {
    const params = new URLSearchParams(global.location.search);
    return {
      launchToken: params.get('launchToken'),
      gameId: params.get('gameId'),
    };
  }

  // ───────────────────────────────── Hiển thị UI ─────────────────────────────────────────────

  /** Hiển thị màn hình xác thực DRM overlay. */
  function showOverlay(message) {
    const overlay = document.getElementById('drm-overlay');
    if (overlay) {
      const msg = overlay.querySelector('#drm-message');
      if (msg) msg.textContent = message || 'Đang xác thực bản quyền SteamStore...';
      overlay.style.display = 'flex';
    }
  }

  /** Ẩn màn hình DRM overlay, hiện game. */
  function hideOverlayAndShowGame(licenseId, onAuthorized) {
    const overlay = document.getElementById('drm-overlay');
    if (overlay) overlay.style.display = 'none';
    const gameApp = document.getElementById('game-app');
    if (gameApp) gameApp.style.display = '';
    if (typeof onAuthorized === 'function') onAuthorized(licenseId);
  }

  /** Hiển thị màn hình từ chối bản quyền. */
  function showDenied(reason) {
    const overlay = document.getElementById('drm-overlay');
    if (overlay) {
      overlay.style.background = 'linear-gradient(135deg, #1a0a0a 0%, #2d0f0f 100%)';
      const spinner = overlay.querySelector('#drm-spinner');
      if (spinner) spinner.style.display = 'none';
      const msg = overlay.querySelector('#drm-message');
      if (msg) {
        msg.style.color = '#f87171';
        msg.textContent = reason || 'Xác thực bản quyền thất bại. Vui lòng mua game để tiếp tục.';
      }
      // Thêm nút đăng nhập / mua game
      const existing = overlay.querySelector('#drm-action');
      if (!existing) {
        const btn = document.createElement('a');
        btn.id = 'drm-action';
        btn.href = '/library';
        btn.style.cssText = 'display:inline-block;margin-top:16px;padding:10px 24px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;';
        btn.textContent = 'Về Thư viện';
        overlay.appendChild(btn);
      }
    }
  }

  // ───────────────────────────────── Gọi verify-launch API ───────────────────────────────────

  /**
   * Gọi POST /api/library/verify-launch để xác thực bản quyền.
   * @param {string} launchToken
   * @param {string} gameId
   * @returns {Promise<{ valid: boolean, licenseId?: string, reason?: string }>}
   */
  async function verifyLaunch(launchToken, gameId) {
    const verifyEndpoint = '/api/library/verify-launch';
    try {
      const response = await fetch(verifyEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ launchToken, gameId }),
        credentials: 'include',
      });

      const json = await response.json();

      if (json && json.data) {
        return json.data; // { valid, licenseId?, reason? }
      }
      if (json && typeof json.valid !== 'undefined') {
        return json; // fallback khi server trả về trực tiếp
      }
      return { valid: false, reason: 'Phản hồi không hợp lệ từ máy chủ' };
    } catch (err) {
      return { valid: false, reason: 'Không thể kết nối máy chủ xác thực bản quyền' };
    }
  }

  // ───────────────────────────────── Boot entry point ────────────────────────────────────────

  /**
   * Khởi động quy trình xác thực DRM.
   * Được gọi từ index.html (cổng khóa DRM).
   * @param {function} [onAuthorized] - callback(licenseId) khi xác thực thành công
   */
  async function bootWithDRM(onAuthorized) {
    showOverlay('Đang xác thực bản quyền SteamStore...');

    // 1. Lấy launchToken và gameId từ URL
    const { launchToken, gameId } = parseUrlParams();
    if (!launchToken || !gameId) {
      showDenied('Thiếu thông tin xác thực. Vui lòng khởi chạy game từ Thư viện.');
      return;
    }

    // 2. Gọi verify-launch
    showOverlay('Đang kiểm tra bản quyền...');
    const result = await verifyLaunch(launchToken, gameId);

    if (result.valid) {
      hideOverlayAndShowGame(result.licenseId, onAuthorized);
    } else {
      showDenied(result.reason || 'Bản quyền không hợp lệ hoặc đã hết hạn.');
    }
  }

  // ───────────────────────────────── Xuất API công khai ──────────────────────────────────────

  global.SteamStoreDRM = {
    bootWithDRM,
  };
})(typeof window !== 'undefined' ? window : global);
