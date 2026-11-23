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
 * Tên phương thức lấy đúng từ sơ đồ sequence.
 */
class CatalogService extends BaseService {
  constructor() {
    super();
    this.gameDAO = new GameDAO();
  }

  // ---------------------------------------------------------------- Phương thức công khai (Route / Service khác gọi)

  /**
   * UC6. Tìm kiếm sản phẩm - sequence #2: UI → CatalogService
   */
  async guiYeuCauTimKiem(params = {}) {
    return this.listGames(params);
  }

  /**
   * UC6. Tìm kiếm sản phẩm - sequence #8: UI → CatalogService
   */
  async yeuCauLocTheoTheLoai(params = {}) {
    return this.listGames({ ...params, genreId: params.genreId || params.categoryId });
  }

  /**
   * UC6. Tìm kiếm sản phẩm - sequence #11: UI → CatalogService
   */
  async yeuCauLocTheoKhoangGia(params = {}) {
    return this.listGames(params);
  }

  /**
   * UC6. Tìm kiếm sản phẩm - sequence #14: UI → CatalogService
   */
  async yeuCauLocTheoTrangThaiSale(params = {}) {
    return this.listGames({ ...params, onSale: true });
  }

  /**
   * UC6. Tìm kiếm sản phẩm - sequence #20: UI → CatalogService
   */
  async sapXepTheoNgayPhatHanh(params = {}) {
    return this.listGames({ ...params, sort: 'releaseDate' });
  }

  /**
   * UC6. Tìm kiếm sản phẩm - sequence #23: UI → CatalogService
   */
  async sapXepTheoDoPhoBien(params = {}) {
    return this.listGames({ ...params, sort: 'popularity' });
  }

  /**
   * UC6. Tìm kiếm sản phẩm - sequence #26: UI → CatalogService
   */
  async sapXepTheoGia(params = {}) {
    return this.listGames({ ...params, sort: 'price' });
  }

  /**
   * UC7. Xem chi tiết sản phẩm - sequence #2: UI → CatalogService
   */
  async yeuCauXemChiTietSanPham(params = {}) {
    return this.getGameDetails(params);
  }

  async listGames(params = {}) {
    const filters = this.validateFilters(params);
    const rows = await this.gameDAO.listApprovedGames(filters);
    return rows.map((row) => this.toGameResponse(row));
  }

  async layDanhSachGame(params = {}) {
    return this.listGames(params);
  }

  async taoDanhGia(params = {}) {
    return this.createReview(params);
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

  async updateReview(params = {}) {
    const customerId = params.user?.accountId;
    const reviewId = params.reviewId;
    const rating = Number(params.rating);
    const content = typeof params.content === 'string' ? params.content.trim() : '';
    if (!customerId) throw new UnauthorizedException();
    if (!reviewId) throw new ValidationException('reviewId là bắt buộc');
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new ValidationException('Rating phải là số nguyên từ 1 đến 5');
    if (!content || content.length > 1000) throw new ValidationException('Nội dung đánh giá là bắt buộc và tối đa 1000 ký tự');
    const exists = await this.gameDAO.layDanhGiaCuaKhach({ reviewId, customerId });
    if (!exists) throw new NotFoundException('Không tìm thấy đánh giá của bạn');
    await this.gameDAO.capNhatDanhGia({ reviewId, customerId, rating, content });
    return this.toReviewResponse({ ...exists, Rating: rating, Content: content });
  }

  async deleteReview(params = {}) {
    const customerId = params.user?.accountId;
    if (!customerId) throw new UnauthorizedException();
    if (!params.reviewId) throw new ValidationException('reviewId là bắt buộc');
    const deleted = await this.gameDAO.xoaDanhGia({ reviewId: params.reviewId, customerId });
    if (!deleted) throw new NotFoundException('Không tìm thấy đánh giá của bạn');
    return { reviewId: params.reviewId };
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
      slug: row.Slug,
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
