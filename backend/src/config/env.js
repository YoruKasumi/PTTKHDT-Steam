require('dotenv').config();

module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
  refundWindowHours: Number(process.env.REFUND_WINDOW_HOURS || 24),
  maxKeysPerBatch: Number(process.env.MAX_KEYS_PER_BATCH || 200),
  maxUnusedKeysPerGame: Number(process.env.MAX_UNUSED_KEYS_PER_GAME || 2000),
  storage: {
    driver: process.env.STORAGE_DRIVER || 'local',
    localDir: process.env.STORAGE_LOCAL_DIR || './storage',
    r2: {
      endpoint: process.env.R2_ENDPOINT,
      bucket: process.env.R2_BUCKET,
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  },
};
