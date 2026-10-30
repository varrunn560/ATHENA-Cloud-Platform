import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { VaultFile } from '../../../types';
import { FileUploadZone } from './FileUploadZone';
import { FileTable } from './FileTable';
import { FileDetailModal } from './FileDetailModal';
import { VersionHistoryModal } from './VersionHistoryModal';
import { DemoNoticeBanner } from '../../common/DemoNoticeBanner';
import { HardDrive, Lock, ShieldCheck, History, Database } from 'lucide-react';

export const VaultPage: React.FC = () => {
  const { files, isVaultLive, vaultError, refreshVaultFiles, selectedFile, setSelectedFile } = useApp();
  const [versionHistoryTarget, setVersionHistoryTarget] = useState<VaultFile | null>(null);

  const totalBytes = files.reduce((acc, f) => acc + f.sizeBytes, 0);
  const totalFormatted =
    totalBytes > 1024 * 1024 * 1024
      ? `${(totalBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
      : totalBytes > 1024 * 1024
      ? `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(totalBytes / 1024)} KB`;

  const lockedCount = files.filter((f) => f.isWormLocked).length;
  const glacierCount = files.filter((f) => f.storageClass.includes('Glacier')).length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Live / Demo Mode Banner */}
      {isVaultLive ? (
        <div className="bg-[#172033] rounded-2xl border border-emerald-500/30 p-4 sm:p-5 shadow-sm text-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                  Live AWS S3 Connected
                </span>
                <span className="text-xs text-slate-400 font-mono">ap-south-1</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Connected to bucket <code className="font-mono text-emerald-300">athena-vault-cad</code> via API Gateway. Presigned uploads, downloads, version listing, and rollbacks are live.
              </p>
            </div>
          </div>
          <button
            onClick={() => refreshVaultFiles()}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shrink-0 self-start sm:self-auto"
          >
            Sync Bucket
          </button>
        </div>
      ) : (
        <DemoNoticeBanner
          moduleName="Athena Vault"
          simulatedServices="Amazon S3 & Glacier Object Lock"
          detail={
            vaultError
              ? `Live API notice: ${vaultError}. Operating seamlessly in sample demonstration mode.`
              : 'Demonstration data running client-side. File version rollback, metadata viewing, and WORM retention checks simulate AWS S3 behavior without executing live S3 PutObject or DeleteObject requests.'
          }
        />
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#172033] p-4 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Objects</span>
            <Database className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-100">{files.length}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {isVaultLive ? 'Live S3 bucket items' : 'In simulated storage'}
          </span>
        </div>

        <div className="bg-[#172033] p-4 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Volume Managed</span>
            <HardDrive className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-100">{totalFormatted}</div>
          <span className="text-[11px] text-emerald-400 font-medium mt-1 block">
            {isVaultLive ? 'Amazon S3 Standard' : 'AES-256 KMS Protected'}
          </span>
        </div>

        <div className="bg-[#172033] p-4 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">WORM Locked</span>
            <Lock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-100">{lockedCount} Objects</div>
          <span className="text-[11px] text-purple-400 font-medium mt-1 block">
            Object Lock Active
          </span>
        </div>

        <div className="bg-[#172033] p-4 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Glacier Cold</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-100">{glacierCount} Archives</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Long-term compliance</span>
        </div>
      </div>

      {/* File Upload Zone */}
      <FileUploadZone />

      {/* Searchable and Filterable File Table */}
      <FileTable
        files={files}
        onOpenDetails={(file) => setSelectedFile(file)}
        onOpenVersions={(file) => setVersionHistoryTarget(file)}
      />

      {/* File Detail Modal */}
      {selectedFile && (
        <FileDetailModal
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
          onOpenVersions={(file) => {
            setSelectedFile(null);
            setVersionHistoryTarget(file);
          }}
        />
      )}

      {/* Version History Modal */}
      {versionHistoryTarget && (
        <VersionHistoryModal
          file={versionHistoryTarget}
          onClose={() => setVersionHistoryTarget(null)}
        />
      )}
    </div>
  );
};
