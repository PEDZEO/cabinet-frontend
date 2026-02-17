import { useState } from 'react';
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import type { UserTrafficItem } from '../../../api/adminTraffic';

interface UseTrafficTableParams {
  items: UserTrafficItem[];
  columns: ColumnDef<UserTrafficItem>[];
  sorting: SortingState;
  onSortingChange: (updater: SortingState | ((old: SortingState) => SortingState)) => void;
}

export function useTrafficTable({
  items,
  columns,
  sorting,
  onSortingChange,
}: UseTrafficTableParams) {
  const [columnSizing, setColumnSizing] = useState<Record<string, number>>({});

  // TanStack Table returns non-memoizable functions; this is expected for table instance creation.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: items,
    columns,
    state: { sorting, columnSizing },
    onSortingChange,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    enableSortingRemoval: false,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
  });

  return { table };
}
