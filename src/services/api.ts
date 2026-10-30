/**
 * Athena Platform — API Service Layer
 * 
 * Proposed frontend integration contracts for AWS backend services.
 * Integrates with:
 *  - Amazon S3 & Glacier via /api/files
 *  - Amazon Textract via /api/documents
 *  - AWS CloudTrail / EventBridge via /api/security/events
 *  - Platform Dashboard via /api/overview
 * 
 * NOTE: Operates gracefully in DEMO MODE when backend endpoints are offline.
 */

import {
  OverviewMetrics,
  VaultFile,
  FileVersion,
  IntellectDocument,
  SecurityEvent,
  EventStatus,
} from '../types';
import {
  INITIAL_FILES,
  INITIAL_INTELLECT_DOCS,
  INITIAL_SECURITY_EVENTS,
  INITIAL_OVERVIEW_METRICS,
} from './demoData';
import { SentinelApi } from './sentinelApi';

// Configuration keys
// Configuration keys
const STORAGE_KEY_BASE_URL = 'athena_api_base_url';
const STORAGE_KEY_DEMO_MODE = 'athena_demo_mode_active';
const S3_UPLOAD_ORIGIN = 'https://athena-vault-cad.s3.ap-south-1.amazonaws.com';
const CONFIGURED_S3_PROXY_BASE = import.meta.env.VITE_VAULT_S3_PROXY_BASE_URL?.replace(/\/+$/, '');

