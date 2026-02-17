import type { TFunction } from 'i18next';
import type { BanAgentsListResponse } from '../../../api/banSystem';
import { AgentIcon, ChartIcon, WarningIcon } from './BanSystemIcons';
import { StatCard } from './StatCard';

interface BanSystemAgentsTabProps {
  t: TFunction;
  agents: BanAgentsListResponse | null;
}

export function BanSystemAgentsTab({ t, agents }: BanSystemAgentsTabProps) {
  return (
    <div className="space-y-4">
      {agents?.summary && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            title={t('banSystem.agents.online')}
            value={`${agents.summary.online_agents}/${agents.summary.total_agents}`}
            icon={<AgentIcon />}
            color="success"
          />
          <StatCard
            title={t('banSystem.agents.totalSent')}
            value={agents.summary.total_sent.toLocaleString()}
            icon={<ChartIcon />}
            color="accent"
          />
          <StatCard
            title={t('banSystem.agents.totalDropped')}
            value={agents.summary.total_dropped.toLocaleString()}
            icon={<WarningIcon />}
            color="warning"
          />
          <StatCard
            title={t('banSystem.agents.healthy')}
            value={agents.summary.healthy_count}
            subtitle={`${t('banSystem.agents.warning')}: ${agents.summary.warning_count}, ${t('banSystem.agents.critical')}: ${agents.summary.critical_count}`}
            icon={<AgentIcon />}
            color="info"
          />
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-dark-700 bg-dark-800/50">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-dark-500">
                  {t('banSystem.agents.node')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-dark-500">
                  {t('banSystem.agents.status')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-dark-500">
                  {t('banSystem.agents.health')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-dark-500">
                  {t('banSystem.agents.sent')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-dark-500">
                  {t('banSystem.agents.dropped')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-dark-500">
                  {t('banSystem.agents.queue')}
                </th>
              </tr>
            </thead>
            <tbody>
              {agents?.agents.map((agent) => (
                <tr
                  key={agent.node_name}
                  className="border-b border-dark-700/50 hover:bg-dark-800/50"
                >
                  <td className="px-4 py-3 text-dark-100">{agent.node_name}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        agent.is_online
                          ? 'bg-success-500/20 text-success-400'
                          : 'bg-dark-600 text-dark-400'
                      }`}
                    >
                      {agent.is_online
                        ? t('banSystem.agents.online')
                        : t('banSystem.agents.offline')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        agent.health === 'healthy'
                          ? 'bg-success-500/20 text-success-400'
                          : agent.health === 'warning'
                            ? 'bg-warning-500/20 text-warning-400'
                            : agent.health === 'critical'
                              ? 'bg-error-500/20 text-error-400'
                              : 'bg-dark-600 text-dark-400'
                      }`}
                    >
                      {agent.health}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-dark-300">
                    {agent.sent_total.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center text-warning-400">
                    {agent.dropped_total.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center text-dark-300">
                    {agent.queue_size}/{agent.queue_max}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!agents?.agents || agents.agents.length === 0) && (
          <div className="py-8 text-center text-dark-500">{t('banSystem.agents.noAgents')}</div>
        )}
      </div>
    </div>
  );
}
