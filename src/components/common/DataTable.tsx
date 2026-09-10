import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Search, 
  SlidersHorizontal, 
  CheckSquare, 
  Square, 
  Download, 
  Printer, 
  RefreshCw,
  Eye,
  EyeOff,
  Filter
} from 'lucide-react';
import { TableRowSkeleton } from '../ui/Skeleton';
import { EmptyState } from './EmptyState';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  hideable?: boolean;
  defaultHidden?: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  
  // Search
  searchable?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchFilter?: (item: T, query: string) => boolean;
  
  // Pagination
  pageSize?: number;
  serverPagination?: boolean;
  totalRecords?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  
  // Sorting
  sortKey?: string | null;
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (key: string, direction: 'asc' | 'desc') => void;
  
  // Selection
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  bulkActions?: (selectedIds: string[], clearSelection: () => void) => React.ReactNode;
  
  // Filters & Custom Slots
  filterSlot?: React.ReactNode;
  headerActions?: React.ReactNode;
  
  // Empty State
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionText?: string;
  onEmptyAction?: () => void;
  
  // Row interaction
  onRowClick?: (item: T) => void;
  
  // Export & Print
  exportFileName?: string;
  enableExport?: boolean;
  enablePrint?: boolean;
  
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  
  searchable = false,
  searchPlaceholder = 'Search records...',
  searchValue,
  onSearchChange,
  searchFilter,
  
  pageSize = 10,
  serverPagination = false,
  totalRecords,
  currentPage: externalPage,
  onPageChange,
  
  sortKey: externalSortKey,
  sortDirection: externalSortDir,
  onSortChange,
  
  selectable = false,
  selectedIds: externalSelectedIds,
  onSelectionChange,
  bulkActions,
  
  filterSlot,
  headerActions,
  
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your search criteria or add new items.',
  emptyActionText,
  onEmptyAction,
  
  onRowClick,
  
  exportFileName = 'Exported_Table_Data',
  enableExport = false,
  enablePrint = false,
  
  className,
}: DataTableProps<T>) {
  // Local states for client-side mode
  const [localSearch, setLocalSearch] = useState('');
  const [localPage, setLocalPage] = useState(1);
  const [localSortKey, setLocalSortKey] = useState<string | null>(null);
  const [localSortDir, setLocalSortDir] = useState<'asc' | 'desc'>('asc');
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>([]);
  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);
  
  // Column visibility state
  const [hiddenColumnKeys, setHiddenColumnKeys] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    columns.forEach((c) => {
      if (c.defaultHidden) initial[c.key] = true;
    });
    return initial;
  });

  const visibleColumns = useMemo(() => {
    return columns.filter((col) => !hiddenColumnKeys[col.key]);
  }, [columns, hiddenColumnKeys]);

  const activeSearch = searchValue !== undefined ? searchValue : localSearch;
  const activePage = externalPage !== undefined ? externalPage : localPage;
  const activeSortKey = externalSortKey !== undefined ? externalSortKey : localSortKey;
  const activeSortDir = externalSortDir !== undefined ? externalSortDir : localSortDir;
  const activeSelectedIds = externalSelectedIds !== undefined ? externalSelectedIds : localSelectedIds;

  const handleSearch = (val: string) => {
    if (onSearchChange) {
      onSearchChange(val);
    } else {
      setLocalSearch(val);
      setLocalPage(1);
    }
  };

  // Client-side Filter
  const filteredData = useMemo(() => {
    if (serverPagination) return data;
    if (!activeSearch.trim() || !searchFilter) return data;
    return data.filter((item) => searchFilter(item, activeSearch.toLowerCase()));
  }, [data, activeSearch, searchFilter, serverPagination]);

  // Client-side Sort
  const sortedData = useMemo(() => {
    if (serverPagination || !activeSortKey) return filteredData;
    return [...filteredData].sort((a: any, b: any) => {
      const aVal = a[activeSortKey];
      const bVal = b[activeSortKey];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return activeSortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return activeSortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredData, activeSortKey, activeSortDir, serverPagination]);

  // Total records & pages
  const totalCount = serverPagination ? (totalRecords ?? data.length) : sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Client-side Paginate
  const displayData = useMemo(() => {
    if (serverPagination) return data;
    const validPage = Math.min(Math.max(activePage, 1), totalPages);
    const start = (validPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [data, sortedData, activePage, totalPages, pageSize, serverPagination]);

  const handlePageChange = (newPage: number) => {
    const clamped = Math.min(Math.max(newPage, 1), totalPages);
    if (onPageChange) {
      onPageChange(clamped);
    } else {
      setLocalPage(clamped);
    }
  };

  const handleSort = (key: string) => {
    let nextDir: 'asc' | 'desc' = 'asc';
    if (activeSortKey === key) {
      nextDir = activeSortDir === 'asc' ? 'desc' : 'asc';
    }
    if (onSortChange) {
      onSortChange(key, nextDir);
    } else {
      setLocalSortKey(key);
      setLocalSortDir(nextDir);
    }
  };

  const handleSelectAll = () => {
    const currentKeys = displayData.map(keyExtractor);
    const allSelected = currentKeys.length > 0 && currentKeys.every((id) => activeSelectedIds.includes(id));
    
    let newSelected: string[];
    if (allSelected) {
      newSelected = activeSelectedIds.filter((id) => !currentKeys.includes(id));
    } else {
      newSelected = Array.from(new Set([...activeSelectedIds, ...currentKeys]));
    }

    if (onSelectionChange) {
      onSelectionChange(newSelected);
    } else {
      setLocalSelectedIds(newSelected);
    }
  };

  const handleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let newSelected: string[];
    if (activeSelectedIds.includes(id)) {
      newSelected = activeSelectedIds.filter((item) => item !== id);
    } else {
      newSelected = [...activeSelectedIds, id];
    }

    if (onSelectionChange) {
      onSelectionChange(newSelected);
    } else {
      setLocalSelectedIds(newSelected);
    }
  };

  const handleToggleColumn = (key: string) => {
    setHiddenColumnKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleExportCSV = () => {
    const headers = visibleColumns.map((c) => (typeof c.header === 'string' ? c.header : c.key));
    const rows = (serverPagination ? data : sortedData).map((item: any) =>
      visibleColumns.map((col) => {
        const val = item[col.key];
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val ?? '').replace(/"/g, '""');
      })
    );

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${exportFileName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const isAllCurrentSelected =
    displayData.length > 0 && displayData.every((item) => activeSelectedIds.includes(keyExtractor(item)));
  const isSomeCurrentSelected =
    displayData.some((item) => activeSelectedIds.includes(keyExtractor(item))) && !isAllCurrentSelected;

  return (
    <div className={cn('bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden flex flex-col', className)}>
      {/* Table Toolbar */}
      <div className="p-4 border-b border-neutral-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#FAF6F0]/40">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {searchable && (
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={activeSearch}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-xl focus:border-[#7B2435] focus:outline-none bg-white font-medium placeholder:text-neutral-400 transition"
              />
            </div>
          )}

          {filterSlot && <div className="flex items-center gap-2">{filterSlot}</div>}
        </div>

        <div className="flex items-center gap-2 justify-end">
          {enableExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              leftIcon={<Download className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Export
            </Button>
          )}

          {enablePrint && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Print
            </Button>
          )}

          {/* Column Visibility Selector */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsColumnPickerOpen(!isColumnPickerOpen)}
              leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Columns
            </Button>

            {isColumnPickerOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-neutral-200 p-2 z-30 space-y-1">
                <div className="text-[11px] font-bold text-neutral-500 uppercase px-2 py-1 border-b border-neutral-100 mb-1">
                  Visible Columns
                </div>
                {columns
                  .filter((col) => col.hideable !== false)
                  .map((col) => {
                    const isVisible = !hiddenColumnKeys[col.key];
                    return (
                      <button
                        key={col.key}
                        type="button"
                        onClick={() => handleToggleColumn(col.key)}
                        className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50 rounded-lg cursor-pointer"
                      >
                        <span className="truncate">{typeof col.header === 'string' ? col.header : col.key}</span>
                        {isVisible ? (
                          <Eye className="w-3.5 h-3.5 text-[#7B2435]" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-neutral-400" />
                        )}
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          {headerActions}
        </div>
      </div>

      {/* Bulk Selection Bar */}
      {selectable && activeSelectedIds.length > 0 && (
        <div className="px-4 py-2.5 bg-[#FFF0F3] border-b border-[#F5D5DC] flex items-center justify-between text-xs text-[#7B2435] font-semibold">
          <div className="flex items-center gap-2">
            <span>{activeSelectedIds.length} item(s) selected</span>
            <button
              type="button"
              onClick={() => {
                if (onSelectionChange) onSelectionChange([]);
                else setLocalSelectedIds([]);
              }}
              className="text-xs text-neutral-500 hover:text-neutral-900 underline cursor-pointer ml-2"
            >
              Clear selection
            </button>
          </div>
          {bulkActions && (
            <div className="flex items-center gap-2">
              {bulkActions(activeSelectedIds, () => {
                if (onSelectionChange) onSelectionChange([]);
                else setLocalSelectedIds([]);
              })}
            </div>
          )}
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-[#FAF6F0] text-neutral-700 uppercase tracking-wider text-[11px] font-bold border-b border-neutral-200">
            <tr>
              {selectable && (
                <th className="py-3.5 px-4 w-10">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="flex items-center justify-center text-neutral-500 hover:text-[#7B2435] cursor-pointer"
                  >
                    {isAllCurrentSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#7B2435]" />
                    ) : isSomeCurrentSelected ? (
                      <div className="w-4 h-4 border-2 border-[#7B2435] bg-[#7B2435] rounded-xs flex items-center justify-center text-white text-[10px]">
                        -
                      </div>
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
              )}
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'py-3.5 px-4 font-bold select-none whitespace-nowrap',
                    col.sortable ? 'cursor-pointer hover:text-[#7B2435] transition-colors' : '',
                    col.headerClassName
                  )}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="shrink-0 text-neutral-400">
                        {activeSortKey === col.key ? (
                          activeSortDir === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-[#7B2435]" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-[#7B2435]" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {isLoading ? (
              Array.from({ length: pageSize > 6 ? 6 : pageSize }).map((_, idx) => (
                <TableRowSkeleton key={idx} columns={visibleColumns.length + (selectable ? 1 : 0)} />
              ))
            ) : displayData.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + (selectable ? 1 : 0)} className="py-12">
                  <EmptyState
                    preset="admin-table"
                    title={emptyTitle}
                    description={emptyDescription}
                    actionText={emptyActionText}
                    onAction={onEmptyAction}
                  />
                </td>
              </tr>
            ) : (
              displayData.map((item, idx) => {
                const id = keyExtractor(item);
                const isSelected = activeSelectedIds.includes(id);

                return (
                  <tr
                    key={id}
                    onClick={onRowClick ? () => onRowClick(item) : undefined}
                    className={cn(
                      'hover:bg-[#FAF6F0]/60 transition-colors',
                      isSelected ? 'bg-[#FFF0F3]/40' : '',
                      onRowClick ? 'cursor-pointer' : ''
                    )}
                  >
                    {selectable && (
                      <td className="py-3 px-4 w-10" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleSelectRow(id, e)}
                          className="flex items-center justify-center text-neutral-400 hover:text-[#7B2435] cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#7B2435]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    )}
                    {visibleColumns.map((col) => (
                      <td key={col.key} className={cn('py-3.5 px-4 text-neutral-800', col.className)}>
                        {col.render ? col.render(item, idx) : (item as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && totalCount > 0 && (
        <div className="p-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500 bg-[#FAF6F0]/30">
          <span>
            Showing {(activePage - 1) * pageSize + 1} to {Math.min(activePage * pageSize, totalCount)} of{' '}
            {totalCount} records
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={activePage <= 1}
              onClick={() => handlePageChange(activePage - 1)}
              className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-bold text-neutral-800 bg-white border border-neutral-200 rounded-lg">
              Page {activePage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={activePage >= totalPages}
              onClick={() => handlePageChange(activePage + 1)}
              className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition shadow-2xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
