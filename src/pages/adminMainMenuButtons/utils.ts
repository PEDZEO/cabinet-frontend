import { arrayMove } from '@dnd-kit/sortable';
import type { TFunction } from 'i18next';
import type {
  MenuButtonConfig,
  MenuButtonUpdateRequest,
  MenuButtonVisibility,
  MenuLayoutResponse,
  MenuRowConfig,
} from '../../api/adminMenuLayout';

export const MAX_ROW_SLOTS = 4;

export function getLangCode(language: string): string {
  return language.split('-')[0] || 'ru';
}

export function getButtonText(buttonId: string, button: MenuButtonConfig, lang: string): string {
  return button.text[lang] || button.text.ru || Object.values(button.text)[0] || buttonId;
}

export function buildInitialOrder(layout: MenuLayoutResponse): string[] {
  const fromRows = layout.rows.flatMap((row) => row.buttons);
  const known = new Set(fromRows);
  const missing = Object.keys(layout.buttons).filter((id) => !known.has(id));
  return [...fromRows, ...missing];
}

export function hasOrderChanged(initialOrder: string[], orderedIds: string[]): boolean {
  if (orderedIds.length !== initialOrder.length) {
    return false;
  }
  return orderedIds.some((id, index) => initialOrder[index] !== id);
}

export function hasPendingLayoutChanges(
  hasOrderChanges: boolean,
  hasRowsConfigChanges: boolean,
): boolean {
  return hasOrderChanges || hasRowsConfigChanges;
}

export function countEnabledButtonsForRow(
  rowBuckets: string[][],
  buttonsById: Record<string, MenuButtonConfig>,
  rowIndex: number,
): number {
  return (rowBuckets[rowIndex] ?? []).reduce(
    (count, id) => count + (buttonsById[id]?.enabled ? 1 : 0),
    0,
  );
}

export function reorderVisibleSubset(
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

export function buildBuckets(ids: string[], lengths: number[]): string[][] {
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

export function findRowIndexById(buckets: string[][], buttonId: string): number {
  for (let idx = 0; idx < buckets.length; idx += 1) {
    if (buckets[idx].includes(buttonId)) {
      return idx;
    }
  }
  return -1;
}

export interface PreviewRowItem {
  id: string;
  config: MenuButtonConfig;
}

export interface OrderedButtonItem {
  id: string;
  config: MenuButtonConfig;
}

export interface PreviewRow {
  rowIndex: number;
  items: PreviewRowItem[];
}

export function buildPreviewRows(
  orderedIds: string[],
  rowLengths: number[],
  buttonsById: Record<string, MenuButtonConfig>,
  hasLayoutData: boolean,
): PreviewRow[] {
  if (!hasLayoutData || orderedIds.length === 0) {
    return [];
  }

  const rows: PreviewRow[] = [];
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
      .filter((item): item is PreviewRowItem => item !== null);

    rows.push({ rowIndex, items: rowItems });
  });

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
      .filter((item): item is PreviewRowItem => item !== null);
    if (tailItems.length > 0) {
      const lastRowIndex = Math.max(rows.length - 1, 0);
      if (!rows[lastRowIndex]) {
        rows[lastRowIndex] = { rowIndex: lastRowIndex, items: [] };
      }
      rows[lastRowIndex].items = [...rows[lastRowIndex].items, ...tailItems];
    }
  }

  return rows;
}

export function buildOrderedButtons(
  orderedIds: string[],
  buttonsById: Record<string, MenuButtonConfig>,
): OrderedButtonItem[] {
  return orderedIds.map((id) => ({
    id,
    config: buttonsById[id],
  }));
}

export function splitOrderedButtonsByEnabled(orderedButtons: OrderedButtonItem[]): {
  activeButtons: OrderedButtonItem[];
  inactiveButtons: OrderedButtonItem[];
} {
  const activeButtons = orderedButtons.filter((item) => item.config.enabled);
  const inactiveButtons = orderedButtons.filter((item) => !item.config.enabled);
  return { activeButtons, inactiveButtons };
}

export function buildRowDefinitions(
  rows: MenuRowConfig[],
): Array<Pick<MenuRowConfig, 'id' | 'conditions'>> {
  return rows.map((row) => ({ id: row.id, conditions: row.conditions }));
}

export interface MenuLayoutDerivedState {
  orderIds: string[];
  rowLengths: number[];
  rowCapacities: number[];
  rowDefs: Array<Pick<MenuRowConfig, 'id' | 'conditions'>>;
}

