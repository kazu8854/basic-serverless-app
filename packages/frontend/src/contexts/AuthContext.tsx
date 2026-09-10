import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User } from '@basic-serverless-app/shared';
import { getRuntimeConfig } from '../lib/runtime-config';
import { generateCodeVerifier, generateCodeChallenge, generateState } from '../lib/pkce';
import { saveTokens, loadTokens, clearTokens } from '../lib/token-store';
import type { TokenSet } from '../lib/token-store';

// Auth Context definitions
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  /** Called by the /auth/callback page once it has exchanged the Hosted UI code for tokens. */
  completeLogin: (tokens: TokenSet) => void;
  isMock: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook to easily use auth state anywhere
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Cognito ID tokens are JWTs; decode the payload to get id/email/name for
// display purposes without an extra network round trip.
function userFromIdToken(idToken: string): User {
  const base64 = idToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const payload = JSON.parse(atob(base64));
  const now = new Date().toISOString();
  return {
    id: payload.sub,
    email: payload.email ?? '',
    name: payload.name ?? payload.email ?? payload.sub,
    createdAt: now,
    updatedAt: now,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Decide whether to run in mock UI mode based on VITE variable
  const isMock = import.meta.env.VITE_MOCK_AWS === 'true';
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on load: mock user from sessionStorage, or a still-valid
  // Cognito token set saved by a previous completeLogin().
  useEffect(() => {
    if (isMock) {
      const saved = sessionStorage.getItem('mockUser');
      setUser(saved ? JSON.parse(saved) : null);
      setIsLoading(false);
      return;
    }

    const tokens = loadTokens();
    if (tokens && tokens.expiresAt > Date.now()) {
      setUser(userFromIdToken(tokens.idToken));
    } else {
      clearTokens();
    }
    setIsLoading(false);
  }, [isMock]);

  const login = useCallback(async () => {
    if (isMock) {
      const mockUser: User = {
        id: crypto.randomUUID(),
        name: 'Mock User',
        email: 'mock@example.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUser(mockUser);
      sessionStorage.setItem('mockUser', JSON.stringify(mockUser));
      return;
    }

    // Real Cognito Hosted UI login via OAuth 2.0 Authorization Code + PKCE.
    const config = await getRuntimeConfig();
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    const state = generateState();
    sessionStorage.setItem('pkce.verifier', verifier);
    sessionStorage.setItem('pkce.state', state);

    const params = new URLSearchParams({
      client_id: config.userPoolClientId,
      response_type: 'code',
      scope: 'openid email profile',
      redirect_uri: `${window.location.origin}/auth/callback`,
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });

    window.location.href = `${config.cognitoDomain}/oauth2/authorize?${params.toString()}`;
  }, [isMock]);

  const logout = useCallback(async () => {
    setUser(null);
    if (isMock) {
      sessionStorage.removeItem('mockUser');
      return;
    }

    clearTokens();
    const config = await getRuntimeConfig();
    const params = new URLSearchParams({
      client_id: config.userPoolClientId,
      logout_uri: `${window.location.origin}/`,
    });
    window.location.href = `${config.cognitoDomain}/logout?${params.toString()}`;
  }, [isMock]);

  const completeLogin = useCallback((tokens: TokenSet) => {
    saveTokens(tokens);
    setUser(userFromIdToken(tokens.idToken));
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, completeLogin, isMock }}>
      {children}
    </AuthContext.Provider>
  );
}
