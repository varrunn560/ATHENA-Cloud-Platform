import React from 'react';
import { useApp } from '../../context/AppContext';
import { PageTab } from '../../types';
import {
  Shield,
  LayoutDashboard,
  HardDrive,
  Cpu,
  ShieldAlert,
  Settings,
  Sparkles,
  Server,
  Activity,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { activeTab, setActiveTab, securityEvents, files, documents, demoMode, sentinelIsLive } = useApp();

  const criticalAlertsCount = securityEvents.filter(
    (e) => e.severity === 'critical' && e.status !== 'resolved'
  ).length;

  const navItems: {
    id: PageTab;
    label: string;
    sublabel: string;
    icon: React.ElementType;
    badge?: string | number;
    badgeColor?: string;
  }[] = [
    {
      id: 'overview',
      label: 'Overview',
      sublabel: 'Executive Cockpit',
      icon: LayoutDashboard,
    },
    {
      id: 'vault',
      label: 'Athena Vault',
      sublabel: 'Storage & Recovery',
      icon: HardDrive,
      badge: `${files.length} files`,
      badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
    },
    {
      id: 'intellect',
      label: 'Athena Intellect',
      sublabel: 'Document OCR & ML',
      icon: Cpu,
      badge: `${documents.length} docs`,
      badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
    },
    {
      id: 'sentinel',
      label: 'Athena Sentinel',
      sublabel: 'Cloud Threat Defense',
      icon: ShieldAlert,
      badge: criticalAlertsCount > 0 ? `${criticalAlertsCount} critical` : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse-subtle',
    },
    {
      id: 'settings',
      label: 'Settings',
      sublabel: 'Integrations & API',
      icon: Settings,
    },
  ];

  const handleNavClick = (tab: PageTab) => {
    setActiveTab(tab);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen?.(false)}
        />
      )}

      {/* Persistent Sidebar */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-72 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="p-6 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-700 p-0.5 shadow-lg shadow-indigo-500/25 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white stroke-[2.2]" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-white text-lg tracking-tight">ATHENA</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                    SaaS
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium tracking-wide">
                  Cloud Protection & Security
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Section */}
          <div className="px-3 py-6">
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Core Modules
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                v2.6
              </span>
            </div>

            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between group ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-800 text-slate-400 group-hover:text-indigo-400 group-hover:bg-slate-700/80'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="truncate text-[13px] font-semibold leading-tight">
                          {item.label}
                        </span>
                        <span
                          className={`truncate text-[11px] leading-tight mt-0.5 ${
                            isActive ? 'text-indigo-200' : 'text-slate-400'
                          }`}
                        >
                          {item.sublabel}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.badge && (
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                            isActive
                              ? 'bg-indigo-800/60 text-indigo-100 border-indigo-400/40'
                              : item.badgeColor
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight
                        className={`w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all ${
                          isActive ? 'text-indigo-200 opacity-80' : 'text-slate-500'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Cloud Status Footer Widget */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[11px] font-semibold text-slate-300">Target Region</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-indigo-300 border border-slate-700">
                ap-south-1
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-700/50">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] text-slate-400">Health SLA</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-400">99.99%</span>
            </div>

            <div className="pt-1 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Sentinel Data</span>
              <span className="text-[10px] font-medium text-amber-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                {demoMode ? 'Demo Active' : sentinelIsLive ? 'Live AWS' : 'Not Connected'}
              </span>
            </div>
          </div>

          <div className="mt-3 text-center">
            <span className="text-[10px] text-slate-400 tracking-tight">
              Athena Security Engine • AWS Ready
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
