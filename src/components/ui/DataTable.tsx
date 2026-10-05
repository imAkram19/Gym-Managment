import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { clsx } from 'clsx';
import { EmptyState } from './EmptyState';
import { MembersSkeleton, MobileCardSkeleton } from './Skeleton';

export interface ColumnDef<T> {
  key: string;
  header: React.ReactNode;
  accessor?: (row: T) => any;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  onRowAction?: (row: T, action: 'extend' | 'checkin') => void;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  selectedId?: string;
  enableVirtualization?: boolean;
  minHeight?: number;
  maxHeight?: string;
  renderMobileCard?: (row: T, index: number) => React.ReactNode;
}

/**
 * DataTable — Virtualized, keyboard-navigable data table with row entry stagger
 * Built for reception-first operation with @tanstack/react-virtual.
 */
export function DataTable<T>({
  data,
  columns,
  rowKey,
  onRowClick,
  onRowAction,
  isLoading = false,
  emptyState,
  selectedId,
  enableVirtualization = true,
  maxHeight = '650px',
  renderMobileCard,
}: DataTableProps<T>) {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return data;

    return [...data].sort((a, b) => {
      const valA = col.accessor ? col.accessor(a) : (a as any)[sortKey];
      const valB = col.accessor ? col.accessor(b) : (b as any)[sortKey];

      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      let comparison = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else {
        comparison = String(valA).localeCompare(String(valB));
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [data, sortKey, sortOrder, columns]);

  // Virtualizer for smooth rendering of large lists
  const rowVirtualizer = useVirtualizer({
    count: sortedData.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 64, // ~64px row height
    overscan: 10,
    enabled: enableVirtualization && sortedData.length > 25,
  });

  // Handle column header sort toggle
  const handleSort = (colKey: string, sortable?: boolean) => {
    if (!sortable) return;
    if (sortKey === colKey) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else {
        setSortKey(null);
        setSortOrder('asc');
      }
    } else {
      setSortKey(colKey);
      setSortOrder('asc');
    }
  };

  // Keyboard navigation on table container
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is inside an input, select, or textarea
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }

      if (sortedData.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = Math.min(prev + 1, sortedData.length - 1);
          if (enableVirtualization && sortedData.length > 25) {
            rowVirtualizer.scrollToIndex(next, { align: 'auto' });
          }
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = Math.max(prev - 1, 0);
          if (enableVirtualization && sortedData.length > 25) {
            rowVirtualizer.scrollToIndex(next, { align: 'auto' });
          }
          return next;
        });
      } else if (e.key === 'Enter') {
        if (focusedIndex >= 0 && focusedIndex < sortedData.length) {
          e.preventDefault();
          onRowClick?.(sortedData[focusedIndex]);
        }
      } else if (e.key.toLowerCase() === 'e') {
        if (focusedIndex >= 0 && focusedIndex < sortedData.length) {
          e.preventDefault();
          onRowAction?.(sortedData[focusedIndex], 'extend');
        }
      } else if (e.key.toLowerCase() === 'c') {
        if (focusedIndex >= 0 && focusedIndex < sortedData.length) {
          e.preventDefault();
          onRowAction?.(sortedData[focusedIndex], 'checkin');
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [sortedData, focusedIndex, onRowClick, onRowAction, enableVirtualization, rowVirtualizer]);

  if (isLoading) {
    return (
      <>
        {/* Mobile Skeleton (< 768px) */}
        {renderMobileCard && (
          <div className="md:hidden">
            <MobileCardSkeleton count={5} />
          </div>
        )}

        {/* Desktop Skeleton (>= 768px, or fallback on all screens if no renderMobileCard) */}
        <div
          className={clsx(
            'p-px rounded-2xl bg-slate-200/80 shadow-sm overflow-hidden',
            renderMobileCard && 'hidden md:block'
          )}
          role="status"
          aria-busy="true"
          aria-label="Loading table data"
        >
          <div className="bg-white rounded-[15px] p-6">
            <MembersSkeleton count={8} />
          </div>
        </div>
      </>
    );
  }

  if (sortedData.length === 0) {
    return (
      <div className="p-px rounded-2xl bg-slate-200/80 shadow-sm overflow-hidden">
        <div className="bg-white rounded-[15px] p-8 flex items-center justify-center">
          {emptyState || (
            <EmptyState
              variant="members"
              title="No records found"
              description="Try adjusting your filters or search keywords."
            />
          )}
        </div>
      </div>
    );
  }

  const isVirtualized = enableVirtualization && sortedData.length > 25;
  const virtualRows = isVirtualized ? rowVirtualizer.getVirtualItems() : [];
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end
      : 0;

  return (
    <>
      {/* Mobile Card List (< 768px) */}
      {renderMobileCard && (
        <div className="md:hidden space-y-3">
          {sortedData.map((row, index) => (
            <div key={rowKey(row)}>
              {renderMobileCard(row, index)}
            </div>
          ))}
        </div>
      )}

      {/* Desktop Virtualized Table (>= 768px, or fallback on all screens if no renderMobileCard) */}
      <div
        className={clsx(
          'p-px rounded-2xl bg-slate-200/80 shadow-sm overflow-hidden',
          renderMobileCard && 'hidden md:block'
        )}
      >
        <div
          ref={tableContainerRef}
          tabIndex={0}
          role="region"
          aria-label="Data Table (use Up/Down arrow keys and Enter)"
          className="bg-white rounded-[15px] overflow-x-auto overflow-y-auto outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
          style={{ maxHeight }}
        >
          <table className="w-full text-left border-collapse min-w-[650px] md:min-w-full" role="table">
          {/* Header */}
          <thead className="bg-slate-50/90 sticky top-0 z-20 border-b border-slate-200/80 backdrop-blur-md">
            <tr role="row">
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    role="columnheader"
                    style={{ width: col.width }}
                    onClick={() => handleSort(col.key, col.sortable)}
                    className={clsx(
                      'px-5 py-3.5 text-xs font-bold uppercase tracking-wider select-none',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right',
                      col.align !== 'center' && col.align !== 'right' && 'text-left',
                      col.sortable
                        ? 'cursor-pointer hover:bg-slate-100/80 text-slate-700 transition-colors'
                        : 'text-slate-500',
                      col.className
                    )}
                  >
                    <div
                      className={clsx(
                        'inline-flex items-center gap-1.5',
                        col.align === 'center' && 'justify-center',
                        col.align === 'right' && 'justify-end'
                      )}
                    >
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-slate-400">
                          {isSorted ? (
                            sortOrder === 'asc' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Body */}
          <tbody
            role="rowgroup"
            className="divide-y divide-slate-100"
          >
            {isVirtualized ? (
              <>
                {paddingTop > 0 && (
                  <tr>
                    <td style={{ height: `${paddingTop}px` }} colSpan={columns.length} />
                  </tr>
                )}
                {virtualRows.map((virtualRow) => {
                  const row = sortedData[virtualRow.index];
                  const key = rowKey(row);
                  const isSelected = selectedId === key || focusedIndex === virtualRow.index;

                  return (
                    <tr
                      key={key}
                      role="row"
                      data-index={virtualRow.index}
                      onClick={() => {
                        setFocusedIndex(virtualRow.index);
                        onRowClick?.(row);
                      }}
                      className={clsx(
                        'group transition-colors duration-100 cursor-pointer',
                        isSelected
                          ? 'bg-blue-50/80 hover:bg-blue-50 text-slate-900 ring-1 ring-inset ring-blue-500/30'
                          : 'hover:bg-slate-50/80 text-slate-700'
                      )}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          role="cell"
                          style={{ width: col.width }}
                          className={clsx(
                            'px-5 py-3.5 text-sm min-w-0',
                            col.align === 'center' && 'text-center',
                            col.align === 'right' && 'text-right',
                            col.align !== 'center' && col.align !== 'right' && 'text-left',
                            col.className
                          )}
                        >
                          {col.render
                            ? col.render(row, virtualRow.index)
                            : col.accessor
                            ? col.accessor(row)
                            : (row as any)[col.key]}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {paddingBottom > 0 && (
                  <tr>
                    <td style={{ height: `${paddingBottom}px` }} colSpan={columns.length} />
                  </tr>
                )}
              </>
            ) : (
              sortedData.map((row, index) => {
                const key = rowKey(row);
                const isSelected = selectedId === key || focusedIndex === index;

                return (
                  <tr
                    key={key}
                    role="row"
                    onClick={() => {
                      setFocusedIndex(index);
                      onRowClick?.(row);
                    }}
                    style={
                      {
                        '--row-index': Math.min(index, 12),
                        animationDelay: `${Math.min(index, 12) * 40}ms`,
                      } as React.CSSProperties
                    }
                    className={clsx(
                      'group transition-colors duration-100 cursor-pointer animate-[fade-in-up_280ms_cubic-bezier(0.23,1,0.32,1)_both]',
                      isSelected
                        ? 'bg-blue-50/80 hover:bg-blue-50 text-slate-900 ring-1 ring-inset ring-blue-500/30'
                        : 'hover:bg-slate-50/80 text-slate-700'
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        role="cell"
                        style={{ width: col.width }}
                        className={clsx(
                          'px-5 py-3.5 text-sm min-w-0',
                          col.align === 'center' && 'text-center',
                          col.align === 'right' && 'text-right',
                          col.className
                        )}
                      >
                        {col.render
                          ? col.render(row, index)
                          : col.accessor
                          ? col.accessor(row)
                          : (row as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
}
