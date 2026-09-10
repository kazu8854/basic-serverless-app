import { createMiddleware } from 'hono/factory';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

export type AuthVariables = {
  userId: string;
};

const isMock = process.env.MOCK_AWS === 'true';

// Built lazily so importing this module never requires USER_POOL_ID /
// USER_POOL_CLIENT_ID to be set (e.g. when running in MOCK_AWS mode).
let verifier: ReturnType<typeof CognitoJwtVerifier.create> | undefined;

function getVerifier() {
  if (!verifier) {
    verifier = CognitoJwtVerifier.create({
      userPoolId: process.env.USER_POOL_ID!,
      tokenUse: 'access',
      clientId: process.env.USER_POOL_CLIENT_ID!,
    });
  }
  return verifier;
}

/**
 * Verifies the Cognito access token (Authorization: Bearer <token>) on every
 * request. In MOCK_AWS mode verification is skipped entirely, since the
 * offline mock frontend never obtains a real Cognito token.
 */
export const authMiddleware = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  if (isMock) {
    c.set('userId', 'mock-user');
    await next();
    return;
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    const payload = await getVerifier().verify(authHeader.slice('Bearer '.length));
    c.set('userId', payload.sub);
    await next();
  } catch {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
});
