import React, { useState } from 'react';
import { SecurityEvent, EventStatus } from '../../../types';
import {
  X,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Copy,
  CheckSquare,
  Square,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';

interface EventDetailDrawerProps {
  event: SecurityEvent | null;
  onClose: () => void;
}

export const EventDetailDrawer: React.FC<EventDetailDrawerProps> = ({ event, onClose }) => {
  const { updateSecurityEvent, addToast, sentinelIsLive, demoMode } = useApp();
  const [noteInput, setNoteInput] = useState<string>(event?.notes || '');
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  if (!event) return null;

  const handleStatusChange = async (newStatus: EventStatus) => {
    if (isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try { await updateSecurityEvent(event.id, { status: newStatus }); }
    catch (err) { addToast('Status Update Failed', err instanceof Error ? err.message : 'Could not update Sentinel status.', 'error'); }
    finally { setIsUpdatingStatus(false); }
  };

  const handleToggleStep = async (stepIndex: number) => {
    try { await updateSecurityEvent(event.id, { completedStepIndex: stepIndex }); }
    catch (err) { addToast('Checklist Update Failed', err instanceof Error ? err.message : 'Could not update checklist.', 'error'); }
  };

  const handleSaveNote = async () => {
    setIsSavingNote(true);
    try {
      await updateSecurityEvent(event.id, { notes: noteInput });
      addToast('Note Saved', 'Investigation log updated locally.', 'success');
    } catch (err) {
      addToast('Note Not Saved', err instanceof Error ? err.message : 'Could not save this note.', 'error');
    } finally { setIsSavingNote(false); }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addToast('Copied to Clipboard', `${label} copied`, 'info');
  };

  const severityBadges = {
    critical: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    low: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  };

  const statusBadges = {
    open: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    investigating: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    acknowledged: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 flex justify-end">
      <div className="w-full max-w-2xl bg-[#172033] h-full shadow-2xl border-l border-slate-700 flex flex-col justify-between animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 bg-[#0F172A] flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${event.severity === 'critical'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : event.severity === 'high'
                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
            >
              <ShieldAlert className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${severityBadges[event.severity]
                    }`}
                >
                  {event.severity} SEVERITY
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadges[event.status]
                    }`}
                >
                  Status: {event.status.toUpperCase()}
                </span>
                <span className="text-xs text-slate-400 font-mono">{event.id}</span>
              </div>
              <h3 className="text-base font-bold text-slate-100 leading-tight">
                {event.eventType}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ingested via {event.source} • {event.timestamp}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body Scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs text-slate-300">
          {/* Summary & Tactic */}
          <div className="p-4 rounded-xl bg-[#0F172A] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Finding Summary
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                MITRE ATT&CK: {event.mitreTactic}
              </span>
            </div>
            <p className="text-slate-200 leading-relaxed font-medium">{event.summary}</p>
          </div>

          {/* Quick Status Action Controls */}
          <div className="p-3.5 rounded-xl bg-[#0F172A] border border-slate-800 flex items-center justify-between gap-3 flex-wrap">
            <span className="font-semibold text-slate-300">Triage Lifecycle:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => void handleStatusChange('acknowledged')}
                disabled={isUpdatingStatus}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${event.status === 'acknowledged'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
              >
                Acknowledge
              </button>
              <button
                onClick={() => void handleStatusChange('investigating')}
                disabled={isUpdatingStatus}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${event.status === 'investigating'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
              >
                In Investigation
              </button>
              <button
                onClick={() => void handleStatusChange('resolved')}
                disabled={isUpdatingStatus}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${event.status === 'resolved'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 border border-slate-700 text-emerald-400 hover:bg-emerald-950/40'
                  }`}
              >
                Resolve Finding
              </button>
            </div>
          </div>

          {/* Forensic Metadata Tiles */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              CloudTrail Forensic Metadata
            </h4>

            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-[#0F172A] border border-slate-800">
                <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1">
                  <span>Target Resource ARN</span>
                  <button
                    onClick={() => copyToClipboard(event.resourceArn, 'Resource ARN')}
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <div className="font-mono text-slate-200 break-all">{event.resourceArn}</div>
              </div>

              <div className="p-3 rounded-xl bg-[#0F172A] border border-slate-800">
                <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1">
                  <span>Caller Identity / IAM Principal</span>
                  <button
                    onClick={() => copyToClipboard(event.principal, 'Principal')}
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <div className="font-mono text-slate-200 break-all">{event.principal}</div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-[#0F172A] border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Region</span>
                  <span className="font-mono text-slate-200 font-semibold">{event.awsRegion}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0F172A] border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Source IP</span>
                  <span className="font-mono text-slate-200 font-semibold">{event.sourceIp}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0F172A] border border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">User Agent</span>
                  <span className="font-mono text-slate-200 truncate block" title={event.userAgent}>
                    {event.userAgent}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Investigation Runbook Steps */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Recommended Investigation Runbook
            </h4>

            <div className="space-y-2">
              {event.investigationSteps.length === 0 && <p className="p-3 rounded-xl bg-[#0F172A] border border-slate-800 text-slate-400">No investigation runbook steps are included in this event.</p>}
              {event.investigationSteps.map((step, idx) => (
                <div
                  key={step.step}
                  onClick={() => void handleToggleStep(idx)}
                  aria-disabled={sentinelIsLive && !demoMode}
                  className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${sentinelIsLive && !demoMode ? 'opacity-60 cursor-not-allowed pointer-events-none' : 'cursor-pointer'} ${step.completed
                      ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-400'
                      : 'bg-[#0F172A] border-slate-800 hover:border-indigo-500/40 text-slate-200'
                    }`}
                >
                  <div className="mt-0.5">
                    {step.completed ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold ${step.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                        {step.step}. {step.title}
                      </span>
                      {step.actionRequired && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold">
                          {step.actionRequired}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Investigation Notes Input */}
          <div className="space-y-2">
            <label className="font-bold uppercase tracking-wider text-slate-400 text-xs block">
              Investigation Notes & Log
            </label>
            <textarea
              rows={3}
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              disabled={sentinelIsLive && !demoMode}
              placeholder="Record forensic observations, ticket IDs, or root cause hypothesis..."
              className="w-full p-3 text-xs bg-[#0F172A] border border-slate-700 text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 font-sans placeholder:text-slate-500"
            />
            {sentinelIsLive && !demoMode && <p className="text-[11px] text-amber-300">Notes are unavailable: the Sentinel API does not persist investigation notes.</p>}
            <div className="flex justify-end">
              <button
                onClick={handleSaveNote}
                disabled={isSavingNote || (sentinelIsLive && !demoMode)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                {isSavingNote ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>

          {/* Raw CloudTrail JSON Snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-slate-400 text-xs">
                Raw Event Payload (CloudTrail / GuardDuty)
              </span>
              <button
                onClick={() =>
                  copyToClipboard(JSON.stringify(event.rawPayloadSnippet, null, 2), 'JSON Payload')
                }
                className="text-indigo-400 hover:text-indigo-300 text-[11px] flex items-center gap-1"
              >
                <Copy className="w-3 h-3" /> Copy Payload
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-[#0B1220] text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800">
              {JSON.stringify(event.rawPayloadSnippet, null, 2)}
            </pre>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 bg-[#0F172A] border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Athena Sentinel Incident Response Framework v2.6
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
};
