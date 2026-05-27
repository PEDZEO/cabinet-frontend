import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { adminSettingsApi, SettingDefinition } from '../api/adminSettings';
import { themeColorsApi } from '../api/themeColors';
import { useFavoriteSettings } from '../hooks/useFavoriteSettings';
import { useFavoriteSettingCategories } from '../hooks/useFavoriteSettingCategories';
import {
  SETTINGS_TREE,
  TreeGroup,
  TreeSubItem,
  findTreeLocation,
  formatSettingKey,
} from '../components/admin';
import { usePlatform } from '../platform/hooks/usePlatform';
import { AnalyticsTab } from '../components/admin/AnalyticsTab';
import { BrandingTab } from '../components/admin/BrandingTab';
import { MenuEditorTab } from '../components/admin/MenuEditorTab';
import { ThemeTab } from '../components/admin/ThemeTab';
import { FavoritesTab } from '../components/admin/FavoritesTab';
import { CategoryGroup, SettingsTab } from '../components/admin/SettingsTab';
import { SettingsTreeSidebar } from '../components/admin/SettingsTreeSidebar';
import { SettingsMobileTabs } from '../components/admin/SettingsMobileTabs';
import { SettingsSearchMobile, SettingsSearchResults } from '../components/admin/SettingsSearch';

const DEFAULT_SECTION = 'branding';
const TARIFF_MODE_SETTINGS = ['MULTI_TARIFF_ENABLED', 'MAX_ACTIVE_SUBSCRIPTIONS'];

type ActiveTreeInfo = {
  group: TreeGroup;
  child: TreeSubItem;
};

