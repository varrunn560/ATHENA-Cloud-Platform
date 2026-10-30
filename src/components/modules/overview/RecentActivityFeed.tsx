import React from 'react';
import { RecentActivityItem, PageTab } from '../../../types';
import { useApp } from '../../../context/AppContext';
import { HardDrive, Cpu, ShieldAlert, ArrowUpRight, Clock } from 'lucide-react';

interface RecentActivityFeedProps {
  activities: RecentActivityItem[];
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ activities }) => {
  const { setActiveTab } = useApp();

  const moduleIconMap = {
    vault: <HardDrive className="w-4 h-4 text-indigo-600" />,
    intellect: <Cpu className="w-4 h-4 text-emerald-600" />,
    sentinel: <ShieldAlert className="w-4 h-4 text-rose-600" />,
  };

  const moduleBgMap = {
    vault: 'bg-indigo-50 border-indigo-100',
    intellect: 'bg-emerald-50 border-emerald-100',
    sentinel: 'bg-rose-50 border-rose-100',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Platform Activity</h3>
            <p className="text-xs text-slate-500">Audit trail of storage recoveries, OCR and threat detections</p>
          </div>
        </div>
        <span className="text-xs text-slate-400 font-medium">Live Stream</span>
      </div>

      <div className="divide-y divide-slate-100">
        {activities.map((item) => (
          <div
            key={item.id}
            onClick={() => setActiveTab(item.module as PageTab)}
            className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3 group cursor-pointer hover:bg-slate-50/80 px-2 -mx-2 rounded-xl transition-colors"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${moduleBgMap[item.module]
                  }`}
              >
                {moduleIconMap[item.module]}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {item.title}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                    {item.actionType}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed truncate sm:line-clamp-1">
                  {item.description}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                  <span>Actor: {item.actor}</span>
                  <span>•</span>
                  <span>{item.timestamp}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
