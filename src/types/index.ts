export type PageTab = 'overview' | 'vault' | 'intellect' | 'sentinel' | 'settings';

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';

export type EventStatus = 'open' | 'investigating' | 'acknowledged' | 'resolved';

export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type StorageClass = 'S3 Standard' | 'Intelligent-Tiering' | 'Glacier Flexible' | 'Glacier Deep Archive';

export type FileStatus = 'Active' | 'Archived' | 'Locked' | 'Restored';

export interface FileVersion {
  versionId: string;
  modifiedAt: string;
  sizeBytes: number;
  sizeFormatted: string;
  author: string;
  notes: string;
  isCurrent: boolean;
  etag: string;
}

export interface VaultFile {
  id: string;
  name: string;
  extension: string;
  sizeBytes: number;
  sizeFormatted: string;
  modifiedAt: string;
  storageClass: StorageClass;
  versionCount: number;
  status: FileStatus;
  s3Uri: string;
  bucket: string;
  etag: string;
  kmsKeyArn: string;
  encryption: 'aws:kms' | 'AES-256';
  retentionDays: number;
  isWormLocked: boolean; // Immutable WORM compliance
  versions?: FileVersion[];
  key?: string; // Canonical S3 object key
  isLive?: boolean; // Indicates verified AWS S3 live object vs demo
}

export interface KeyValuePair {
  key: string;
  value: string;
  confidence: number;
}

export interface DocumentEntity {
  text: string;
  type: 'ORGANIZATION' | 'DATE' | 'MONEY' | 'PERSON' | 'LOCATION' | 'PII' | 'POLICY_CLAUSE';
  confidence: number;
}

export interface IntellectDocument {
  id: string;
  title: string;
  fileName: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  uploadedAt: string;
  processedAt?: string;
  status: DocumentStatus;
  processingProgress?: number; // 0-100
  pageCount: number;
  overallConfidence: number;
  detectedLanguage: string;
  extractedText: string;
  keyValuePairs: KeyValuePair[];
  entities: DocumentEntity[];
  s3Source: string;
  rawBlocksCount: number;
  isDemoSample?: boolean;
}

export interface InvestigationStep {
  step: number;
  title: string;
  description: string;
  completed: boolean;
  actionRequired?: string;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  severity: SeverityLevel;
  eventType: string;
  source: string; // e.g. 'aws.cloudtrail', 'aws.guardduty', 'aws.iam'
  resourceArn: string;
  principal: string;
  status: EventStatus;
  awsRegion: string;
  sourceIp: string;
  userAgent: string;
  summary: string;
  mitreTactic: string;
  investigationSteps: InvestigationStep[];
  notes?: string;
  rawPayloadSnippet: Record<string, unknown>;
}

export interface SecurityAlertTrendPoint {
  date: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface ResourceHealthItem {
  id: string;
  name: string;
  category: 'Storage' | 'Intelligence' | 'Security' | 'Cryptography';
  service: string;
  status: 'healthy' | 'degraded' | 'warning' | 'demo_active';
  uptimePercentage: number;
  latencyMs: number;
  lastChecked: string;
  details: string;
}

export interface RecentActivityItem {
  id: string;
  module: 'vault' | 'intellect' | 'sentinel';
  title: string;
  description: string;
  timestamp: string;
  severity?: SeverityLevel;
  actionType: string;
  actor: string;
}

export interface OverviewMetrics {
  storedFilesCount: number;
  storedFilesVolumeFormatted: string;
  storedFilesVolumeBytes: number;
  filesGrowthMonthlyPercent: number;

  activeAlertsTotal: number;
  criticalAlertsCount: number;
  highAlertsCount: number;
  alertsChangeWeeklyPercent: number;

  backupHealthPercentage: number;
  snapshotsTotal: number;
  snapshotsIntact: number;
  lastSnapshotTime: string;
  nextScheduledBackup: string;
  wormLockActive: boolean;

  documentsProcessedTotal: number;
  ocrAccuracyPercentage: number;
  pagesAnalyzedMonth: number;
  docsGrowthMonthlyPercent: number;

  alertTrends: SecurityAlertTrendPoint[];
  recentActivities: RecentActivityItem[];
  resourceHealth: ResourceHealthItem[];
  storageBreakdown: {
    name: string;
    valueGb: number;
    color: string;
  }[];
}

export interface IntegrationCardStatus {
  serviceName: string;
  awsService: string;
  status: 'connected' | 'not_configured' | 'demo_mode';
  description: string;
  resourceIdentifier: string;
  lastSync?: string;
  latency?: string;
}

export interface AppSettings {
  demoModeActive: boolean;
  apiBaseUrl: string;
  refreshIntervalSeconds: number;
  criticalAlertToasts: boolean;
  emailNotifications: boolean;
  slackWebhookUrl: string;
  pagerDutySeverityThreshold: 'critical' | 'high' | 'all' | 'none';
  selectedRegion: string;
  density: 'comfortable' | 'compact';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'alert' | 'vault' | 'system' | 'ocr';
  severity?: SeverityLevel;
  timestamp: string;
  isRead: boolean;
  linkToTab?: PageTab;
}
