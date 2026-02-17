import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface TrafficUsagePaginationProps {
  offset: number;
  limit: number;
  total: number;
  onOffsetChange: (offset: number) => void;
}

export function TrafficUsagePagination({
  offset,
  limit,
  total,
  onOffsetChange,
}: TrafficUsagePaginationProps) {
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-4 flex items-center justify-between">
      <div className="text-sm text-dark-400">
        {offset + 1}
        {'\u2013'}
        {Math.min(offset + limit, total)} / {total}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onOffsetChange(Math.max(0, offset - limit))}
          disabled={offset === 0}
          className="rounded-lg border border-dark-700 bg-dark-800 p-2 transition-colors hover:bg-dark-700 disabled:opacity-50"
        >
          <ChevronLeftIcon />
        </button>
        <span className="px-3 py-2 text-dark-300">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onOffsetChange(offset + limit)}
          disabled={offset + limit >= total}
          className="rounded-lg border border-dark-700 bg-dark-800 p-2 transition-colors hover:bg-dark-700 disabled:opacity-50"
        >
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  );
}
