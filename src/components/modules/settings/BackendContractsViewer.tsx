import React, { useState } from 'react';
import { Code, Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { ApiService } from '../../../services/api';

export const BackendContractsViewer: React.FC = () => {
  const { addToast } = useApp();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const endpoints = [
    {
      method: 'GET',
      path: '/api/files',
      summary: 'List S3 Objects in Vault (LIVE)',
      description: 'Returns array of file keys and sizes currently stored in the AWS S3 vault bucket.',
      request: undefined,
      response: `{
  "files": [
    {
      "key": "demo/athena-test.txt",
      "size": 22
    }
  ]
}`,
    },
    {
      method: 'POST',
      path: '/api/files/upload-url',
      summary: 'Request Presigned S3 Upload URL (LIVE)',
      description: 'Generates a temporary AWS S3 presigned PUT URL. Raw file bytes are PUT directly to the uploadUrl.',
      request: `{
  "filename": "quarterly-report.pdf"
}`,
      response: `{
  "key": "demo/7fbd302469dd4123ac64d6b9d07232b2/quarterly-report.pdf",
  "uploadUrl": "https://athena-vault-cad.s3.ap-south-1.amazonaws.com/demo/...?X-Amz-Signature=...",
  "expiresIn": 300
}`,
    },
    {
      method: 'GET',
      path: '/api/files/download-url?key={URL_ENCODED_KEY}',
      summary: 'Request Presigned S3 Download URL (LIVE)',
      description: 'Generates a time-limited AWS S3 presigned GET URL to securely download the stored object.',
      request: undefined,
      response: `{
  "key": "demo/athena-test.txt",
  "downloadUrl": "https://athena-vault-cad.s3.ap-south-1.amazonaws.com/demo/athena-test.txt?...",
  "expiresIn": 300
}`,
    },
    {
      method: 'GET',
      path: '/api/files/versions?key={URL_ENCODED_KEY}',
      summary: 'Get S3 Object Version History (LIVE)',
      description: 'Fetches all historical immutable revisions tracked by AWS S3 versioning for the specified key.',
      request: undefined,
      response: `{
  "key": "demo/athena-test.txt",
  "versions": [
    {
      "versionId": "dhYM8jFMgz4SzwxKSKVzDQhcE3AJZyjU",
      "lastModified": "2026-10-29T16:18:37+00:00",
      "size": 22,
      "isLatest": true
    },
    {
      "versionId": "RD5ffpTzw8is4u2Izk.iUufrJnwOaMPq",
      "lastModified": "2026-10-29T15:57:09+00:00",
      "size": 22,
      "isLatest": false
    }
  ]
}`,
    },
    {
      method: 'POST',
      path: '/api/files/restore',
      summary: 'Restore Older S3 Version to Head (LIVE)',
      description: 'Promotes an older version snapshot to the current head revision on AWS S3 without deleting version history.',
      request: `{
  "key": "demo/athena-test.txt",
  "versionId": "RD5ffpTzw8is4u2Izk.iUufrJnwOaMPq"
}`,
      response: `{
  "message": "File version restored successfully",
  "key": "demo/athena-test.txt"
}`,
    },
    {
      method: 'GET',
      path: '/api/overview',
      summary: 'Dashboard Telemetry & KPIs',
      description: 'Returns storage volume totals, alert trends, snapshot health, and recent activities.',
      request: undefined,
      response: `{
  "storedFilesCount": 1482,
  "storedFilesVolumeFormatted": "4.8 TB",
  "backupHealthPercentage": 99.4,
  "snapshotsIntact": 128,
  "snapshotsTotal": 128,
  "activeAlertsTotal": 10,
  "criticalAlertsCount": 2
}`,
    },
    {
      method: 'GET',
      path: '/api/documents',
      summary: 'List OCR Documents (Intellect)',
      description: 'Fetches documents analyzed with Textract, OCR confidence scores, and key-value extractions.',
      request: undefined,
      response: `[
  {
    "id": "doc-01",
    "title": "Vendor Security Assessment",
    "status": "completed",
    "overallConfidence": 99.2,
    "pageCount": 4
  }
]`,
    },
    {
      method: 'GET',
      path: '/api/sentinel/events',
      summary: 'List Cloud Security Alerts (Sentinel)',
      description: 'Uses the dedicated Sentinel API and a Cognito Authorization bearer token. Status changes use POST /api/sentinel/events/{eventId}/acknowledge, /investigate, or /resolve.',
      request: undefined,
      response: `{"events": [
  {
    "eventId": "sec-001",
    "severity": "CRITICAL",
    "eventType": "IAM.RootAccountUsage",
    "status": "OPEN",
    "region": "ap-south-1"
  }
], "count": 1}`,
    },
  ];

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    addToast('Copied to Clipboard', 'JSON contract snippet copied', 'info');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="bg-[#172033] rounded-2xl border border-slate-800 p-5 shadow-sm space-y-4">
      <div className="pb-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Code className="w-4 h-4 text-indigo-400" />
            Backend REST Contracts & Integration Specifications
          </h3>
          <p className="text-xs text-slate-400">
            Active REST API specification for AWS API Gateway at{' '}
            <code className="text-emerald-400 font-mono">{ApiService.getBaseUrl()}</code>
          </p>
        </div>
        <span className="text-[11px] font-mono text-slate-400 self-start sm:self-auto bg-[#0F172A] px-2.5 py-1 rounded-lg border border-slate-700">
          8 Endpoints Documented
        </span>
      </div>

      <div className="space-y-3">
        {endpoints.map((ep, idx) => {
          const isExpanded = expandedIndex === idx;
          const isLiveEndpoint = idx < 5;

          return (
            <div
              key={idx}
              className="rounded-xl border border-slate-800 bg-[#0F172A] overflow-hidden transition-all"
            >
              {/* Header */}
              <div
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                      ep.method === 'GET'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : ep.method === 'POST'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-200 truncate">
                    {ep.path}
                  </span>
                  {isLiveEndpoint && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hidden sm:inline">
                      ACTIVE S3
                    </span>
                  )}
                  <span className="text-xs text-slate-400 hidden md:inline truncate">
                    — {ep.summary}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(ep.response, idx);
                    }}
                    title="Copy sample response JSON"
                    className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Collapsible Details */}
              {isExpanded && (
                <div className="p-4 border-t border-slate-800/80 bg-[#0B1220]/70 space-y-3 animate-in fade-in text-xs">
                  <p className="text-slate-300">{ep.description}</p>

                  {ep.request && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Request Body (JSON)
                      </span>
                      <pre className="p-3 rounded-lg bg-[#0B1220] text-indigo-300 font-mono text-[11px] overflow-x-auto border border-slate-800">
                        {ep.request}
                      </pre>
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Expected Response (JSON)
                    </span>
                    <pre className="p-3 rounded-lg bg-[#0B1220] text-emerald-300 font-mono text-[11px] overflow-x-auto border border-slate-800">
                      {ep.response}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
