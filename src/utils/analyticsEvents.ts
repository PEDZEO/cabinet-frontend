import type { AnalyticsCounters } from '@/api/branding';

type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;
type QueuedAnalyticsCall = {
  type: 'event' | 'conversion';
  eventName: string;
  params: AnalyticsParams;
  createdAt: number;
};

declare global {
  interface Window {
    ym?: (
      counterId: number | string,
      method: string,
      goal: string,
      params?: AnalyticsParams,
    ) => void;
    gtag?: (command: string, eventName: string, params?: AnalyticsParams) => void;
    __cabinetAnalyticsCounters?: AnalyticsCounters | null;
  }
}

const EVENT_CATEGORY = 'ultima';
const MAX_QUEUED_CALLS = 50;
const MAX_QUEUE_AGE_MS = 30_000;

let analyticsCountersReady = false;
let queuedAnalyticsCalls: QueuedAnalyticsCall[] = [];

const getWindow = (): Window | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return window;
};

const normalizeCounterId = (counterId: string) => {
  const numericCounterId = Number(counterId);
  return Number.isFinite(numericCounterId) ? numericCounterId : counterId;
};

const queueAnalyticsCall = (call: Omit<QueuedAnalyticsCall, 'createdAt'>) => {
  queuedAnalyticsCalls = [
    ...queuedAnalyticsCalls.slice(Math.max(0, queuedAnalyticsCalls.length - MAX_QUEUED_CALLS + 1)),
    {
      ...call,
      params: { ...call.params },
      createdAt: Date.now(),
    },
  ];
};

const getCounters = () => getWindow()?.__cabinetAnalyticsCounters ?? null;

const dispatchAnalyticsEvent = (eventName: string, params: AnalyticsParams = {}) => {
  const currentWindow = getWindow();
  if (!currentWindow) return;

  const counters = getCounters();
  const yandexId = counters?.yandex_metrika_id?.trim();
  const googleAdsId = counters?.google_ads_id?.trim();

  if (yandexId && typeof currentWindow.ym === 'function') {
    try {
      currentWindow.ym(normalizeCounterId(yandexId), 'reachGoal', eventName, {
        category: EVENT_CATEGORY,
        ...params,
      });
    } catch {
      // Analytics must never block navigation, payment, or support actions.
    }
  }

  if (googleAdsId && typeof currentWindow.gtag === 'function') {
    try {
      currentWindow.gtag('event', eventName, {
        event_category: EVENT_CATEGORY,
        ...params,
      });
    } catch {
      // Analytics must never block navigation, payment, or support actions.
    }
  }
};

const dispatchAnalyticsConversion = (eventName: string, params: AnalyticsParams = {}) => {
  dispatchAnalyticsEvent(eventName, params);

  const currentWindow = getWindow();
  if (!currentWindow) return;

  const counters = getCounters();
  const googleAdsId = counters?.google_ads_id?.trim();
  const googleAdsLabel = counters?.google_ads_label?.trim();

  if (googleAdsId && googleAdsLabel && typeof currentWindow.gtag === 'function') {
    try {
      currentWindow.gtag('event', 'conversion', {
        send_to: `${googleAdsId}/${googleAdsLabel}`,
        event_category: EVENT_CATEGORY,
        event_label: eventName,
        ...params,
      });
    } catch {
      // Analytics must never block navigation, payment, or support actions.
    }
  }
};

const flushQueuedAnalyticsCalls = () => {
  if (!analyticsCountersReady || !queuedAnalyticsCalls.length) {
    return;
  }

  const now = Date.now();
  const callsToFlush = queuedAnalyticsCalls.filter(
    (call) => now - call.createdAt <= MAX_QUEUE_AGE_MS,
  );
  queuedAnalyticsCalls = [];

  callsToFlush.forEach((call) => {
    if (call.type === 'conversion') {
      dispatchAnalyticsConversion(call.eventName, call.params);
      return;
    }
    dispatchAnalyticsEvent(call.eventName, call.params);
  });
};

export const setAnalyticsCountersForEvents = (counters: AnalyticsCounters | null | undefined) => {
  const currentWindow = getWindow();
  if (!currentWindow) return;

  analyticsCountersReady = true;
  currentWindow.__cabinetAnalyticsCounters = counters ?? null;
  flushQueuedAnalyticsCalls();
  currentWindow.setTimeout(flushQueuedAnalyticsCalls, 250);
};

export const trackAnalyticsEvent = (eventName: string, params: AnalyticsParams = {}) => {
  if (!getWindow()) {
    return;
  }

  if (!analyticsCountersReady) {
    queueAnalyticsCall({ type: 'event', eventName, params });
    return;
  }

  dispatchAnalyticsEvent(eventName, params);
};

export const trackAnalyticsConversion = (eventName: string, params: AnalyticsParams = {}) => {
  if (!getWindow()) {
    return;
  }

  if (!analyticsCountersReady) {
    queueAnalyticsCall({ type: 'conversion', eventName, params });
    return;
  }

  dispatchAnalyticsConversion(eventName, params);
};
