import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SettingDefinition, adminSettingsApi } from '../../api/adminSettings';
import { ChevronDownIcon, StarIcon } from './icons';
import { SettingRow } from './SettingRow';

export interface CategoryGroup {
  key: string;
  label: string;
  settings: SettingDefinition[];
}

interface SettingsTabProps {
  categories: CategoryGroup[];
  searchQuery: string;
  filteredSettings: SettingDefinition[];
  isFavorite: (key: string) => boolean;
  toggleFavorite: (key: string) => void;
  isFavoriteCategory: (key: string) => boolean;
  toggleFavoriteCategory: (key: string) => void;
  focusedCategoryKey?: string | null;
  onFocusedCategoryHandled?: () => void;
}

export function SettingsTab({
  categories,
  searchQuery,
  filteredSettings,
  isFavorite,
  toggleFavorite,
  isFavoriteCategory,
  toggleFavoriteCategory,
  focusedCategoryKey,
  onFocusedCategoryHandled,
}: SettingsTabProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const updateSettingMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      adminSettingsApi.updateSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
  });

  const resetSettingMutation = useMutation({
    mutationFn: (key: string) => adminSettingsApi.resetSetting(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
  });

  useEffect(() => {
    if (categories.length === 0) return;

    setExpandedSections((prev) => {
      if (prev.size > 0) return prev;
      return new Set([categories[0].key]);
    });
  }, [categories]);

  useEffect(() => {
    if (!focusedCategoryKey) return;
    if (!categories.some((category) => category.key === focusedCategoryKey)) return;

    setExpandedSections((prev) => {
      if (prev.has(focusedCategoryKey)) return prev;
      const next = new Set(prev);
      next.add(focusedCategoryKey);
      return next;
    });

    requestAnimationFrame(() => {
      categoryRefs.current[focusedCategoryKey]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      onFocusedCategoryHandled?.();
    });
  }, [categories, focusedCategoryKey, onFocusedCategoryHandled]);

  const openCategory = (key: string) => {
    setExpandedSections((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });

    requestAnimationFrame(() => {
      categoryRefs.current[key]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  // If searching, show flat list
  if (searchQuery) {
    return (
      <div className="space-y-4">
        {filteredSettings.length === 0 ? (
          <div className="rounded-2xl border border-dark-700/30 bg-dark-800/30 p-12 text-center">
            <p className="text-dark-400">{t('admin.settings.noSettings')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filteredSettings.map((setting) => (
              <SettingRow
                key={setting.key}
                setting={setting}
                isFavorite={isFavorite(setting.key)}
                onToggleFavorite={() => toggleFavorite(setting.key)}
                onUpdate={(value) => updateSettingMutation.mutate({ key: setting.key, value })}
                onReset={() => resetSettingMutation.mutate(setting.key)}
                isUpdating={updateSettingMutation.isPending}
                isResetting={resetSettingMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Show accordion for subcategories
  return (
    <div className="space-y-3">
      {categories.length > 0 && (
        <div className="rounded-2xl border border-dark-700/30 bg-dark-800/20 p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-dark-100">
                {t('admin.settings.quickNavigation')}
              </p>
              <p className="text-xs text-dark-500">{t('admin.settings.quickNavigationHint')}</p>
            </div>
            <span className="rounded-full bg-dark-700 px-2 py-1 text-xs text-dark-400">
              {categories.length}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
            {categories.map((cat) => {
              const categoryIsFavorite = isFavoriteCategory(cat.key);
              return (
                <div
                  key={`shortcut-${cat.key}`}
                  className="flex items-center gap-2 rounded-xl border border-dark-700/40 bg-dark-900/30 p-2"
                >
                  <button
                    type="button"
                    onClick={() => openCategory(cat.key)}
                    className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-dark-800/60"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-dark-100">
                        {cat.label}
                      </span>
                      <span className="block text-xs text-dark-500">
                        {t('admin.settings.settingsCountLabel', { count: cat.settings.length })}
                      </span>
                    </span>
                    <ChevronDownIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFavoriteCategory(cat.key)}
                    className={`rounded-lg p-2 transition-colors ${
                      categoryIsFavorite
                        ? 'bg-warning-500/15 text-warning-400'
                        : 'text-dark-500 hover:bg-dark-700/60 hover:text-warning-400'
                    }`}
                    title={
                      categoryIsFavorite
                        ? t('admin.settings.removeCategoryFromFavorites')
                        : t('admin.settings.addCategoryToFavorites')
                    }
                  >
                    <StarIcon filled={categoryIsFavorite} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {categories.map((cat) => {
        const isExpanded = expandedSections.has(cat.key);
        const categoryIsFavorite = isFavoriteCategory(cat.key);
        return (
          <div
            key={cat.key}
            ref={(node) => {
              categoryRefs.current[cat.key] = node;
            }}
            className="overflow-hidden rounded-2xl border border-dark-700/30 bg-dark-800/30"
          >
            {/* Accordion header */}
            <div className="flex items-center gap-2 p-3 pr-4 sm:p-4">
              <button
                onClick={() => toggleSection(cat.key)}
                className="flex min-w-0 flex-1 items-center justify-between transition-colors hover:text-dark-100"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="truncate font-medium text-dark-100">{cat.label}</span>
                  <span className="rounded-full bg-dark-700 px-2 py-0.5 text-xs text-dark-400">
                    {cat.settings.length}
                  </span>
                </div>
                <div
                  className={`text-dark-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                >
                  <ChevronDownIcon />
                </div>
              </button>
              <button
                type="button"
                onClick={() => toggleFavoriteCategory(cat.key)}
                className={`rounded-lg p-2 transition-colors ${
                  categoryIsFavorite
                    ? 'bg-warning-500/15 text-warning-400'
                    : 'text-dark-500 hover:bg-dark-700/60 hover:text-warning-400'
                }`}
                title={
                  categoryIsFavorite
                    ? t('admin.settings.removeCategoryFromFavorites')
                    : t('admin.settings.addCategoryToFavorites')
                }
              >
                <StarIcon filled={categoryIsFavorite} />
              </button>
            </div>

            {/* Accordion content */}
            {isExpanded && (
              <div className="border-t border-dark-700/30 p-4 pt-0">
                <div className="grid grid-cols-1 gap-4 pt-4 lg:grid-cols-2">
                  {cat.settings.map((setting) => (
                    <SettingRow
                      key={setting.key}
                      setting={setting}
                      isFavorite={isFavorite(setting.key)}
                      onToggleFavorite={() => toggleFavorite(setting.key)}
                      onUpdate={(value) =>
                        updateSettingMutation.mutate({ key: setting.key, value })
                      }
                      onReset={() => resetSettingMutation.mutate(setting.key)}
                      isUpdating={updateSettingMutation.isPending}
                      isResetting={resetSettingMutation.isPending}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {categories.length === 0 && (
        <div className="rounded-2xl border border-dark-700/30 bg-dark-800/30 p-12 text-center">
          <p className="text-dark-400">{t('admin.settings.noSettings')}</p>
        </div>
      )}
    </div>
  );
}
