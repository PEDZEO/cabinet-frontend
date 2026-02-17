import type { TFunction } from 'i18next';
import type { BanHealthResponse } from '../../../api/banSystem';
import { formatUptime } from '../utils/formatters';
import {
  getHealthCardBorderClass,
  getHealthDotClass,
  getHealthPulseDotClass,
  getHealthTextClass,
} from '../utils/statusStyles';

interface BanSystemHealthTabProps {
  t: TFunction;
  health: BanHealthResponse;
}

export function BanSystemHealthTab({ t, health }: BanSystemHealthTabProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-dark-700 bg-dark-800/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-4 w-4 rounded-full ${getHealthPulseDotClass(health.status)}`} />
            <div>
              <div className="font-medium text-dark-100">{t('banSystem.health.systemStatus')}</div>
              <div className={`text-sm ${getHealthTextClass(health.status)}`}>
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
              className={`rounded-xl border bg-dark-800/50 p-4 ${getHealthCardBorderClass(component.status)}`}
            >
              <div className="mb-2 flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${getHealthDotClass(component.status)}`} />
                <div className="font-medium text-dark-100">{component.name}</div>
              </div>
              <div className={`text-sm ${getHealthTextClass(component.status)}`}>
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
