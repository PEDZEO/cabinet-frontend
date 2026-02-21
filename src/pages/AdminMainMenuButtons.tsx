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
import { AdminBackButton } from '../components/admin';
import { ButtonsTab } from '../components/admin/ButtonsTab';

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

function buildBuckets(ids: string[], lengths: number[]): string[][] {
  const buckets: string[][] = [];
  let pointer = 0;
  lengths.forEach((count) => {
    const safeCount = Math.max(count, 0);
    buckets.push(ids.slice(pointer, pointer + safeCount));
    pointer += safeCount;
  });
  if (pointer < ids.length) {
    if (buckets.length === 0) {
      buckets.push([]);
    }
    buckets[buckets.length - 1] = [...buckets[buckets.length - 1], ...ids.slice(pointer)];
  }
  return buckets;
}

function findRowIndexById(buckets: string[][], buttonId: string): number {
  for (let idx = 0; idx < buckets.length; idx += 1) {
    if (buckets[idx].includes(buttonId)) {
      return idx;
    }
  }
  return -1;
}

interface SortablePreviewButtonProps {
  buttonId: string;
  button: MenuButtonConfig;
  lang: string;
  onEdit: () => void;
  onDeactivate: () => void;
}

function SortablePreviewButton({
  buttonId,
  button,
  lang,
  onEdit,
  onDeactivate,
}: SortablePreviewButtonProps) {
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
      className={`group flex min-h-[40px] items-center gap-2 rounded-md border px-2 py-1.5 ${
        isDragging
          ? 'border-accent-500/50 bg-dark-800 shadow-lg shadow-accent-500/20'
          : 'border-dark-700/70 bg-dark-800/70 hover:border-dark-600'
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="touch-none rounded-lg p-1.5 text-dark-500 transition-colors hover:bg-dark-700/50 hover:text-dark-300"
        title="Перетащить для смены порядка"
        aria-label={`Drag ${buttonId}`}
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
      </button>

      <button
        type="button"
        onClick={onEdit}
        className="line-clamp-2 min-w-0 flex-1 text-left text-sm text-dark-100"
        title={getButtonText(buttonId, button, lang)}
      >
        {getButtonText(buttonId, button, lang)}
      </button>

      <button
        type="button"
        onClick={onDeactivate}
        className="rounded-md border border-dark-700/70 px-2 py-1 text-xs text-dark-300 hover:border-dark-500 hover:text-dark-100"
      >
        Скрыть
      </button>
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
  const [activeTab, setActiveTab] = useState<'layout' | 'sections'>('layout');
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const [addMenuRowIndex, setAddMenuRowIndex] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'menu-layout'],
    queryFn: adminMenuLayoutApi.get,
  });

  const initialOrder = useMemo(() => (data ? buildInitialOrder(data) : []), [data]);

  useEffect(() => {
    if (!data) {
      return;
    }
    setOrderIds(buildInitialOrder(data));
    setRowLengths(data.rows.map((row) => row.buttons.length));
    setSelectedRowIndex(0);
    setAddMenuRowIndex(null);
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
    if (!data || orderedIds.length === 0) {
      return [];
    }

    const rows: { rowIndex: number; items: { id: string; config: MenuButtonConfig }[] }[] = [];
    let pointer = 0;

    rowLengths.forEach((count, rowIndex) => {
      const slice = orderedIds.slice(pointer, pointer + Math.max(count, 0));
      pointer += Math.max(count, 0);
      const rowItems = slice
        .map((id) => {
          const config = buttonsById[id];
          if (!config || !config.enabled) {
            return null;
          }
          return { id, config };
        })
        .filter((item): item is { id: string; config: MenuButtonConfig } => item !== null);

      rows.push({ rowIndex, items: rowItems });
    });

    // Defensive fallback for newly added IDs not reflected in rowLengths yet.
    if (pointer < orderedIds.length) {
      const tailItems = orderedIds
        .slice(pointer)
        .map((id) => {
          const config = buttonsById[id];
          if (!config || !config.enabled) {
            return null;
          }
          return { id, config };
        })
        .filter((item): item is { id: string; config: MenuButtonConfig } => item !== null);
      if (tailItems.length > 0) {
        const lastRowIndex = Math.max(rows.length - 1, 0);
        if (!rows[lastRowIndex]) {
          rows[lastRowIndex] = { rowIndex: lastRowIndex, items: [] };
        }
        rows[lastRowIndex].items = [...rows[lastRowIndex].items, ...tailItems];
      }
    }

    return rows;
  }, [buttonsById, data, orderedIds, rowLengths]);

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
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);
    const buckets = buildBuckets(orderedIds, rowLengths);
    const sourceRowIndex = findRowIndexById(buckets, activeId);
    const targetRowIndex = findRowIndexById(buckets, overId);

    setSuccess(null);
    setOrderIds((prev) =>
      reorderVisibleSubset(
        prev,
        activeButtons.map((item) => item.id),
        activeId,
        overId,
      ),
    );

    if (
      data &&
      sourceRowIndex !== -1 &&
      targetRowIndex !== -1 &&
      sourceRowIndex !== targetRowIndex
    ) {
      const targetMaxPerRow = Math.max(data.rows[targetRowIndex]?.max_per_row ?? 2, 1);
      const targetCurrent = rowLengths[targetRowIndex] ?? 0;
      if (targetCurrent < targetMaxPerRow) {
        setRowLengths((prev) => {
          const next = [...prev];
          next[sourceRowIndex] = Math.max((next[sourceRowIndex] ?? 0) - 1, 0);
          next[targetRowIndex] = (next[targetRowIndex] ?? 0) + 1;
          return next;
        });
      }
    }
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

  const moveButtonToRow = (buttonId: string, targetRowIndex: number) => {
    if (!data || rowLengths.length === 0) {
      return;
    }

    const buckets = buildBuckets(orderedIds, rowLengths);
    const sourceRowIndex = findRowIndexById(buckets, buttonId);

    if (sourceRowIndex === -1) {
      return;
    }

    const safeTarget = Math.min(Math.max(targetRowIndex, 0), buckets.length - 1);
    const targetMaxPerRow = Math.max(data.rows[safeTarget]?.max_per_row ?? 2, 1);
    const targetCurrent = rowLengths[safeTarget] ?? 0;
    if (sourceRowIndex !== safeTarget && targetCurrent >= targetMaxPerRow) {
      setError(`ROW ${safeTarget + 1} уже заполнен`);
      return;
    }

    const sourcePos = buckets[sourceRowIndex].indexOf(buttonId);
    if (sourcePos === -1) {
      return;
    }
    buckets[sourceRowIndex].splice(sourcePos, 1);
    buckets[safeTarget].push(buttonId);

    setOrderIds(buckets.flat());
    setRowLengths(buckets.map((row) => row.length));
  };

  const activateToRow = (buttonId: string, current: boolean, rowIndex: number) => {
    moveButtonToRow(buttonId, rowIndex);
    toggleEnabled(buttonId, current);
    setAddMenuRowIndex(null);
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
        {activeTab === 'layout' && (
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
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('layout')}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'layout'
              ? 'bg-accent-500/15 text-accent-300'
              : 'bg-dark-800 text-dark-300 hover:bg-dark-700/70'
          }`}
        >
          {t('admin.mainMenuButtons.title')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sections')}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'sections'
              ? 'bg-accent-500/15 text-accent-300'
              : 'bg-dark-800 text-dark-300 hover:bg-dark-700/70'
          }`}
        >
          {t('admin.settings.menu.buttons', 'Стили кнопок')}
        </button>
      </div>

      {activeTab === 'layout' && error && (
        <div className="rounded-lg border border-error-500/30 bg-error-500/10 px-3 py-2 text-sm text-error-300">
          {error}
        </div>
      )}
      {activeTab === 'layout' && success && (
        <div className="rounded-lg border border-success-500/30 bg-success-500/10 px-3 py-2 text-sm text-success-300">
          {success}
        </div>
      )}

      {activeTab === 'sections' ? (
        <ButtonsTab />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(340px,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-4">
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
                {isLoading ? (
                  <div className="py-8 text-center text-dark-400">{t('common.loading')}</div>
                ) : activeButtons.length === 0 ? (
                  <div className="text-center text-xs text-dark-500">
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
                        {previewRows.map((row) => (
                          <div
                            key={`menu-row-${row.rowIndex}`}
                            className={`rounded-lg border bg-dark-900/40 p-2 transition-colors ${
                              row.rowIndex === selectedRowIndex
                                ? 'border-accent-500/60'
                                : 'border-dark-700/50'
                            }`}
                            onClick={() => setSelectedRowIndex(row.rowIndex)}
                          >
                            <div className="mb-2 text-[11px] uppercase tracking-wide text-dark-500">
                              Row {row.rowIndex + 1}
                            </div>
                            {row.items.length === 0 ? (
                              <div className="rounded-md border border-dashed border-dark-700/70 px-3 py-2 text-xs text-dark-500">
                                Пустой ряд
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {row.items.map((item) => (
                                  <SortablePreviewButton
                                    key={`preview-${item.id}`}
                                    buttonId={item.id}
                                    button={item.config}
                                    lang={lang}
                                    onEdit={() => handleEdit(item.id)}
                                    onDeactivate={() => toggleEnabled(item.id, item.config.enabled)}
                                  />
                                ))}
                              </div>
                            )}
                            {row.rowIndex === selectedRowIndex &&
                              (() => {
                                const maxPerRow = Math.max(
                                  data?.rows[row.rowIndex]?.max_per_row ?? 2,
                                  1,
                                );
                                const freeSlots = Math.max(maxPerRow - row.items.length, 0);
                                if (freeSlots === 0) {
                                  return null;
                                }
                                return (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {Array.from({ length: freeSlots }).map((_, slotIdx) => (
                                      <button
                                        key={`row-${row.rowIndex}-slot-${slotIdx}`}
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          setAddMenuRowIndex((prev) =>
                                            prev === row.rowIndex ? null : row.rowIndex,
                                          );
                                        }}
                                        className="rounded-md border border-dashed border-accent-500/40 bg-accent-500/10 px-3 py-1.5 text-xs text-accent-300 hover:bg-accent-500/20"
                                      >
                                        + Добавить
                                      </button>
                                    ))}
                                  </div>
                                );
                              })()}
                            {addMenuRowIndex === row.rowIndex && (
                              <div
                                className="mt-2 space-y-2 rounded-md border border-dark-700/60 bg-dark-900/70 p-2"
                                onClick={(event) => event.stopPropagation()}
                              >
                                {inactiveButtons.length === 0 ? (
                                  <div className="text-xs text-dark-500">Нет неактивных кнопок</div>
                                ) : (
                                  <>
                                    <div className="text-xs text-dark-500">
                                      Добавить в ROW {row.rowIndex + 1}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {inactiveButtons.map((item) => (
                                        <button
                                          key={`inline-add-${row.rowIndex}-${item.id}`}
                                          type="button"
                                          className="rounded-md border border-dark-700/70 bg-dark-800/70 px-2 py-1 text-xs text-dark-200 hover:border-accent-500/50"
                                          onClick={() =>
                                            activateToRow(
                                              item.id,
                                              item.config.enabled,
                                              row.rowIndex,
                                            )
                                          }
                                          title={getButtonText(item.id, item.config, lang)}
                                        >
                                          {getButtonText(item.id, item.config, lang)}
                                        </button>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-dark-500">
              <GripIcon />
              Перетаскивайте кнопки прямо в предпросмотре слева
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
      )}
    </div>
  );
}
