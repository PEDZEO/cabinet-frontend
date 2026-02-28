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
}

export function SortablePreviewButton({
  buttonId,
  button,
  lang,
  onEdit,
  onDeactivate,
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
