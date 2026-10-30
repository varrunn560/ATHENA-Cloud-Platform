import React, { useState } from 'react';
import { IntellectDocument, DocumentStatus } from '../../../types';
import { Search, Filter, FileText, CheckCircle2, Clock, AlertTriangle, ArrowRight, Copy, Check } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

interface DocumentTableProps {
  documents: IntellectDocument[];
  selectedDocId?: string;
  onSelectDoc: (doc: IntellectDocument) => void;
}

export const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
  selectedDocId,
  onSelectDoc,
}) => {
  const { addToast } = useApp();
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCopyText = (doc: IntellectDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(doc.extractedText);
    setCopiedId(doc.id);
    addToast('Text Copied', `Copied text from ${doc.title}`, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: DocumentStatus, progress?: number) => {
    switch (status) {
      case 'completed':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Completed
          </span>
        );
      case 'processing':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
            Processing {progress ? `(${progress}%)` : ''}
          </span>
        );
      case 'pending':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" /> Queued
          </span>
        );
      case 'failed':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-400" /> Failed
          </span>
        );
    }
  };

  return (
    <div className="bg-[#172033] rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
      {/* Search and Filters */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search documents by title or filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#0F172A] border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 text-slate-100 placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-[#0F172A] px-2.5 py-1.5 rounded-lg border border-slate-700">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent font-medium text-slate-200 text-xs focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-[#0F172A] text-slate-200">All Statuses</option>
            <option value="completed" className="bg-[#0F172A] text-slate-200">Completed</option>
            <option value="processing" className="bg-[#0F172A] text-slate-200">Processing</option>
            <option value="pending" className="bg-[#0F172A] text-slate-200">Queued</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0F172A] border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Document Title & Filename</th>
              <th className="py-3 px-4">Origin / Engine</th>
              <th className="py-3 px-4">Confidence</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Processed (UTC)</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 font-normal">
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-400">
                  No documents found matching the filter criteria.
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc) => {
                const isSelected = doc.id === selectedDocId;

                return (
                  <tr
                    key={doc.id}
                    onClick={() => onSelectDoc(doc)}
                    className={`cursor-pointer transition-colors group ${
                      isSelected ? 'bg-purple-500/10 font-medium' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-100 group-hover:text-purple-400 truncate block max-w-sm transition-colors">
                            {doc.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {doc.fileName} • {doc.fileSizeFormatted}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {doc.isDemoSample ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          DEMO SAMPLE
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          TESSERACT OCR
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {doc.status === 'completed' ? (
                        <span className="font-semibold text-emerald-400 text-xs font-mono">
                          {doc.overallConfidence > 0 ? `${doc.overallConfidence.toFixed(1)}%` : 'N/A'}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(doc.status, doc.processingProgress)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                      {doc.uploadedAt.split(' ')[0]}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => handleCopyText(doc, e)}
                          title="Copy extracted text to clipboard"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                        >
                          {copiedId === doc.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDoc(doc);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors ${
                            isSelected
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-800 text-slate-300 hover:bg-purple-950/50 hover:text-purple-300 border border-slate-700'
                          }`}
                        >
                          Inspect <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="p-3 sm:px-5 bg-[#0F172A] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span>
          Showing <strong className="text-slate-200">{filteredDocs.length}</strong> of{' '}
          <strong className="text-slate-200">{documents.length}</strong> indexed documents
        </span>
        <span className="text-[11px] text-slate-400">
          Engine: <code className="font-mono text-purple-300">Tesseract.js WebAssembly / Web Workers</code>
        </span>
      </div>
    </div>
  );
};
