import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { brandingApi, type UltimaThemeConfig } from '@/api/branding';
import { AdminBackButton } from '@/components/admin';
import { ColorPicker } from '@/components/ColorPicker';
import {
  UltimaThemeLivePreview,
  type UltimaThemePreviewDevice,
  type UltimaThemePreviewScene,
} from '@/components/ultima/UltimaThemeLivePreview';
import {
  ULTIMA_ANIMATION_PRESETS,
  ULTIMA_THEME_PRESETS,
  applyUltimaAnimationPreset,
  applyUltimaThemePreset,
  getDefaultUltimaThemeWithPresets,
  getUltimaAnimationPresetById,
  getUltimaThemePresetById,
} from '@/features/ultima/presets';
import { applyUltimaThemeConfig, normalizeUltimaThemeConfig } from '@/features/ultima/theme';
import { cn } from '@/lib/utils';
import { useNotify } from '@/platform';

type AdminUltimaTab = 'overview' | 'presets' | 'animation' | 'advanced';

type ColorKey =
  | 'primaryColor'
  | 'primaryTextColor'
  | 'secondaryColor'
  | 'secondaryTextColor'
  | 'navBackgroundColor'
  | 'navActiveColor'
  | 'navTextColor'
  | 'backgroundTopColor'
  | 'backgroundBottomColor'
  | 'auraColor'
  | 'ringColor'
  | 'surfaceColor'
  | 'surfaceBorderColor'
  | 'scrollbarThumbColor'
  | 'scrollbarTrackColor';

type NumberKey =
  | 'contentEnterMs'
  | 'tapRingMs'
  | 'ringWaveSec'
  | 'sliderGlowSec'
  | 'stepRingSec'
  | 'successWaveMs'
  | 'itemEnterMs';

const PREVIEW_SCENE_LABELS: Record<UltimaThemePreviewScene, string> = {
  dashboard: 'Главная',
  connection: 'Подключение',
  profile: 'Профиль',
};

const PREVIEW_SCENE_HINTS: Record<UltimaThemePreviewScene, string> = {
  dashboard: 'кнопки, карточки, нижнее меню',
  connection: 'кольца, шаги, прогресс',
  profile: 'профиль, метрики, панели',
};

const TAB_ITEMS: Array<{ id: AdminUltimaTab; title: string; subtitle: string }> = [
  { id: 'overview', title: 'Обзор', subtitle: 'состояние и быстрые правки' },
  { id: 'presets', title: 'Палитры', subtitle: 'готовые стили Ultima' },
  { id: 'animation', title: 'Анимация', subtitle: 'движение и скорость' },
  { id: 'advanced', title: 'Точная настройка', subtitle: 'все цвета вручную' },
];

const COLOR_GROUPS: Array<{
  title: string;
  description: string;
  fields: Array<{ key: ColorKey; label: string; description: string }>;
}> = [
  {
    title: 'Основные действия',
    description: 'Кнопки покупки, активные состояния и читаемость текста.',
    fields: [
      { key: 'primaryColor', label: 'Главный акцент', description: 'Кнопки и активные элементы' },
      {
        key: 'primaryTextColor',
        label: 'Текст на акценте',
        description: 'Текст внутри главной кнопки',
      },
      { key: 'ringColor', label: 'Свет кольца', description: 'Сияние и активные контуры' },
      { key: 'auraColor', label: 'Аура', description: 'Свечение фона и анимаций' },
    ],
  },
  {
    title: 'Фон и карточки',
    description: 'Единая база для телефона, web-версии и внутренних страниц.',
    fields: [
      { key: 'backgroundTopColor', label: 'Верх фона', description: 'Начало общего градиента' },
      { key: 'backgroundBottomColor', label: 'Низ фона', description: 'Конец общего градиента' },
      { key: 'secondaryColor', label: 'Вторичный слой', description: 'Плашки и неактивные кнопки' },
      { key: 'secondaryTextColor', label: 'Текст слоя', description: 'Текст на вторичных панелях' },
      { key: 'surfaceColor', label: 'Поверхность', description: 'Карточки и панели' },
      { key: 'surfaceBorderColor', label: 'Контур', description: 'Рамки карточек и стекла' },
    ],
  },
  {
    title: 'Навигация и скролл',
    description: 'Нижнее меню, desktop-навигация и видимые полосы прокрутки.',
    fields: [
      { key: 'navBackgroundColor', label: 'Фон меню', description: 'Панель навигации' },
      { key: 'navActiveColor', label: 'Активная вкладка', description: 'Выбранная кнопка меню' },
      { key: 'navTextColor', label: 'Текст меню', description: 'Иконки и подписи меню' },
      { key: 'scrollbarThumbColor', label: 'Ползунок', description: 'Цвет активной части скролла' },
      { key: 'scrollbarTrackColor', label: 'Трек скролла', description: 'Фон полосы прокрутки' },
    ],
  },
];

