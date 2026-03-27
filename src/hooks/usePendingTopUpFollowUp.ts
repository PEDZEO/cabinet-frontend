import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { balanceApi } from '@/api/balance';
import { useAuthStore } from '@/store/auth';
import { showSuccessNotification } from '@/store/successNotification';
import {
  clearPendingTopUpFollowUp,
  isTopUpFollowUpDismissed,
  readPendingTopUpFollowUp,
} from '@/utils/topUpFollowUp';

const FOLLOW_UP_RETRY_DELAYS_MS = [1500, 4000, 8000];

export function usePendingTopUpFollowUp() {
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
      if (currentBalanceKopeks <= pending.balanceBeforeKopeks) return;

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
  }, [queryClient, refreshUser, userId]);

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
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearScheduledRetries();
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [clearScheduledRetries, scheduleRecoveryBurst]);
}
