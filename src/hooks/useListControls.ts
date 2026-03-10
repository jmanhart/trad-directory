import { useState, useMemo, useCallback } from "react";

export type ViewMode = "grid" | "row";

const VIEW_MODE_KEY = "listViewMode";

interface UseListControlsOptions<T> {
  items: T[];
  storageKey?: string;
  defaultPerPage?: number;
  filterFn?: (item: T, filters: Record<string, string>) => boolean;
  sortFn?: (a: T, b: T, filters: Record<string, string>) => number;
}

function getStoredViewMode(): ViewMode {
  try {
    const stored = localStorage.getItem(VIEW_MODE_KEY);
    if (stored === "grid" || stored === "row") return stored;
  } catch {
    // ignore
  }
  return "grid";
}

export function useListControls<T>({
  items,
  defaultPerPage = 50,
  filterFn,
  sortFn,
}: UseListControlsOptions<T>) {
  const [viewMode, setViewModeState] = useState<ViewMode>(getStoredViewMode);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPageState] = useState(defaultPerPage);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch {
      // ignore
    }
  }, []);

  const setFilter = useCallback((key: string, value: string) => {
    setFilters(prev => {
      if (!value) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setCurrentPage(1);
  }, []);

  const setPerPage = useCallback((value: number) => {
    setPerPageState(value);
    setCurrentPage(1);
  }, []);

  const activeFilterCount = Object.keys(filters).length;

  const filteredAndSortedItems = useMemo(() => {
    let result =
      filterFn && activeFilterCount > 0
        ? items.filter(item => filterFn(item, filters))
        : [...items];
    if (sortFn) {
      result = [...result].sort((a, b) => sortFn(a, b, filters));
    }
    return result;
  }, [items, filters, filterFn, sortFn, activeFilterCount]);

  const totalFiltered = filteredAndSortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / perPage));

  const safePage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return filteredAndSortedItems.slice(start, start + perPage);
  }, [filteredAndSortedItems, safePage, perPage]);

  const showingFrom = totalFiltered === 0 ? 0 : (safePage - 1) * perPage + 1;
  const showingTo = Math.min(safePage * perPage, totalFiltered);

  return {
    viewMode,
    setViewMode,
    filters,
    setFilter,
    clearFilters,
    activeFilterCount,
    currentPage: safePage,
    setCurrentPage,
    perPage,
    setPerPage,
    totalPages,
    totalFiltered,
    paginatedItems,
    showingFrom,
    showingTo,
  };
}
