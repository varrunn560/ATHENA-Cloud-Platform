import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { createServer } from 'vite';

// Exercise the real TypeScript modules with controlled browser storage and HTTP responses.
const storage = new Map();
globalThis.sessionStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key),
};
const localSettings = new Map();
globalThis.localStorage = { getItem: key => localSettings.get(key) ?? null, setItem: (key, value) => localSettings.set(key, String(value)) };
let destination;
const location = { origin: 'http://localhost:5174', pathname: '/', hash: '', search: '', assign: url => { destination = url; } };
globalThis.window = { location, history: { replaceState: () => { location.search = ''; } } };
globalThis.document = { title: 'Sentinel test' };
if (!globalThis.crypto) globalThis.crypto = webcrypto;
const tokenKey = 'athena_sentinel_oauth_tokens';
const flowKey = 'athena_sentinel_oauth_flow';
const jwt = claims => `test.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.test`;
const validSession = () => sessionStorage.setItem(tokenKey, JSON.stringify({ accessToken: 'test-access-token', idToken: 'test-id-token', expiresAt: Date.now() + 3600000 }));
const server = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
let passed = 0;
async function check(name, fn) { await fn(); passed++; console.log(`PASS ${name}`); }
try {
  const { SentinelAuth } = await server.ssrLoadModule('/src/services/sentinelAuth.ts');
  const { SentinelApi, mapSentinelEvent } = await server.ssrLoadModule('/src/services/sentinelApi.ts');
  const { ApiService } = await server.ssrLoadModule('/src/services/api.ts');
  await check('AWS event fields and uppercase statuses map into UI values', async () => {
    const event = mapSentinelEvent({ eventId: 'event-1', eventName: 'ConsoleLogin', status: 'INVESTIGATING', severity: 'HIGH', time: '2026-10-30T00:00:00Z', region: 'ap-south-1', userIdentity: { arn: 'test-principal' } });
    assert.equal(event.id, 'event-1'); assert.equal(event.status, 'investigating');
    assert.equal(event.severity, 'high'); assert.equal(event.principal, 'test-principal');
    assert.deepEqual(event.investigationSteps, []);
  });
  await check('missing Cognito session prevents unauthenticated API requests', async () => {
    storage.clear(); globalThis.fetch = async () => { throw new Error('Unexpected HTTP request'); };
    await assert.rejects(() => SentinelApi.list(), /sign in/i);
  });
  await check('event list uses dedicated Sentinel route and bearer token', async () => {
    validSession();
    globalThis.fetch = async (url, options) => {
      assert.equal(String(url), 'https://4so1d2xc4k.execute-api.ap-south-1.amazonaws.com/api/sentinel/events');
      assert.equal(options.headers.Authorization, 'Bearer test-access-token');
      return Response.json({ events: [{ eventId: 'real-id', status: 'OPEN', severity: 'LOW' }] });
    };
    assert.equal((await SentinelApi.list())[0].id, 'real-id');
  });
  await check('status action uses POST and safely encodes event ID', async () => {
    globalThis.fetch = async (url, options) => {
      assert.ok(String(url).endsWith('/api/sentinel/events/id%2Fwith%20space/resolve'));
      assert.equal(options.method, 'POST');
      return Response.json({ event: { eventId: 'id/with space', status: 'RESOLVED' } });
    };
    assert.equal((await SentinelApi.action('id/with space', 'resolve')).status, 'resolved');
  });
  await check('backend failure is surfaced instead of substituting demo alerts', async () => {
    globalThis.fetch = async () => new Response('Service unavailable', { status: 503 });
    await assert.rejects(() => SentinelApi.list(), /503/);
  });
  await check('invalid event-list response is rejected', async () => {
    globalThis.fetch = async () => Response.json({ wrong: 'shape' });
    await assert.rejects(() => SentinelApi.list());
  });
  await check('expired session without refresh token requires sign-in', async () => {
    sessionStorage.setItem(tokenKey, JSON.stringify({ accessToken: 'expired', expiresAt: 0 }));
    await assert.rejects(() => SentinelAuth.getAccessToken(), /expired|sign in/i);
    assert.equal(sessionStorage.getItem(tokenKey), null);
  });
  await check('concurrent requests refresh an expired token only once', async () => {
    sessionStorage.setItem(tokenKey, JSON.stringify({ accessToken: 'expired', refreshToken: 'test-refresh', expiresAt: 0 }));
    let requests = 0;
    globalThis.fetch = async () => { requests++; await new Promise(resolve => setTimeout(resolve, 10)); return Response.json({ access_token: 'renewed', expires_in: 3600 }); };
    assert.deepEqual(await Promise.all([SentinelAuth.getAccessToken(), SentinelAuth.getAccessToken()]), ['renewed', 'renewed']);
    assert.equal(requests, 1);
  });
  await check('sign-in generates PKCE, state and nonce for the registered callback', async () => {
    storage.clear(); await SentinelAuth.signIn();
    const url = new URL(destination); const flow = JSON.parse(sessionStorage.getItem(flowKey));
    assert.equal(url.origin, 'https://ap-south-1rs8p3dycw.auth.ap-south-1.amazoncognito.com');
    assert.equal(url.searchParams.get('redirect_uri'), 'http://localhost:5174/');
    assert.equal(url.searchParams.get('response_type'), 'code');
    assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
    assert.equal(url.searchParams.get('state'), flow.state); assert.equal(url.searchParams.get('nonce'), flow.nonce);
    const expected = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(flow.verifier))).toString('base64url');
    assert.equal(url.searchParams.get('code_challenge'), expected);
  });
  await check('OAuth state mismatch is rejected before token exchange', async () => {
    location.search = '?code=test-code&state=wrong-state';
    globalThis.fetch = async () => { throw new Error('Unexpected token exchange'); };
    const result = await SentinelAuth.processCallback();
    assert.equal(result.handled, true); assert.match(result.error, /state/i);
    assert.equal(sessionStorage.getItem(tokenKey), null);
  });
  await check('React concurrent callback handling exchanges the code once', async () => {
    await SentinelAuth.signIn(); const flow = JSON.parse(sessionStorage.getItem(flowKey));
    location.search = `?code=test-code&state=${encodeURIComponent(flow.state)}`;
    let requests = 0;
    globalThis.fetch = async () => {
      requests++; await new Promise(resolve => setTimeout(resolve, 10));
      return Response.json({ access_token: 'authorized-access', id_token: jwt({ nonce: flow.nonce, aud: '1hj8di9u0q1chqfr5s8j92hstl', iss: 'https://cognito-idp.ap-south-1.amazonaws.com/ap-south-1_rs8P3dyCw', exp: Math.floor(Date.now() / 1000) + 3600 }), expires_in: 3600 });
    };
    const results = await Promise.all([SentinelAuth.processCallback(), SentinelAuth.processCallback()]);
    assert.equal(requests, 1); assert.ok(results.every(result => !result.error));
    assert.equal(await SentinelAuth.getAccessToken(), 'authorized-access');
    assert.equal(location.search, '');
  });
  await check('API authorization failure clears the expired session', async () => {
    validSession(); globalThis.fetch = async () => new Response('Unauthorized', { status: 401 });
    await assert.rejects(() => SentinelApi.list(), /401/);
    assert.equal(SentinelAuth.isAuthenticated(), false);
  });
  await check('live service failure returns no demo events and a visible error', async () => {
    localSettings.clear(); validSession();
    globalThis.fetch = async () => new Response('Unavailable', { status: 503 });
    const result = await ApiService.getSecurityEvents();
    assert.deepEqual(result.events, []); assert.equal(result.isLive, false); assert.equal(result.isDemo, false); assert.match(result.error, /503/);
  });
  await check('demo events require explicit demo mode', async () => {
    ApiService.setDemoMode(true);
    globalThis.fetch = async () => { throw new Error('Demo mode must not call the live API'); };
    const result = await ApiService.getSecurityEvents();
    assert.equal(result.isDemo, true); assert.equal(result.isLive, false); assert.ok(result.events.length > 0);
    ApiService.setDemoMode(false);
  });
  console.log(`Verified ${passed} Sentinel checks.`);
} finally { await server.close(); }
