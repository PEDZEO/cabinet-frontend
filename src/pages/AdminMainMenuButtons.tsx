import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';
import {
  adminMenuLayoutApi,
  MenuButtonConfig,
  MenuButtonVisibility,
  MenuLayoutResponse,
} from '../api/adminMenuLayout';
import {
  BUTTON_SECTIONS,
  buttonStylesApi,
  type ButtonSection,
  type ButtonStylesUpdate,
} from '../api/buttonStyles';
import { AdminBackButton } from '../components/admin';
import { Toggle } from '../components/admin/Toggle';

interface FormState {
  text: string;
  action: string;
  openMode: 'callback' | 'direct';
  webappUrl: string;
  visibility: MenuButtonVisibility;
  enabled: boolean;
}

const DEFAULT_FORM: FormState = {
  text: '',
  action: '',
  openMode: 'callback',
  webappUrl: '',
  visibility: 'all',
  enabled: true,
};

const GripIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
    />
  </svg>
);

function getLangCode(language: string): string {
  return language.split('-')[0] || 'ru';
}

function getButtonText(buttonId: string, button: MenuButtonConfig, lang: string): string {
  return button.text[lang] || button.text.ru || Object.values(button.text)[0] || buttonId;
}

function buildInitialOrder(layout: MenuLayoutResponse): string[] {
  const fromRows = layout.rows.flatMap((row) => row.buttons);
  const known = new Set(fromRows);
  const missing = Object.keys(layout.buttons).filter((id) => !known.has(id));
  return [...fromRows, ...missing];
}

function chunkByRowCaps<T>(items: T[], rowCaps: number[]): T[][] {
  if (items.length === 0) {
    return [];
  }

  const rows: T[][] = [];
  let cursor = 0;

  for (const cap of rowCaps) {
    if (cursor >= items.length) {
      break;
    }

    const safeCap = Math.max(cap, 1);
    rows.push(items.slice(cursor, cursor + safeCap));
    cursor += safeCap;
  }

  const fallbackCap = Math.max(rowCaps[rowCaps.length - 1] ?? 2, 1);
  while (cursor < items.length) {
    rows.push(items.slice(cursor, cursor + fallbackCap));
    cursor += fallbackCap;
  }

  return rows;
}

function reorderVisibleSubset(
  source: string[],
  visibleIds: string[],
  activeId: string,
  overId: string,
): string[] {
  const oldVisibleIndex = visibleIds.findIndex((id) => id === activeId);
  const newVisibleIndex = visibleIds.findIndex((id) => id === overId);
  if (oldVisibleIndex === -1 || newVisibleIndex === -1) {
    return source;
  }

  const reorderedVisible = arrayMove(visibleIds, oldVisibleIndex, newVisibleIndex);
  const visibleIdSet = new Set(visibleIds);
  let cursor = 0;

  return source.map((id) => {
    if (!visibleIdSet.has(id)) {
      return id;
    }

    const next = reorderedVisible[cursor];
    cursor += 1;
    return next;
  });
}

interface SortableMenuButtonCardProps {
  buttonId: string;
  button: MenuButtonConfig;
  lang: string;
  position: number;
  onEdit: () => void;
  onToggleEnabled: () => void;
  t: (key: string) => string;
}

