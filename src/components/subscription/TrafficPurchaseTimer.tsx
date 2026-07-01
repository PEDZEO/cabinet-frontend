import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import type { TrafficPurchase } from '@/types';

type TrafficPurchaseTimerProps = {
  purchase: TrafficPurchase;
  variant?: 'classic' | 'ultima';
  accentColor?: string;
  trackColor?: string;
  surfaceStyle?: CSSProperties;
  className?: string;
};

const minuteMs = 60_000;
const hourMs = 60 * minuteMs;
const dayMs = 24 * hourMs;

function getTimerState(purchase: TrafficPurchase, nowMs: number) {
  const createdMs = new Date(purchase.created_at).getTime();
  const expiresMs = new Date(purchase.expires_at).getTime();
  const validCreatedMs = Number.isFinite(createdMs) ? createdMs : nowMs;
  const validExpiresMs = Number.isFinite(expiresMs) ? expiresMs : nowMs;
  const totalMs = Math.max(1, validExpiresMs - validCreatedMs);
  const remainingMs = Math.max(0, validExpiresMs - nowMs);
  const elapsedMs = Math.min(totalMs, Math.max(0, nowMs - validCreatedMs));
  const remainingPercent = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));
  const elapsedPercent = Math.max(0, Math.min(100, (elapsedMs / totalMs) * 100));

  return {
    expiresMs: validExpiresMs,
    remainingMs,
    remainingPercent,
    elapsedPercent,
    days: Math.floor(remainingMs / dayMs),
    hours: Math.floor((remainingMs % dayMs) / hourMs),
    minutes: Math.floor((remainingMs % hourMs) / minuteMs),
    isExpired: remainingMs <= 0,
    isUrgent: remainingMs > 0 && remainingMs <= dayMs,
    isWarning: remainingMs > dayMs && remainingMs <= 3 * dayMs,
  };
}

export function TrafficPurchaseTimer({
  purchase,
  variant = 'classic',
  accentColor = '#2CE6AE',
  trackColor = 'rgba(255,255,255,0.12)',
  surfaceStyle,
  className,
}: TrafficPurchaseTimerProps) {
  const { t, i18n } = useTranslation();
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const state = getTimerState(purchase, nowMs);
  const expiresAtLabel = useMemo(() => {
    if (!Number.isFinite(state.expiresMs)) return '';
    return new Intl.DateTimeFormat(i18n.language || undefined, {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(state.expiresMs));
  }, [i18n.language, state.expiresMs]);
  const createdAtLabel = useMemo(() => {
    const createdMs = new Date(purchase.created_at).getTime();
    if (!Number.isFinite(createdMs)) return '';
    return new Intl.DateTimeFormat(i18n.language || undefined, {
      day: '2-digit',
      month: 'short',
    }).format(new Date(createdMs));
  }, [i18n.language, purchase.created_at]);

  const toneColor = state.isExpired ? '#FF6B35' : state.isUrgent ? '#FBBF24' : accentColor;
  const unitClassName =
    variant === 'ultima'
      ? 'rounded-[14px] border border-white/[0.08] bg-black/[0.16] px-2.5 py-2'
      : 'rounded-[10px] border border-white/[0.08] bg-white/[0.035] px-2.5 py-2';

  return (
    <div
      className={cn(
        'overflow-hidden rounded-[18px] border p-3',
        variant === 'ultima'
          ? 'border-white/10 bg-black/10 text-white'
          : 'border-white/10 text-dark-50',
        className,
      )}
      style={surfaceStyle}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] border"
              style={{
                borderColor: `${toneColor}33`,
                background: `${toneColor}16`,
                color: toneColor,
              }}
              aria-hidden
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path
                  d="M7 16a4 4 0 0 1-.88-7.9A5 5 0 0 1 16 6a5 5 0 0 1 1 9.9M12 10v8M9 13l3-3 3 3"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold leading-tight">
                +{purchase.traffic_gb} {t('common.units.gb')}
              </p>
              <p className="mt-0.5 text-[11px] leading-tight opacity-60">
                {state.isExpired
                  ? t('subscription.trafficTimerExpired', { defaultValue: 'Traffic expired' })
                  : t('subscription.trafficTimerExpiresIn', { defaultValue: 'Expires in' })}
              </p>
            </div>
          </div>
        </div>
        {expiresAtLabel ? (
          <div className="shrink-0 rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium opacity-70">
            {expiresAtLabel}
          </div>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {[
          { value: state.days, label: t('subscription.daysShort') },
          { value: state.hours, label: t('subscription.hours') },
          { value: state.minutes, label: t('subscription.minutes') },
        ].map((part) => (
          <div key={part.label} className={unitClassName}>
            <div className="text-[18px] font-semibold leading-none" style={{ color: toneColor }}>
              {String(part.value).padStart(2, '0')}
            </div>
            <div className="mt-1 text-[10px] uppercase leading-none tracking-[0.12em] opacity-45">
              {part.label}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-[10px] opacity-50">
          <span>
            {t('subscription.trafficTimerRemaining', { defaultValue: 'Remaining lifetime' })}
          </span>
          <span>{Math.round(state.remainingPercent)}%</span>
        </div>
        <div
          className="mt-1.5 h-1.5 overflow-hidden rounded-full"
          style={{ background: trackColor }}
        >
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${state.remainingPercent}%`,
              background: `linear-gradient(90deg, ${toneColor}, ${toneColor}99)`,
            }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[9px] opacity-35">
          <span>{createdAtLabel}</span>
          <span>
            {t('subscription.trafficTimerUsed', {
              percent: Math.round(state.elapsedPercent),
              defaultValue: '{{percent}}% used',
            })}
          </span>
          <span>{expiresAtLabel}</span>
        </div>
      </div>
    </div>
  );
}
