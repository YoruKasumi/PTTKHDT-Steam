import http from './http';

export const libraryApi = {
  yeuCauXemThuVien: () => http.get('/library/yeuCauXemThuVien'),
  kichHoatKey: (keyCode) => http.post('/library/kichHoatKey', { keyCode }),
  yeuCauKhoiChay: (gameId) => http.post('/library/yeuCauKhoiChay', { gameId }),
  xacThucKhoiChay: (body) => http.post('/library/xacThucKhoiChay', body),
  yeuCauTaiGame: (gameId) => http.get('/library/yeuCauTaiGame', { params: { gameId } }),
};