function SortableMenuButtonCard({
  buttonId,
  button,
  lang,
  position,
  onEdit,
  onToggleEnabled,
  t,
}: SortableMenuButtonCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: buttonId,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? 'relative' : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center ${
        isDragging
          ? 'border-accent-500/50 bg-dark-800 shadow-xl shadow-accent-500/20'
          : 'border-dark-700/50 bg-dark-800/50 hover:border-dark-600'
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="touch-none self-start rounded-lg p-2.5 text-dark-500 transition-colors hover:bg-dark-700/50 hover:text-dark-300 sm:self-auto sm:p-1.5"
        title="Перетащить для смены порядка"
        aria-label={`Drag ${buttonId}`}
      >
        <GripIcon />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-dark-700/70 px-2 py-0.5 text-xs text-dark-200">
            #{position}
          </span>
          <span className="rounded bg-dark-700/70 px-2 py-0.5 text-xs text-dark-200">
            {buttonId}
          </span>
          <span className="truncate font-semibold text-dark-100">
            {getButtonText(buttonId, button, lang)}
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="rounded-md border border-dark-700/60 bg-dark-800/70 px-2 py-0.5 text-dark-300">
            {t('admin.mainMenuButtons.actionTypeLabel')}: {button.type}
          </span>
          <span className="rounded-md border border-dark-700/60 bg-dark-800/70 px-2 py-0.5 text-dark-300">
            {t('admin.mainMenuButtons.visibilityLabel')}: {button.visibility}
          </span>
        </div>
      </div>

      <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-shrink-0">
        <button type="button" className="btn-secondary" onClick={onToggleEnabled}>
          {t('admin.mainMenuButtons.deactivate')}
        </button>
        <button type="button" className="btn-secondary" onClick={onEdit}>
          {t('common.edit')}
        </button>
      </div>
    </div>
  );
}

