import React from 'react';
import { AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface DemoNoticeBannerProps {
  moduleName: string;
  simulatedServices: string;
  detail: string;
}

export const DemoNoticeBanner: React.FC<DemoNoticeBannerProps> = ({
  moduleName,
  simulatedServices,
  detail,
}) => {
  const { setActiveTab } = useApp();

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 rounded-xl p-3.5 mb-6 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
          <ShieldCheck className="w-4 h-4 text-indigo-300" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
              Demo Environment Active
            </span>
            <span className="text-xs text-indigo-200 font-medium">{moduleName}</span>
            <span className="text-xs text-slate-400">• Simulated {simulatedServices}</span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{detail}</p>
        </div>
      </div>

      <button
        onClick={() => setActiveTab('settings')}
        className="text-xs text-indigo-300 hover:text-white flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
      >
        <span>Integration Status</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
