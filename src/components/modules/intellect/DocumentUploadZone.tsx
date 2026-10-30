import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Cpu,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  FileImage,
} from 'lucide-react';
import Tesseract from 'tesseract.js';
import { formatBytes } from '../../../services/api';
import { KeyValuePair, DocumentEntity } from '../../../types';

export const DocumentUploadZone: React.FC = () => {
  const { analyzeDocument, addToast } = useApp();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [ocrError, setOcrError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const samplePresets = [
    {
      title: 'Cloud Security Service Level Agreement (SLA)',
      fileName: 'Athena_Cloud_Security_SLA_2026.pdf',
      pages: 14,
      size: '3.0 MB',
      type: 'Legal Agreement',
    },
    {
      title: 'SOC2 Type II Annual Independent Audit Report',
      fileName: 'SOC2_Type2_Report_Executive_Summary.pdf',
      pages: 38,
      size: '5.0 MB',
      type: 'Compliance Audit',
    },
    {
      title: 'Enterprise AWS Master Services Contract SOW',
      fileName: 'AWS_Athena_SOW_Enterprise_2026.pdf',
      pages: 8,
      size: '2.3 MB',
      type: 'Vendor SOW',
    },
  ];

  const handleRunPreset = async (preset: (typeof samplePresets)[0]) => {
    setIsProcessing(true);
    setOcrError(null);
    setCurrentStep('Stage 1/3: Loading Simulated Textract Form Hierarchy...');
    await new Promise((r) => setTimeout(r, 350));

    setCurrentStep('Stage 2/3: Key-Value Extraction & Field Normalization...');
    await new Promise((r) => setTimeout(r, 350));

    setCurrentStep('Stage 3/3: Comprehend Entity Classification...');
    await new Promise((r) => setTimeout(r, 350));

    await analyzeDocument({
      title: preset.title,
      fileName: preset.fileName,
      pageCount: preset.pages,
      fileSizeFormatted: preset.size,
      isDemoSample: true,
    });

    setIsProcessing(false);
    setCurrentStep('');
  };

  const processImageWithTesseract = async (file: File) => {
    setOcrError(null);

    // 1. Validation
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const allowed = ['png', 'jpg', 'jpeg'];
    if (!allowed.includes(ext) && !file.type.startsWith('image/')) {
      const err = `Unsupported format '.${ext}'. Real in-browser OCR requires PNG, JPG, or JPEG images. (PDFs are not supported for client-side OCR without server execution).`;
      setOcrError(err);
      addToast('Invalid File Type', err, 'error');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      const err = `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds in-browser OCR limit of 25 MB.`;
      setOcrError(err);
      addToast('File Too Large', err, 'warning');
      return;
    }

    setIsProcessing(true);
    setUploadProgress(10);
    setCurrentStep('Spinning up Tesseract.js WebAssembly worker...');

    try {
      // 2. Perform Real Local OCR via Tesseract.js
      const { data } = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const pct = Math.round((m.progress || 0) * 100);
            setCurrentStep(`Recognizing characters and layout... ${pct}%`);
            setUploadProgress(pct);
          } else if (m.status) {
            const friendly = m.status.replace(/_/g, ' ');
            setCurrentStep(`${friendly.charAt(0).toUpperCase() + friendly.slice(1)}...`);
            setUploadProgress(Math.min(40, Math.round((m.progress || 0) * 40)));
          }
        },
      });

      const extractedText = data.text ? data.text.trim() : '';
      const confidence = Number((data.confidence || 0).toFixed(1));

      // Parse genuine key-values if lines contain ':'
      const lines = extractedText.split('\n').map((l) => l.trim()).filter(Boolean);
      const realKVs: KeyValuePair[] = [];
      for (const line of lines) {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0 && colonIdx < 40 && line.length > colonIdx + 1) {
          const k = line.substring(0, colonIdx).trim();
          const v = line.substring(colonIdx + 1).trim();
          if (k && v && realKVs.length < 8) {
            realKVs.push({
              key: k,
              value: v,
              confidence,
            });
          }
        }
      }

      // Parse basic real entities (dates, currency)
      const realEntities: DocumentEntity[] = [];
      const dateMatches = extractedText.match(/\b\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}\b/g);
      if (dateMatches) {
        dateMatches.slice(0, 3).forEach((d) => {
          realEntities.push({ text: d, type: 'DATE', confidence });
        });
      }
      const moneyMatches = extractedText.match(/[$€£₹]\s?[\d,]+(\.\d{2})?/g);
      if (moneyMatches) {
        moneyMatches.slice(0, 3).forEach((m) => {
          realEntities.push({ text: m, type: 'MONEY', confidence });
        });
      }

      // 3. Save to AppContext
      await analyzeDocument({
        id: `ocr-${Date.now().toString(36)}`,
        title: customTitle || file.name.replace(/\.[^/.]+$/, ''),
        fileName: file.name,
        fileSizeBytes: file.size,
        fileSizeFormatted: formatBytes(file.size),
        pageCount: 1,
        overallConfidence: confidence,
        detectedLanguage: 'en-US (Tesseract OCR)',
        extractedText: extractedText || '(No legible text recognized in this image)',
        keyValuePairs: realKVs,
        entities: realEntities,
        rawBlocksCount: data.blocks?.length || lines.length || 1,
        isDemoSample: false, // Verified Real In-Browser OCR
      });

      setUploadProgress(100);
      setCustomTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error('[Athena OCR Error]', err);
      const msg = err?.message || 'Failed to process image with local OCR worker';
      setOcrError(msg);
      addToast('OCR Error', msg, 'error');
    } finally {
      setIsProcessing(false);
      setCurrentStep('');
      setUploadProgress(0);
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
      processImageWithTesseract(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processImageWithTesseract(e.target.files[0]);
    }
  };

  const handleRunRealSampleImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isProcessing) return;
    try {
      setIsProcessing(true);
      setOcrError(null);
      setCurrentStep('Loading sample document for in-browser OCR...');
      setUploadProgress(5);
      const res = await fetch('/sample_ocr_test.jpg');
      if (!res.ok) throw new Error('Could not load sample test image');
      const blob = await res.blob();
      const sampleFile = new File([blob], 'athena_security_report_sample.jpg', { type: 'image/jpeg' });
      await processImageWithTesseract(sampleFile);
    } catch (err: any) {
      console.error('[Quick OCR sample error]', err);
      setOcrError(err?.message || 'Failed to load sample image for OCR');
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[#172033] rounded-2xl border border-slate-800 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            Client-Side Tesseract.js OCR Pipeline
          </h3>
          <p className="text-xs text-slate-400">
            Real in-browser OCR using WebAssembly & Web Workers — 100% private, zero cloud fees, no server uploads.
          </p>
        </div>

        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 self-start sm:self-auto flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          Local Browser Engine
        </span>
      </div>

      {/* Real In-Browser OCR Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
          isDragging
            ? 'border-purple-500 bg-purple-500/10 scale-[0.99]'
            : 'border-slate-700 hover:border-purple-400 hover:bg-[#0F172A]/70 bg-[#0F172A]/40'
        } ${isProcessing ? 'pointer-events-none opacity-80' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          accept=".png,.jpg,.jpeg,image/png,image/jpeg"
          className="hidden"
        />

        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3 border border-purple-500/20 shadow-inner">
          <FileImage className="w-6 h-6 animate-pulse-subtle" />
        </div>

        <div className="space-y-1">
          <p className="text-xs sm:text-sm font-semibold text-slate-100">
            Upload PNG, JPG, or JPEG for Real In-Browser OCR
          </p>
          <p className="text-xs text-slate-400">
            Drop an image or click to browse (Max 25MB). Tesseract.js will extract the text locally on this device.
          </p>
        </div>

        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={handleRunRealSampleImage}
            disabled={isProcessing}
            className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50 pointer-events-auto cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-200" />
            Quick Test: Run Real OCR on Scanned Image
          </button>
        </div>

        {/* Processing Indicator inside Dropzone */}
        {isProcessing && (
          <div className="w-full max-w-sm mt-4 space-y-2 animate-in fade-in">
            <div className="flex justify-between text-xs text-slate-300 font-medium">
              <span>{currentStep || 'Extracting characters...'}</span>
              <span className="font-mono">{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
              <div
                style={{ width: `${uploadProgress}%` }}
                className="h-full bg-purple-500 rounded-full transition-all duration-300"
              />
            </div>
          </div>
        )}
      </div>

      {ocrError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{ocrError}</span>
        </div>
      )}

      {/* Preset quick test templates */}
      <div className="pt-2 border-t border-slate-800">
        <span className="text-xs font-semibold text-slate-300 block mb-2">
          Or Load Enterprise Sample Presets (Simulated Textract Data):
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {samplePresets.map((preset, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl border border-slate-800 bg-[#0F172A] hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-3 group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold">
                    {preset.type}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">{preset.pages} pgs</span>
                </div>
                <h4 className="text-xs font-bold text-slate-100 mt-2 group-hover:text-purple-400 transition-colors">
                  {preset.title}
                </h4>
                <span className="text-[11px] text-slate-400 font-mono block mt-0.5 truncate">
                  {preset.fileName}
                </span>
              </div>

              <button
                onClick={() => handleRunPreset(preset)}
                disabled={isProcessing}
                className="w-full py-1.5 px-3 rounded-lg bg-slate-800 border border-slate-700 hover:border-purple-500 hover:bg-purple-950/40 text-purple-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Load Sample Data
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
