const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const asyncHandler = require('./utils/asyncHandler');
const { pool } = require('./config/database');
const { createOpenApiSpec } = require('./docs/openapi');
const { ok } = require('./utils/response');
const { PACKAGED_PUBLIC_ROOT, PUBLIC_STORAGE_ROOT } = require('./utils/storagePaths');

const app = express();

// ─── Helmet: nới lỏng CSP để game iframe gọi được /api/library/verify-launch ───
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],   // drm.js cần inline script
        connectSrc: ["'self'"],                       // fetch /api/library/verify-launch
        frameSrc:   ["'self'"],                       // iframe _game_app.html
        imgSrc:     ["'self'", 'data:', 'blob:'],
        styleSrc:   ["'self'", "'unsafe-inline'"],
      },
    },
    // Cho phép game chạy trong iframe từ cùng origin
    frameguard: { action: 'sameorigin' },
    crossOriginEmbedderPolicy: false,
  }),
);

// ─── CORS: hỗ trợ credentials để cookie hoạt động trong iframe ───────────────
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : true;

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,                    // cần cho cookie __sstore_lt_*
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

const mediaOptions = { dotfiles: 'deny', fallthrough: true, index: false };
app.use('/api/media', express.static(PUBLIC_STORAGE_ROOT, mediaOptions));
app.use('/api/media', express.static(PACKAGED_PUBLIC_ROOT, mediaOptions));

app.get('/health', (req, res) => ok(res, { status: 'ok' }));
app.get('/health/database', asyncHandler(async (req, res) => {
  try {
    await pool.query('SELECT 1');
    return ok(res, { status: 'ok', database: process.env.DB_NAME || 'steam_store' });
  } catch (error) {
    return res.status(503).json({
      success: false,
      code: 'DATABASE_UNAVAILABLE',
      message: 'Không kết nối được MySQL. Kiểm tra DB_HOST, DB_PORT, DB_USER, DB_PASSWORD và DB_NAME.',
    });
  }
}));

app.use('/api', routes);

if (process.env.NODE_ENV !== 'production') {
  const openApiSpec = createOpenApiSpec();
  app.get('/api-docs/openapi.json', (req, res) => res.json(openApiSpec));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
    explorer: true,
    swaggerOptions: { persistAuthorization: true },
  }));
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