const NUMBER_FIELDS: Array<{
  key: NumberKey;
  label: string;
  min: number;
  max: number;
  step: number;
  suffix: string;
}> = [
  { key: 'contentEnterMs', label: 'Вход контента', min: 120, max: 700, step: 20, suffix: ' мс' },
  { key: 'tapRingMs', label: 'Отклик на нажатие', min: 260, max: 1200, step: 20, suffix: ' мс' },
  { key: 'ringWaveSec', label: 'Волны фона', min: 6, max: 32, step: 1, suffix: ' с' },
  { key: 'sliderGlowSec', label: 'Свечение слайдера', min: 1, max: 6, step: 0.1, suffix: ' с' },
  { key: 'stepRingSec', label: 'Кольца шагов', min: 2.5, max: 10, step: 0.1, suffix: ' с' },
  { key: 'successWaveMs', label: 'Волна успеха', min: 420, max: 1600, step: 20, suffix: ' мс' },
  { key: 'itemEnterMs', label: 'Появление элементов', min: 120, max: 700, step: 20, suffix: ' мс' },
];

function normalizeConfig(config?: Partial<UltimaThemeConfig> | null): UltimaThemeConfig {
  return normalizeUltimaThemeConfig({
    ...getDefaultUltimaThemeWithPresets(),
    ...(config ?? {}),
  });
}

function stableConfig(config: UltimaThemeConfig) {
  return JSON.stringify(config);
}

function hexToRgb(hex: string) {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) return null;
  return {
    r: parseInt(match[1], 16) / 255,
    g: parseInt(match[2], 16) / 255,
    b: parseInt(match[3], 16) / 255,
  };
}

function linearize(value: number) {
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  return 0.2126 * linearize(rgb.r) + 0.7152 * linearize(rgb.g) + 0.0722 * linearize(rgb.b);
}

function contrastRatio(foreground: string, background: string) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

function contrastState(ratio: number) {
  if (ratio >= 4.5)
    return {
      label: 'хорошо',
      className: 'border-success-500/30 bg-success-500/10 text-success-300',
    };
  if (ratio >= 3)
    return {
      label: 'средне',
      className: 'border-warning-500/30 bg-warning-500/10 text-warning-300',
    };
  return { label: 'низко', className: 'border-error-500/30 bg-error-500/10 text-error-300' };
}

function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-dark-700/55 bg-dark-900/40 p-4 shadow-card',
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-dark-100">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm leading-snug text-dark-400">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function TabButton({
  active,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'min-w-0 rounded-2xl border px-4 py-3 text-left transition',
        active
          ? 'border-accent-400/45 bg-accent-500/10 shadow-[0_18px_34px_rgba(0,0,0,0.22)]'
          : 'border-dark-700/55 bg-dark-900/35 hover:border-dark-600 hover:bg-dark-800/55',
      )}
    >
      <div className="truncate text-sm font-semibold text-dark-100">{title}</div>
      <div className="mt-0.5 truncate text-xs text-dark-400">{subtitle}</div>
    </button>
  );
}

function PillButton({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
        active
          ? 'border-accent-400/45 bg-accent-500/15 text-accent-200'
          : 'border-dark-700/60 bg-dark-900/50 text-dark-300 hover:border-dark-600 hover:text-dark-100',
      )}
    >
      {children}
    </button>
  );
}

function NumberSlider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-dark-700/55 bg-dark-950/35 p-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-dark-200">{label}</span>
        <span className="shrink-0 rounded-full bg-dark-800/80 px-2 py-0.5 text-xs tabular-nums text-dark-300">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 w-full accent-accent-500"
      />
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-dark-700/55 bg-dark-950/35 px-4 py-3 text-left transition hover:border-dark-600 hover:bg-dark-800/55"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-dark-100">{title}</span>
        <span className="mt-1 block text-xs leading-snug text-dark-400">{description}</span>
      </span>
      <span
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full border transition',
          checked ? 'border-accent-300/40 bg-accent-500' : 'border-dark-600 bg-dark-800',
        )}
      >
        <span
          className={cn(
            'absolute top-1 h-5 w-5 rounded-full bg-white shadow-lg transition',
            checked ? 'left-6' : 'left-1',
          )}
        />
      </span>
    </button>
  );
}