const BackIcon = () => (
  <svg
    className="h-5 w-5 text-dark-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg
    className="h-3.5 w-3.5 text-dark-600"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

function getTreeInfo(sectionId: string): ActiveTreeInfo | null {
  for (const group of SETTINGS_TREE.groups) {
    const child = group.children.find((item) => item.id === sectionId);
    if (child) return { group, child };
  }
  return null;
}

function normalizeSection(sectionId?: string | null, categoryKey?: string | null): string {
  if (categoryKey) {
    const location = findTreeLocation(categoryKey);
    if (location) return location.subItemId;
  }

  if (!sectionId) return DEFAULT_SECTION;

  if (SETTINGS_TREE.specialItems.some((item) => item.id === sectionId)) {
    return sectionId;
  }

  if (getTreeInfo(sectionId)) return sectionId;

  const group = SETTINGS_TREE.groups.find((item) => item.id === sectionId);
  if (group?.children[0]) return group.children[0].id;

  return DEFAULT_SECTION;
}

export default function AdminSettings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { capabilities } = usePlatform();

  const [activeSection, setActiveSection] = useState(() =>
    normalizeSection(searchParams.get('section'), searchParams.get('category')),
  );
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [focusedCategoryKey, setFocusedCategoryKey] = useState<string | null>(() =>
    searchParams.get('category'),
  );

  const { favorites, toggleFavorite, isFavorite } = useFavoriteSettings();
  const {
    favorites: favoriteCategoryKeys,
    toggleFavoriteCategory,
    isFavoriteCategory,
  } = useFavoriteSettingCategories();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeSection]);

  const { data: themeColors } = useQuery({
    queryKey: ['theme-colors'],
    queryFn: themeColorsApi.getColors,
  });

  const { data: allSettings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminSettingsApi.getSettings(),
  });

  useEffect(() => {
    const section = searchParams.get('section');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    setActiveSection(normalizeSection(section, category));
    setFocusedCategoryKey(category);
    setSearchQuery(search || '');
  }, [searchParams]);

  const activeTreeInfo = useMemo(() => getTreeInfo(activeSection), [activeSection]);

  const isTariffsMode = useMemo(() => {
    if (!allSettings || !Array.isArray(allSettings)) return false;
    const salesMode = allSettings.find((setting) => setting.key === 'SALES_MODE');
    return salesMode?.current === 'tariffs';
  }, [allSettings]);

  const shouldHideSetting = useCallback(
    (setting: SettingDefinition) => !isTariffsMode && TARIFF_MODE_SETTINGS.includes(setting.key),
    [isTariffsMode],
  );

  const handleSectionChange = useCallback(
    (sectionId: string) => {
      const normalizedSection = normalizeSection(sectionId);
      setActiveSection(normalizedSection);

      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('section', normalizedSection);
      nextParams.delete('category');
      nextParams.delete('search');
      setFocusedCategoryKey(null);
      setSearchParams(nextParams);
    },
    [searchParams, setSearchParams],
  );

  const currentCategories = useMemo(() => {
    if (!activeTreeInfo || !allSettings || !Array.isArray(allSettings)) return [];

    const categoryKeys = activeTreeInfo.child.categories;
    const categoryMap = new Map<string, SettingDefinition[]>();

    for (const setting of allSettings) {
      if (!categoryKeys.includes(setting.category.key)) continue;
      if (shouldHideSetting(setting)) continue;

      if (!categoryMap.has(setting.category.key)) {
        categoryMap.set(setting.category.key, []);
      }
      categoryMap.get(setting.category.key)!.push(setting);
    }

    return Array.from(categoryMap.entries()).map(([key, settings]) => {
      const categoryLabel = settings[0]?.category.label || key;
      return {
        key,
        label: t(`admin.settings.categories.${key}`, categoryLabel),
        settings,
      };
    });
  }, [activeTreeInfo, allSettings, shouldHideSetting, t]);

  const allCategoryGroups = useMemo(() => {
    if (!allSettings || !Array.isArray(allSettings)) return [];

    const categoryMap = new Map<
      string,
      CategoryGroup & {
        sectionId: string;
        sectionLabel: string;
      }
    >();

    for (const setting of allSettings) {
      if (shouldHideSetting(setting)) continue;

      const categoryKey = setting.category.key;
      const location = findTreeLocation(categoryKey);
      if (!location) continue;

      const treeInfo = getTreeInfo(location.subItemId);
      const sectionLabel = treeInfo
        ? t(`admin.settings.tree.${treeInfo.child.id}`, treeInfo.child.label)
        : location.subItemId;
      const existing = categoryMap.get(categoryKey);

      if (existing) {
        existing.settings.push(setting);
        continue;
      }

      categoryMap.set(categoryKey, {
        key: categoryKey,
        label: t(`admin.settings.categories.${categoryKey}`, setting.category.label || categoryKey),
        settings: [setting],
        sectionId: location.subItemId,
        sectionLabel,
      });
    }

    return Array.from(categoryMap.values());
  }, [allSettings, shouldHideSetting, t]);

  const filteredSettings = useMemo(() => {
    if (!allSettings || !Array.isArray(allSettings) || !searchQuery) return [];

    const query = searchQuery.toLowerCase().trim();
    if (!query) return [];

    return allSettings.filter((setting) => {
      if (shouldHideSetting(setting)) return false;
      if (setting.key.toLowerCase().includes(query)) return true;
      if (setting.name?.toLowerCase().includes(query)) return true;

      const formattedKey = formatSettingKey(setting.name || setting.key);
      const translatedName = t(`admin.settings.settingNames.${formattedKey}`, formattedKey);
      if (translatedName.toLowerCase().includes(query)) return true;

      if (setting.hint?.description?.toLowerCase().includes(query)) return true;

      const categoryLabel = t(
        `admin.settings.categories.${setting.category.key}`,
        setting.category.label || setting.category.key,
      );
      return categoryLabel.toLowerCase().includes(query);
    });
  }, [allSettings, searchQuery, shouldHideSetting, t]);

  const favoriteSettings = useMemo(() => {
    if (!allSettings || !Array.isArray(allSettings)) return [];
    return allSettings.filter(
      (setting) => favorites.includes(setting.key) && !shouldHideSetting(setting),
    );
  }, [allSettings, favorites, shouldHideSetting]);

  const favoriteCategories = useMemo(
    () => allCategoryGroups.filter((category) => favoriteCategoryKeys.includes(category.key)),
    [allCategoryGroups, favoriteCategoryKeys],
  );

  const currentSettingsCount = useMemo(
    () => currentCategories.reduce((count, category) => count + category.settings.length, 0),
    [currentCategories],
  );

  const currentModifiedCount = useMemo(
    () =>
      currentCategories.reduce(
        (count, category) =>
          count + category.settings.filter((setting) => setting.has_override).length,
        0,
      ),
    [currentCategories],
  );

  const handleOpenCategory = useCallback(
    (categoryKey: string, sectionId?: string) => {
      const resolvedSectionId = normalizeSection(sectionId, categoryKey);
      setActiveSection(resolvedSectionId);
      setSearchQuery('');
      setFocusedCategoryKey(categoryKey);
      setSearchParams({ section: resolvedSectionId, category: categoryKey });
    },
    [setSearchParams],
  );

  const handleSelectSetting = useCallback(
    (setting: SettingDefinition) => {
      const resolvedSectionId = normalizeSection(null, setting.category.key);
      setActiveSection(resolvedSectionId);
      setFocusedCategoryKey(setting.category.key);
      setSearchQuery(setting.key);
      setSearchParams({
        section: resolvedSectionId,
        category: setting.category.key,
        search: setting.key,
      });
    },
    [setSearchParams],
  );

  const sectionTitle = useMemo(() => {
    const specialItem = SETTINGS_TREE.specialItems.find((item) => item.id === activeSection);
    if (specialItem) return t(`admin.settings.${specialItem.id}`, specialItem.label);

    if (activeTreeInfo) {
      return t(`admin.settings.tree.${activeTreeInfo.child.id}`, activeTreeInfo.child.label);
    }

    return t('admin.settings.title');
  }, [activeSection, activeTreeInfo, t]);

  const renderContent = () => {
    if (searchQuery.trim()) {
      return (
        <SettingsTab
          categories={[]}
          searchQuery={searchQuery}
          filteredSettings={filteredSettings}
          isFavorite={isFavorite}
          toggleFavorite={toggleFavorite}
          isFavoriteCategory={isFavoriteCategory}
          toggleFavoriteCategory={toggleFavoriteCategory}
        />
      );
    }

    switch (activeSection) {
      case 'analytics':
        return <AnalyticsTab />;
      case 'branding':
        return <BrandingTab accentColor={themeColors?.accent} />;
      case 'theme':
        return <ThemeTab />;
      case 'buttons':
        return <MenuEditorTab />;
      case 'favorites':
        return (
          <FavoritesTab
            categories={favoriteCategories}
            settings={favoriteSettings}
            isFavorite={isFavorite}
            toggleFavorite={toggleFavorite}
            toggleFavoriteCategory={toggleFavoriteCategory}
            onOpenCategory={handleOpenCategory}
          />
        );
      default:
        if (!activeTreeInfo) return null;
        return (
          <SettingsTab
            categories={currentCategories}
            searchQuery={searchQuery}
            filteredSettings={filteredSettings}
            isFavorite={isFavorite}
            toggleFavorite={toggleFavorite}
            isFavoriteCategory={isFavoriteCategory}
            toggleFavoriteCategory={toggleFavoriteCategory}
            focusedCategoryKey={focusedCategoryKey}
            onFocusedCategoryHandled={() => setFocusedCategoryKey(null)}
          />
        );
    }
  };

  return (
    <>
      <div className="space-y-4 pb-4 lg:hidden">
        <SettingsMobileTabs
          activeSection={activeSection}
          setActiveSection={handleSectionChange}
          favoritesCount={favorites.length}
        />
        <SettingsSearchMobile
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          allSettings={allSettings}
          onSelectSetting={handleSelectSetting}
        />
        <SettingsSearchResults searchQuery={searchQuery} resultsCount={filteredSettings.length} />
        {renderContent()}
      </div>

      <div className="hidden h-[calc(100vh-120px)] lg:flex">
        <div className="w-[264px] shrink-0 overflow-y-auto border-r border-dark-700/50">
          <div className="border-b border-dark-700/50 p-4">
            <div className="flex items-center gap-3">
              {!capabilities.hasBackButton && (
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-dark-700 bg-dark-800 transition-colors hover:border-dark-600"
                  aria-label={t('admin.settings.backToAdmin')}
                >
                  <BackIcon />
                </button>
              )}
              <h1 className="text-lg font-bold text-dark-100">{t('admin.settings.title')}</h1>
            </div>
          </div>
          <SettingsTreeSidebar
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            favoritesCount={favorites.length}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            allSettings={allSettings}
            onSelectSetting={handleSelectSetting}
          />
        </div>

        <div className="min-w-0 flex-1 overflow-y-auto p-6">
          {activeTreeInfo && !searchQuery.trim() && (
            <div className="mb-2 flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleSectionChange(activeTreeInfo.group.children[0].id)}
                className="text-dark-500 transition-colors hover:text-dark-300"
              >
                {t(`admin.settings.groups.${activeTreeInfo.group.id}`, activeTreeInfo.group.label)}
              </button>
              <ChevronRightIcon />
              <span className="text-dark-300">
                {t(`admin.settings.tree.${activeTreeInfo.child.id}`, activeTreeInfo.child.label)}
              </span>
            </div>
          )}

          <div className="mb-4 flex items-center gap-3">
            <h2 className="truncate text-xl font-semibold text-dark-100">{sectionTitle}</h2>
            {currentSettingsCount > 0 && !searchQuery.trim() && activeTreeInfo && (
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-dark-700/50 px-2 py-0.5 text-xs text-dark-400">
                  {t('admin.settings.settingsCountLabel', { count: currentSettingsCount })}
                </span>
                {currentModifiedCount > 0 && (
                  <span className="rounded-full bg-warning-500/20 px-2 py-0.5 text-xs text-warning-400">
                    {t('admin.settings.modifiedCount', {
                      defaultValue: 'Изменено: {{count}}',
                      count: currentModifiedCount,
                    })}
                  </span>
                )}
              </div>
            )}
          </div>

          <SettingsSearchResults searchQuery={searchQuery} resultsCount={filteredSettings.length} />
          {renderContent()}
        </div>
      </div>
    </>
  );
}
