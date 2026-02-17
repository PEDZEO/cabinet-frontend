import { flexRender, type Table } from '@tanstack/react-table';
import type { UserTrafficItem } from '../../../api/adminTraffic';
import { SortIcon } from './Icons';
import { getCompositeRisk, getRowBgColor } from '../utils/risk';

interface TrafficUsageTableProps {
  table: Table<UserTrafficItem>;
  initialLoading: boolean;
  hasData: boolean;
  loading: boolean;
  hasAnyThreshold: boolean;
  totalThresholdNum: number;
  nodeThresholdNum: number;
  periodDays: number;
  noDataText: string;
  onUserClick: (userId: number) => void;
}

export function TrafficUsageTable({
  table,
  initialLoading,
  hasData,
  loading,
  hasAnyThreshold,
  totalThresholdNum,
  nodeThresholdNum,
  periodDays,
  noDataText,
  onUserClick,
}: TrafficUsageTableProps) {
  if (initialLoading && !hasData) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
      </div>
    );
  }

  if (!hasData && !loading) {
    return <div className="py-12 text-center text-dark-400">{noDataText}</div>;
  }

  return (
    <div
      className={`transition-opacity duration-200 ${loading && hasData ? 'opacity-70' : 'opacity-100'}`}
    >
      <div className="overflow-x-auto rounded-xl border border-dark-700">
        <table className="text-left text-sm" style={{ width: table.getCenterTotalSize() }}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-dark-700 bg-dark-800/80">
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta;
                  const isSticky = meta?.sticky;
                  const align = meta?.align === 'center' ? 'text-center' : 'text-left';
                  const isBold = meta?.bold;

                  return (
                    <th
                      key={header.id}
                      className={`relative overflow-hidden text-ellipsis whitespace-nowrap px-3 py-2 text-xs font-medium ${
                        isBold ? 'font-semibold text-dark-200' : 'text-dark-400'
                      } ${align} ${
                        isSticky ? 'sticky left-0 z-10 bg-dark-800' : ''
                      } ${header.column.getCanSort() ? 'cursor-pointer select-none hover:text-dark-200' : ''}`}
                      style={{ width: header.getSize(), maxWidth: header.getSize() }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <SortIcon direction={header.column.getIsSorted()} />
                      )}
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        onClick={(event) => event.stopPropagation()}
                        className="absolute -right-2 top-0 z-20 h-full w-5 cursor-col-resize select-none"
                        style={{ touchAction: 'none' }}
                      >
                        <div
                          className={`absolute right-2 top-0 h-full w-1 ${
                            header.column.getIsResizing()
                              ? 'bg-accent-500'
                              : 'bg-transparent hover:bg-dark-500'
                          }`}
                        />
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const compositeRatio = hasAnyThreshold
                ? getCompositeRisk(row.original, totalThresholdNum, nodeThresholdNum, periodDays)
                    .ratio
                : 0;
              const rowBg = hasAnyThreshold ? getRowBgColor(compositeRatio) : undefined;

              return (
                <tr
                  key={row.id}
                  className="cursor-pointer border-b border-dark-700/50 transition-colors hover:bg-dark-800/50"
                  style={{ backgroundColor: rowBg }}
                  onClick={() => onUserClick(row.original.user_id)}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta;
                    const isSticky = meta?.sticky;
                    const align = meta?.align === 'center' ? 'text-center' : 'text-left';

                    return (
                      <td
                        key={cell.id}
                        className={`overflow-hidden px-3 py-2 ${align} ${
                          isSticky ? 'sticky left-0 z-10 bg-dark-900' : ''
                        }`}
                        style={{
                          width: cell.column.getSize(),
                          maxWidth: cell.column.getSize(),
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
