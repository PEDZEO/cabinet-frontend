import type { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import type { UserAvailableTariff, UserDetailResponse } from '../../../api/adminUsers';
import { createNumberInputHandler } from '../../../utils/inputHelpers';
import { MinusIcon, PlusIcon } from './Icons';
import { StatusBadge } from './StatusBadge';

interface AdminUserSubscriptionControlsProps {
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
  formatDate: (date: string | null) => string;
  onInlineConfirm: (action: string, callback: () => Promise<void>) => void;
  onUpdateSubscription: (overrideAction?: string) => void;
  onSetDeviceLimit: (newLimit: number) => void;
  onRemoveTraffic: (purchaseId: number) => Promise<void>;
  onAddTraffic: (gb: number) => void;
}

export function AdminUserSubscriptionControls({
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
  formatDate,
  onInlineConfirm,
  onUpdateSubscription,
  onSetDeviceLimit,
  onRemoveTraffic,
  onAddTraffic,
}: AdminUserSubscriptionControlsProps) {
  const { t } = useTranslation();
  const subscription = user.subscription;

  if (!subscription) {
    return (
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
    );
  }

  return (
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
                    {confirmingAction === `removeTraffic_${trafficPurchase.id}` ? '?' : '\u00D7'}
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
                setSelectedTariffId(event.target.value ? parseInt(event.target.value, 10) : null)
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
  );
}
