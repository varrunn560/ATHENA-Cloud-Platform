import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { PageTab } from '../../../types';
import { AWSIntegrationCards } from './AWSIntegrationCards';
import { BackendContractsViewer } from './BackendContractsViewer';
import { ApiService, DEFAULT_API_BASE_URL } from '../../../services/api';
import {
  Sliders,
  Bell,
  Save,
  Radio,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { demoMode, setDemoMode, addToast, isVaultLive } = useApp();

  const [refreshInterval, setRefreshInterval] = useState<string>('30');
  const [defaultTab, setDefaultTab] = useState<PageTab>('overview');
  const [criticalToasts, setCriticalToasts] = useState<boolean>(true);
  const [emailAlerts, setEmailAlerts] = useState<boolean>(true);
const [slackWebhook, setSlackWebhook] = useState<string>('');
  const [pagerDutyThreshold, setPagerDutyThreshold] = useState<string>('critical');
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(() => ApiService.getBaseUrl());

  const handleSavePreferences = () => {
    ApiService.setBaseUrl(apiBaseUrl);
    addToast('Preferences Saved', 'Platform configuration updated successfully', 'success');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Settings Header */}
      <div className="bg-[#172033] p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Platform Settings & Integrations</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage dashboard preferences, alert dispatch webhooks, and AWS backend endpoint contracts
          </p>
        </div>

        <button
          onClick={handleSavePreferences}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      {/* Demo Mode / Live API Mode Switcher Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-[#172033] text-white border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Operational Data Source
            </span>
          </div>
          <h3 className="text-base font-bold">
            {isVaultLive
              ? 'Live AWS API Gateway Connected (ap-south-1)'
              : demoMode
              ? 'Local Demonstration Mode Active'
              : 'Live Mode (Connecting to API Gateway)'}
          </h3>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            {isVaultLive
              ? 'Athena Vault is actively communicating with AWS API Gateway (https://w5vwnekg26.execute-api.ap-south-1.amazonaws.com) and S3 bucket athena-vault-cad.'
              : demoMode
              ? 'Athena is operating in high-fidelity Demo Mode. All S3 file versions, Textract OCR extracts, and CloudTrail findings are simulated client-side.'
              : 'Connecting to AWS API gateway endpoints for Athena Vault.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setDemoMode(!demoMode)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              demoMode
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
            }`}
          >
            {demoMode ? 'Switch to Live API Mode' : 'Switch to Demo Mode'}
          </button>
        </div>
      </div>

      {/* AWS Integration Cards */}
      <AWSIntegrationCards />

      {/* Dashboard Preferences & Notification Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dashboard Preferences */}
        <div className="bg-[#172033] rounded-2xl border border-slate-800 p-5 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-800 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-100">Dashboard Preferences</h3>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Telemetry Refresh Interval
              </label>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(e.target.value)}
                className="w-full px-3 py-2 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-200 bg-[#0F172A]"
              >
                <option value="15" className="bg-[#0F172A] text-slate-200">Every 15 seconds (High Frequency)</option>
                <option value="30" className="bg-[#0F172A] text-slate-200">Every 30 seconds (Default)</option>
                <option value="60" className="bg-[#0F172A] text-slate-200">Every 1 minute</option>
                <option value="manual" className="bg-[#0F172A] text-slate-200">Manual Refresh Only</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Default Landing Workspace
              </label>
              <select
                value={defaultTab}
                onChange={(e) => setDefaultTab(e.target.value as PageTab)}
                className="w-full px-3 py-2 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-200 bg-[#0F172A]"
              >
                <option value="overview" className="bg-[#0F172A] text-slate-200">Overview (Executive Cockpit)</option>
                <option value="vault" className="bg-[#0F172A] text-slate-200">Athena Vault (File Storage & Recovery)</option>
                <option value="intellect" className="bg-[#0F172A] text-slate-200">Athena Intellect (Document OCR)</option>
                <option value="sentinel" className="bg-[#0F172A] text-slate-200">Athena Sentinel (Security Operations)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Backend API Base URL
              </label>
              <input
                type="text"
                value={apiBaseUrl}
                onChange={(e) => setApiBaseUrl(e.target.value)}
                placeholder={DEFAULT_API_BASE_URL}
                className="w-full px-3 py-2 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-mono text-xs text-slate-100 bg-[#0F172A]"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                AWS API Gateway endpoint destination for REST calls.
              </span>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={criticalToasts}
                  onChange={(e) => setCriticalToasts(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-slate-300">
                  Display popup toast on Critical security detection
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Notification & Dispatch Settings */}
        <div className="bg-[#172033] rounded-2xl border border-slate-800 p-5 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-800 flex items-center gap-2">
            <Bell className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold text-slate-100">Incident Alert Routing</h3>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="flex items-center gap-2 cursor-pointer mb-1">
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold text-slate-300">
                  Email Dispatch to Security Operations (SecOps)
                </span>
              </label>
              <span className="text-[11px] text-slate-400 block pl-6">
                Sends digests of Critical and High priority AWS findings to secops@athenacorp.internal
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Slack Incident Webhook URL
              </label>
              <input
                type="text"
                value={slackWebhook}
                onChange={(e) => setSlackWebhook(e.target.value)}
                className="w-full px-3 py-2 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-mono text-xs text-slate-100 bg-[#0F172A]"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Incoming webhook for the #athena-sec-alerts channel.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                PagerDuty On-Call Escalation Threshold
              </label>
              <select
                value={pagerDutyThreshold}
                onChange={(e) => setPagerDutyThreshold(e.target.value)}
                className="w-full px-3 py-2 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-200 bg-[#0F172A]"
              >
                <option value="critical" className="bg-[#0F172A] text-slate-200">Critical Severity Only (Immediate Page)</option>
                <option value="high" className="bg-[#0F172A] text-slate-200">Critical & High Severities</option>
                <option value="all" className="bg-[#0F172A] text-slate-200">All Anomalies (Noisy)</option>
                <option value="none" className="bg-[#0F172A] text-slate-200">Disabled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Backend Integration Contracts Viewer */}
      <BackendContractsViewer />
    </div>
  );
};
