<template>
  <div
    class="em-table-container"
    :class="[customClasses?.container]"
    :style="customStyles?.container"
  >
    <div v-if="searchable || exportable" class="em-table-toolbar">
      <div v-if="searchable" class="em-table-search">
        <SearchBar v-model="searchQuery" :placeholder="resolvedSearchPlaceholder" />
      </div>
      <button
        class="em-table-display-button"
        aria-label="Display settings"
        @click.stop="toggleDisplayPopover($event)"
      >
        {{ activeDisplayLabel }}
      </button>
      <Teleport to="body">
        <Transition name="popover-fade">
          <div
            v-if="isDisplayPopoverOpen"
            class="display-popover"
            :style="displayPopoverStyle"
            @click.stop
          >
            <div class="display-options">
              <div
                v-for="option in displayOptions"
                :key="option.label"
                class="display-option"
                :class="{
                  'display-option-active': isActiveDisplayOption(option),
                }"
                @click="selectDisplayOption(option)"
              >
                {{ option.label }}
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
      <button
        v-if="exportable"
        class="em-table-export-button"
        aria-label="Download as Excel"
        @click="exportToExcel"
      >
        <IconRenderer name="download-outline" size="small" />
      </button>
    </div>
    <div v-if="loading" class="em-table-loading">
      <div>is loading...</div>
    </div>
    <div
      v-else
      class="em-table-scroll-wrapper"
      :class="{ scrollable: !isPaginated && internalScrollEnabled }"
    >
      <table class="em-table" role="grid" :aria-label="resolvedAriaLabel">
        <thead>
          <tr :class="[customClasses?.headerRow]" :style="customStyles?.headerRow">
            <th
              v-if="selectable"
              class="em-table-header-cell selection-header"
              :class="[customClasses?.headerCell]"
              :style="customStyles?.headerCell"
            >
              <input
                type="checkbox"
                class="selection-checkbox"
                :checked="isAllSelected"
                :indeterminate="isIndeterminate"
                aria-label="Select all rows"
                @change="toggleSelectAll"
                @click.stop
              />
            </th>
            <th
              v-for="column in columns"
              :key="String(column.key)"
              class="em-table-header-cell"
              :class="[{ sortable: column.sortable !== false }, customClasses?.headerCell]"
              :style="[getColumnStyle(column), customStyles?.headerCell]"
              :aria-sort="getAriaSort(column.key)"
              :tabindex="column.sortable !== false ? 0 : undefined"
              @click="column.sortable !== false ? handleSort(column.key) : undefined"
              @keydown.enter="column.sortable !== false ? handleSort(column.key) : undefined"
              @keydown.space.prevent="
                column.sortable !== false ? handleSort(column.key) : undefined
              "
            >
              <div class="header-content">
                <span>{{ column.label }}</span>
                <span
                  v-if="column.sortable !== false"
                  class="sort-indicator"
                  :class="getSortClass(column.key)"
                  aria-hidden="true"
                >
                  <span class="sort-arrow sort-arrow-up">▲</span>
                  <span class="sort-arrow sort-arrow-down">▼</span>
                </span>
                <button
                  v-if="column.filterMenu"
                  class="filter-button"
                  :class="{
                    'filter-active': getActiveFilterCount(String(column.key)) > 0,
                  }"
                  :aria-label="`Filter ${column.label}`"
                  :aria-expanded="openFilterColumn === String(column.key)"
                  aria-haspopup="listbox"
                  @click.stop="toggleFilterPopover(String(column.key), $event)"
                  @keydown.enter.stop="toggleFilterPopover(String(column.key), $event)"
                  @keydown.space.prevent.stop="toggleFilterPopover(String(column.key), $event)"
                >
                  <el-icon name="funnel-outline" size="small" />
                  <span v-if="getActiveFilterCount(String(column.key)) > 0" class="filter-badge">
                    {{ getActiveFilterCount(String(column.key)) }}
                  </span>
                </button>
              </div>
              <Teleport to="body">
                <Transition name="popover-fade">
                  <div
                    v-if="column.filterMenu && openFilterColumn === String(column.key)"
                    class="filter-popover"
                    :style="filterPopoverStyle"
                    role="listbox"
                    :aria-label="`Filter by ${column.label}`"
                    aria-multiselectable="true"
                    @click.stop
                  >
                    <div class="filter-popover-header">
                      <span class="filter-popover-title">{{ column.label }}</span>
                      <button
                        class="filter-popover-close"
                        aria-label="Close filter"
                        @click="closeFilterPopover"
                      >
                        ✕
                      </button>
                    </div>
                    <div class="filter-search">
                      <input
                        v-model="filterSearchQueries[String(column.key)]"
                        type="text"
                        class="filter-search-input"
                        placeholder="Search..."
                        @click.stop
                      />
                    </div>
                    <div class="filter-actions">
                      <button
                        class="filter-action-btn"
                        @click="selectAllFilterValues(String(column.key))"
                      >
                        Select all
                      </button>
                      <button
                        class="filter-action-btn"
                        @click="clearAllFilterValues(String(column.key))"
                      >
                        Clear
                      </button>
                    </div>
                    <div class="filter-options">
                      <label
                        v-for="filterValue in filteredUniqueValues[String(column.key)]"
                        :key="filterValue"
                        class="filter-option"
                        role="option"
                        :aria-selected="isFilterValueSelected(String(column.key), filterValue)"
                      >
                        <input
                          type="checkbox"
                          class="filter-checkbox"
                          :checked="isFilterValueSelected(String(column.key), filterValue)"
                          @change="toggleFilterValue(String(column.key), filterValue)"
                        />
                        <span class="filter-option-label">{{ filterValue }}</span>
                      </label>
                      <div
                        v-if="(filteredUniqueValues[String(column.key)] ?? []).length === 0"
                        class="filter-empty"
                      >
                        No values found
                      </div>
                    </div>
                  </div>
                </Transition>
              </Teleport>
            </th>
            <th
              v-if="showActionsColumn"
              class="em-table-header-cell actions-header"
              :class="[customClasses?.headerCell]"
              :style="customStyles?.headerCell"
            >
              {{ resolvedActionsColumnLabel }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, rowIndex) in paginatedData"
            :key="getRowKey(row, rowIndex)"
            class="em-table-row"
            :class="[
              {
                'row-even': rowIndex % 2 === 0,
                'row-odd': rowIndex % 2 !== 0,
                'row-clickable': navigateFromLine != null,
                'row-selected': selectable && isRowSelected(row),
              },
              customClasses?.row,
            ]"
            :style="customStyles?.row"
            @click="navigateFromLine != null ? handleRowClick(row, rowIndex) : undefined"
          >
            <td
              v-if="selectable"
              class="em-table-cell selection-cell"
              :class="[customClasses?.cell]"
              :style="customStyles?.cell"
              @click.stop
            >
              <input
                type="checkbox"
                class="selection-checkbox"
                :checked="isRowSelected(row)"
                :aria-label="`Select row ${rowIndex + 1}`"
                @change="toggleRowSelection(row)"
              />
            </td>
            <td
              v-for="column in columns"
              :key="`${getRowKey(row, rowIndex)}-${String(column.key)}`"
              class="em-table-cell"
              :class="[customClasses?.cell]"
              :style="[getColumnStyle(column), customStyles?.cell]"
            >
              <slot
                :name="`cell-${String(column.key)}`"
                :value="getCellValue(row, column.key)"
                :row="row"
                :column="column"
                :rowIndex="rowIndex"
              >
                {{ formatCellValue(getCellValue(row, column.key), column, row) }}
              </slot>
            </td>
            <td
              v-if="showActionsColumn"
              class="em-table-cell actions-cell"
              :class="[customClasses?.cell]"
              :style="customStyles?.cell"
            >
              <!-- Custom actions mode (popover with action list) -->
              <template v-if="hasCustomActions">
                <div class="actions-wrapper" ref="actionsRefs">
                  <button
                    class="actions-button"
                    :aria-label="`Actions for row ${rowIndex + 1}`"
                    :aria-expanded="openPopoverIndex === rowIndex"
                    aria-haspopup="menu"
                    @click.stop="togglePopover(rowIndex, $event)"
                  >
                    <slot name="actions-icon">
                      <span class="actions-icon">⋮</span>
                    </slot>
                  </button>
                  <Teleport to="body">
                    <Transition name="popover-fade">
                      <div
                        v-if="openPopoverIndex === rowIndex"
                        ref="popoverRef"
                        class="actions-popover"
                        :style="popoverStyle"
                        role="menu"
                        :aria-label="`Actions menu for row ${rowIndex + 1}`"
                        @click.stop
                      >
                        <div class="actions-menu">
                          <div
                            v-for="action in actions.filter((a) => !a.hidden?.(row))"
                            :key="action.key"
                            class="actions-menu-item"
                            :class="[
                              { 'action-danger': action.danger },
                              {
                                'action-disabled': isActionDisabled(action, row),
                              },
                            ]"
                            role="menuitem"
                            :tabindex="isActionDisabled(action, row) ? -1 : 0"
                            @click="
                              !isActionDisabled(action, row) && handleAction(action, row, rowIndex)
                            "
                            @keydown.enter="
                              !isActionDisabled(action, row) && handleAction(action, row, rowIndex)
                            "
                            @keydown.space.prevent="
                              !isActionDisabled(action, row) && handleAction(action, row, rowIndex)
                            "
                          >
                            <!-- <span v-if="action.icon" class="action-icon">{{ action.icon }}</span> -->
                            <span class="action-label">{{ action.label }}</span>
                          </div>
                        </div>
                      </div>
                    </Transition>
                  </Teleport>
                </div>
              </template>

              <!-- Delete-only mode (trash icon + confirmation popover) -->
              <template v-else-if="deleteAction">
                <div class="actions-wrapper" @click.stop>
                  <Popover
                    placement="left"
                    :confirmText="t('confirm')"
                    :cancelText="t('cancel')"
                    :showActions="true"
                    @confirm="confirmDelete(row, rowIndex)"
                  >
                    <template #trigger>
                      <button
                        class="actions-button delete-button"
                        :aria-label="`Delete row ${rowIndex + 1}`"
                      >
                        <el-icon
                          name="trash-outline"
                          size="small"
                          color="var(--action-danger-color, #9c222b)"
                        />
                      </button>
                    </template>
                    <p class="delete-confirm-text">
                      {{ t('confirmDeletionMessage') }}
                    </p>
                  </Popover>
                </div>
              </template>
            </td>
          </tr>
          <tr v-if="paginatedData.length === 0">
            <td
              :colspan="columns.length + (showActionsColumn ? 1 : 0) + (selectable ? 1 : 0)"
              class="em-table-empty"
            >
              <slot name="empty">
                {{ resolvedEmptyMessage }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!loading && isPaginated && totalPages > 1" class="em-table-pagination">
      <span class="pagination-info">{{ paginationInfo }}</span>
      <div class="pagination-controls">
        <button
          class="pagination-button"
          :disabled="currentPage === 1"
          aria-label="Previous page"
          @click="prevPage"
        >
          ‹
        </button>
        <template v-for="page in visiblePages" :key="page">
          <span v-if="typeof page === 'string'" class="pagination-ellipsis">&hellip;</span>

          <button
            v-else
            class="pagination-button"
            :class="{ active: page === currentPage }"
            :aria-label="`Page ${page}`"
            :aria-current="page === currentPage ? 'page' : undefined"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
        </template>
        <button
          class="pagination-button"
          :disabled="currentPage === totalPages"
          aria-label="Next page"
          @click="nextPage"
        >
          ›
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends object">
import Popover from '../popover/Popover.vue';
import SearchBar from '../search-bar/SearchBar.vue';
import { computed, nextTick, onMounted, onUnmounted, ref, watch, type CSSProperties } from 'vue';
import { useI18n } from 'vue-i18n';
import ExcelJS from 'exceljs';

// ===================================
// Types & Interfaces
// ===================================

export type SortDirection = 'asc' | 'desc' | null;

export interface ColumnDefinition<T> {
  /** Unique key matching the data property */
  key: keyof T | string;
  /** Display label for the column header */
  label: string;
  /** Whether the column is sortable (default: true) */
  sortable?: boolean;
  /** Column width (CSS value) */
  width?: string;
  /** Minimum column width */
  minWidth?: string;
  /** Maximum column width */
  maxWidth?: string;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Custom formatter function */
  // eslint-disable-next-line no-unused-vars
  formatter?: (value: unknown, row: T) => string;
  /** Custom sort comparator */
  // eslint-disable-next-line no-unused-vars
  sortComparator?: (a: T, b: T) => number;
  /** Whether to show a filter menu for this column (allows selecting values to filter) */
  filterMenu?: boolean;
}

export interface TableAction<T> {
  /** Unique key for the action */
  key: string;
  /** Display label */
  label: string;
  /** Optional icon (emoji or text) */
  icon?: string;
  /** Whether the action is destructive (styled as danger) */
  danger?: boolean;
  /** Function to determine if action is disabled */
  // eslint-disable-next-line no-unused-vars
  disabled?: (row: T) => boolean;
  /** Function to determine if action is hidden */
  // eslint-disable-next-line no-unused-vars
  hidden?: (row: T) => boolean;
  /** Handler function */
  // eslint-disable-next-line no-unused-vars
  handler?: (row: T, rowIndex: number) => void;
}

export interface TableCustomClasses {
  container?: string;
  headerRow?: string;
  headerCell?: string;
  row?: string;
  cell?: string;
}

export interface TableCustomStyles {
  container?: CSSProperties;
  headerRow?: CSSProperties;
  headerCell?: CSSProperties;
  row?: CSSProperties;
  cell?: CSSProperties;
}

// ===================================
// Props
// ===================================

export interface Props<T extends object = Record<string, any>> {
  /** Array of data objects to display */
  data: T[];
  /** Column definitions */
  columns: ColumnDefinition<T>[];
  /** Actions for the actions column */
  actions?: TableAction<T>[];
  /** Custom CSS classes */
  customClasses?: TableCustomClasses;
  /** Custom inline styles */
  customStyles?: TableCustomStyles;
  /** Unique key property for rows */
  rowKey?: keyof T;
  /** Show actions column (auto-detected from actions prop) */
  showActionsColumn?: boolean;
  /** Label for the actions column */
  actionsColumnLabel?: string;
  /** Message when table is empty */
  emptyMessage?: string;
  /** Initial sort column */
  initialSortKey?: keyof T | string | null;
  /** Initial sort direction */
  initialSortDirection?: SortDirection;
  /** Aria label for the table */
  ariaLabel?: string;
  /** Number of rows per page. When undefined or 0, all rows are shown. */
  pageSize?: number;
  /** Callback triggered when a row deletion is confirmed via the trash icon */
  // eslint-disable-next-line no-unused-vars
  deleteAction?: (row: T, rowIndex: number) => void;
  /** Callback triggered when a row is clicked (makes rows clickable with pointer cursor) */
  // eslint-disable-next-line no-unused-vars
  navigateFromLine?: (row: T, rowIndex: number) => void;
  /** Whether to show a search bar above the table */
  searchable?: boolean;
  /** Placeholder text for the search bar */
  searchPlaceholder?: string;
  /** Whether to show an export-to-Excel button */
  exportable?: boolean;
  /** File name for the exported Excel file (without extension) */
  exportFileName?: string;
  /** Whether to show a selection checkbox column on the left */
  selectable?: boolean;
  /** Key of the row property used as the unique identifier for selection (defaults to rowKey) */
  selectionKey?: keyof T;
  /** Whether the table is in a loading state */
  loading?: boolean;
}

const { t } = useI18n();

const props = withDefaults(defineProps<Props<T>>(), {
  actions: () => [],
  customClasses: () => ({}),
  customStyles: () => ({}),
  rowKey: undefined,
  showActionsColumn: undefined,
  actionsColumnLabel: undefined,
  emptyMessage: undefined,
  initialSortKey: null,
  initialSortDirection: null,
  ariaLabel: undefined,
  pageSize: 0,
  deleteAction: undefined,
  navigateFromLine: undefined,
  searchable: false,
  searchPlaceholder: undefined,
  exportable: false,
  exportFileName: undefined,
  selectable: false,
  selectionKey: undefined,
  loading: false,
});

const resolvedActionsColumnLabel = computed(() => props.actionsColumnLabel ?? t('actions'));
const resolvedEmptyMessage = computed(() => props.emptyMessage ?? t('common.noDataAvailable'));
const resolvedAriaLabel = computed(() => props.ariaLabel ?? t('common.dataTable'));
const resolvedSearchPlaceholder = computed(() => props.searchPlaceholder ?? t('Rechercher...'));
const resolvedExportFileName = computed(() => props.exportFileName ?? t('common.tableExport'));

// ===================================
// Emits
// ===================================

const emit = defineEmits<{
  /** Emitted when an action is triggered */
  // eslint-disable-next-line no-unused-vars
  (e: 'action', payload: { action: TableAction<T>; row: T; rowIndex: number }): void;
  /** Emitted when sort changes */
  // eslint-disable-next-line no-unused-vars
  (e: 'sort', payload: { key: keyof T | string; direction: SortDirection }): void;
  /** Emitted when a row is clicked */
  // eslint-disable-next-line no-unused-vars
  (e: 'row-click', payload: { row: T; rowIndex: number }): void;
  /** Emitted when selected rows change */
  // eslint-disable-next-line no-unused-vars
  (e: 'selection-change', payload: { selectedIds: unknown[]; selectedRows: T[] }): void;
}>();

// ===================================
// State
// ===================================

const sortKey = ref<keyof T | string | null>(props.initialSortKey);
const sortDirection = ref<SortDirection>(props.initialSortDirection);
const openPopoverIndex = ref<number | null>(null);
const popoverStyle = ref<CSSProperties>({});
const popoverRef = ref<HTMLDivElement | null>(null);
const currentPage = ref(1);
const searchQuery = ref('');

// Display mode
const displayOptions = [
  { label: '5 lignes', value: 5, scroll: false },
  { label: '8 lignes', value: 8, scroll: false },
  { label: '10 lignes', value: 10, scroll: false },
  { label: '20 lignes', value: 20, scroll: false },
  { label: '50 lignes', value: 50, scroll: false },
  { label: 'Scroll', value: 0, scroll: true },
  { label: 'Sans scroll', value: 0, scroll: false },
];
const internalPageSize = ref(props.pageSize);
const internalScrollEnabled = ref(!props.pageSize || props.pageSize <= 0);
const isDisplayPopoverOpen = ref(false);
const displayPopoverStyle = ref<CSSProperties>({});

/** Column filter state: maps column key -> Set of selected values */
const columnFilters = ref<Record<string, Set<string>>>({});
/** Which column filter popover is currently open (column key or null) */
const openFilterColumn = ref<string | null>(null);
const filterPopoverStyle = ref<CSSProperties>({});
const filterSearchQueries = ref<Record<string, string>>({});

/** Set of selected row identifiers */
const selectedRowIds = ref<Set<unknown>>(new Set());

// ===================================
// Computed
// ===================================

const showActionsColumn = computed(() => {
  if (props.showActionsColumn !== undefined) {
    return props.showActionsColumn;
  }
  return (props.actions && props.actions.length > 0) || !!props.deleteAction;
});

/** True when we have explicit actions array; false means we use the delete-only mode */
const hasCustomActions = computed(() => props.actions && props.actions.length > 0);

/** Index of the row whose delete popover is open */
const deletePopoverIndex = ref<number | null>(null);

const activeDisplayLabel = computed(() => {
  const active = displayOptions.find((opt) => isActiveDisplayOption(opt));
  return active ? active.label : 'Affichage';
});

const isPaginated = computed(() => internalPageSize.value && internalPageSize.value > 0);

const totalPages = computed(() => {
  if (!isPaginated.value) return 1;
  return Math.max(1, Math.ceil(filteredData.value.length / internalPageSize.value!));
});

/** Compute unique display values for each filterable column (based on raw data) */
const columnUniqueValues = computed<Record<string, string[]>>(() => {
  const result: Record<string, string[]> = {};
  for (const column of props.columns) {
    if (!column.filterMenu) continue;
    const key = String(column.key);
    const valuesSet = new Set<string>();
    for (const row of props.data) {
      const value = getCellValue(row, column.key);
      const formatted = column.formatter ? column.formatter(value, row) : String(value ?? '');
      if (formatted) valuesSet.add(formatted);
    }
    result[key] = Array.from(valuesSet).sort((a, b) => a.localeCompare(b));
  }
  return result;
});

/** Unique values filtered by the filter search query */
const filteredUniqueValues = computed<Record<string, string[]>>(() => {
  const result: Record<string, string[]> = {};
  for (const [key, values] of Object.entries(columnUniqueValues.value)) {
    const query = (filterSearchQueries.value[key] ?? '').trim().toLowerCase();
    result[key] = query ? values.filter((v) => v.toLowerCase().includes(query)) : values;
  }
  return result;
});

const filteredData = computed<T[]>(() => {
  let data = props.data;

  // Apply column filters
  const activeFilters = Object.entries(columnFilters.value).filter(
    ([, selected]) => selected.size > 0
  );
  if (activeFilters.length > 0) {
    data = data.filter((row) => {
      return activeFilters.every(([colKey, selected]) => {
        const column = props.columns.find((c) => String(c.key) === colKey);
        if (!column) return true;
        const value = getCellValue(row, column.key);
        const formatted = column.formatter ? column.formatter(value, row) : String(value ?? '');
        return selected.has(formatted);
      });
    });
  }

  // Apply search filter
  if (props.searchable && searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase();
    data = data.filter((row) => {
      // First try matching via column keys and formatters
      const matchesColumn = props.columns.some((column) => {
        const value = getCellValue(row, column.key);
        if (value === null || value === undefined) return false;
        const formatted = column.formatter ? column.formatter(value, row) : String(value);
        return formatted.toLowerCase().includes(query);
      });
      if (matchesColumn) return true;

      // Fallback: search all string/number values in the row (including nested)
      return searchObjectValues(row, query);
    });
  }

  return data;
});

const sortedData = computed<T[]>(() => {
  if (!sortKey.value || !sortDirection.value) {
    return [...filteredData.value];
  }

  const column = props.columns.find((col) => col.key === sortKey.value);
  const comparator = column?.sortComparator;

  return [...filteredData.value].sort((a, b) => {
    if (comparator) {
      const result = comparator(a, b);
      return sortDirection.value === 'desc' ? -result : result;
    }

    const aVal = getCellValue(a, sortKey.value!);
    const bVal = getCellValue(b, sortKey.value!);

    let comparison = 0;

    if (aVal === null || aVal === undefined) comparison = 1;
    else if (bVal === null || bVal === undefined) comparison = -1;
    else if (typeof aVal === 'string' && typeof bVal === 'string') {
      comparison = aVal.localeCompare(bVal);
    } else if (typeof aVal === 'number' && typeof bVal === 'number') {
      comparison = aVal - bVal;
    } else if (aVal instanceof Date && bVal instanceof Date) {
      comparison = aVal.getTime() - bVal.getTime();
    } else {
      comparison = String(aVal).localeCompare(String(bVal));
    }

    return sortDirection.value === 'desc' ? -comparison : comparison;
  });
});

const paginatedData = computed<T[]>(() => {
  if (!isPaginated.value) return sortedData.value;
  const start = (currentPage.value - 1) * internalPageSize.value!;
  return sortedData.value.slice(start, start + internalPageSize.value!);
});

const paginationInfo = computed(() => {
  if (!isPaginated.value) return '';
  const start = (currentPage.value - 1) * internalPageSize.value! + 1;
  const end = Math.min(currentPage.value * internalPageSize.value!, filteredData.value.length);
  return `${start}–${end} / ${filteredData.value.length}`;
});

const visiblePages = computed<(number | 'ellipsis-start' | 'ellipsis-end')[]>(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const maxVisible = 7;

  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [1];

  if (current > 3) {
    pages.push('ellipsis-start');
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push('ellipsis-end');
  }

  pages.push(total);

  return pages;
});

