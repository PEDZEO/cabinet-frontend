import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import {
  dismissTopUpFollowUp,
  PENDING_TOP_UP_FOLLOW_UP_EVENT,
  readPendingTopUpFollowUp,
  type PendingTopUpFollowUp,
} from '@/utils/topUpFollowUp';

export function usePendingTopUpFollowUpState() {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const [pendingTopUp, setPendingTopUp] = useState<PendingTopUpFollowUp | null>(() =>
    readPendingTopUpFollowUp(userId),
  );

  const refreshPendingTopUp = useCallback(() => {
    setPendingTopUp(readPendingTopUpFollowUp(userId));
  }, [userId]);

  const dismissPendingTopUp = useCallback(() => {
    dismissTopUpFollowUp(userId);
    refreshPendingTopUp();
  }, [refreshPendingTopUp, userId]);

  useEffect(() => {
    refreshPendingTopUp();

    window.addEventListener(PENDING_TOP_UP_FOLLOW_UP_EVENT, refreshPendingTopUp);
    window.addEventListener('focus', refreshPendingTopUp);
    window.addEventListener('storage', refreshPendingTopUp);
    return () => {
      window.removeEventListener(PENDING_TOP_UP_FOLLOW_UP_EVENT, refreshPendingTopUp);
      window.removeEventListener('focus', refreshPendingTopUp);
      window.removeEventListener('storage', refreshPendingTopUp);
    };
  }, [refreshPendingTopUp]);

  return {
    pendingTopUp,
    dismissPendingTopUp,
    refreshPendingTopUp,
  };
}
