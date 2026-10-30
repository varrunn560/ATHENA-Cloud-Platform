import React from 'react';
import { useApp } from '../../../context/AppContext';
import { DocumentUploadZone } from './DocumentUploadZone';
import { DocumentTable } from './DocumentTable';
import { ExtractedResultsPanel } from './ExtractedResultsPanel';
import { DemoNoticeBanner } from '../../common/DemoNoticeBanner';
import { FileText, CheckCircle2, Sparkles, Layers } from 'lucide-react';

export const IntellectPage: React.FC = () => {
  const { documents, selectedDoc, setSelectedDoc } = useApp();

  const completedCount = documents.filter((d) => d.status === 'completed').length;
  const totalPages = documents.reduce((acc, d) => acc + d.pageCount, 0);
  const avgAccuracy =
    documents.length > 0
      ? (documents.reduce((acc, d) => acc + d.overallConfidence, 0) / documents.length).toFixed(1)
      : '99.1';

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Notice Banner */}
      <DemoNoticeBanner
        moduleName="Athena Intellect"
        simulatedServices="Client Tesseract.js WebAssembly OCR Engine"
        detail="Real in-browser OCR is active using Tesseract.js. Upload PNG, JPG, or JPEG images to extract text and character bounding structures entirely locally on your machine with zero server uploads or cloud costs. Enterprise PDF presets are available for sample demonstration."
      />

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#172033] p-4 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Processed Docs</span>
            <FileText className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-100">{documents.length}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">In OCR repository</span>
        </div>

        <div className="bg-[#172033] p-4 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-100">{completedCount}</div>
          <span className="text-[11px] text-emerald-400 font-medium mt-1 block">
            100% Extraction Rate
          </span>
        </div>

        <div className="bg-[#172033] p-4 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Pages</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-100">{totalPages} Pages</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Structural blocks</span>
        </div>

        <div className="bg-[#172033] p-4 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Accuracy</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-100">{avgAccuracy}%</div>
          <span className="text-[11px] text-amber-400 font-medium mt-1 block">
            Tesseract & Benchmarks
          </span>
        </div>
      </div>

      {/* Upload Zone & Samples */}
      <DocumentUploadZone />

      {/* Document Library Table */}
      <DocumentTable
        documents={documents}
        selectedDocId={selectedDoc?.id}
        onSelectDoc={(doc) => setSelectedDoc(doc)}
      />

      {/* Extracted Results Panel */}
      <ExtractedResultsPanel document={selectedDoc} />
    </div>
  );
};
