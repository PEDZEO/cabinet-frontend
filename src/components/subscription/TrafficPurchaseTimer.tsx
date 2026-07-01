import { useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

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

function getCompactDurationLabel(state: ReturnType<typeof getTimerState>, t: TFunction) {
  if (state.isExpired) {
    return t('subscription.trafficTimerExpired', { defaultValue: 'Traffic expired' });
  }

  if (state.days > 0) {
    return `${state.days} ${t('subscription.daysShort')} ${state.hours} ${t('subscription.hours')}`;
  }

  if (state.hours > 0) {
    return `${state.hours} ${t('subscription.hours')} ${String(state.minutes).padStart(2, '0')} ${t('subscription.minutes')}`;
  }

  return `${Math.max(1, state.minutes)} ${t('subscription.minutes')}`;
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
  const [expanded, setExpanded] = useState(false);

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
  const compactDurationLabel = getCompactDurationLabel(state, t);
  const toggleLabel = expanded
    ? t('subscription.trafficTimerCollapse', { defaultValue: 'Hide' })
    : t('subscription.trafficTimerDetails', { defaultValue: 'Details' });
  const statusLabel = state.isExpired
    ? t('subscription.trafficTimerExpired', { defaultValue: 'Traffic expired' })
    : t('subscription.trafficTimerExpiresIn', { defaultValue: 'Expires in' });
  const unitClassName =
    variant === 'ultima'
      ? 'rounded-[14px] border border-white/[0.08] bg-black/[0.16] px-2.5 py-2'
      : 'rounded-[10px] border border-white/[0.08] bg-white/[0.035] px-2.5 py-2';
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setExpanded((value) => !value);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onClick={() => setExpanded((value) => !value)}
      onKeyDown={handleKeyDown}
      className={cn(
        'group cursor-pointer select-none overflow-hidden rounded-[20px] border p-3.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-[border-color,background-color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 active:scale-[0.99]',
        variant === 'ultima'
          ? 'border-white/10 bg-[linear-gradient(135deg,rgba(44,230,174,0.13),rgba(255,255,255,0.045)_46%,rgba(0,0,0,0.1))] text-white hover:border-white/[0.18] hover:shadow-[0_14px_36px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.08)]'
          : 'border-white/10 bg-white/[0.04] text-dark-50 hover:border-white/[0.16]',
        className,
      )}
      style={surfaceStyle}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border"
            style={{
              borderColor: `${toneColor}38`,
              background: `linear-gradient(145deg, ${toneColor}24, ${toneColor}0d)`,
              color: toneColor,
              boxShadow: `0 0 24px ${toneColor}1f`,
            }}
            aria-hidden
          >
            <span
              className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
              style={{ background: toneColor }}
            />
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
            <p className="truncate text-[14px] font-semibold leading-tight">
              +{purchase.traffic_gb} {t('common.units.gb')}
            </p>
            <p className="mt-1 truncate text-[11px] leading-tight opacity-[0.58]">{statusLabel}</p>
            {!expanded && expiresAtLabel ? (
              <p className="mt-1 truncate text-[10px] leading-tight opacity-40">{expiresAtLabel}</p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div
            className="max-w-[128px] truncate rounded-full border px-3 py-1.5 text-[11px] font-semibold leading-none"
            style={{
              borderColor: `${toneColor}24`,
              background: `${toneColor}14`,
              color: toneColor,
            }}
            title={compactDurationLabel}
          >
            {compactDurationLabel}
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[10px] font-medium leading-none opacity-70 transition-opacity group-hover:opacity-90">
            {toggleLabel}
            <span
              className={cn(
                'flex h-4 w-4 items-center justify-center transition-transform duration-200',
                expanded && 'rotate-180',
              )}
              aria-hidden
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                <path
                  d="m6 9 6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </span>
        </div>
      </div>

      {expanded ? (
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
      ) : null}

      <div
        className={cn(
          'mt-3',
          !expanded && 'rounded-[14px] border border-white/[0.06] bg-black/[0.06] p-2.5',
        )}
      >
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
        {expanded ? (
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
        ) : null}
      </div>
    </div>
  );
}
