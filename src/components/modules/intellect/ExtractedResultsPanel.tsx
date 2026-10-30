import React, { useState } from 'react';
import { IntellectDocument } from '../../../types';
import {
  FileText,
  Copy,
  Check,
  Search,
  CheckCircle2,
  Layers,
  Code,
  Sparkles,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';

interface ExtractedResultsPanelProps {
  document: IntellectDocument | null;
}

export const ExtractedResultsPanel: React.FC<ExtractedResultsPanelProps> = ({ document }) => {
  const { addToast } = useApp();
  const [activeView, setActiveView] = useState<'text' | 'keyvalues' | 'entities' | 'json'>('text');
  const [textFilter, setTextFilter] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  if (!document) {
    return (
      <div className="bg-[#172033] rounded-2xl border border-slate-800 p-12 text-center shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-[#0F172A] text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-800">
          <FileText className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-200">No Document Selected</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Select a processed document from the library above or upload a PNG/JPG to extract text via local OCR.
        </p>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(document.extractedText);
    setCopied(true);
    addToast('Text Copied', 'Extracted plain text copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = document.extractedText.trim().split(/\s+/).filter(Boolean).length;

  // Highlight search occurrences in text
  const renderHighlightedText = () => {
    if (!textFilter.trim()) {
      return document.extractedText;
    }
    const parts = document.extractedText.split(new RegExp(`(${textFilter})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === textFilter.toLowerCase() ? (
        <mark key={i} className="bg-amber-400/30 text-amber-200 font-semibold px-0.5 rounded border border-amber-500/40">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Representation for JSON tab
  const mockTextractBlocks = {
    DocumentMetadata: {
      Pages: document.pageCount,
      Engine: document.isDemoSample ? 'AWS Textract Simulation' : 'Tesseract.js WebAssembly Worker',
      IsDemoSample: Boolean(document.isDemoSample),
    },
    Blocks: [
      {
        BlockType: 'PAGE',
        Id: 'page-1-root',
        Geometry: { BoundingBox: { Width: 1.0, Height: 1.0, Left: 0.0, Top: 0.0 } },
        Confidence: document.overallConfidence,
      },
      ...document.keyValuePairs.map((kv, i) => ({
        BlockType: 'KEY_VALUE_SET',
        EntityType: 'KEY',
        Id: `kv-${i}-key`,
        Confidence: kv.confidence,
        Text: kv.key,
        ValueText: kv.value,
      })),
      {
        BlockType: 'LINE',
        Id: 'line-block-summary',
        Text: document.title,
        Confidence: document.overallConfidence,
      },
    ],
  };

  return (
    <div className="bg-[#172033] rounded-2xl border border-slate-800 shadow-sm overflow-hidden space-y-0">
      {/* Disclaimer / Provenance Banner */}
      {document.isDemoSample ? (
        <div className="p-3 bg-amber-950/40 border-b border-amber-800/80 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>DEMO SAMPLE DATA:</strong> Extracted using pre-configured mock Textract contract data.
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
            Sample Model
          </span>
        </div>
      ) : (
        <div className="p-3 bg-emerald-950/40 border-b border-emerald-800/80 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>REAL IN-BROWSER OCR RESULT:</strong> Extracted directly on client via Tesseract.js (Zero server upload / zero cloud cost).
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
            Tesseract.js Local
          </span>
        </div>
      )}

      {/* Document Header & Metadata */}
      <div className="p-5 border-b border-slate-800 bg-[#0F172A] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {document.status.toUpperCase()}
            </span>
            <span className="text-xs text-slate-400">• {document.pageCount} Page Analyzed</span>
            <span className="text-xs text-slate-400">• Language: {document.detectedLanguage}</span>
            <span className="text-xs text-slate-400">• Size: {document.fileSizeFormatted}</span>
          </div>
          <h3 className="text-base font-bold text-slate-100">{document.title}</h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            File: {document.fileName} • Source: {document.s3Source}
          </p>
        </div>

        {/* Confidence metric score & Copy Action */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-2 rounded-xl bg-[#172033] border border-slate-800 text-right shadow-sm">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              {document.isDemoSample ? 'Model Confidence' : 'OCR Confidence'}
            </span>
            <span className="text-base font-extrabold text-emerald-400 flex items-center gap-1 justify-end font-mono">
              <CheckCircle2 className="w-4 h-4" />
              {document.overallConfidence > 0 ? `${document.overallConfidence.toFixed(1)}%` : 'N/A'}
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy Text'}
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 px-5 bg-[#0F172A] overflow-x-auto">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveView('text')}
            className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeView === 'text'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Extracted Plain Text ({wordCount} words)
          </button>

          <button
            onClick={() => setActiveView('keyvalues')}
            className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeView === 'keyvalues'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Key-Value Pairs ({document.keyValuePairs.length})
          </button>

          <button
            onClick={() => setActiveView('entities')}
            className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeView === 'entities'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Detected Entities ({document.entities.length})
          </button>

          <button
            onClick={() => setActiveView('json')}
            className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeView === 'json'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Textract / OCR JSON Schema
          </button>
        </div>
      </div>

      {/* View Content */}
      <div className="p-5">
        {/* TAB 1: Extracted Text */}
        {activeView === 'text' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Find keyword in extracted document text..."
                  value={textFilter}
                  onChange={(e) => setTextFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#0F172A] border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <span className="text-[11px] text-slate-400">
                {wordCount} Words • {document.extractedText.length} Characters
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#0B1220] text-slate-100 font-mono text-xs leading-relaxed max-h-96 overflow-y-auto whitespace-pre-wrap select-text border border-slate-800">
              {renderHighlightedText()}
            </div>
          </div>
        )}

        {/* TAB 2: Key-Value Pairs */}
        {activeView === 'keyvalues' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              {document.isDemoSample
                ? 'Key-Value pairs extracted via simulated Amazon Textract Form analysis.'
                : 'Key-Value patterns detected locally from scanned document layout.'}
            </p>
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0F172A] border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Field Key</th>
                    <th className="py-2.5 px-4">Value</th>
                    <th className="py-2.5 px-4 text-right">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {document.keyValuePairs.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-slate-400">
                        No key-value colon patterns detected in this document text.
                      </td>
                    </tr>
                  ) : (
                    document.keyValuePairs.map((kv, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-4 font-semibold text-slate-200">{kv.key}</td>
                        <td className="py-2.5 px-4 font-mono text-slate-300">{kv.value}</td>
                        <td className="py-2.5 px-4 text-right">
                          <span className="font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[11px]">
                            {kv.confidence.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Detected Entities */}
        {activeView === 'entities' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              {document.isDemoSample
                ? 'Named entities classified by simulated Comprehend NLP service.'
                : 'Recognized dates, financial metrics, and entities detected in OCR text.'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {document.entities.length === 0 ? (
                <div className="col-span-full py-6 text-center text-slate-400">
                  No date or currency entities detected in this document text.
                </div>
              ) : (
                document.entities.map((entity, idx) => {
                  const typeColors = {
                    ORGANIZATION: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
                    DATE: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                    MONEY: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                    PERSON: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
                    LOCATION: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                    PII: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
                    POLICY_CLAUSE: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
                  };

                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-800 bg-[#0F172A] flex flex-col justify-between space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            typeColors[entity.type] || 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {entity.type}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {entity.confidence.toFixed(1)}%
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-100 mt-1">
                        {entity.text}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Textract JSON Blocks */}
        {activeView === 'json' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Textract Block Schema & Worker Hierarchy:</span>
              <span className="font-mono text-[11px] text-indigo-400">
                {document.isDemoSample ? 'AWS Textract Format' : 'Tesseract Client Blocks'}
              </span>
            </div>
            <pre className="p-4 rounded-xl bg-[#0B1220] text-emerald-400 font-mono text-xs leading-relaxed max-h-80 overflow-y-auto border border-slate-800">
              {JSON.stringify(mockTextractBlocks, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
