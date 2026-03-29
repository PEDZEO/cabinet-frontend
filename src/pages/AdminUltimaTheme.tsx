import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { brandingApi, type UltimaThemeConfig } from '@/api/branding';
import { AdminBackButton } from '@/components/admin';
import { ColorPicker } from '@/components/ColorPicker';
import { UltimaThemeLivePreview } from '@/components/ultima/UltimaThemeLivePreview';
import {
  ULTIMA_ANIMATION_PRESETS,
  ULTIMA_THEME_PRESETS,
  applyUltimaAnimationPreset,
  applyUltimaThemePreset,
  getDefaultUltimaThemeWithPresets,
  getUltimaAnimationPresetById,
  getUltimaThemePresetById,
} from '@/features/ultima/presets';
import { applyUltimaThemeConfig } from '@/features/ultima/theme';
import { cn } from '@/lib/utils';

type AdminUltimaTab = 'overview' | 'themes' | 'animations' | 'advanced';

function normalizeConfig(config?: Partial<UltimaThemeConfig> | null): UltimaThemeConfig {
  return {
    ...getDefaultUltimaThemeWithPresets(),
    ...(config ?? {}),
  };
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
    <div className="space-y-1.5 rounded-2xl border border-dark-700/60 bg-dark-900/45 p-3">
      <div className="flex items-center justify-between gap-3 text-sm text-dark-300">
        <span>{label}</span>
        <span className="text-xs tabular-nums text-dark-400">
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
        className="w-full accent-accent-500"
      />
    </div>
  );
}

