'use strict';
const BaseDAO = require('./BaseDAO');
const { NotImplementedException } = require('../exceptions');

class GameDAO extends BaseDAO {
  async listApprovedGames(params = {}, conn = null) {
    const conditions = ["g.Status = 'Approved'"];
    const values = [];
    if (params.keyword) {
      conditions.push('(g.Title LIKE ? OR g.Description LIKE ?)');
      const keyword = `%${params.keyword}%`;
      values.push(keyword, keyword);
    }
    if (params.genreId) {
      conditions.push(`EXISTS (
        SELECT 1 FROM GAME_GENRE AS filterGenre
        WHERE filterGenre.GameID = g.GameID AND filterGenre.GenreID = ?
      )`);
      values.push(params.genreId);
    }
    if (params.minPrice !== undefined && params.minPrice !== null) {
      conditions.push('price.CurrentPrice >= ?');
      values.push(params.minPrice);
    }
    if (params.maxPrice !== undefined && params.maxPrice !== null) {
      conditions.push('price.CurrentPrice <= ?');
      values.push(params.maxPrice);
    }
    if (params.onSale) conditions.push('price.PercentOff > 0');

    const orderBy = {
      releaseDate: 'g.ReleaseDate DESC, g.GameID',
      popularity: 'popularity.Popularity DESC, g.GameID',
      price: `price.CurrentPrice ${params.direction === 'desc' ? 'DESC' : 'ASC'}, g.GameID`,
    }[params.sort] || 'popularity.Popularity DESC, g.GameID';

    return this.query(
      `SELECT g.GameID, g.Title, g.Description, g.CoverImage, g.ReleaseDate,
              developer.CompanyName,
              price.BasePrice, price.PercentOff, price.CurrentPrice,
              COALESCE(rating.AverageRating, 0) AS AverageRating,
              COALESCE(rating.RatingCount, 0) AS RatingCount,
              COALESCE(popularity.Popularity, 0) AS Popularity,
              (SELECT GROUP_CONCAT(DISTINCT genre.GenreName ORDER BY genre.GenreName SEPARATOR ',')
               FROM GAME_GENRE AS gameGenre
               INNER JOIN GENRE AS genre ON genre.GenreID = gameGenre.GenreID
               WHERE gameGenre.GameID = g.GameID) AS GenreNames
       FROM GAME AS g
       INNER JOIN DEVELOPER AS developer ON developer.AccountID = g.DeveloperID
       INNER JOIN V_GAME_PRICE AS price ON price.GameID = g.GameID
       LEFT JOIN (
         SELECT GameID, AVG(Rating) AS AverageRating, COUNT(*) AS RatingCount
         FROM REVIEW WHERE Status = 'Visible' GROUP BY GameID
       ) AS rating ON rating.GameID = g.GameID
       LEFT JOIN (
         SELECT GameID, COUNT(*) AS Popularity
         FROM LICENSE WHERE Status = 'Active' GROUP BY GameID
       ) AS popularity ON popularity.GameID = g.GameID
       WHERE ${conditions.join(' AND ')}
       ORDER BY ${orderBy}`,
      values,
      conn,
    );
  }

  async timKiemSanPhamTheoTuKhoa(params = {}, conn = null) {
    return this.listApprovedGames(params, conn);
  }
  async truyVanSanPhamTheoTheLoai(params = {}, conn = null) {
    return this.listApprovedGames(params, conn);
  }

  async truyVanSanPhamTheoKhoangGia(params = {}, conn = null) {
    return this.listApprovedGames(params, conn);
  }

  async truyVanSanPhamTheoTrangThaiSale(params = {}, conn = null) {
    return this.listApprovedGames(params, conn);
  }

  async layDanhSachTheoNgayPhatHanh(params = {}, conn = null) {
    return this.listApprovedGames({ ...params, sort: 'releaseDate' }, conn);
  }
  async layDanhSachTheoDoPhoBien(params = {}, conn = null) {
    return this.listApprovedGames({ ...params, sort: 'popularity' }, conn);
  }
  async layDanhSachTheoGia(params = {}, conn = null) {
    return this.listApprovedGames({ ...params, sort: 'price' }, conn);
  }

