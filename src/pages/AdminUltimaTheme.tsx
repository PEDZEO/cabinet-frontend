import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { brandingApi, DEFAULT_ULTIMA_THEME_CONFIG, type UltimaThemeConfig } from '@/api/branding';
import { AdminBackButton } from '@/components/admin';
import { ColorPicker } from '@/components/ColorPicker';
import { applyUltimaThemeConfig } from '@/features/ultima/theme';

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
