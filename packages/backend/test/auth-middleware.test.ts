import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Hono } from 'hono';

describe('authMiddleware (non-mock / AWS mode)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env.MOCK_AWS = 'false';
    process.env.USER_POOL_ID = 'us-east-1_testpool';
    process.env.USER_POOL_CLIENT_ID = 'test-client-id';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('rejects requests with no Authorization header', async () => {
    const { authMiddleware } = await import('../src/middleware/auth-middleware');
    const app = new Hono().use('*', authMiddleware).get('/', (c) => c.json({ ok: true }));

    const res = await app.request('/');
    expect(res.status).toBe(401);
  });

  it('rejects requests with a malformed/invalid token', async () => {
    const { authMiddleware } = await import('../src/middleware/auth-middleware');
    const app = new Hono().use('*', authMiddleware).get('/', (c) => c.json({ ok: true }));

    const res = await app.request('/', {
      headers: { Authorization: 'Bearer not-a-real-jwt' },
    });
    expect(res.status).toBe(401);
  });
});

describe('authMiddleware (MOCK_AWS=true)', () => {
  it('bypasses verification and allows the request through', async () => {
    vi.resetModules();
    process.env.MOCK_AWS = 'true';
    const { authMiddleware } = await import('../src/middleware/auth-middleware');
    const app = new Hono().use('*', authMiddleware).get('/', (c) => c.json({ ok: true }));

    const res = await app.request('/');
    expect(res.status).toBe(200);
  });
});
