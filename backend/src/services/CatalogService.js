'use strict';
const BaseService = require('./BaseService');
const {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  ValidationException,
} = require('../exceptions');
const GameDAO = require('../dao/GameDAO');

/**
 * CatalogService - tầng Business Logic.
 * Tên phương thức lấy đúng từ sơ đồ sequence; nội dung bên dưới chỉ là khung cần cài đặt.
 */
class CatalogService extends BaseService {
  constructor() {
    super();
    this.gameDAO = new GameDAO();
  }

  // ---------------------------------------------------------------- Phương thức công khai (Route / Service khác gọi)

  /**
   * UC6. Tìm kiếm sản phẩm - sequence #2: UI → CatalogService
   * Luồng theo sơ đồ:
   *   #3 → GameDAO.timKiemSanPhamTheoTuKhoa()
   *   #4 ← traVeDanhSachSanPham()
   *   #5 ← traVeKetQuaTimKiem()
   * @param {object} params
   */
  async guiYeuCauTimKiem(params = {}) {
    return this.listGames(params);
  }

  /**
   * UC6. Tìm kiếm sản phẩm - sequence #8: UI → CatalogService
   * Luồng theo sơ đồ:
   *   #9 → GameDAO.truyVanSanPhamTheoTheLoai()
   *   #10 ← traVeKetQuaLoc()
   * @param {object} params
   */
  async yeuCauLocTheoTheLoai(params = {}) {
    return this.listGames({ ...params, genreId: params.genreId || params.categoryId });
  }

  /**
   * UC6. Tìm kiếm sản phẩm - sequence #11: UI → CatalogService
   * Luồng theo sơ đồ:
   *   #12 → GameDAO.truyVanSanPhamTheoKhoangGia()
   *   #13 ← traVeKetQuaLoc()
   * @param {object} params
   */
  async yeuCauLocTheoKhoangGia(params = {}) {
    return this.listGames(params);
  }

  /**
   * UC6. Tìm kiếm sản phẩm - sequence #14: UI → CatalogService
   * Luồng theo sơ đồ:
   *   #15 → GameDAO.truyVanSanPhamTheoTrangThaiSale()
   *   #16 ← traVeKetQuaLoc()
   * @param {object} params
   */
  async yeuCauLocTheoTrangThaiSale(params = {}) {
    return this.listGames({ ...params, onSale: true });
  }

  /**
   * UC6. Tìm kiếm sản phẩm - sequence #20: UI → CatalogService
   * Luồng theo sơ đồ:
   *   #21 → GameDAO.layDanhSachTheoNgayPhatHanh()
   *   #22 ← traVeDanhSachSapXep()
   * @param {object} params
   */
  async sapXepTheoNgayPhatHanh(params = {}) {
    return this.listGames({ ...params, sort: 'releaseDate' });
  }

  /**
   * UC6. Tìm kiếm sản phẩm - sequence #23: UI → CatalogService
   * Luồng theo sơ đồ:
   *   #24 → GameDAO.layDanhSachTheoDoPhoBien()
   *   #25 ← traVeDanhSachSapXep()
   * @param {object} params
   */
  async sapXepTheoDoPhoBien(params = {}) {
    return this.listGames({ ...params, sort: 'popularity' });
  }

  /**
   * UC6. Tìm kiếm sản phẩm - sequence #26: UI → CatalogService
   * Luồng theo sơ đồ:
   *   #27 → GameDAO.layDanhSachTheoGia()
   *   #28 ← traVeDanhSachSapXep()
   * @param {object} params
   */
  async sapXepTheoGia(params = {}) {
    return this.listGames({ ...params, sort: 'price' });
  }

  /**
   * UC7. Xem chi tiết sản phẩm - sequence #2: UI → CatalogService
   * Luồng theo sơ đồ:
   *   #3 → GameDAO.layThongTinSanPham()
   *   #4 ← traVeThongTinSanPham()
   *   #5 → GameDAO.layThongTinCoBan()
   *   #6 ← traVeThongTinCoBan()
   *   #7 ← traVeThongTinCoBan()
   *   #8 → GameDAO.layCauHinhYeuCau()
   *   #9 ← traVeCauHinhYeuCau()
   *   #10 ← traVeCauHinhYeuCau()
   *   #11 → GameDAO.layDanhSachDanhGia()
   *   #12 ← traVeDanhSachDanhGia()
   *   #13 ← traVeDanhSachDanhGia()
   * @param {object} params
   */
  async yeuCauXemChiTietSanPham(params = {}) {
    return this.getGameDetails(params);
  }

  async listGames(params = {}) {
    const filters = this.validateFilters(params);
    const rows = await this.gameDAO.listApprovedGames(filters);
    return rows.map((row) => this.toGameResponse(row));
  }