  async layThongTinSanPham(params = {}, conn = null) {
    return this.one(
      `SELECT g.GameID, g.Title, g.Description, g.CoverImage, g.TrailerUrl,
              g.MinSpec, g.RecSpec, g.ReleaseDate, developer.CompanyName,
              price.BasePrice, price.PercentOff, price.CurrentPrice,
              currentVersion.VersionID, currentVersion.VersionNumber,
              currentVersion.ChangeLog, currentVersion.UploadDate AS VersionDate,
              (SELECT GROUP_CONCAT(DISTINCT genre.GenreName ORDER BY genre.GenreName SEPARATOR ',')
               FROM GAME_GENRE AS gameGenre
               INNER JOIN GENRE AS genre ON genre.GenreID = gameGenre.GenreID
               WHERE gameGenre.GameID = g.GameID) AS GenreNames,
              COALESCE(rating.AverageRating, 0) AS AverageRating,
              COALESCE(rating.RatingCount, 0) AS RatingCount
       FROM GAME AS g
       INNER JOIN DEVELOPER AS developer ON developer.AccountID = g.DeveloperID
       INNER JOIN V_GAME_PRICE AS price ON price.GameID = g.GameID
       LEFT JOIN GAMEVERSION AS currentVersion
         ON currentVersion.GameID = g.GameID AND currentVersion.IsCurrent = 1
       LEFT JOIN (
         SELECT GameID, AVG(Rating) AS AverageRating, COUNT(*) AS RatingCount
         FROM REVIEW WHERE Status = 'Visible' GROUP BY GameID
       ) AS rating ON rating.GameID = g.GameID
       WHERE g.GameID = ? AND g.Status = 'Approved'
       LIMIT 1`,
      [params.gameId],
      conn,
    );
  }

  async layThongTinCoBan(params = {}, conn = null) {
    return this.layThongTinSanPham(params, conn);
  }
  async layCauHinhYeuCau(params = {}, conn = null) {
    const row = await this.one(
      `SELECT MinSpec, RecSpec FROM GAME
       WHERE GameID = ? AND Status = 'Approved' LIMIT 1`,
      [params.gameId],
      conn,
    );
    return row;
  }
  async layDanhSachDanhGia(params = {}, conn = null) {
    return this.query(
      `SELECT review.ReviewID, review.CustomerID, review.Rating, review.Content,
              review.ReviewDate, account.DisplayName
       FROM REVIEW AS review
       INNER JOIN ACCOUNT AS account ON account.AccountID = review.CustomerID
       WHERE review.GameID = ? AND review.Status = 'Visible'
       ORDER BY review.ReviewDate DESC`,
      [params.gameId],
      conn,
    );
  }
  async kiemTraGameDaSoHuu(params = {}, conn = null) {
    return this.one(
      `SELECT LicenseID FROM LICENSE
       WHERE CustomerID = ? AND GameID = ? AND Status = 'Active'
       LIMIT 1`,
      [params.customerId, params.gameId],
      conn,
    );
  }

  async taoDanhGia(params = {}, conn = null) {
    await this.query(
      `INSERT INTO REVIEW (CustomerID, GameID, Rating, Content)
       VALUES (?, ?, ?, ?)`,
      [params.customerId, params.gameId, params.rating, params.content],
      conn,
    );
    return this.one(
      `SELECT review.ReviewID, review.CustomerID, review.Rating, review.Content,
              review.ReviewDate, account.DisplayName
       FROM REVIEW AS review
       INNER JOIN ACCOUNT AS account ON account.AccountID = review.CustomerID
       WHERE review.CustomerID = ? AND review.GameID = ?
       LIMIT 1`,
      [params.customerId, params.gameId],
      conn,
    );
  }

