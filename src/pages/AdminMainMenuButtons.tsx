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
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useTranslation } from 'react-i18next';
import { adminMenuLayoutApi, MenuButtonVisibility, MenuRowConfig } from '../api/adminMenuLayout';
import { AdminBackButton } from '../components/admin';
import { ButtonsTab } from '../components/admin/ButtonsTab';
import { MainMenuButtonsStatsTab } from '../components/admin/MainMenuButtonsStatsTab';
import { GripIcon, SortablePreviewButton } from './adminMainMenuButtons/SortablePreviewButton';
import {
  buildBuckets,
  buildMainMenuButtonsTabOptions,
  buildEditFormState,
  buildMenuLayoutDerivedState,
  buildButtonUpdatePayload,
  buildOrderedButtons,
  buildVisibilityOptions,
  buildInitialOrder,
  DEFAULT_MENU_BUTTON_EDIT_FORM,
  getMainMenuButtonsTabClass,
  getSaveLayoutButtonLabel,
  type MenuButtonEditFormValues,
  type MainMenuButtonsTab,
  countEnabledButtonsForRow,
  buildPreviewRows,
  buildRowsUpdatePayload,
  expandCapacityAtIndex,
  findRowIndexById,
  getButtonText,
  getLangCode,
  getSelectedRowAfterCollapse,
  getRowCapacityState,
  hasOrderChanged,
  hasPendingLayoutChanges,
  hasRowsConfigChanged,
  MAX_ROW_SLOTS,
  moveButtonToRowState,
  removeRowAtIndexIfPossible,
  resetMenuButtonEditState,
  reorderVisibleSubset,
  splitOrderedButtonsByEnabled,
  toggleRowIndex,
  updateMenuButtonEditFormField,
  validateMenuButtonEditForm,
} from './adminMainMenuButtons/utils';

type FormState = MenuButtonEditFormValues;

