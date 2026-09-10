import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from '@cloudscape-design/components/spinner';
import Alert from '@cloudscape-design/components/alert';
import Box from '@cloudscape-design/components/box';
import { useAuth } from '../contexts/AuthContext';
import { getRuntimeConfig } from '../lib/runtime-config';

// Landing page for Cognito Hosted UI's `redirect_uri`. Exchanges the
// authorization `code` for tokens (PKCE — no client secret needed) and
// hands them to AuthContext.
export function AuthCallback() {
  const navigate = useNavigate();
  const { completeLogin } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      const expectedState = sessionStorage.getItem('pkce.state');
      const verifier = sessionStorage.getItem('pkce.verifier');
      sessionStorage.removeItem('pkce.state');
      sessionStorage.removeItem('pkce.verifier');

      if (params.get('error')) {
        setError(params.get('error_description') || params.get('error') || 'Sign-in was cancelled.');
        return;
      }

      if (!code || !state || !verifier || state !== expectedState) {
        setError('Invalid sign-in callback. Please try signing in again.');
        return;
      }

      try {
        const config = await getRuntimeConfig();
        const res = await fetch(`${config.cognitoDomain}/oauth2/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: config.userPoolClientId,
            code,
            redirect_uri: `${window.location.origin}/auth/callback`,
            code_verifier: verifier,
          }),
        });

        if (!res.ok) {
          throw new Error(`Token exchange failed (HTTP ${res.status})`);
        }

        const body = (await res.json()) as {
          access_token: string;
          id_token: string;
          refresh_token?: string;
          expires_in: number;
        };

        if (cancelled) return;

        completeLogin({
          accessToken: body.access_token,
          idToken: body.id_token,
          refreshToken: body.refresh_token,
          expiresAt: Date.now() + body.expires_in * 1000,
        });

        navigate('/', { replace: true });
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to complete sign-in.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [completeLogin, navigate]);

  if (error) {
    return (
      <Box padding="l">
        <Alert type="error" header="Sign-in failed">
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box padding="l" textAlign="center">
      <Spinner size="large" /> Completing sign-in…
    </Box>
  );
}
