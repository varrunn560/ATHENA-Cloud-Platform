import React, { useState, useEffect } from 'react';
import { VaultFile, FileVersion } from '../../../types';
import {
  X,
  History,
  RotateCcw,
  CheckCircle2,
  Clock,
  User,
  RefreshCw,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { ConfirmModal } from '../../common/ConfirmModal';
import { useApp } from '../../../context/AppContext';
import { ApiService } from '../../../services/api';

interface VersionHistoryModalProps {
  file: VaultFile | null;
  onClose: () => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({ file, onClose }) => {
  const { recoverFileVersion, isVaultLive } = useApp();
  const [versions, setVersions] = useState<FileVersion[]>(file?.versions || []);
  const [isLoadingVersions, setIsLoadingVersions] = useState<boolean>(true);
  const [versionError, setVersionError] = useState<string | null>(null);

  const [selectedVersionForRecovery, setSelectedVersionForRecovery] = useState<FileVersion | null>(null);
  const [recoveryReason, setRecoveryReason] = useState<string>('Audit rollback to stable revision');
  const [isRecovering, setIsRecovering] = useState<boolean>(false);

  const fetchVersions = async () => {
    if (!file) return;
    setIsLoadingVersions(true);
    setVersionError(null);
    try {
      const vers = await ApiService.getFileVersions(file.key || file.id);
      setVersions(vers);
    } catch (err: any) {
      setVersionError(err?.message || 'Failed to fetch versions');
      setVersions(file.versions || []);
    } finally {
      setIsLoadingVersions(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [file]);

  if (!file) return null;

  const handleConfirmRecovery = async () => {
    if (!selectedVersionForRecovery || !file) return;
    setIsRecovering(true);
    const success = await recoverFileVersion(
      file.key || file.id,
      selectedVersionForRecovery.versionId,
      recoveryReason
    );
    setIsRecovering(false);
    setSelectedVersionForRecovery(null);
    if (success) {
      await fetchVersions();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-[#172033] rounded-2xl shadow-2xl border border-slate-700 max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#0F172A]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <History className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-100 text-base truncate max-w-md">
                    Version History — {file.name}
                  </h3>
                  {isVaultLive && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      LIVE S3
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {versions.length} S3 Revisions Tracked • Key:{' '}
                  <code className="font-mono text-slate-300">{file.key || file.id}</code>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchVersions}
                title="Refresh version list"
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingVersions ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Versions Timeline List */}
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between text-xs text-slate-300 bg-[#0F172A] p-2.5 rounded-xl border border-slate-800">
              <span>
                S3 Versioning:{' '}
                <strong className="text-emerald-400">
                  {isVaultLive ? 'Active on AWS ap-south-1' : 'Enabled (Demo)'}
                </strong>
              </span>
              <span>
                Bucket:{' '}
                <strong className="text-indigo-300 font-mono">
                  {isVaultLive ? 'athena-vault-cad' : 'athena-vault-production'}
                </strong>
              </span>
            </div>

            {versionError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{versionError}</span>
              </div>
            )}

            {isLoadingVersions ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                <span className="text-xs">Fetching S3 version history from AWS API...</span>
              </div>
            ) : versions.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                No historical revisions recorded for this object.
              </div>
            ) : (
              <div className="space-y-3 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-800 before:z-0">
                {versions.map((ver) => (
                  <div
                    key={ver.versionId}
                    className={`relative z-10 p-4 rounded-xl border transition-all ${
                      ver.isCurrent
                        ? 'bg-indigo-500/10 border-indigo-500/40 ring-1 ring-indigo-500/20'
                        : 'bg-[#0F172A] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-200 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                          {ver.versionId}
                        </span>
                        {ver.isCurrent ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> CURRENT HEAD
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">
                            Historical Revision
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="font-semibold text-slate-200 font-mono">{ver.sizeFormatted}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {ver.modifiedAt}
                        </span>
                      </div>
                    </div>

                    {/* Notes / Reason */}
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      "{ver.notes}"
                    </p>

                    <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          Author: <strong className="text-slate-300">{ver.author}</strong>
                        </span>
                      </div>

                      {!ver.isCurrent && (
                        <button
                          onClick={() => setSelectedVersionForRecovery(ver)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Restore this Version
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 bg-[#0F172A] border-t border-slate-800">
            <span className="text-[11px] text-slate-400">
              {isVaultLive
                ? 'Rollback creates a new current version on S3 preserving complete version history.'
                : 'Demo version recovery preserves S3 immutable version stack.'}
            </span>
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

      {/* Confirmation Dialog for Version Recovery */}
      {selectedVersionForRecovery && (
        <ConfirmModal
          isOpen={true}
          title={`Restore ${file.name}?`}
          message={`Are you sure you want to rollback ${file.name} to version ${selectedVersionForRecovery.versionId}? On AWS S3, this executes POST /api/files/restore and creates a new current head version with the snapshot contents, preserving all historical versions.`}
          confirmLabel={isRecovering ? 'Restoring in S3...' : 'Confirm Restore'}
          cancelLabel="Cancel"
          onConfirm={handleConfirmRecovery}
          onCancel={() => setSelectedVersionForRecovery(null)}
          demoNote={
            isVaultLive
              ? 'AWS S3 LIVE: Executes POST /api/files/restore on API Gateway.'
              : 'DEMO RECOVERY: Simulates S3 version promotion in local memory.'
          }
        >
          <div className="space-y-3 pt-2">
            <div className="p-3 rounded-lg bg-[#0F172A] border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Target S3 Key:</span>
                <span className="font-mono font-semibold text-slate-200">
                  {file.key || file.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Version ID:</span>
                <span className="font-mono font-semibold text-indigo-300">
                  {selectedVersionForRecovery.versionId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Snapshot Timestamp:</span>
                <span className="font-medium text-slate-300 font-mono">
                  {selectedVersionForRecovery.modifiedAt}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Object Size:</span>
                <span className="font-medium text-slate-300">
                  {selectedVersionForRecovery.sizeFormatted}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Audit Trail Log Note
              </label>
              <input
                type="text"
                value={recoveryReason}
                onChange={(e) => setRecoveryReason(e.target.value)}
                placeholder="e.g. Rollback accidental change"
                className="w-full px-3 py-2 text-xs bg-[#0F172A] border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>
          </div>
        </ConfirmModal>
      )}
    </>
  );
};
