import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  banSystemApi,
  type BanSystemStatus,
  type BanSystemStats,
  type BanUsersListResponse,
  type BanUserDetailResponse,
  type BanPunishmentsListResponse,
  type BanNodesListResponse,
  type BanAgentsListResponse,
  type BanTrafficViolationsResponse,
  type BanSettingsResponse,
  type BanTrafficResponse,
  type BanReportResponse,
  type BanHealthResponse,
} from '../api/banSystem';
import {
  AgentIcon,
  BanIcon,
  ChartIcon,
  RefreshIcon,
  ServerIcon,
  ShieldIcon,
  UsersIcon,
  WarningIcon,
} from './adminBanSystem/components/BanSystemIcons';
import { getBanSystemTabs } from './adminBanSystem/constants';
import { BanSystemAgentsTab } from './adminBanSystem/components/BanSystemAgentsTab';
import { BanSystemHealthTab } from './adminBanSystem/components/BanSystemHealthTab';
import { BanSystemNodesTab } from './adminBanSystem/components/BanSystemNodesTab';
import { BanSystemPunishmentsTab } from './adminBanSystem/components/BanSystemPunishmentsTab';
import { BanSystemReportsTab } from './adminBanSystem/components/BanSystemReportsTab';
import { BanSystemSettingsTab } from './adminBanSystem/components/BanSystemSettingsTab';
import { BanSystemTrafficTab } from './adminBanSystem/components/BanSystemTrafficTab';
import { BanSystemUserDetailModal } from './adminBanSystem/components/BanSystemUserDetailModal';
import { BanSystemUsersTab } from './adminBanSystem/components/BanSystemUsersTab';
import { BanSystemViolationsTab } from './adminBanSystem/components/BanSystemViolationsTab';
import { StatCard } from './adminBanSystem/components/StatCard';
import type { BanSystemTabType } from './adminBanSystem/types';

