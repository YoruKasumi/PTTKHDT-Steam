import http from './http';

// UC6 (tìm kiếm) và UC7 (chi tiết). Dữ liệu thật chỉ có khi backend cài xong CatalogService.
export const catalogApi = {
  guiYeuCauTimKiem: (body) => http.post('/catalog/guiYeuCauTimKiem', body),
  yeuCauXemChiTietSanPham: (params) => http.get('/catalog/yeuCauXemChiTietSanPham', { params }),
};
