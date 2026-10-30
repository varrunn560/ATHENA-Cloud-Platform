import React, { useState } from 'react';
import { IntegrationCardStatus } from '../../../types';
import { INITIAL_INTEGRATION_STATUS } from '../../../services/demoData';
import { ApiService } from '../../../services/api';
import {
  Server,
  CheckCircle2,
  AlertCircle,
  Radio,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export const AWSIntegrationCards: React.FC = () => {
  const { addToast, isVaultLive, sentinelIsLive, demoMode } = useApp();
  const [integrations] = useState<IntegrationCardStatus[]>(INITIAL_INTEGRATION_STATUS);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ online: boolean; message: string; latencyMs?: number } | null>(null);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await ApiService.testBackendConnection();
    setIsTesting(false);
    setTestResult(result);
    addToast(
      result.online ? 'Backend Connected' : 'Endpoint Offline',
      result.message,
      result.online ? 'success' : 'warning'
    );
  };

  const getStatusBadge = (status: IntegrationCardStatus['status'], serviceName: string) => {
    // If it's Athena Vault and isVaultLive is true, mark it as connected
    const isSentinel = /Sentinel|CloudTrail|EventBridge/.test(serviceName);
    const isLiveConnected = serviceName.includes('Vault') && isVaultLive || isSentinel && sentinelIsLive;

    if (isLiveConnected || status === 'connected') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Connected (AWS)
        </span>
      );
    }
    if (isSentinel && !demoMode && !sentinelIsLive) {
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Sentinel not connected</span>;
    }
    if (status === 'demo_mode') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
          <Radio className="w-3 h-3 text-amber-400 animate-pulse" /> Sample Data
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
        <AlertCircle className="w-3 h-3 text-slate-500" /> Pending Integration
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-400" />
            AWS Cloud Integration Status
          </h3>
          <p className="text-xs text-slate-400">
            Real-time distinction between Connected live AWS resources, Pending endpoints, and Sample Data.
          </p>
        </div>

        <button
          onClick={handleTestConnection}
          disabled={isTesting}
          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors self-start sm:self-auto disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
          {isTesting ? 'Pinging Gateway...' : 'Test Backend Connection'}
        </button>
      </div>

      {testResult && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between animate-in fade-in ${
            testResult.online
              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
              : 'bg-amber-950/40 border-amber-800/80 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {testResult.online ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400" />
            )}
            <span>
              <strong>Status:</strong> {testResult.message}
              {testResult.latencyMs && (
                <span className="ml-2 font-mono text-[11px] text-emerald-400">
                  ({testResult.latencyMs}ms latency)
                </span>
              )}
            </span>
          </div>
          <span className="font-mono text-[10px] bg-[#0B1220] px-2 py-0.5 rounded border border-slate-800 text-slate-400">
            {ApiService.getBaseUrl()}
          </span>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((card, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl border border-slate-800 bg-[#172033] hover:border-slate-700 transition-all shadow-sm flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                    {card.awsService}
                  </span>
                  <h4 className="text-xs font-bold text-slate-100 mt-0.5">{card.serviceName}</h4>
                </div>
                {getStatusBadge(card.status, card.serviceName)}
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">{card.description}</p>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span className="truncate max-w-[200px]" title={card.resourceIdentifier}>
                {card.serviceName.includes('Vault') && isVaultLive
                  ? 's3://athena-vault-cad/demo/*'
                  : card.resourceIdentifier}
              </span>
              <span>
                {card.serviceName.includes('Vault') && isVaultLive ? 'LIVE' : card.latency || 'Mock'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
