import { Hono } from 'hono';
import { handle } from 'hono/aws-lambda';
import { usersApp } from './api/users';

const isMock = process.env.MOCK_AWS === 'true';

// --- Global Hono Application ---
const app = new Hono();

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', mock: isMock });
});

// --- Domain Routing (Add new domains here) ---
// By chaining the routes to `app.route`, we build a deeply nested type tree.
// This is required for `hono/client` (RPC) on the frontend to infer all routes.
const routes = app
  .route('/api/users', usersApp);

// --- Export AppType for Frontend RPC ---
// Frontend imports `AppType` to get end-to-end type safety without importing any backend code logic.
export type AppType = typeof routes;

// --- Lambda Handler ---
export const handler = handle(app);

// For local development via @hono/node-server
export default app;
