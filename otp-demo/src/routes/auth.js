// src/routes/auth.js — các route xác thực
const router = require('express').Router();
const ctrl = require('../controllers/authController');

router.post('/register', ctrl.register);      // bước 1: nhận thông tin -> gửi OTP
router.post('/verify-otp', ctrl.verifyOtp);   // bước 2: nhập OTP -> tạo tài khoản
router.post('/resend-otp', ctrl.resendOtp);   // gửi lại OTP (cooldown 10 giây)

module.exports = router;
