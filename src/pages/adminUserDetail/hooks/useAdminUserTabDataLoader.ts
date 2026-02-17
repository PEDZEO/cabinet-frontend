import { useEffect } from 'react';

type AdminUserDetailTab = 'info' | 'subscription' | 'balance' | 'sync' | 'tickets';

interface UseAdminUserTabDataLoaderParams {
  activeTab: AdminUserDetailTab;
  loadReferrals: () => Promise<void>;
  loadPromoGroups: () => Promise<void>;
  loadSyncStatus: () => Promise<void>;
  loadTariffs: () => Promise<void>;
  loadSubscriptionData: () => Promise<void>;
  loadTickets: () => Promise<void>;
}

export function useAdminUserTabDataLoader({
  activeTab,
  loadReferrals,
  loadPromoGroups,
  loadSyncStatus,
  loadTariffs,
  loadSubscriptionData,
  loadTickets,
}: UseAdminUserTabDataLoaderParams) {
  useEffect(() => {
    if (activeTab === 'info') {
      loadReferrals();
      loadPromoGroups();
    }

    if (activeTab === 'sync') {
      loadSyncStatus();
    }

    if (activeTab === 'subscription') {
      loadTariffs();
      loadSubscriptionData();
    }

    if (activeTab === 'tickets') {
      loadTickets();
    }
  }, [
    activeTab,
    loadSyncStatus,
    loadTariffs,
    loadTickets,
    loadReferrals,
    loadSubscriptionData,
    loadPromoGroups,
  ]);
}