// ===================================
// Methods
// ===================================

function getCellValue(row: T, key: keyof T | string): unknown {
  const keyStr = String(key);
  if (keyStr.includes('.')) {
    return keyStr.split('.').reduce((obj: unknown, k: string) => {
      return obj && typeof obj === 'object' ? (obj as Record<string, unknown>)[k] : undefined;
    }, row);
  }
  return row[key as keyof T];
}

function searchObjectValues(obj: unknown, query: string, depth = 0): boolean {
  if (depth > 3 || obj === null || obj === undefined) return false;
  if (typeof obj === 'string') return obj.toLowerCase().includes(query);
  if (typeof obj === 'number') return String(obj).includes(query);
  if (typeof obj === 'object' && !Array.isArray(obj)) {
    return Object.values(obj as Record<string, unknown>).some((val) =>
      searchObjectValues(val, query, depth + 1)
    );
  }
  if (Array.isArray(obj)) {
    return obj.some((val) => searchObjectValues(val, query, depth + 1));
  }
  return false;
}

function formatCellValue(value: unknown, column: ColumnDefinition<T>, row?: T): string {
  if (column.formatter) {
    return column.formatter(value, row ?? ({} as T));
  }
  if (value === null || value === undefined) {
    return '';
  }
  if (value instanceof Date) {
    return value.toLocaleDateString();
  }
  return String(value);
}