function ThemePresetCard({
  presetId,
  activePresetId,
  onSelect,
}: {
  presetId: string;
  activePresetId: string;
  onSelect: (presetId: string) => void;
}) {
  const preset = getUltimaThemePresetById(presetId);
  const isActive = preset.id === activePresetId;

  return (
    <button
      type="button"
      onClick={() => onSelect(preset.id)}
      className={cn(
        'group rounded-2xl border p-3 text-left transition',
        isActive
          ? 'border-accent-400/50 bg-accent-500/10 shadow-[0_18px_38px_rgba(0,0,0,0.24)]'
          : 'border-dark-700/55 bg-dark-950/30 hover:border-dark-600 hover:bg-dark-800/50',
      )}
    >
      <div
        className="rounded-2xl border p-3"
        style={{
          borderColor: `${preset.config.surfaceBorderColor}55`,
          background: `linear-gradient(155deg, ${preset.config.backgroundTopColor}, ${preset.config.backgroundBottomColor})`,
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <span
            className="h-10 w-10 rounded-2xl border"
            style={{
              borderColor: `${preset.config.surfaceBorderColor}99`,
              background: `radial-gradient(circle at 35% 30%, ${preset.config.ringColor}88, ${preset.config.auraColor}55)`,
              boxShadow: `0 0 26px ${preset.config.auraColor}33`,
            }}
          />
          <span className="flex flex-wrap justify-end gap-1.5">
            {[
              preset.config.primaryColor,
              preset.config.navActiveColor,
              preset.config.surfaceBorderColor,
              preset.config.ringColor,
            ].map((color, index) => (
              <span
                key={`${color}-${index}`}
                className="h-3.5 w-3.5 rounded-full border border-white/15"
                style={{ backgroundColor: color }}
              />
            ))}
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-dark-100">{preset.name}</div>
          <div className="mt-1 line-clamp-2 text-xs leading-snug text-dark-400">
            {preset.description}
          </div>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold',
            isActive ? 'bg-accent-500/20 text-accent-200' : 'bg-dark-800/80 text-dark-400',
          )}
        >
          {isActive ? 'выбрано' : 'применить'}
        </span>
      </div>
    </button>
  );
}

function AnimationPresetCard({
  presetId,
  activePresetId,
  onSelect,
}: {
  presetId: string;
  activePresetId: string;
  onSelect: (presetId: string) => void;
}) {
  const preset = getUltimaAnimationPresetById(presetId);
  const isActive = preset.id === activePresetId;

  return (
    <button
      type="button"
      onClick={() => onSelect(preset.id)}
      className={cn(
        'rounded-2xl border p-4 text-left transition',
        isActive
          ? 'border-accent-400/50 bg-accent-500/10'
          : 'border-dark-700/55 bg-dark-950/30 hover:border-dark-600 hover:bg-dark-800/50',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-dark-100">{preset.name}</div>
          <div className="mt-1 text-xs leading-snug text-dark-400">{preset.description}</div>
        </div>
        <span className="shrink-0 rounded-full bg-dark-800/80 px-2 py-1 text-[11px] text-dark-300">
          {preset.config.contentEnterMs} мс
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] text-dark-400">
        <span className="rounded-xl bg-dark-900/70 px-2 py-1.5">
          волна {preset.config.ringWaveSec}с
        </span>
        <span className="rounded-xl bg-dark-900/70 px-2 py-1.5">
          тап {preset.config.tapRingMs}мс
        </span>
        <span className="rounded-xl bg-dark-900/70 px-2 py-1.5">
          шаг {preset.config.stepRingSec}с
        </span>
      </div>
    </button>
  );
}

function ContrastBadge({
  label,
  foreground,
  background,
}: {
  label: string;
  foreground: string;
  background: string;
}) {
  const ratio = contrastRatio(foreground, background);
  const state = contrastState(ratio);

  return (
    <div className={cn('rounded-2xl border px-3 py-2', state.className)}>
      <div className="text-xs font-semibold">{label}</div>
      <div className="mt-0.5 text-[11px] opacity-80">
        {state.label}, {ratio.toFixed(1)}:1
      </div>
    </div>
  );
}

function ActionBar({
  dirty,
  saving,
  resetting,
  onSave,
  onDiscard,
  onReset,
}: {
  dirty: boolean;
  saving: boolean;
  resetting: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-dark-700/55 bg-dark-950/70 p-3 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-dark-400">
        {dirty ? 'Есть несохраненные изменения.' : 'Все изменения сохранены.'}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onDiscard}
          disabled={!dirty || saving || resetting}
          className="rounded-xl border border-dark-700 bg-dark-800 px-4 py-2 text-sm font-semibold text-dark-200 transition hover:bg-dark-700 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Откатить
        </button>
        <button
          type="button"
          onClick={onReset}
          disabled={saving || resetting}
          className="rounded-xl border border-warning-500/30 bg-warning-500/10 px-4 py-2 text-sm font-semibold text-warning-200 transition hover:bg-warning-500/15 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {resetting ? 'Сброс...' : 'Сбросить стандарт'}
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!dirty || saving || resetting}
          className="rounded-xl bg-accent-500 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-accent-400 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </div>
  );
}

