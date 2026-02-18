import type { RefObject } from 'react';
import type { TFunction } from 'i18next';

import InsufficientBalancePrompt from '@/components/InsufficientBalancePrompt';
import type { Tariff, TariffSwitchPreview as TariffSwitchPreviewData } from '@/types';

type TariffSwitchPreviewProps = {
  t: TFunction;
  formatPrice: (kopeks: number) => string;
  tariffs: Tariff[];
  switchTariffId: number;
  switchModalRef: RefObject<HTMLDivElement | null>;
  switchPreviewLoading: boolean;
  switchPreview: TariffSwitchPreviewData | undefined;
  isSwitchPending: boolean;
  switchErrorMessage: string | null;
  onClose: () => void;
  onSwitch: (tariffId: number) => void;
};

export const TariffSwitchPreview = ({
  t,
  formatPrice,
  tariffs,
  switchTariffId,
  switchModalRef,
  switchPreviewLoading,
  switchPreview,
  isSwitchPending,
  switchErrorMessage,
  onClose,
  onSwitch,
}: TariffSwitchPreviewProps) => {
  return (
    <div ref={switchModalRef} className="mb-6 space-y-4 rounded-xl bg-dark-800/50 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-dark-100">{t('subscription.switchTariff.title')}</h3>
        <button
          type="button"
          aria-label={t('common.close')}
          onClick={onClose}
          className="text-sm text-dark-400 hover:text-dark-200"
        >
          ✕
        </button>
      </div>

      {switchPreviewLoading ? (
        <div className="flex items-center justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
        </div>
      ) : (
        switchPreview &&
        (() => {
          const targetTariff = tariffs.find((tariff) => tariff.id === switchTariffId);
          const dailyPrice =
            targetTariff?.daily_price_kopeks ?? targetTariff?.price_per_day_kopeks ?? 0;
          const isDailyTariff = dailyPrice > 0;

          return (
            <>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-dark-300">
                  <span>{t('subscription.switchTariff.currentTariff')}</span>
                  <span className="font-medium text-dark-100">
                    {switchPreview.current_tariff_name || '-'}
                  </span>
                </div>
                <div className="flex justify-between text-dark-300">
                  <span>{t('subscription.switchTariff.newTariff')}</span>
                  <span className="font-medium text-accent-400">
                    {switchPreview.new_tariff_name}
                  </span>
                </div>
                <div className="flex justify-between text-dark-300">
                  <span>{t('subscription.switchTariff.remainingDays')}</span>
                  <span>{switchPreview.remaining_days}</span>
                </div>
              </div>

              {isDailyTariff && (
                <div className="rounded-lg border border-accent-500/30 bg-accent-500/10 p-3 text-center">
                  <div className="text-sm text-dark-300">
                    {t('subscription.switchTariff.dailyPayment')}
                  </div>
                  <div className="text-lg font-bold text-accent-400">{formatPrice(dailyPrice)}</div>
                  <div className="mt-1 text-xs text-dark-400">
                    {t('subscription.switchTariff.dailyChargeDescription')}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-dark-700/50 pt-3">
                <div>
                  <span className="font-medium text-dark-100">
                    {t('subscription.switchTariff.upgradeCost')}
                  </span>
                  {switchPreview.discount_percent && switchPreview.discount_percent > 0 && (
                    <span className="ml-2 inline-block rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
                      -{switchPreview.discount_percent}%
                    </span>
                  )}
                </div>
                <div className="text-right">
                  {switchPreview.discount_percent &&
                    switchPreview.discount_percent > 0 &&
                    switchPreview.base_upgrade_cost_kopeks &&
                    switchPreview.base_upgrade_cost_kopeks > 0 && (
                      <span className="mr-2 text-sm text-dark-500 line-through">
                        {formatPrice(switchPreview.base_upgrade_cost_kopeks)}
                      </span>
                    )}
                  <span
                    className={`text-lg font-bold ${switchPreview.upgrade_cost_kopeks === 0 ? 'text-green-400' : 'text-accent-400'}`}
                  >
                    {switchPreview.upgrade_cost_kopeks > 0
                      ? switchPreview.upgrade_cost_label
                      : t('subscription.switchTariff.free')}
                  </span>
                </div>
              </div>

              {!switchPreview.has_enough_balance && switchPreview.upgrade_cost_kopeks > 0 && (
                <InsufficientBalancePrompt
                  missingAmountKopeks={switchPreview.missing_amount_kopeks}
                  compact
                />
              )}

              <button
                onClick={() => onSwitch(switchTariffId)}
                disabled={isSwitchPending || !switchPreview.can_switch}
                className="btn-primary w-full py-2.5"
              >
                {isSwitchPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  </span>
                ) : (
                  t('subscription.switchTariff.switch')
                )}
              </button>

              {switchErrorMessage && (
                <div className="mt-3 text-center text-sm text-error-400">{switchErrorMessage}</div>
              )}
            </>
          );
        })()
      )}
    </div>
  );
};
