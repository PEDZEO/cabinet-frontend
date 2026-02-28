import { useTranslation } from 'react-i18next';
import type { TrialInfo } from '@/types';

interface LiteTrialCardProps {
  trialInfo: TrialInfo;
  balance: number;
  onActivate: () => void;
  onTopUp?: () => void;
  isLoading: boolean;
  error?: string | null;
}

export function LiteTrialCard({
  trialInfo,
  balance,
  onActivate,
  onTopUp,
  isLoading,
  error,
}: LiteTrialCardProps) {
  const { t } = useTranslation();

  const canActivate = !trialInfo.requires_payment || balance >= trialInfo.price_kopeks;
  const trafficLabel =
    trialInfo.traffic_limit_gb <= 0
      ? '∞'
      : t('lite.trialTraffic', { count: trialInfo.traffic_limit_gb });

  return (
    <div className="rounded-2xl border border-accent-500/30 bg-gradient-to-br from-accent-500/10 to-transparent p-4 sm:p-5">
      <div className="mb-4 text-center">
        <h3 className="text-lg font-semibold text-dark-100">{t('lite.activateTrial')}</h3>
        <p className="mt-1 text-sm text-dark-400">
          {t('lite.trialDays', { count: trialInfo.duration_days })}
        </p>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2 text-sm min-[360px]:grid-cols-2">
        <div className="rounded-xl bg-dark-900/30 px-3 py-2 text-center">
          <div className="font-medium text-dark-100">{trafficLabel}</div>
        </div>
        <div className="rounded-xl bg-dark-900/30 px-3 py-2 text-center">
          <div className="font-medium text-dark-100">
            {t('lite.trialDevices', { count: trialInfo.device_limit })}
          </div>
        </div>
      </div>

      {trialInfo.requires_payment && (
        <div className="mb-4 text-center">
          <span className="text-lg font-bold text-accent-400">
            {trialInfo.price_rubles} {t('common.currency')}
          </span>
        </div>
      )}

      {error && (
        <div className="mb-3 rounded-lg bg-error-500/20 px-3 py-2 text-center text-sm text-error-400">
          {error}
        </div>
      )}

      <button
        onClick={onActivate}
        disabled={!canActivate || isLoading}
        className={`w-full rounded-xl py-3 font-semibold transition-all active:scale-[0.98] ${
          canActivate
            ? 'bg-accent-500 text-white hover:bg-accent-600'
            : 'cursor-not-allowed bg-dark-600 text-dark-400'
        }`}
      >
        {isLoading ? t('common.loading') : t('lite.activateTrial')}
      </button>

      {trialInfo.requires_payment && !canActivate && (
        <div className="mt-2">
          <p className="text-center text-xs text-dark-400">{t('lite.trialRequiresTopUp')}</p>
          {onTopUp && (
            <button
              type="button"
              onClick={onTopUp}
              className="mt-2 w-full rounded-xl border border-dark-600 bg-dark-800/70 py-2 text-sm font-medium text-dark-100 transition-colors hover:border-dark-500 hover:bg-dark-700"
            >
              {t('lite.topUp')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
