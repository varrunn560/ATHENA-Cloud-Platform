import React from 'react';
import { ResourceHealthItem } from '../../../types';
import { Activity, CheckCircle2, AlertTriangle, Radio } from 'lucide-react';

interface ResourceHealthSectionProps {
  resources: ResourceHealthItem[];
}

export const ResourceHealthSection: React.FC<ResourceHealthSectionProps> = ({ resources }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Cloud Infrastructure Health</h3>
            <p className="text-xs text-slate-500">Live SLA status across AWS services & cryptographic pipelines</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
          6 Services Monitored
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {resources.map((item) => {
          const statusConfig = {
            healthy: {
              badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              label: 'Healthy',
              dot: 'bg-emerald-500',
              icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
            },
            degraded: {
              badge: 'bg-rose-50 text-rose-700 border-rose-200',
              label: 'Degraded',
              dot: 'bg-rose-500 animate-ping',
              icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />,
            },
            warning: {
              badge: 'bg-amber-50 text-amber-700 border-amber-200',
              label: 'Warning',
              dot: 'bg-amber-500',
              icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
            },
            demo_active: {
              badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
              label: 'Demo Emulated',
              dot: 'bg-indigo-500',
              icon: <Radio className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />,
            },
          };

          const config = statusConfig[item.status];

          return (
            <div
              key={item.id}
              className="p-3.5 rounded-xl border border-slate-200/70 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {item.category} • {item.service}
                  </span>
                  <h4 className="text-xs font-semibold text-slate-900 mt-0.5">{item.name}</h4>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1.5 shrink-0 ${config.badge}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                  {config.label}
                </span>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                {item.details}
              </p>

              <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Uptime: {item.uptimePercentage}%</span>
                <span>Latency: {item.latencyMs}ms</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
