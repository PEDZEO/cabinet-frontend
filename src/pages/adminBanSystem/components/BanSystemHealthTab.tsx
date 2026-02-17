import type { TFunction } from 'i18next';
import type { BanHealthResponse } from '../../../api/banSystem';

interface BanSystemHealthTabProps {
  t: TFunction;
  health: BanHealthResponse;
  formatUptime: (seconds: number | null) => string;
}

export function BanSystemHealthTab({ t, health, formatUptime }: BanSystemHealthTabProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-dark-700 bg-dark-800/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`h-4 w-4 rounded-full ${
                health.status === 'healthy'
                  ? 'animate-pulse bg-success-500'
                  : health.status === 'degraded'
                    ? 'animate-pulse bg-warning-500'
                    : 'animate-pulse bg-error-500'
              }`}
            />
            <div>
              <div className="font-medium text-dark-100">{t('banSystem.health.systemStatus')}</div>
              <div
                className={`text-sm ${
                  health.status === 'healthy'
                    ? 'text-success-400'
                    : health.status === 'degraded'
                      ? 'text-warning-400'
                      : 'text-error-400'
                }`}
              >
                {health.status.toUpperCase()}
              </div>
            </div>
          </div>
          {health.uptime !== null && (
            <div className="text-right">
              <div className="text-xs text-dark-500">{t('banSystem.stats.uptime')}</div>
              <div className="text-dark-100">{formatUptime(health.uptime)}</div>
            </div>
          )}
        </div>
      </div>

      {health.components && health.components.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {health.components.map((component, index) => (
            <div
              key={index}
              className={`rounded-xl border bg-dark-800/50 p-4 ${
                component.status === 'healthy'
                  ? 'border-success-500/30'
                  : component.status === 'degraded'
                    ? 'border-warning-500/30'
                    : 'border-error-500/30'
              }`}
            >
              <div className="mb-2 flex items-center gap-3">
                <div
                  className={`h-3 w-3 rounded-full ${
                    component.status === 'healthy'
                      ? 'bg-success-500'
                      : component.status === 'degraded'
                        ? 'bg-warning-500'
                        : 'bg-error-500'
                  }`}
                />
                <div className="font-medium text-dark-100">{component.name}</div>
              </div>
              <div
                className={`text-sm ${
                  component.status === 'healthy'
                    ? 'text-success-400'
                    : component.status === 'degraded'
                      ? 'text-warning-400'
                      : 'text-error-400'
                }`}
              >
                {component.status}
              </div>
              {component.message && (
                <div className="mt-1 text-xs text-dark-500">{component.message}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
