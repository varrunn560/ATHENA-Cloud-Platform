# DA III runtime verification

## Results

The Vault API was verified through the local Vite proxy using GET requests. AWS account-side configuration checks remain unavailable because the `athena` AWS CLI profile failed authentication. This is an access limit, not evidence that the resources are absent.

### Vault API through local proxy

`http://127.0.0.1:5174/vault-api` reached the Vault API:

- `GET /api/files`: HTTP 200; response contained 13 entries. Filenames and sizes below reflect only this response, not a claim about complete bucket inventory.

  | Filename | Bytes |
  |---|---:|
  | CAD-testing.txt | 14 |
  | test-ct.pdf | 18 |
  | test-ct.pdf | 18 |
  | upload-test.txt | 26 |
  | test-ct.pdf | 18 |
  | frontend-test.txt | 27 |
  | cors-put-test.txt | 19 |
  | test-upload.txt | 20 |
  | athena-test.txt | 22 |
  | CAD-testing.txt | 14 |
  | upload-proxy-check.txt | 32 |
  | test-ct.pdf | 18 |
  | integration-test.txt | 56 |

- `GET /api/files/versions?key=demo/athena-test.txt`: HTTP 200; 5 versions returned.
- `GET /api/files/download-url?key=demo/athena-test.txt`: HTTP 200; expiry 300 seconds. The signed URL was returned by the service but was neither saved nor shown.
- Task-shared fresh-session UI verification reported Vault live mode, version history, and recovery confirmation loaded. This read-only check did not issue a restore.
- An earlier direct Node request to the API host failed DNS resolution (`ENOTFOUND`); the local Vite proxy succeeded. No HTTP responses were received from that direct attempt.

### Intellect OCR

Task-shared fresh-session UI verification completed the local Tesseract sample: 16 words, 130 characters, 91.0% engine confidence. This is engine confidence, not benchmark accuracy, and does not verify AWS Textract.

### AWS account configuration

- AWS CLI executable was present, but `sts get-caller-identity` using profile `athena` exited nonzero. Per instruction, no login or credential changes were attempted.
- CloudTrail trail status, EventBridge rule states/targets, Lambda configurations, and DynamoDB table status/item-count metadata remain **not checked**.
- No resource count or absence claim is made. AWS MCP documentation/skill tools were unavailable; local AWS observability, serverless, DynamoDB, and messaging/EventBridge guidance was read.

## Evidence boundary

Vault API and UI results above are runtime evidence for the listed operations. Object Lock/WORM, retention compliance, and AWS account-side configuration are unverified. Test Sentinel events do not establish genuine threat activity. The machine-readable record is [runtime_verification.json](runtime_verification.json).
