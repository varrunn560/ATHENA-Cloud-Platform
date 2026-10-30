# Architecture diagram evidence and scope

**Artifact:** `DA3-Submission/Athena_Architecture_Diagram.png`  
**Basis:** inspected frontend source in `src/`; runtime resource details are only marked confirmed where provided by prior live UI/runtime evidence.

## Confirmed in the application source

- The browser client is a React 19, Vite, TypeScript application styled with Tailwind CSS 4 (`package.json`, `vite.config.ts`, `src/main.tsx`).
- Vault calls the API Gateway base URL `https://w5vwnekg26.execute-api.ap-south-1.amazonaws.com` and implements presigned S3 upload/download, version listing, and restore flows. Upload bytes are sent directly to the presigned S3 URL (`src/services/api.ts`). The bucket and region are `athena-vault-cad` and `ap-south-1`.
- Sentinel calls `https://4so1d2xc4k.execute-api.ap-south-1.amazonaws.com`, adds a Cognito access token as a Bearer token, and uses Cognito Hosted UI authorization code + PKCE (`src/services/sentinelApi.ts`, `src/services/sentinelAuth.ts`). The UI supports event list/detail and acknowledge/investigate/resolve actions.
- The Sentinel client source configures a Cognito user pool issuer in `ap-south-1` (`src/services/sentinelAuth.ts`). The API/service names and DynamoDB table shown in the diagram reflect the configured integration context supplied for this submission; this diagram does not claim a new AWS runtime audit.
- Athena Intellect runs Tesseract.js OCR in the browser on image files; its enterprise presets explicitly simulate Textract data (`src/components/modules/intellect/DocumentUploadZone.tsx`).

## Configured paths shown with dashed amber lines

CloudTrail `athena-sentinel-trail` → EventBridge failed-console-sign-in / S3 AccessDenied rules → Lambda `athena-sentinel-handler` → DynamoDB `athena-sentinel-events` is shown as configured, not independently re-verified in this diagram. The current trigger wiring, successful event writes, and the Sentinel API Lambda's live DynamoDB dependency were not newly inspected as part of diagram preparation.

The Vault Lambda compute target is intentionally marked unconfirmed. The checked frontend proves the API Gateway endpoint and presigned S3 client flow, but does not identify the deployed Lambda target or prove its current mapping.

## Explicitly excluded from live AWS architecture

Amazon Textract and Amazon Comprehend appear only as planned backend integrations. The app's current image OCR is local Tesseract.js; sample document presets use simulated Textract results. No cloud OCR path is presented as live.

The diagram does not assert that S3 encryption keys, Object Lock, WORM retention, or any protection setting is enabled. Those require AWS-side runtime configuration evidence.

## S3 version-history runtime check

After the initial diagram was prepared, the Vault versions endpoint was checked through the local Vite proxy for `demo/athena-test.txt`: it returned HTTP 200 with five version records. The diagram therefore labels S3 version history as a verified client feature. The check confirms version listing for that key; it does not establish a restore operation was executed successfully. The restore interface is present in the client source, but no restore execution is claimed.