export const DEFAULT_API_BASE_URL = (import.meta.env.VITE_VAULT_API_BASE_URL || 'https://w5vwnekg26.execute-api.ap-south-1.amazonaws.com').replace(/\/+$/, '');

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export class ApiService {
  public static getBaseUrl(): string {
    const stored = localStorage.getItem(STORAGE_KEY_BASE_URL);
    const baseUrl = (!stored || stored === '/api' ? DEFAULT_API_BASE_URL : stored).replace(/\/+$/, '');
    // Local requests use Vite's proxy because the AWS upload preflight fails.
    return import.meta.env.DEV && baseUrl === DEFAULT_API_BASE_URL ? '/vault-api' : baseUrl;
  }

  public static setBaseUrl(url: string): void {
    localStorage.setItem(STORAGE_KEY_BASE_URL, url);
  }

  public static isDemoMode(): boolean {
    const stored = localStorage.getItem(STORAGE_KEY_DEMO_MODE);
    return stored === 'true';
  }

  public static setDemoMode(active: boolean): void {
    localStorage.setItem(STORAGE_KEY_DEMO_MODE, String(active));
  }

  /**
   * Health check for backend readiness
   */
  public static async testBackendConnection(): Promise<{ online: boolean; message: string; latencyMs?: number }> {
    const start = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`${this.getBaseUrl()}/api/files`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const latencyMs = Math.round(performance.now() - start);
      if (res.ok) {
        return { online: true, message: 'Backend reachable and responsive (AWS ap-south-1)', latencyMs };
      }
      return { online: false, message: `Backend returned status ${res.status}` };
    } catch {
      return {
        online: false,
        message: 'Endpoint unreachable. Athena is running in Demo Data Mode.',
      };
    }
  }

  // ==========================================
  // 1. OVERVIEW: GET /api/overview
  // ==========================================
  /**
   * Fetches high-level security metrics, backup status, and recent activity.
   */
  public static async getOverview(): Promise<OverviewMetrics> {
    if (!this.isDemoMode()) {
      try {
        const res = await fetch(`${this.getBaseUrl()}/overview`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('[Athena API] Fallback to demo data for /api/overview', err);
      }
    }
    await new Promise((r) => setTimeout(r, 120));
    return INITIAL_OVERVIEW_METRICS;
  }

  // ==========================================
  // 2. VAULT: GET /api/files
  // ==========================================
  /**
   * Retrieves files stored in Athena Vault.
   * Real endpoint: GET /api/files
   */
  public static async getFiles(): Promise<{ files: VaultFile[]; isLive: boolean; error?: string }> {
    if (!this.isDemoMode()) {
      try {
        const res = await fetch(`${this.getBaseUrl()}/api/files`);
        if (res.ok) {
          const data = await res.json();
          const rawFiles: { key: string; size: number }[] = data.files || [];
          const mappedFiles: VaultFile[] = rawFiles.map((item) => {
            const fileName = item.key.split('/').pop() || item.key;
            const ext = (fileName.split('.').pop() || '').toLowerCase();
            return {
              id: item.key,
              key: item.key,
              name: fileName,
              extension: ext,
              sizeBytes: item.size,
              sizeFormatted: formatBytes(item.size),
              modifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
              storageClass: 'S3 Standard',
              versionCount: 1,
              status: 'Active',
              s3Uri: `s3://athena-vault-cad/${item.key}`,
              bucket: 'athena-vault-cad',
              etag: '-',
              kmsKeyArn: 'arn:aws:kms:ap-south-1:965859022862:key/vault-master-key',
              encryption: 'AES-256',
              retentionDays: 365,
              isWormLocked: false,
              isLive: true,
            };
          });
          return { files: mappedFiles, isLive: true };
        } else {
          const errText = await res.text().catch(() => '');
          return {
            files: [...INITIAL_FILES],
            isLive: false,
            error: `API returned status ${res.status}: ${errText || res.statusText}`,
          };
        }
      } catch (err: any) {
        console.warn('[Athena API] Fallback to demo data for /api/files', err);
        return {
          files: [...INITIAL_FILES],
          isLive: false,
          error: err?.message || 'Network error connecting to Vault API',
        };
      }
    }
    await new Promise((r) => setTimeout(r, 120));
    return { files: [...INITIAL_FILES], isLive: false };
  }

  // ==========================================
  // 3. VAULT: POST /api/files/upload-url + S3 PUT
  // ==========================================
  /**
   * Step 1: Request presigned S3 upload URL.
   * Real endpoint: POST /api/files/upload-url
   */
  public static async requestUploadUrl(
    filename: string
  ): Promise<{ key: string; uploadUrl: string; expiresIn: number }> {
    const res = await fetch(`${this.getBaseUrl()}/api/files/upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Failed to obtain upload URL (${res.status}): ${errText || res.statusText}`);
    }
    return await res.json();
  }

  /**
   * Step 2: PUT raw file bytes directly to the returned presigned S3 URL.
   * Notice: Do NOT add Authorization header or custom headers to S3 presigned PUT.
   */
  public static async uploadFileRaw(uploadUrl: string, file: File): Promise<void> {
    const target = new URL(uploadUrl);
    const proxyBase = CONFIGURED_S3_PROXY_BASE || (import.meta.env.DEV ? '/vault-s3' : null);
    const localUploadUrl = proxyBase && target.origin === S3_UPLOAD_ORIGIN
      ? `${proxyBase}${target.pathname}${target.search}`
      : uploadUrl;
    const res = await fetch(localUploadUrl, {
      method: 'PUT',
      body: file,
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`S3 direct upload failed (${res.status}): ${errText || res.statusText}`);
    }
  }

  /**
   * Upload file end-to-end (Real AWS S3 presigned upload or Demo simulation).
   */
  public static async uploadFile(fileOrData: File | Partial<VaultFile>): Promise<VaultFile> {
    if (fileOrData instanceof File && !this.isDemoMode()) {
      // 1. Request presigned URL
      const { key, uploadUrl } = await this.requestUploadUrl(fileOrData.name);
      // 2. PUT file bytes to S3
      await this.uploadFileRaw(uploadUrl, fileOrData);
      // 3. Return created VaultFile representation
      const ext = (fileOrData.name.split('.').pop() || '').toLowerCase();
      return {
        id: key,
        key: key,
        name: fileOrData.name,
        extension: ext,
        sizeBytes: fileOrData.size,
        sizeFormatted: formatBytes(fileOrData.size),
        modifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        storageClass: 'S3 Standard',
        versionCount: 1,
        status: 'Active',
        s3Uri: `s3://athena-vault-cad/${key}`,
        bucket: 'athena-vault-cad',
        etag: '-',
        kmsKeyArn: 'arn:aws:kms:ap-south-1:965859022862:key/vault-master-key',
        encryption: 'AES-256',
        retentionDays: 365,
        isWormLocked: false,
        isLive: true,
      };
    }

    // Demo simulation fallback
    await new Promise((r) => setTimeout(r, 400));
    const name = fileOrData instanceof File ? fileOrData.name : fileOrData.name || 'document.pdf';
    const size = fileOrData instanceof File ? fileOrData.size : fileOrData.sizeBytes || 1024000;
    const ext = name.split('.').pop() || 'pdf';
    return {
      id: `vf-${Date.now().toString(36)}`,
      name,
      extension: ext,
      sizeBytes: size,
      sizeFormatted: formatBytes(size),
      modifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      storageClass: (fileOrData as Partial<VaultFile>).storageClass || 'S3 Standard',
      versionCount: 1,
      status: 'Active',
      s3Uri: `s3://athena-vault-production/inbound/${name}`,
      bucket: 'athena-vault-production',
      etag: Math.random().toString(36).substring(2, 18),
      kmsKeyArn: 'arn:aws:kms:us-east-1:849204910291:key/vault-prod-master-key',
      encryption: 'AES-256',
      retentionDays: 365,
      isWormLocked: (fileOrData as Partial<VaultFile>).isWormLocked || false,
      isLive: false,
      versions: [
        {
          versionId: `v-${Math.random().toString(36).substring(2, 10)}`,
          modifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
          sizeBytes: size,
          sizeFormatted: formatBytes(size),
          author: 'demo-user@athena.internal',
          notes: 'Initial upload via Athena Vault web client',
          isCurrent: true,
          etag: Math.random().toString(36).substring(2, 18),
        },
      ],
    };
  }

  // ==========================================
  // 4. VAULT: GET /api/files/download-url?key=...
  // ==========================================
  /**
   * Requests a presigned download URL for a file.
   * Real endpoint: GET /api/files/download-url?key=URL_ENCODED_KEY
   */
  public static async getDownloadUrl(
    key: string
  ): Promise<{ key: string; downloadUrl: string; expiresIn: number }> {
    if (this.isDemoMode()) {
      await new Promise((r) => setTimeout(r, 150));
      return {
        key,
        downloadUrl: `https://athena-vault-cad.s3.ap-south-1.amazonaws.com/${encodeURIComponent(key)}?demo=true`,
        expiresIn: 300,
      };
    }

    const res = await fetch(`${this.getBaseUrl()}/api/files/download-url?key=${encodeURIComponent(key)}`);
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Failed to obtain download URL (${res.status}): ${errText || res.statusText}`);
    }
    return await res.json();
  }

  // ==========================================
  // 5. VAULT: GET /api/files/versions?key=...
  // ==========================================
  /**
   * Retrieves S3 version history for a specific key.
   * Real endpoint: GET /api/files/versions?key=URL_ENCODED_KEY
   */
  public static async getFileVersions(key: string): Promise<FileVersion[]> {
    if (!this.isDemoMode()) {
      try {
        const res = await fetch(`${this.getBaseUrl()}/api/files/versions?key=${encodeURIComponent(key)}`);
        if (res.ok) {
          const data = await res.json();
          const rawVersions: {
            versionId: string;
            lastModified: string;
            size: number;
            isLatest: boolean;
          }[] = data.versions || [];

          return rawVersions.map((v) => ({
            versionId: v.versionId,
            modifiedAt: v.lastModified.replace('T', ' ').replace('+00:00', ' UTC'),
            sizeBytes: v.size,
            sizeFormatted: formatBytes(v.size),
            author: 'AWS S3 Versioning',
            notes: v.isLatest ? 'Current head version' : 'Historical revision snapshot',
            isCurrent: Boolean(v.isLatest),
            etag: v.versionId,
          }));
        } else {
          console.warn(`[Athena API] Versions request returned ${res.status} for ${key}`);
        }
      } catch (err) {
        console.warn(`[Athena API] Fallback to demo versions for key ${key}`, err);
      }
    }
    await new Promise((r) => setTimeout(r, 120));
    const file = INITIAL_FILES.find((f) => f.id === key || f.name === key);
    return file?.versions || [];
  }

  // ==========================================
  // 6. VAULT: POST /api/files/restore
  // ==========================================
  /**
   * Restores an earlier version as the new current version.
   * Real endpoint: POST /api/files/restore
   * Body: { "key": "demo/athena-test.txt", "versionId": "OLDER_VERSION_ID" }
   */
  public static async restoreFileVersion(
    key: string,
    versionId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string; restoredVersion: string; timestamp: string }> {
    if (!this.isDemoMode()) {
      const res = await fetch(`${this.getBaseUrl()}/api/files/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, versionId }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Restore failed (${res.status}): ${errText || res.statusText}`);
      }
      const data = await res.json();
      return {
        success: true,
        message: data.message || 'File version restored successfully',
        restoredVersion: versionId,
        timestamp: new Date().toISOString(),
      };
    }

    await new Promise((r) => setTimeout(r, 350));
    return {
      success: true,
      message: `Version ${versionId} restored as head revision in demo storage.`,
      restoredVersion: versionId,
      timestamp: new Date().toISOString(),
    };
  }

  // ==========================================
  // 6. INTELLECT: GET /api/documents
  // ==========================================
  /**
   * Lists processed OCR documents and extraction metadata.
   * Proposed Endpoint: GET /api/documents
   */
  public static async getDocuments(): Promise<IntellectDocument[]> {
    if (!this.isDemoMode()) {
      try {
        const res = await fetch(`${this.getBaseUrl()}/documents`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('[Athena API] Fallback to demo data for /api/documents', err);
      }
    }
    await new Promise((r) => setTimeout(r, 150));
    return [...INITIAL_INTELLECT_DOCS];
  }

  // ==========================================
  // 7. INTELLECT: POST /api/documents/analyze
  // ==========================================
  /**
   * Triggers an asynchronous Amazon Textract extraction analysis.
   * Proposed Endpoint: POST /api/documents/analyze
   */
  public static async analyzeDocument(
    docPayload: Partial<IntellectDocument>
  ): Promise<IntellectDocument> {
    if (!this.isDemoMode()) {
      try {
        const res = await fetch(`${this.getBaseUrl()}/documents/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(docPayload),
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('[Athena API] Fallback to demo document analyze', err);
      }
    }
    await new Promise((r) => setTimeout(r, 450));
    const newDoc: IntellectDocument = {
      id: `doc-${Date.now().toString(36)}`,
      title: docPayload.title || docPayload.fileName || 'Uploaded Analysis Document',
      fileName: docPayload.fileName || 'analyzed_document.pdf',
      fileSizeBytes: docPayload.fileSizeBytes || 2400100,
      fileSizeFormatted: docPayload.fileSizeFormatted || '2.3 MB',
      uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      processedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      status: 'completed',
      processingProgress: 100,
      pageCount: docPayload.pageCount || 4,
      overallConfidence: 99.2,
      detectedLanguage: 'en-US',
      s3Source: `s3://athena-intellect-inbound/${docPayload.fileName || 'document.pdf'}`,
      rawBlocksCount: 246,
      isDemoSample: true,
      extractedText: `DOCUMENT EXTRACTION SUMMARY (DEMO TEXTRACT RESULT)
Document Name: ${docPayload.fileName || 'Document'}
Analyzed by Athena Intellect OCR Engine at ${new Date().toUTCString()}

KEY EXTRACTED CLAUSES:
1. Enterprise Security Agreement ratified under ISO/IEC 27001 and SOC 2 Type II guidelines.
2. Data processing limits restrict transfer to AWS US-East-1 availability zones.
3. Cryptographic controls mandate 256-bit envelope encryption using customer master keys.
4. Total Contract Value / Transaction Balance verified: $85,000.00 USD.`,
      keyValuePairs: [
        { key: 'Document Title', value: docPayload.title || 'Enterprise Document', confidence: 99.5 },
        { key: 'Confidence Score', value: '99.2% Overall', confidence: 99.8 },
        { key: 'Primary Classification', value: 'Security Architecture & Contract', confidence: 98.9 },
        { key: 'Extraction Timestamp', value: new Date().toISOString().substring(0, 10), confidence: 99.9 },
      ],
      entities: [
        { text: 'Athena Intellect', type: 'ORGANIZATION', confidence: 99.6 },
        { text: 'ISO/IEC 27001', type: 'POLICY_CLAUSE', confidence: 99.1 },
        { text: '$85,000.00 USD', type: 'MONEY', confidence: 98.5 },
      ],
    };
    return newDoc;
  }

  // ==========================================
  // 8. SENTINEL: GET /api/security/events
  // ==========================================
  /**
   * Retrieves security audit events ingested from CloudTrail / EventBridge / GuardDuty.
   * Proposed Endpoint: GET /api/security/events
   */
  public static async getSecurityEvents(): Promise<{ events: SecurityEvent[]; isLive: boolean; isDemo: boolean; error?: string }> {
    if (this.isDemoMode()) {
      await new Promise((r) => setTimeout(r, 120));
      return { events: [...INITIAL_SECURITY_EVENTS], isLive: false, isDemo: true };
    }
    try {
      return { events: await SentinelApi.list(), isLive: true, isDemo: false };
    } catch (err) {
      return { events: [], isLive: false, isDemo: false, error: err instanceof Error ? err.message : 'Could not load Sentinel events.' };
    }
  }

  public static async getSecurityEvent(eventId: string): Promise<SecurityEvent> {
    return SentinelApi.get(eventId);
  }

  // ==========================================
  // 9. SENTINEL: PATCH /api/security/events/:id
  // ==========================================
  /**
   * Updates an alert status (e.g. acknowledge or resolve) and appends investigation notes.
   * Proposed Endpoint: PATCH /api/security/events/:id
   */
  public static async updateSecurityEvent(
    eventId: string,
    updates: { status?: EventStatus; notes?: string; completedStepIndex?: number }
  ): Promise<SecurityEvent> {
    if (!this.isDemoMode()) {
      if (updates.notes !== undefined || updates.completedStepIndex !== undefined) {
        throw new Error('Sentinel currently supports status actions only. Notes and checklist progress are not saved by the backend.');
      }
      const action = updates.status === 'acknowledged' ? 'acknowledge'
        : updates.status === 'investigating' ? 'investigate'
          : updates.status === 'resolved' ? 'resolve' : null;
      if (!action) throw new Error('Choose a supported Sentinel status action.');
      return SentinelApi.action(eventId, action);
    }
    await new Promise((r) => setTimeout(r, 200));
    const target = INITIAL_SECURITY_EVENTS.find((e) => e.id === eventId);
    if (!target) throw new Error(`Security event ${eventId} not found`);

    if (updates.status) target.status = updates.status;
    if (updates.notes) target.notes = updates.notes;
    if (updates.completedStepIndex !== undefined && target.investigationSteps[updates.completedStepIndex]) {
      target.investigationSteps[updates.completedStepIndex].completed = true;
    }
    return { ...target };
  }
}
