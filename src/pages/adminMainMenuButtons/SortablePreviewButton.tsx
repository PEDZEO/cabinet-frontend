import type { CSSProperties } from 'react';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import type { MenuButtonConfig } from '../../api/adminMenuLayout';
import { getButtonText } from './utils';

export const GripIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
    />
  </svg>
);

interface SortablePreviewButtonProps {
  buttonId: string;
  button: MenuButtonConfig;
  lang: string;
  onEdit: () => void;
  onDeactivate: () => void;
  onMovePrevRow?: () => void;
  onMoveNextRow?: () => void;
  canMovePrevRow?: boolean;
  canMoveNextRow?: boolean;
  compact?: boolean;
  variant?: 'default' | 'bot';
  showMoveActions?: boolean;
  showDeactivateAction?: boolean;
}

export function SortablePreviewButton({
  buttonId,
  button,
  lang,
  onEdit,
  onDeactivate,
  onMovePrevRow,
  onMoveNextRow,
  canMovePrevRow = false,
  canMoveNextRow = false,
  compact = false,
  variant = 'default',
  showMoveActions = true,
  showDeactivateAction = true,
}: SortablePreviewButtonProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: buttonId,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? 'relative' : undefined,
  };

  const isBotVariant = variant === 'bot';
  const compactHideLabel = compact || isBotVariant;
  const isDensePreview = compact && isBotVariant;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group border ${
        isDragging
          ? 'border-accent-500/50 bg-dark-800 shadow-lg shadow-accent-500/20'
          : isBotVariant
            ? 'border-dark-700/70 bg-dark-900/80 hover:border-dark-500'
            : 'border-dark-700/70 bg-dark-800/70 hover:border-dark-600'
      } ${compact ? 'text-xs' : ''} ${isBotVariant ? 'rounded-lg' : 'rounded-md'} ${
        isDensePreview ? 'min-h-[58px] p-1.5' : 'flex min-h-[40px] items-center gap-2 px-2 py-1.5'
      }`}
    >
      {isDensePreview ? (
        <>
          <div className="mb-1 flex min-w-0 items-start gap-1">
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="touch-none rounded-md p-1 text-dark-500 transition-colors hover:bg-dark-700/50 hover:text-dark-300"
              title="Перетащить для смены порядка"
              aria-label={`Drag ${buttonId}`}
            >
              <svg
                className="h-3.5 w-3.5"
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
            <span
              className="line-clamp-2 min-w-0 flex-1 break-words text-[11px] leading-4 text-dark-100"
              title={getButtonText(buttonId, button, lang)}
            >
              {getButtonText(buttonId, button, lang)}
            </span>
          </div>
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={onEdit}
              className="rounded-md border border-dark-700/70 px-1.5 py-0.5 text-[10px] text-dark-300 hover:border-dark-500 hover:text-dark-100"
              title="Редактировать кнопку"
              aria-label={`Редактировать ${buttonId}`}
            >
              ✎
            </button>
            {showDeactivateAction && (
              <button
                type="button"
                onClick={onDeactivate}
                className="rounded-md border border-dark-700/70 px-1.5 py-0.5 text-[10px] text-dark-300 hover:border-dark-500 hover:text-dark-100"
                title="Скрыть кнопку"
                aria-label={`Скрыть ${buttonId}`}
              >
                ×
              </button>
            )}
          </div>
        </>
      ) : (
        <>
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

          <span
            className={`line-clamp-2 min-w-0 flex-1 text-left text-dark-100 ${compact ? 'text-xs' : 'text-sm'}`}
            title={getButtonText(buttonId, button, lang)}
          >
            {getButtonText(buttonId, button, lang)}
          </span>

          <button
            type="button"
            onClick={onEdit}
            className="rounded-md border border-dark-700/70 px-1.5 py-1 text-xs text-dark-300 hover:border-dark-500 hover:text-dark-100"
            title="Редактировать кнопку"
            aria-label={`Редактировать ${buttonId}`}
          >
            ✎
          </button>
        </>
      )}

      {showMoveActions && (onMovePrevRow || onMoveNextRow) && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMovePrevRow}
            disabled={!canMovePrevRow}
            className="rounded-md border border-dark-700/70 px-1.5 py-1 text-[11px] text-dark-300 hover:border-dark-500 hover:text-dark-100 disabled:cursor-not-allowed disabled:opacity-40"
            title="Переместить в предыдущий ряд"
            aria-label={`Move ${buttonId} to previous row`}
          >
            ←
          </button>
          <button
            type="button"
            onClick={onMoveNextRow}
            disabled={!canMoveNextRow}
            className="rounded-md border border-dark-700/70 px-1.5 py-1 text-[11px] text-dark-300 hover:border-dark-500 hover:text-dark-100 disabled:cursor-not-allowed disabled:opacity-40"
            title="Переместить в следующий ряд"
            aria-label={`Move ${buttonId} to next row`}
          >
            →
          </button>
        </div>
      )}

      {showDeactivateAction && !isDensePreview && (
        <button
          type="button"
          onClick={onDeactivate}
          className="rounded-md border border-dark-700/70 px-1.5 py-1 text-xs text-dark-300 hover:border-dark-500 hover:text-dark-100"
          title="Скрыть кнопку"
          aria-label={`Скрыть ${buttonId}`}
        >
          {compactHideLabel ? '×' : 'Скрыть'}
        </button>
      )}
    </div>
  );
}
