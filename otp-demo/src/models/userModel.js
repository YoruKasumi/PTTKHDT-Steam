// src/models/userModel.js
// Lưu người dùng DEMO: ghi ra file data/users.json để tồn tại qua lần restart.
// Trong project thật, THAY TOÀN BỘ file này bằng Model của bạn
// (ví dụ Mongoose: User.create(...), User.findOne({ email })...).

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data'); // <root>/data/users.json
const DATA_FILE = path.join(DATA_DIR, 'users.json');

const users = new Map(); // key: email -> user

function load() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DATA_FILE)) {
    try {
      for (const u of JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))) {
        users.set(u.email, u);
      }
    } catch {
      // file hỏng/không đọc được -> bắt đầu với danh sách rỗng
    }
  }
}
load();

function persist() {
  fs.writeFileSync(DATA_FILE, JSON.stringify([...users.values()], null, 2));
}

function findByEmail(email) {
  return users.get(String(email || '').trim().toLowerCase()) || null;
}

function create({ email, passwordHash, fullName }) {
  const key = String(email).trim().toLowerCase();
  if (users.has(key)) return null; // trùng email
  const user = {
    email: key,
    passwordHash, // chỉ lưu hash, không bao giờ lưu mật khẩu thô
    fullName: fullName || '',
    createdAt: new Date().toISOString(),
  };
  users.set(key, user);
  persist();
  return user;
}

// Trả về user đã bỏ trường passwordHash (dùng khi trả JSON cho client).
function toPublic(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

function listPublic() {
  return [...users.values()].map(toPublic);
}

module.exports = { findByEmail, create, toPublic, listPublic };
