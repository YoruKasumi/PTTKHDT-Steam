/**
 * deviceFingerprint.js — Tiện ích sinh DeviceFingerprint dùng chung phía Frontend.
 *
 * Cùng thuật toán với backend/src/templates/drm.js để đảm bảo
 * LICENSE_DEVICE.DeviceFingerprint ghi lúc /launch khớp với lúc drm.js gọi /verify-launch.
 *
 * Lưu cố định vào localStorage['__sstore_dfp'] (SHA-256 hex 64 ký tự).
 */

const STORAGE_KEY = '__sstore_dfp';

/**
 * Băm chuỗi thành SHA-256 hex 64 ký tự.
 * Ưu tiên SubtleCrypto (HTTPS / localhost), fallback về FNV-1a 256-bit thuần JS khi
 * chạy trên HTTP LAN (không có SubtleCrypto).
 * @param {string} str
 * @returns {Promise<string>}
 */
export async function sha256Hex(str) {
  if (window.crypto && window.crypto.subtle) {
    const encoded = new TextEncoder().encode(str);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback: FNV-1a-like 256-bit (8 × 32-bit words) — đồng bộ với drm.js template
  const fnv = (data, offset, prime) => {
    let h = offset;
    for (let i = 0; i < data.length; i++) {
      h ^= data.charCodeAt(i);
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
 * Lấy (hoặc tạo mới) DeviceFingerprint duy nhất và bền vững cho trình duyệt này.
 * Lưu vào localStorage để tái sử dụng giữa các phiên.
 * @returns {Promise<string>} Chuỗi hex SHA-256 64 ký tự
 */
export async function getDeviceFingerprint() {
  // Thử lấy từ cache
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached && /^[0-9a-f]{64}$/.test(cached)) return cached;
  } catch (_) {
    // localStorage bị block
  }

  // Thu thập các thuộc tính nhận dạng thiết bị (đồng bộ với drm.js template)
  const traits = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}`,
    String(screen.colorDepth),
    Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    navigator.hardwareConcurrency ? String(navigator.hardwareConcurrency) : '',
    navigator.deviceMemory ? String(navigator.deviceMemory) : '',
    String(new Date().getTimezoneOffset()),
    Math.random().toString(36).slice(2),
  ].join('|');

  const fingerprint = await sha256Hex(traits);

  try {
    localStorage.setItem(STORAGE_KEY, fingerprint);
  } catch (_) {
    // silent — sessionStorage fallback không cần thiết vì drm.js cũng sẽ sinh lại
  }

  return fingerprint;
}

/**
 * Lấy tên thiết bị hiển thị dân dã từ userAgent.
 * @returns {string}
 */
export function getDeviceName() {
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return 'Windows PC';
  if (/Mac OS X/i.test(ua)) return 'macOS';
  if (/Linux/i.test(ua)) return 'Linux';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad/i.test(ua)) return 'iOS Device';
  return 'Unknown Device';
}
