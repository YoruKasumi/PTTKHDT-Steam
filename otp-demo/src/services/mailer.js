// src/services/mailer.js
// Gửi mail OTP qua SMTP giả lập cục bộ (MailDev / MailPit...).
// Nếu .env không cấu hình SMTP_HOST -> dùng jsonTransport của Nodemailer:
// mã OTP sẽ được in ra console server để vẫn test được flow khi chưa cài MailDev.

const nodemailer = require('nodemailer');

function createTransporter() {
  if (!process.env.SMTP_HOST) {
    // Chế độ dev không có SMTP: không gửi đi đâu cả, chỉ "gói" mail lại thành JSON.
    return nodemailer.createTransport({ jsonTransport: true });
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 1025),
    secure: false, // MailDev/MailPit chạy SMTP thường, không phải TLS 465
    tls: { rejectUnauthorized: false },
  });
}

const transporter = createTransporter();

const FROM = process.env.MAIL_FROM || 'Demo OTP <no-reply@demo.local>';

function buildMail(to, otp, ttlMinutes) {
  return {
    from: FROM,
    to,
    subject: `Mã OTP xác thực đăng ký: ${otp}`,
    text: [
      `Xin chào,`,
      ``,
      `Mã OTP xác thực đăng ký tài khoản của bạn là: ${otp}`,
      ``,
      `Mã có hiệu lực ${ttlMinutes} phút và chỉ dùng được một lần.`,
      `Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.`,
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="margin:0 0 12px;color:#1d4ed8;">Xác thực đăng ký tài khoản</h2>
        <p style="color:#334155;">Xin chào,</p>
        <p style="color:#334155;">Mã OTP của bạn là:</p>
        <p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#1d4ed8;margin:16px 0;">${otp}</p>
        <p style="color:#334155;">Mã có hiệu lực <b>${ttlMinutes} phút</b> và chỉ dùng được một lần.<br>
        Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.</p>
      </div>
    `,
  };
}

async function sendOtpEmail(to, otp, ttlMinutes = 5) {
  const info = await transporter.sendMail(buildMail(to, otp, ttlMinutes));
  if (!process.env.SMTP_HOST) {
    console.log(`[mailer] (chưa có SMTP) OTP cho ${to}: ${otp} — hết hạn sau ${ttlMinutes} phút`);
  }
  return info;
}

module.exports = { sendOtpEmail, transporter };
