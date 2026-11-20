const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AccountDAO = require('../dao/AccountDAO');
const { UnauthorizedException, ForbiddenException } = require('../exceptions');

const accountDAO = new AccountDAO();

/** AuthMiddleware: đọc JWT trong header Authorization: Bearer <token>. */
async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new UnauthorizedException());

  let claims;
  try {
    claims = jwt.verify(token, env.jwtSecret);
  } catch (e) {
    return next(new UnauthorizedException());
  }

  if (!claims.accountId) return next(new UnauthorizedException());

  try {
    const identity = await accountDAO.layDanhTinhVaQuyen({ accountId: claims.accountId });
    if (!identity || identity.Status !== 'Active') {
      return next(new UnauthorizedException());
    }

    const roles = [];
    if (Number(identity.IsCustomer) === 1) roles.push('Customer');
    if (Number(identity.IsDeveloper) === 1) roles.push('Developer');
    if (Number(identity.IsManager) === 1) roles.push('Manager');
    if (Number(identity.IsAdmin) === 1) roles.push('Admin');

    req.user = {
      accountId: identity.AccountID,
      username: identity.Username,
      roles,
      permissions: identity.PermissionCodes ? identity.PermissionCodes.split(',') : [],
    };
    return next();
  } catch (error) {
    return next(error);
  }
}

/** Phân quyền theo vai trò: requireRole('Manager', 'Admin'). */
function requireRole(...roles) {
  return (req, res, next) => {
    const have = (req.user && req.user.roles) || [];
    const isGuest = roles.includes('Guest') && !req.user;
    if (roles.length && !isGuest && !roles.some((r) => have.includes(r))) return next(new ForbiddenException());
    next();
  };
}

/** Kiểm tra quyền theo mã; Admin luôn được phép, Manager phải có quyền được gán trong ROLE_PERMISSION. */
function requirePermission(permissionCode) {
  return (req, res, next) => {
    if (!req.user) return next(new UnauthorizedException());
    if (req.user.roles.includes('Admin') || (req.user.permissions || []).includes(permissionCode)) return next();
    return next(new ForbiddenException(`Thiếu quyền ${permissionCode}`));
  };
}

module.exports = {
  authenticate,
  requireRole,
  requirePermission,
  authorize: requireRole,
};
