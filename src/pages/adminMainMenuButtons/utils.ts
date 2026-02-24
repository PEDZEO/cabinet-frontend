import { arrayMove } from '@dnd-kit/sortable';
import type {
  MenuButtonConfig,
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

export function buildRowDefinitions(
  rows: MenuRowConfig[],
): Array<Pick<MenuRowConfig, 'id' | 'conditions'>> {
  return rows.map((row) => ({ id: row.id, conditions: row.conditions }));
}
