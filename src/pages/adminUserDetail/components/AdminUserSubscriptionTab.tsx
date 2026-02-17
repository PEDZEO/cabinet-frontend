import type { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  UserAvailableTariff,
  UserDetailResponse,
  UserPanelInfo,
} from '../../../api/adminUsers';
import { createNumberInputHandler } from '../../../utils/inputHelpers';
import { getCountryFlag } from '../utils/countryFlags';
import { MinusIcon, PlusIcon, RefreshIcon } from './Icons';
import { StatusBadge } from './StatusBadge';

interface DeviceItem {
  hwid: string;
  platform: string;
  device_model: string;
  created_at: string | null;
}

interface NodeUsagePeriodItem {
  node_uuid: string;
  node_name: string;
  country_code: string | null;
  total_bytes: number;
}

interface AdminUserSubscriptionTabProps {
  user: UserDetailResponse;
  actionLoading: boolean;
  confirmingAction: string | null;
  subAction: string;
  setSubAction: Dispatch<SetStateAction<string>>;
  subDays: number | '';
  setSubDays: Dispatch<SetStateAction<number | ''>>;
  selectedTariffId: number | null;
  setSelectedTariffId: Dispatch<SetStateAction<number | null>>;
  tariffs: UserAvailableTariff[];
  currentTariff: UserAvailableTariff | null;
  selectedTrafficGb: string;
  setSelectedTrafficGb: Dispatch<SetStateAction<string>>;
  panelInfoLoading: boolean;
  panelInfo: UserPanelInfo | null;
  nodeUsageForPeriod: NodeUsagePeriodItem[];
  nodeUsageDays: number;
  setNodeUsageDays: Dispatch<SetStateAction<number>>;
  devices: DeviceItem[];
  devicesTotal: number;
  deviceLimit: number;
  devicesLoading: boolean;
  locale: string;
  formatDate: (date: string | null) => string;
  formatBytes: (bytes: number) => string;
  onInlineConfirm: (action: string, callback: () => Promise<void>) => void;
  onUpdateSubscription: (overrideAction?: string) => void;
  onSetDeviceLimit: (newLimit: number) => void;
  onRemoveTraffic: (purchaseId: number) => Promise<void>;
  onAddTraffic: (gb: number) => void;
  onCopyToClipboard: (value: string) => void;
  onReloadSubscriptionData: () => void;
  onReloadDevices: () => void;
  onResetDevices: () => Promise<void>;
  onDeleteDevice: (hwid: string) => Promise<void>;
}

