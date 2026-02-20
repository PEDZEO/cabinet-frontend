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
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
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

interface FormState {
  text: string;
  action: string;
  visibility: MenuButtonVisibility;
  enabled: boolean;
}

const DEFAULT_FORM: FormState = {
  text: '',
  action: '',
  visibility: 'all',
  enabled: true,
};

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
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

    setSuccess(null);
    setOrderIds((prev) => {
      const oldIndex = prev.findIndex((id) => id === String(active.id));
      const newIndex = prev.findIndex((id) => id === String(over.id));
      if (oldIndex === -1 || newIndex === -1) {
        return prev;
      }
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const moveItem = (buttonId: string, direction: -1 | 1) => {
    setOrderIds((prev) => {
      const index = prev.findIndex((id) => id === buttonId);
      if (index === -1) {
        return prev;
      }
      const target = index + direction;
      if (target < 0 || target >= prev.length) {
        return prev;
      }
      return arrayMove(prev, index, target);
    });
    setSuccess(null);
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

  function SortablePreviewButton({ buttonId }: { buttonId: string }) {
    const button = buttonsById[buttonId];
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: buttonId,
    });

    if (!button) {
      return null;
    }

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`flex min-h-[48px] cursor-grab items-center justify-center rounded-lg border border-dark-700/80 bg-dark-800/60 px-3 py-2 text-center text-sm text-dark-100 active:cursor-grabbing ${
          isDragging ? 'opacity-70 ring-2 ring-accent-500/40' : ''
        }`}
        title={getButtonText(buttonId, button, lang)}
        {...attributes}
        {...listeners}
      >
        <span className="truncate">{getButtonText(buttonId, button, lang)}</span>
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

      {editingId && (
        <div className="card space-y-4 p-4">
          <h2 className="text-sm font-semibold text-dark-200">
            {t('admin.mainMenuButtons.editButton')}
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs text-dark-400">{t('admin.mainMenuButtons.textLabel')}</span>
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

          <label className="flex items-center gap-2 text-sm text-dark-300">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm((prev) => ({ ...prev, enabled: e.target.checked }))}
            />
            {t('admin.mainMenuButtons.isActiveLabel')}
          </label>

          <div className="flex gap-2">
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

      <div className="card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-dark-200">
            {t('admin.mainMenuButtons.listTitle')}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-dark-500">
              {t('admin.mainMenuButtons.total', { count: orderedIds.length })}
            </span>
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

        <div className="mb-4 rounded-lg border border-dark-700/60 bg-dark-900/50 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-dark-300">
            {t('admin.mainMenuButtons.previewTitle')}
          </h3>
          <p className="mt-1 text-xs text-dark-500">{t('admin.mainMenuButtons.previewHint')}</p>
          <div className="mt-3 rounded-xl border border-dark-700/60 bg-dark-950/70 p-3">
            {activeButtons.length === 0 ? (
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
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {activeButtons.map((item) => (
                      <SortablePreviewButton key={item.id} buttonId={item.id} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-dark-400">{t('common.loading')}</div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-dark-300">
                {t('admin.mainMenuButtons.activeListTitle')} ({activeButtons.length})
              </h3>
              {activeButtons.map((item) => {
                const index = orderedIds.findIndex((id) => id === item.id);
                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-lg border border-dark-700/60 bg-dark-800/30 p-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-accent-500/20 px-2 py-0.5 text-xs text-accent-300">
                          {index + 1}
                        </span>
                        <span className="rounded bg-dark-700/70 px-2 py-0.5 text-xs text-dark-200">
                          {item.id}
                        </span>
                        <span className="text-sm font-medium text-dark-100">
                          {getButtonText(item.id, item.config, lang)}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-dark-400">
                        {t('admin.mainMenuButtons.actionTypeLabel')}: {item.config.type} ·{' '}
                        {t('admin.mainMenuButtons.visibilityLabel')}: {item.config.visibility}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        className="btn-secondary"
                        onClick={() => moveItem(item.id, -1)}
                        disabled={index <= 0}
                      >
                        ↑
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => moveItem(item.id, 1)}
                        disabled={index < 0 || index >= orderedIds.length - 1}
                      >
                        ↓
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => toggleEnabled(item.id, item.config.enabled)}
                      >
                        {t('admin.mainMenuButtons.deactivate')}
                      </button>
                      <button className="btn-secondary" onClick={() => handleEdit(item.id)}>
                        {t('common.edit')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-dark-300">
                {t('admin.mainMenuButtons.inactiveListTitle')} ({inactiveButtons.length})
              </h3>
              {inactiveButtons.map((item) => {
                const index = orderedIds.findIndex((id) => id === item.id);
                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-lg border border-dark-700/60 bg-dark-800/30 p-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-accent-500/20 px-2 py-0.5 text-xs text-accent-300">
                          {index + 1}
                        </span>
                        <span className="rounded bg-dark-700/70 px-2 py-0.5 text-xs text-dark-200">
                          {item.id}
                        </span>
                        <span className="text-sm font-medium text-dark-100">
                          {getButtonText(item.id, item.config, lang)}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-dark-400">
                        {t('admin.mainMenuButtons.actionTypeLabel')}: {item.config.type} ·{' '}
                        {t('admin.mainMenuButtons.visibilityLabel')}: {item.config.visibility}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="btn-secondary"
                        onClick={() => toggleEnabled(item.id, item.config.enabled)}
                      >
                        {t('admin.mainMenuButtons.activate')}
                      </button>
                      <button className="btn-secondary" onClick={() => handleEdit(item.id)}>
                        {t('common.edit')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
