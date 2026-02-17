import type { UserTrafficItem } from '../../../api/adminTraffic';

export const bytesToGbPerDay = (bytes: number, days: number): number =>
  days > 0 ? bytes / days / 1024 ** 3 : 0;

export const getRatio = (gbPerDay: number, threshold: number): number =>
  threshold > 0 ? gbPerDay / threshold : 0;

export const getRowBgColor = (ratio: number): string | undefined => {
  if (ratio <= 0) return undefined;
  const clamped = Math.min(ratio, 1.5);
  const hue = 120 - Math.min(clamped, 1) * 120;
  const opacity = clamped <= 1 ? 0.06 + clamped * 0.07 : 0.13 + (clamped - 1) * 0.14;
  return `hsla(${hue}, 70%, 45%, ${opacity})`;
};

export const getNodeTextColor = (ratio: number): string => {
  const clamped = Math.min(Math.max(ratio, 0), 1.5);
  let hue: number;
  if (clamped <= 0.7) {
    hue = 210 - (clamped / 0.7) * 180;
  } else {
    hue = Math.max(0, 30 - ((clamped - 0.7) / 0.8) * 30);
  }
  const saturation = 70 + clamped * 15;
  const lightness = 65 - clamped * 10;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export const getRiskLevel = (ratio: number): RiskLevel => {
  if (ratio < 0.5) return 'low';
  if (ratio < 0.8) return 'medium';
  if (ratio < 1.2) return 'high';
  return 'critical';
};

export interface RiskResult {
  ratio: number;
  gbPerDay: number;
  totalRatio: number;
  maxNodeRatio: number;
}

export const getCompositeRisk = (
  row: UserTrafficItem,
  totalThreshold: number,
  nodeThreshold: number,
  days: number,
): RiskResult => {
  const dailyTotal = bytesToGbPerDay(row.total_bytes, days);
  const totalR = totalThreshold > 0 ? getRatio(dailyTotal, totalThreshold) : 0;

  let maxNodeR = 0;
  let worstNodeGbPerDay = 0;
  if (nodeThreshold > 0) {
    for (const bytes of Object.values(row.node_traffic)) {
      const daily = bytesToGbPerDay(bytes || 0, days);
      const ratio = getRatio(daily, nodeThreshold);
      if (ratio > maxNodeR) {
        maxNodeR = ratio;
        worstNodeGbPerDay = daily;
      }
    }
  }

  const ratio = Math.max(totalR, maxNodeR);
  const gbPerDay = totalR >= maxNodeR ? dailyTotal : worstNodeGbPerDay;

  return { ratio, gbPerDay, totalRatio: totalR, maxNodeRatio: maxNodeR };
};

export const RISK_STYLES: Record<
  RiskLevel,
  { dot: string; text: string; bar: string; bg: string }
> = {
  low: {
    dot: 'bg-success-400',
    text: 'text-success-400',
    bar: 'bg-success-400',
    bg: 'bg-success-400/10',
  },
  medium: {
    dot: 'bg-warning-400',
    text: 'text-warning-400',
    bar: 'bg-warning-400',
    bg: 'bg-warning-400/10',
  },
  high: {
    dot: 'bg-orange-400',
    text: 'text-orange-400',
    bar: 'bg-orange-400',
    bg: 'bg-orange-400/10',
  },
  critical: {
    dot: 'bg-error-400 animate-pulse',
    text: 'text-error-400',
    bar: 'bg-error-400',
    bg: 'bg-error-400/10',
  },
};
