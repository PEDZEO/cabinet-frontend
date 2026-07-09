import { useCallback, useMemo } from 'react';
import type { UserNodeUsageResponse } from '../../../api/adminUsers';
import { buildNodeUsageForPeriod } from '../utils/nodeUsage';
import { formatDateTime } from '../utils/formatters';
import { copyToClipboard as copyTextToClipboard } from '@/utils/clipboard';

interface NotifyLike {
  success: (message: string, title?: string) => void;
}

interface UseAdminUserViewHelpersParams {
  locale: string;
  nodeUsage: UserNodeUsageResponse | null;
  nodeUsageDays: number;
  notify: NotifyLike;
  t: (key: string) => string;
  navigate: (path: string) => void;
}

export function useAdminUserViewHelpers({
  locale,
  nodeUsage,
  nodeUsageDays,
  notify,
  t,
  navigate,
}: UseAdminUserViewHelpersParams) {
  const formatDate = useCallback((date: string | null) => formatDateTime(date, locale), [locale]);

  const nodeUsageForPeriod = useMemo(
    () => buildNodeUsageForPeriod(nodeUsage, nodeUsageDays),
    [nodeUsage, nodeUsageDays],
  );

  const copyToClipboard = useCallback(
    async (text: string) => {
      try {
        await copyTextToClipboard(text);
        notify.success(t('admin.users.detail.copied'));
      } catch {
        // ignore
      }
    },
    [notify, t],
  );

  const openAdminUser = useCallback(
    (targetUserId: number) => {
      navigate(`/admin/users/${targetUserId}`);
    },
    [navigate],
  );

  return {
    formatDate,
    nodeUsageForPeriod,
    copyToClipboard,
    openAdminUser,
  };
}