function getRowKey(row: T, index: number): string | number {
  if (props.rowKey && row[props.rowKey] !== undefined) {
    return String(row[props.rowKey]);
  }
  return index;
}

function getColumnStyle(column: ColumnDefinition<T>): CSSProperties {
  const style: CSSProperties = {};
  if (column.width) style.width = column.width;
  if (column.minWidth) style.minWidth = column.minWidth;
  if (column.maxWidth) style.maxWidth = column.maxWidth;
  if (column.align) style.textAlign = column.align;
  return style;
}

function handleSort(key: keyof T | string): void {
  if (sortKey.value === key) {
    // Cycle: asc -> desc -> null
    if (sortDirection.value === 'asc') {
      sortDirection.value = 'desc';
    } else if (sortDirection.value === 'desc') {
      sortDirection.value = null;
      sortKey.value = null;
    } else {
      sortDirection.value = 'asc';
    }
  } else {
    sortKey.value = key;
    sortDirection.value = 'asc';
  }

  emit('sort', { key, direction: sortDirection.value });
}

function getSortClass(key: keyof T | string): string {
  if (sortKey.value !== key) return '';
  if (sortDirection.value === 'asc') return 'sort-asc';
  if (sortDirection.value === 'desc') return 'sort-desc';
  return '';
}

