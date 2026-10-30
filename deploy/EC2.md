# Athena EC2 deployment

Target: https://athena.joelalfred.me/ (currently serves the Hermes Agent).

Stage the Athena release separately from Hermes before switching the domain's virtual host. Preserve the existing Hermes service and its configuration so administration and rollback remain available.

Build-time public configuration:

```text
VITE_VAULT_API_BASE_URL=/vault-api
VITE_VAULT_S3_PROXY_BASE_URL=/vault-s3
VITE_SENTINEL_COGNITO_CALLBACK_URL=https://athena.joelalfred.me/
```

Serve the release as a static SPA with an index.html fallback for application routes. Proxy `/vault-api/` to `https://w5vwnekg26.execute-api.ap-south-1.amazonaws.com/`, stripping only `/vault-api`. Proxy `/vault-s3/` to `https://athena-vault-cad.s3.ap-south-1.amazonaws.com/`, stripping only `/vault-s3`. Preserve the original S3 path encoding, query string, HTTP method, and upload bytes; signatures depend on them. Use the correct upstream Host header and TLS SNI, and allow 50 MiB uploads. Upstream hosts must be fixed, not chosen from request parameters. Serve index.html without persistent caching and fingerprinted assets with immutable caching.

Keep HTTPS enabled. Cognito requires the exact callback and logout URL `https://athena.joelalfred.me/` registered on public client `1hj8di9u0q1chqfr5s8j92hstl` in pool `ap-south-1_rs8P3dyCw`. Preserve localhost and other valid existing URLs. Sentinel API `4so1d2xc4k` must allow the exact HTTPS origin in CORS with GET, POST, OPTIONS and Authorization, Content-Type. Preserve existing allowed origins.

The archive contains only public build output. It must not contain AWS credentials, private keys, Cognito tokens, or node_modules.

Verify HTTPS, static assets, Vault catalog, a small upload/download, and Cognito sign-in plus Sentinel loading before considering the deployment complete. Status actions should be tested with a designated test event rather than resolving a real incident.
