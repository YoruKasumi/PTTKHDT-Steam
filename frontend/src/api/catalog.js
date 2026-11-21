import http from './http';

// UC6 (tìm kiếm), UC7 (chi tiết) và gửi đánh giá.
export const catalogApi = {
  listGames: (params = {}) => http.get('/catalog/games', { params }),
  getGame: (gameId) => http.get(`/catalog/games/${encodeURIComponent(gameId)}`),
  createReview: (gameId, body) => http.post(`/catalog/games/${encodeURIComponent(gameId)}/reviews`, body),
  listGenres: () => http.get('/genres'),
  guiYeuCauTimKiem: (body) => http.post('/catalog/guiYeuCauTimKiem', body),
  yeuCauXemChiTietSanPham: (params) => http.get('/catalog/yeuCauXemChiTietSanPham', { params }),
};