function getAriaSort(key: keyof T | string): 'ascending' | 'descending' | 'none' | undefined {
  if (sortKey.value !== key) return 'none';
  if (sortDirection.value === 'asc') return 'ascending';
  if (sortDirection.value === 'desc') return 'descending';
  return 'none';
}

function togglePopover(rowIndex: number, event: MouseEvent): void {
  if (openPopoverIndex.value === rowIndex) {
    closePopover();
    return;
  }

  openPopoverIndex.value = rowIndex;

  nextTick(() => {
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const popoverHeight = 200; // Estimated height
    const popoverWidth = 160; // Estimated width

    let top = rect.bottom + 4;
    let left = rect.left;

    // Adjust if popover would go off-screen bottom
    if (top + popoverHeight > viewportHeight) {
      top = rect.top - popoverHeight - 4;
    }

    // Adjust if popover would go off-screen right
    if (left + popoverWidth > viewportWidth) {
      left = rect.right - popoverWidth;
    }

    popoverStyle.value = {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 9999,
    };
  });
}

function closePopover(): void {
  openPopoverIndex.value = null;
}

function handleClickOutside(event: MouseEvent): void {
  const target = event.target as HTMLElement;

  // Close actions popover
  if (openPopoverIndex.value !== null) {
    const isActionButton = target.closest('.actions-button');
    const isPopover = target.closest('.actions-popover');
    if (!isActionButton && !isPopover) {
      closePopover();
    }
  }

  // Close filter popover
  if (openFilterColumn.value !== null) {
    const isFilterButton = target.closest('.filter-button');
    const isFilterPopover = target.closest('.filter-popover');
    if (!isFilterButton && !isFilterPopover) {
      closeFilterPopover();
    }
  }

  // Close display popover
  if (isDisplayPopoverOpen.value) {
    const isDisplayButton = target.closest('.em-table-display-button');
    const isDisplayPopover = target.closest('.display-popover');
    if (!isDisplayButton && !isDisplayPopover) {
      isDisplayPopoverOpen.value = false;
    }
  }
}

