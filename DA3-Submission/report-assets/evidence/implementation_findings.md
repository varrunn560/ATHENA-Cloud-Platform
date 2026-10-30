# DA III implementation findings

## Scope

Local source inspection, the requested Sentinel verification script, and a production build. No application source was changed and no AWS calls were made. Source evidence below proves that code paths exist; it does not by itself prove deployed runtime behavior.

## Module assessment

### Sentinel: implemented and verified

- [sentinelApi.ts](../../../src/services/sentinelApi.ts#L4) uses the dedicated Sentinel API base; lines 46–71 attach a bearer token and implement event list/detail plus POST acknowledge, investigate, and resolve actions.
- [sentinelAuth.ts](../../../src/services/sentinelAuth.ts#L1) configures Cognito. Lines 27–43 validate token claims; lines 55–139 implement PKCE sign-in, callback handling, refresh, and sign-out.
- [api.ts](../../../src/services/api.ts#L485) keeps demo fixtures behind explicit demo mode and returns empty results plus an error on live request failure rather than silently substituting sample alerts.
- The verification script passed **14/14** checks. See [test-sentinel.log](test-sentinel.log). Checks use controlled HTTP/Cognito responses, so they validate client behavior rather than AWS health.
- Runtime evidence supplied in task context: UI showed two stored test events, and `sentinel-test001` remained acknowledged after reload. This supports persisted status for test data; it does not establish genuine threat activity. No live call was repeated for this report.
- README lines 66–70 note that status changes persist, while investigation notes/checklists do not.

### Vault: partial overall; core API and UI flows runtime verified

- [api.ts](../../../src/services/api.ts#L37) configures the Vault API base. Lines 119–169 list files; lines 173–285 implement presigned upload URL and S3 PUT handling; lines 286–394 implement download URL, version listing, and restore calls.
- Fallbacks are present: file-list errors return fixture data with `isLive: false`; demo mode generates simulated file metadata and restore/download/version behavior.
- [AppContext.tsx](../../../src/context/AppContext.tsx#L139) connects UI refresh/upload/download/restore flows. [VaultPage.tsx](../../../src/components/modules/vault/VaultPage.tsx#L29) distinguishes live and simulated modes.
- Configured source routes include the API at `w5vwnekg26.execute-api.ap-south-1.amazonaws.com`, with `/api/files`, `/api/files/upload-url`, `/api/files/download-url`, `/api/files/versions`, and `/api/files/restore`. Runtime GET checks through the local Vite proxy returned HTTP 200 for file listing, version history (`demo/athena-test.txt`, 5 versions), and download URL metadata (300-second expiry). Listing response contained 13 entries; this is not asserted as the full bucket inventory. A task-shared fresh-session UI check reported live mode, version history, and recovery confirmation loaded. AWS Object Lock/WORM and retention compliance remain unverified.

### Intellect: local image OCR implemented and runtime verified; Textract path is demo/planned in this checkout

- [DocumentUploadZone.tsx](../../../src/components/modules/intellect/DocumentUploadZone.tsx#L73) runs Tesseract.js locally on PNG/JPG/JPEG images. Lines 80–87 reject PDFs and images over 25 MB; lines 25–70 tag enterprise presets as demo samples.
- [AppContext.tsx](../../../src/context/AppContext.tsx#L321) records local OCR results. [ExtractedResultsPanel.tsx](../../../src/components/modules/intellect/ExtractedResultsPanel.tsx#L68) explicitly distinguishes Textract simulation from Tesseract local OCR.
- [api.ts](../../../src/services/api.ts#L396) labels document GET/analyze endpoints proposed. Lines 422–478 attempt the endpoint and use generated demo Textract-like output as fallback.
- Task-shared fresh-session verification completed the local Tesseract sample: 16 words, 130 characters, and 91.0% engine confidence. This is engine confidence, not benchmark accuracy. No Textract call is present in the inspected local document workflow; the teammate's separately developed upstream work was not available in this checkout.

### Overview and dashboard data: demo/mock fallback

- [api.ts](../../../src/services/api.ts#L90) returns static overview metrics if demo mode is active or the request fails/returns non-OK.
- [demoData.ts](../../../src/services/demoData.ts#L10) contains static Vault, Intellect, Sentinel, and overview fixture sets. This report does not treat dashboard fixture values as live metrics.

## Build and verification

- `npm.cmd run test:sentinel`: exit 0; **14 checks passed**. Full output: [test-sentinel.log](test-sentinel.log).
- `npm.cmd run build`: exit 0; TypeScript and Vite production build succeeded, transforming 2,656 modules. Vite reported a chunk-size warning for the 842.32 kB minified JS bundle. Full output: [build.log](build.log).

## Evidence boundary

Source inspection establishes configured client behavior, not AWS deployment/runtime state. Automated Sentinel checks use mocks. The only live UI evidence noted here is prior verification reported in task context, and it covers stored test-event status persistence. No claim is made that those events represent real security threats.


