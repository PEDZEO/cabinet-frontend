import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { brandingApi, DEFAULT_ULTIMA_THEME_CONFIG, type UltimaThemeConfig } from '@/api/branding';
import { AdminBackButton } from '@/components/admin';
import { ColorPicker } from '@/components/ColorPicker';
import { applyUltimaThemeConfig } from '@/features/ultima/theme';

type UltimaThemePreset = {
  id: string;
  name: string;
  description: string;
  config: UltimaThemeConfig;
};

const ULTIMA_THEME_PRESETS: UltimaThemePreset[] = [
  {
    id: 'emerald',
    name: 'Emerald (Классика)',
    description: 'Базовый Ultima-стиль с мягкой зелёной аурой.',
    config: { ...DEFAULT_ULTIMA_THEME_CONFIG },
  },
  {
    id: 'neon-ocean',
    name: 'Neon Ocean',
    description: 'Холодный неон с яркими кольцами и контрастным меню.',
    config: {
      ...DEFAULT_ULTIMA_THEME_CONFIG,
      primaryColor: '#1ed6bf',
      secondaryColor: '#0a2a35',
      navBackgroundColor: '#0b2f36',
      navActiveColor: '#1ed6bf',
      navTextColor: '#cdf8ff',
      backgroundTopColor: '#021425',
      backgroundBottomColor: '#052933',
      auraColor: '#20d0c0',
      ringColor: '#c8fff8',
      surfaceColor: '#0b2d36',
      surfaceBorderColor: '#7ef0e4',
      scrollbarThumbColor: '#42dec9',
      scrollbarTrackColor: '#0b242b',
      ringWaveSec: 16,
      sliderGlowSec: 2.2,
    },
  },
  {
    id: 'sunset',
    name: 'Sunset Mint',
    description: 'Тёплый фон с мягким янтарным акцентом.',
    config: {
      ...DEFAULT_ULTIMA_THEME_CONFIG,
      primaryColor: '#f3b63c',
      primaryTextColor: '#1f1a0a',
      secondaryColor: '#1f3a32',
      secondaryTextColor: '#f7fff3',
      navBackgroundColor: '#24423a',
      navActiveColor: '#f3b63c',
      navTextColor: '#f3f7ea',
      backgroundTopColor: '#111f2d',
      backgroundBottomColor: '#1a3d37',
      auraColor: '#f0b04f',
      ringColor: '#ffe0a3',
      surfaceColor: '#1f3f39',
      surfaceBorderColor: '#f4d08a',
      scrollbarThumbColor: '#f0bd67',
      scrollbarTrackColor: '#1f2f2b',
      ringWaveSec: 20,
      tapRingMs: 860,
    },
  },
  {
    id: 'arctic',
    name: 'Arctic Glass',
    description: 'Светлые стеклянные акценты и более спокойные анимации.',
    config: {
      ...DEFAULT_ULTIMA_THEME_CONFIG,
      primaryColor: '#7de6d5',
      primaryTextColor: '#0d1c1f',
      secondaryColor: '#12313a',
      secondaryTextColor: '#eefeff',
      navBackgroundColor: '#12313a',
      navActiveColor: '#8cf5e4',
      navTextColor: '#d9fcff',
      backgroundTopColor: '#041a29',
      backgroundBottomColor: '#0a2f3d',
      auraColor: '#7fefe0',
      ringColor: '#ddfffb',
      surfaceColor: '#12363e',
      surfaceBorderColor: '#b7faf0',
      scrollbarThumbColor: '#99f3e5',
      scrollbarTrackColor: '#14313b',
      contentEnterMs: 300,
      ringWaveSec: 22,
      stepRingSec: 6.8,
    },
  },
];

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
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm text-dark-300">
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

