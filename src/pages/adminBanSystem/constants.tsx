import type { ReactNode } from 'react';
import type { TFunction } from 'i18next';
import {
  AgentIcon,
  BanIcon,
  ChartIcon,
  HealthIcon,
  ReportIcon,
  ServerIcon,
  SettingsIcon,
  TrafficIcon,
  UsersIcon,
  WarningIcon,
} from './components/BanSystemIcons';
import type { BanSystemTabType } from './types';

export interface BanSystemTab {
  id: BanSystemTabType;
  label: string;
  icon: ReactNode;
}

export function getBanSystemTabs(t: TFunction): BanSystemTab[] {
  return [
    { id: 'dashboard', label: t('banSystem.tabs.dashboard'), icon: <ChartIcon /> },
    { id: 'users', label: t('banSystem.tabs.users'), icon: <UsersIcon /> },
    { id: 'punishments', label: t('banSystem.tabs.punishments'), icon: <BanIcon /> },
    { id: 'nodes', label: t('banSystem.tabs.nodes'), icon: <ServerIcon /> },
    { id: 'agents', label: t('banSystem.tabs.agents'), icon: <AgentIcon /> },
    { id: 'violations', label: t('banSystem.tabs.violations'), icon: <WarningIcon /> },
    { id: 'traffic', label: t('banSystem.tabs.traffic'), icon: <TrafficIcon /> },
    { id: 'reports', label: t('banSystem.tabs.reports'), icon: <ReportIcon /> },
    { id: 'settings', label: t('banSystem.tabs.settings'), icon: <SettingsIcon /> },
    { id: 'health', label: t('banSystem.tabs.health'), icon: <HealthIcon /> },
  ];
}
