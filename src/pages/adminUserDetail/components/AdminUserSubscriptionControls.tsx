import { useMemo, type Dispatch, type SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  UpdateSubscriptionRequest,
  UserAvailableTariff,
  UserDetailResponse,
} from '../../../api/adminUsers';
import { createNumberInputHandler } from '../../../utils/inputHelpers';
import { MinusIcon, PlusIcon } from './Icons';
import { StatusBadge } from './StatusBadge';

const QUICK_EXTENSION_DAYS = [1, 7, 30, 90];

interface AdminUserSubscriptionControlsProps {
  user: UserDetailResponse;
  actionLoading: boolean;
  confirmingAction: string | null;
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
  onUpdateSubscription: (action: UpdateSubscriptionRequest['action']) => Promise<void>;
  onSetDeviceLimit: (newLimit: number) => void;
  onRemoveTraffic: (purchaseId: number) => Promise<void>;
  onAddTraffic: (gb: number) => void;
}

export function AdminUserSubscriptionControls({
  user,
  actionLoading,
  confirmingAction,
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
  const assignableTariffs = useMemo(
    () => tariffs.filter((tariffItem) => tariffItem.is_active && tariffItem.is_available),
    [tariffs],
  );
  const selectedTariff = useMemo(
    () => tariffs.find((tariffItem) => tariffItem.id === selectedTariffId) || null,
    [selectedTariffId, tariffs],
  );
  const daysAreValid = typeof subDays === 'number' && subDays >= 1;

  const formatTariffTraffic = (tariffItem: UserAvailableTariff) =>
    tariffItem.traffic_limit_gb > 0
      ? `${tariffItem.traffic_limit_gb} ${t('common.units.gb')}`
      : t('subscription.unlimited', { defaultValue: 'Безлимит' });

  const formatTariffPeriods = (tariffItem: UserAvailableTariff) => {
    if (tariffItem.is_daily) {
      return t('admin.users.detail.subscription.dailyTariff', { defaultValue: 'Суточный' });
    }

    if (tariffItem.custom_days_enabled) {
      return `${tariffItem.min_days}-${tariffItem.max_days} ${t('subscription.daysShort')}`;
    }

    const periodDays = tariffItem.period_prices
      .map((period) => period.days)
      .sort((left, right) => left - right);

    if (periodDays.length === 0) {
      return t('admin.users.detail.subscription.notSpecified');
    }

    const visiblePeriods = periodDays.slice(0, 4).join(', ');
    return `${visiblePeriods}${periodDays.length > 4 ? '...' : ''} ${t('subscription.daysShort')}`;
  };

  const renderTariffPreview = () => {
    if (!selectedTariff) {
      return null;
    }

    return (
      <div className="rounded-lg border border-dark-700/80 bg-dark-900/40 p-3">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-dark-100">
              {selectedTariff.name}
            </div>
            {selectedTariff.description && (
              <div className="mt-0.5 line-clamp-2 text-xs text-dark-500">
                {selectedTariff.description}
              </div>
            )}
          </div>
          <span className="shrink-0 rounded-full bg-accent-500/15 px-2 py-1 text-xs font-medium text-accent-300">
            {formatTariffPeriods(selectedTariff)}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-lg bg-dark-800/70 p-2">
            <div className="text-dark-500">{t('admin.users.detail.subscription.traffic')}</div>
            <div className="mt-1 font-medium text-dark-100">
              {formatTariffTraffic(selectedTariff)}
            </div>
          </div>
          <div className="rounded-lg bg-dark-800/70 p-2">
            <div className="text-dark-500">{t('admin.users.detail.subscription.devices')}</div>
            <div className="mt-1 font-medium text-dark-100">{selectedTariff.device_limit}</div>
          </div>
          <div className="rounded-lg bg-dark-800/70 p-2">
            <div className="text-dark-500">
              {t('admin.users.detail.subscription.maxDevices', { defaultValue: 'Макс.' })}
            </div>
            <div className="mt-1 font-medium text-dark-100">
              {selectedTariff.max_device_limit ?? '-'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTariffSelect = () => (
    <select
      value={selectedTariffId || ''}
      onChange={(event) =>
        setSelectedTariffId(event.target.value ? parseInt(event.target.value, 10) : null)
      }
      disabled={actionLoading || assignableTariffs.length === 0}
      className="input"
    >
      <option value="">{t('admin.users.detail.subscription.selectTariff')}</option>
      {assignableTariffs.map((tariffItem) => (
        <option key={tariffItem.id} value={tariffItem.id}>
          {tariffItem.name} - {formatTariffTraffic(tariffItem)}, {tariffItem.device_limit}{' '}
          {t('admin.users.detail.subscription.devices')}
        </option>
      ))}
    </select>
  );

  const renderDaysInput = () => (
    <input
      type="number"
      value={subDays}
      onChange={createNumberInputHandler(setSubDays, 1, 3650)}
      placeholder={t('admin.users.detail.subscription.days')}
      className="input"
      min={1}
      max={3650}
      disabled={actionLoading}
    />
  );

  if (!subscription) {
    return (
      <div className="rounded-xl border border-accent-500/20 bg-dark-800/60 p-4">
        <div className="mb-4">
          <div className="text-sm font-semibold text-dark-100">
            {t('admin.users.detail.subscription.createManualTitle', {
              defaultValue: 'Назначить тариф пользователю',
            })}
          </div>
          <div className="mt-1 text-xs text-dark-500">
            {t('admin.users.detail.subscription.noActive')}
          </div>
        </div>

        <div className="space-y-3">
          {renderTariffSelect()}
          {assignableTariffs.length === 0 && (
            <div className="rounded-lg bg-warning-500/10 px-3 py-2 text-xs text-warning-300">
              {t('admin.users.detail.subscription.noAssignableTariffs', {
                defaultValue: 'Нет доступных активных тарифов для промо-группы пользователя',
              })}
            </div>
          )}
          {renderTariffPreview()}

          <div className="grid grid-cols-[1fr_auto] gap-2">
            {renderDaysInput()}
            <button
              type="button"
              onClick={() => void onUpdateSubscription('create')}
              disabled={actionLoading || !selectedTariffId || !daysAreValid}
              className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading
                ? t('admin.users.detail.subscription.creating')
                : t('admin.users.detail.subscription.create')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tariffIsCurrent = selectedTariffId === subscription.tariff_id;

  return (
    <>
      <div className="rounded-xl bg-dark-800/50 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="font-medium text-dark-200">
            {t('admin.users.detail.subscription.current')}
          </span>
          <div className="flex items-center gap-2">
            {subscription.is_trial && (
              <span className="rounded-full bg-warning-500/15 px-2 py-1 text-xs font-medium text-warning-300">
                {t('subscription.trial.title', { defaultValue: 'Триал' })}
              </span>
            )}
            <StatusBadge status={subscription.status} />
          </div>
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
              {t('admin.users.detail.subscription.daysRemaining', {
                defaultValue: 'Осталось дней',
              })}
            </div>
            <div className="text-dark-100">{subscription.days_remaining}</div>
          </div>
          <div>
            <div className="text-xs text-dark-500">
              {t('admin.users.detail.subscription.devices')}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
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
                type="button"
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
          <div>
            <div className="text-xs text-dark-500">
              {t('admin.users.detail.subscription.purchasedTraffic', {
                defaultValue: 'Докуплено',
              })}
            </div>
            <div className="text-dark-100">
              {subscription.purchased_traffic_gb} {t('common.units.gb')}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-success-500/15 bg-success-500/5 p-4">
        <div className="mb-3">
          <div className="text-sm font-semibold text-dark-100">
            {t('admin.users.detail.subscription.extendManualTitle', {
              defaultValue: 'Продлить на любое число дней',
            })}
          </div>
          <div className="mt-1 text-xs text-dark-500">
            {t('admin.users.detail.subscription.extendManualHint', {
              defaultValue: 'Можно указать 1 день, 90 дней или любой срок до 3650 дней.',
            })}
          </div>
        </div>

        <div className="mb-3 grid grid-cols-4 gap-2">
          {QUICK_EXTENSION_DAYS.map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setSubDays(days)}
              disabled={actionLoading}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50 ${
                subDays === days
                  ? 'bg-success-500 text-white'
                  : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
              }`}
            >
              {days} {t('subscription.daysShort')}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-2">
          {renderDaysInput()}
          <button
            type="button"
            onClick={() => void onUpdateSubscription('extend')}
            disabled={actionLoading || !daysAreValid}
            className="rounded-lg bg-success-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-success-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {actionLoading
              ? t('admin.users.actions.applying')
              : t('admin.users.detail.subscription.extend')}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-accent-500/15 bg-dark-800/60 p-4">
        <div className="mb-3">
          <div className="text-sm font-semibold text-dark-100">
            {t('admin.users.detail.subscription.assignTariffTitle', {
              defaultValue: 'Назначить тариф из доступных',
            })}
          </div>
          <div className="mt-1 text-xs text-dark-500">
            {t('admin.users.detail.subscription.assignTariffHint', {
              defaultValue:
                'Трафик, устройства и серверы будут взяты из выбранного тарифа и отправлены в RemnaWave.',
            })}
          </div>
        </div>

        <div className="space-y-3">
          {renderTariffSelect()}
          {assignableTariffs.length === 0 && (
            <div className="rounded-lg bg-warning-500/10 px-3 py-2 text-xs text-warning-300">
              {t('admin.users.detail.subscription.noAssignableTariffs', {
                defaultValue: 'Нет доступных активных тарифов для промо-группы пользователя',
              })}
            </div>
          )}
          {renderTariffPreview()}
          <button
            type="button"
            onClick={() => void onUpdateSubscription('change_tariff')}
            disabled={actionLoading || !selectedTariffId || tariffIsCurrent}
            className="w-full rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {tariffIsCurrent
              ? t('admin.users.detail.subscription.currentTariffSelected', {
                  defaultValue: 'Этот тариф уже назначен',
                })
              : t('admin.users.detail.subscription.assignTariff', {
                  defaultValue: 'Назначить тариф',
                })}
          </button>
          <div className="text-xs text-dark-500">
            {t('admin.users.detail.subscription.assignTariffWarning', {
              defaultValue:
                'При смене тарифа докупленный трафик сбрасывается, как при обычной смене тарифа.',
            })}
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
        <div className="mb-3 text-sm font-medium text-dark-200">
          {t('admin.users.detail.subscription.statusActions', {
            defaultValue: 'Системные действия',
          })}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() =>
              onInlineConfirm('cancelSubscription', () => onUpdateSubscription('cancel'))
            }
            disabled={actionLoading}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              confirmingAction === 'cancelSubscription'
                ? 'bg-error-500 text-white'
                : 'bg-error-500/10 text-error-300 hover:bg-error-500/20'
            }`}
          >
            {confirmingAction === 'cancelSubscription'
              ? t('admin.users.detail.actions.areYouSure')
              : t('admin.users.detail.subscription.cancel')}
          </button>
          <button
            type="button"
            onClick={() => void onUpdateSubscription('activate')}
            disabled={actionLoading || subscription.status === 'active'}
            className="rounded-lg bg-success-500/10 px-3 py-2 text-sm font-medium text-success-300 transition-colors hover:bg-success-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('admin.users.detail.subscription.activate')}
          </button>
        </div>
      </div>
    </>
  );
}
