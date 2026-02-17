import { useTranslation } from 'react-i18next';
import type { PanelSyncStatusResponse } from '../../../api/adminUsers';
import { ArrowDownIcon, ArrowUpIcon } from './Icons';

interface AdminUserSyncTabProps {
  syncStatus: PanelSyncStatusResponse | null;
  userRemnawaveUuid: string | null;
  locale: string;
  actionLoading: boolean;
  onSyncFromPanel: () => void;
  onSyncToPanel: () => void;
}

export function AdminUserSyncTab({
  syncStatus,
  userRemnawaveUuid,
  locale,
  actionLoading,
  onSyncFromPanel,
  onSyncToPanel,
}: AdminUserSyncTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {syncStatus && (
        <div
          className={`rounded-xl border p-4 ${
            syncStatus.has_differences
              ? 'border-warning-500/30 bg-warning-500/10'
              : 'border-success-500/30 bg-success-500/10'
          }`}
        >
          <div className="mb-3 flex items-center gap-2">
            {syncStatus.has_differences ? (
              <span className="font-medium text-warning-400">
                {t('admin.users.detail.sync.hasDifferences')}
              </span>
            ) : (
              <span className="font-medium text-success-400">
                {t('admin.users.detail.sync.synced')}
              </span>
            )}
          </div>

          {syncStatus.differences.length > 0 && (
            <div className="mb-3 space-y-1">
              {syncStatus.differences.map((diff, index) => (
                <div key={index} className="text-xs text-dark-300">
                  • {diff}
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="mb-2 text-xs text-dark-500">{t('admin.users.detail.sync.bot')}</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-dark-400">{t('admin.users.detail.sync.statusLabel')}:</span>
                  <span className="text-dark-200">{syncStatus.bot_subscription_status || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">{t('admin.users.detail.sync.until')}:</span>
                  <span className="text-dark-200">
                    {syncStatus.bot_subscription_end_date
                      ? new Date(syncStatus.bot_subscription_end_date).toLocaleDateString(locale)
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">{t('admin.users.detail.sync.traffic')}:</span>
                  <span className="text-dark-200">
                    {syncStatus.bot_traffic_used_gb.toFixed(2)} {t('common.units.gb')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">{t('admin.users.detail.sync.devices')}:</span>
                  <span className="text-dark-200">{syncStatus.bot_device_limit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">{t('admin.users.detail.sync.squads')}:</span>
                  <span className="text-dark-200">{syncStatus.bot_squads?.length || 0}</span>
                </div>
              </div>
            </div>
            <div>
              <div className="mb-2 text-xs text-dark-500">{t('admin.users.detail.sync.panel')}</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-dark-400">{t('admin.users.detail.sync.statusLabel')}:</span>
                  <span className="text-dark-200">{syncStatus.panel_status || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">{t('admin.users.detail.sync.until')}:</span>
                  <span className="text-dark-200">
                    {syncStatus.panel_expire_at
                      ? new Date(syncStatus.panel_expire_at).toLocaleDateString(locale)
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">{t('admin.users.detail.sync.traffic')}:</span>
                  <span className="text-dark-200">
                    {syncStatus.panel_traffic_used_gb.toFixed(2)} {t('common.units.gb')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">{t('admin.users.detail.sync.devices')}:</span>
                  <span className="text-dark-200">{syncStatus.panel_device_limit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">{t('admin.users.detail.sync.squads')}:</span>
                  <span className="text-dark-200">{syncStatus.panel_squads?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-dark-800/50 p-4">
        <div className="mb-1 text-sm text-dark-400">Remnawave UUID</div>
        <div className="break-all font-mono text-sm text-dark-100">
          {syncStatus?.remnawave_uuid ||
            userRemnawaveUuid ||
            t('admin.users.detail.sync.notLinked')}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onSyncFromPanel}
          disabled={actionLoading}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border border-accent-500/30 bg-accent-500/10 p-4 text-accent-400 transition-all hover:bg-accent-500/20 disabled:opacity-50"
        >
          <ArrowDownIcon className={`h-6 w-6 ${actionLoading ? 'animate-bounce' : ''}`} />
          <span className="text-center text-xs font-medium">
            {t('admin.users.detail.sync.fromPanel')}
          </span>
        </button>
        <button
          onClick={onSyncToPanel}
          disabled={actionLoading}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border border-accent-500/30 bg-accent-500/10 p-4 text-accent-400 transition-all hover:bg-accent-500/20 disabled:opacity-50"
        >
          <ArrowUpIcon className={`h-6 w-6 ${actionLoading ? 'animate-bounce' : ''}`} />
          <span className="text-center text-xs font-medium">
            {t('admin.users.detail.sync.toPanel')}
          </span>
        </button>
      </div>
    </div>
  );
}