function handleEscapeKey(event: KeyboardEvent): void {
  if (event.key === 'Escape' && openFilterColumn.value !== null) {
    closeFilterPopover();
  }
  if (event.key === 'Escape' && openPopoverIndex.value !== null) {
    closePopover();
  }
  if (event.key === 'Escape' && isDisplayPopoverOpen.value) {
    isDisplayPopoverOpen.value = false;
  }
}

function isActionDisabled(action: TableAction<T>, row: T): boolean {
  return action.disabled ? action.disabled(row) : false;
}

function handleAction(action: TableAction<T>, row: T, rowIndex: number): void {
  closePopover();

  if (action.handler) {
    action.handler(row, rowIndex);
  }

  emit('action', { action, row, rowIndex });
}

function goToPage(page: number): void {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    closePopover();
  }
}

function prevPage(): void {
  goToPage(currentPage.value - 1);
}

function nextPage(): void {
  goToPage(currentPage.value + 1);
}

function handleRowClick(row: T, rowIndex: number): void {
  if (props.navigateFromLine) {
    props.navigateFromLine(row, rowIndex);
  }
  emit('row-click', { row, rowIndex });
}

function confirmDelete(row: T, rowIndex: number): void {
  if (props.deleteAction) {
    props.deleteAction(row, rowIndex);
  }
  deletePopoverIndex.value = null;
}

// ===================================
// Column Filter Methods
// ===================================

function toggleFilterPopover(columnKey: string, event: MouseEvent | KeyboardEvent): void {
  event.stopPropagation();
  if (openFilterColumn.value === columnKey) {
    closeFilterPopover();
    return;
  }

  openFilterColumn.value = columnKey;

  nextTick(() => {
    const button = event.currentTarget as HTMLElement;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const popoverHeight = 300;
    const popoverWidth = 220;

    let top = rect.bottom + 4;
    let left = rect.left;

    if (top + popoverHeight > viewportHeight) {
      top = rect.top - popoverHeight - 4;
    }
    if (left + popoverWidth > viewportWidth) {
      left = rect.right - popoverWidth;
    }

    filterPopoverStyle.value = {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 9999,
    };
  });
}

function closeFilterPopover(): void {
  openFilterColumn.value = null;
}

function toggleFilterValue(columnKey: string, value: string): void {
  if (!columnFilters.value[columnKey]) {
    columnFilters.value[columnKey] = new Set();
  }
  const filterSet = columnFilters.value[columnKey];
  if (filterSet.has(value)) {
    filterSet.delete(value);
  } else {
    filterSet.add(value);
  }
  // Trigger reactivity
  columnFilters.value = { ...columnFilters.value };
}

function isFilterValueSelected(columnKey: string, value: string): boolean {
  return columnFilters.value[columnKey]?.has(value) ?? false;
}

function selectAllFilterValues(columnKey: string): void {
  const values = filteredUniqueValues.value[columnKey] ?? [];
  columnFilters.value[columnKey] = new Set(values);
  columnFilters.value = { ...columnFilters.value };
}

function clearAllFilterValues(columnKey: string): void {
  columnFilters.value[columnKey] = new Set();
  columnFilters.value = { ...columnFilters.value };
}

