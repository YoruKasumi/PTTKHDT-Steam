/** Lỗi nghiệp vụ: BLL ném, tầng Route bắt và trả HTTP 4xx cho GUI. */
class NghiepVuException extends Error {
  constructor(message, status = 400, code = 'NGHIEP_VU') {
    super(message);
    this.name = 'NghiepVuException';
    this.status = status;
    this.code = code;
  }
}
class UnauthorizedException extends NghiepVuException {
  constructor(message = 'Chưa đăng nhập hoặc phiên đã hết hạn') { super(message, 401, 'UNAUTHORIZED'); }
}
class ForbiddenException extends NghiepVuException {
  constructor(message = 'Không đủ quyền thực hiện thao tác này') { super(message, 403, 'FORBIDDEN'); }
}
class NotFoundException extends NghiepVuException {
  constructor(message = 'Không tìm thấy dữ liệu') { super(message, 404, 'NOT_FOUND'); }
}
/** Dùng cho các hàm khung chưa cài đặt. */
class NotImplementedException extends NghiepVuException {
  constructor(what) { super(`Chưa cài đặt: ${what}`, 501, 'NOT_IMPLEMENTED'); }
}

module.exports = { NghiepVuException, UnauthorizedException, ForbiddenException, NotFoundException, NotImplementedException };
