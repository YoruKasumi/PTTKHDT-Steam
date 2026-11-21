'use strict';
const AuthService = require('./AuthService');
const ProfileService = require('./ProfileService');
const CatalogService = require('./CatalogService');
const CartService = require('./CartService');
const GameService = require('./GameService');
const WishlistService = require('./WishlistService');
const WalletService = require('./WalletService');
const OrderService = require('./OrderService');
const LibraryService = require('./LibraryService');
const NotificationService = require('./NotificationService');
const DeveloperService = require('./DeveloperService');
const PromotionService = require('./PromotionService');
const ReportService = require('./ReportService');
const WithdrawalService = require('./WithdrawalService');
const ModerationService = require('./ModerationService');
const AuditLogService = require('./AuditLogService');
const AccountService = require('./AccountService');
const GenreService = require('./GenreService');
const BannerService = require('./BannerService');
const FinanceService = require('./FinanceService');
const SystemConfigService = require('./SystemConfigService');
const RbacService = require('./RbacService');
const StaffService = require('./StaffService');

const authService = new AuthService();
const profileService = new ProfileService();
const catalogService = new CatalogService();
const cartService = new CartService();
const gameService = new GameService();
const wishlistService = new WishlistService();
const walletService = new WalletService();
const orderService = new OrderService();
const libraryService = new LibraryService();
const notificationService = new NotificationService();
const developerService = new DeveloperService();
const promotionService = new PromotionService();
const reportService = new ReportService();
const withdrawalService = new WithdrawalService();
const moderationService = new ModerationService();
const auditLogService = new AuditLogService();
const accountService = new AccountService();
const genreService = new GenreService();
const bannerService = new BannerService();
const financeService = new FinanceService();
const systemConfigService = new SystemConfigService();
const rbacService = new RbacService();
const staffService = new StaffService();

// Gắn các phụ thuộc giữa service (theo lời gọi Service → Service trong sơ đồ sequence)
cartService.gameService = gameService;
wishlistService.gameService = gameService;
wishlistService.notificationService = notificationService;
promotionService.notificationService = notificationService;
walletService.authService = authService;
walletService.gameService = gameService;
orderService.walletService = walletService;
developerService.walletService = walletService;
developerService.notificationService = notificationService;
moderationService.auditLogService = auditLogService;
moderationService.notificationService = notificationService;
accountService.auditLogService = auditLogService;
accountService.notificationService = notificationService;
withdrawalService.notificationService = notificationService;
systemConfigService.auditLogService = auditLogService;
rbacService.auditLogService = auditLogService;
staffService.auditLogService = auditLogService;

module.exports = {
  authService,
  profileService,
  catalogService,
  cartService,
  gameService,
  wishlistService,
  walletService,
  orderService,
  libraryService,
  notificationService,
  createNotification: (accountIdOrParams, type, content, conn) => {
    if (typeof accountIdOrParams === 'object' && accountIdOrParams !== null) {
      return notificationService.createNotification(accountIdOrParams, type);
    }
    return notificationService.createNotification({ accountId: accountIdOrParams, type, content }, conn);
  },
  developerService,
  promotionService,
  reportService,
  withdrawalService,
  moderationService,
  auditLogService,
  accountService,
  genreService,
  bannerService,
  financeService,
  systemConfigService,
  rbacService,
  staffService,
};