function getActiveFilterCount(columnKey: string): number {
  return columnFilters.value[columnKey]?.size ?? 0;
}

// ===================================
// Selection Methods
// ===================================

function getSelectionId(row: T): unknown {
  const key = props.selectionKey ?? props.rowKey;
  if (key) {
    return row[key];
  }
  // Fallback: use the index in the original data array
  return props.data.indexOf(row);
}

/** Whether all rows on the current page are selected */
const isAllSelected = computed(() => {
  if (paginatedData.value.length === 0) return false;
  return paginatedData.value.every((row) => selectedRowIds.value.has(getSelectionId(row)));
});

/** Whether some but not all rows on the current page are selected */
const isIndeterminate = computed(() => {
  if (paginatedData.value.length === 0) return false;
  const someSelected = paginatedData.value.some((row) =>
    selectedRowIds.value.has(getSelectionId(row))
  );
  return someSelected && !isAllSelected.value;
});

function isRowSelected(row: T): boolean {
  return selectedRowIds.value.has(getSelectionId(row));
}

function toggleRowSelection(row: T): void {
  const id = getSelectionId(row);
  const newSet = new Set(selectedRowIds.value);
  if (newSet.has(id)) {
    newSet.delete(id);
  } else {
    newSet.add(id);
  }
  selectedRowIds.value = newSet;
  emitSelectionChange();
}

function toggleSelectAll(): void {
  const newSet = new Set(selectedRowIds.value);
  if (isAllSelected.value) {
    // Deselect all rows on the current page
    for (const row of paginatedData.value) {
      newSet.delete(getSelectionId(row));
    }
  } else {
    // Select all rows on the current page
    for (const row of paginatedData.value) {
      newSet.add(getSelectionId(row));
    }
  }
  selectedRowIds.value = newSet;
  emitSelectionChange();
}

function emitSelectionChange(): void {
  const selectedIds = Array.from(selectedRowIds.value);
  const selectedRows = props.data.filter((row) => selectedRowIds.value.has(getSelectionId(row)));
  emit('selection-change', { selectedIds, selectedRows });
}

async function exportToExcel(): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data');

  // Define columns with headers and auto-width
  worksheet.columns = props.columns.map((col) => ({
    header: col.label,
    key: String(col.key),
    width: Math.min(col.label.length + 4, 50),
  }));

  // Add data rows
  for (const row of sortedData.value) {
    const rowData: Record<string, unknown> = {};
    for (const col of props.columns) {
      const value = getCellValue(row, col.key);
      rowData[String(col.key)] = col.formatter ? col.formatter(value, row) : (value ?? '');
    }
    worksheet.addRow(rowData);
  }

  // Style header row
  worksheet.getRow(1).font = { bold: true };

  // Auto-size columns based on content
  worksheet.columns.forEach((column) => {
    let maxLength = column.header?.length ?? 10;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const cellLength = String(cell.value ?? '').length;
      if (cellLength > maxLength) maxLength = cellLength;
    });
    column.width = Math.min(maxLength + 2, 50);
  });

  // Generate and download file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${resolvedExportFileName.value}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

// ===================================
// Display Mode Methods
// ===================================

function isActiveDisplayOption(option: { value: number; scroll: boolean }): boolean {
  if (option.value > 0) {
    return internalPageSize.value === option.value;
  }
  return internalPageSize.value === 0 && internalScrollEnabled.value === option.scroll;
}

function toggleDisplayPopover(event: MouseEvent): void {
  if (isDisplayPopoverOpen.value) {
    isDisplayPopoverOpen.value = false;
    return;
  }
  isDisplayPopoverOpen.value = true;
  nextTick(() => {
    const button = event.currentTarget as HTMLElement;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const popoverWidth = 160;

    let left = rect.left;
    if (left + popoverWidth > viewportWidth) {
      left = rect.right - popoverWidth;
    }

    displayPopoverStyle.value = {
      position: 'fixed',
      top: `${rect.bottom + 4}px`,
      left: `${left}px`,
      zIndex: 9999,
    };
  });
}

function selectDisplayOption(option: { value: number; scroll: boolean }): void {
  internalPageSize.value = option.value;
  internalScrollEnabled.value = option.scroll;
  currentPage.value = 1;
  isDisplayPopoverOpen.value = false;
}

// ===================================
// Lifecycle
// ===================================

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleEscapeKey);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleEscapeKey);
});

// Watch for data changes to reset popover and pagination
watch(
  () => props.data,
  () => {
    closePopover();
    if (currentPage.value > totalPages.value) {
      currentPage.value = Math.max(1, totalPages.value);
    }
  }
);

watch(
  () => props.pageSize,
  (newVal) => {
    internalPageSize.value = newVal;
    internalScrollEnabled.value = !newVal || newVal <= 0;
    currentPage.value = 1;
  }
);

watch(searchQuery, () => {
  currentPage.value = 1;
});

watch(
  columnFilters,
  () => {
    currentPage.value = 1;
  },
  { deep: true }
);

// When data changes, clean up stale selections
watch(
  () => props.data,
  () => {
    if (props.selectable) {
      const currentDataIds = new Set(props.data.map((row) => getSelectionId(row)));
      const newSet = new Set(
        Array.from(selectedRowIds.value).filter((id) => currentDataIds.has(id))
      );
      if (newSet.size !== selectedRowIds.value.size) {
        selectedRowIds.value = newSet;
        emitSelectionChange();
      }
    }
  }
);

// Expose selection utilities for parent components
defineExpose({
  /** Get currently selected row IDs */
  getSelectedIds: () => Array.from(selectedRowIds.value),
  /** Get currently selected rows */
  getSelectedRows: () => props.data.filter((row) => selectedRowIds.value.has(getSelectionId(row))),
  /** Clear all selections */
  clearSelection: () => {
    selectedRowIds.value = new Set();
    emitSelectionChange();
  },
});
</script>

<style scoped>
/* ===================================
 * CSS Variables for Customization
 * =================================== */
