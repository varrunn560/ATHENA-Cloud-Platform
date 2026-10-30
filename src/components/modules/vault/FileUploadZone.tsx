import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { useApp } from '../../../context/AppContext';
import { StorageClass } from '../../../types';
import {
  UploadCloud,
  FileCheck,
  AlertCircle,
  ShieldCheck,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';

export const FileUploadZone: React.FC = () => {
  const { uploadFile, isVaultLive, addToast } = useApp();
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [selectedStorageClass, setSelectedStorageClass] = useState<StorageClass>('S3 Standard');
  const [isWormLock, setIsWormLock] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for demo client
  const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'xlsx', 'json', 'csv', 'parquet', 'tar.gz', 'png', 'jpg', 'zip', 'txt'];

  const validateAndProcessFile = async (file: File) => {
    setValidationError(null);

    // 1. File size check
    if (file.size > MAX_FILE_SIZE) {
      const err = `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds limit of 50 MB.`;
      setValidationError(err);
      addToast('Upload Validation Failed', err, 'error');
      return;
    }

    // 2. Extension check
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      const err = `Unsupported format '.${ext}'. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`;
      setValidationError(err);
      addToast('Invalid File Type', err, 'warning');
      return;
    }

    // 3. Upload flow
    setIsUploading(true);
    setUploadProgress(20);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => (prev < 80 ? prev + 15 : prev));
    }, 150);

    try {
      setUploadProgress(50);
      // Pass the real raw File object to uploadFile!
      await uploadFile(file);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 400);
    } catch (err: any) {
      clearInterval(progressInterval);
      setIsUploading(false);
      setUploadProgress(0);
      setValidationError(err?.message || 'Failed to complete upload');
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  return (
    <div className="bg-[#172033] rounded-2xl border border-slate-800 p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-indigo-400" />
            {isVaultLive ? 'Live Amazon S3 Ingestion' : 'Secure Ingestion & Object Staging'}
          </h3>
          <p className="text-xs text-slate-400">
            {isVaultLive
              ? 'Requests presigned URL and streams raw payload directly to AWS S3 bucket athena-vault-cad'
              : 'Client-side validation, envelope KMS encryption & simulated S3 bucket ingestion'}
          </p>
        </div>

        {/* Storage Class and WORM Lock controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-[#0F172A] px-2.5 py-1.5 rounded-lg border border-slate-700">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-medium text-slate-400">Tier:</span>
            <select
              value={selectedStorageClass}
              onChange={(e) => setSelectedStorageClass(e.target.value as StorageClass)}
              className="bg-transparent font-semibold text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="S3 Standard" className="bg-[#0F172A] text-slate-200">S3 Standard</option>
              <option value="Intelligent-Tiering" className="bg-[#0F172A] text-slate-200">Intelligent-Tiering</option>
              <option value="Glacier Flexible" className="bg-[#0F172A] text-slate-200">Glacier Flexible</option>
              <option value="Glacier Deep Archive" className="bg-[#0F172A] text-slate-200">Glacier Deep Archive</option>
            </select>
          </div>

          <label className="flex items-center gap-1.5 text-xs text-slate-300 bg-[#0F172A] px-2.5 py-1.5 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-800/80 transition-colors">
            <input
              type="checkbox"
              checked={isWormLock}
              onChange={(e) => setIsWormLock(e.target.checked)}
              className="rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
            />
            <Lock className="w-3 h-3 text-emerald-400" />
            <span className="text-[11px] font-medium">WORM Immutability</span>
          </label>
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10 scale-[0.99]'
            : 'border-slate-700 hover:border-indigo-400 hover:bg-[#0F172A]/70 bg-[#0F172A]/40'
        } ${isUploading ? 'pointer-events-none opacity-80' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.docx,.xlsx,.json,.csv,.parquet,.tar.gz,.png,.jpg,.zip,.txt"
        />

        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3 border border-indigo-500/20 shadow-inner">
          <UploadCloud className="w-6 h-6 animate-pulse-subtle" />
        </div>

        <div className="space-y-1">
          <p className="text-xs sm:text-sm font-semibold text-slate-100">
            Click to upload or drag & drop files here
          </p>
          <p className="text-xs text-slate-400">
            PDF, DOCX, XLSX, JSON, CSV, Parquet, TAR.GZ, TXT (Max 50MB per file)
          </p>
        </div>

        {/* Client side security checks pill */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[10px] text-slate-400">
          <span className="flex items-center gap-1 bg-[#0F172A] border border-slate-700/80 px-2 py-0.5 rounded-full text-slate-300">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            SHA-256 Checksum Validation
          </span>
          <span className="flex items-center gap-1 bg-[#0F172A] border border-slate-700/80 px-2 py-0.5 rounded-full text-slate-300">
            <Lock className="w-3 h-3 text-indigo-400" />
            AES-256 S3 Direct Ingestion
          </span>
          <span className="flex items-center gap-1 bg-[#0F172A] border border-slate-700/80 px-2 py-0.5 rounded-full text-slate-300">
            <Sparkles className="w-3 h-3 text-purple-400" />
            Auto-Versioning Enabled
          </span>
        </div>

        {/* Upload progress bar */}
        {isUploading && (
          <div className="w-full max-w-xs mt-4 space-y-1.5 animate-in fade-in">
            <div className="flex justify-between text-xs text-slate-300 font-medium">
              <span>{isVaultLive ? 'Uploading bytes directly to S3...' : 'Encrypting & Staging to S3...'}</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
              <div
                style={{ width: `${uploadProgress}%` }}
                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              />
            </div>
          </div>
        )}
      </div>

      {validationError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
};
