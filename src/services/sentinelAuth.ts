const CLIENT_ID = import.meta.env.VITE_SENTINEL_COGNITO_CLIENT_ID || '1hj8di9u0q1chqfr5s8j92hstl';
const COGNITO_DOMAIN = (import.meta.env.VITE_SENTINEL_COGNITO_DOMAIN || 'https://ap-south-1rs8p3dycw.auth.ap-south-1.amazoncognito.com').replace(/\/$/, '');
const getCallbackUrl = () => import.meta.env.VITE_SENTINEL_COGNITO_CALLBACK_URL || `${window.location.origin}/`;
const TOKEN_KEY = 'athena_sentinel_oauth_tokens';
const FLOW_KEY = 'athena_sentinel_oauth_flow';
let callbackPromise: Promise<{ handled: boolean; error?: string }> | null = null;
let refreshPromise: Promise<string> | null = null;

export interface SentinelSession {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresAt: number;
}

const encode = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const random = (size = 32) => encode(crypto.getRandomValues(new Uint8Array(size)));
const decodeJwtPayload = (token: string): Record<string, unknown> => {
  const part = token.split('.')[1];
  if (!part) throw new Error('Invalid ID token received from sign-in.');
  const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
  const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
};

const validateTokens = (tokens: Record<string, unknown>, nonce: string): SentinelSession => {
  if (typeof tokens.access_token !== 'string' || !tokens.access_token || typeof tokens.id_token !== 'string' || !tokens.id_token) {
    throw new Error('Sign-in response did not include valid tokens.');
  }
  const claims = decodeJwtPayload(tokens.id_token);
  if (claims.nonce !== nonce) throw new Error('Sign-in nonce validation failed. Please sign in again.');
  if (claims.iss !== `https://cognito-idp.ap-south-1.amazonaws.com/ap-south-1_rs8P3dyCw` || claims.aud !== CLIENT_ID) {
    throw new Error('Sign-in token issuer or audience did not match this app.');
  }
  const expiresIn = Number(tokens.expires_in);
  if (!Number.isFinite(expiresIn) || expiresIn <= 0) throw new Error('Sign-in response contained an invalid token lifetime.');
  return {
    accessToken: tokens.access_token,
    idToken: tokens.id_token,
    refreshToken: typeof tokens.refresh_token === 'string' ? tokens.refresh_token : undefined,
    expiresAt: Date.now() + expiresIn * 1000,
  };
};

const readSession = (): SentinelSession | null => {
  try {
    const value = sessionStorage.getItem(TOKEN_KEY);
    return value ? JSON.parse(value) as SentinelSession : null;
  } catch { return null; }
};

const saveSession = (session: SentinelSession) => sessionStorage.setItem(TOKEN_KEY, JSON.stringify(session));

export const SentinelAuth = {
  getSession: readSession,
  isAuthenticated: () => Boolean(readSession()?.accessToken),

  processCallback(): Promise<{ handled: boolean; error?: string }> {
    if (callbackPromise) return callbackPromise;
    callbackPromise = this.processCallbackOnce().finally(() => { callbackPromise = null; });
    return callbackPromise;
  },

  async processCallbackOnce(): Promise<{ handled: boolean; error?: string }> {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('code') && !params.has('error')) return { handled: false };
    const flow = sessionStorage.getItem(FLOW_KEY);
    sessionStorage.removeItem(FLOW_KEY);
    const cleanUrl = `${window.location.pathname}${window.location.hash}`;
    if (params.has('error')) {
      window.history.replaceState({}, document.title, cleanUrl);
      return { handled: true, error: params.get('error_description') || params.get('error') || 'Sign-in was cancelled.' };
    }
    try {
      const returnedState = params.get('state');
      const code = params.get('code');
      if (!flow || !code || returnedState !== JSON.parse(flow).state) throw new Error('Sign-in state validation failed. Please sign in again.');
      const { state: _state, nonce, verifier } = JSON.parse(flow) as { state: string; nonce: string; verifier: string };
      const response = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'authorization_code', client_id: CLIENT_ID, code, redirect_uri: getCallbackUrl(), code_verifier: verifier }),
      });
      const tokens = await response.json();
      if (!response.ok) throw new Error(tokens.error_description || tokens.error || 'Could not complete sign-in.');
      saveSession(validateTokens(tokens, nonce));
      window.history.replaceState({}, document.title, cleanUrl);
      return { handled: true };
    } catch (error) {
      window.history.replaceState({}, document.title, cleanUrl);
      return { handled: true, error: error instanceof Error ? error.message : 'Sign-in failed.' };
    }
  },

  async signIn(): Promise<void> {
    callbackPromise = null;
    const verifier = random(48);
    const challenge = encode(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
    const state = random(); const nonce = random();
    sessionStorage.setItem(FLOW_KEY, JSON.stringify({ state, nonce, verifier }));
    const params = new URLSearchParams({ response_type: 'code', client_id: CLIENT_ID, redirect_uri: getCallbackUrl(), scope: 'openid email phone', state, nonce, code_challenge: challenge, code_challenge_method: 'S256' });
    window.location.assign(`${COGNITO_DOMAIN}/oauth2/authorize?${params}`);
  },

  getAccessToken(): Promise<string> {
    if (refreshPromise) return refreshPromise;
    refreshPromise = this.getAccessTokenOnce().finally(() => { refreshPromise = null; });
    return refreshPromise;
  },

  async getAccessTokenOnce(): Promise<string> {
    let session = readSession();
    if (!session) throw new Error('Sign in to Sentinel to view and update security events.');
    if (session.expiresAt > Date.now() + 60_000) return session.accessToken;
    if (!session.refreshToken) {
      sessionStorage.removeItem(TOKEN_KEY);
      throw new Error('Sentinel session expired. Please sign in again.');
    }
    const response = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'refresh_token', client_id: CLIENT_ID, refresh_token: session.refreshToken }),
    });
    const tokens = await response.json();
    if (!response.ok) {
      sessionStorage.removeItem(TOKEN_KEY);
      throw new Error(tokens.error_description || 'Sentinel session expired. Please sign in again.');
    }
    session = { ...session, accessToken: tokens.access_token, idToken: tokens.id_token || session.idToken, expiresAt: Date.now() + (Number(tokens.expires_in) || 3600) * 1000, refreshToken: tokens.refresh_token || session.refreshToken };
    saveSession(session);
    return session.accessToken;
  },

  signOut(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(FLOW_KEY);
    const params = new URLSearchParams({ client_id: CLIENT_ID, logout_uri: getCallbackUrl() });
    window.location.assign(`${COGNITO_DOMAIN}/logout?${params}`);
  },
  clearSession(): void { sessionStorage.removeItem(TOKEN_KEY); },
};
