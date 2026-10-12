import { Category } from "@/backend";
import type { Item, Message, UserProfile } from "@/backend";

export { Category };
export type { Item, Message, UserProfile };

export const CATEGORY_LABELS: Record<Category, string> = {
  [Category.events]: "Events",
  [Category.places]: "Places",
  [Category.food]: "Food",
  [Category.culture]: "Culture",
};

export interface CategoryMeta {
  value: Category;
  label: string;
  blurb: string;
}

export const CATEGORY_META: CategoryMeta[] = [
  {
    value: Category.events,
    label: "Events",
    blurb: "Meetups, gigs, and gatherings",
  },
  {
    value: Category.places,
    label: "Places",
    blurb: "Cafés, parks, and third spaces",
  },
  {
    value: Category.food,
    label: "Food",
    blurb: "Where the city actually eats",
  },
  {
    value: Category.culture,
    label: "Culture",
    blurb: "Art, music, and local scenes",
  },
];

export function categoryLabel(category: Category): string {
  return CATEGORY_LABELS[category] ?? String(category);
}

export function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatMessageTime(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "";
  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/* ------------------------------------------------------------------ */
/* Board browsing: filter, search, sort state and URL serialization   */
/* ------------------------------------------------------------------ */

export type BoardCategoryFilter = Category | "all";

export type BoardSort =
  | "name"
  | "area"
  | "lastVerified"
  | "category"
  | "activityId";

export interface BoardSortOption {
  value: BoardSort;
  label: string;
}

export const BOARD_SORT_OPTIONS: BoardSortOption[] = [
  { value: "name", label: "Name" },
  { value: "area", label: "Area" },
  { value: "lastVerified", label: "Last verified" },
  { value: "category", label: "Category" },
  { value: "activityId", label: "Activity ID" },
];

export interface BoardFilters {
  category: BoardCategoryFilter;
  search: string;
  sort: BoardSort;
}

export const DEFAULT_BOARD_FILTERS: BoardFilters = {
  category: "all",
  search: "",
  sort: "name",
};

const CATEGORY_VALUES: string[] = Object.values(Category);
const SORT_VALUES: string[] = BOARD_SORT_OPTIONS.map((option) => option.value);

function isCategoryFilter(value: unknown): value is BoardCategoryFilter {
  return value === "all" || CATEGORY_VALUES.includes(String(value));
}

function isBoardSort(value: unknown): value is BoardSort {
  return SORT_VALUES.includes(String(value));
}

/**
 * Read board filters from a URLSearchParams-like record. Unknown or missing
 * values fall back to the defaults so a shared link always resolves.
 */
export function parseBoardFilters(
  params: URLSearchParams | Record<string, string | undefined>,
): BoardFilters {
  const get = (key: string): string | undefined =>
    params instanceof URLSearchParams
      ? (params.get(key) ?? undefined)
      : params[key];

  const category = get("category");
  const sort = get("sort");
  const search = get("q");

  return {
    category: isCategoryFilter(category)
      ? category
      : DEFAULT_BOARD_FILTERS.category,
    search: search ?? DEFAULT_BOARD_FILTERS.search,
    sort: isBoardSort(sort) ? sort : DEFAULT_BOARD_FILTERS.sort,
  };
}

/**
 * Serialize board filters into a plain search-param record, omitting defaults
 * so a clean board keeps a clean URL.
 */
export function serializeBoardFilters(
  filters: BoardFilters,
): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.category !== DEFAULT_BOARD_FILTERS.category) {
    params.category = filters.category;
  }
  if (filters.search.trim() !== "") {
    params.q = filters.search.trim();
  }
  if (filters.sort !== DEFAULT_BOARD_FILTERS.sort) {
    params.sort = filters.sort;
  }
  return params;
}

export function hasActiveFilters(filters: BoardFilters): boolean {
  return (
    filters.category !== DEFAULT_BOARD_FILTERS.category ||
    filters.search.trim() !== "" ||
    filters.sort !== DEFAULT_BOARD_FILTERS.sort
  );
}

function matchesSearch(item: Item, query: string): boolean {
  const haystack = [
    item.title,
    item.area,
    item.shortDescription,
    item.fullDescription,
    ...item.tags,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function compareBySort(a: Item, b: Item, sort: BoardSort): number {
  switch (sort) {
    case "area":
      return a.area.localeCompare(b.area) || a.title.localeCompare(b.title);
    case "lastVerified":
      return (b.lastVerified ?? "").localeCompare(a.lastVerified ?? "");
    case "category":
      return (
        categoryLabel(a.category).localeCompare(categoryLabel(b.category)) ||
        a.title.localeCompare(b.title)
      );
    case "activityId":
      return (a.activityId ?? "").localeCompare(b.activityId ?? "");
    default:
      return a.title.localeCompare(b.title);
  }
}

/**
 * Apply category filter, free-text search, and sort to the board. Shared by
 * the board page task so the same rules drive the visible list.
 */
export function filterAndSortItems(
  items: Item[],
  filters: BoardFilters,
): Item[] {
  const query = filters.search.trim().toLowerCase();
  return items
    .filter(
      (item) =>
        filters.category === "all" || item.category === filters.category,
    )
    .filter((item) => query === "" || matchesSearch(item, query))
    .slice()
    .sort((a, b) => compareBySort(a, b, filters.sort));
}

/**
 * Render a board date range from the separate start/end fields, falling back
 * to the legacy dateOrHours value when no structured dates are present.
 */
export function formatBoardDateRange(item: Item): string | null {
  const start = item.startDate?.trim();
  const end = item.endDate?.trim();
  if (start && end && start !== end) return `${start} – ${end}`;
  if (start) return start;
  if (end) return end;
  return item.dateOrHours?.trim() || null;
}

export function formatBoardTime(item: Item): string | null {
  return item.startTime?.trim() || null;
}
