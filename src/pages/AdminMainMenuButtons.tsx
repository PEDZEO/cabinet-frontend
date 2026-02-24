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
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useTranslation } from 'react-i18next';
import { adminMenuLayoutApi, MenuButtonVisibility, MenuRowConfig } from '../api/adminMenuLayout';
import { AdminBackButton } from '../components/admin';
import { ButtonsTab } from '../components/admin/ButtonsTab';
import { MainMenuButtonsStatsTab } from '../components/admin/MainMenuButtonsStatsTab';
import { GripIcon, SortablePreviewButton } from './adminMainMenuButtons/SortablePreviewButton';
import {
  buildBuckets,
  buildEditFormState,
  buildButtonUpdatePayload,
  buildInitialOrder,
  type MenuButtonEditFormValues,
  buildPreviewRows,
  buildRowDefinitions,
  buildRowsUpdatePayload,
  expandCapacityAtIndex,
  findRowIndexById,
  getButtonText,
  getLangCode,
  getSelectedRowAfterCollapse,
  hasRowsConfigChanged,
  MAX_ROW_SLOTS,
  moveButtonToRowState,
  removeRowAtIndexIfPossible,
  reorderVisibleSubset,
} from './adminMainMenuButtons/utils';

type FormState = MenuButtonEditFormValues;

