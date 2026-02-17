import { useTranslation } from 'react-i18next';

type AdminUserDetailTab = 'info' | 'subscription' | 'balance' | 'sync' | 'tickets';

interface AdminUserDetailTabsProps {
  activeTab: AdminUserDetailTab;
  onSelectTab: (tab: AdminUserDetailTab) => void;
}

export function AdminUserDetailTabs({ activeTab, onSelectTab }: AdminUserDetailTabsProps) {
  const { t } = useTranslation();

  return (
    <div
      className="scrollbar-hide -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 py-1"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {(['info', 'subscription', 'balance', 'sync', 'tickets'] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => onSelectTab(tab)}
          className={`shrink-0 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === tab
              ? 'bg-accent-500/15 text-accent-400 ring-1 ring-accent-500/30'
              : 'bg-dark-800/50 text-dark-400 active:bg-dark-700'
          }`}
        >
          {tab === 'info' && t('admin.users.detail.tabs.info')}
          {tab === 'subscription' && t('admin.users.detail.tabs.subscription')}
          {tab === 'balance' && t('admin.users.detail.tabs.balance')}
          {tab === 'sync' && t('admin.users.detail.tabs.sync')}
          {tab === 'tickets' && t('admin.users.detail.tabs.tickets')}
        </button>
      ))}
    </div>
  );
}
