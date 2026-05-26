import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { balanceApi } from '@/api/balance';
import { useToast } from '@/components/Toast';
import { usePlatform } from '@/platform';
import { useAuthStore } from '@/store/auth';
import { showSuccessNotification } from '@/store/successNotification';
import {
  clearPendingTopUpFollowUp,
  isTopUpFollowUpDismissed,
  markTopUpFollowUpReminderShown,
  PENDING_TOP_UP_FOLLOW_UP_EVENT,
  readPendingTopUpFollowUp,
} from '@/utils/topUpFollowUp';

const PAYMENT_REMINDER_DELAY_MS = 12_000;
const PAYMENT_REMINDER_REPEAT_MS = 10 * 60 * 1000;
const FOLLOW_UP_RETRY_DELAYS_MS = [
  1500,
  4000,
  8000,
  PAYMENT_REMINDER_DELAY_MS,
  20_000,
  PAYMENT_REMINDER_DELAY_MS + PAYMENT_REMINDER_REPEAT_MS,
];

export function usePendingTopUpFollowUp() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { openLink, openTelegramLink } = usePlatform();
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const isCheckingRef = useRef(false);
  const retryTimeoutsRef = useRef<number[]>([]);

  const clearScheduledRetries = useCallback(() => {
    retryTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    retryTimeoutsRef.current = [];
  }, []);

  const recoverPendingTopUpFollowUp = useCallback(async () => {
    const pending = readPendingTopUpFollowUp(userId);
    if (!pending) return;
    if (isTopUpFollowUpDismissed(userId)) {
      clearPendingTopUpFollowUp(userId);
      return;
    }
    if (isCheckingRef.current) return;

    isCheckingRef.current = true;
    try {
      const balance = await queryClient.fetchQuery({
        queryKey: ['balance'],
        queryFn: balanceApi.getBalance,
        staleTime: 0,
      });

      const currentBalanceKopeks = Math.max(0, balance.balance_kopeks ?? 0);
      if (currentBalanceKopeks <= pending.balanceBeforeKopeks) {
        const canRemind =
          Boolean(pending.paymentUrl) &&
          Date.now() - pending.createdAt >= PAYMENT_REMINDER_DELAY_MS &&
          (!pending.remindedAt || Date.now() - pending.remindedAt >= PAYMENT_REMINDER_REPEAT_MS);

        if (canRemind && pending.paymentUrl) {
          markTopUpFollowUpReminderShown(userId);
          showToast({
            type: 'warning',
            title: t('balance.pendingReminderTitle', { defaultValue: 'Оплата не завершена' }),
            message: t('balance.pendingReminderMessage', {
              defaultValue: 'Нажмите, чтобы снова открыть страницу оплаты.',
              method: pending.paymentMethodName || '',
            }),
            duration: 9000,
            onClick: () => {
              if (pending.paymentUrl?.includes('t.me/')) {
                openTelegramLink(pending.paymentUrl);
              } else if (pending.paymentUrl) {
                openLink(pending.paymentUrl);
              }
            },
          });
        }
        return;
      }

      clearPendingTopUpFollowUp(userId);
      showSuccessNotification({
        type: 'balance_topup',
        amountKopeks: pending.amountKopeks,
        newBalanceKopeks: currentBalanceKopeks,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['balance'] }),
        queryClient.invalidateQueries({ queryKey: ['purchase-options'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      ]);
      void refreshUser();
    } finally {
      isCheckingRef.current = false;
    }
  }, [openLink, openTelegramLink, queryClient, refreshUser, showToast, t, userId]);

  const scheduleRecoveryBurst = useCallback(() => {
    clearScheduledRetries();
    void recoverPendingTopUpFollowUp();

    if (!readPendingTopUpFollowUp(userId)) {
      return;
    }

    FOLLOW_UP_RETRY_DELAYS_MS.forEach((delay) => {
      const timeoutId = window.setTimeout(() => {
        if (document.visibilityState !== 'visible') {
          return;
        }
        void recoverPendingTopUpFollowUp();
      }, delay);
      retryTimeoutsRef.current.push(timeoutId);
    });
  }, [clearScheduledRetries, recoverPendingTopUpFollowUp, userId]);

  useEffect(() => {
    scheduleRecoveryBurst();

    const handleFocus = () => {
      scheduleRecoveryBurst();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        scheduleRecoveryBurst();
      }
    };

    const handlePageShow = () => {
      scheduleRecoveryBurst();
    };

    const handleOnline = () => {
      scheduleRecoveryBurst();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('online', handleOnline);
    window.addEventListener(PENDING_TOP_UP_FOLLOW_UP_EVENT, scheduleRecoveryBurst);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearScheduledRetries();
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener(PENDING_TOP_UP_FOLLOW_UP_EVENT, scheduleRecoveryBurst);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [clearScheduledRetries, scheduleRecoveryBurst]);
}
