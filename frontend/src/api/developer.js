import http from './http';

export const developerApi = {
  guiThongTinDangKy: (body) => http.post('/developer/guiThongTinDangKy', body),
  nangCapVaiTroDeveloper: (body) => http.post('/developer/nangCapVaiTroDeveloper', body),
  layThongTinHoSo: () => http.get('/developer/layThongTinHoSo'),
  capNhatHoSo: (body) => http.post('/developer/capNhatHoSo', body),

  // Aliases for compatibility
  register: (body) => http.post('/developer/guiThongTinDangKy', body),
  upgradeRole: (body) => http.post('/developer/nangCapVaiTroDeveloper', body),
  getProfile: () => http.get('/developer/layThongTinHoSo'),
  updateProfile: (body) => http.post('/developer/capNhatHoSo', body),
};
