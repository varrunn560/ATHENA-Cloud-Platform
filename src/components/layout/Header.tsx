import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PageTab } from '../../types';
import {
  Search,
  Bell,
  Menu,
  ShieldAlert,
  HardDrive,
  FileText,
  CheckCircle,
  ExternalLink,
  User,
  LogOut,
  Sliders,
  ChevronDown,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const {
    activeTab,
    setActiveTab,
    demoMode,
    sentinelIsLive,
    setDemoMode,
    globalSearch,
    setGlobalSearch,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    unreadCount,
    files,
    documents,
    securityEvents,
    setSelectedFile,
    setSelectedDoc,
    setSelectedEvent,
  } = useApp();

  const [searchFocused, setSearchFocused] = useState<boolean>(false);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [profileOpen, setProfileOpen] = useState<boolean>(false);
  const [demoInfoOpen, setDemoInfoOpen] = useState<boolean>(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Page titles and breadcrumbs map
  const pageMetadata: Record<PageTab, { title: string; breadcrumb: string; subtitle: string }> = {
    overview: {
      title: 'Platform Overview',
      breadcrumb: 'Athena / Overview',
      subtitle: 'Centralized posture for storage, intelligence & cloud defense',
    },
    vault: {
      title: 'Athena Vault',
      breadcrumb: 'Athena / Storage & Vault',
      subtitle: 'Encrypted object storage, version history & immutable disaster recovery',
    },
    intellect: {
      title: 'Athena Intellect',
      breadcrumb: 'Athena / Document Intelligence',
      subtitle: 'Automated OCR layout analysis, metadata extraction & contract parsing',
    },
    sentinel: {
      title: 'Athena Sentinel',
      breadcrumb: 'Athena / Security Operations',
      subtitle: 'CloudTrail & EventBridge threat detection, triage & automated runbooks',
    },
    settings: {
      title: 'Platform Settings',
      breadcrumb: 'Athena / Configuration',
      subtitle: 'AWS integration status, alert routing & backend API contracts',
    },
  };

  const currentMeta = pageMetadata[activeTab];

  // Global search quick filter results
  const searchResults = globalSearch.trim()
    ? {
      files: files.filter(
        (f) =>
          f.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
          f.storageClass.toLowerCase().includes(globalSearch.toLowerCase())
      ).slice(0, 3),
      docs: documents.filter(
        (d) =>
          d.title.toLowerCase().includes(globalSearch.toLowerCase()) ||
          d.fileName.toLowerCase().includes(globalSearch.toLowerCase())
      ).slice(0, 3),
      events: securityEvents.filter(
        (e) =>
          e.eventType.toLowerCase().includes(globalSearch.toLowerCase()) ||
          e.summary.toLowerCase().includes(globalSearch.toLowerCase()) ||
          e.principal.toLowerCase().includes(globalSearch.toLowerCase())
      ).slice(0, 3),
    }
    : null;

  const hasSearchResults =
    searchResults &&
    (searchResults.files.length > 0 ||
      searchResults.docs.length > 0 ||
      searchResults.events.length > 0);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile menu toggle + Page Titles */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <span>{currentMeta.breadcrumb}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight truncate">
                {currentMeta.title}
              </h1>
            </div>
          </div>
        </div>

        {/* Center: Global Search Input */}
        <div ref={searchRef} className="relative flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search files, documents, security events... (Ctrl+K)"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              className="w-full pl-9 pr-12 py-1.5 text-xs bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 placeholder:text-slate-400 transition-all"
            />
            {globalSearch && (
              <button
                onClick={() => setGlobalSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Search dropdown results */}
          {searchFocused && globalSearch.trim() && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in-50 zoom-in-95">
              {!hasSearchResults ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No matching files, documents, or alerts found for "{globalSearch}".
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {searchResults.files.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center gap-1.5">
                        <HardDrive className="w-3 h-3 text-indigo-500" />
                        Athena Vault Files
                      </div>
                      <div className="space-y-1 mt-1">
                        {searchResults.files.map((f) => (
                          <div
                            key={f.id}
                            onClick={() => {
                              setSelectedFile(f);
                              setActiveTab('vault');
                              setSearchFocused(false);
                            }}
                            className="p-2 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                          >
                            <span className="font-medium text-slate-800 truncate">{f.name}</span>
                            <span className="text-[10px] text-slate-500">{f.sizeFormatted}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.docs.length > 0 && (
                    <div className="border-t border-slate-100 pt-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center gap-1.5">
                        <FileText className="w-3 h-3 text-emerald-500" />
                        Athena Intellect Documents
                      </div>
                      <div className="space-y-1 mt-1">
                        {searchResults.docs.map((d) => (
                          <div
                            key={d.id}
                            onClick={() => {
                              setSelectedDoc(d);
                              setActiveTab('intellect');
                              setSearchFocused(false);
                            }}
                            className="p-2 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                          >
                            <span className="font-medium text-slate-800 truncate">{d.title}</span>
                            <span className="text-[10px] text-slate-500">{d.pageCount} pages</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.events.length > 0 && (
                    <div className="border-t border-slate-100 pt-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center gap-1.5">
                        <ShieldAlert className="w-3 h-3 text-rose-500" />
                        Sentinel Security Alerts
                      </div>
                      <div className="space-y-1 mt-1">
                        {searchResults.events.map((e) => (
                          <div
                            key={e.id}
                            onClick={() => {
                              setSelectedEvent(e);
                              setActiveTab('sentinel');
                              setSearchFocused(false);
                            }}
                            className="p-2 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${e.severity === 'critical'
                                    ? 'bg-rose-500'
                                    : e.severity === 'high'
                                      ? 'bg-amber-500'
                                      : 'bg-blue-500'
                                  }`}
                              />
                              <span className="font-medium text-slate-800 truncate">{e.eventType}</span>
                            </div>
                            <span className="text-[10px] text-slate-500">{e.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Demo Mode Indicator + Notifications + User Menu */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Prominent Demo Mode Indicator Pill */}
          <div className="relative">
            <button
              onClick={() => setDemoInfoOpen(!demoInfoOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${demoMode
                  ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${demoMode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                  }`}
              />
              <span className="hidden sm:inline">
                {demoMode ? 'DEMO MODE — Sample Data' : activeTab === 'sentinel' && !sentinelIsLive ? 'SENTINEL — Not Connected' : 'LIVE API MODE'}
              </span>
              <span className="sm:hidden">{demoMode ? 'DEMO' : activeTab === 'sentinel' && !sentinelIsLive ? 'OFFLINE' : 'LIVE'}</span>
              <Info className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
            </button>

            {/* Demo mode tooltip explanation modal */}
            {demoInfoOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in-50 zoom-in-95">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                      Sample Data Active
                    </span>
                  </div>
                  <button
                    onClick={() => setDemoInfoOpen(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Athena is currently rendering realistic demonstration data for AWS S3 Vault, Textract OCR, and CloudTrail Sentinel events.
                </p>

                <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 text-[11px] text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Live Backend:</span>
                    <span className="font-medium text-slate-700">In Development</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Endpoint Contracts:</span>
                    <span className="font-semibold text-indigo-600">Documented in /src/services/api.ts</span>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      setDemoMode(!demoMode);
                      setDemoInfoOpen(false);
                    }}
                    className="flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                  >
                    Toggle {demoMode ? 'API Mode' : 'Demo Mode'}
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      setDemoInfoOpen(false);
                    }}
                    className="py-1.5 px-2.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Settings
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in-50 zoom-in-95">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-900 text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No notifications to display.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationRead(n.id);
                          if (n.linkToTab) setActiveTab(n.linkToTab);
                          setNotificationsOpen(false);
                        }}
                        className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3 ${!n.isRead ? 'bg-indigo-50/30' : ''
                          }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${n.type === 'alert'
                              ? 'bg-rose-100 text-rose-600'
                              : n.type === 'vault'
                                ? 'bg-indigo-100 text-indigo-600'
                                : n.type === 'ocr'
                                  ? 'bg-emerald-100 text-emerald-600'
                                  : 'bg-slate-100 text-slate-600'
                            }`}
                        >
                          {n.type === 'alert' ? (
                            <ShieldAlert className="w-4 h-4" />
                          ) : n.type === 'vault' ? (
                            <HardDrive className="w-4 h-4" />
                          ) : n.type === 'ocr' ? (
                            <FileText className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold text-slate-900 truncate">
                              {n.title}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {n.timestamp}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                AM
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-900 leading-tight">
                  Alex Mercer
                </span>
                <span className="text-[10px] text-slate-500 leading-tight">SecOps Lead</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in-50 zoom-in-95">
                <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                  <div className="font-semibold text-xs text-slate-900">Alex Mercer</div>
                  <div className="text-[11px] text-slate-500 truncate">
                    alex.mercer@athenacorp.internal
                  </div>
                  <div className="mt-1.5 inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    Account: 8492-0491-0291
                  </div>
                </div>

                <div className="space-y-0.5">
                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      setProfileOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition-colors"
                  >
                    <Sliders className="w-4 h-4 text-slate-500" />
                    Platform Settings
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('sentinel');
                      setProfileOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition-colors"
                  >
                    <ShieldAlert className="w-4 h-4 text-slate-500" />
                    Security Incident Triage
                  </button>
                </div>

                <div className="border-t border-slate-100 mt-1.5 pt-1.5">
                  <div className="px-3 py-1.5 text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Session Active (Demo Auth)
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
