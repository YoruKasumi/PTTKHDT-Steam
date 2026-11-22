// src/server.js — điểm vào của demo
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const userModel = require('./models/userModel');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Các API xác thực
app.use('/auth', authRoutes);

// Endpoint chỉ để DEMO: xem danh sách tài khoản đã được tạo sau khi verify OTP.
// (Không nên đưa endpoint này lên production.)
app.get('/api/users', (req, res) => {
  res.json({ users: userModel.listPublic() });
});

// 404 cho các route không tồn tại
app.use((req, res) => {
  res.status(404).json({ message: 'Không tìm thấy endpoint' });
});

// Xử lý lỗi (body JSON sai, lỗi server...)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[server] Lỗi:', err.message);
  if (err.status === 400) {
    return res.status(400).json({ message: 'Body JSON không hợp lệ' });
  }
  res.status(500).json({ message: 'Lỗi server' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  const mode = process.env.SMTP_HOST
    ? `SMTP ${process.env.SMTP_HOST}:${process.env.SMTP_PORT} (MailDev Web UI: http://localhost:1080)`
    : 'KHÔNG có SMTP — OTP sẽ được in ra console này';
  console.log(`Server chạy tại http://localhost:${PORT}`);
  console.log(`Chế độ gửi mail: ${mode}`);
});