  async luuBanQuyenGame(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.luuBanQuyenGame');
  }
  async truyVanThongTinGame(params = {}, conn = null) {
    return this.one(
      `SELECT g.GameID, g.DeveloperID, g.Title, g.Status,
              gv.VersionID, gv.VersionNumber, gv.BuildFile, gv.FileSize, gv.Sha256
       FROM GAME g
       LEFT JOIN GAMEVERSION gv ON gv.GameID = g.GameID AND gv.IsCurrent = 1
       WHERE g.GameID = ? AND g.DeveloperID = ?
       LIMIT 1`,
      [params.gameId, params.developerId],
      conn,
    );
  }

  async resetCurrentVersion(params = {}, conn = null) {
    return this.query(
      'UPDATE GAMEVERSION SET IsCurrent = 0 WHERE GameID = ?',
      [params.gameId],
      conn,
    );
  }
  async capNhatPhienBanMoi(params = {}, conn = null) {
    await this.query(
      `INSERT INTO GAMEVERSION (GameID, VersionNumber, BuildFile, FileSize, Sha256, ChangeLog, IsCurrent)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [params.gameId, params.versionNumber, params.buildFile, params.fileSize, params.sha256, params.changeLog || null],
      conn,
    );
  }
  async kiemTraTenGameTrungLap(params = {}, conn = null) {
    return this.one(
      'SELECT GameID FROM GAME WHERE Title = ? LIMIT 1',
      [params.title],
      conn,
    );
  }

  async taoBanGhiDuAnMoi(params = {}, conn = null) {
    await this.query(
      `INSERT INTO GAME (GameID, DeveloperID, Title, Description, Price, CoverImage, TrailerUrl, MinSpec, RecSpec, Status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [
        params.gameId, params.developerId, params.title, params.description,
        params.price, params.coverImage || '', params.trailerUrl || null,
        params.minSpec || '', params.recSpec || '',
      ],
      conn,
    );

    await this.query(
      `INSERT INTO GAMEVERSION (GameID, VersionNumber, BuildFile, FileSize, Sha256, ChangeLog, IsCurrent)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [params.gameId, params.versionNumber || '1.0.0', params.buildFile, params.fileSize, params.sha256, params.changeLog || null],
      conn,
    );

    if (Array.isArray(params.genreIds) && params.genreIds.length > 0) {
      for (const genreId of params.genreIds) {
        await this.query(
          'INSERT IGNORE INTO GAME_GENRE (GameID, GenreID) VALUES (?, ?)',
          [params.gameId, genreId],
          conn,
        );
      }
    }
  }

  /**
   * UC26. Thiết lập giá bán VND (#6)
   */
  async capNhatGiaBanVND(params = {}, conn = null) {
    const result = await this.query(
      'UPDATE GAME SET Price = ? WHERE GameID = ? AND DeveloperID = ?',
      [params.newPrice, params.gameId, params.developerId],
      conn,
    );
    return result.affectedRows > 0;
  }

  /**
   * Kiểm tra xem game có đang trong chiến dịch Sale đang diễn ra không
   */
  async kiemTraSaleDangChay(params = {}, conn = null) {
    return this.one(
      'SELECT CampaignID, PercentOff, StartDate, EndDate FROM SALECAMPAIGN WHERE GameID = ? AND NOW() BETWEEN StartDate AND EndDate LIMIT 1',
      [params.gameId],
      conn,
    );
  }

  /**
   * UC29. Rollback phiên bản Build (#3) — Lấy danh sách tất cả phiên bản của game.
   * @param {{ gameId: string, developerId: string }} params
   */
  async kiemTraDanhSachPhienBanLuuTru(params = {}, conn = null) {
    return this.query(
      `SELECT gv.VersionID, gv.VersionNumber, gv.BuildFile, gv.FileSize, gv.Sha256,
              gv.ChangeLog, gv.UploadDate, gv.IsCurrent
       FROM GAMEVERSION gv
       INNER JOIN GAME g ON g.GameID = gv.GameID
       WHERE gv.GameID = ? AND g.DeveloperID = ?
       ORDER BY gv.UploadDate DESC`,
      [params.gameId, params.developerId],
      conn,
    );
  }

  /**
   * UC29. Rollback phiên bản Build (#10) — Đặt IsCurrent = 1 cho bản cũ (phải reset trước).
   * @param {{ versionId: string }} params
   */
  async capNhatPhienBanHienTai(params = {}, conn = null) {
    await this.query(
      'UPDATE GAMEVERSION SET IsCurrent = 1 WHERE VersionID = ?',
      [params.versionId],
      conn,
    );
  }

  /**
   * UC34. Cập nhật trạng thái Game (#3)
   */
  async kiemTraTrangThaiGameHienTai(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.kiemTraTrangThaiGameHienTai');
  }

  /**
   * UC34. Cập nhật trạng thái Game (#8)
   */
  async capNhatTrangThaiGameMoi(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.capNhatTrangThaiGameMoi');
  }

  /**
   * UC35. Gỡ game khỏi hệ thống (#3)
   */
  async kiemTraSoLuongNguoiChoiSoHuu(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.kiemTraSoLuongNguoiChoiSoHuu');
  }

  /**
   * UC35. Gỡ game khỏi hệ thống (#8)
   */
  async capNhatTrangThaiDelisted(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.capNhatTrangThaiDelisted');
  }

  /**
   * UC36. Ẩn game (#3)
   */
  async capNhatTrangThaiAnGame(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.capNhatTrangThaiAnGame');
  }

  // ─── Các hàm bổ sung cho DRM / Game management ───

  /**
   * Lấy thông tin game + phiên bản hiện hành để Manager xem khi duyệt.
   * @param {{ gameId: string }} params
   */
  async layGameVaPhienBanHienHanh(params = {}, conn = null) {
    return this.one(
      `SELECT g.GameID, g.DeveloperID, g.Title, g.Status,
              gv.VersionID, gv.VersionNumber, gv.BuildFile, gv.FileSize, gv.Sha256
       FROM GAME g
       INNER JOIN GAMEVERSION gv ON gv.GameID = g.GameID AND gv.IsCurrent = 1
       WHERE g.GameID = ?
       LIMIT 1`,
      [params.gameId],
      conn,
    );
  }

  /**
   * Cập nhật FileSize và Sha256 sau khi auto-DRM wrapper.
   * @param {{ versionId: string, fileSize: number, sha256: string }} params
   */
  async capNhatFileInfoSauDrm(params = {}, conn = null) {
    await this.query(
      'UPDATE GAMEVERSION SET FileSize = ?, Sha256 = ? WHERE VersionID = ?',
      [params.fileSize, params.sha256, params.versionId],
      conn,
    );
  }

  /**
   * Cập nhật GAME.Status = 'Approved', ReleaseDate = COALESCE(ReleaseDate, NOW()).
   * @param {{ gameId: string }} params
   */
  async pheDuyetGame(params = {}, conn = null) {
    await this.query(
      `UPDATE GAME SET Status = 'Approved', ReleaseDate = COALESCE(ReleaseDate, NOW()) WHERE GameID = ?`,
      [params.gameId],
      conn,
    );
  }

  /**
   * Cập nhật GAME.Status = 'Rejected'.
   * @param {{ gameId: string }} params
   */
  async tuChoiGame(params = {}, conn = null) {
    await this.query(
      `UPDATE GAME SET Status = 'Rejected' WHERE GameID = ?`,
      [params.gameId],
      conn,
    );
  }

  /**
   * Cập nhật GAME.Status = 'Delisted'.
   * @param {{ gameId: string }} params
   */
  async delistedGame(params = {}, conn = null) {
    await this.query(
      `UPDATE GAME SET Status = 'Delisted' WHERE GameID = ?`,
      [params.gameId],
      conn,
    );
  }

  /**
   * Lấy DeveloperID của game (để gửi thông báo).
   * @param {{ gameId: string }} params
   */
  async layDeveloperIdCuaGame(params = {}, conn = null) {
    return this.one(
      'SELECT DeveloperID FROM GAME WHERE GameID = ? LIMIT 1',
      [params.gameId],
      conn,
    );
  }
}

module.exports = GameDAO;
