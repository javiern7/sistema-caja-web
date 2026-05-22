import type { ReactNode } from 'react';
import type { PaginatedResponse } from '../../services/api/types';

type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortable?: boolean;
  sortKey?: string;
};

type ResourceTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  rowClassName?: (row: T) => string | undefined;
  isLoading?: boolean;
  emptyState?: ReactNode;
  pagination?: Pick<PaginatedResponse<T>, 'page' | 'size' | 'totalElements' | 'totalPages' | 'first' | 'last'>;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  sort?: {
    value?: string;
    onChange?: (sort: string) => void;
  };
};

function getSortState(value: string | undefined, sortKey: string) {
  if (!value) {
    return null;
  }

  const [activeKey, direction] = value.split(',');
  if (activeKey !== sortKey) {
    return null;
  }

  return direction === 'desc' ? 'desc' : 'asc';
}

function nextSortValue(current: string | undefined, sortKey: string) {
  const activeState = getSortState(current, sortKey);
  if (activeState === 'asc') {
    return `${sortKey},desc`;
  }

  return `${sortKey},asc`;
}

export function ResourceTable<T>({
  columns,
  rows,
  rowKey,
  rowClassName,
  isLoading = false,
  emptyState,
  pagination,
  onPageChange,
  onPageSizeChange,
  sort,
}: ResourceTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500"
                >
                  {column.sortable && sort?.onChange ? (
                    <button
                      className="inline-flex items-center gap-2 transition hover:text-slate-700"
                      onClick={() => sort.onChange?.(nextSortValue(sort.value, column.sortKey ?? column.key))}
                      type="button"
                    >
                      <span>{column.header}</span>
                      <span className="text-[10px]">
                        {getSortState(sort.value, column.sortKey ?? column.key) === 'asc'
                          ? '▲'
                          : getSortState(sort.value, column.sortKey ?? column.key) === 'desc'
                            ? '▼'
                            : '↕'}
                      </span>
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-8" colSpan={columns.length}>
                  {emptyState ?? <p className="text-sm text-slate-500">No hay registros para mostrar.</p>}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={rowKey(row)} className={rowClassName ? rowClassName(row) : 'align-top'}>
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-4 text-sm text-slate-700">
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination || isLoading ? (
        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {pagination ? (
              <>
                <span>
                  Mostrando pagina {pagination.page + 1} de {Math.max(pagination.totalPages, 1)}
                </span>
                <span>{pagination.totalElements} registro(s)</span>
              </>
            ) : null}
            {isLoading ? <span className="text-brand-700">Actualizando tabla...</span> : null}
          </div>
          {pagination ? (
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2">
                <span>Filas</span>
                <select
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
                  onChange={(event) => onPageSizeChange?.(Number(event.target.value))}
                  value={pagination.size}
                >
                  {[10, 20, 50, 100].map((pageSize) => (
                    <option key={pageSize} value={pageSize}>
                      {pageSize}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={pagination.first}
                  onClick={() => onPageChange?.(pagination.page - 1)}
                  type="button"
                >
                  Anterior
                </button>
                <button
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={pagination.last}
                  onClick={() => onPageChange?.(pagination.page + 1)}
                  type="button"
                >
                  Siguiente
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
