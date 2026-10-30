import React from 'react';
import { OverviewMetrics } from '../../../types';
import { ShieldCheck, HardDrive, Lock, RefreshCw, CheckCircle2 } from 'lucide-react';

interface BackupStatusPanelProps {
  metrics: OverviewMetrics;
}

export const BackupStatusPanel: React.FC<BackupStatusPanelProps> = ({ metrics }) => {
  const totalStorageGb = metrics.storageBreakdown.reduce((acc, curr) => acc + curr.valueGb, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Backup & Storage Posture</h3>
            <p className="text-xs text-slate-500">Immutable snapshot integrity & tier distribution</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {metrics.backupHealthPercentage}% Intact
        </span>
      </div>

      {/* Grid of Key Backup Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] text-slate-500 block">Snapshots Intact</span>
          <span className="text-base font-bold text-slate-900 mt-0.5 block">
            {metrics.snapshotsIntact} / {metrics.snapshotsTotal}
          </span>
          <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3 h-3" />
            100% verified
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] text-slate-500 block">Last Snapshot</span>
          <span className="text-xs font-bold text-slate-900 mt-1 block truncate">
            {metrics.lastSnapshotTime.split(' ')[0]}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {metrics.lastSnapshotTime.split(' ')[1]} UTC
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] text-slate-500 block">Next Scheduled</span>
          <span className="text-xs font-bold text-indigo-600 mt-1 block flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
            {metrics.nextScheduledBackup}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Daily differential</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] text-slate-500 block">WORM Immutability</span>
          <span className="text-xs font-bold text-emerald-700 mt-1 block flex items-center gap-1">
            <Lock className="w-3 h-3 text-emerald-600" />
            Compliant
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">S3 Object Lock active</span>
        </div>
      </div>

      {/* Storage Breakdown Multi-bar */}
      <div>
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-slate-400" />
            Storage Tier Distribution
          </span>
          <span className="text-slate-500 font-mono text-[11px]">
            {(totalStorageGb / 1024).toFixed(1)} TB Total Allocated
          </span>
        </div>

        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
          {metrics.storageBreakdown.map((tier, idx) => {
            const percentage = (tier.valueGb / totalStorageGb) * 100;
            return (
              <div
                key={idx}
                style={{ width: `${percentage}%`, backgroundColor: tier.color }}
                className="h-full transition-all duration-500 hover:opacity-90"
                title={`${tier.name}: ${tier.valueGb} GB (${percentage.toFixed(1)}%)`}
              />
            );
          })}
        </div>

        <div className="flex flex-wrap gap-4 mt-3">
          {metrics.storageBreakdown.map((tier, idx) => {
            const percentage = ((tier.valueGb / totalStorageGb) * 100).toFixed(0);
            return (
              <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: tier.color }}
                />
                <span className="truncate">{tier.name}</span>
                <span className="text-slate-400 text-[11px]">
                  ({tier.valueGb} GB / {percentage}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
