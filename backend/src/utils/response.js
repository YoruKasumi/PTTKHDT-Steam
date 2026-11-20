'use strict';

function ok(res, data = null, status = 200, message = 'Request completed successfully', meta = undefined) {
  const body = { success: true, message, data };
  if (meta !== undefined) body.meta = meta;
  return res.status(status).json(body);
}

module.exports = { ok };