.em-table-container {
  --table-border-color: var(--ion-card-border-color, #e9ecef);
  --table-border-radius: var(--ion-radius-2xl);
  --table-background: var(--ion-card-background);
  /* --table-shadow: 0 2px 8px rgba(var(--ion-background-shadow-rgb, 0, 0, 0, 0.1)); */

  --header-bg: var(--ion-background-color-secondary, #f8f9fa);
  --header-text-color: var(--ion-text-color-primary, #091667);
  --header-font-weight: 600;
  --header-font-size: 0.875rem;
  --header-padding: 12px 16px;

  --cell-padding: 12px 16px;
  --cell-text-color: var(--ion-text-color, #1e1e1e);
  --cell-font-size: 0.875rem;

  --row-hover-bg: var(--ion-background-color-primary, #f2f2f2);
  --row-even-bg: transparent;
  --row-odd-bg: var(--ion-background-color-secondary, #f8f9fa);
  --row-border-color: var(--ion-card-border-color, #e9ecef);

  --sort-indicator-color: var(--ion-text-color-tertiary, #adb5bd);
  --sort-indicator-active-color: var(--ion-color-primary, #1c398e);

  --actions-button-size: 32px;
  --actions-button-hover-bg: var(--ion-background-color-primary, #f2f2f2);

  --popover-bg: var(--ion-card-background, #ffffff);
  --popover-border-color: var(--ion-card-border-color, #e9ecef);
  /* --popover-shadow: 0 4px 16px rgba(0, 0, 0, 0.12); */
  --popover-border-radius: 8px;

  --action-item-padding: 10px 16px;
  --action-item-hover-bg: var(--ion-background-color-primary, #f2f2f2);
  --action-danger-color: var(--ion-color-secondary, #9c222b);
  --action-disabled-opacity: 0.5;

  --empty-text-color: var(--ion-text-color-secondary, #6c757d);
  --empty-padding: 32px;
}

/* ===================================
 * Loading
 * =================================== */
.em-table-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 48px 0;
}

/* ===================================
 * Container
 * =================================== */
.em-table-container {
  width: 100%;
  overflow-x: auto;
  background: var(--table-background);

  /* border: 1px solid var(--table-border-color); */
  /* border-radius: var(--table-border-radius); */
  /* box-shadow: var(--table-shadow); */
}

/* ===================================
 * Toolbar (Search + Export)
 * =================================== */
.em-table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.em-table-toolbar .em-table-search {
  flex: 1;
}

/* ===================================
 * Export Button
 * =================================== */
.em-table-export-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid var(--ion-input-border-color);
  border-radius: 9999px;
  background: var(--table-background);
  color: var(--text-color);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.em-table-export-button:hover {
  border-color: var(--ion-input-border-color-hover);
}

.em-table-export-button:focus {
  outline: 2px solid var(--ion-input-border-color-focus);
  outline-offset: 2px;
}

.em-table-export-button:active {
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* ===================================
 * Display Settings Button & Options
 * =================================== */
.em-table-display-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid var(--ion-input-border-color);
  border-radius: 9999px;
  background: var(--table-background);
  color: var(--cell-text-color);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.em-table-display-button:hover {
  border-color: var(--ion-input-border-color-hover);
}

.display-popover {
  background: var(--popover-bg);
  border: 1px solid var(--popover-border-color);
  border-radius: var(--popover-border-radius);
  box-shadow: var(--popover-shadow);
  padding: 8px;
}

.display-options {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 140px;
  background-color: var(--ion-background-color);
  padding: 4px;
  border-radius: var(--ion-radius-lg);
  border: 1px solid var(--ion-input-border-color);
}

.display-option {
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.8125rem;
  color: var(--cell-text-color);
  cursor: pointer;
  transition: background-color 0.15s ease;
  white-space: nowrap;
}

.display-option:hover {
  background: var(--ion-input-background-hover-secondary, var(--row-hover-bg));
}

.display-option-active {
  background: color-mix(in srgb, var(--sort-indicator-active-color, #1c398e) 12%, transparent);
  color: var(--sort-indicator-active-color, #1c398e);
  font-weight: 600;
}

.display-option-active:hover {
  background: color-mix(in srgb, var(--sort-indicator-active-color, #1c398e) 18%, transparent);
}

/* ===================================
 * Table Base
 * =================================== */
.em-table-scroll-wrapper {
  width: 100%;
  overflow-x: auto;
  border-radius: var(--ion-radius-lg);
  border: 1px solid var(--ion-input-border-color);
}

.em-table-scroll-wrapper.scrollable {
  max-height: calc(100vh - 432px);
  margin-bottom: 20px;
  overflow-y: auto;
}

.em-table {
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  table-layout: auto;
}

/* ===================================
 * Header Styles
 * =================================== */
.em-table-header-cell {
  background: var(--header-bg);
  color: #000;
  font-weight: var(--header-font-weight);
  font-size: var(--header-font-size);
  padding: var(--header-padding);
  text-align: left;
  white-space: nowrap;
  border-bottom: 2px solid var(--table-border-color);
  z-index: 2;
  user-select: none;
}

.em-table-scroll-wrapper.scrollable .em-table-header-cell {
  position: sticky;
  top: 0;
}

.em-table-header-cell.sortable {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.em-table-header-cell.sortable:hover {
  background: var(--row-hover-bg);
}

.em-table-header-cell.sortable:focus {
  outline: 2px solid var(--sort-indicator-active-color);
  outline-offset: -2px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ===================================
 * Sort Indicator
 * =================================== */
.sort-indicator {
  display: inline-flex;
  flex-direction: column;
  font-size: 0.5rem;
  line-height: 1;
  color: var(--sort-indicator-color);
}

.sort-arrow {
  opacity: 0.4;
  transition:
    opacity 0.2s ease,
    color 0.2s ease;
}

.sort-asc .sort-arrow-up {
  opacity: 1;
  color: var(--sort-indicator-active-color);
}

.sort-desc .sort-arrow-down {
  opacity: 1;
  color: var(--sort-indicator-active-color);
}

/* ===================================
 * Row Styles
 * =================================== */
.em-table-row {
  transition: background-color 0.2s ease;
}

.em-table-row.row-even {
  background: var(--row-even-bg);
}

.em-table-row.row-odd {
  background: var(--row-odd-bg);
}

.em-table-row:hover {
  background: var(--row-hover-bg);
}

.em-table-row.row-clickable {
  cursor: pointer;
}

/* ===================================
 * Cell Styles
 * =================================== */
.em-table-cell {
  padding: var(--cell-padding);
  color: var(--cell-text-color);
  font-size: var(--cell-font-size);
  border-bottom: 1px solid var(--row-border-color);
  vertical-align: middle;
}

/* ===================================
 * Actions Column
 * =================================== */
.actions-header {
  width: 60px;
  text-align: center;
}

.actions-cell {
  text-align: center;
}

.actions-wrapper {
  position: relative;
  display: inline-flex;
  justify-content: center;
}

.actions-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--actions-button-size);
  height: var(--actions-button-size);
  padding: 0;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.2s ease;
  color: var(--cell-text-color);
}

.actions-button:hover {
  background: var(--actions-button-hover-bg);
}

.actions-button:focus {
  outline: 2px solid var(--sort-indicator-active-color);
  outline-offset: 2px;
}

.actions-icon {
  font-size: 1.25rem;
  font-weight: bold;
  line-height: 1;
}

/* ===================================
 * Popover Menu
 * =================================== */
.actions-popover {
  min-width: 140px;
  background: var(--ion-input-background);
  border: 1px solid var(--ion-input-border-color);
  border-radius: var(--ion-radius-lg);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.actions-menu-item {
  padding: 20px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 0.875rem;
  color: var(--ion-text-color);
}

.actions-menu-item:hover {
  background: var(--ion-input-background-hover-secondary);
  border-radius: var(--ion-radius-lg);
}

.actions-menu-item.action-disabled {
  opacity: var(--action-disabled-opacity);
  cursor: not-allowed;
  pointer-events: none;
}

.action-label {
  font-size: 0.875rem;
}

/* ===================================
 * Empty State
 * =================================== */
.em-table-empty {
  text-align: center;
  padding: var(--empty-padding);
  color: var(--empty-text-color);
  font-style: italic;
}

/* ===================================
 * Transitions
 * =================================== */
.popover-fade-enter-active,
.popover-fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.popover-fade-enter-from,
.popover-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ===================================
 * Pagination
 * =================================== */
.em-table-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-top: 1px solid var(--table-border-color);
  font-size: 0.875rem;
  color: var(--cell-text-color);
}

.pagination-info {
  color: var(--empty-text-color);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  overflow-x: auto;
}

.pagination-ellipsis {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  font-size: 0.875rem;
  color: var(--empty-text-color);
  user-select: none;
}

.pagination-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid var(--table-border-color);
  border-radius: 6px;
  background: var(--table-background);
  color: var(--cell-text-color);
  font-size: 0.875rem;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.pagination-button:hover:not(:disabled):not(.active) {
  background: var(--row-hover-bg);
}

.pagination-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-button.active {
  background: var(--sort-indicator-active-color);
  border-color: var(--sort-indicator-active-color);
  color: #ffffff;
  font-weight: 600;
}

/* ===================================
 * Delete Confirmation
 * =================================== */
.delete-button:hover {
  background: rgba(156, 34, 43, 0.08);
}

.delete-confirm-text {
  margin: 0;
  font-size: 0.875rem;
  color: var(--cell-text-color);
  white-space: nowrap;
}

/* ===================================
 * Column Filter
 * =================================== */
.filter-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: var(--sort-indicator-color);
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
  flex-shrink: 0;
}

.filter-button:hover {
  background: var(--actions-button-hover-bg);
  color: var(--sort-indicator-active-color);
}

.filter-button.filter-active {
  color: var(--sort-indicator-active-color);
}

.filter-badge {
  position: absolute;
  top: -4px;
  right: -6px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--sort-indicator-active-color);
  color: #ffffff;
  font-size: 0.625rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.filter-popover {
  min-width: 220px;
  max-width: 280px;
  background: var(--ion-input-background, var(--popover-bg));
  border: 1px solid var(--ion-input-border-color, var(--popover-border-color));
  border-radius: var(--ion-radius-lg, var(--popover-border-radius));
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  max-height: 360px;
}

.filter-popover-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 8px;
  border-bottom: 4px solid var(--table-border-color, #2266aa);
}

.filter-popover-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--header-text-color, #091667);
}

.filter-popover-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: var(--empty-text-color, #6c757d);
  font-size: 0.75rem;
  transition: background-color 0.2s ease;
}

.filter-popover-close:hover {
  background: var(--actions-button-hover-bg, #f2f2f2);
}

.filter-search {
  padding: 8px 12px;
}

.filter-search-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--ion-input-border-color, var(--table-border-color, #e9ecef));
  border-radius: 6px;
  font-size: 0.8125rem;
  background: var(--table-background, #ffffff);
  color: var(--cell-text-color, #1e1e1e);
  outline: none;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.filter-search-input:focus {
  border-color: var(--sort-indicator-active-color, #1c398e);
}

.filter-actions {
  display: flex;
  gap: 8px;
  padding: 4px 12px 8px;
}

.filter-action-btn {
  padding: 4px 8px;
  border: none;
  background: transparent;
  color: var(--sort-indicator-active-color, #1c398e);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.filter-action-btn:hover {
  background: var(--actions-button-hover-bg, #f2f2f2);
}

.filter-options {
  overflow-y: auto;
  max-height: 220px;
  padding: 0 8px 8px;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.15s ease;
  font-size: 0.8125rem;
  color: var(--cell-text-color, #1e1e1e);
}

.filter-option:hover {
  background: var(--ion-input-background-hover-secondary, var(--actions-button-hover-bg, #f2f2f2));
}

.filter-checkbox {
  width: 16px;
  height: 16px;
  margin: 0;
  cursor: pointer;
  accent-color: var(--sort-indicator-active-color, #1c398e);
  flex-shrink: 0;
}

.filter-option-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-empty {
  padding: 12px 8px;
  text-align: center;
  color: var(--empty-text-color, #6c757d);
  font-size: 0.8125rem;
  font-style: italic;
}

/* ===================================
 * Selection Checkbox Column
 * =================================== */
.selection-header,
.selection-cell {
  width: 48px;
  min-width: 48px;
  max-width: 48px;
  text-align: center;
  padding: 8px 12px;
}

.selection-checkbox {
  width: 18px;
  height: 18px;
  margin: 0;
  cursor: pointer;
  accent-color: var(--sort-indicator-active-color, #1c398e);
  vertical-align: middle;
}

.em-table-row.row-selected {
  background: color-mix(in srgb, var(--sort-indicator-active-color, #1c398e) 8%, transparent);
}

.em-table-row.row-selected:hover {
  background: color-mix(in srgb, var(--sort-indicator-active-color, #1c398e) 14%, transparent);
}

/* ===================================
 * Responsive Adjustments
 * =================================== */
@media (max-width: 768px) {
  .em-table-container {
    --header-padding: 10px 12px;
    --cell-padding: 10px 12px;
    --header-font-size: 0.8125rem;
    --cell-font-size: 0.8125rem;
  }
}
</style>
