import type { TFunction } from 'i18next';
import type { PeriodOption } from '@/types';

export type PurchaseStep = 'period' | 'traffic' | 'servers' | 'devices' | 'confirm';

export const getAvailableServersForPeriod = (
  period: PeriodOption | null,
  isTrialSubscription: boolean,
) => {
  if (!period?.servers.options) return [];
  return period.servers.options.filter((server) => {
    if (!server.is_available) return false;
    if (isTrialSubscription && server.name.toLowerCase().includes('trial')) return false;
    return true;
  });
};

export const buildPurchaseSteps = (
  selectedPeriod: PeriodOption | null,
  availableServersCount: number,
): PurchaseStep[] => {
  const result: PurchaseStep[] = ['period'];
  if (selectedPeriod?.traffic.selectable && (selectedPeriod.traffic.options?.length ?? 0) > 0) {
    result.push('traffic');
  }
  if (availableServersCount > 1) {
    result.push('servers');
  }
  if (selectedPeriod && selectedPeriod.devices.max > selectedPeriod.devices.min) {
    result.push('devices');
  }
  result.push('confirm');
  return result;
};

export const getStepLabel = (t: TFunction, step: PurchaseStep): string => {
  switch (step) {
    case 'period':
      return t('subscription.stepPeriod');
    case 'traffic':
      return t('subscription.stepTraffic');
    case 'servers':
      return t('subscription.stepServers');
    case 'devices':
      return t('subscription.stepDevices');
    case 'confirm':
      return t('subscription.stepConfirm');
  }
};

export const getTrafficColor = (percent: number): string => {
  if (percent > 90) return 'bg-error-500';
  if (percent > 70) return 'bg-warning-500';
  return 'bg-success-500';
};
