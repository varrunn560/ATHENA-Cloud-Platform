import React, { useState } from 'react';
import { VaultFile } from '../../../types';
import {
  X,
  Lock,
  Calendar,
  Key,
  Copy,
  Download,
  History,
  FileText,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';

interface FileDetailModalProps {
  file: VaultFile | null;
  onClose: () => void;
  onOpenVersions: (file: VaultFile) => void;
}

export const FileDetailModal: React.FC<FileDetailModalProps> = ({
  file,
  onClose,
  onOpenVersions,
}) => {
  const { addToast, downloadFile, isVaultLive } = useApp();
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  if (!file) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addToast('Copied to Clipboard', `${label} copied to clipboard`, 'info');
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await downloadFile(file);
    } catch {
      // toast handled in downloadFile
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#172033] rounded-2xl shadow-2xl border border-slate-700 max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#0F172A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-100 text-base truncate max-w-md">
                  {file.name}
                </h3>
                {file.isLive && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    LIVE S3
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Athena S3 Object Security Metadata</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-[#0F172A] border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">File Size</span>
              <span className="text-sm font-bold text-slate-100 mt-0.5 block font-mono">{file.sizeFormatted}</span>
            </div>

            <div className="p-3 rounded-xl bg-[#0F172A] border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Storage Class</span>
              <span className="text-xs font-bold text-slate-200 mt-1 block truncate">{file.storageClass}</span>
            </div>

            <div className="p-3 rounded-xl bg-[#0F172A] border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Revisions</span>
              <span className="text-sm font-bold text-indigo-400 mt-0.5 block">{file.versionCount} Tracked</span>
            </div>

            <div className="p-3 rounded-xl bg-[#0F172A] border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">WORM Immutability</span>
              <span className="text-xs font-bold text-emerald-400 mt-1 block flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                {file.isWormLocked ? 'Object Locked' : 'Standard'}
              </span>
            </div>
          </div>

          {/* S3 URI & Target Bucket */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-1">
                <span>Canonical S3 Object URI</span>
                <button
                  onClick={() => copyToClipboard(file.s3Uri, 'S3 URI')}
                  className="text-indigo-400 hover:text-indigo-300 text-[11px] font-normal flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy URI
                </button>
              </label>
              <div className="p-2.5 rounded-lg bg-[#0B1220] text-slate-200 font-mono text-xs break-all border border-slate-800">
                {file.s3Uri}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#0F172A] border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Primary Bucket</span>
                <span className="font-semibold text-slate-200 mt-0.5 block font-mono">
                  {file.bucket || (isVaultLive ? 'athena-vault-cad' : 'athena-vault-production')}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#0F172A] border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Canonical Key</span>
                <span className="font-mono text-[11px] text-slate-300 mt-0.5 block truncate">
                  {file.key || file.id}
                </span>
              </div>
            </div>
          </div>

          {/* KMS Encryption Security Details */}
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-400" />
                AWS S3 Envelope Cryptography
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {file.encryption || 'AES-256'}
              </span>
            </div>
            <div className="text-xs text-indigo-200 font-mono break-all bg-[#0B1220] p-2 rounded-lg border border-indigo-500/20">
              {file.kmsKeyArn || 'arn:aws:kms:ap-south-1:965859022862:key/vault-master-key'}
            </div>
            <p className="text-[11px] text-indigo-300/80 leading-relaxed">
              Decryption is constrained by AWS IAM identity policies with automated KMS key rotation and S3 presigned URL authorization.
            </p>
          </div>

          {/* Retention compliance policy */}
          <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-[#0F172A] border border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div>
                <span className="font-semibold text-slate-200 block">Compliance Retention Period</span>
                <span className="text-[11px] text-slate-400">
                  {file.retentionDays} Days mandatory hold ({Math.round(file.retentionDays / 365)} years)
                </span>
              </div>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {file.isWormLocked ? 'WORM Enforced' : 'Standard Lifecycle'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0F172A] border-t border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce' : ''}`} />
              {isDownloading ? 'Generating Link...' : 'Download File'}
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenVersions(file);
              }}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5" />
              Inspect Versions
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