const DEFAULT_FORM: FormState = {
  text: '',
  action: '',
  openMode: 'callback',
  webappUrl: '',
  visibility: 'all',
  enabled: true,
};

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
  const [activeTab, setActiveTab] = useState<'layout' | 'sections' | 'stats'>('layout');
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const [addMenuRowIndex, setAddMenuRowIndex] = useState<number | null>(null);
  const [rowCapacities, setRowCapacities] = useState<number[]>([]);
  const [rowDefs, setRowDefs] = useState<Array<Pick<MenuRowConfig, 'id' | 'conditions'>>>([]);

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
    setRowCapacities(data.rows.map((row) => Math.max(row.max_per_row || 1, 1)));
    setRowDefs(buildRowDefinitions(data.rows));
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
  const rowBuckets = useMemo(() => buildBuckets(orderedIds, rowLengths), [orderedIds, rowLengths]);

  const getEnabledCountForRow = (rowIndex: number): number =>
    (rowBuckets[rowIndex] ?? []).reduce(
      (count, id) => count + (buttonsById[id]?.enabled ? 1 : 0),
      0,
    );

  const hasOrderChanges = useMemo(() => {
    if (orderedIds.length !== initialOrder.length) {
      return false;
    }
    return orderedIds.some((id, index) => initialOrder[index] !== id);
  }, [initialOrder, orderedIds]);

  const hasRowsConfigChanges = useMemo(() => {
    if (!data) {
      return false;
    }
    return hasRowsConfigChanged(data.rows, rowDefs, rowLengths, rowCapacities);
  }, [data, rowCapacities, rowDefs, rowLengths]);

  const hasPendingChanges = hasOrderChanges || hasRowsConfigChanges;

  const visibilityOptions = useMemo(
    () => [
      { value: 'all' as const, label: t('admin.mainMenuButtons.visibilityAll') },
      { value: 'admins' as const, label: t('admin.mainMenuButtons.visibilityAdmins') },
      { value: 'subscribers' as const, label: t('admin.mainMenuButtons.visibilitySubscribers') },
      { value: 'moderators' as const, label: 'Moderators only' },
    ],
    [t],
  );

  const previewRows = useMemo(
    () => buildPreviewRows(orderedIds, rowLengths, buttonsById, Boolean(data)),
    [buttonsById, data, orderedIds, rowLengths],
  );

  const saveLayoutMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!data) {
        return;
      }

      const rows = buildRowsUpdatePayload(ids, rowDefs, rowLengths, rowCapacities);

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
    const sourceRowIndex = findRowIndexById(rowBuckets, activeId);
    const targetRowIndex = findRowIndexById(rowBuckets, overId);

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
      const targetMaxPerRow = Math.max(
        rowCapacities[targetRowIndex] ?? data.rows[targetRowIndex]?.max_per_row ?? MAX_ROW_SLOTS,
        1,
      );
      const targetCurrent = getEnabledCountForRow(targetRowIndex);
      if (targetCurrent < targetMaxPerRow) {
        setRowLengths((prev) => {
          const next = [...prev];
          next[sourceRowIndex] = Math.max((next[sourceRowIndex] ?? 0) - 1, 0);
          next[targetRowIndex] = (next[targetRowIndex] ?? 0) + 1;
          return next;
        });
      } else if (targetMaxPerRow < MAX_ROW_SLOTS) {
        setRowCapacities((prev) => {
          const next = [...prev];
          next[targetRowIndex] = MAX_ROW_SLOTS;
          return next;
        });
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
    setForm(buildEditFormState(buttonId, button, lang));
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
      payload: buildButtonUpdatePayload(button, lang, form),
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

    const safeTarget = Math.min(Math.max(targetRowIndex, 0), rowLengths.length - 1);
    const moveResult = moveButtonToRowState({
      orderedIds,
      rowLengths,
      rowCapacities,
      rowDefaultCapacities: data.rows.map((row) => row.max_per_row ?? MAX_ROW_SLOTS),
      buttonId,
      targetRowIndex,
      targetEnabledCount: getEnabledCountForRow(safeTarget),
      maxRowSlots: MAX_ROW_SLOTS,
    });
    if (moveResult.error === 'button_not_found') {
      return;
    }
    if (moveResult.error === 'row_full') {
      setError(`ROW ${moveResult.safeTarget + 1} уже заполнен`);
      return;
    }
    if (!moveResult.nextOrderIds || !moveResult.nextRowLengths) {
      return;
    }

    setOrderIds(moveResult.nextOrderIds);
    setRowLengths(moveResult.nextRowLengths);
  };

  const activateToRow = (buttonId: string, current: boolean, rowIndex: number) => {
    moveButtonToRow(buttonId, rowIndex);
    toggleEnabled(buttonId, current);
    setAddMenuRowIndex(null);
  };

  const expandRowCapacity = (rowIndex: number) => {
    setRowCapacities((prev) => expandCapacityAtIndex(prev, rowIndex, MAX_ROW_SLOTS));
  };

  const collapseEmptyRow = (rowIndex: number) => {
    if (getEnabledCountForRow(rowIndex) > 0) {
      setError('Можно удалить только пустой ряд');
      return;
    }

    setRowLengths((prev) => removeRowAtIndexIfPossible(prev, rowIndex));

    setRowCapacities((prev) => removeRowAtIndexIfPossible(prev, rowIndex));

    setRowDefs((prev) => removeRowAtIndexIfPossible(prev, rowIndex));

    setAddMenuRowIndex(null);
    setSelectedRowIndex((prev) => getSelectedRowAfterCollapse(prev, rowIndex));
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
              disabled={!hasPendingChanges || saveLayoutMutation.isPending}
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
        <button
          type="button"
          onClick={() => setActiveTab('stats')}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'stats'
              ? 'bg-accent-500/15 text-accent-300'
              : 'bg-dark-800 text-dark-300 hover:bg-dark-700/70'
          }`}
        >
          {t('admin.mainMenuButtons.statsTab')}
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
      ) : activeTab === 'stats' ? (
        <MainMenuButtonsStatsTab />
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
                                  rowCapacities[row.rowIndex] ??
                                    data?.rows[row.rowIndex]?.max_per_row ??
                                    MAX_ROW_SLOTS,
                                  1,
                                );
                                const freeSlots = Math.max(maxPerRow - row.items.length, 0);
                                return (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {maxPerRow < MAX_ROW_SLOTS && (
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          expandRowCapacity(row.rowIndex);
                                        }}
                                        className="rounded-md border border-dark-600 bg-dark-900/70 px-3 py-1.5 text-xs text-dark-200 hover:border-dark-500"
                                      >
                                        + Добавить место в ROW
                                      </button>
                                    )}
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
                                    {row.items.length === 0 && (
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          collapseEmptyRow(row.rowIndex);
                                        }}
                                        className="rounded-md border border-error-500/30 bg-error-500/10 px-3 py-1.5 text-xs text-error-300 hover:bg-error-500/20"
                                      >
                                        Удалить пустой ROW
                                      </button>
                                    )}
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
