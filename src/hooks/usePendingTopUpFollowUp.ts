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

export function usePendingTopUpFollowUp() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const isCheckingRef = useRef(false);

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
        queryClient.invalidateQueries({ queryKey: ['purchase-options'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      ]);
      void refreshUser();
    } finally {
      isCheckingRef.current = false;
    }
  }, [queryClient, refreshUser, userId]);

  useEffect(() => {
    void recoverPendingTopUpFollowUp();

    const handleFocus = () => {
      void recoverPendingTopUpFollowUp();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void recoverPendingTopUpFollowUp();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [recoverPendingTopUpFollowUp]);
}
