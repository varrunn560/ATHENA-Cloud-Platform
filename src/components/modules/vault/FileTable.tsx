import React, { useState } from 'react';
import { VaultFile, FileStatus } from '../../../types';
import {
  Search,
  Filter,
  History,
  Info,
  RotateCcw,
  Lock,
  HardDrive,
  FileText,
  FileSpreadsheet,
  FileArchive,
  FileCode,
  File,
  Download,
  Trash2,
  ArrowUpDown,
  Cloud,
} from 'lucide-react';
import { ConfirmModal } from '../../common/ConfirmModal';
import { useApp } from '../../../context/AppContext';

interface FileTableProps {
  files: VaultFile[];
  onOpenDetails: (file: VaultFile) => void;
  onOpenVersions: (file: VaultFile) => void;
}

export const FileTable: React.FC<FileTableProps> = ({
  files,
  onOpenDetails,
  onOpenVersions,
}) => {
  const { addToast, downloadFile, isVaultLive } = useApp();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [storageFilter, setStorageFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'modified' | 'size'>('modified');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [deleteTargetFile, setDeleteTargetFile] = useState<VaultFile | null>(null);

  // File type icon helper
  const getFileIcon = (ext: string) => {
    switch (ext.toLowerCase()) {
      case 'pdf':
      case 'docx':
        return <FileText className="w-4 h-4 text-rose-400" />;
      case 'xlsx':
      case 'csv':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
      case 'parquet':
      case 'json':
        return <FileCode className="w-4 h-4 text-amber-400" />;
      case 'tar.gz':
      case 'zip':
        return <FileArchive className="w-4 h-4 text-purple-400" />;
      case 'txt':
        return <FileText className="w-4 h-4 text-cyan-400" />;
      default:
        return <File className="w-4 h-4 text-indigo-400" />;
    }
  };

  // Status badge helper
  const getStatusBadge = (status: FileStatus) => {
    switch (status) {
      case 'Active':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
          </span>
        );
      case 'Locked':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
            <Lock className="w-3 h-3 text-purple-400" /> Locked (WORM)
          </span>
        );
      case 'Archived':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
            <HardDrive className="w-3 h-3 text-slate-400" /> Glacier Cold
          </span>
        );
      case 'Restored':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
            <RotateCcw className="w-3 h-3 text-indigo-400" /> Restored
          </span>
        );
      default:
        return null;
    }
  };

  const handleDownload = async (file: VaultFile) => {
    try {
      setDownloadingId(file.id);
      await downloadFile(file);
    } catch {
      // toast handled in downloadFile
    } finally {
      setDownloadingId(null);
    }
  };

  // Filter and sort
  const filteredFiles = files
    .filter((f) => {
      const matchesSearch =
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.extension.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.key && f.key.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStorage = storageFilter === 'all' || f.storageClass === storageFilter;
      const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
      return matchesSearch && matchesStorage && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      if (sortBy === 'size') {
        return sortOrder === 'asc' ? a.sizeBytes - b.sizeBytes : b.sizeBytes - a.sizeBytes;
      }
      return sortOrder === 'asc'
        ? a.modifiedAt.localeCompare(b.modifiedAt)
        : b.modifiedAt.localeCompare(a.modifiedAt);
    });

  const handleSimulateDelete = () => {
    if (deleteTargetFile?.isWormLocked) {
      addToast(
        'Deletion Blocked by WORM Policy',
        `Cannot delete ${deleteTargetFile.name}: S3 Object Lock compliance retention active.`,
        'error'
      );
    } else {
      addToast(
        'Delete Action Simulated',
        `Object ${deleteTargetFile?.name} delete simulated. Live API does not expose a permanent delete endpoint in this assignment contract.`,
        'warning'
      );
    }
    setDeleteTargetFile(null);
  };

  return (
    <div className="bg-[#172033] rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
      {/* Table Controls / Filters */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by file name or S3 key..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#0F172A] border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-100 placeholder:text-slate-500"
          />
        </div>

        {/* Filter selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-[#0F172A] px-2.5 py-1.5 rounded-lg border border-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] text-slate-400">Storage:</span>
            <select
              value={storageFilter}
              onChange={(e) => setStorageFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#0F172A] text-slate-200">All Tiers</option>
              <option value="S3 Standard" className="bg-[#0F172A] text-slate-200">S3 Standard</option>
              <option value="Intelligent-Tiering" className="bg-[#0F172A] text-slate-200">Intelligent-Tiering</option>
              <option value="Glacier Flexible" className="bg-[#0F172A] text-slate-200">Glacier Flexible</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-[#0F172A] px-2.5 py-1.5 rounded-lg border border-slate-700">
            <span className="text-[11px] text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#0F172A] text-slate-200">All Statuses</option>
              <option value="Active" className="bg-[#0F172A] text-slate-200">Active</option>
              <option value="Locked" className="bg-[#0F172A] text-slate-200">Locked (WORM)</option>
              <option value="Archived" className="bg-[#0F172A] text-slate-200">Archived</option>
              <option value="Restored" className="bg-[#0F172A] text-slate-200">Restored</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Component */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0F172A] border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th
                onClick={() => {
                  if (sortBy === 'name') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  else {
                    setSortBy('name');
                    setSortOrder('asc');
                  }
                }}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  Object Name & S3 Key
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => {
                  if (sortBy === 'size') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  else {
                    setSortBy('size');
                    setSortOrder('desc');
                  }
                }}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  Size
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-4">Storage Tier</th>
              <th
                onClick={() => {
                  if (sortBy === 'modified') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  else {
                    setSortBy('modified');
                    setSortOrder('desc');
                  }
                }}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  Modified (UTC)
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-4 text-center">Versions</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 font-normal">
            {filteredFiles.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  No files matched the selected search or filter criteria.
                </td>
              </tr>
            ) : (
              filteredFiles.map((file) => (
                <tr
                  key={file.id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  {/* File Name & Key */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center shrink-0">
                        {getFileIcon(file.extension)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            onClick={() => onOpenDetails(file)}
                            className="font-semibold text-slate-100 hover:text-indigo-400 cursor-pointer truncate block max-w-xs transition-colors"
                          >
                            {file.name}
                          </span>
                          {file.isLive && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              LIVE S3
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono truncate block max-w-xs">
                          {file.key || `.${file.extension}`}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Size */}
                  <td className="py-3 px-4 font-mono text-slate-300 font-medium whitespace-nowrap">
                    {file.sizeFormatted}
                  </td>

                  {/* Storage Class */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-medium text-slate-300 bg-slate-800 border border-slate-700/70 px-2 py-0.5 rounded text-[11px]">
                      {file.storageClass}
                    </span>
                  </td>

                  {/* Modified */}
                  <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                    {file.modifiedAt.split(' ')[0]}
                  </td>

                  {/* Versions */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <button
                      onClick={() => onOpenVersions(file)}
                      className="px-2 py-0.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-semibold text-[11px] border border-indigo-500/30 transition-colors inline-flex items-center gap-1"
                    >
                      <History className="w-3 h-3" />
                      {file.versionCount}
                    </button>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {getStatusBadge(file.status)}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {/* Presigned Download Button */}
                      <button
                        onClick={() => handleDownload(file)}
                        disabled={downloadingId === file.id}
                        title="Download Object (Presigned S3 URL)"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                      >
                        <Download className={`w-4 h-4 ${downloadingId === file.id ? 'animate-bounce' : ''}`} />
                      </button>

                      {/* View Metadata Details Button */}
                      <button
                        onClick={() => onOpenDetails(file)}
                        title="View S3 Metadata"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                      >
                        <Info className="w-4 h-4" />
                      </button>

                      {/* Versions & Recovery Button */}
                      <button
                        onClick={() => onOpenVersions(file)}
                        title="Version History & Recovery"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                      >
                        <History className="w-4 h-4" />
                      </button>

                      {/* Delete / Lock simulation */}
                      <button
                        onClick={() => setDeleteTargetFile(file)}
                        title="Delete File"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="p-3 sm:px-5 bg-[#0F172A] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span>
          Showing <strong className="text-slate-200">{filteredFiles.length}</strong> of{' '}
          <strong className="text-slate-200">{files.length}</strong> stored objects
        </span>
        <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <Cloud className="w-3.5 h-3.5 text-indigo-400" />
          Target S3 Bucket:{' '}
          <code className="font-mono text-slate-300">
            {isVaultLive ? 'athena-vault-cad (ap-south-1)' : 'athena-vault-production'}
          </code>
        </span>
      </div>

      {/* Delete / Lock Confirmation Modal */}
      {deleteTargetFile && (
        <ConfirmModal
          isOpen={true}
          title={deleteTargetFile.isWormLocked ? 'Object Lock Enforced' : `Delete ${deleteTargetFile.name}?`}
          message={
            deleteTargetFile.isWormLocked
              ? `This object is protected by S3 Object Lock Compliance Mode (WORM). Under legal retention guidelines, objects cannot be deleted by any AWS principal, including the root account, until the retention period expires.`
              : `Are you sure you want to delete ${deleteTargetFile.name}? The backend assignment contract does not define an S3 permanent delete endpoint.`
          }
          confirmLabel={deleteTargetFile.isWormLocked ? 'Acknowledge Policy' : 'Simulate Delete'}
          cancelLabel="Cancel"
          isDestructive={!deleteTargetFile.isWormLocked}
          onConfirm={handleSimulateDelete}
          onCancel={() => setDeleteTargetFile(null)}
          demoNote="NOTICE: S3 Object retention active. No live delete API was requested."
        />
      )}
    </div>
  );
};
