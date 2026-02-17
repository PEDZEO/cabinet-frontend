import type { TFunction } from 'i18next';
import type { BanNodesListResponse } from '../../../api/banSystem';
import {
  getNodeCardBorderClass,
  getNodeDotClass,
  getNodeStatusTextClass,
} from '../utils/statusStyles';

interface BanSystemNodesTabProps {
  t: TFunction;
  nodes: BanNodesListResponse | null;
}

export function BanSystemNodesTab({ t, nodes }: BanSystemNodesTabProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {nodes?.nodes.map((node) => (
        <div
          key={node.name}
          className={`rounded-xl border bg-dark-800/50 p-4 ${getNodeCardBorderClass(node.is_connected)}`}
        >
          <div className="mb-3 flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${getNodeDotClass(node.is_connected)}`} />
            <div>
              <div className="font-medium text-dark-100">{node.name}</div>
              <div className="text-xs text-dark-500">{node.address || '-'}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-dark-900/50 p-2.5">
              <div className="text-xs text-dark-500">{t('banSystem.nodes.status')}</div>
              <div className={`text-sm font-medium ${getNodeStatusTextClass(node.is_connected)}`}>
                {node.is_connected ? t('banSystem.nodes.online') : t('banSystem.nodes.offline')}
              </div>
            </div>
            <div className="rounded-lg bg-dark-900/50 p-2.5">
              <div className="text-xs text-dark-500">{t('banSystem.nodes.users')}</div>
              <div className="text-sm font-medium text-dark-100">{node.users_count}</div>
            </div>
          </div>
        </div>
      ))}
      {(!nodes?.nodes || nodes.nodes.length === 0) && (
        <div className="col-span-full py-8 text-center text-dark-500">
          {t('banSystem.nodes.noNodes')}
        </div>
      )}
    </div>
  );
}
