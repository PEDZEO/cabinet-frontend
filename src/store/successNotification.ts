import { useEffect, useRef } from 'react';
import { create } from 'zustand';

export type SuccessNotificationType =
  | 'balance_topup'
  | 'subscription_activated'
  | 'subscription_renewed'
  | 'subscription_purchased'
  | 'devices_purchased'
  | 'traffic_purchased';

export interface SuccessNotificationData {
  type: SuccessNotificationType;
  /** Amount in kopeks (for balance or subscription price) */
  amountKopeks?: number;
  /** New balance in kopeks */
  newBalanceKopeks?: number;
  /** Subscription expiry date ISO string */
  expiresAt?: string;
  /** Tariff name */
  tariffName?: string;
  /** Custom title override */
  title?: string;
  /** Custom message override */
  message?: string;
  /** Number of devices added */
  devicesAdded?: number;
  /** New total device limit */
  newDeviceLimit?: number;
  /** Traffic GB added */
  trafficGbAdded?: number;
  /** New total traffic limit in GB */
  newTrafficLimitGb?: number;
}

const RECENT_NOTIFICATION_TTL_MS = 4000;

const getNotificationFingerprint = (data: SuccessNotificationData): string =>
  JSON.stringify({
    type: data.type.startsWith('subscription_') ? 'subscription' : data.type,
    amountKopeks: data.amountKopeks ?? null,
    newBalanceKopeks: data.newBalanceKopeks ?? null,
    expiresAt: data.expiresAt ?? null,
    tariffName: data.tariffName ?? null,
    devicesAdded: data.devicesAdded ?? null,
    newDeviceLimit: data.newDeviceLimit ?? null,
    trafficGbAdded: data.trafficGbAdded ?? null,
    newTrafficLimitGb: data.newTrafficLimitGb ?? null,
    title: data.title ?? null,
    message: data.message ?? null,
  });

let lastNotificationFingerprint: string | null = null;
let lastNotificationAt = 0;

interface SuccessNotificationState {
  isOpen: boolean;
  data: SuccessNotificationData | null;
  /** Signal that increments when other modals should close */
  closeOthersSignal: number;

  show: (data: SuccessNotificationData) => void;
  hide: () => void;
}

export const useSuccessNotification = create<SuccessNotificationState>((set) => ({
  isOpen: false,
  data: null,
  closeOthersSignal: 0,

  show: (data) =>
    set((state) => ({
      isOpen: true,
      data,
      // Increment signal to tell other modals to close
      closeOthersSignal: state.closeOthersSignal + 1,
    })),
  hide: () => set({ isOpen: false, data: null }),
}));

export function showSuccessNotification(
  data: SuccessNotificationData,
  options?: { dedupeMs?: number },
) {
  const dedupeMs = options?.dedupeMs ?? RECENT_NOTIFICATION_TTL_MS;
  const fingerprint = getNotificationFingerprint(data);
  const now = Date.now();

  if (fingerprint === lastNotificationFingerprint && now - lastNotificationAt < dedupeMs) {
    return false;
  }

  lastNotificationFingerprint = fingerprint;
  lastNotificationAt = now;
  useSuccessNotification.getState().show(data);
  return true;
}

/**
 * Hook that calls onClose when a success notification appears.
 * Use this in modals that should auto-close on success events.
 */
export function useCloseOnSuccessNotification(onClose: () => void) {
  const closeOthersSignal = useSuccessNotification((state) => state.closeOthersSignal);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Remember the signal value at mount time so we only react to NEW signals
  const mountedSignalRef = useRef(closeOthersSignal);

  useEffect(() => {
    if (closeOthersSignal !== mountedSignalRef.current) {
      onCloseRef.current();
    }
  }, [closeOthersSignal]);
}
