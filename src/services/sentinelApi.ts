import { SecurityEvent, SeverityLevel, EventStatus } from '../types';
import { SentinelAuth } from './sentinelAuth';

const API_BASE = (import.meta.env.VITE_SENTINEL_API_BASE_URL || 'https://4so1d2xc4k.execute-api.ap-south-1.amazonaws.com').replace(/\/+$/, '');
type RawEvent = Record<string, any>;

const stringOr = (value: unknown, fallback = 'Unknown') => typeof value === 'string' && value.trim() ? value : fallback;
const mapStatus = (value: unknown): EventStatus => {
  switch (String(value || '').toLowerCase()) {
    case 'acknowledged': return 'acknowledged';
    case 'investigating': return 'investigating';
    case 'resolved': return 'resolved';
    default: return 'open';
  }
};
const mapSeverity = (value: unknown): SeverityLevel => {
  const v = String(value || '').toLowerCase();
  return v === 'critical' || v === 'high' || v === 'medium' || v === 'low' ? v : 'low';
};

export function mapSentinelEvent(raw: RawEvent): SecurityEvent {
  const identity = raw.userIdentity && typeof raw.userIdentity === 'object' ? raw.userIdentity : {};
  const id = stringOr(raw.eventId, 'unknown-event');
  const eventType = stringOr(raw.eventName, stringOr(raw.detailType, stringOr(raw.eventType, 'Security event')));
  const severityValue = String(raw.severity || '').toLowerCase();
  const severityKnown = ['critical', 'high', 'medium', 'low'].includes(severityValue);
  return {
    id,
    timestamp: stringOr(raw.time, 'Unknown time').replace('T', ' ').replace(/Z$/, ' UTC'),
    severity: mapSeverity(raw.severity),
    eventType,
    source: stringOr(raw.eventSource, stringOr(raw.source, 'Unknown source')),
    resourceArn: 'Unknown resource',
    principal: stringOr(identity.arn, stringOr(identity.principalId, stringOr(identity.userName, 'Unknown identity'))),
    status: mapStatus(raw.status),
    awsRegion: stringOr(raw.region),
    sourceIp: stringOr(raw.sourceIPAddress),
    userAgent: stringOr(raw.userAgent),
    summary: `${eventType} from ${stringOr(raw.eventSource, stringOr(raw.source, 'unknown source'))}${severityKnown ? '' : ' (severity not supplied; displayed as low)'}`,
    mitreTactic: 'Unknown',
    investigationSteps: [],
    rawPayloadSnippet: raw,
  };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await SentinelAuth.getAccessToken();
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` } });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) SentinelAuth.clearSession();
    const body = await response.text().catch(() => '');
    throw new Error(`Sentinel API returned ${response.status}${body ? `: ${body}` : ''}`);
  }
  return response.json() as Promise<T>;
}

export const SentinelApi = {
  async list(): Promise<SecurityEvent[]> {
    const data = await request<{ events?: RawEvent[] }>('/api/sentinel/events');
    if (!data || !Array.isArray(data.events)) throw new Error('Sentinel API response was missing its events list.');
    return data.events.map(mapSentinelEvent);
  },
  async get(eventId: string): Promise<SecurityEvent> {
    const data = await request<{ event: RawEvent }>(`/api/sentinel/events/${encodeURIComponent(eventId)}`);
    if (!data?.event || typeof data.event !== 'object' || Array.isArray(data.event)) throw new Error('Sentinel API response was missing event details.');
    return mapSentinelEvent(data.event);
  },
  async action(eventId: string, action: 'acknowledge' | 'investigate' | 'resolve'): Promise<SecurityEvent> {
    const data = await request<{ event: RawEvent }>(`/api/sentinel/events/${encodeURIComponent(eventId)}/${action}`, { method: 'POST' });
    if (!data?.event || typeof data.event !== 'object' || Array.isArray(data.event)) throw new Error('Sentinel API response was missing the updated event.');
    return mapSentinelEvent(data.event);
  },
};
