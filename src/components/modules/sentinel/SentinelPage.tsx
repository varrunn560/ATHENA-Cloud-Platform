import React from 'react';
import { useApp } from '../../../context/AppContext';
import { SentinelAuth } from '../../../services/sentinelAuth';
import { SecurityEventTable } from './SecurityEventTable';
import { EventDetailDrawer } from './EventDetailDrawer';
import { ShieldAlert, AlertTriangle, Clock, CheckCircle2, RefreshCw, LogIn, LogOut } from 'lucide-react';

export const SentinelPage: React.FC = () => {
  const { securityEvents, selectedEvent, setSelectedEvent, loadSecurityEvent, refreshSecurityEvents, sentinelIsLive, sentinelError, sentinelLoading, sentinelAuthenticated, demoMode, addToast } = useApp();

  const criticalOpen = securityEvents.filter(
    (e) => e.severity === 'critical' && e.status !== 'resolved'
  ).length;

  const investigating = securityEvents.filter((e) => e.status === 'investigating').length;
  const resolved = securityEvents.filter((e) => e.status === 'resolved').length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      <section className="rounded-xl border border-slate-700 bg-[#172033] p-4 text-sm text-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-semibold">{demoMode ? 'Demo data' : sentinelIsLive ? 'Live Sentinel API' : sentinelAuthenticated ? 'Sentinel connection unavailable' : 'Sign in required'}</div>
          <p className="text-xs text-slate-400 mt-1">{demoMode ? 'Showing explicitly enabled demo findings and local-only status changes.' : sentinelError || (sentinelIsLive ? 'Authenticated security events from the Athena Sentinel API.' : 'Sign in to load live security events.')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void refreshSecurityEvents()} disabled={sentinelLoading || demoMode || !sentinelAuthenticated} className="px-3 py-2 rounded-lg border border-slate-600 text-xs disabled:opacity-50 inline-flex items-center gap-2"><RefreshCw className={`w-3.5 h-3.5 ${sentinelLoading ? 'animate-spin' : ''}`} />Refresh</button>
          {sentinelAuthenticated ? <button onClick={() => SentinelAuth.signOut()} className="px-3 py-2 rounded-lg bg-slate-700 text-xs inline-flex items-center gap-2"><LogOut className="w-3.5 h-3.5" />Sign out</button> : <button onClick={() => { void SentinelAuth.signIn().catch((err) => addToast('Sign In Failed', err instanceof Error ? err.message : 'Could not start Sentinel sign-in.', 'error')); }} className="px-3 py-2 rounded-lg bg-indigo-600 text-xs inline-flex items-center gap-2"><LogIn className="w-3.5 h-3.5" />Sign in</button>}
        </div>
      </section>

      {/* Top Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#172033] p-4 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Alerts</span>
            <ShieldAlert className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-100">
            {securityEvents.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Loaded security events</span>
        </div>

        <div className="bg-[#172033] p-4 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Critical Unresolved
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-rose-400">
            {criticalOpen}
          </div>
          <span className="text-[11px] text-rose-400/90 font-medium mt-1 block">
            Requires immediate triage
          </span>
        </div>

        <div className="bg-[#172033] p-4 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Investigating</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-100">
            {investigating}
          </div>
          <span className="text-[11px] text-amber-400 font-medium mt-1 block">Active SOC runbooks</span>
        </div>

        <div className="bg-[#172033] p-4 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-100">
            {resolved}
          </div>
          <span className="text-[11px] text-emerald-400 font-medium mt-1 block">Mitigated threats</span>
        </div>
      </div>

      {/* Security Event Table */}
      <SecurityEventTable
        events={securityEvents}
        emptyStateMessage={sentinelLoading ? 'Loading security events…' : demoMode ? 'No demo security events are available.' : !sentinelAuthenticated ? 'Sign in to load live security events.' : sentinelError ? 'Security events could not be loaded.' : 'No security events were returned by the Sentinel API.'}
        onSelectEvent={(event) => { void loadSecurityEvent(event.id).catch((err) => addToast('Event Load Failed', err instanceof Error ? err.message : 'Could not load event details.', 'error')); }}
      />

      {/* Investigation Drawer */}
      {selectedEvent && (
        <EventDetailDrawer
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
};
