'use strict';

const apiRoutes = require('../routes');

const toOpenApiPath = (path) => path.replace(/:([A-Za-z0-9_]+)/g, '{$1}');

const toOperationId = (method, tag, path) => (
  `${method}_${tag}_${path}`
    .replace(/[^A-Za-z0-9]+(.)?/g, (_, next) => (next ? next.toUpperCase() : ''))
);

function createRouteOperation(route, method, tag) {
  const isAuthenticated = route.stack.some((layer) => layer.name === 'authenticate');
  const operation = {
    tags: [tag],
    operationId: toOperationId(method, tag, route.path),
    summary: `${method.toUpperCase()} ${route.path}`,
    description: 'Endpoint hiện có trong backend. Một số service đang là khung và có thể trả về 501 NOT_IMPLEMENTED.',
    responses: {
      200: {
        description: 'Request được xử lý thành công.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SuccessResponse' },
          },
        },
      },
      400: { description: 'Request không hợp lệ.' },
      401: { description: 'Thiếu hoặc sai Bearer token.' },
      403: { description: 'Không đủ quyền truy cập.' },
      500: { description: 'Lỗi nội bộ.' },
      501: { description: 'Nghiệp vụ chưa được cài đặt.' },
    },
  };

  if (isAuthenticated) operation.security = [{ bearerAuth: [] }];
  if (method !== 'get' && method !== 'head') {
    operation.requestBody = {
      required: false,
      content: {
        'application/json': {
          schema: { type: 'object', additionalProperties: true },
          example: {},
        },
      },
    };
  }

  return operation;
}

function createOpenApiSpec(port = process.env.PORT || 3000) {
  const paths = {
    '/health': {
      get: {
        tags: ['Health'],
        operationId: 'getHealth',
        summary: 'Kiểm tra backend đang chạy',
        responses: {
          200: { description: 'Backend hoạt động.' },
        },
      },
    },
    '/health/database': {
      get: {
        tags: ['Health'],
        operationId: 'getDatabaseHealth',
        summary: 'Kiểm tra kết nối MySQL',
        responses: {
          200: { description: 'Kết nối database hoạt động.' },
          503: { description: 'Không kết nối được database.' },
        },
      },
    },
  };

  for (const { prefix, tag, router } of apiRoutes.apiModules) {
    for (const layer of router.stack) {
      if (!layer.route) continue;
      const path = toOpenApiPath(`/api${prefix}${layer.route.path}`);
      paths[path] ||= {};

      for (const method of Object.keys(layer.route.methods)) {
        paths[path][method] = createRouteOperation(layer.route, method, tag);
      }
    }
  }

  return {
    openapi: '3.0.3',
    info: {
      title: 'Steam Store API',
      version: '1.0.0',
      description: 'OpenAPI document được tạo từ các route Express hiện tại.',
    },
    servers: [{ url: `http://localhost:${port}` }],
    tags: [...apiRoutes.apiModules.map(({ tag }) => ({ name: tag })), { name: 'Health' }],
    paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Nhập JWT token, không cần thêm tiền tố "Bearer ".',
        },
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', example: true },
            data: { type: 'object', additionalProperties: true },
          },
          required: ['ok', 'data'],
        },
      },
    },
  };
}

module.exports = { createOpenApiSpec };
