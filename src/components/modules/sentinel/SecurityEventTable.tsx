import React, { useState } from 'react';
import { SecurityEvent, SeverityLevel, EventStatus } from '../../../types';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface SecurityEventTableProps {
  events: SecurityEvent[];
  emptyStateMessage?: string;
  onSelectEvent: (event: SecurityEvent) => void;
}

export const SecurityEventTable: React.FC<SecurityEventTableProps> = ({
  events,
  emptyStateMessage = 'No security events were returned by the Sentinel API.',
  onSelectEvent,
}) => {
  const [search, setSearch] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.eventType.toLowerCase().includes(search.toLowerCase()) ||
      e.summary.toLowerCase().includes(search.toLowerCase()) ||
      e.resourceArn.toLowerCase().includes(search.toLowerCase()) ||
      e.principal.toLowerCase().includes(search.toLowerCase());

    const matchesSeverity = severityFilter === 'all' || e.severity === severityFilter;
    const matchesType = typeFilter === 'all' || e.eventType.startsWith(typeFilter);
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesType && matchesStatus;
  });

  const getSeverityBadge = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> Critical
          </span>
        );
      case 'high':
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> High
          </span>
        );
      case 'medium':
        return (
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
            Medium
          </span>
        );
      case 'low':
        return (
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
            Low
          </span>
        );
    }
  };

  const getStatusBadge = (status: EventStatus) => {
    switch (status) {
      case 'open':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Open
          </span>
        );
      case 'investigating':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" /> Investigating
          </span>
        );
      case 'acknowledged':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Acknowledged
          </span>
        );
      case 'resolved':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Resolved
          </span>
        );
    }
  };

  return (
    <div className="bg-[#172033] rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
      {/* Search and Filters */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search alerts by event type, resource ARN, principal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#0F172A] border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 text-slate-100 placeholder:text-slate-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-[#0F172A] px-2.5 py-1.5 rounded-lg border border-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] text-slate-400">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#0F172A] text-slate-200">All Severities</option>
              <option value="critical" className="bg-[#0F172A] text-slate-200">Critical</option>
              <option value="high" className="bg-[#0F172A] text-slate-200">High</option>
              <option value="medium" className="bg-[#0F172A] text-slate-200">Medium</option>
              <option value="low" className="bg-[#0F172A] text-slate-200">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-[#0F172A] px-2.5 py-1.5 rounded-lg border border-slate-700">
            <span className="text-[11px] text-slate-400">Category:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#0F172A] text-slate-200">All Categories</option>
              <option value="IAM" className="bg-[#0F172A] text-slate-200">IAM Security</option>
              <option value="S3" className="bg-[#0F172A] text-slate-200">S3 Data Protection</option>
              <option value="KMS" className="bg-[#0F172A] text-slate-200">KMS Cryptography</option>
              <option value="CloudTrail" className="bg-[#0F172A] text-slate-200">Audit Integrity</option>
              <option value="EC2" className="bg-[#0F172A] text-slate-200">Network Ingress</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-[#0F172A] px-2.5 py-1.5 rounded-lg border border-slate-700">
            <span className="text-[11px] text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#0F172A] text-slate-200">All Statuses</option>
              <option value="open" className="bg-[#0F172A] text-slate-200">Open</option>
              <option value="investigating" className="bg-[#0F172A] text-slate-200">Investigating</option>
              <option value="acknowledged" className="bg-[#0F172A] text-slate-200">Acknowledged</option>
              <option value="resolved" className="bg-[#0F172A] text-slate-200">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0F172A] border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Event Type & Summary</th>
              <th className="py-3 px-4">Source / Service</th>
              <th className="py-3 px-4">Target Resource</th>
              <th className="py-3 px-4">Timestamp (UTC)</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 font-normal">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  {events.length > 0 ? 'No security findings matched the search criteria.' : emptyStateMessage}
                </td>
              </tr>
            ) : (
              filteredEvents.map((evt) => (
                <tr
                  key={evt.id}
                  onClick={() => onSelectEvent(evt)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                >
                  <td className="py-3 px-4 whitespace-nowrap">
                    {getSeverityBadge(evt.severity)}
                  </td>

                  <td className="py-3 px-4">
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-100 group-hover:text-rose-400 block truncate max-w-xs transition-colors">
                        {evt.eventType}
                      </span>
                      <span className="text-[11px] text-slate-400 line-clamp-1 block">
                        {evt.summary}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-300">
                    {evt.source}
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className="font-mono text-[11px] text-slate-300 truncate block max-w-xs"
                      title={evt.resourceArn}
                    >
                      {evt.resourceArn.split(':').slice(-1)[0] || evt.resourceArn}
                    </span>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                    {evt.timestamp.split(' ')[0]} {evt.timestamp.split(' ')[1]}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    {getStatusBadge(evt.status)}
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(evt);
                      }}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors inline-flex items-center gap-1"
                    >
                      Investigate <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-3 sm:px-5 bg-[#0F172A] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span>
          Showing <strong className="text-slate-200">{filteredEvents.length}</strong> of{' '}
          <strong className="text-slate-200">{events.length}</strong> security events
        </span>
        <span className="text-[11px] text-slate-400">Sentinel security events</span>
      </div>
    </div>
  );
};
