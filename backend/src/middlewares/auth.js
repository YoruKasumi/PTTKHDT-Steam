const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { UnauthorizedException, ForbiddenException } = require('../exceptions');

/** AuthMiddleware: đọc JWT trong header Authorization: Bearer <token>. */
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new UnauthorizedException());
  try {
    req.user = jwt.verify(token, env.jwtSecret); // { accountId, roles: ['Customer', ...] }
    next();
  } catch (e) {
    next(new UnauthorizedException());
  }
}

/** Phân quyền theo vai trò: authorize('Manager', 'Admin'). */
function authorize(...roles) {
  return (req, res, next) => {
    const have = (req.user && req.user.roles) || [];
    const isGuest = roles.includes('Guest') && !req.user;
    if (roles.length && !isGuest && !roles.some((r) => have.includes(r))) return next(new ForbiddenException());
    next();
  };
}

module.exports = { authenticate, authorize };