export default function AdminMainMenuButtons() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const lang = getLangCode(i18n.resolvedLanguage || i18n.language || 'ru');

  const [orderIds, setOrderIds] = useState<string[]>([]);
  const [rowLengths, setRowLengths] = useState<number[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_MENU_BUTTON_EDIT_FORM);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MainMenuButtonsTab>('layout');
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const [addMenuRowIndex, setAddMenuRowIndex] = useState<number | null>(null);
  const [highlightedRowIndex, setHighlightedRowIndex] = useState<number | null>(null);
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
    const derived = buildMenuLayoutDerivedState(data);
    setOrderIds(derived.orderIds);
    setRowLengths(derived.rowLengths);
    setRowCapacities(derived.rowCapacities);
    setRowDefs(derived.rowDefs);
    setSelectedRowIndex(0);
    setAddMenuRowIndex(null);
  }, [data]);

  const buttonsById = useMemo(() => data?.buttons ?? {}, [data?.buttons]);
  const orderedIds = useMemo(
    () => orderIds.filter((id) => Boolean(buttonsById[id])),
    [buttonsById, orderIds],
  );

  const orderedButtons = useMemo(
    () => buildOrderedButtons(orderedIds, buttonsById),
    [buttonsById, orderedIds],
  );
  const { activeButtons, inactiveButtons } = useMemo(
    () => splitOrderedButtonsByEnabled(orderedButtons),
    [orderedButtons],
  );
  const rowBuckets = useMemo(() => buildBuckets(orderedIds, rowLengths), [orderedIds, rowLengths]);
  const rowDefaultCapacities = useMemo(
    () => data?.rows.map((row) => row.max_per_row ?? MAX_ROW_SLOTS) ?? [],
    [data?.rows],
  );

  const getEnabledCountForRow = (rowIndex: number): number =>
    countEnabledButtonsForRow(rowBuckets, buttonsById, rowIndex);
  const getButtonsCountForRow = (rowIndex: number): number => rowBuckets[rowIndex]?.length ?? 0;

  const hasOrderChanges = useMemo(
    () => hasOrderChanged(initialOrder, orderedIds),
    [initialOrder, orderedIds],
  );

  const hasRowsConfigChanges = useMemo(() => {
    if (!data) {
      return false;
    }
    return hasRowsConfigChanged(data.rows, rowDefs, rowLengths, rowCapacities);
  }, [data, rowCapacities, rowDefs, rowLengths]);

  const hasPendingChanges = hasPendingLayoutChanges(hasOrderChanges, hasRowsConfigChanges);

  const visibilityOptions = useMemo(() => buildVisibilityOptions(t), [t]);

  const previewRows = useMemo(
    () => buildPreviewRows(orderedIds, rowLengths, buttonsById, Boolean(data)),
    [buttonsById, data, orderedIds, rowLengths],
  );
  const tabOptions = useMemo(() => buildMainMenuButtonsTabOptions(t), [t]);

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

  const resetToDefaultMutation = useMutation({
    mutationFn: adminMenuLayoutApi.reset,
    onSuccess: (nextLayout) => {
      const derived = buildMenuLayoutDerivedState(nextLayout);
      setOrderIds(derived.orderIds);
      setRowLengths(derived.rowLengths);
      setRowCapacities(derived.rowCapacities);
      setRowDefs(derived.rowDefs);
      setSelectedRowIndex(0);
      setAddMenuRowIndex(null);
      setEditingId(null);
      setForm(DEFAULT_MENU_BUTTON_EDIT_FORM);
      setError(null);
      setSuccess(t('admin.mainMenuButtons.resetToDefaultSuccess'));
      queryClient.setQueryData(['admin', 'menu-layout'], nextLayout);
      queryClient.invalidateQueries({ queryKey: ['admin', 'menu-layout'] });
    },
    onError: () => {
      setError(t('admin.mainMenuButtons.resetToDefaultError'));
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

    const validationError = validateMenuButtonEditForm(form);
    if (validationError) {
      setError(t(validationError));
      return;
    }

    updateButtonMutation.mutate({
      buttonId: editingId,
      payload: buildButtonUpdatePayload(button, lang, form),
    });

    cancelEdit();
  };

  const updateFormField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((previous) => updateMenuButtonEditFormField(previous, field, value));
  };

  const cancelEdit = () => {
    const resetState = resetMenuButtonEditState();
    setEditingId(resetState.editingId);
    setForm(resetState.form);
  };

  const toggleEnabled = (buttonId: string, current: boolean) => {
    updateButtonMutation.mutate({
      buttonId,
      payload: { enabled: !current },
    });
    setSuccess(null);
  };

  const highlightRow = (rowIndex: number) => {
    setHighlightedRowIndex(rowIndex);
    window.setTimeout(() => {
      setHighlightedRowIndex((previous) => (previous === rowIndex ? null : previous));
    }, 700);
  };

  const moveButtonToRow = (buttonId: string, targetRowIndex: number): boolean => {
    if (!data || rowLengths.length === 0) {
      return false;
    }

    const safeTarget = Math.min(Math.max(targetRowIndex, 0), rowLengths.length - 1);
    const moveResult = moveButtonToRowState({
      orderedIds,
      rowLengths,
      rowCapacities,
      rowDefaultCapacities,
      buttonId,
      targetRowIndex,
      targetEnabledCount: getEnabledCountForRow(safeTarget),
      maxRowSlots: MAX_ROW_SLOTS,
    });
    if (moveResult.error === 'button_not_found') {
      return false;
    }
    if (moveResult.error === 'row_full') {
      setError(`ROW ${moveResult.safeTarget + 1} уже заполнен`);
      return false;
    }
    if (!moveResult.nextOrderIds || !moveResult.nextRowLengths) {
      return false;
    }

    setOrderIds(moveResult.nextOrderIds);
    setRowLengths(moveResult.nextRowLengths);
    highlightRow(moveResult.safeTarget);
    return true;
  };

  const activateToRow = (buttonId: string, current: boolean, rowIndex: number) => {
    const moved = moveButtonToRow(buttonId, rowIndex);
    if (!moved) {
      return;
    }
    toggleEnabled(buttonId, current);
    setAddMenuRowIndex(null);
  };

  const expandRowCapacity = (rowIndex: number) => {
    setRowCapacities((prev) => expandCapacityAtIndex(prev, rowIndex, MAX_ROW_SLOTS));
  };

  const collapseEmptyRow = (rowIndex: number) => {
    if (getButtonsCountForRow(rowIndex) > 0) {
      setError('Можно удалить только пустой ряд');
      return;
    }

    setRowLengths((prev) => removeRowAtIndexIfPossible(prev, rowIndex));

    setRowCapacities((prev) => removeRowAtIndexIfPossible(prev, rowIndex));

    setRowDefs((prev) => removeRowAtIndexIfPossible(prev, rowIndex));

    setAddMenuRowIndex(null);
    setSelectedRowIndex((prev) => getSelectedRowAfterCollapse(prev, rowIndex));
  };

  const setRowCapacity = (rowIndex: number, value: number) => {
    const safeValue = Math.min(Math.max(value, 1), MAX_ROW_SLOTS);
    const buttonsInRow = getButtonsCountForRow(rowIndex);
    if (safeValue < buttonsInRow) {
      setError(`Нельзя установить меньше ${buttonsInRow}: в ряду уже есть кнопки`);
      return;
    }
    setError(null);
    setRowCapacities((prev) => {
      const next = [...prev];
      next[rowIndex] = safeValue;
      return next;
    });
  };

  const resetLayoutChanges = () => {
    if (!data) {
      return;
    }

    const derived = buildMenuLayoutDerivedState(data);
    setOrderIds(derived.orderIds);
    setRowLengths(derived.rowLengths);
    setRowCapacities(derived.rowCapacities);
    setRowDefs(derived.rowDefs);
    setSelectedRowIndex(0);
    setAddMenuRowIndex(null);
    setError(null);
    setSuccess(null);
  };

  const resetEditForm = () => {
    if (!editingId) {
      return;
    }
    const button = buttonsById[editingId];
    if (!button) {
      return;
    }
    setForm(buildEditFormState(editingId, button, lang));
    setError(null);
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
        {activeTab === 'layout' && (
          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">
            <button onClick={() => refetch()} className="btn-secondary" disabled={isFetching}>
              {t('common.refresh')}
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(t('admin.mainMenuButtons.resetToDefaultConfirm'))) {
                  resetToDefaultMutation.mutate();
                }
              }}
              className="btn-secondary"
              disabled={resetToDefaultMutation.isPending}
            >
              {t('admin.mainMenuButtons.resetToDefault')}
            </button>
            <button
              type="button"
              onClick={resetLayoutChanges}
              className="btn-secondary"
              disabled={!hasPendingChanges}
            >
              {t('common.reset', { defaultValue: 'Сбросить' })}
            </button>
            <button
              className="btn-primary"
              onClick={() => saveLayoutMutation.mutate(orderedIds)}
              disabled={!hasPendingChanges || saveLayoutMutation.isPending}
            >
              {getSaveLayoutButtonLabel(t, saveLayoutMutation.isPending)}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {tabOptions.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={getMainMenuButtonsTabClass(activeTab, tab.key)}
          >
            {tab.label}
          </button>
        ))}
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
                      strategy={rectSortingStrategy}
                    >
                      <div className="space-y-3">
                        {previewRows.map((row) => (
                          <div
                            key={`menu-row-${row.rowIndex}`}
                            className={`rounded-xl border bg-dark-900/40 p-3 transition-colors ${
                              row.rowIndex === selectedRowIndex
                                ? 'border-accent-500/60'
                                : 'border-dark-700/50'
                            } ${
                              highlightedRowIndex === row.rowIndex
                                ? 'shadow-md shadow-accent-500/20 ring-1 ring-accent-400/60'
                                : ''
                            }`}
                            onClick={() => setSelectedRowIndex(row.rowIndex)}
                          >
                            {(() => {
                              const buttonsInRow = getButtonsCountForRow(row.rowIndex);
                              const enabledInRow = getEnabledCountForRow(row.rowIndex);
                              const { maxPerRow, freeSlots } = getRowCapacityState(
                                row.rowIndex,
                                buttonsInRow,
                                rowCapacities,
                                rowDefaultCapacities,
                                MAX_ROW_SLOTS,
                              );
                              return (
                                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                  <div className="text-[11px] uppercase tracking-wide text-dark-500">
                                    Row {row.rowIndex + 1}
                                  </div>
                                  <div className="rounded-full border border-dark-700/60 bg-dark-900/70 px-2 py-0.5 text-[11px] text-dark-300">
                                    Видимых: {enabledInRow}/{maxPerRow}
                                  </div>
                                  <div className="rounded-full border border-dark-700/60 bg-dark-900/70 px-2 py-0.5 text-[11px] text-dark-400">
                                    Всего: {buttonsInRow}
                                  </div>
                                  <label
                                    className="inline-flex items-center gap-2 rounded-md border border-dark-700/60 bg-dark-900/70 px-2 py-1 text-xs text-dark-300"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <span>Мест в ROW:</span>
                                    <select
                                      value={maxPerRow}
                                      onChange={(event) =>
                                        setRowCapacity(row.rowIndex, Number(event.target.value))
                                      }
                                      className="rounded border border-dark-600 bg-dark-800 px-1 py-0.5 text-xs text-dark-100"
                                    >
                                      {[1, 2, 3, 4].map((option) => (
                                        <option key={option} value={option}>
                                          {option}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                  <div className="flex flex-wrap items-center gap-2">
                                    {maxPerRow < MAX_ROW_SLOTS && (
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          expandRowCapacity(row.rowIndex);
                                        }}
                                        className="rounded-md border border-dark-600 bg-dark-900/70 px-3 py-1.5 text-xs text-dark-200 hover:border-dark-500"
                                      >
                                        + Место
                                      </button>
                                    )}
                                    {freeSlots > 0 && (
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          setAddMenuRowIndex((prev) =>
                                            toggleRowIndex(prev, row.rowIndex),
                                          );
                                        }}
                                        className="rounded-md border border-dashed border-accent-500/40 bg-accent-500/10 px-3 py-1.5 text-xs text-accent-300 hover:bg-accent-500/20"
                                      >
                                        + Добавить кнопку
                                      </button>
                                    )}
                                    {buttonsInRow === 0 && (
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
                                </div>
                              );
                            })()}
                            {row.items.length === 0 ? (
                              <div className="rounded-md border border-dashed border-dark-700/70 px-3 py-2 text-xs text-dark-500">
                                {getButtonsCountForRow(row.rowIndex) === 0
                                  ? 'Пустой ряд'
                                  : 'В ряду только скрытые кнопки'}
                              </div>
                            ) : (
                              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                {row.items.map((item) => (
                                  <SortablePreviewButton
                                    key={`preview-${item.id}`}
                                    buttonId={item.id}
                                    button={item.config}
                                    lang={lang}
                                    compact
                                    onEdit={() => handleEdit(item.id)}
                                    onDeactivate={() => toggleEnabled(item.id, item.config.enabled)}
                                    onMovePrevRow={() => moveButtonToRow(item.id, row.rowIndex - 1)}
                                    onMoveNextRow={() => moveButtonToRow(item.id, row.rowIndex + 1)}
                                    canMovePrevRow={row.rowIndex > 0}
                                    canMoveNextRow={row.rowIndex < rowLengths.length - 1}
                                  />
                                ))}
                                {Array.from({
                                  length: Math.max(
                                    (rowCapacities[row.rowIndex] ??
                                      rowDefaultCapacities[row.rowIndex] ??
                                      MAX_ROW_SLOTS) - getEnabledCountForRow(row.rowIndex),
                                    0,
                                  ),
                                }).map((_, slotIdx) => (
                                  <button
                                    key={`row-slot-${row.rowIndex}-${slotIdx}`}
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setAddMenuRowIndex((prev) =>
                                        toggleRowIndex(prev, row.rowIndex),
                                      );
                                    }}
                                    className="flex min-h-[40px] items-center justify-center rounded-md border border-dashed border-accent-500/30 bg-accent-500/5 px-2 py-1.5 text-xs text-accent-300 transition hover:bg-accent-500/15"
                                  >
                                    + Свободное место
                                  </button>
                                ))}
                              </div>
                            )}
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
            <div className="rounded-xl border border-dark-700/60 bg-dark-900/60 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm text-dark-300">
                <GripIcon />
                Новый поток редактирования
              </div>
              <ol className="space-y-1 text-xs text-dark-400">
                <li>1. Выберите ряд и настройте лимит кнопок.</li>
                <li>2. Добавьте скрытые кнопки через «+ Добавить кнопку».</li>
                <li>3. Перетаскивайте или используйте стрелки ← → на карточке кнопки.</li>
              </ol>
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
                      onChange={(e) => updateFormField('text', e.target.value)}
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
                      onChange={(e) => updateFormField('action', e.target.value)}
                      className="input"
                      maxLength={1024}
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-xs text-dark-400">Режим открытия</span>
                    <select
                      value={form.openMode}
                      onChange={(e) =>
                        updateFormField('openMode', e.target.value as 'callback' | 'direct')
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
                      onChange={(e) => updateFormField('webappUrl', e.target.value)}
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
                        updateFormField('visibility', e.target.value as MenuButtonVisibility)
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
                  onClick={() => updateFormField('enabled', !form.enabled)}
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
                    type="button"
                    className="btn-secondary"
                    onClick={resetEditForm}
                    disabled={updateButtonMutation.isPending}
                  >
                    {t('common.reset', { defaultValue: 'Сбросить' })}
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleSaveEdit}
                    disabled={updateButtonMutation.isPending}
                  >
                    {t('common.save')}
                  </button>
                  <button className="btn-secondary" onClick={cancelEdit}>
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
