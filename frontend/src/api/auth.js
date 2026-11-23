import http from './http';

// Tên hàm và đường dẫn khớp backend: /api/auth/<tenHam>.
export const authApi = {
  guiThongTinDangKy: (body) => http.post('/auth/guiThongTinDangKy', body),
  guiThongTinDangNhap: (body) => http.post('/auth/guiThongTinDangNhap', body),
  guiYeuCauDangXuat: () => http.post('/auth/guiYeuCauDangXuat', {}),
  guiMaOtp: (body) => http.post('/auth/guiMaOtp', body),
  quenMatKhauGuiMaOtp: (body) => http.post('/auth/quenMatKhauGuiMaOtp', body),
  datLaiMatKhau: (body) => http.post('/auth/datLaiMatKhau', body),
  guiYeuCauThayDoiMatKhau: (body) => http.post('/auth/guiYeuCauThayDoiMatKhau', body),

  // Aliases for compatibility
  register: (body) => http.post('/auth/guiThongTinDangKy', body),
  login: (body) => http.post('/auth/guiThongTinDangNhap', body),
  logout: () => http.post('/auth/guiYeuCauDangXuat', {}),
  sendOtp: (body) => http.post('/auth/guiMaOtp', body),
  forgotPasswordSendOtp: (body) => http.post('/auth/quenMatKhauGuiMaOtp', body),
  resetPassword: (body) => http.post('/auth/datLaiMatKhau', body),
};