export default function AdminUltimaTheme() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<UltimaThemeConfig>(DEFAULT_ULTIMA_THEME_CONFIG);
  const [saved, setSaved] = useState<UltimaThemeConfig>(DEFAULT_ULTIMA_THEME_CONFIG);

  const { data, isLoading } = useQuery({
    queryKey: ['ultima-theme-config'],
    queryFn: brandingApi.getUltimaThemeConfig,
  });

  useEffect(() => {
    const next = data ?? DEFAULT_ULTIMA_THEME_CONFIG;
    setDraft(next);
    setSaved(next);
  }, [data]);

  useEffect(() => {
    applyUltimaThemeConfig(draft);
  }, [draft]);

  const updateMutation = useMutation({
    mutationFn: brandingApi.updateUltimaThemeConfig,
    onSuccess: (updated) => {
      setSaved(updated);
      setDraft(updated);
      queryClient.setQueryData(['ultima-theme-config'], updated);
    },
  });

  const resetMutation = useMutation({
    mutationFn: brandingApi.resetUltimaThemeConfig,
    onSuccess: (updated) => {
      setSaved(updated);
      setDraft(updated);
      queryClient.setQueryData(['ultima-theme-config'], updated);
    },
  });

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(saved);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="mb-2 flex items-center gap-3">
        <AdminBackButton to="/admin/ultima-settings" />
        <div>
          <h1 className="text-xl font-semibold text-dark-100">Тема и анимации Ultima</h1>
          <p className="text-sm text-dark-400">
            Отдельная полная кастомизация цветов, фона и скоростей анимаций для Ultima режима.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-dark-700/50 bg-dark-800/30 p-4">
        {isLoading ? (
          <div className="py-8 text-center text-dark-400">Загрузка...</div>
        ) : (
          <div className="space-y-6">
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-dark-300">
                Готовые шаблоны
              </h2>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {ULTIMA_THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className="rounded-xl border border-dark-700/70 bg-dark-900/55 p-3 text-left transition hover:border-accent-500/40 hover:bg-dark-800/60"
                    onClick={() => setDraft({ ...preset.config })}
                  >
                    <div className="text-sm font-semibold text-dark-100">{preset.name}</div>
                    <div className="mt-1 text-xs leading-snug text-dark-400">
                      {preset.description}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-dark-300">
                Рамки и контуры
              </h2>
              <div className="space-y-2 rounded-xl border border-dark-700/70 bg-dark-900/55 p-3">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-dark-700/70 bg-dark-900/70 px-3 py-2 text-left transition hover:border-accent-500/40"
                  onClick={() =>
                    setDraft((prev) => ({ ...prev, framesEnabled: !prev.framesEnabled }))
                  }
                >
                  <div>
                    <div className="text-sm font-semibold text-dark-100">Показывать рамки</div>
                    <div className="text-xs text-dark-400">
                      Вкл: карточки и блоки с видимыми контурами. Выкл: стекло без рамок.
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${draft.framesEnabled ? 'bg-accent-500/20 text-accent-300' : 'bg-dark-700/70 text-dark-300'}`}
                  >
                    {draft.framesEnabled ? 'Включено' : 'Выключено'}
                  </span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-dark-700/70 bg-dark-900/70 px-3 py-2 text-left transition hover:border-accent-500/40"
                  onClick={() =>
                    setDraft((prev) => ({ ...prev, homeUseBrandLogo: !prev.homeUseBrandLogo }))
                  }
                >
                  <div>
                    <div className="text-sm font-semibold text-dark-100">
                      Логотип вместо щита на главной
                    </div>
                    <div className="text-xs text-dark-400">
                      Если включено, на главной Ultima используется загруженный логотип проекта.
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${draft.homeUseBrandLogo ? 'bg-accent-500/20 text-accent-300' : 'bg-dark-700/70 text-dark-300'}`}
                  >
                    {draft.homeUseBrandLogo ? 'Включено' : 'Выключено'}
                  </span>
                </button>
              </div>
            </section>

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
                Фон и элементы
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
                  label="Цвет свечения"
                  value={draft.auraColor}
                  onChange={(value) => setDraft((prev) => ({ ...prev, auraColor: value }))}
                />
                <ColorPicker
                  label="Цвет колец"
                  value={draft.ringColor}
                  onChange={(value) => setDraft((prev) => ({ ...prev, ringColor: value }))}
                />
                <ColorPicker
                  label="Цвет карточек"
                  value={draft.surfaceColor}
                  onChange={(value) => setDraft((prev) => ({ ...prev, surfaceColor: value }))}
                />
                <ColorPicker
                  label="Граница карточек"
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
                Нижнее меню
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
                  label="Иконки и текст меню"
                  value={draft.navTextColor}
                  onChange={(value) => setDraft((prev) => ({ ...prev, navTextColor: value }))}
                />
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-dark-300">
                Скорость анимаций
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
                  label="Фоновые кольца"
                  value={draft.ringWaveSec}
                  min={2}
                  max={60}
                  step={0.2}
                  suffix="s"
                  onChange={(value) => setDraft((prev) => ({ ...prev, ringWaveSec: value }))}
                />
                <NumberSlider
                  label="Свечение ползунка"
                  value={draft.sliderGlowSec}
                  min={0.4}
                  max={12}
                  step={0.1}
                  suffix="s"
                  onChange={(value) => setDraft((prev) => ({ ...prev, sliderGlowSec: value }))}
                />
                <NumberSlider
                  label="Дыхание step-колец"
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
                  label="Появление блоков списка"
                  value={draft.itemEnterMs}
                  min={100}
                  max={1200}
                  step={10}
                  suffix="ms"
                  onChange={(value) => setDraft((prev) => ({ ...prev, itemEnterMs: value }))}
                />
              </div>
            </section>

            <div className="flex flex-wrap gap-2">
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
