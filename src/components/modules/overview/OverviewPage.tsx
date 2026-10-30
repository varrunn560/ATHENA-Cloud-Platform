import React from 'react';
import { useApp } from '../../../context/AppContext';
import { AlertTrendChart } from './AlertTrendChart';
import { BackupStatusPanel } from './BackupStatusPanel';
import { ResourceHealthSection } from './ResourceHealthSection';
import { RecentActivityFeed } from './RecentActivityFeed';
import {
  HardDrive,
  ShieldAlert,
  Cpu,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Layers,
  FileCheck2,
  Lock,
  ChevronRight,
} from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const { overviewMetrics, setActiveTab, refreshAllData, isLoading, files, securityEvents, documents } = useApp();

  // Current formatted date
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const criticalAlertsCount = securityEvents.filter(
    (e) => e.severity === 'critical' && e.status !== 'resolved'
  ).length;

  const highAlertsCount = securityEvents.filter(
    (e) => e.severity === 'high' && e.status !== 'resolved'
  ).length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Welcome Heading Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
              Athena Cloud Security Operating System
            </span>
            <span className="text-xs text-slate-400">• {todayFormatted}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Security & Data Protection Cockpit
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Real-time status across Athena Vault (S3 & WORM recovery), Athena Intellect (Textract OCR), and Athena Sentinel (CloudTrail threat triage).
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => refreshAllData()}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center gap-2 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Syncing...' : 'Sync Telemetry'}
          </button>
          <button
            onClick={() => setActiveTab('sentinel')}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Triage Alerts
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Stored Files */}
        <div
          onClick={() => setActiveTab('vault')}
          className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Athena Vault
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <HardDrive className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {overviewMetrics.storedFilesCount}
              </span>
              <span className="text-xs font-medium text-slate-500">
                ({overviewMetrics.storedFilesVolumeFormatted})
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Total encrypted S3 objects</p>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              +{overviewMetrics.filesGrowthMonthlyPercent}% MoM
            </span>
            <span className="text-indigo-600 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              Open Vault <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card 2: Active Security Alerts */}
        <div
          onClick={() => setActiveTab('sentinel')}
          className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-rose-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Athena Sentinel
              </span>
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {securityEvents.filter((e) => e.status !== 'resolved').length}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                {criticalAlertsCount} Critical
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">CloudTrail & GuardDuty findings</p>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
            <span className="text-amber-600 font-medium">{highAlertsCount} High Priority</span>
            <span className="text-rose-600 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              Investigate <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card 3: Backup Health */}
        <div
          onClick={() => setActiveTab('vault')}
          className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Backup Health
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {overviewMetrics.backupHealthPercentage}%
              </span>
              <span className="text-xs font-medium text-emerald-600">Optimal</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {overviewMetrics.snapshotsIntact} / {overviewMetrics.snapshotsTotal} snapshots verified
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
            <span className="text-slate-600 flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-600" />
              WORM Immutable
            </span>
            <span className="text-emerald-600 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              Status <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card 4: Documents Processed */}
        <div
          onClick={() => setActiveTab('intellect')}
          className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Athena Intellect
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Cpu className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {overviewMetrics.documentsProcessedTotal.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-purple-600">
                {overviewMetrics.ocrAccuracyPercentage}% Accuracy
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Textract OCR & entity extraction</p>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
            <span className="text-slate-500">{documents.length} in current library</span>
            <span className="text-purple-600 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              View OCR <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Security Alert Trend Chart + Module Quick Launchers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Security Alert Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Security Alert Trend (Last 7 Days)</h3>
              <p className="text-xs text-slate-500">
                Telemetry aggregate of incoming GuardDuty, CloudTrail, and IAM events
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">AWS us-east-1 Feed</span>
          </div>

          <AlertTrendChart data={overviewMetrics.alertTrends} />
        </div>

        {/* Right Col: Module Quick Launchers */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Module Shortcuts</h3>
              <p className="text-xs text-slate-500">Direct access to core protection workflows</p>
            </div>

            <div className="space-y-3 mt-4">
              <div
                onClick={() => setActiveTab('vault')}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <HardDrive className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        Athena Vault
                      </h4>
                      <p className="text-[11px] text-slate-500">S3 drag-drop & version rollback</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </div>
              </div>

              <div
                onClick={() => setActiveTab('intellect')}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50/30 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                        Athena Intellect
                      </h4>
                      <p className="text-[11px] text-slate-500">Document OCR & entity parser</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                </div>
              </div>

              <div
                onClick={() => setActiveTab('sentinel')}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-rose-400 hover:bg-rose-50/30 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                        Athena Sentinel
                      </h4>
                      <p className="text-[11px] text-slate-500">Incident triage & CloudTrail audit</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <button
              onClick={() => setActiveTab('settings')}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1"
            >
              Configure AWS Backend API Endpoints <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Backup Status Panel */}
      <BackupStatusPanel metrics={overviewMetrics} />

      {/* Infrastructure Resource Health */}
      <ResourceHealthSection resources={overviewMetrics.resourceHealth} />

      {/* Recent Activity Feed */}
      <RecentActivityFeed activities={overviewMetrics.recentActivities} />
    </div>
  );
};