  async getGameDetails(params = {}) {
    const gameId = params.gameId || params.id;
    if (!gameId) throw new ValidationException('gameId là bắt buộc');
    const row = await this.gameDAO.layThongTinSanPham({ gameId });
    if (!row) throw new NotFoundException('Không tìm thấy trò chơi');
    const reviews = await this.gameDAO.layDanhSachDanhGia({ gameId });
    return {
      ...this.toGameResponse(row),
      trailerUrl: row.TrailerUrl,
      minSpec: row.MinSpec,
      recSpec: row.RecSpec,
      currentVersion: row.VersionID ? {
        versionId: row.VersionID,
        versionNumber: row.VersionNumber,
        changeLog: row.ChangeLog,
        versionDate: row.VersionDate,
      } : null,
      reviews: reviews.map((review) => this.toReviewResponse(review)),
    };
  }

  async createReview(params = {}) {
    const customerId = params.user?.accountId;
    const gameId = params.gameId || params.id;
    const rating = Number(params.rating);
    const content = typeof params.content === 'string' ? params.content.trim() : '';
    if (!customerId) throw new UnauthorizedException();
    if (!gameId) throw new ValidationException('gameId là bắt buộc');
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new ValidationException('Rating phải là số nguyên từ 1 đến 5');
    }
    if (!content || content.length > 1000) {
      throw new ValidationException('Nội dung đánh giá là bắt buộc và tối đa 1000 ký tự');
    }
    const game = await this.gameDAO.layThongTinSanPham({ gameId });
    if (!game) throw new NotFoundException('Không tìm thấy trò chơi');
    const license = await this.gameDAO.kiemTraGameDaSoHuu({ customerId, gameId });
    if (!license) throw new ConflictException('Bạn phải sở hữu trò chơi mới có thể đánh giá');

    try {
      const review = await this.gameDAO.taoDanhGia({ customerId, gameId, rating, content });
      return this.toReviewResponse(review);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('Bạn đã gửi đánh giá cho trò chơi này');
      }
      throw error;
    }
  }

  validateFilters(params = {}) {
    const keyword = typeof params.keyword === 'string' ? params.keyword.trim() : '';
    if (keyword.length > 200) throw new ValidationException('Từ khóa tối đa 200 ký tự');
    const minPrice = this.parsePrice(params.minPrice, 'minPrice');
    const maxPrice = this.parsePrice(params.maxPrice, 'maxPrice');
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      throw new ValidationException('minPrice không được lớn hơn maxPrice');
    }
    const sortAliases = {
      newest: 'releaseDate',
      releaseDate: 'releaseDate',
      popular: 'popularity',
      popularity: 'popularity',
      price: 'price',
      'price-asc': 'price',
      'price-desc': 'price',
    };
    const sort = sortAliases[params.sort] || 'popularity';
    const direction = params.sort === 'price-desc' || params.direction === 'desc' ? 'desc' : 'asc';
    return {
      keyword,
      genreId: typeof params.genreId === 'string' && params.genreId.trim() ? params.genreId.trim() : undefined,
      minPrice,
      maxPrice,
      onSale: params.onSale === true || params.onSale === 'true' || params.onSale === '1',
      sort,
      direction,
    };
  }

  parsePrice(value, field) {
    if (value === undefined || value === null || value === '') return undefined;
    const price = Number(value);
    if (!Number.isFinite(price) || price < 0 || price > 9999999999999.99) {
      throw new ValidationException(`${field} phải là số không âm hợp lệ`);
    }
    return price;
  }

  toGameResponse(row) {
    return {
      gameId: row.GameID,
      id: row.GameID,
      title: row.Title,
      description: row.Description,
      coverImage: row.CoverImage,
      image: row.CoverImage,
      developer: row.CompanyName,
      genres: row.GenreNames ? row.GenreNames.split(',') : [],
      basePrice: Number(row.BasePrice),
      currentPrice: Number(row.CurrentPrice),
      price: Number(row.CurrentPrice),
      percentOff: Number(row.PercentOff),
      discount: Number(row.PercentOff),
      oldPrice: Number(row.PercentOff) > 0 ? Number(row.BasePrice) : null,
      rating: Number(row.AverageRating),
      ratingCount: Number(row.RatingCount),
      popularity: Number(row.Popularity || 0),
      releaseDate: row.ReleaseDate,
    };
  }

  toReviewResponse(row) {
    return {
      reviewId: row.ReviewID,
      customerId: row.CustomerID,
      displayName: row.DisplayName,
      rating: Number(row.Rating),
      content: row.Content,
      reviewDate: row.ReviewDate,
    };
  }
}

module.exports = CatalogService;
