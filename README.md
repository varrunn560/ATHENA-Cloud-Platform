# Athena — Intelligent Cloud Data Protection & Security Platform

Athena is a centralized, presentation-ready cloud data protection and security operations dashboard designed for enterprise environments.

## 🚀 Key Modules

1. **Executive Overview**: Centralized cockpit featuring storage volume metrics, active security finding counters, immutable backup health SLA, automated snapshot retention, and an interactive **Security Alert Trend** chart built with Recharts.
2. **Athena Vault**: Encrypted object storage and version recovery interface simulating Amazon S3 & Glacier Flexible with S3 Object Lock (WORM compliance), client-side file validation, metadata inspection, version history timelines, and safe rollback recovery dialogs.
3. **Athena Intellect**: Intelligent document layout analysis and OCR extraction emulating Amazon Textract & Amazon Comprehend, complete with sample enterprise presets, processing states (Pending, Processing, Completed), extracted plain text viewer with search and copy tools, key-value form pairs, and entity tagging.
4. **Athena Sentinel**: Cloud threat defense and audit event monitoring simulating AWS CloudTrail & EventBridge event streams, with multi-level severity triage (Critical, High, Medium, Low), category and status filters, forensic detail slide-out drawer, and interactive investigation runbook checklists.
5. **Platform Settings & Backend Readiness**: Complete configuration cockpit distinguishing **Connected**, **Not configured**, and **Demo mode** AWS resources. Includes an isolated API client service layer (`src/services/api.ts`) with documented request/response contracts for 9 REST endpoints.

---

## 🛠️ Technology Stack

- **Framework**: React 19 with Vite 8 & TypeScript
- **Styling**: Tailwind CSS v4 & custom enterprise theme
- **Icons**: Lucide React
- **Data Visualization**: Recharts
- **State Management**: React Context (`AppContext`) with zero external state overhead

---

## 💻 Running the Application Locally

To run the Athena dashboard locally:

```bash
# 1. Install dependencies (if not already installed)
npm install

# 2. Start Vite development server
npm run dev
```

The application will launch on `http://localhost:5174/`.

To build the production bundle:

```bash
npm run build
```

---

## 🔌 Backend Integration Guide (for Teammates)

The frontend is built with an isolated API service layer located in `src/services/api.ts`. All 9 proposed contracts are documented with TypeScript types and can be tested live or in Demo Mode:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/overview` | High-level metrics, alert trend timeseries, storage distribution, health checklist |
| `GET` | `/api/files` | S3 Vault object catalog with metadata, storage class, and retention status |
| `POST` | `/api/files` | Initiate file staging / multipart upload to S3 Vault |
| `GET` | `/api/files/:id/versions` | Retrieve historical revision records and author commit notes |
| `POST` | `/api/files/:id/recover` | Rollback object to historical version (S3 CopyObject) |
| `POST` | `/api/documents/analyze` | Trigger asynchronous Textract OCR document layout analysis |
| `GET` | `/api/documents` | Retrieve catalog of analyzed documents and key-value forms |
| `GET` | `/api/sentinel/events` | Sentinel event catalog; requires Cognito bearer token |
| `GET` | `/api/sentinel/events/:id` | Sentinel event details; requires Cognito bearer token |
| `POST` | `/api/sentinel/events/:id/acknowledge` | Persist acknowledged status |
| `POST` | `/api/sentinel/events/:id/investigate` | Persist investigating status |
| `POST` | `/api/sentinel/events/:id/resolve` | Persist resolved status |

Sentinel uses its dedicated API at `https://4so1d2xc4k.execute-api.ap-south-1.amazonaws.com`, separately from Vault. Open Athena Sentinel and select **Sign in** using your existing application login. The browser uses Cognito authorization code flow with PKCE; AWS Console credentials are separate. Live Sentinel errors require sign-in or retry and never substitute sample alerts. Sample alerts are available only in explicit Demo Mode.

Copy `.env.example` to `.env.local` to override the public endpoints and Cognito app-client settings. Restart Vite after changing environment variables. Cognito callback URLs must match the app origin and trailing slash exactly; deployed origins also need API Gateway CORS configuration. No AWS access keys or client secrets belong in the frontend.

The deployed Sentinel Lambda persists status changes but does not persist investigation notes or checklist updates. Those controls are unavailable for live events.

Vault development requests use the existing Vite proxies for its API and presigned S3 uploads. Production hosting must provide the required AWS CORS settings or equivalent server proxy.