export default function AdminBanSystem() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<BanSystemTabType>('dashboard');
  const [status, setStatus] = useState<BanSystemStatus | null>(null);
  const [stats, setStats] = useState<BanSystemStats | null>(null);
  const [users, setUsers] = useState<BanUsersListResponse | null>(null);
  const [selectedUser, setSelectedUser] = useState<BanUserDetailResponse | null>(null);
  const [punishments, setPunishments] = useState<BanPunishmentsListResponse | null>(null);
  const [nodes, setNodes] = useState<BanNodesListResponse | null>(null);
  const [agents, setAgents] = useState<BanAgentsListResponse | null>(null);
  const [violations, setViolations] = useState<BanTrafficViolationsResponse | null>(null);
  const [settings, setSettings] = useState<BanSettingsResponse | null>(null);
  const [traffic, setTraffic] = useState<BanTrafficResponse | null>(null);
  const [report, setReport] = useState<BanReportResponse | null>(null);
  const [health, setHealth] = useState<BanHealthResponse | null>(null);
  const [reportHours, setReportHours] = useState(24);
  const reportHoursRef = useRef(reportHours);
  reportHoursRef.current = reportHours;
  const [settingLoading, setSettingLoading] = useState<string | null>(null);
  const [settingSearch, setSettingSearch] = useState('');
  const [showEditableOnly, setShowEditableOnly] = useState(false);
  const [settingDrafts, setSettingDrafts] = useState<Record<string, string>>({});
  const [collapsedSettingCategories, setCollapsedSettingCategories] = useState<
    Record<string, boolean>
  >({});
  const [loading, setLoading] = useState(true);

  // Format snake_case to readable label
  const formatSettingKey = useCallback(
    (key: string): string => {
      // Try translation first
      const translated = t(`banSystem.settings.${key}`, { defaultValue: '' });
      if (translated && translated !== `banSystem.settings.${key}`) {
        return translated;
      }
      // Fallback: convert snake_case to Title Case
      return key
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    },
    [t],
  );

  const formatCategory = useCallback(
    (category: string): string => {
      const translated = t(`banSystem.settings.categories.${category}`, { defaultValue: '' });
      if (translated && translated !== `banSystem.settings.categories.${category}`) {
        return translated;
      }
      return category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ');
    },
    [t],
  );
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!settings) return;
    setSettingDrafts((prev) => {
      const next = { ...prev };
      settings.settings.forEach((setting) => {
        if (setting.type === 'int') {
          next[setting.key] = String(setting.value);
        }
      });
      return next;
    });
  }, [settings]);

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      const data = await banSystemApi.getStatus();
      setStatus(data);
      if (!data.enabled || !data.configured) {
        setError(t('banSystem.notConfigured'));
      }
    } catch {
      setError(t('banSystem.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadTabData = useCallback(
    async (tab: BanSystemTabType) => {
      try {
        setLoading(true);
        setError(null);

        switch (tab) {
          case 'dashboard': {
            const statsData = await banSystemApi.getStats();
            setStats(statsData);
            break;
          }
          case 'users': {
            const usersData = await banSystemApi.getUsers({ limit: 50 });
            setUsers(usersData);
            break;
          }
          case 'punishments': {
            const punishmentsData = await banSystemApi.getPunishments();
            setPunishments(punishmentsData);
            break;
          }
          case 'nodes': {
            const nodesData = await banSystemApi.getNodes();
            setNodes(nodesData);
            break;
          }
          case 'agents': {
            const agentsData = await banSystemApi.getAgents();
            setAgents(agentsData);
            break;
          }
          case 'violations': {
            const violationsData = await banSystemApi.getTrafficViolations();
            setViolations(violationsData);
            break;
          }
          case 'settings': {
            const settingsData = await banSystemApi.getSettings();
            setSettings(settingsData);
            break;
          }
          case 'traffic': {
            const trafficData = await banSystemApi.getTraffic();
            setTraffic(trafficData);
            break;
          }
          case 'reports': {
            const reportData = await banSystemApi.getReport(reportHoursRef.current);
            setReport(reportData);
            break;
          }
          case 'health': {
            const healthData = await banSystemApi.getHealth();
            setHealth(healthData);
            break;
          }
        }
      } catch {
        setError(t('banSystem.loadError'));
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (status?.enabled && status?.configured) {
      loadTabData(activeTab);
    }
  }, [activeTab, status, loadTabData]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadTabData('users');
      return;
    }
    try {
      setLoading(true);
      const data = await banSystemApi.searchUsers(searchQuery);
      setUsers(data);
    } catch {
      setError(t('banSystem.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = async (email: string) => {
    try {
      setActionLoading(email);
      const data = await banSystemApi.getUser(email);
      setSelectedUser(data);
    } catch {
      setError(t('banSystem.loadError'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnban = async (userId: string) => {
    try {
      setActionLoading(userId);
      await banSystemApi.unbanUser(userId);
      loadTabData('punishments');
    } catch {
      setError(t('banSystem.loadError'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleSetting = async (key: string) => {
    try {
      setSettingLoading(key);
      await banSystemApi.toggleSetting(key);
      loadTabData('settings');
    } catch {
      setError(t('banSystem.loadError'));
    } finally {
      setSettingLoading(null);
    }
  };

  const handleSetSetting = async (key: string, value: string) => {
    try {
      setSettingLoading(key);
      await banSystemApi.setSetting(key, value);
      loadTabData('settings');
    } catch {
      setError(t('banSystem.loadError'));
    } finally {
      setSettingLoading(null);
    }
  };

  const handleIntDraftChange = (key: string, value: string) => {
    setSettingDrafts((prev) => ({ ...prev, [key]: value }));
  };

  const handleIntSettingSave = async (key: string) => {
    const draft = settingDrafts[key];
    if (draft === undefined) return;
    await handleSetSetting(key, draft);
  };

  const handleReportPeriodChange = (hours: number) => {
    setReportHours(hours);
  };

  useEffect(() => {
    if (activeTab === 'reports' && status?.enabled) {
      loadTabData('reports');
    }
  }, [reportHours, activeTab, status, loadTabData]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatUptime = (seconds: number | null) => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  const tabs = getBanSystemTabs(t);

  if (loading && !status) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
      </div>
    );
  }

  if (error && !status?.enabled) {
    return (
      <div className="flex min-h-[60vh] animate-fade-in items-center justify-center">
        <div className="mx-4 w-full max-w-md">
          {/* Card */}
          <div className="rounded-2xl border border-dark-700 bg-dark-800/50 p-8 text-center shadow-2xl backdrop-blur-xl">
            {/* Icon */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-error-500/20 to-warning-500/20">
                  <svg
                    className="h-10 w-10 text-error-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                  </svg>
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-dark-600 bg-dark-800">
                  <svg
                    className="h-3.5 w-3.5 text-dark-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Title */}
            <h2 className="mb-2 text-xl font-bold text-dark-100">{t('banSystem.title')}</h2>

            {/* Error message */}
            <p className="mb-2 font-medium text-error-400">{error}</p>

            {/* Hint */}
            <p className="mb-8 text-sm text-dark-400">{t('banSystem.configureHint')}</p>

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              {/* Telegram Button */}
              <a
                href="https://t.me/fringg"
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#0088cc] to-[#0099dd] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:from-[#0077bb] hover:to-[#0088cc] hover:shadow-lg hover:shadow-[#0088cc]/20"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
                {t('banSystem.contactTelegram')}
              </a>

              {/* Back Button */}
              <button
                onClick={() => window.history.back()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dark-600 bg-dark-700 px-4 py-2 text-sm font-medium text-dark-200 transition-all duration-200 hover:border-dark-500 hover:bg-dark-600 hover:text-dark-100"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                  />
                </svg>
                {t('common.back')}
              </button>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -left-20 top-1/4 h-40 w-40 rounded-full bg-accent-500/5 blur-3xl" />
            <div className="absolute -right-20 bottom-1/4 h-40 w-40 rounded-full bg-error-500/5 blur-3xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-xl bg-error-500/20 p-3">
            <ShieldIcon />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-dark-100 sm:text-2xl">
              {t('banSystem.title')}
            </h1>
            <p className="truncate text-sm text-dark-400 sm:text-base">{t('banSystem.subtitle')}</p>
          </div>
        </div>
        <button
          onClick={() => loadTabData(activeTab)}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-dark-800 px-4 py-2 text-dark-300 transition-colors hover:bg-dark-700 hover:text-dark-100 disabled:opacity-50 sm:w-auto"
        >
          <RefreshIcon />
          {t('common.refresh')}
        </button>
      </div>

      {/* Tabs */}
      <div className="space-y-2 border-b border-dark-700 pb-2">
        <div className="md:hidden">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as BanSystemTabType)}
            className="input w-full"
            aria-label={t('banSystem.title')}
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>
        <div className="hidden gap-2 overflow-x-auto md:flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-accent-500/20 text-accent-400'
                  : 'text-dark-400 hover:bg-dark-800 hover:text-dark-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="py-8 text-center text-error-400">{error}</div>
      ) : (
        <>
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && stats && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard
                title={t('banSystem.stats.activeUsers')}
                value={stats.active_users}
                subtitle={`${t('banSystem.stats.total')}: ${stats.total_users}`}
                icon={<UsersIcon />}
                color="success"
              />
              <StatCard
                title={t('banSystem.stats.usersOverLimit')}
                value={stats.users_over_limit}
                icon={<WarningIcon />}
                color="warning"
              />
              <StatCard
                title={t('banSystem.stats.activeBans')}
                value={stats.active_punishments}
                subtitle={`${t('banSystem.stats.total')}: ${stats.total_punishments}`}
                icon={<BanIcon />}
                color="error"
              />
              <StatCard
                title={t('banSystem.stats.nodesOnline')}
                value={`${stats.nodes_online}/${stats.nodes_total}`}
                icon={<ServerIcon />}
                color="accent"
              />
              <StatCard
                title={t('banSystem.stats.agentsOnline')}
                value={`${stats.agents_online}/${stats.agents_total}`}
                icon={<AgentIcon />}
                color="info"
              />
              <StatCard
                title={t('banSystem.stats.totalRequests')}
                value={stats.total_requests.toLocaleString()}
                icon={<ChartIcon />}
                color="accent"
              />
              <StatCard
                title={t('banSystem.stats.panelStatus')}
                value={
                  stats.panel_connected
                    ? t('banSystem.stats.connected')
                    : t('banSystem.stats.disconnected')
                }
                icon={<ServerIcon />}
                color={stats.panel_connected ? 'success' : 'error'}
              />
              <StatCard
                title={t('banSystem.stats.uptime')}
                value={formatUptime(stats.uptime_seconds)}
                icon={<ChartIcon />}
                color="info"
              />
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <BanSystemUsersTab
              t={t}
              users={users}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              actionLoading={actionLoading}
              handleSearch={handleSearch}
              handleViewUser={handleViewUser}
            />
          )}

          {/* Punishments Tab */}
          {activeTab === 'punishments' && (
            <BanSystemPunishmentsTab
              t={t}
              punishments={punishments}
              actionLoading={actionLoading}
              formatDate={formatDate}
              onUnban={handleUnban}
            />
          )}

          {/* Nodes Tab */}
          {activeTab === 'nodes' && <BanSystemNodesTab t={t} nodes={nodes} />}

          {/* Agents Tab */}
          {activeTab === 'agents' && <BanSystemAgentsTab t={t} agents={agents} />}

          {/* Violations Tab */}
          {activeTab === 'violations' && (
            <BanSystemViolationsTab t={t} violations={violations} formatDate={formatDate} />
          )}

          {/* Traffic Tab */}
          {activeTab === 'traffic' && traffic && (
            <BanSystemTrafficTab
              t={t}
              traffic={traffic}
              formatDate={formatDate}
              formatBytes={formatBytes}
            />
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <BanSystemReportsTab
              t={t}
              report={report}
              reportHours={reportHours}
              onReportPeriodChange={handleReportPeriodChange}
            />
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && settings && (
            <BanSystemSettingsTab
              settings={settings}
              nodes={nodes}
              settingSearch={settingSearch}
              setSettingSearch={setSettingSearch}
              showEditableOnly={showEditableOnly}
              setShowEditableOnly={setShowEditableOnly}
              settingDrafts={settingDrafts}
              collapsedSettingCategories={collapsedSettingCategories}
              setCollapsedSettingCategories={setCollapsedSettingCategories}
              settingLoading={settingLoading}
              formatSettingKey={formatSettingKey}
              formatCategory={formatCategory}
              handleToggleSetting={handleToggleSetting}
              handleIntDraftChange={handleIntDraftChange}
              handleIntSettingSave={handleIntSettingSave}
              handleSetSetting={handleSetSetting}
            />
          )}

          {/* Health Tab */}
          {activeTab === 'health' && health && (
            <BanSystemHealthTab t={t} health={health} formatUptime={formatUptime} />
          )}
        </>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <BanSystemUserDetailModal t={t} user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  );
}
