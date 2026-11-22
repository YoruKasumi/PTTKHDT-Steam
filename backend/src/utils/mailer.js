'use strict';
const nodemailer = require('nodemailer');
const env = require('../config/env');

const mockSentMails = [];

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const { host, port, secure, user, pass } = env.smtp || {};
  if (user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  }
  return transporter;
}

function isTestEnvironment() {
  return process.env.NODE_ENV === 'test'
    || Boolean(process.env.NODE_TEST_CONTEXT)
    || process.argv.some((arg) => arg.includes('test'));
}

/**
 * Gửi email với fallback mock tự động khi ở môi trường test hoặc chưa cấu hình SMTP credentials.
 */
async function sendMail({ to, subject, html, text }) {
  const from = env.smtp?.from || 'Vortex Gaming <no-reply@vortex.local>';
  const activeTransporter = getTransporter();

  if (!activeTransporter || isTestEnvironment()) {
    const record = {
      to,
      from,
      subject,
      html,
      text,
      sentAt: new Date(),
    };
    mockSentMails.push(record);
    return {
      success: true,
      mock: true,
      messageId: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };
  }

  try {
    const info = await activeTransporter.sendMail({
      from,
      to,
      subject,
      text: text || html.replace(/<[^>]+>/g, ''),
      html,
    });
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('[Mailer] Lỗi khi gửi email:', error.message);
    throw error;
  }
}

async function sendOtpEmail({ to, otp, purpose = 'register' }) {
  const isRegister = purpose === 'register';
  const subject = isRegister
    ? '[Vortex Gaming] Mã xác thực đăng ký tài khoản'
    : '[Vortex Gaming] Mã xác thực đặt lại mật khẩu';

  const actionText = isRegister
    ? 'đăng ký tài khoản Vortex Gaming'
    : 'đặt lại mật khẩu tài khoản Vortex Gaming';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #121212; color: #ffffff; border-radius: 8px;">
      <h2 style="color: #6366f1; text-align: center; margin-bottom: 20px;">VORTEX GAMING STORE</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #d1d5db;">Xin chào,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #d1d5db;">
        Bạn vừa yêu cầu ${actionText}. Vui lòng nhập mã xác thực OTP bên dưới để tiếp tục:
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="display: inline-block; padding: 12px 28px; font-size: 28px; font-weight: bold; letter-spacing: 6px; background-color: #1e1b4b; color: #818cf8; border: 1px solid #4f46e5; border-radius: 8px;">
          ${otp}
        </span>
      </div>
      <p style="font-size: 12px; color: #9ca3af; text-align: center;">
        Mã OTP có hiệu lực trong vòng <strong>5 phút</strong>. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.
      </p>
      <p style="font-size: 12px; color: #6b7280; text-align: center; margin-top: 30px; border-top: 1px solid #27272a; padding-top: 15px;">
        Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.
      </p>
    </div>
  `;

  return sendMail({
    to,
    subject,
    html,
  });
}

module.exports = {
  sendMail,
  sendOtpEmail,
  mockSentMails,
  getMockSentMails: () => [...mockSentMails],
  clearMockSentMails: () => { mockSentMails.length = 0; },
};
