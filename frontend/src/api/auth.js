import http from './http';

// Tên hàm khớp sơ đồ sequence UC1, UC2, UC3; đường dẫn khớp backend: /api/auth/<tenHam>.
export const authApi = {
  register: (body) => http.post('/auth/register', body),
  login: (body) => http.post('/auth/login', body),
  guiYeuCauDangXuat: () => http.post('/auth/guiYeuCauDangXuat'),
  logout: () => http.post('/auth/guiYeuCauDangXuat'),
  sendOtp: (body) => http.post('/auth/send-otp', body),
  forgotPasswordSendOtp: (body) => http.post('/auth/forgot-password/send-otp', body),
  resetPassword: (body) => http.post('/auth/forgot-password/reset', body),
};
