import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { Env } from './types';
import { createAPIRoutes } from './api/routes';
import { setupOpenAPIRoutes } from './api/openapi';
import { createFrontendRoutes } from './frontend/pages';

// Create the main Hono app with OpenAPI support
const app = new OpenAPIHono<{ Bindings: Env }>();

// Enable CORS for all routes
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Setup OpenAPI documentation routes
setupOpenAPIRoutes(app);

// Setup API routes
createAPIRoutes(app);

// Setup frontend routes
createFrontendRoutes(app);

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// 404 handler
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    message: 'The requested resource was not found',
  }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Application error:', err);
  return c.json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
  }, 500);
});

export default app;
