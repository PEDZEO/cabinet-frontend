import { useTranslation } from 'react-i18next';
import type { TrialInfo } from '@/types';

interface LiteTrialCardProps {
  trialInfo: TrialInfo;
  balance: number;
  onActivate: () => void;
  isLoading: boolean;
  error?: string | null;
}

export function LiteTrialCard({
  trialInfo,
  balance,
  onActivate,
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
    <div className="rounded-2xl border border-accent-500/30 bg-gradient-to-br from-accent-500/10 to-transparent p-5">
      <div className="mb-4 text-center">
        <h3 className="text-lg font-semibold text-dark-100">{t('lite.activateTrial')}</h3>
        <p className="mt-1 text-sm text-dark-400">
          {t('lite.trialDays', { count: trialInfo.duration_days })}
        </p>
      </div>

      <div className="mb-4 flex justify-center gap-4 text-sm">
        <div className="text-center">
          <div className="font-medium text-dark-100">{trafficLabel}</div>
        </div>
        <div className="text-dark-600">|</div>
        <div className="text-center">
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
        <p className="mt-2 text-center text-xs text-dark-400">{t('lite.topUp')}</p>
      )}
    </div>
  );
}