export function AdminUserSubscriptionTab({
  user,
  actionLoading,
  confirmingAction,
  subAction,
  setSubAction,
  subDays,
  setSubDays,
  selectedTariffId,
  setSelectedTariffId,
  tariffs,
  currentTariff,
  selectedTrafficGb,
  setSelectedTrafficGb,
  panelInfoLoading,
  panelInfo,
  nodeUsageForPeriod,
  nodeUsageDays,
  setNodeUsageDays,
  devices,
  devicesTotal,
  deviceLimit,
  devicesLoading,
  locale,
  formatDate,
  formatBytes,
  onInlineConfirm,
  onUpdateSubscription,
  onSetDeviceLimit,
  onRemoveTraffic,
  onAddTraffic,
  onCopyToClipboard,
  onReloadSubscriptionData,
  onReloadDevices,
  onResetDevices,
  onDeleteDevice,
}: AdminUserSubscriptionTabProps) {
  const { t } = useTranslation();
  const subscription = user.subscription;

  return (
    <div className="space-y-4">
      {subscription ? (
        <>
          <div className="rounded-xl bg-dark-800/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-medium text-dark-200">
                {t('admin.users.detail.subscription.current')}
              </span>
              <StatusBadge status={subscription.status} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-dark-500">
                  {t('admin.users.detail.subscription.tariff')}
                </div>
                <div className="text-dark-100">
                  {subscription.tariff_name || t('admin.users.detail.subscription.notSpecified')}
                </div>
              </div>
              <div>
                <div className="text-xs text-dark-500">
                  {t('admin.users.detail.subscription.validUntil')}
                </div>
                <div className="text-dark-100">{formatDate(subscription.end_date)}</div>
              </div>
              <div>
                <div className="text-xs text-dark-500">
                  {t('admin.users.detail.subscription.traffic')}
                </div>
                <div className="text-dark-100">
                  {subscription.traffic_used_gb.toFixed(1)} / {subscription.traffic_limit_gb}{' '}
                  {t('common.units.gb')}
                </div>
              </div>
              <div>
                <div className="text-xs text-dark-500">
                  {t('admin.users.detail.subscription.devices')}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSetDeviceLimit(subscription.device_limit - 1)}
                    disabled={actionLoading || subscription.device_limit <= 1}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-dark-700 text-dark-300 transition-colors hover:bg-dark-600 disabled:opacity-30"
                  >
                    <MinusIcon />
                  </button>
                  <span className="min-w-[2ch] text-center text-dark-100">
                    {subscription.device_limit}
                  </span>
                  <button
                    onClick={() => onSetDeviceLimit(subscription.device_limit + 1)}
                    disabled={
                      actionLoading ||
                      (currentTariff?.max_device_limit != null &&
                        subscription.device_limit >= currentTariff.max_device_limit)
                    }
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-dark-700 text-dark-300 transition-colors hover:bg-dark-600 disabled:opacity-30"
                  >
                    <PlusIcon />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {subscription.traffic_purchases && subscription.traffic_purchases.length > 0 && (
            <div className="rounded-xl bg-dark-800/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-dark-200">
                  {t('admin.users.detail.subscription.trafficPackages')}
                  {subscription.purchased_traffic_gb > 0 && (
                    <span className="ml-2 text-xs text-dark-400">
                      ({subscription.purchased_traffic_gb} {t('common.units.gb')})
                    </span>
                  )}
                </span>
              </div>
              <div className="space-y-2">
                {subscription.traffic_purchases.map((trafficPurchase) => (
                  <div
                    key={trafficPurchase.id}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                      trafficPurchase.is_expired ? 'bg-dark-700/30 opacity-60' : 'bg-dark-700/50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm text-dark-200">
                        <span className="font-medium">
                          {trafficPurchase.traffic_gb} {t('common.units.gb')}
                        </span>
                        {trafficPurchase.is_expired ? (
                          <span className="rounded-full bg-error-500/20 px-1.5 py-0.5 text-[10px] text-error-400">
                            {t('admin.users.detail.subscription.expired')}
                          </span>
                        ) : (
                          <span className="text-xs text-dark-400">
                            {trafficPurchase.days_remaining}{' '}
                            {t('admin.users.detail.subscription.daysLeft')}
                          </span>
                        )}
                      </div>
                    </div>
                    {!trafficPurchase.is_expired && (
                      <button
                        onClick={() =>
                          onInlineConfirm(`removeTraffic_${trafficPurchase.id}`, () =>
                            onRemoveTraffic(trafficPurchase.id),
                          )
                        }
                        disabled={actionLoading}
                        className={`ml-2 shrink-0 rounded-lg px-2 py-1 text-xs transition-all disabled:opacity-50 ${
                          confirmingAction === `removeTraffic_${trafficPurchase.id}`
                            ? 'bg-error-500 text-white'
                            : 'text-dark-500 hover:bg-error-500/15 hover:text-error-400'
                        }`}
                      >
                        {confirmingAction === `removeTraffic_${trafficPurchase.id}`
                          ? '?'
                          : '\u00D7'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentTariff &&
            currentTariff.traffic_topup_enabled &&
            Object.keys(currentTariff.traffic_topup_packages).length > 0 && (
              <div className="rounded-xl bg-dark-800/50 p-4">
                <div className="mb-3 text-sm font-medium text-dark-200">
                  {t('admin.users.detail.subscription.addTraffic')}
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedTrafficGb}
                    onChange={(event) => setSelectedTrafficGb(event.target.value)}
                    className="input flex-1"
                  >
                    <option value="">{t('admin.users.detail.subscription.selectPackage')}</option>
                    {Object.entries(currentTariff.traffic_topup_packages)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([gb]) => (
                        <option key={gb} value={gb}>
                          {gb} {t('common.units.gb')}
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={() => selectedTrafficGb && onAddTraffic(Number(selectedTrafficGb))}
                    disabled={actionLoading || !selectedTrafficGb}
                    className="shrink-0 rounded-lg bg-accent-500 px-4 py-2 text-sm text-white transition-colors hover:bg-accent-600 disabled:opacity-50"
                  >
                    {t('admin.users.detail.subscription.addButton')}
                  </button>
                </div>
                <div className="mt-2 text-xs text-dark-500">
                  {t('admin.users.detail.subscription.addTrafficNote')}
                </div>
              </div>
            )}

          <div className="rounded-xl bg-dark-800/50 p-4">
            <div className="mb-3 font-medium text-dark-200">
              {t('admin.users.detail.subscription.actions')}
            </div>
            <div className="space-y-3">
              <select
                value={subAction}
                onChange={(event) => setSubAction(event.target.value)}
                className="input"
              >
                <option value="extend">{t('admin.users.detail.subscription.extend')}</option>
                <option value="change_tariff">
                  {t('admin.users.detail.subscription.changeTariff')}
                </option>
                <option value="cancel">{t('admin.users.detail.subscription.cancel')}</option>
                <option value="activate">{t('admin.users.detail.subscription.activate')}</option>
              </select>

              {subAction === 'extend' && (
                <input
                  type="number"
                  value={subDays}
                  onChange={createNumberInputHandler(setSubDays, 1)}
                  placeholder={t('admin.users.detail.subscription.days')}
                  className="input"
                  min={1}
                  max={3650}
                />
              )}

              {subAction === 'change_tariff' && (
                <select
                  value={selectedTariffId || ''}
                  onChange={(event) =>
                    setSelectedTariffId(
                      event.target.value ? parseInt(event.target.value, 10) : null,
                    )
                  }
                  className="input"
                >
                  <option value="">{t('admin.users.detail.subscription.selectTariff')}</option>
                  {tariffs.map((tariffItem) => (
                    <option key={tariffItem.id} value={tariffItem.id}>
                      {tariffItem.name}{' '}
                      {!tariffItem.is_available && t('admin.users.detail.subscription.unavailable')}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={() => onUpdateSubscription()}
                disabled={actionLoading}
                className="btn-primary w-full"
              >
                {actionLoading ? t('admin.users.actions.applying') : t('admin.users.actions.apply')}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-xl bg-dark-800/50 p-4">
          <div className="mb-4 text-center text-dark-400">
            {t('admin.users.detail.subscription.noActive')}
          </div>
          <div className="space-y-3">
            <select
              value={selectedTariffId || ''}
              onChange={(event) =>
                setSelectedTariffId(event.target.value ? parseInt(event.target.value, 10) : null)
              }
              className="input"
            >
              <option value="">{t('admin.users.detail.subscription.selectTariff')}</option>
              {tariffs.map((tariffItem) => (
                <option key={tariffItem.id} value={tariffItem.id}>
                  {tariffItem.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={subDays}
              onChange={createNumberInputHandler(setSubDays, 1)}
              placeholder={t('admin.users.detail.subscription.days')}
              className="input"
              min={1}
              max={3650}
            />
            <button
              onClick={() => onUpdateSubscription('create')}
              disabled={actionLoading}
              className="btn-primary w-full"
            >
              {actionLoading
                ? t('admin.users.detail.subscription.creating')
                : t('admin.users.detail.subscription.create')}
            </button>
          </div>
        </div>
      )}

      {panelInfoLoading ? (
        <div className="flex justify-center rounded-xl bg-dark-800/50 py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
        </div>
      ) : panelInfo && !panelInfo.found ? (
        <div className="rounded-xl border border-dark-700 bg-dark-800/50 p-4 text-center text-sm text-dark-400">
          {t('admin.users.detail.panelNotFound')}
        </div>
      ) : panelInfo && panelInfo.found ? (
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
                <div className="text-xs text-dark-500">
                  {t('admin.users.detail.firstConnected')}
                </div>
                <div className="text-sm text-dark-100">
                  {formatDate(panelInfo.first_connected_at)}
                </div>
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
                  {panelInfo.traffic_limit_bytes > 0
                    ? formatBytes(panelInfo.traffic_limit_bytes)
                    : '∞'}
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
              {t('admin.users.detail.lifetime')}:{' '}
              {formatBytes(panelInfo.lifetime_used_traffic_bytes)}
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
      ) : null}

      <div className="rounded-xl bg-dark-800/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-dark-200">
            {t('admin.users.detail.devices.title')} ({devicesTotal}/{deviceLimit})
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onReloadDevices}
              className="rounded-lg p-1 text-dark-500 transition-colors hover:text-dark-300"
              title={t('common.refresh')}
            >
              <RefreshIcon className="h-3.5 w-3.5" />
            </button>
            {devices.length > 0 && (
              <button
                onClick={() => onInlineConfirm('resetDevices', onResetDevices)}
                disabled={actionLoading}
                className={`rounded-lg px-2 py-1 text-xs font-medium transition-all disabled:opacity-50 ${
                  confirmingAction === 'resetDevices'
                    ? 'bg-error-500 text-white'
                    : 'bg-error-500/15 text-error-400 hover:bg-error-500/25'
                }`}
              >
                {confirmingAction === 'resetDevices'
                  ? t('admin.users.detail.actions.areYouSure')
                  : t('admin.users.detail.devices.resetAll')}
              </button>
            )}
          </div>
        </div>
        {devicesLoading ? (
          <div className="flex justify-center py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
          </div>
        ) : devices.length > 0 ? (
          <div className="space-y-2">
            {devices.map((device) => (
              <div
                key={device.hwid}
                className="flex items-center justify-between rounded-lg bg-dark-700/50 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-dark-200">
                    {device.platform || device.device_model || device.hwid.slice(0, 12)}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-dark-500">
                    {device.device_model && device.platform && <span>{device.device_model}</span>}
                    <span className="font-mono">{device.hwid.slice(0, 8)}...</span>
                    {device.created_at && (
                      <span>{new Date(device.created_at).toLocaleDateString(locale)}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() =>
                    onInlineConfirm(`deleteDevice_${device.hwid}`, () =>
                      onDeleteDevice(device.hwid),
                    )
                  }
                  disabled={actionLoading}
                  className={`ml-2 shrink-0 rounded-lg px-2 py-1 text-xs transition-all disabled:opacity-50 ${
                    confirmingAction === `deleteDevice_${device.hwid}`
                      ? 'bg-error-500 text-white'
                      : 'text-dark-500 hover:bg-error-500/15 hover:text-error-400'
                  }`}
                >
                  {confirmingAction === `deleteDevice_${device.hwid}` ? '?' : '\u00D7'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-2 text-center text-xs text-dark-500">
            {t('admin.users.detail.devices.none')}
          </div>
        )}
      </div>
    </div>
  );
}
