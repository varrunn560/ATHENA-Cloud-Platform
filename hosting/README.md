# Temporary Athena demo

This route forwards the running Vite app on port 5174 and preserves its Vault API and S3 proxies. The computer, Vite server, and ngrok process must remain running.

1. Install the official ngrok Windows executable here as `ngrok.exe` and configure your ngrok account locally following the ngrok dashboard instructions. Do not put account credentials in this repository or in chat.
2. Start Vite from the project root using `npm.cmd run dev` if port 5174 is not already serving Athena.
3. Run `powershell -ExecutionPolicy Bypass -File hosting\start-demo.ps1` from the project root.
4. Record the HTTPS forwarding URL displayed by ngrok.

Before Sentinel sign-in can work at that URL, coordinate with the active Sentinel setup work to add the exact public URL with trailing slash to Cognito callback/logout URLs, preserving existing localhost entries, and add the public origin to Sentinel API CORS. The frontend defaults its callback to the current origin; any explicit callback environment override must match the public URL. No cloud changes have been made by this hosting preparation.

Verify the public homepage, Vault list/upload/download flow, and Sentinel login/API request before sharing the demo as fully working. Stop ngrok with Ctrl+C to take the demo offline.

A static Vercel upload is not equivalent: Vault uses development-only proxies. Deploying to Vercel requires server proxies or verified AWS CORS and endpoint changes first.