export default function AdminMainMenuButtons() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const lang = getLangCode(i18n.resolvedLanguage || i18n.language || 'ru');

  const [orderIds, setOrderIds] = useState<string[]>([]);
  const [rowLengths, setRowLengths] = useState<number[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'menu-layout'],
    queryFn: adminMenuLayoutApi.get,
  });
  const { data: buttonStyles } = useQuery({
    queryKey: ['button-styles'],
    queryFn: buttonStylesApi.getStyles,
  });

  const initialOrder = useMemo(() => (data ? buildInitialOrder(data) : []), [data]);

  useEffect(() => {
    if (!data) {
      return;
    }
    setOrderIds(buildInitialOrder(data));
    setRowLengths(data.rows.map((row) => row.buttons.length));
  }, [data]);

  const buttonsById = useMemo(() => data?.buttons ?? {}, [data?.buttons]);
  const orderedIds = useMemo(
    () => orderIds.filter((id) => Boolean(buttonsById[id])),
    [buttonsById, orderIds],
  );

  const orderedButtons = useMemo(
    () =>
      orderedIds.map((id) => ({
        id,
        config: buttonsById[id],
      })),
    [buttonsById, orderedIds],
  );

  const activeButtons = useMemo(
    () => orderedButtons.filter((item) => item.config.enabled),
    [orderedButtons],
  );

  const inactiveButtons = useMemo(
    () => orderedButtons.filter((item) => !item.config.enabled),
    [orderedButtons],
  );

  const hasOrderChanges = useMemo(() => {
    if (orderedIds.length !== initialOrder.length) {
      return false;
    }
    return orderedIds.some((id, index) => initialOrder[index] !== id);
  }, [initialOrder, orderedIds]);

  const visibilityOptions = useMemo(
    () => [
      { value: 'all' as const, label: t('admin.mainMenuButtons.visibilityAll') },
      { value: 'admins' as const, label: t('admin.mainMenuButtons.visibilityAdmins') },
      { value: 'subscribers' as const, label: t('admin.mainMenuButtons.visibilitySubscribers') },
      { value: 'moderators' as const, label: 'Moderators only' },
    ],
    [t],
  );

  const previewRows = useMemo(() => {
    const rowCaps = data?.rows.map((row) => Math.max(row.max_per_row, 1)) ?? [];
    return chunkByRowCaps(activeButtons, rowCaps);
  }, [activeButtons, data?.rows]);

  const saveLayoutMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!data) {
        return;
      }

      const rows = data.rows.map((row) => ({
        id: row.id,
        max_per_row: row.max_per_row,
        conditions: row.conditions,
        buttons: [] as string[],
      }));

      let pointer = 0;
      rows.forEach((row, index) => {
        const count = rowLengths[index] ?? 0;
        row.buttons = ids.slice(pointer, pointer + count);
        pointer += count;
      });

      if (pointer < ids.length && rows.length > 0) {
        rows[rows.length - 1].buttons = [...rows[rows.length - 1].buttons, ...ids.slice(pointer)];
      }

      await adminMenuLayoutApi.update({ rows });
    },
    onSuccess: () => {
      setError(null);
      setSuccess(t('admin.mainMenuButtons.orderSaved'));
      queryClient.invalidateQueries({ queryKey: ['admin', 'menu-layout'] });
    },
    onError: () => {
      setError(t('admin.mainMenuButtons.orderSaveError'));
    },
  });

  const updateButtonMutation = useMutation({
    mutationFn: ({
      buttonId,
      payload,
    }: {
      buttonId: string;
      payload: Parameters<typeof adminMenuLayoutApi.updateButton>[1];
    }) => adminMenuLayoutApi.updateButton(buttonId, payload),
    onSuccess: () => {
      setError(null);
      setSuccess(t('admin.mainMenuButtons.saved'));
      queryClient.invalidateQueries({ queryKey: ['admin', 'menu-layout'] });
    },
    onError: () => {
      setError(t('admin.mainMenuButtons.saveError'));
    },
  });
  const updateButtonSectionMutation = useMutation({
    mutationFn: async ({ section, enabled }: { section: ButtonSection; enabled: boolean }) => {
      const payload: ButtonStylesUpdate = { [section]: { enabled } };
      return buttonStylesApi.updateStyles(payload);
    },
    onSuccess: (styles) => {
      queryClient.setQueryData(['button-styles'], styles);
      setError(null);
      setSuccess('Настройки секций кнопок обновлены');
    },
    onError: () => {
      setError(t('common.error'));
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    setSuccess(null);
    setOrderIds((prev) =>
      reorderVisibleSubset(
        prev,
        activeButtons.map((item) => item.id),
        String(active.id),
        String(over.id),
      ),
    );
  };

  const handleEdit = (buttonId: string) => {
    const button = buttonsById[buttonId];
    if (!button) {
      return;
    }

    setEditingId(buttonId);
    setForm({
      text: getButtonText(buttonId, button, lang),
      action: button.action || '',
      openMode: button.open_mode || 'callback',
      webappUrl: button.webapp_url || '',
      visibility: button.visibility,
      enabled: button.enabled,
    });
    setError(null);
    setSuccess(null);
  };

  const handleSaveEdit = () => {
    if (!editingId) {
      return;
    }

    const button = buttonsById[editingId];
    if (!button) {
      return;
    }

    if (!form.text.trim()) {
      setError(t('admin.mainMenuButtons.textRequired'));
      return;
    }

    if (!form.action.trim()) {
      setError(t('admin.mainMenuButtons.actionValueRequired'));
      return;
    }

    updateButtonMutation.mutate({
      buttonId: editingId,
      payload: {
        text: {
          ...button.text,
          [lang]: form.text.trim(),
        },
        action: form.action.trim(),
        open_mode: form.openMode,
        webapp_url: form.openMode === 'direct' ? form.webappUrl.trim() || null : null,
        visibility: form.visibility,
        enabled: form.enabled,
      },
    });

    setEditingId(null);
    setForm(DEFAULT_FORM);
  };

  const toggleEnabled = (buttonId: string, current: boolean) => {
    updateButtonMutation.mutate({
      buttonId,
      payload: { enabled: !current },
    });
    setSuccess(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AdminBackButton to="/admin" />
          <div>
            <h1 className="text-xl font-bold text-dark-100">{t('admin.mainMenuButtons.title')}</h1>
            <p className="text-sm text-dark-400">{t('admin.mainMenuButtons.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="btn-secondary" disabled={isFetching}>
            {t('common.refresh')}
          </button>
          <button
            className="btn-primary"
            onClick={() => saveLayoutMutation.mutate(orderedIds)}
            disabled={!hasOrderChanges || saveLayoutMutation.isPending}
          >
            {saveLayoutMutation.isPending
              ? t('admin.mainMenuButtons.savingOrder')
              : t('admin.mainMenuButtons.saveOrder')}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-error-500/30 bg-error-500/10 px-3 py-2 text-sm text-error-300">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-success-500/30 bg-success-500/10 px-3 py-2 text-sm text-success-300">
          {success}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(340px,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-4">
          <div className="card p-4">
            <h2 className="mb-2 text-sm font-semibold text-dark-200">
              Секции из «Настройки → Кнопки»
            </h2>
            <p className="mb-3 text-xs text-dark-500">
              Эти переключатели используют тот же API, что и раздел «Кнопки» в настройках.
            </p>
            <div className="space-y-2">
              {BUTTON_SECTIONS.map((section) => {
                const enabled = buttonStyles?.[section]?.enabled ?? true;
                return (
                  <div
                    key={section}
                    className="flex items-center justify-between rounded-lg border border-dark-700/60 bg-dark-800/40 px-3 py-2"
                  >
                    <span className="text-sm text-dark-200">
                      {t(`admin.buttons.sections.${section}`)}
                    </span>
                    <Toggle
                      checked={enabled}
                      onChange={() =>
                        updateButtonSectionMutation.mutate({
                          section,
                          enabled: !enabled,
                        })
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-dark-200">
                {t('admin.mainMenuButtons.previewTitle')}
              </h2>
              <span className="text-xs text-dark-500">
                {t('admin.mainMenuButtons.total', { count: orderedIds.length })}
              </span>
            </div>
            <p className="mb-3 text-xs text-dark-500">{t('admin.mainMenuButtons.previewHint')}</p>

            <div className="rounded-xl border border-dark-700/60 bg-dark-950/70 p-3">
              {activeButtons.length === 0 ? (
                <div className="text-center text-xs text-dark-500">
                  {t('admin.mainMenuButtons.empty')}
                </div>
              ) : (
                <div className="space-y-2">
                  {previewRows.map((row, rowIndex) => (
                    <div
                      key={`menu-row-${rowIndex}`}
                      className="rounded-lg border border-dark-700/50 bg-dark-900/40 p-2"
                    >
                      <div className="mb-2 text-[11px] uppercase tracking-wide text-dark-500">
                        Row {rowIndex + 1}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {row.map((item) => (
                          <div
                            key={`preview-${item.id}`}
                            className="min-w-[120px] flex-1 rounded-md border border-dark-700/70 bg-dark-800/70 px-3 py-2 text-center text-xs text-dark-100"
                            title={getButtonText(item.id, item.config, lang)}
                          >
                            <span className="line-clamp-2">
                              {getButtonText(item.id, item.config, lang)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card p-4">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-lg border border-dark-700/60 bg-dark-800/40 px-3 py-2 text-left text-sm text-dark-200"
              onClick={() => setShowInactive((prev) => !prev)}
              aria-expanded={showInactive}
            >
              <span>
                {t('admin.mainMenuButtons.inactiveListTitle')} ({inactiveButtons.length})
              </span>
              <span className="text-dark-400">{showInactive ? 'Скрыть' : 'Показать'}</span>
            </button>

            {showInactive && (
              <div className="mt-3 space-y-2">
                {inactiveButtons.length === 0 && (
                  <div className="rounded-lg border border-dark-700/60 bg-dark-800/30 p-3 text-sm text-dark-400">
                    Нет неактивных кнопок
                  </div>
                )}
                {inactiveButtons.map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-3 rounded-xl border border-dark-700/60 bg-dark-800/30 p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-dark-700/70 px-2 py-0.5 text-xs text-dark-200">
                          {item.id}
                        </span>
                        <span className="truncate text-sm font-medium text-dark-100">
                          {getButtonText(item.id, item.config, lang)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-start gap-2 md:justify-end">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => toggleEnabled(item.id, item.config.enabled)}
                      >
                        {t('admin.mainMenuButtons.activate')}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => handleEdit(item.id)}
                      >
                        {t('common.edit')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-dark-500">
            <GripIcon />
            Перетащите карточку за иконку и нажмите «Сохранить порядок»
          </div>

          <div className="card p-4">
            <h2 className="mb-3 text-sm font-semibold text-dark-200">
              {t('admin.mainMenuButtons.activeListTitle')} ({activeButtons.length})
            </h2>

            {isLoading ? (
              <div className="py-8 text-center text-dark-400">{t('common.loading')}</div>
            ) : activeButtons.length === 0 ? (
              <div className="rounded-lg border border-dark-700/60 bg-dark-800/30 p-4 text-center text-dark-400">
                {t('admin.mainMenuButtons.empty')}
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={activeButtons.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {activeButtons.map((item) => {
                      const position = orderedIds.findIndex((id) => id === item.id) + 1;
                      return (
                        <SortableMenuButtonCard
                          key={item.id}
                          buttonId={item.id}
                          button={item.config}
                          lang={lang}
                          position={position}
                          onToggleEnabled={() => toggleEnabled(item.id, item.config.enabled)}
                          onEdit={() => handleEdit(item.id)}
                          t={(key) => t(key)}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          {editingId && (
            <div className="card space-y-4 p-4">
              <h2 className="text-sm font-semibold text-dark-200">
                {t('admin.mainMenuButtons.editButton')}
              </h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs text-dark-400">
                    {t('admin.mainMenuButtons.textLabel')}
                  </span>
                  <input
                    value={form.text}
                    onChange={(e) => setForm((prev) => ({ ...prev, text: e.target.value }))}
                    className="input"
                    maxLength={64}
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs text-dark-400">
                    {t('admin.mainMenuButtons.actionValueLabel')}
                  </span>
                  <input
                    value={form.action}
                    onChange={(e) => setForm((prev) => ({ ...prev, action: e.target.value }))}
                    className="input"
                    maxLength={1024}
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs text-dark-400">Режим открытия</span>
                  <select
                    value={form.openMode}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        openMode: e.target.value as 'callback' | 'direct',
                      }))
                    }
                    className="input"
                  >
                    <option value="callback">Callback (через бота)</option>
                    <option value="direct">WebApp URL (напрямую)</option>
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-xs text-dark-400">WebApp URL (для direct)</span>
                  <input
                    value={form.webappUrl}
                    onChange={(e) => setForm((prev) => ({ ...prev, webappUrl: e.target.value }))}
                    className="input"
                    placeholder="https://..."
                    maxLength={1024}
                    disabled={form.openMode !== 'direct'}
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs text-dark-400">
                    {t('admin.mainMenuButtons.visibilityLabel')}
                  </span>
                  <select
                    value={form.visibility}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        visibility: e.target.value as MenuButtonVisibility,
                      }))
                    }
                    className="input"
                  >
                    {visibilityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={form.enabled}
                onClick={() => setForm((prev) => ({ ...prev, enabled: !prev.enabled }))}
                className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                  form.enabled
                    ? 'border-success-500/50 bg-success-500/10 text-success-300'
                    : 'border-dark-600 bg-dark-800/40 text-dark-300'
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    form.enabled ? 'bg-success-400' : 'bg-dark-500'
                  }`}
                />
                {t('admin.mainMenuButtons.isActiveLabel')}
              </button>

              <div className="flex flex-wrap gap-2">
                <button
                  className="btn-primary"
                  onClick={handleSaveEdit}
                  disabled={updateButtonMutation.isPending}
                >
                  {t('common.save')}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setEditingId(null);
                    setForm(DEFAULT_FORM);
                  }}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
