/**
 * SteamStore DRM Client — template dùng chung cho mọi game được Auto-DRM-Wrapped.
 * File này được copy vào unpacked/drm.js khi hệ thống tự động bọc DRM cho gói game thô.
 *
 * Chức năng:
 *  1. Sinh DeviceFingerprint SHA-256 (64 ký tự hex) duy nhất cho trình duyệt/thiết bị, lưu localStorage.
 *  2. Gọi POST /api/library/verify-launch khi game khởi động.
 *  3. Hiển thị màn hình khóa nếu bị từ chối, hoặc nạp game vào iframe nếu hợp lệ.
 *
 * API công khai:
 *   window.SteamStoreDRM.bootWithDRM(onAuthorized)
 *     - onAuthorized(licenseId): callback được gọi khi xác thực thành công.
 */
(function (global) {
  'use strict';

  // ───────────────────────────────── Sinh DeviceFingerprint ──────────────────────────────────

  /**
   * Băm chuỗi thành SHA-256 hex 64 ký tự.
   * Ưu tiên dùng SubtleCrypto (HTTPS / localhost), fallback về FNV-1a 256-bit thuần JS khi
   * chạy trên HTTP LAN (không có SubtleCrypto).
   * @param {string} str
   * @returns {Promise<string>} Chuỗi hex 64 ký tự
   */
  async function sha256Hex(str) {
    if (global.crypto && global.crypto.subtle) {
      const encoded = new TextEncoder().encode(str);
      const hashBuffer = await global.crypto.subtle.digest('SHA-256', encoded);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    // Fallback: FNV-1a-like 256-bit (8 × 32-bit words)
    const fnv = (data, offset, prime) => {
      let h = offset;
      for (let i = 0; i < data.length; i++) {
        h ^= data.charCodeAt(i);
        // Multiply with 32-bit truncation
        const lo = (h & 0xffff) * prime;
        const hi = ((h >>> 16) * prime + ((lo >>> 16) & 0xffff)) & 0xffff;
        h = ((hi << 16) | (lo & 0xffff)) >>> 0;
      }
      return (h >>> 0).toString(16).padStart(8, '0');
    };
    const seeds = [
      [2166136261, 16777619], [2246822519, 2246822519],
      [3266489909, 374761393], [668265263, 668265263],
      [2246822519, 3266489909], [668265263, 2246822519],
      [374761393, 2246822519], [2166136261, 374761393],
    ];
    return seeds.map(([offset, prime]) => fnv(str, offset, prime)).join('');
  }

  /**
   * Tạo (hoặc lấy từ cache) DeviceFingerprint duy nhất và bền vững.
   * Lưu vào localStorage['__sstore_dfp'] để khớp với LICENSE_DEVICE.DeviceFingerprint.
   * @returns {Promise<string>} Fingerprint 64 ký tự hex
   */
  async function getDeviceFingerprint() {
    const STORAGE_KEY = '__sstore_dfp';
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached && /^[0-9a-f]{64}$/.test(cached)) return cached;

    // Thu thập các thuộc tính nhận dạng thiết bị (không dùng API nhạy cảm)
    const traits = [
      navigator.userAgent,
      navigator.language,
      String(screen.width) + 'x' + String(screen.height),
      String(screen.colorDepth),
      Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      navigator.hardwareConcurrency ? String(navigator.hardwareConcurrency) : '',
      navigator.deviceMemory ? String(navigator.deviceMemory) : '',
      String(new Date().getTimezoneOffset()),
      // Thêm salt ngẫu nhiên để tránh đụng độ giữa nhiều người dùng cùng thiết bị
      Math.random().toString(36).slice(2),
    ].join('|');

    const fingerprint = await sha256Hex(traits);
    try {
      localStorage.setItem(STORAGE_KEY, fingerprint);
    } catch (_) {
      // localStorage bị block (private mode): dùng session-only
    }
    return fingerprint;
  }

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
   * @param {string} deviceFingerprint
   * @returns {Promise<{ valid: boolean, licenseId?: string, reason?: string }>}
   */
  async function verifyLaunch(launchToken, gameId, deviceFingerprint) {
    const verifyEndpoint = '/api/library/verify-launch';
    try {
      const response = await fetch(verifyEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ launchToken, gameId, deviceFingerprint }),
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

    // 2. Lấy deviceFingerprint nhất quán với lúc gọi /launch
    let deviceFingerprint;
    try {
      deviceFingerprint = await getDeviceFingerprint();
    } catch (_) {
      showDenied('Không thể xác định thiết bị. Thử lại hoặc kiểm tra cài đặt trình duyệt.');
      return;
    }

    // 3. Gọi verify-launch
    showOverlay('Đang kiểm tra bản quyền...');
    const result = await verifyLaunch(launchToken, gameId, deviceFingerprint);

    if (result.valid) {
      hideOverlayAndShowGame(result.licenseId, onAuthorized);
    } else {
      showDenied(result.reason || 'Bản quyền không hợp lệ hoặc đã hết hạn.');
    }
  }

  // ───────────────────────────────── Xuất API công khai ──────────────────────────────────────

  global.SteamStoreDRM = {
    bootWithDRM,
    getDeviceFingerprint,
    sha256Hex,
  };
})(typeof window !== 'undefined' ? window : global);
