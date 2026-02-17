import type { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import type { UserPanelInfo } from '../../../api/adminUsers';
import { getCountryFlag } from '../utils/countryFlags';
import { RefreshIcon } from './Icons';
import type { NodeUsagePeriodItem } from './subscriptionTypes';

interface AdminUserPanelInfoSectionProps {
  panelInfoLoading: boolean;
  panelInfo: UserPanelInfo | null;
  nodeUsageForPeriod: NodeUsagePeriodItem[];
  nodeUsageDays: number;
  setNodeUsageDays: Dispatch<SetStateAction<number>>;
  formatDate: (date: string | null) => string;
  formatBytes: (bytes: number) => string;
  onCopyToClipboard: (value: string) => void;
  onReloadSubscriptionData: () => void;
}

export function AdminUserPanelInfoSection({
  panelInfoLoading,
  panelInfo,
  nodeUsageForPeriod,
  nodeUsageDays,
  setNodeUsageDays,
  formatDate,
  formatBytes,
  onCopyToClipboard,
  onReloadSubscriptionData,
}: AdminUserPanelInfoSectionProps) {
  const { t } = useTranslation();

  if (panelInfoLoading) {
    return (
      <div className="flex justify-center rounded-xl bg-dark-800/50 py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
      </div>
    );
  }

  if (panelInfo && !panelInfo.found) {
    return (
      <div className="rounded-xl border border-dark-700 bg-dark-800/50 p-4 text-center text-sm text-dark-400">
        {t('admin.users.detail.panelNotFound')}
      </div>
    );
  }

  if (!panelInfo || !panelInfo.found) {
    return null;
  }

  return (
    <>
      {(panelInfo.subscription_url || panelInfo.happ_link) && (
        <div className="rounded-xl bg-dark-800/50 p-4">
          <div className="mb-3 text-sm font-medium text-dark-200">
            {t('admin.users.detail.subscriptionUrl')} / {t('admin.users.detail.happLink')}
          </div>
          <div className="space-y-2">
            {panelInfo.subscription_url && (
              <button
                onClick={() => onCopyToClipboard(panelInfo.subscription_url!)}
                className="w-full rounded-lg bg-dark-700/50 p-2 text-left transition-colors hover:bg-dark-700"
              >
                <div className="mb-0.5 text-xs text-dark-500">
                  {t('admin.users.detail.subscriptionUrl')}
                </div>
                <div className="truncate font-mono text-xs text-dark-200">
                  {panelInfo.subscription_url}
                </div>
              </button>
            )}
            {panelInfo.happ_link && (
              <button
                onClick={() => onCopyToClipboard(panelInfo.happ_link!)}
                className="w-full rounded-lg bg-dark-700/50 p-2 text-left transition-colors hover:bg-dark-700"
              >
                <div className="mb-0.5 text-xs text-dark-500">
                  {t('admin.users.detail.happLink')}
                </div>
                <div className="truncate font-mono text-xs text-dark-200">
                  {panelInfo.happ_link}
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {(panelInfo.trojan_password || panelInfo.vless_uuid || panelInfo.ss_password) && (
        <div className="rounded-xl bg-dark-800/50 p-4">
          <div className="mb-3 text-sm font-medium text-dark-200">
            {t('admin.users.detail.panelConfig')}
          </div>
          <div className="space-y-2">
            {panelInfo.trojan_password && (
              <button
                onClick={() => onCopyToClipboard(panelInfo.trojan_password!)}
                className="w-full rounded-lg bg-dark-700/50 p-2 text-left transition-colors hover:bg-dark-700"
              >
                <div className="mb-0.5 text-xs text-dark-500">
                  {t('admin.users.detail.trojanPassword')}
                </div>
                <div className="truncate font-mono text-xs text-dark-200">
                  {panelInfo.trojan_password}
                </div>
              </button>
            )}
            {panelInfo.vless_uuid && (
              <button
                onClick={() => onCopyToClipboard(panelInfo.vless_uuid!)}
                className="w-full rounded-lg bg-dark-700/50 p-2 text-left transition-colors hover:bg-dark-700"
              >
                <div className="mb-0.5 text-xs text-dark-500">
                  {t('admin.users.detail.vlessUuid')}
                </div>
                <div className="truncate font-mono text-xs text-dark-200">
                  {panelInfo.vless_uuid}
                </div>
              </button>
            )}
            {panelInfo.ss_password && (
              <button
                onClick={() => onCopyToClipboard(panelInfo.ss_password!)}
                className="w-full rounded-lg bg-dark-700/50 p-2 text-left transition-colors hover:bg-dark-700"
              >
                <div className="mb-0.5 text-xs text-dark-500">
                  {t('admin.users.detail.ssPassword')}
                </div>
                <div className="truncate font-mono text-xs text-dark-200">
                  {panelInfo.ss_password}
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      <div className="rounded-xl bg-dark-800/50 p-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-dark-500">{t('admin.users.detail.firstConnected')}</div>
            <div className="text-sm text-dark-100">{formatDate(panelInfo.first_connected_at)}</div>
          </div>
          <div>
            <div className="text-xs text-dark-500">{t('admin.users.detail.lastOnline')}</div>
            <div className="text-sm text-dark-100">{formatDate(panelInfo.online_at)}</div>
          </div>
          {panelInfo.last_connected_node_name && (
            <div className="col-span-2">
              <div className="text-xs text-dark-500">{t('admin.users.detail.lastNode')}</div>
              <div className="text-sm text-dark-100">{panelInfo.last_connected_node_name}</div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-dark-800/50 p-4">
        <div className="mb-3 text-sm font-medium text-dark-200">
          {t('admin.users.detail.liveTraffic')}
        </div>
        <div className="mb-2">
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-dark-400">{formatBytes(panelInfo.used_traffic_bytes)}</span>
            <span className="text-dark-500">
              {panelInfo.traffic_limit_bytes > 0 ? formatBytes(panelInfo.traffic_limit_bytes) : '∞'}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-dark-700">
            <div
              className="h-full rounded-full bg-accent-500 transition-all"
              style={{
                width:
                  panelInfo.traffic_limit_bytes > 0
                    ? `${Math.min(100, (panelInfo.used_traffic_bytes / panelInfo.traffic_limit_bytes) * 100)}%`
                    : '0%',
              }}
            />
          </div>
        </div>
        <div className="text-xs text-dark-500">
          {t('admin.users.detail.lifetime')}: {formatBytes(panelInfo.lifetime_used_traffic_bytes)}
        </div>
      </div>

      <div className="rounded-xl bg-dark-800/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-dark-200">
            {t('admin.users.detail.nodeUsage')}
          </span>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[1, 3, 7, 14, 30].map((dayCount) => (
                <button
                  key={dayCount}
                  onClick={() => setNodeUsageDays(dayCount)}
                  className={`rounded-lg px-2 py-1 text-xs transition-colors ${
                    nodeUsageDays === dayCount
                      ? 'bg-accent-500/20 text-accent-400'
                      : 'text-dark-500 hover:text-dark-300'
                  }`}
                >
                  {dayCount}d
                </button>
              ))}
            </div>
            <button
              onClick={onReloadSubscriptionData}
              className="rounded-lg p-1 text-dark-500 transition-colors hover:text-dark-300"
              title={t('common.refresh')}
            >
              <RefreshIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {nodeUsageForPeriod.length > 0 ? (
          <div className="space-y-2">
            {nodeUsageForPeriod.map((item) => {
              const maxBytes = nodeUsageForPeriod[0].total_bytes;
              const pct = maxBytes > 0 ? (item.total_bytes / maxBytes) * 100 : 0;
              return (
                <div key={item.node_uuid}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-dark-300">
                      {item.country_code && (
                        <span className="mr-1">{getCountryFlag(item.country_code)}</span>
                      )}
                      {item.node_name}
                    </span>
                    <span className="text-dark-400">{formatBytes(item.total_bytes)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-dark-700">
                    <div
                      className="h-full rounded-full bg-accent-500/60"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-2 text-center text-xs text-dark-500">-</div>
        )}
      </div>
    </>
  );
}
