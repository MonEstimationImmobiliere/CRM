<template>
  <div class="data-table">
    <div class="table-header">
      <h3>{{ title }}</h3>
      <p v-if="countLabel && items.length > 0">{{ items.length }} {{ countLabel }}</p>
    </div>

    <div v-if="items.length === 0" class="no-items">
      <p>{{ emptyMessage }}</p>
    </div>

    <div v-else class="table-wrapper">
      <table class="data-table-content">
        <thead>
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              :class="{ sortable: column.sortable !== false, active: sortKey === column.key }"
              @click="column.sortable !== false ? toggleSort(column.key) : undefined"
            >
              <span class="th-content">
                {{ column.label }}
                <span v-if="column.sortable !== false" class="sort-indicator">
                  <span v-if="sortKey === column.key && sortOrder === 'asc'">&#9650;</span>
                  <span v-else-if="sortKey === column.key && sortOrder === 'desc'">&#9660;</span>
                  <span v-else class="sort-inactive">&#9650;</span>
                </span>
              </span>
            </th>
            <th v-if="!readOnly">{{ actionsLabel }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in sortedItems" :key="getItemKey(item, index)" class="table-row">
            <!-- Dynamic columns via slot -->
            <slot name="row" :item="item" :index="index"></slot>

            <!-- Actions -->
            <td v-if="!readOnly" class="actions-cell">
              <div class="action-buttons">
                <el-button
                  link
                  type="primary"
                  size="small"
                  @click="handleEdit(item, index)"
                  :disabled="readOnly"
                >
                  <el-icon><Edit /></el-icon>
                </el-button>

                <el-button
                  link
                  type="danger"
                  size="small"
                  @click="handleDelete(index)"
                  :disabled="readOnly"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Delete Confirmation -->
    <el-dialog
      v-if="showDeleteConfirmation"
      v-model="showDeleteAlert"
      :title="deleteConfirmTitle"
      width="400px"
    >
      <p>{{ deleteConfirmMessage }}</p>
      <template #footer>
        <el-button @click="closeDeleteAlert">{{ t('cancel') }}</el-button>
        <el-button type="danger" @click="confirmDelete">{{ t('delete') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Delete, Edit } from '@element-plus/icons-vue';

export interface Column {
  key: string;
  label: string;
  sortable?: boolean;
}

export interface Props<T = any> {
  items: T[];
  columns: Column[];
  title?: string;
  countLabel?: string;
  emptyIcon: string;
  emptyMessage: string;
  actionsLabel?: string;
  readOnly?: boolean;
  showDeleteConfirmation?: boolean;
  deleteConfirmTitle?: string;
  deleteConfirmMessage?: string;
}

const props = withDefaults(defineProps<Props<T>>(), {
  readOnly: false,
  actionsLabel: 'Actions',
  showDeleteConfirmation: false,
  deleteConfirmTitle: 'Confirm Delete',
  deleteConfirmMessage: 'Are you sure you want to delete this item?',
});

const emit = defineEmits<{
  edit: [item: T, index: number];
  delete: [index: number];
}>();

// Composables
const { t } = useI18n();

// State
const showDeleteAlert = ref(false);
const deleteIndex = ref<number | null>(null);
const sortKey = ref<string | null>(null);
const sortOrder = ref<'asc' | 'desc'>('asc');

// Computed
const sortedItems = computed(() => {
  if (!sortKey.value) return props.items;

  return [...props.items].sort((a, b) => {
    const key = sortKey.value!;
    const valA = a[key];
    const valB = b[key];

    if (valA == null && valB == null) return 0;
    if (valA == null) return sortOrder.value === 'asc' ? -1 : 1;
    if (valB == null) return sortOrder.value === 'asc' ? 1 : -1;

    const strA = String(valA).toLowerCase();
    const strB = String(valB).toLowerCase();

    const comparison = strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' });
    return sortOrder.value === 'asc' ? comparison : -comparison;
  });
});

// Methods
const toggleSort = (key: string) => {
  if (sortKey.value === key) {
    if (sortOrder.value === 'asc') {
      sortOrder.value = 'desc';
    } else {
      // Third click: reset sort
      sortKey.value = null;
      sortOrder.value = 'asc';
    }
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
};

const getItemKey = (item: T, index: number): string | number => {
  if (item && typeof item === 'object' && 'id' in item) {
    return (item.id as string | number) || index;
  }
  return index;
};

const handleEdit = (item: T, index: number) => {
  if (!props.readOnly) {
    emit('edit', item, index);
  }
};

const handleDelete = (index: number) => {
  if (!props.readOnly) {
    if (props.showDeleteConfirmation) {
      deleteIndex.value = index;
      showDeleteAlert.value = true;
    } else {
      emit('delete', index);
    }
  }
};

const closeDeleteAlert = () => {
  showDeleteAlert.value = false;
  deleteIndex.value = null;
};

const confirmDelete = () => {
  if (deleteIndex.value !== null) {
    emit('delete', deleteIndex.value);
  }
  closeDeleteAlert();
};
</script>

<style scoped>
.data-table {
  width: 100%;
}

.table-header {
  margin-bottom: 16px;
  text-align: center;
}

.table-header h3 {
  margin: 0 0 8px 0;
  color: var(--ion-color-primary);
  font-size: 1.2em;
  font-weight: 600;
}

.table-header p {
  margin: 0;
  color: var(--ion-background-color);
  font-size: 0.9em;
}

.no-items {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--ion-background-color);
}

.no-items p {
  margin: 0;
  font-size: 1.1em;
}

.table-wrapper {
  background: var(--ion-background-color);
  overflow-x: auto;
  border-radius: 8px;
  box-shadow: var(--ion-box-shadow);
}

.data-table-content {
  width: 100%;
  border-collapse: collapse;
  background: var(--ion-background-color);
}

.data-table-content thead {
  background: var(--ion-background-color-fourth);
  color: var(--ion-text-color);
}

.data-table-content th {
  padding: 16px 12px;
  text-align: left;
  font-weight: 600;
  color: var(--ion-text-color);
  font-size: 0.9em;
  white-space: nowrap;
}

.data-table-content th.sortable {
  cursor: pointer;
  user-select: none;
}

.data-table-content th.sortable:hover {
  background: hsl(from var(--ion-color-primary) h s l / 0.3);
}

.data-table-content th.active {
  background: hsl(from var(--ion-color-primary) h s l / 0.35);
}

.th-content {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.sort-indicator {
  font-size: 0.7em;
  line-height: 1;
}

.sort-inactive {
  opacity: 0.3;
}

.data-table-content td {
  padding: 16px 12px;
  vertical-align: top;
}

.table-row:hover {
  background: var(--ion-background-color-primary);
}

.actions-cell {
  min-width: 100px;
}

.action-buttons {
  display: flex;
  gap: 4px;
  justify-content: center;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .table-wrapper {
    border: none;
    border-radius: 0;
  }

  .data-table-content {
    font-size: 0.85em;
  }

  .data-table-content th,
  .data-table-content td {
    padding: 12px 8px;
  }
}
</style>
