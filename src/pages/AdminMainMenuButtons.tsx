import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
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
  adminMainMenuButtonsApi,
  MainMenuButtonActionType,
  MainMenuButtonResponse,
  MainMenuButtonVisibility,
} from '../api/adminMainMenuButtons';
import { AdminBackButton } from '../components/admin';

interface FormState {
  text: string;
  actionType: MainMenuButtonActionType;
  actionValue: string;
  visibility: MainMenuButtonVisibility;
  isActive: boolean;
  displayOrder: string;
}

const DEFAULT_FORM: FormState = {
  text: '',
  actionType: 'url',
  actionValue: '',
  visibility: 'all',
  isActive: true,
  displayOrder: '',
};

function toForm(button: MainMenuButtonResponse): FormState {
  return {
    text: button.text,
    actionType: button.action_type,
    actionValue: button.action_value,
    visibility: button.visibility,
    isActive: button.is_active,
    displayOrder: String(button.display_order),
  };
}

function sortByDisplayOrder(items: MainMenuButtonResponse[]): MainMenuButtonResponse[] {
  return [...items].sort((a, b) => {
    if (a.display_order !== b.display_order) {
      return a.display_order - b.display_order;
    }
    return a.id - b.id;
  });
}

export default function AdminMainMenuButtons() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [orderedItems, setOrderedItems] = useState<MainMenuButtonResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'main-menu-buttons'],
    queryFn: () => adminMainMenuButtonsApi.list(200, 0),
  });

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const sortedItems = useMemo(() => sortByDisplayOrder(items), [items]);

  useEffect(() => {
    setOrderedItems(sortedItems);
  }, [sortedItems]);

  const visibilityOptions = useMemo(
    () => [
      { value: 'all' as const, label: t('admin.mainMenuButtons.visibilityAll') },
      { value: 'admins' as const, label: t('admin.mainMenuButtons.visibilityAdmins') },
      {
        value: 'subscribers' as const,
        label: t('admin.mainMenuButtons.visibilitySubscribers'),
      },
    ],
    [t],
  );

  const createMutation = useMutation({
    mutationFn: adminMainMenuButtonsApi.create,
    onSuccess: () => {
      setForm(DEFAULT_FORM);
      setError(null);
      setSuccess(t('admin.mainMenuButtons.saved'));
      queryClient.invalidateQueries({ queryKey: ['admin', 'main-menu-buttons'] });
    },
    onError: () => {
      setError(t('admin.mainMenuButtons.saveError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Parameters<typeof adminMainMenuButtonsApi.update>[1];
    }) => adminMainMenuButtonsApi.update(id, payload),
    onSuccess: () => {
      setEditingId(null);
      setForm(DEFAULT_FORM);
      setError(null);
      setSuccess(t('admin.mainMenuButtons.saved'));
      queryClient.invalidateQueries({ queryKey: ['admin', 'main-menu-buttons'] });
    },
    onError: () => {
      setError(t('admin.mainMenuButtons.saveError'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminMainMenuButtonsApi.delete,
    onSuccess: () => {
      setSuccess(t('admin.mainMenuButtons.deleted'));
      queryClient.invalidateQueries({ queryKey: ['admin', 'main-menu-buttons'] });
    },
    onError: () => {
      setError(t('admin.mainMenuButtons.deleteError'));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const hasOrderChanges = useMemo(() => {
    if (orderedItems.length !== sortedItems.length) {
      return false;
    }

    return orderedItems.some((item, index) => sortedItems[index]?.id !== item.id);
  }, [orderedItems, sortedItems]);

  const updateOrderMutation = useMutation({
    mutationFn: async (list: MainMenuButtonResponse[]) => {
      const currentIndexById = new Map(sortedItems.map((item, index) => [item.id, index]));
      const withOrder = list.map((item, index) => ({ item, nextOrder: index }));
      const changed = withOrder.filter(({ item, nextOrder }) => {
        return currentIndexById.get(item.id) !== nextOrder;
      });

      await Promise.all(
        changed.map(({ item, nextOrder }) =>
          adminMainMenuButtonsApi.update(item.id, { display_order: nextOrder }),
        ),
      );
    },
    onSuccess: () => {
      setError(null);
      setSuccess(t('admin.mainMenuButtons.orderSaved'));
      queryClient.invalidateQueries({ queryKey: ['admin', 'main-menu-buttons'] });
    },
    onError: () => {
      setError(t('admin.mainMenuButtons.orderSaveError'));
    },
  });

  const validateForm = (): boolean => {
    if (!form.text.trim()) {
      setError(t('admin.mainMenuButtons.textRequired'));
      return false;
    }

    if (!form.actionValue.trim()) {
      setError(t('admin.mainMenuButtons.actionValueRequired'));
      return false;
    }

    if (!/^https?:\/\//i.test(form.actionValue.trim())) {
      setError(t('admin.mainMenuButtons.actionValueInvalid'));
      return false;
    }

    if (form.displayOrder !== '' && Number.isNaN(Number(form.displayOrder))) {
      setError(t('admin.mainMenuButtons.displayOrderInvalid'));
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    setError(null);
    setSuccess(null);
    if (!validateForm()) {
      return;
    }

    const payload = {
      text: form.text.trim(),
      action_type: form.actionType,
      action_value: form.actionValue.trim(),
      visibility: form.visibility,
      is_active: form.isActive,
      ...(form.displayOrder !== '' ? { display_order: Number(form.displayOrder) } : {}),
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
      return;
    }

    createMutation.mutate(payload);
  };

  const handleEdit = (button: MainMenuButtonResponse) => {
    setEditingId(button.id);
    setForm(toForm(button));
    setError(null);
    setSuccess(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = (id: number) => {
    if (!window.confirm(t('admin.mainMenuButtons.deleteConfirm'))) {
      return;
    }
    setSuccess(null);
    deleteMutation.mutate(id);
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= orderedItems.length) {
      return;
    }

    setSuccess(null);
    setError(null);
    setOrderedItems((prev) => arrayMove(prev, index, targetIndex));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setSuccess(null);
    setError(null);
    setOrderedItems((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === active.id);
      const newIndex = prev.findIndex((item) => item.id === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return prev;
      }

      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const saveOrder = () => {
    if (!hasOrderChanges || updateOrderMutation.isPending) {
      return;
    }
    setSuccess(null);
    setError(null);
    updateOrderMutation.mutate(orderedItems);
  };

  const previewRows = useMemo(() => {
    const visible = orderedItems.filter((item) => item.is_active);
    const rows: MainMenuButtonResponse[][] = [];
    for (let i = 0; i < visible.length; i += 2) {
      rows.push(visible.slice(i, i + 2));
    }
    return rows;
  }, [orderedItems]);

  const sortableIds = useMemo(() => orderedItems.map((item) => item.id), [orderedItems]);

  function SortableButtonCard({
    button,
    index,
  }: {
    button: MainMenuButtonResponse;
    index: number;
  }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: button.id,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`flex flex-col gap-3 rounded-lg border border-dark-700/60 bg-dark-800/30 p-3 md:flex-row md:items-center md:justify-between ${
          isDragging ? 'opacity-70' : ''
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-accent-500/20 px-2 py-0.5 text-xs text-accent-300">
              {index + 1}
            </span>
            <span className="rounded bg-dark-700/70 px-2 py-0.5 text-xs text-dark-200">
              #{button.id}
            </span>
            <span className="text-sm font-medium text-dark-100">{button.text}</span>
            <span
              className={`rounded px-2 py-0.5 text-xs ${
                button.is_active
                  ? 'bg-success-500/20 text-success-300'
                  : 'bg-dark-600/70 text-dark-400'
              }`}
            >
              {button.is_active ? t('common.yes') : t('common.no')}
            </span>
          </div>
          <div className="mt-1 text-xs text-dark-400">
            {t('admin.mainMenuButtons.actionTypeLabel')}: {button.action_type} ·{' '}
            {t('admin.mainMenuButtons.visibilityLabel')}: {button.visibility} ·{' '}
            {t('admin.mainMenuButtons.displayOrderLabel')}: {index}
          </div>
          <div className="mt-1 truncate text-xs text-dark-500">{button.action_value}</div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="btn-secondary cursor-grab active:cursor-grabbing"
            aria-label={t('admin.mainMenuButtons.dragHandle')}
            title={t('admin.mainMenuButtons.dragHint')}
            {...attributes}
            {...listeners}
          >
            ⋮⋮
          </button>
          <button
            className="btn-secondary"
            onClick={() => moveItem(index, -1)}
            disabled={index === 0 || updateOrderMutation.isPending}
            aria-label={t('admin.mainMenuButtons.moveUp')}
          >
            ↑
          </button>
          <button
            className="btn-secondary"
            onClick={() => moveItem(index, 1)}
            disabled={index === orderedItems.length - 1 || updateOrderMutation.isPending}
            aria-label={t('admin.mainMenuButtons.moveDown')}
          >
            ↓
          </button>
          <button className="btn-secondary" onClick={() => handleEdit(button)}>
            {t('common.edit')}
          </button>
          <button
            className="rounded-lg border border-error-500/30 px-3 py-2 text-sm text-error-300 transition-colors hover:bg-error-500/10"
            onClick={() => handleDelete(button.id)}
            disabled={deleteMutation.isPending}
          >
            {t('common.delete')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AdminBackButton to="/admin" />
          <div>
            <h1 className="text-xl font-bold text-dark-100">{t('admin.mainMenuButtons.title')}</h1>
            <p className="text-sm text-dark-400">{t('admin.mainMenuButtons.subtitle')}</p>
          </div>
        </div>
        <button onClick={() => refetch()} className="btn-secondary" disabled={isFetching}>
          {t('common.refresh')}
        </button>
      </div>

      <div className="card space-y-4 p-4">
        <h2 className="text-sm font-semibold text-dark-200">
          {editingId
            ? t('admin.mainMenuButtons.editButton')
            : t('admin.mainMenuButtons.createButton')}
        </h2>

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

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs text-dark-400">{t('admin.mainMenuButtons.textLabel')}</span>
            <input
              value={form.text}
              onChange={(e) => setForm((prev) => ({ ...prev, text: e.target.value }))}
              className="input"
              maxLength={64}
              placeholder={t('admin.mainMenuButtons.textPlaceholder')}
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs text-dark-400">
              {t('admin.mainMenuButtons.actionTypeLabel')}
            </span>
            <select
              value={form.actionType}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  actionType: e.target.value as MainMenuButtonActionType,
                }))
              }
              className="input"
            >
              <option value="url">{t('admin.mainMenuButtons.actionTypeUrl')}</option>
              <option value="mini_app">{t('admin.mainMenuButtons.actionTypeMiniApp')}</option>
            </select>
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-xs text-dark-400">
              {t('admin.mainMenuButtons.actionValueLabel')}
            </span>
            <input
              value={form.actionValue}
              onChange={(e) => setForm((prev) => ({ ...prev, actionValue: e.target.value }))}
              className="input"
              maxLength={1024}
              placeholder="https://..."
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
                  visibility: e.target.value as MainMenuButtonVisibility,
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

          <label className="space-y-1">
            <span className="text-xs text-dark-400">
              {t('admin.mainMenuButtons.displayOrderLabel')}
            </span>
            <input
              value={form.displayOrder}
              onChange={(e) => setForm((prev) => ({ ...prev, displayOrder: e.target.value }))}
              className="input"
              type="number"
              min={0}
              placeholder="0"
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm text-dark-300">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
          />
          {t('admin.mainMenuButtons.isActiveLabel')}
        </label>

        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
            {editingId ? t('common.save') : t('common.add')}
          </button>
          {editingId && (
            <button className="btn-secondary" onClick={handleCancelEdit} disabled={isSubmitting}>
              {t('common.cancel')}
            </button>
          )}
        </div>
      </div>

      <div className="card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-dark-200">
            {t('admin.mainMenuButtons.listTitle')}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-dark-500">
              {t('admin.mainMenuButtons.total', { count: items.length })}
            </span>
            <button
              className="btn-primary"
              onClick={saveOrder}
              disabled={!hasOrderChanges || updateOrderMutation.isPending}
            >
              {updateOrderMutation.isPending
                ? t('admin.mainMenuButtons.savingOrder')
                : t('admin.mainMenuButtons.saveOrder')}
            </button>
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-dark-700/60 bg-dark-900/50 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-dark-300">
            {t('admin.mainMenuButtons.previewTitle')}
          </h3>
          <p className="mt-1 text-xs text-dark-500">{t('admin.mainMenuButtons.previewHint')}</p>
          <div className="mt-3 rounded-xl border border-dark-700/60 bg-dark-950/70 p-3">
            {previewRows.length === 0 ? (
              <div className="text-center text-xs text-dark-500">
                {t('admin.mainMenuButtons.empty')}
              </div>
            ) : (
              <div className="space-y-2">
                {previewRows.map((row, rowIndex) => (
                  <div key={rowIndex} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {row.map((button) => (
                      <div
                        key={button.id}
                        className="truncate rounded-lg border border-dark-700/80 bg-dark-800/60 px-3 py-2 text-center text-sm text-dark-100"
                        title={button.text}
                      >
                        {button.text}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-dark-400">{t('common.loading')}</div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dark-700/50 bg-dark-800/30 p-6 text-center text-dark-400">
            {t('admin.mainMenuButtons.empty')}
          </div>
        ) : (
          <>
            <p className="mb-3 text-xs text-dark-500">{t('admin.mainMenuButtons.dragHint')}</p>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {orderedItems.map((button, index) => (
                    <SortableButtonCard key={button.id} button={button} index={index} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </>
        )}
      </div>
    </div>
  );
}
