import { useCallback, useEffect, useRef, useState } from 'react';
import type { TFunction } from 'i18next';
import {
  banSystemApi,
  type BanAgentsListResponse,
  type BanHealthResponse,
  type BanNodesListResponse,
  type BanPunishmentsListResponse,
  type BanReportResponse,
  type BanSettingsResponse,
  type BanSystemStats,
  type BanSystemStatus,
  type BanTrafficResponse,
  type BanTrafficViolationsResponse,
  type BanUserDetailResponse,
  type BanUsersListResponse,
} from '../../../api/banSystem';
import type { BanSystemTabType } from '../types';

interface UseAdminBanSystemDataParams {
  t: TFunction;
}

export function useAdminBanSystemData({ t }: UseAdminBanSystemDataParams) {
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
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const formatSettingKey = useCallback(
    (key: string): string => {
      const translated = t(`banSystem.settings.${key}`, { defaultValue: '' });
      if (translated && translated !== `banSystem.settings.${key}`) {
        return translated;
      }

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
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (status?.enabled && status?.configured) {
      void loadTabData(activeTab);
    }
  }, [activeTab, status, loadTabData]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      void loadTabData('users');
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
  }, [loadTabData, searchQuery, t]);

  const handleViewUser = useCallback(
    async (email: string) => {
      try {
        setActionLoading(email);
        const data = await banSystemApi.getUser(email);
        setSelectedUser(data);
      } catch {
        setError(t('banSystem.loadError'));
      } finally {
        setActionLoading(null);
      }
    },
    [t],
  );

  const handleUnban = useCallback(
    async (userId: string) => {
      try {
        setActionLoading(userId);
        await banSystemApi.unbanUser(userId);
        void loadTabData('punishments');
      } catch {
        setError(t('banSystem.loadError'));
      } finally {
        setActionLoading(null);
      }
    },
    [loadTabData, t],
  );

  const handleToggleSetting = useCallback(
    async (key: string) => {
      try {
        setSettingLoading(key);
        await banSystemApi.toggleSetting(key);
        void loadTabData('settings');
      } catch {
        setError(t('banSystem.loadError'));
      } finally {
        setSettingLoading(null);
      }
    },
    [loadTabData, t],
  );

  const handleSetSetting = useCallback(
    async (key: string, value: string) => {
      try {
        setSettingLoading(key);
        await banSystemApi.setSetting(key, value);
        void loadTabData('settings');
      } catch {
        setError(t('banSystem.loadError'));
      } finally {
        setSettingLoading(null);
      }
    },
    [loadTabData, t],
  );

  const handleIntDraftChange = useCallback((key: string, value: string) => {
    setSettingDrafts((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleIntSettingSave = useCallback(
    async (key: string) => {
      const draft = settingDrafts[key];
      if (draft === undefined) return;
      await handleSetSetting(key, draft);
    },
    [handleSetSetting, settingDrafts],
  );

  const handleReportPeriodChange = useCallback((hours: number) => {
    setReportHours(hours);
  }, []);

  useEffect(() => {
    if (activeTab === 'reports' && status?.enabled) {
      void loadTabData('reports');
    }
  }, [reportHours, activeTab, status, loadTabData]);

  return {
    activeTab,
    setActiveTab,
    status,
    stats,
    users,
    selectedUser,
    setSelectedUser,
    punishments,
    nodes,
    agents,
    violations,
    settings,
    traffic,
    report,
    health,
    reportHours,
    settingLoading,
    settingSearch,
    setSettingSearch,
    showEditableOnly,
    setShowEditableOnly,
    settingDrafts,
    collapsedSettingCategories,
    setCollapsedSettingCategories,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    actionLoading,
    loadTabData,
    handleSearch,
    handleViewUser,
    handleUnban,
    handleToggleSetting,
    handleSetSetting,
    handleIntDraftChange,
    handleIntSettingSave,
    handleReportPeriodChange,
    formatSettingKey,
    formatCategory,
  };
}
