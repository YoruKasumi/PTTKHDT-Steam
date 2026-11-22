// Quản lý trạng thái "đã cài đặt" của game trên máy người chơi (mô phỏng launcher).
//  - Thư mục cài đặt: FileSystemDirectoryHandle lưu trong IndexedDB (giữ qua các lần chạy).
//  - Danh sách game đã cài: localStorage (key: sstore_installed_games).
// Gỡ cài đặt CHỈ xóa file trong thư mục của người chơi — không bao giờ đụng vào
// bản quyền (LICENSE) phía server. Thu hồi bản quyền chỉ xảy ra khi hoàn tiền
// hoặc khóa tài khoản, do luồng server xử lý.

const INSTALLED_KEY = 'sstore_installed_games';
const DB_NAME = 'sstore-launcher';
const STORE_NAME = 'handles';
const HANDLE_KEY = 'installRoot';

// File System Access API chỉ có trên Chromium (Chrome/Edge). Trình duyệt khác
// sẽ fallback: tải về thư mục Downloads mặc định và không tự gỡ được.
export function supportsFsAccess() {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';
}

// ─── Danh sách game đã cài (localStorage) ────────────────────────────────────

function readInstalledMap() {
  try {
    return JSON.parse(localStorage.getItem(INSTALLED_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeInstalledMap(map) {
  localStorage.setItem(INSTALLED_KEY, JSON.stringify(map));
}

export function getInstalledMap() {
  return readInstalledMap();
}

export function getInstalledInfo(gameId) {
  return readInstalledMap()[gameId] || null;
}

export function markInstalled(gameId, info) {
  const map = readInstalledMap();
  map[gameId] = { ...info, installedAt: new Date().toISOString() };
  writeInstalledMap(map);
  return map[gameId];
}

export function clearInstalled(gameId) {
  const map = readInstalledMap();
  delete map[gameId];
  writeInstalledMap(map);
}

// ─── Thư mục cài đặt (IndexedDB giữ handle giữa các phiên) ──────────────────

function openHandleDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key, value) {
  const db = await openHandleDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGet(key) {
  const db = await openHandleDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

// Cho người chơi chọn thư mục cài đặt (lần đầu) và lưu lại handle.
export async function pickInstallFolder() {
  if (!supportsFsAccess()) return null;
  const handle = await window.showDirectoryPicker({ id: 'sstore-games', mode: 'readwrite' });
  await idbSet(HANDLE_KEY, handle);
  return handle;
}

// Lấy lại thư mục đã chọn từ phiên trước (null nếu chưa chọn / không hỗ trợ).
export async function loadInstallFolder() {
  if (!supportsFsAccess()) return null;
  try {
    return await idbGet(HANDLE_KEY);
  } catch {
    return null;
  }
}

// Đảm bảo handle còn quyền ghi (trình duyệt có thể hỏi lại sau khi refresh).
// Trả handle hoặc null nếu người chơi từ chối cấp quyền.
export async function ensureWritePermission(dirHandle) {
  if (!dirHandle) return null;
  const opts = { mode: 'readwrite' };
  if ((await dirHandle.queryPermission?.(opts)) === 'granted') return dirHandle;
  if ((await dirHandle.requestPermission?.(opts)) === 'granted') return dirHandle;
  return null;
}

// Ghi tệp cài đặt vào thư mục của người chơi.
export async function writeInstalledFile(dirHandle, fileName, blob) {
  const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}

// Xóa tệp cài đặt trong thư mục (chỉ khi tệp thật sự còn đó).
// Trả true nếu đã xóa, false nếu tệp không còn hoặc thư mục không truy cập được.
export async function removeInstalledFile(dirHandle, fileName) {
  try {
    await dirHandle.getFileHandle(fileName, { create: false });
    await dirHandle.removeEntry(fileName);
    return true;
  } catch {
    return false;
  }
}
