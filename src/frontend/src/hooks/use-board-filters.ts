import {
  DEFAULT_BOARD_FILTERS,
  hasActiveFilters,
  parseBoardFilters,
  serializeBoardFilters,
} from "@/types";
import type { BoardFilters } from "@/types";
import { useCallback, useEffect, useState } from "react";

function readLocationFilters(): BoardFilters {
  if (typeof window === "undefined") return DEFAULT_BOARD_FILTERS;
  return parseBoardFilters(new URLSearchParams(window.location.search));
}

function writeLocationFilters(filters: BoardFilters): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(serializeBoardFilters(filters));
  const query = params.toString();
  const next = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
  window.history.replaceState(null, "", next);
}

/**
 * Shared board browsing state. Filter, search, and sort live in the page URL
 * so a filtered board can be shared and survives refresh. The board page task
 * consumes this hook to render its controls and list.
 */
export function useBoardFilters() {
  const [filters, setFilters] = useState<BoardFilters>(readLocationFilters);

  useEffect(() => {
    writeLocationFilters(filters);
  }, [filters]);

  useEffect(() => {
    function handlePopState() {
      setFilters(readLocationFilters());
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const setCategory = useCallback((category: BoardFilters["category"]) => {
    setFilters((current) => ({ ...current, category }));
  }, []);

  const setSearch = useCallback((search: string) => {
    setFilters((current) => ({ ...current, search }));
  }, []);

  const setSort = useCallback((sort: BoardFilters["sort"]) => {
    setFilters((current) => ({ ...current, sort }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_BOARD_FILTERS);
  }, []);

  return {
    filters,
    setFilters,
    setCategory,
    setSearch,
    setSort,
    clearFilters,
    hasActiveFilters: hasActiveFilters(filters),
  };
}
