import { useCallback, useEffect, useState } from 'react';
import {
  adminUsersApi,
  type PanelSyncStatusResponse,
  type UserDetailResponse,
} from '../../../api/adminUsers';

interface UseAdminUserCoreDataParams {
  userId: number | null;
  navigateToUsers: () => void;
}

export function useAdminUserCoreData({ userId, navigateToUsers }: UseAdminUserCoreDataParams) {
  const [user, setUser] = useState<UserDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<PanelSyncStatusResponse | null>(null);

  const loadUser = useCallback(async () => {
    if (!userId) {
      return;
    }

    try {
      setLoading(true);
      const data = await adminUsersApi.getUser(userId);
      setUser(data);
    } catch (error) {
      console.error('Failed to load user:', error);
      navigateToUsers();
    } finally {
      setLoading(false);
    }
  }, [navigateToUsers, userId]);

  const loadSyncStatus = useCallback(async () => {
    if (!userId) {
      return;
    }

    try {
      const data = await adminUsersApi.getSyncStatus(userId);
      setSyncStatus(data);
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId || Number.isNaN(userId)) {
      navigateToUsers();
      return;
    }
    loadUser();
  }, [loadUser, navigateToUsers, userId]);

  return {
    user,
    loading,
    syncStatus,
    loadUser,
    loadSyncStatus,
  };
}
