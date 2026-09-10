export interface RuntimeConfig {
  apiUrl: string;
  region: string;
  userPoolId: string;
  userPoolClientId: string;
  cognitoDomain: string;
}

let cached: RuntimeConfig | null = null;

/**
 * In a deployed build, `packages/infrastructure` writes `/config.json` to
 * the S3 bucket at deploy time (see infrastructure-stack.ts), so the
 * frontend learns its own API/Cognito endpoints at *runtime* instead of
 * needing them baked in at build time (the frontend is built before the
 * backend/infra are deployed, so build-time values aren't available yet).
 *
 * Locally (`npm run dev:aws`), that file doesn't exist, so we fall back to
 * VITE_* env vars — see packages/frontend/.env.example.
 */
export async function getRuntimeConfig(): Promise<RuntimeConfig> {
  if (cached) return cached;

  try {
    const res = await fetch('/config.json');
    if (res.ok) {
      cached = await res.json();
      return cached!;
    }
  } catch {
    // Ignored — fall through to the env var fallback below.
  }

  cached = {
    apiUrl: import.meta.env.VITE_API_URL ?? '',
    region: import.meta.env.VITE_AWS_REGION ?? '',
    userPoolId: import.meta.env.VITE_USER_POOL_ID ?? '',
    userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID ?? '',
    cognitoDomain: import.meta.env.VITE_COGNITO_DOMAIN ?? '',
  };
  return cached;
}