function ToggleCard({
  title,
  description,
  enabled,
  onToggle,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-dark-700/60 bg-dark-900/45 px-4 py-3 text-left transition hover:border-accent-500/35 hover:bg-dark-800/60"
      onClick={onToggle}
    >
      <div className="min-w-0">
        <div className="text-sm font-semibold text-dark-100">{title}</div>
        <div className="mt-1 text-xs leading-snug text-dark-400">{description}</div>
      </div>
      <span
        className={cn(
          'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
          enabled ? 'bg-accent-500/20 text-accent-300' : 'bg-dark-700/70 text-dark-300',
        )}
      >
        {enabled ? 'Включено' : 'Выключено'}
      </span>
    </button>
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
        'rounded-2xl border px-4 py-3 text-left transition',
        active
          ? 'border-accent-500/45 bg-accent-500/10 shadow-[0_18px_38px_rgba(0,0,0,0.18)]'
          : 'border-dark-700/60 bg-dark-900/40 hover:border-dark-600/70 hover:bg-dark-800/60',
      )}
    >
      <div className="text-sm font-semibold text-dark-100">{title}</div>
      <div className="mt-1 text-xs leading-snug text-dark-400">{subtitle}</div>
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
        'group rounded-[24px] border p-4 text-left transition',
        isActive
          ? 'border-accent-500/45 bg-accent-500/10 shadow-[0_22px_42px_rgba(0,0,0,0.22)]'
          : 'border-dark-700/60 bg-dark-900/45 hover:border-dark-600/70 hover:bg-dark-800/60',
      )}
    >
      <div
        className="rounded-[20px] border p-3"
        style={{
          borderColor: `${preset.config.surfaceBorderColor}55`,
          background: `linear-gradient(155deg, ${preset.config.backgroundTopColor}, ${preset.config.backgroundBottomColor})`,
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div
            className="h-10 w-10 rounded-2xl border"
            style={{
              borderColor: `${preset.config.surfaceBorderColor}99`,
              background: `radial-gradient(circle at 35% 30%, ${preset.config.ringColor}88, ${preset.config.auraColor}55)`,
              boxShadow: `0 0 26px ${preset.config.auraColor}33`,
            }}
          />
          <div className="flex flex-wrap justify-end gap-1.5">
            {[
              preset.config.primaryColor,
              preset.config.navActiveColor,
              preset.config.surfaceBorderColor,
              preset.config.ringColor,
            ].map((color) => (
              <span
                key={color}
                className="h-3.5 w-3.5 rounded-full border border-white/15"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <div
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              backgroundColor: preset.config.primaryColor,
              color: preset.config.primaryTextColor,
            }}
          >
            Action
          </div>
          <div
            className="rounded-full border px-3 py-1 text-xs font-medium"
            style={{
              borderColor: `${preset.config.surfaceBorderColor}66`,
              color: preset.config.secondaryTextColor,
              backgroundColor: `${preset.config.secondaryColor}CC`,
            }}
          >
            Surface
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-dark-100">{preset.name}</div>
          <div className="mt-1 text-xs leading-snug text-dark-400">{preset.description}</div>
        </div>
        {isActive ? (
          <span className="shrink-0 rounded-full bg-accent-500/20 px-2.5 py-1 text-[11px] font-semibold text-accent-300">
            Активно
          </span>
        ) : null}
      </div>
    </button>
  );
}

function AnimationPresetCard({
  config,
  presetId,
  activePresetId,
  onSelect,
}: {
  config: UltimaThemeConfig;
  presetId: string;
  activePresetId: string;
  onSelect: (presetId: string) => void;
}) {
  const preset = getUltimaAnimationPresetById(presetId);
  const isActive = preset.id === activePresetId;
  const previewConfig = applyUltimaAnimationPreset(config, preset.id);

  return (
    <button
      type="button"
      onClick={() => onSelect(preset.id)}
      className={cn(
        'rounded-[24px] border p-3 text-left transition',
        isActive
          ? 'border-accent-500/45 bg-accent-500/10 shadow-[0_22px_42px_rgba(0,0,0,0.22)]'
          : 'border-dark-700/60 bg-dark-900/45 hover:border-dark-600/70 hover:bg-dark-800/60',
      )}
    >
      <UltimaThemeLivePreview
        config={previewConfig}
        variant="card"
        title="Animation"
        subtitle={preset.name}
      />
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-dark-100">{preset.name}</div>
          <div className="mt-1 text-xs leading-snug text-dark-400">{preset.description}</div>
        </div>
        {isActive ? (
          <span className="shrink-0 rounded-full bg-accent-500/20 px-2.5 py-1 text-[11px] font-semibold text-accent-300">
            Активно
          </span>
        ) : null}
      </div>
    </button>
  );
}

export default function AdminUltimaTheme() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminUltimaTab>('overview');
  const [draft, setDraft] = useState<UltimaThemeConfig>(getDefaultUltimaThemeWithPresets());
  const [saved, setSaved] = useState<UltimaThemeConfig>(getDefaultUltimaThemeWithPresets());

  const { data, isLoading } = useQuery({
    queryKey: ['ultima-theme-config'],
    queryFn: brandingApi.getUltimaThemeConfig,
  });

  useEffect(() => {
    const next = normalizeConfig(data);
    setDraft(next);
    setSaved(next);
  }, [data]);

  useEffect(() => {
    applyUltimaThemeConfig(draft);
  }, [draft]);

  const updateMutation = useMutation({
    mutationFn: brandingApi.updateUltimaThemeConfig,
    onSuccess: (updated) => {
      const next = normalizeConfig(updated);
      setSaved(next);
      setDraft(next);
      queryClient.setQueryData(['ultima-theme-config'], next);
    },
  });

  const resetMutation = useMutation({
    mutationFn: brandingApi.resetUltimaThemeConfig,
    onSuccess: (updated) => {
      const next = normalizeConfig(updated);
      setSaved(next);
      setDraft(next);
      queryClient.setQueryData(['ultima-theme-config'], next);
    },
  });

  const currentThemePreset = useMemo(
    () => getUltimaThemePresetById(draft.themePresetId),
    [draft.themePresetId],
  );
  const currentAnimationPreset = useMemo(
    () => getUltimaAnimationPresetById(draft.animationPresetId),
    [draft.animationPresetId],
  );
  const hasChanges = JSON.stringify(draft) !== JSON.stringify(saved);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="mb-2 flex items-center gap-3">
        <AdminBackButton to="/admin/ultima-settings" />
        <div>
          <h1 className="text-xl font-semibold text-dark-100">Темы и анимации Ultima</h1>
          <p className="text-sm text-dark-400">
            Каталог тем, отдельный выбор motion-сцены и тонкая ручная настройка под новый визуальный
            апдейт.
          </p>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <div className="rounded-[28px] border border-dark-700/60 bg-dark-900/40 p-4">
          <UltimaThemeLivePreview
            config={draft}
            title={currentThemePreset.name}
            subtitle={currentAnimationPreset.name}
          />
        </div>

        <div className="space-y-3 rounded-[28px] border border-dark-700/60 bg-dark-900/40 p-4">
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-2xl border border-dark-700/60 bg-dark-900/45 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-dark-500">Тем</div>
              <div className="mt-2 text-2xl font-semibold text-dark-100">
                {ULTIMA_THEME_PRESETS.length}
              </div>
              <div className="mt-1 text-xs text-dark-400">От классики до контрастных сцен.</div>
            </div>
            <div className="rounded-2xl border border-dark-700/60 bg-dark-900/45 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-dark-500">Анимаций</div>
              <div className="mt-2 text-2xl font-semibold text-dark-100">
                {ULTIMA_ANIMATION_PRESETS.length}
              </div>
              <div className="mt-1 text-xs text-dark-400">
                Выбираются отдельно и живут независимо от темы.
              </div>
            </div>
            <div className="rounded-2xl border border-dark-700/60 bg-dark-900/45 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-dark-500">Сейчас</div>
              <div className="mt-2 text-sm font-semibold text-dark-100">
                {currentThemePreset.name}
              </div>
              <div className="mt-1 text-xs text-dark-400">{currentAnimationPreset.name}</div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <ToggleCard
              title="Показывать рамки"
              description="Контуры карточек и блоков можно быстро включать поверх любой темы."
              enabled={draft.framesEnabled}
              onToggle={() => setDraft((prev) => ({ ...prev, framesEnabled: !prev.framesEnabled }))}
            />
            <ToggleCard
              title="Логотип вместо щита"
              description="На главной Ultima будет использоваться загруженный логотип проекта."
              enabled={draft.homeUseBrandLogo}
              onToggle={() =>
                setDraft((prev) => ({ ...prev, homeUseBrandLogo: !prev.homeUseBrandLogo }))
              }
            />
          </div>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-4">
        <TabButton
          active={activeTab === 'overview'}
          title="Обзор"
          subtitle="Текущее состояние, быстрые действия и live-preview."
          onClick={() => setActiveTab('overview')}
        />
        <TabButton
          active={activeTab === 'themes'}
          title="Темы"
          subtitle="Палитры и surface-настроение. Минимум 9 готовых вариантов."
          onClick={() => setActiveTab('themes')}
        />
        <TabButton
          active={activeTab === 'animations'}
          title="Анимации"
          subtitle="Отдельный выбор motion-сцены с живым превью."
          onClick={() => setActiveTab('animations')}
        />
        <TabButton
          active={activeTab === 'advanced'}
          title="Тонкая настройка"
          subtitle="Ручная доводка цветов, меню и скоростей."
          onClick={() => setActiveTab('advanced')}
        />
      </div>

      <div className="rounded-[28px] border border-dark-700/60 bg-dark-800/30 p-4">
        {isLoading ? (
          <div className="py-12 text-center text-dark-400">Загрузка...</div>
        ) : activeTab === 'overview' ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-dark-700/60 bg-dark-900/45 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-dark-500">
                  Активная тема
                </div>
                <div className="mt-2 text-lg font-semibold text-dark-100">
                  {currentThemePreset.name}
                </div>
                <div className="mt-1 text-sm leading-relaxed text-dark-400">
                  {currentThemePreset.description}
                </div>
              </div>
              <div className="rounded-2xl border border-dark-700/60 bg-dark-900/45 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-dark-500">
                  Активная анимация
                </div>
                <div className="mt-2 text-lg font-semibold text-dark-100">
                  {currentAnimationPreset.name}
                </div>
                <div className="mt-1 text-sm leading-relaxed text-dark-400">
                  {currentAnimationPreset.description}
                </div>
              </div>
            </div>
            <div className="space-y-3 rounded-2xl border border-dark-700/60 bg-dark-900/45 p-4">
              <div className="text-sm font-semibold text-dark-100">Быстрые переходы</div>
              <button
                type="button"
                className="w-full rounded-2xl border border-dark-700/60 bg-dark-900/70 px-4 py-3 text-left transition hover:border-accent-500/35"
                onClick={() => setActiveTab('themes')}
              >
                <div className="text-sm font-semibold text-dark-100">Выбрать новую тему</div>
                <div className="mt-1 text-xs text-dark-400">
                  Готовые палитры и карточки с превью.
                </div>
              </button>
              <button
                type="button"
                className="w-full rounded-2xl border border-dark-700/60 bg-dark-900/70 px-4 py-3 text-left transition hover:border-accent-500/35"
                onClick={() => setActiveTab('animations')}
              >
                <div className="text-sm font-semibold text-dark-100">Сменить motion-сцену</div>
                <div className="mt-1 text-xs text-dark-400">
                  Анимации выбираются отдельно и не ломают тему.
                </div>
              </button>
              <button
                type="button"
                className="w-full rounded-2xl border border-dark-700/60 bg-dark-900/70 px-4 py-3 text-left transition hover:border-accent-500/35"
                onClick={() => setActiveTab('advanced')}
              >
                <div className="text-sm font-semibold text-dark-100">Довести вручную</div>
                <div className="mt-1 text-xs text-dark-400">
                  Точные цвета, timing и логотип на главной.
                </div>
              </button>
            </div>
          </div>
        ) : activeTab === 'themes' ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-dark-100">Каталог тем</h2>
              <p className="mt-1 text-sm text-dark-400">
                Темы меняют палитру, фоны, поверхности и акценты, но не трогают выбранную анимацию.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {ULTIMA_THEME_PRESETS.map((preset) => (
                <ThemePresetCard
                  key={preset.id}
                  presetId={preset.id}
                  activePresetId={draft.themePresetId}
                  onSelect={(presetId) =>
                    setDraft((prev) => applyUltimaThemePreset(prev, presetId))
                  }
                />
              ))}
            </div>
          </div>
        ) : activeTab === 'animations' ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-dark-100">Каталог анимаций</h2>
              <p className="mt-1 text-sm text-dark-400">
                Motion-сцены выбираются отдельно и сразу видны в живом превью. Цвета подтягиваются
                из текущей темы автоматически.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {ULTIMA_ANIMATION_PRESETS.map((preset) => (
                <AnimationPresetCard
                  key={preset.id}
                  config={draft}
                  presetId={preset.id}
                  activePresetId={draft.animationPresetId}
                  onSelect={(presetId) =>
                    setDraft((prev) => applyUltimaAnimationPreset(prev, presetId))
                  }
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-dark-300">
                Базовые цвета
              </h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <ColorPicker
                  label="Основная кнопка"
                  value={draft.primaryColor}
                  onChange={(value) => setDraft((prev) => ({ ...prev, primaryColor: value }))}
                />
                <ColorPicker
                  label="Текст основной кнопки"
                  value={draft.primaryTextColor}
                  onChange={(value) => setDraft((prev) => ({ ...prev, primaryTextColor: value }))}
                />
                <ColorPicker
                  label="Вторичная кнопка"
                  value={draft.secondaryColor}
                  onChange={(value) => setDraft((prev) => ({ ...prev, secondaryColor: value }))}
                />
                <ColorPicker
                  label="Текст вторичной кнопки"
                  value={draft.secondaryTextColor}
                  onChange={(value) => setDraft((prev) => ({ ...prev, secondaryTextColor: value }))}
                />
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-dark-300">
                Фон и поверхности
              </h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <ColorPicker
                  label="Фон (верх)"
                  value={draft.backgroundTopColor}
                  onChange={(value) => setDraft((prev) => ({ ...prev, backgroundTopColor: value }))}
                />
                <ColorPicker
                  label="Фон (низ)"
                  value={draft.backgroundBottomColor}
                  onChange={(value) =>
                    setDraft((prev) => ({ ...prev, backgroundBottomColor: value }))
                  }
                />
                <ColorPicker
                  label="Свечение"
                  value={draft.auraColor}
                  onChange={(value) => setDraft((prev) => ({ ...prev, auraColor: value }))}
                />
                <ColorPicker
                  label="Кольца и highlights"
                  value={draft.ringColor}
                  onChange={(value) => setDraft((prev) => ({ ...prev, ringColor: value }))}
                />
                <ColorPicker
                  label="Поверхности"
                  value={draft.surfaceColor}
                  onChange={(value) => setDraft((prev) => ({ ...prev, surfaceColor: value }))}
                />
                <ColorPicker
                  label="Границы поверхностей"
                  value={draft.surfaceBorderColor}
                  onChange={(value) => setDraft((prev) => ({ ...prev, surfaceBorderColor: value }))}
                />
                <ColorPicker
                  label="Скроллбар (ползунок)"
                  value={draft.scrollbarThumbColor}
                  onChange={(value) =>
                    setDraft((prev) => ({ ...prev, scrollbarThumbColor: value }))
                  }
                />
                <ColorPicker
                  label="Скроллбар (трек)"
                  value={draft.scrollbarTrackColor}
                  onChange={(value) =>
                    setDraft((prev) => ({ ...prev, scrollbarTrackColor: value }))
                  }
                />
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-dark-300">
                Навигация
              </h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <ColorPicker
                  label="Фон меню"
                  value={draft.navBackgroundColor}
                  onChange={(value) => setDraft((prev) => ({ ...prev, navBackgroundColor: value }))}
                />
                <ColorPicker
                  label="Активная кнопка меню"
                  value={draft.navActiveColor}
                  onChange={(value) => setDraft((prev) => ({ ...prev, navActiveColor: value }))}
                />
                <ColorPicker
                  label="Текст и иконки меню"
                  value={draft.navTextColor}
                  onChange={(value) => setDraft((prev) => ({ ...prev, navTextColor: value }))}
                />
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-dark-300">
                Скорости и ритм
              </h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <NumberSlider
                  label="Появление контента"
                  value={draft.contentEnterMs}
                  min={120}
                  max={2000}
                  step={20}
                  suffix="ms"
                  onChange={(value) => setDraft((prev) => ({ ...prev, contentEnterMs: value }))}
                />
                <NumberSlider
                  label="Тап-волна"
                  value={draft.tapRingMs}
                  min={160}
                  max={2600}
                  step={20}
                  suffix="ms"
                  onChange={(value) => setDraft((prev) => ({ ...prev, tapRingMs: value }))}
                />
                <NumberSlider
                  label="Основной цикл сцены"
                  value={draft.ringWaveSec}
                  min={2}
                  max={60}
                  step={0.2}
                  suffix="s"
                  onChange={(value) => setDraft((prev) => ({ ...prev, ringWaveSec: value }))}
                />
                <NumberSlider
                  label="Локальное свечение"
                  value={draft.sliderGlowSec}
                  min={0.4}
                  max={12}
                  step={0.1}
                  suffix="s"
                  onChange={(value) => setDraft((prev) => ({ ...prev, sliderGlowSec: value }))}
                />
                <NumberSlider
                  label="Пульсация сцены"
                  value={draft.stepRingSec}
                  min={1}
                  max={20}
                  step={0.1}
                  suffix="s"
                  onChange={(value) => setDraft((prev) => ({ ...prev, stepRingSec: value }))}
                />
                <NumberSlider
                  label="Success-волна"
                  value={draft.successWaveMs}
                  min={180}
                  max={3200}
                  step={20}
                  suffix="ms"
                  onChange={(value) => setDraft((prev) => ({ ...prev, successWaveMs: value }))}
                />
                <NumberSlider
                  label="Появление блоков"
                  value={draft.itemEnterMs}
                  min={100}
                  max={1200}
                  step={10}
                  suffix="ms"
                  onChange={(value) => setDraft((prev) => ({ ...prev, itemEnterMs: value }))}
                />
              </div>
            </section>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dark-700/60 bg-dark-900/45 p-3">
        <button
          type="button"
          className="btn-primary"
          onClick={() => updateMutation.mutate(draft)}
          disabled={!hasChanges || updateMutation.isPending || resetMutation.isPending}
        >
          Сохранить
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setDraft(saved)}
          disabled={!hasChanges || updateMutation.isPending || resetMutation.isPending}
        >
          Отменить
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => resetMutation.mutate()}
          disabled={updateMutation.isPending || resetMutation.isPending}
        >
          Сбросить к дефолту
        </button>
        <span className="ml-auto text-xs text-dark-400">
          {hasChanges ? 'Есть несохранённые изменения' : 'Все изменения сохранены'}
        </span>
      </div>
    </div>
  );
}
