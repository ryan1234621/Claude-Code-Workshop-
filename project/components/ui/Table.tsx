'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/app/lib/utils';

export interface TableColumn<T> {
  key: string;
  header: string;
  accessor?: keyof T;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  keyExtractor: (row: T, index: number) => string;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  className?: string;
  rowClassName?: (row: T) => string;
  onRowClick?: (row: T) => void;
  skeletonRows?: number;
}

function SkeletonRow({ columns }: { columns: TableColumn<unknown>[] }) {
  return (
    <tr>
      {columns.map((col) => (
        <td key={col.key} className="px-4 py-3">
          <div className="h-4 bg-zinc-100 rounded animate-pulse" style={{ width: col.width ?? '80%' }} />
        </td>
      ))}
    </tr>
  );
}

export function Table<T>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No records found.',
  emptyIcon,
  keyExtractor,
  onSort,
  className,
  rowClassName,
  onRowClick,
  skeletonRows = 5,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    const nextDir = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortDir(nextDir);
    onSort?.(key, nextDir);
  };

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50">
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={cn(
                  'px-4 py-3 text-left text-xs font-semibold tracking-wider uppercase text-parmore-slate whitespace-nowrap',
                  col.align === 'center' && 'text-center',
                  col.align === 'right' && 'text-right',
                  col.sortable && 'cursor-pointer select-none hover:text-parmore-black transition-colors'
                )}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    sortKey === col.key ? (
                      sortDir === 'asc'
                        ? <ChevronUp className="h-3 w-3 text-parmore-gold" />
                        : <ChevronDown className="h-3 w-3 text-parmore-gold" />
                    ) : (
                      <ChevronsUpDown className="h-3 w-3 opacity-30" />
                    )
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <SkeletonRow key={i} columns={columns as TableColumn<unknown>[]} />
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-16 text-center">
                {emptyIcon && <div className="flex justify-center mb-3">{emptyIcon}</div>}
                <p className="text-sm text-parmore-slate">{emptyMessage}</p>
              </td>
            </tr>
          ) : (
            <AnimatePresence mode="popLayout" initial={false}>
              {data.map((row, i) => (
                <motion.tr
                  key={keyExtractor(row, i)}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, delay: i * 0.03 }}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'border-b border-zinc-100 transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-parmore-cream/40',
                    rowClassName?.(row)
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3 text-sm text-parmore-black',
                        col.align === 'center' && 'text-center',
                        col.align === 'right' && 'text-right'
                      )}
                    >
                      {col.render
                        ? col.render(row, i)
                        : col.accessor
                        ? String(row[col.accessor] ?? '—')
                        : '—'}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>
          )}
        </tbody>
      </table>
    </div>
  );
}
