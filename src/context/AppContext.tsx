import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  PageTab,
  VaultFile,
  IntellectDocument,
  SecurityEvent,
  OverviewMetrics,
  NotificationItem,
  EventStatus,
} from '../types';
import { ApiService } from '../services/api';
import { SentinelAuth } from '../services/sentinelAuth';
import {
  INITIAL_FILES,
  INITIAL_INTELLECT_DOCS,
  INITIAL_OVERVIEW_METRICS,
  INITIAL_NOTIFICATIONS,
} from '../services/demoData';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface AppContextType {
  activeTab: PageTab;
  setActiveTab: (tab: PageTab) => void;
  demoMode: boolean;
  setDemoMode: (active: boolean) => void;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;

  // Vault state
  files: VaultFile[];
  uploadFile: (file: File | Partial<VaultFile>) => Promise<VaultFile>;
  downloadFile: (file: VaultFile) => Promise<string>;
  recoverFileVersion: (fileId: string, versionId: string, reason?: string) => Promise<boolean>;
  refreshVaultFiles: () => Promise<void>;
  isVaultLive: boolean;
  vaultError: string | null;
  selectedFile: VaultFile | null;
  setSelectedFile: (file: VaultFile | null) => void;

  // Intellect state
  documents: IntellectDocument[];
  analyzeDocument: (doc: Partial<IntellectDocument>) => Promise<IntellectDocument>;
  selectedDoc: IntellectDocument | null;
  setSelectedDoc: (doc: IntellectDocument | null) => void;

  // Sentinel state
  securityEvents: SecurityEvent[];
  updateSecurityEvent: (id: string, updates: { status?: EventStatus; notes?: string; completedStepIndex?: number }) => Promise<void>;
  refreshSecurityEvents: () => Promise<void>;
  loadSecurityEvent: (id: string) => Promise<void>;
  sentinelIsLive: boolean;
  sentinelError: string | null;
  sentinelLoading: boolean;
  sentinelAuthenticated: boolean;
  selectedEvent: SecurityEvent | null;
  setSelectedEvent: (event: SecurityEvent | null) => void;

  // Overview metrics
  overviewMetrics: OverviewMetrics;
  refreshAllData: () => Promise<void>;
  isLoading: boolean;

  // Notifications
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  unreadCount: number;

  // Toasts
  toasts: ToastMessage[];
  addToast: (title: string, message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<PageTab>('overview');
  const [demoMode, setDemoModeState] = useState<boolean>(() => ApiService.isDemoMode());
  const [globalSearch, setGlobalSearch] = useState<string>('');

  const [files, setFiles] = useState<VaultFile[]>(INITIAL_FILES);
  const [isVaultLive, setIsVaultLive] = useState<boolean>(false);
  const [vaultError, setVaultError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<VaultFile | null>(null);

  const [documents, setDocuments] = useState<IntellectDocument[]>(INITIAL_INTELLECT_DOCS);
  const [selectedDoc, setSelectedDoc] = useState<IntellectDocument | null>(INITIAL_INTELLECT_DOCS[0]);

  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [sentinelIsLive, setSentinelIsLive] = useState(false);
  const [sentinelError, setSentinelError] = useState<string | null>(null);
  const [sentinelLoading, setSentinelLoading] = useState(false);
  const [sentinelAuthenticated, setSentinelAuthenticated] = useState(() => SentinelAuth.isAuthenticated());

  const [overviewMetrics, setOverviewMetrics] = useState<OverviewMetrics>(INITIAL_OVERVIEW_METRICS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const setDemoMode = (active: boolean) => {
    ApiService.setDemoMode(active);
    setDemoModeState(active);
    addToast(
      active ? 'Demo Mode Enabled' : 'Live API Mode Selected',
      active
        ? 'Using simulated enterprise datasets with zero cloud costs.'
        : 'Connecting to AWS API gateway endpoints at ' + ApiService.getBaseUrl(),
      active ? 'info' : 'warning'
    );
    // Re-fetch data on mode toggle
    setTimeout(() => {
      refreshAllData();
    }, 50);
  };

  const addToast = (title: string, message: string, type: ToastMessage['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = { id, title, message, type };
    setToasts((prev) => [newToast, ...prev].slice(0, 5));

    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshVaultFiles = async () => {
    try {
      const result = await ApiService.getFiles();
      setFiles(result.files);
      setIsVaultLive(result.isLive);
      setVaultError(result.error || null);
      setOverviewMetrics((prev) => ({
        ...prev,
        storedFilesCount: result.files.length,
      }));
    } catch (err: any) {
      setIsVaultLive(false);
      setVaultError(err?.message || 'Failed to fetch files from Vault');
    }
  };

  const refreshSecurityEvents = async () => {
    setSentinelLoading(true);
    const result = await ApiService.getSecurityEvents();
    setSecurityEvents(result.events);
    setSentinelIsLive(result.isLive);
    setSentinelError(result.error || null);
    setSentinelAuthenticated(SentinelAuth.isAuthenticated());
    setSentinelLoading(false);
  };

  const loadSecurityEvent = async (id: string) => {
    if (!ApiService.isDemoMode()) {
      try {
        const event = await ApiService.getSecurityEvent(id);
        setSelectedEvent(event);
        setSentinelError(null);
        return;
      } catch (err) {
        setSentinelAuthenticated(SentinelAuth.isAuthenticated());
        setSentinelError(err instanceof Error ? err.message : 'Could not load event details.');
        throw err;
      }
    }
    const event = securityEvents.find((item) => item.id === id);
    if (event) setSelectedEvent(event);
  };

  const refreshAllData = async () => {
    setIsLoading(true);
    try {
      const [fetchedOverview, vaultRes, fetchedDocs, fetchedEvents] = await Promise.all([
        ApiService.getOverview(),
        ApiService.getFiles(),
        ApiService.getDocuments(),
        ApiService.getSecurityEvents(),
      ]);
      setOverviewMetrics(fetchedOverview);
      setFiles(vaultRes.files);
      setIsVaultLive(vaultRes.isLive);
      setVaultError(vaultRes.error || null);
      setDocuments(fetchedDocs);
      setSecurityEvents(fetchedEvents.events);
      setSentinelIsLive(fetchedEvents.isLive);
      setSentinelError(fetchedEvents.error || null);
      setSentinelAuthenticated(SentinelAuth.isAuthenticated());
      addToast(
        'Data Refreshed',
        vaultRes.isLive
          ? 'Live S3 Vault synchronized (AWS ap-south-1)'
          : 'Dashboard data synchronization complete',
        'success'
      );
    } catch {
      addToast('Refresh Failed', 'Could not sync latest metrics', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadFile = async (fileOrData: File | Partial<VaultFile>): Promise<VaultFile> => {
    try {
      const created = await ApiService.uploadFile(fileOrData);
      await refreshVaultFiles();
      setOverviewMetrics((prev) => ({
        ...prev,
        storedFilesCount: prev.storedFilesCount + 1,
        recentActivities: [
          {
            id: `act-${Date.now()}`,
            module: 'vault',
            title: `Uploaded ${created.name}`,
            description: created.isLive
              ? `Stored in AWS S3 (ap-south-1) with presigned PUT verification`
              : `Stored in ${created.storageClass} with KMS envelope encryption`,
            timestamp: 'Just now',
            actionType: 'Upload',
            actor: 'Security Admin',
          },
          ...prev.recentActivities,
        ],
      }));
      addToast(
        created.isLive ? 'File Uploaded to S3' : 'File Stored in Vault (Demo)',
        created.isLive
          ? `${created.name} ingested to S3 via presigned URL.`
          : `${created.name} securely ingested to S3 (Simulated)`,
        'success'
      );
      return created;
    } catch (err: any) {
      addToast('Upload Error', err?.message || 'Failed to upload file to S3', 'error');
      throw err;
    }
  };

  const downloadFile = async (file: VaultFile): Promise<string> => {
    try {
      const { downloadUrl } = await ApiService.getDownloadUrl(file.key || file.id);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.name;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast('Download Initiated', `Secure presigned link generated for ${file.name}`, 'success');
      return downloadUrl;
    } catch (err: any) {
      addToast('Download Failed', err?.message || 'Could not retrieve download URL', 'error');
      throw err;
    }
  };

  const recoverFileVersion = async (fileId: string, versionId: string, reason?: string): Promise<boolean> => {
    try {
      const res = await ApiService.restoreFileVersion(fileId, versionId, reason);
      if (res.success) {
        await refreshVaultFiles();

        const targetFile = files.find((f) => f.id === fileId || f.key === fileId);
        const fileName = targetFile?.name || fileId;

        setNotifications((prev) => [
          {
            id: `notif-${Date.now()}`,
            title: isVaultLive ? 'Version Restored in S3' : 'Version Restored (Demo)',
            message: `${fileName} rolled back to revision ${versionId.substring(0, 12)}...`,
            type: 'vault',
            timestamp: 'Just now',
            isRead: false,
            linkToTab: 'vault',
          },
          ...prev,
        ]);

        setOverviewMetrics((prev) => ({
          ...prev,
          recentActivities: [
            {
              id: `act-${Date.now()}`,
              module: 'vault',
              title: `Version Restored: ${fileName}`,
              description: `Restored version ${versionId.substring(0, 12)}... in S3`,
              timestamp: 'Just now',
              actionType: 'Recovery',
              actor: 'Security Admin',
            },
            ...prev.recentActivities,
          ],
        }));

        addToast(
          isVaultLive ? 'S3 Version Restored' : 'Version Restored',
          res.message || `${fileName} recovered to ${versionId}`,
          'success'
        );
        return true;
      }
      return false;
    } catch (err: any) {
      addToast('Restore Failed', err?.message || 'Failed to restore file version', 'error');
      return false;
    }
  };

  const analyzeDocument = async (docData: Partial<IntellectDocument>): Promise<IntellectDocument> => {
    let newDoc: IntellectDocument;
    if (docData.extractedText !== undefined) {
      // Real local in-browser OCR result — zero backend upload or cloud cost
      newDoc = {
        id: docData.id || `ocr-${Date.now().toString(36)}`,
        title: docData.title || docData.fileName || 'Scanned Document',
        fileName: docData.fileName || 'document.png',
        fileSizeBytes: docData.fileSizeBytes || 0,
        fileSizeFormatted: docData.fileSizeFormatted || '1.0 MB',
        uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        processedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        status: docData.status || 'completed',
        processingProgress: 100,
        pageCount: docData.pageCount || 1,
        overallConfidence: docData.overallConfidence !== undefined ? docData.overallConfidence : 0,
        detectedLanguage: docData.detectedLanguage || 'en-US (Tesseract OCR)',
        extractedText: docData.extractedText,
        keyValuePairs: docData.keyValuePairs || [],
        entities: docData.entities || [],
        s3Source: 'local-browser-memory',
        rawBlocksCount: docData.rawBlocksCount || 1,
        isDemoSample: false,
      };
    } else {
      newDoc = await ApiService.analyzeDocument(docData);
    }

    setDocuments((prev) => [newDoc, ...prev]);
    setSelectedDoc(newDoc);
    setOverviewMetrics((prev) => ({
      ...prev,
      documentsProcessedTotal: prev.documentsProcessedTotal + 1,
      recentActivities: [
        {
          id: `act-${Date.now()}`,
          module: 'intellect',
          title: `OCR Complete: ${newDoc.fileName}`,
          description: newDoc.isDemoSample
            ? `Extracted text (Demo Sample) with ${newDoc.overallConfidence}% confidence`
            : `Client Tesseract.js OCR: ${newDoc.overallConfidence.toFixed(1)}% confidence`,
          timestamp: 'Just now',
          actionType: newDoc.isDemoSample ? 'Textract Simulation' : 'Tesseract Local OCR',
          actor: newDoc.isDemoSample ? 'Demo Dataset' : 'In-Browser WebAssembly',
        },
        ...prev.recentActivities,
      ],
    }));

    addToast(
      newDoc.isDemoSample ? 'Sample OCR Loaded' : 'Local OCR Extracted',
      newDoc.isDemoSample
        ? `Loaded sample analysis for ${newDoc.fileName}`
        : `Extracted ${newDoc.extractedText.trim().split(/\s+/).filter(Boolean).length} words from ${newDoc.fileName} (${newDoc.overallConfidence.toFixed(1)}% confidence)`,
      'success'
    );
    return newDoc;
  };

  const updateSecurityEvent = async (
    id: string,
    updates: { status?: EventStatus; notes?: string; completedStepIndex?: number }
  ) => {
    let updated: SecurityEvent;
    try { updated = await ApiService.updateSecurityEvent(id, updates); }
    catch (err) {
      setSentinelAuthenticated(SentinelAuth.isAuthenticated());
      setSentinelError(err instanceof Error ? err.message : 'Could not update Sentinel event.');
      throw err;
    }
    setSecurityEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
    if (selectedEvent?.id === id) {
      setSelectedEvent(updated);
    }
    setSentinelError(null);
    if (updates.status) {
      addToast('Alert Status Updated', `Event ${id} transitioned to ${updates.status.toUpperCase()}`, 'info');
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    addToast('Notifications Cleared', 'All notifications marked as read', 'info');
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    void (async () => {
      const callback = await SentinelAuth.processCallback();
      const signedIn = SentinelAuth.isAuthenticated();
      setSentinelAuthenticated(signedIn);
      if (callback.handled && signedIn) setActiveTab('sentinel');
      await refreshAllData();
      if (callback.error) setSentinelError(callback.error);
    })();
  }, []);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        demoMode,
        setDemoMode,
        globalSearch,
        setGlobalSearch,
        files,
        uploadFile,
        downloadFile,
        recoverFileVersion,
        refreshVaultFiles,
        isVaultLive,
        vaultError,
        selectedFile,
        setSelectedFile,
        documents,
        analyzeDocument,
        selectedDoc,
        setSelectedDoc,
        securityEvents,
        updateSecurityEvent,
        refreshSecurityEvents,
        loadSecurityEvent,
        sentinelIsLive,
        sentinelError,
        sentinelLoading,
        sentinelAuthenticated,
        selectedEvent,
        setSelectedEvent,
        overviewMetrics,
        refreshAllData,
        isLoading,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        unreadCount,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
