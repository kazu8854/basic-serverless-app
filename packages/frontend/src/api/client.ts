import { hc } from 'hono/client';
import type { AppType } from '@basic-serverless-app/backend';
import { getRuntimeConfig } from '../lib/runtime-config';
import { getAccessToken } from '../lib/token-store';

const isMock = import.meta.env.VITE_MOCK_AWS === 'true';

let clientPromise: Promise<ReturnType<typeof hc<AppType>>> | null = null;

async function buildClient() {
  // In mock mode the backend URL is known at build time. In AWS mode it's
  // only known at deploy time, so we read it from the runtime config
  // (see lib/runtime-config.ts) instead.
  const baseUrl = isMock
    ? 'http://localhost:3001'
    : (await getRuntimeConfig()).apiUrl.replace(/\/$/, '');

  return hc<AppType>(baseUrl, {
    // Re-evaluated on every request so a freshly-obtained/refreshed token is
    // always sent, and unauthenticated (mock) requests simply omit it.
    headers: () => {
      const token = getAccessToken();
      return token ? { Authorization: `Bearer ${token}` } : {};
    },
  });
}

/**
 * The Hono RPC client. Async because the AWS-mode backend URL is only known
 * at runtime — see buildClient() above.
 * Example usage:
 *   const client = await getClient();
 *   const res = await client.api.users.$post({ json: { ... } });
 */
export function getClient() {
  if (!clientPromise) clientPromise = buildClient();
  return clientPromise;
}
