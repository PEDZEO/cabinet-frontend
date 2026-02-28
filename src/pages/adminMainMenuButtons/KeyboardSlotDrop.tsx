import { useDroppable } from '@dnd-kit/core';

interface KeyboardSlotDropProps {
  slotId: string;
  onClick: () => void;
}

export function KeyboardSlotDrop({ slotId, onClick }: KeyboardSlotDropProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: slotId,
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      className={`flex min-h-[40px] items-center justify-center rounded-lg border border-dashed px-2 py-1.5 text-xs transition ${
        isOver
          ? 'border-accent-500/80 bg-accent-500/20 text-accent-200'
          : 'border-dark-600/70 bg-dark-900/70 text-dark-500 hover:border-accent-500/50 hover:text-accent-300'
      }`}
    >
      + слот
    </button>
  );
}