export default function AdminUltimaTheme() {
  const queryClient = useQueryClient();
  const notify = useNotify();
  const [activeTab, setActiveTab] = useState<AdminUltimaTab>('overview');
  const [previewScene, setPreviewScene] = useState<UltimaThemePreviewScene>('dashboard');
  const [previewDevice, setPreviewDevice] = useState<UltimaThemePreviewDevice>('mobile');
  const [draft, setDraft] = useState<UltimaThemeConfig>(() => getDefaultUltimaThemeWithPresets());
  const [bootstrapped, setBootstrapped] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['ultima-theme-config'],
    queryFn: brandingApi.getUltimaThemeConfig,
    staleTime: 60_000,
  });

  const savedConfig = useMemo(() => normalizeConfig(data), [data]);
  const dirty = useMemo(
    () => stableConfig(draft) !== stableConfig(savedConfig),
    [draft, savedConfig],
  );
  const activeTheme = getUltimaThemePresetById(draft.themePresetId);
  const activeAnimation = getUltimaAnimationPresetById(draft.animationPresetId);

  useEffect(() => {
    if (!data || bootstrapped) return;
    setDraft(normalizeConfig(data));
    setBootstrapped(true);
  }, [bootstrapped, data]);

  useEffect(() => {
    applyUltimaThemeConfig(draft);
  }, [draft]);

  const saveMutation = useMutation({
    mutationFn: brandingApi.updateUltimaThemeConfig,
    onSuccess: (updated) => {
      const normalized = normalizeConfig(updated);
      setDraft(normalized);
      queryClient.setQueryData(['ultima-theme-config'], normalized);
      applyUltimaThemeConfig(normalized);
      notify.success('Тема Ultima сохранена');
    },
    onError: () => {
      notify.error('Не удалось сохранить тему Ultima');
    },
  });

  const resetMutation = useMutation({
    mutationFn: brandingApi.resetUltimaThemeConfig,
    onSuccess: (updated) => {
      const normalized = normalizeConfig(updated);
      setDraft(normalized);
      queryClient.setQueryData(['ultima-theme-config'], normalized);
      applyUltimaThemeConfig(normalized);
      notify.success('Тема Ultima сброшена к стандартной');
    },
    onError: () => {
      notify.error('Не удалось сбросить тему Ultima');
    },
  });

  const updateDraft = (patch: Partial<UltimaThemeConfig>) => {
    setDraft((current) => normalizeConfig({ ...current, ...patch }));
  };

  const discardChanges = () => {
    setDraft(savedConfig);
    applyUltimaThemeConfig(savedConfig);
  };

  const saveChanges = () => {
    saveMutation.mutate(draft);
  };

  const resetToDefault = () => {
    resetMutation.mutate();
  };

  const statusCards = [
    { label: 'Палитра', value: activeTheme.name, hint: activeTheme.description },
    { label: 'Анимация', value: activeAnimation.name, hint: activeAnimation.description },
    {
      label: 'Рамки',
      value: draft.framesEnabled ? 'Включены' : 'Отключены',
      hint: 'Единый режим стеклянных контуров',
    },
    {
      label: 'Логотип',
      value: draft.homeUseBrandLogo ? 'Брендовый' : 'Стандартный',
      hint: 'Главный экран Ultima',
    },
  ];

  return (
    <div className="min-h-screen bg-dark-950 px-3 py-4 text-dark-100 sm:px-5 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <AdminBackButton />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold text-dark-50 sm:text-2xl">Темы Ultima</h1>
                <span
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-xs font-semibold',
                    dirty
                      ? 'border-warning-500/30 bg-warning-500/10 text-warning-300'
                      : 'border-success-500/30 bg-success-500/10 text-success-300',
                  )}
                >
                  {dirty ? 'не сохранено' : 'сохранено'}
                </span>
              </div>
              <p className="mt-1 max-w-2xl text-sm leading-snug text-dark-400">
                Единая настройка цветов и движения для Ultima на телефоне, в Telegram WebApp и в
                desktop-версии.
              </p>
            </div>
          </div>
          <div className="sm:min-w-[430px]">
            <ActionBar
              dirty={dirty}
              saving={saveMutation.isPending}
              resetting={resetMutation.isPending}
              onSave={saveChanges}
              onDiscard={discardChanges}
              onReset={resetToDefault}
            />
          </div>
        </header>

        {isLoading && !bootstrapped ? (
          <div className="rounded-2xl border border-dark-700/55 bg-dark-900/40 p-6 text-sm text-dark-400">
            Загружаю настройки темы...
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {statusCards.map((item) => (
                <div
                  key={item.label}
                  className="min-w-0 rounded-2xl border border-dark-700/55 bg-dark-900/40 p-4"
                >
                  <div className="text-xs font-medium uppercase tracking-wide text-dark-500">
                    {item.label}
                  </div>
                  <div className="mt-1 truncate text-lg font-semibold text-dark-50">
                    {item.value}
                  </div>
                  <div className="mt-1 line-clamp-2 text-xs leading-snug text-dark-400">
                    {item.hint}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_430px]">
              <div className="min-w-0 space-y-4">
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {TAB_ITEMS.map((tab) => (
                    <TabButton
                      key={tab.id}
                      active={activeTab === tab.id}
                      title={tab.title}
                      subtitle={tab.subtitle}
                      onClick={() => setActiveTab(tab.id)}
                    />
                  ))}
                </div>

                {activeTab === 'overview' ? (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <SectionCard
                      title="Быстрые действия"
                      description="Эти настройки сразу применяются в предпросмотре и на текущей странице."
                    >
                      <div className="space-y-3">
                        <ToggleRow
                          title="Показывать стеклянные рамки"
                          description="Включает более заметные контуры карточек на телефоне и ПК."
                          checked={draft.framesEnabled}
                          onChange={(framesEnabled) => updateDraft({ framesEnabled })}
                        />
                        <ToggleRow
                          title="Использовать брендовый логотип на главной"
                          description="Если логотип настроен в брендинге, Ultima будет брать его вместо стандартного знака."
                          checked={draft.homeUseBrandLogo}
                          onChange={(homeUseBrandLogo) => updateDraft({ homeUseBrandLogo })}
                        />
                      </div>
                    </SectionCard>

                    <SectionCard
                      title="Контраст"
                      description="Проверка читаемости ключевых зон интерфейса."
                    >
                      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1 2xl:grid-cols-3">
                        <ContrastBadge
                          label="Кнопка"
                          foreground={draft.primaryTextColor}
                          background={draft.primaryColor}
                        />
                        <ContrastBadge
                          label="Навигация"
                          foreground={draft.navTextColor}
                          background={draft.navBackgroundColor}
                        />
                        <ContrastBadge
                          label="Карточка"
                          foreground={draft.secondaryTextColor}
                          background={draft.surfaceColor}
                        />
                      </div>
                    </SectionCard>

                    <SectionCard title="Текущая палитра" description={activeTheme.description}>
                      <ThemePresetCard
                        presetId={activeTheme.id}
                        activePresetId={draft.themePresetId}
                        onSelect={(presetId) =>
                          setDraft((current) => applyUltimaThemePreset(current, presetId))
                        }
                      />
                    </SectionCard>

                    <SectionCard title="Текущая анимация" description={activeAnimation.description}>
                      <AnimationPresetCard
                        presetId={activeAnimation.id}
                        activePresetId={draft.animationPresetId}
                        onSelect={(presetId) =>
                          setDraft((current) => applyUltimaAnimationPreset(current, presetId))
                        }
                      />
                    </SectionCard>
                  </div>
                ) : null}

                {activeTab === 'presets' ? (
                  <SectionCard
                    title="Готовые палитры"
                    description="Пресет меняет весь набор цветов сразу: фон, карточки, меню, кнопки и скролл."
                  >
                    <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                      {ULTIMA_THEME_PRESETS.map((preset) => (
                        <ThemePresetCard
                          key={preset.id}
                          presetId={preset.id}
                          activePresetId={draft.themePresetId}
                          onSelect={(presetId) =>
                            setDraft((current) => applyUltimaThemePreset(current, presetId))
                          }
                        />
                      ))}
                    </div>
                  </SectionCard>
                ) : null}

                {activeTab === 'animation' ? (
                  <div className="space-y-4">
                    <SectionCard
                      title="Пресеты движения"
                      description="Выберите общий характер анимаций Ultima."
                    >
                      <div className="grid gap-3 lg:grid-cols-2">
                        {ULTIMA_ANIMATION_PRESETS.map((preset) => (
                          <AnimationPresetCard
                            key={preset.id}
                            presetId={preset.id}
                            activePresetId={draft.animationPresetId}
                            onSelect={(presetId) =>
                              setDraft((current) => applyUltimaAnimationPreset(current, presetId))
                            }
                          />
                        ))}
                      </div>
                    </SectionCard>

                    <SectionCard
                      title="Ручная скорость"
                      description="Точная настройка длительности для отдельных эффектов."
                    >
                      <div className="grid gap-3 lg:grid-cols-2">
                        {NUMBER_FIELDS.map((field) => (
                          <NumberSlider
                            key={field.key}
                            label={field.label}
                            value={draft[field.key]}
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            suffix={field.suffix}
                            onChange={(value) =>
                              updateDraft({ [field.key]: value } as Partial<UltimaThemeConfig>)
                            }
                          />
                        ))}
                      </div>
                    </SectionCard>
                  </div>
                ) : null}

                {activeTab === 'advanced' ? (
                  <div className="space-y-4">
                    {COLOR_GROUPS.map((group) => (
                      <SectionCard
                        key={group.title}
                        title={group.title}
                        description={group.description}
                      >
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {group.fields.map((field) => (
                            <ColorPicker
                              key={field.key}
                              value={draft[field.key] as string}
                              label={field.label}
                              description={field.description}
                              onChange={(value) =>
                                updateDraft({ [field.key]: value } as Partial<UltimaThemeConfig>)
                              }
                            />
                          ))}
                        </div>
                      </SectionCard>
                    ))}
                  </div>
                ) : null}

                <ActionBar
                  dirty={dirty}
                  saving={saveMutation.isPending}
                  resetting={resetMutation.isPending}
                  onSave={saveChanges}
                  onDiscard={discardChanges}
                  onReset={resetToDefault}
                />
              </div>

              <aside className="min-w-0 xl:sticky xl:top-4 xl:self-start">
                <SectionCard
                  title="Предпросмотр"
                  description="Те же переменные, которые применяются в реальном Ultima-интерфейсе."
                  action={
                    <div className="flex gap-1">
                      <PillButton
                        active={previewDevice === 'mobile'}
                        onClick={() => setPreviewDevice('mobile')}
                      >
                        Телефон
                      </PillButton>
                      <PillButton
                        active={previewDevice === 'desktop'}
                        onClick={() => setPreviewDevice('desktop')}
                      >
                        ПК
                      </PillButton>
                    </div>
                  }
                >
                  <div className="mb-3 grid gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                    {(Object.keys(PREVIEW_SCENE_LABELS) as UltimaThemePreviewScene[]).map(
                      (scene) => (
                        <button
                          key={scene}
                          type="button"
                          onClick={() => setPreviewScene(scene)}
                          className={cn(
                            'rounded-2xl border px-3 py-2 text-left transition',
                            previewScene === scene
                              ? 'border-accent-400/45 bg-accent-500/10'
                              : 'border-dark-700/55 bg-dark-950/35 hover:border-dark-600',
                          )}
                        >
                          <div className="truncate text-sm font-semibold text-dark-100">
                            {PREVIEW_SCENE_LABELS[scene]}
                          </div>
                          <div className="mt-0.5 truncate text-xs text-dark-400">
                            {PREVIEW_SCENE_HINTS[scene]}
                          </div>
                        </button>
                      ),
                    )}
                  </div>

                  <UltimaThemeLivePreview
                    config={draft}
                    title={activeTheme.name}
                    subtitle={previewDevice === 'desktop' ? 'desktop web' : 'mobile webapp'}
                    scene={previewScene}
                    device={previewDevice}
                  />
                </SectionCard>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
