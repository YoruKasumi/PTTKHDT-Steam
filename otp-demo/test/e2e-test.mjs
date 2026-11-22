// test/e2e-test.mjs — test end-to-end flow OTP, 17 lần kiểm tra (Node >= 18, dùng fetch sẵn có).
// Chạy khi server (npm start) và MailDev (npm run maildev) đang chạy: node test/e2e-test.mjs

const BASE = process.env.BASE || 'http://127.0.0.1:3000';
const MAILDEV = process.env.MAILDEV || 'http://127.0.0.1:1080';

let pass = 0;
let fail = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function check(name, cond, extra = '') {
  console.log(`${cond ? '✅ PASS' : '❌ FAIL'} — ${name}${extra ? ' | ' + extra : ''}`);
  cond ? pass++ : fail++;
}

async function post(path, body) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

// Lấy OTP 6 số từ mail mới nhất gửi tới email trong MailDev (đọc qua REST API của MailDev:
// GET /email trả danh sách mail, GET /email/:id trả chi tiết — MailDev v2.x).
async function latestOtpFromMaildev(email) {
  const list = await (await fetch(MAILDEV + '/email')).json();
  const mine = list
    .sort((a, b) => new Date(b.time || b.timeReceived || 0) - new Date(a.time || a.timeReceived || 0))
    .filter((e) => JSON.stringify(e).includes(email));
  if (!mine.length) return null;
  const m = String(mine[0].subject || '').match(/\b\d{6}\b/);
  if (m) return m[0];
  // fallback: đọc chi tiết mail nếu subject không chứa OTP
  const detail = await (await fetch(`${MAILDEV}/email/${mine[0].id}`)).json();
  const dm = JSON.stringify(detail).match(/\b\d{6}\b/);
  return dm ? dm[0] : null;
}

const email = `test-${Date.now()}@vidu.com`;
console.log(`== Test với email: ${email} ==\n`);

// 1. Đăng ký -> 202, mail OTP xuất hiện trong MailDev
let r = await post('/auth/register', { email, password: 'secret123', fullName: 'Nguyễn Test' });
check('register -> 202 (không tạo account ngay)', r.status === 202, JSON.stringify(r.data));
const otp1 = await latestOtpFromMaildev(email);
check('MailDev nhận được mail OTP', !!otp1, `otp=${otp1}`);

// 2. Resend ngay lập tức -> 429 (cooldown 10 giây)
r = await post('/auth/resend-otp', { email });
check('resend ngay sau khi gửi -> 429 cooldown', r.status === 429 && r.data.retryAfterSeconds > 0, JSON.stringify(r.data));

// 3. Sai OTP 5 lần -> lần thứ 5 bị khóa
for (let i = 1; i <= 5; i++) {
  r = await post('/auth/verify-otp', { email, otp: '000000' });
  const locked = i === 5;
  check(
    `sai OTP lần ${i}/5 -> ${locked ? '429 LOCKED' : '400 WRONG'}`,
    r.status === (locked ? 429 : 400) && r.data.reason === (locked ? 'LOCKED' : 'WRONG'),
    `attemptsLeft=${r.data.attemptsLeft}`,
  );
}

// 4. Nhập ĐÚNG mã sau khi khóa -> vẫn bị chặn, phải gửi lại mã mới
r = await post('/auth/verify-otp', { email, otp: otp1 });
check('đúng OTP nhưng email đã khóa -> 429 LOCKED', r.status === 429 && r.data.reason === 'LOCKED', JSON.stringify(r.data));

// 5. Chờ hết cooldown 10 giây -> resend thành công, nhận mã mới khác mã cũ
await sleep(10500);
r = await post('/auth/resend-otp', { email });
check('resend sau khi hết 10s cooldown -> 200', r.status === 200, JSON.stringify(r.data));
const otp2 = await latestOtpFromMaildev(email);
check('nhận được mã OTP mới (khác mã cũ, đã reset khóa)', !!otp2 && otp2 !== otp1, `otp_moi=${otp2}`);

// 6. Verify đúng mã mới -> 201, tài khoản được tạo, không trả passwordHash
r = await post('/auth/verify-otp', { email, otp: otp2 });
check('verify đúng OTP mới -> 201 tạo tài khoản', r.status === 201 && r.data.user && r.data.user.email === email, JSON.stringify(r.data));
check('response không lộ passwordHash', r.status === 201 && !JSON.stringify(r.data).includes('passwordHash') && !JSON.stringify(r.data).includes('$2a$'));

// 7. OTP đã dùng rồi -> bị xóa, dùng lại không được
r = await post('/auth/verify-otp', { email, otp: otp2 });
check('OTP đã dùng -> 400 NOT_FOUND (dùng một lần)', r.status === 400 && r.data.reason === 'NOT_FOUND', JSON.stringify(r.data));

// 8. Đăng ký trùng email đã có tài khoản -> 409
r = await post('/auth/register', { email, password: 'secret123' });
check('register trùng email -> 409', r.status === 409, JSON.stringify(r.data));

// 9. Verify với email lạ -> 400
r = await post('/auth/verify-otp', { email: 'khong-ton-tai@vidu.com', otp: '123456' });
check('verify email không tồn tại -> 400 NOT_FOUND', r.status === 400 && r.data.reason === 'NOT_FOUND', JSON.stringify(r.data));

// 10. /api/users hiển thị tài khoản mới (không có hash)
const users = await (await fetch(BASE + '/api/users')).json();
check('/api/users chứa tài khoản vừa tạo (đã bỏ passwordHash)',
  users.users.some((u) => u.email === email && u.passwordHash === undefined && u.fullName === 'Nguyễn Test'));

console.log(`\n== Kết quả: ${pass} PASS / ${fail} FAIL ==`);
process.exit(fail ? 1 : 0);
