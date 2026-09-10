// Holds the Cognito tokens obtained via the Hosted UI login flow.
// sessionStorage keeps them scoped to the tab and cleared on close —
// a reasonable tradeoff for a boilerplate; swap for httpOnly cookies
// issued by a BFF if you need stronger XSS protection later.

const ACCESS_TOKEN_KEY = 'auth.accessToken';
const ID_TOKEN_KEY = 'auth.idToken';
const REFRESH_TOKEN_KEY = 'auth.refreshToken';
const EXPIRES_AT_KEY = 'auth.expiresAt';

export interface TokenSet {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresAt: number; // epoch ms
}

export function saveTokens(tokens: TokenSet) {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  sessionStorage.setItem(ID_TOKEN_KEY, tokens.idToken);
  sessionStorage.setItem(EXPIRES_AT_KEY, String(tokens.expiresAt));
  if (tokens.refreshToken) {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }
}

export function loadTokens(): TokenSet | null {
  const accessToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
  const idToken = sessionStorage.getItem(ID_TOKEN_KEY);
  const expiresAt = sessionStorage.getItem(EXPIRES_AT_KEY);
  if (!accessToken || !idToken || !expiresAt) return null;

  return {
    accessToken,
    idToken,
    refreshToken: sessionStorage.getItem(REFRESH_TOKEN_KEY) ?? undefined,
    expiresAt: Number(expiresAt),
  };
}

export function clearTokens() {
  [ACCESS_TOKEN_KEY, ID_TOKEN_KEY, REFRESH_TOKEN_KEY, EXPIRES_AT_KEY].forEach((key) =>
    sessionStorage.removeItem(key)
  );
}

export function getAccessToken(): string | null {
  const tokens = loadTokens();
  if (!tokens || tokens.expiresAt <= Date.now()) return null;
  return tokens.accessToken;
}
