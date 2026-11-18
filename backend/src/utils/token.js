const jwt = require('jsonwebtoken');
const env = require('../config/env');

module.exports = {
  sign: (payload, options = {}) => jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn, ...options }),
  verify: (token) => jwt.verify(token, env.jwtSecret),
};
