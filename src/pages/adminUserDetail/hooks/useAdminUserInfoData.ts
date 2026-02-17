import { useCallback, useState } from 'react';
import { adminUsersApi, type UserListItem } from '../../../api/adminUsers';
import { promocodesApi, type PromoGroup } from '../../../api/promocodes';

interface UseAdminUserInfoDataParams {
  userId: number | null;
}

export function useAdminUserInfoData({ userId }: UseAdminUserInfoDataParams) {
  const [referrals, setReferrals] = useState<UserListItem[]>([]);
  const [referralsLoading, setReferralsLoading] = useState(false);
  const [promoGroups, setPromoGroups] = useState<PromoGroup[]>([]);

  const loadReferrals = useCallback(async () => {
    if (!userId) {
      return;
    }

    try {
      setReferralsLoading(true);
      const data = await adminUsersApi.getReferrals(userId, 0, 50);
      setReferrals(data.users);
    } catch {
      // ignore
    } finally {
      setReferralsLoading(false);
    }
  }, [userId]);

  const loadPromoGroups = useCallback(async () => {
    try {
      const data = await promocodesApi.getPromoGroups({ limit: 100 });
      setPromoGroups(data.items);
    } catch {
      // ignore
    }
  }, []);

  return {
    referrals,
    referralsLoading,
    promoGroups,
    loadReferrals,
    loadPromoGroups,
  };
}
