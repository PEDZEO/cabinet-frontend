import { useTranslation } from 'react-i18next';
import { useRef, useEffect, useState } from 'react';
import { SETTINGS_TREE } from './constants';
import { StarIcon } from './icons';

interface SettingsMobileTabsProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  favoritesCount: number;
}

export function SettingsMobileTabs({
  activeSection,
  setActiveSection,
  favoritesCount,
}: SettingsMobileTabsProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  useEffect(() => {
    if (!activeRef.current || !scrollRef.current) return;

    const container = scrollRef.current;
    const activeElement = activeRef.current;
    const containerRect = container.getBoundingClientRect();
    const activeRect = activeElement.getBoundingClientRect();

    if (activeRect.left < containerRect.left || activeRect.right > containerRect.right) {
      activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeSection]);

  useEffect(() => {
    for (const group of SETTINGS_TREE.groups) {
      if (group.children.some((child) => child.id === activeSection)) {
        setExpandedGroup(group.id);
        return;
      }
    }
  }, [activeSection]);

  const handleGroupTap = (groupId: string) => {
    if (expandedGroup === groupId) {
      setExpandedGroup(null);
      return;
    }

    setExpandedGroup(groupId);
    const group = SETTINGS_TREE.groups.find((item) => item.id === groupId);
    if (group && group.children.length > 0) {
      setActiveSection(group.children[0].id);
    }
  };

  const isGroupActive = (groupId: string) => {
    const group = SETTINGS_TREE.groups.find((item) => item.id === groupId);
    return group?.children.some((child) => child.id === activeSection) ?? false;
  };

  const specialItems = SETTINGS_TREE.specialItems.filter((item) => item.id !== 'favorites');
  const isFavoritesActive = activeSection === 'favorites';

  return (
    <div>
      <div
        ref={scrollRef}
        className="scrollbar-hide flex gap-2 overflow-x-auto px-3 py-3"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <button
          ref={isFavoritesActive ? activeRef : null}
          type="button"
          onClick={() => {
            setActiveSection('favorites');
            setExpandedGroup(null);
          }}
          className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
            isFavoritesActive
              ? 'bg-accent-500/15 text-accent-400 ring-1 ring-accent-500/30'
              : 'bg-dark-800/50 text-dark-400 active:bg-dark-700'
          }`}
        >
          <StarIcon filled={isFavoritesActive} />
          <span className="whitespace-nowrap">{t('admin.settings.favorites', 'Избранное')}</span>
          {favoritesCount > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.5 text-xs ${
                isFavoritesActive
                  ? 'bg-accent-500/20 text-accent-400'
                  : 'bg-warning-500/20 text-warning-400'
              }`}
            >
              {favoritesCount}
            </span>
          )}
        </button>

        {specialItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              ref={isActive ? activeRef : null}
              type="button"
              onClick={() => {
                setActiveSection(item.id);
                setExpandedGroup(null);
              }}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-accent-500/15 text-accent-400 ring-1 ring-accent-500/30'
                  : 'bg-dark-800/50 text-dark-400 active:bg-dark-700'
              }`}
            >
              {item.icon && <span className="text-sm">{item.icon}</span>}
              <span className="whitespace-nowrap">
                {t(`admin.settings.${item.id}`, item.label)}
              </span>
            </button>
          );
        })}

        {SETTINGS_TREE.groups.map((group) => {
          const hasActiveChild = isGroupActive(group.id);
          const isExpanded = expandedGroup === group.id;
          return (
            <button
              key={group.id}
              ref={hasActiveChild ? activeRef : null}
              type="button"
              onClick={() => handleGroupTap(group.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                hasActiveChild || isExpanded
                  ? 'bg-accent-500/15 text-accent-400 ring-1 ring-accent-500/30'
                  : 'bg-dark-800/50 text-dark-400 active:bg-dark-700'
              }`}
            >
              <span className="text-sm">{group.icon}</span>
              <span className="whitespace-nowrap">
                {t(`admin.settings.groups.${group.id}`, group.label)}
              </span>
            </button>
          );
        })}
        <div className="w-3 shrink-0" aria-hidden="true" />
      </div>

      {expandedGroup && (
        <div
          className="scrollbar-hide flex gap-2 overflow-x-auto px-3 pb-2"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {SETTINGS_TREE.groups
            .find((group) => group.id === expandedGroup)
            ?.children.map((child) => {
              const isActive = activeSection === child.id;
              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => setActiveSection(child.id)}
                  className={`shrink-0 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-accent-500/10 text-accent-400 ring-1 ring-accent-500/20'
                      : 'bg-dark-800/30 text-dark-500 active:bg-dark-700'
                  }`}
                >
                  <span className="whitespace-nowrap">
                    {t(`admin.settings.tree.${child.id}`, child.label)}
                  </span>
                </button>
              );
            })}
          <div className="w-3 shrink-0" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