export function buildMenuLayoutDerivedState(layout: MenuLayoutResponse): MenuLayoutDerivedState {
  return {
    orderIds: buildInitialOrder(layout),
    rowLengths: layout.rows.map((row) => row.buttons.length),
    rowCapacities: layout.rows.map((row) => Math.max(row.max_per_row || 1, 1)),
    rowDefs: buildRowDefinitions(layout.rows),
  };
}

export function hasRowsConfigChanged(
  rows: MenuRowConfig[],
  rowDefs: Array<Pick<MenuRowConfig, 'id' | 'conditions'>>,
  rowLengths: number[],
  rowCapacities: number[],
): boolean {
  if (rowDefs.length !== rows.length || rowLengths.length !== rows.length) {
    return true;
  }
  for (let index = 0; index < rows.length; index += 1) {
    const sourceRow = rows[index];
    const sourceCapacity = Math.max(sourceRow.max_per_row || 1, 1);
    if (rowDefs[index]?.id !== sourceRow.id) {
      return true;
    }
    if ((rowLengths[index] ?? 0) !== sourceRow.buttons.length) {
      return true;
    }
    if (Math.max(rowCapacities[index] ?? sourceCapacity, 1) !== sourceCapacity) {
      return true;
    }
  }
  return false;
}

export function buildRowsUpdatePayload(
  ids: string[],
  rowDefs: Array<Pick<MenuRowConfig, 'id' | 'conditions'>>,
  rowLengths: number[],
  rowCapacities: number[],
): MenuRowConfig[] {
  const rows = rowDefs.map((row, index) => ({
    id: row.id,
    max_per_row: Math.max(rowCapacities[index] ?? 1, 1),
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

  return rows;
}

export function expandCapacityAtIndex(
  capacities: number[],
  rowIndex: number,
  maxSlots: number,
): number[] {
  const next = [...capacities];
  const current = Math.max(next[rowIndex] ?? 1, 1);
  next[rowIndex] = Math.min(current + 1, maxSlots);
  return next;
}

export function removeRowAtIndexIfPossible<T>(rows: T[], rowIndex: number): T[] {
  if (rows.length <= 1) {
    return rows;
  }
  return rows.filter((_, idx) => idx !== rowIndex);
}

export function getSelectedRowAfterCollapse(previous: number, removedRowIndex: number): number {
  if (previous === removedRowIndex) {
    return Math.max(removedRowIndex - 1, 0);
  }
  if (previous > removedRowIndex) {
    return previous - 1;
  }
  return previous;
}

export function toggleRowIndex(current: number | null, target: number): number | null {
  return current === target ? null : target;
}

export interface MoveButtonToRowOptions {
  orderedIds: string[];
  rowLengths: number[];
  rowCapacities: number[];
  rowDefaultCapacities: number[];
  buttonId: string;
  targetRowIndex: number;
  targetEnabledCount: number;
  maxRowSlots: number;
}

export interface MoveButtonToRowResult {
  nextOrderIds: string[] | null;
  nextRowLengths: number[] | null;
  safeTarget: number;
  error: 'button_not_found' | 'row_full' | null;
}

export function moveButtonToRowState(options: MoveButtonToRowOptions): MoveButtonToRowResult {
  const {
    orderedIds,
    rowLengths,
    rowCapacities,
    rowDefaultCapacities,
    buttonId,
    targetRowIndex,
    targetEnabledCount,
    maxRowSlots,
  } = options;

  const buckets = buildBuckets(orderedIds, rowLengths);
  const sourceRowIndex = findRowIndexById(buckets, buttonId);

  if (sourceRowIndex === -1) {
    return {
      nextOrderIds: null,
      nextRowLengths: null,
      safeTarget: Math.max(targetRowIndex, 0),
      error: 'button_not_found',
    };
  }

  const safeTarget = Math.min(Math.max(targetRowIndex, 0), buckets.length - 1);
  const targetMaxPerRow = Math.max(
    rowCapacities[safeTarget] ?? rowDefaultCapacities[safeTarget] ?? maxRowSlots,
    1,
  );
  if (sourceRowIndex !== safeTarget && targetEnabledCount >= targetMaxPerRow) {
    return {
      nextOrderIds: null,
      nextRowLengths: null,
      safeTarget,
      error: 'row_full',
    };
  }

  const sourcePos = buckets[sourceRowIndex].indexOf(buttonId);
  if (sourcePos === -1) {
    return {
      nextOrderIds: null,
      nextRowLengths: null,
      safeTarget,
      error: 'button_not_found',
    };
  }
  buckets[sourceRowIndex].splice(sourcePos, 1);
  buckets[safeTarget].push(buttonId);

  return {
    nextOrderIds: buckets.flat(),
    nextRowLengths: buckets.map((row) => row.length),
    safeTarget,
    error: null,
  };
}

export interface MenuButtonEditFormValues {
  text: string;
  action: string;
  openMode: 'callback' | 'direct';
  webappUrl: string;
  visibility: MenuButtonVisibility;
  enabled: boolean;
}

export type MainMenuButtonsTab = 'layout' | 'sections' | 'stats';
export type MenuButtonEditValidationErrorKey =
  | 'admin.mainMenuButtons.textRequired'
  | 'admin.mainMenuButtons.actionValueRequired';

export const DEFAULT_MENU_BUTTON_EDIT_FORM: MenuButtonEditFormValues = {
  text: '',
  action: '',
  openMode: 'callback',
  webappUrl: '',
  visibility: 'all',
  enabled: true,
};

export function resetMenuButtonEditState(): {
  editingId: null;
  form: MenuButtonEditFormValues;
} {
  return {
    editingId: null,
    form: DEFAULT_MENU_BUTTON_EDIT_FORM,
  };
}

export function validateMenuButtonEditForm(
  form: MenuButtonEditFormValues,
): MenuButtonEditValidationErrorKey | null {
  if (!form.text.trim()) {
    return 'admin.mainMenuButtons.textRequired';
  }
  if (!form.action.trim()) {
    return 'admin.mainMenuButtons.actionValueRequired';
  }
  return null;
}

export function buildEditFormState(
  buttonId: string,
  button: MenuButtonConfig,
  lang: string,
): MenuButtonEditFormValues {
  return {
    text: getButtonText(buttonId, button, lang),
    action: button.action || '',
    openMode: button.open_mode || 'callback',
    webappUrl: button.webapp_url || '',
    visibility: button.visibility,
    enabled: button.enabled,
  };
}

export function buildButtonUpdatePayload(
  button: MenuButtonConfig,
  lang: string,
  form: MenuButtonEditFormValues,
): MenuButtonUpdateRequest {
  return {
    text: {
      ...button.text,
      [lang]: form.text.trim(),
    },
    action: form.action.trim(),
    open_mode: form.openMode,
    webapp_url: form.openMode === 'direct' ? form.webappUrl.trim() || null : null,
    visibility: form.visibility,
    enabled: form.enabled,
  };
}

export function updateMenuButtonEditFormField<K extends keyof MenuButtonEditFormValues>(
  previous: MenuButtonEditFormValues,
  field: K,
  value: MenuButtonEditFormValues[K],
): MenuButtonEditFormValues {
  return {
    ...previous,
    [field]: value,
  };
}

export function buildVisibilityOptions(
  t: TFunction,
): Array<{ value: MenuButtonVisibility; label: string }> {
  return [
    { value: 'all', label: t('admin.mainMenuButtons.visibilityAll') },
    { value: 'admins', label: t('admin.mainMenuButtons.visibilityAdmins') },
    { value: 'subscribers', label: t('admin.mainMenuButtons.visibilitySubscribers') },
    {
      value: 'moderators',
      label: t('admin.mainMenuButtons.visibilityModerators', { defaultValue: 'Moderators only' }),
    },
  ];
}

export function getMainMenuButtonsTabClass(
  activeTab: MainMenuButtonsTab,
  tab: MainMenuButtonsTab,
): string {
  return `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    activeTab === tab
      ? 'bg-accent-500/15 text-accent-300'
      : 'bg-dark-800 text-dark-300 hover:bg-dark-700/70'
  }`;
}

export interface MainMenuButtonsTabOption {
  key: MainMenuButtonsTab;
  label: string;
}

export function buildMainMenuButtonsTabOptions(t: TFunction): MainMenuButtonsTabOption[] {
  return [
    { key: 'layout', label: t('admin.mainMenuButtons.title') },
    { key: 'sections', label: t('admin.settings.menu.buttons', 'Стили кнопок') },
    { key: 'stats', label: t('admin.mainMenuButtons.statsTab') },
  ];
}

export function getSaveLayoutButtonLabel(t: TFunction, isSaving: boolean): string {
  return isSaving ? t('admin.mainMenuButtons.savingOrder') : t('admin.mainMenuButtons.saveOrder');
}

export interface RowCapacityState {
  maxPerRow: number;
  freeSlots: number;
}

export function getRowCapacityState(
  rowIndex: number,
  rowItemsCount: number,
  rowCapacities: number[],
  rowDefaults: number[],
  maxRowSlots: number,
): RowCapacityState {
  const maxPerRow = Math.max(rowCapacities[rowIndex] ?? rowDefaults[rowIndex] ?? maxRowSlots, 1);
  return {
    maxPerRow,
    freeSlots: Math.max(maxPerRow - rowItemsCount, 0),
  };
}
