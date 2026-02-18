import type { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import type { BanNodesListResponse, BanSettingsResponse } from '@/api/banSystem';
import { SearchIcon } from './BanSystemIcons';
import {
  filterBanSettings,
  groupBanSettingsByCategory,
  sortBanSettingCategories,
} from '../utils/settings';

interface BanSystemSettingsTabProps {
  settings: BanSettingsResponse;
  nodes: BanNodesListResponse | null;
  settingSearch: string;
  setSettingSearch: (value: string) => void;
  showEditableOnly: boolean;
  setShowEditableOnly: (value: boolean) => void;
  settingDrafts: Record<string, string>;
  collapsedSettingCategories: Record<string, boolean>;
  setCollapsedSettingCategories: Dispatch<SetStateAction<Record<string, boolean>>>;
  settingLoading: string | null;
  formatSettingKey: (key: string) => string;
  formatCategory: (category: string) => string;
  handleToggleSetting: (key: string) => void;
  handleIntDraftChange: (key: string, value: string) => void;
  handleIntSettingSave: (key: string) => void;
  handleSetSetting: (key: string, value: string) => void;
}

export function BanSystemSettingsTab({
  settings,
  nodes,
  settingSearch,
  setSettingSearch,
  showEditableOnly,
  setShowEditableOnly,
  settingDrafts,
  collapsedSettingCategories,
  setCollapsedSettingCategories,
  settingLoading,
  formatSettingKey,
  formatCategory,
  handleToggleSetting,
  handleIntDraftChange,
  handleIntSettingSave,
  handleSetSetting,
}: BanSystemSettingsTabProps) {
  const { t } = useTranslation();
  const normalizedQuery = settingSearch.trim().toLowerCase();
  const grouped = groupBanSettingsByCategory(settings.settings);
  const sortedCategories = sortBanSettingCategories(Object.keys(grouped));

  const renderedCategories = sortedCategories
    .map((category) => {
      const categorySettings = filterBanSettings(grouped[category], {
        showEditableOnly,
        normalizedQuery,
        formatSettingKey,
      });

      if (categorySettings.length === 0) return null;

      const isCollapsed = collapsedSettingCategories[category] ?? false;

      return (
        <div
          key={category}
          className="overflow-hidden rounded-xl border border-dark-700 bg-dark-800/50"
        >
          <button
            type="button"
            onClick={() =>
              setCollapsedSettingCategories((prev) => ({
                ...prev,
                [category]: !isCollapsed,
              }))
            }
            className="flex w-full items-center justify-between border-b border-dark-700 p-4 text-left transition-colors hover:bg-dark-700/40"
            aria-expanded={!isCollapsed}
            aria-controls={`settings-${category}`}
          >
            <h3 className="text-sm font-medium text-dark-200">{formatCategory(category)}</h3>
            <div className="flex items-center gap-3 text-xs text-dark-500">
              <span>{categorySettings.length}</span>
              <span>{isCollapsed ? '▾' : '▴'}</span>
            </div>
          </button>
          {!isCollapsed && (
            <div id={`settings-${category}`} className="divide-y divide-dark-700">
              {categorySettings.map((setting) => (
                <div
                  key={setting.key}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-dark-100">
                        {formatSettingKey(setting.key)}
                      </div>
                      {!setting.editable && (
                        <span className="rounded bg-dark-700 px-1.5 py-0.5 text-[10px] text-dark-400">
                          RO
                        </span>
                      )}
                    </div>
                    {setting.description && (
                      <div className="mt-0.5 text-xs text-dark-500">{setting.description}</div>
                    )}
                  </div>
                  <div className="w-full sm:w-auto sm:flex-shrink-0">
                    {setting.type === 'bool' ? (
                      <button
                        onClick={() => handleToggleSetting(setting.key)}
                        disabled={!setting.editable || settingLoading === setting.key}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          setting.value ? 'bg-accent-500' : 'bg-dark-600'
                        } ${!setting.editable ? 'cursor-not-allowed opacity-50' : ''}`}
                        aria-label={formatSettingKey(setting.key)}
                        aria-pressed={Boolean(setting.value)}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            setting.value ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    ) : setting.type === 'int' ? (
                      <div className="flex w-full gap-2 sm:w-auto">
                        <input
                          type="number"
                          value={settingDrafts[setting.key] ?? String(setting.value)}
                          onChange={(e) => handleIntDraftChange(setting.key, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleIntSettingSave(setting.key);
                            }
                          }}
                          min={setting.min_value ?? undefined}
                          max={setting.max_value ?? undefined}
                          disabled={!setting.editable || settingLoading === setting.key}
                          className="input w-full sm:w-24"
                        />
                        <button
                          type="button"
                          onClick={() => handleIntSettingSave(setting.key)}
                          disabled={
                            !setting.editable ||
                            settingLoading === setting.key ||
                            (settingDrafts[setting.key] ?? String(setting.value)) ===
                              String(setting.value)
                          }
                          className="rounded-lg bg-accent-500/20 px-3 py-2 text-xs font-medium text-accent-400 transition-colors hover:bg-accent-500/30 disabled:opacity-50"
                        >
                          {t('common.save', { defaultValue: 'Сохранить' })}
                        </button>
                      </div>
                    ) : setting.type === 'list' ? (
                      <div className="flex flex-wrap gap-1.5 sm:max-w-xs sm:justify-end">
                        {Array.isArray(setting.value) && setting.value.length > 0 ? (
                          setting.value.map((item, idx) => (
                            <span
                              key={idx}
                              className="rounded bg-accent-500/20 px-2 py-0.5 text-xs text-accent-400"
                            >
                              {String(item)}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-dark-500">{t('common.noData')}</span>
                        )}
                        {setting.editable && nodes && setting.key.includes('nodes') && (
                          <select
                            className="input py-1 text-xs"
                            onChange={(e) => {
                              if (e.target.value) {
                                const currentList = Array.isArray(setting.value)
                                  ? setting.value
                                  : [];
                                if (!currentList.includes(e.target.value)) {
                                  handleSetSetting(
                                    setting.key,
                                    [...currentList, e.target.value].join(','),
                                  );
                                }
                                e.target.value = '';
                              }
                            }}
                            disabled={settingLoading === setting.key}
                            aria-label={formatSettingKey(setting.key)}
                          >
                            <option value="">+ {t('common.add')}</option>
                            {nodes.nodes
                              .filter(
                                (n) =>
                                  !Array.isArray(setting.value) || !setting.value.includes(n.name),
                              )
                              .map((n) => (
                                <option key={n.name} value={n.name}>
                                  {n.name}
                                </option>
                              ))}
                          </select>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-dark-300">{String(setting.value)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    })
    .filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-dark-500">
            <SearchIcon />
          </div>
          <input
            type="text"
            value={settingSearch}
            onChange={(e) => setSettingSearch(e.target.value)}
            placeholder={t('banSystem.settings.searchPlaceholder', {
              defaultValue: 'Поиск по настройкам',
            })}
            className="input pl-10"
            aria-label={t('banSystem.settings.searchPlaceholder', {
              defaultValue: 'Поиск по настройкам',
            })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-dark-300">
          <input
            type="checkbox"
            checked={showEditableOnly}
            onChange={(e) => setShowEditableOnly(e.target.checked)}
            className="h-4 w-4 rounded border-dark-600 bg-dark-800 text-accent-500 focus:ring-accent-500"
          />
          {t('banSystem.settings.onlyEditable', { defaultValue: 'Только изменяемые' })}
        </label>
      </div>

      {renderedCategories.length === 0 ? (
        <div className="py-8 text-center text-dark-500">{t('common.noData')}</div>
      ) : (
        renderedCategories
      )}
    </div>
  );
}
