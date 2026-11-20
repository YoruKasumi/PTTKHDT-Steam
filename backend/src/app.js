const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const asyncHandler = require('./utils/asyncHandler');
const { pool } = require('./config/database');
const { createOpenApiSpec } = require('./docs/openapi');
const { ok } = require('./utils/response');

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

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
    swaggerOptions: {
      persistAuthorization: true,
    },
  }));
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
