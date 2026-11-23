import http from './http';

export const profileApi = {
  layThongTinHoSo: () => http.get('/profile/layThongTinHoSo'),
  guiTenHienThiMoi: (displayName) => http.post('/profile/guiTenHienThiMoi', { displayName }),
  guiAnhDaiDien: (body) => http.post('/profile/guiAnhDaiDien', body),
  capNhatHoSo: (body) => http.post('/profile/capNhatHoSo', body),
  guiMaOtpDoiMatKhau: () => http.post('/profile/guiMaOtpDoiMatKhau', {}),
  guiYeuCauThayDoiMatKhau: (body) => http.post('/profile/guiYeuCauThayDoiMatKhau', body),
  capNhatTrangThaiThongBao: (enabled) => http.post('/profile/capNhatTrangThaiThongBao', { enabled }),

  // Aliases for compatibility
  updateDisplayName: (displayName) => http.post('/profile/guiTenHienThiMoi', { displayName }),
  changePassword: (body) => http.post('/profile/guiYeuCauThayDoiMatKhau', body),
  updateNotifications: (enabled) => http.post('/profile/capNhatTrangThaiThongBao', { enabled }),
};
