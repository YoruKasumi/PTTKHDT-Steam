const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { revokeToken, isTokenRevoked } = require('./tokenRevocation');

module.exports = {
  sign: (payload, options = {}) => {
    const finalPayload = {
      jti: payload.jti || crypto.randomUUID(),
      ...payload,
    };
    return jwt.sign(finalPayload, env.jwtSecret, { expiresIn: env.jwtExpiresIn, ...options });
  },
  verify: (token) => jwt.verify(token, env.jwtSecret),
  revoke: revokeToken,
  isRevoked: isTokenRevoked,
};
