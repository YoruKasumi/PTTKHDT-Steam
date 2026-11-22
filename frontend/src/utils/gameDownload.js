// Tải gói build.zip từ server bằng stream (giống launcher thật):
// có tiến trình %, xác minh SHA-256 sau khi tải. Việc lưu file vào thư mục
// cài đặt do installedLibrary.js đảm nhiệm.

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getAuthToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token') || '';
}

async function sha256Hex(blob) {
  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function parseFileName(disposition) {
  if (!disposition) return null;
  const m = /filename="?([^";]+)"?/i.exec(disposition);
  return m ? m[1] : null;
}

/**
 * GET /library/:gameId/download (Authorization: Bearer) — nhận stream build.zip.
 * @param {{ gameId: string, onProgress?: (p: {received:number, total:number, percent:number|null}) => void }} args
 * @returns {Promise<{blob: Blob, fileName: string, versionNumber: string, sha256: string|null, verified: boolean|null, size: number}>}
 * verified: true/false khi server trả checksum để đối chiếu; null khi không đối chiếu được.
 */
export async function downloadGameBuild({ gameId, onProgress }) {
  const res = await fetch(`${API_BASE}/library/${encodeURIComponent(gameId)}/download`, {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data.message || `Tải thất bại (HTTP ${res.status})`);
    err.status = res.status;
    err.code = data.code;
    throw err;
  }

  const fileName = parseFileName(res.headers.get('Content-Disposition')) || `game-${gameId}.zip`;
  const expectedSha = (res.headers.get('X-Game-Sha256') || '').toLowerCase();
  const versionNumber = res.headers.get('X-Game-Version') || '';
  const total = Number(res.headers.get('Content-Length')) || 0;

  const reader = res.body.getReader();
  const chunks = [];
  let received = 0;
  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (onProgress) {
      onProgress({
        received,
        total,
        percent: total ? Math.min(100, Math.round((received / total) * 100)) : null,
      });
    }
  }

  const blob = new Blob(chunks, { type: 'application/zip' });

  // Xác minh tính toàn vẹn như launcher thật (khi server có trả checksum).
  let verified = null;
  if (expectedSha && window.crypto?.subtle) {
    const actual = await sha256Hex(blob);
    verified = actual === expectedSha;
  }

  return { blob, fileName, versionNumber, sha256: expectedSha || null, verified, size: blob.size };
}
