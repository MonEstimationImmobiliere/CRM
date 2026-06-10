<!-- eslint-disable prettier/prettier -->
<template>
  <EMCard
    :title="title ?? ''"
    :border="true"
    :border-hover="false"
    :no-shadow="true"
    :titleUppercase="false"
    class="dashboard-card"
  >
    <EMTable
      :data="data"
      :columns="columns"
      :actions="actions"
      :page-size="$props.pageSize"
      :deleteAction="deleteAction"
      :navigateFromLine="navigateFromLine"
      :searchable="props.searchable"
      :search-placeholder="t('Rechercher...')"
      :exportable="props.exportable"
      :exportFileName="props.exportFileName"
      :selectable="props.selectable"
      :selectionKey="props.selectionKey as any"
      :emptyMessage="props.emptyMessage"
      :loading="props.loading"
      @selection-change="(payload: any) => emit('selection-change', payload)"
    >
      <template v-for="(_, slotName) in $slots" #[slotName]="slotProps">
        <slot :name="slotName" v-bind="slotProps" />
      </template>
    </EMTable>
  </EMCard>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import EMTable from './EMTable.vue';
import type { ColumnDefinition, TableAction } from './types';
import EMCard from '../card/EMCard.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  title?: string;
  subtitle?: string;
  data: T[];
  columns: ColumnDefinition<T>[];
  actions?: TableAction<T>[];
  searchable?: boolean;
  exportable?: boolean;
  exportFileName?: string;
  // eslint-disable-next-line no-unused-vars
  deleteAction?: (row: T, rowIndex: number) => void;
  // eslint-disable-next-line no-unused-vars
  navigateFromLine?: (row: T, rowIndex: number) => void;
  selectable?: boolean;
  selectionKey?: keyof T;
  pageSize?: number;
  emptyMessage?: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  // eslint-disable-next-line no-unused-vars, prettier/prettier
  (e: 'selection-change', payload: { selectedIds: unknown[]; selectedRows: T[] }): void;
}>();
</script>

<style scoped>
.dashboard-card {
  padding: 20px 20px 20px 20px;
}
</style>
