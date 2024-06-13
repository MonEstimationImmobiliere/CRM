<template>
  <div
    class="sb-table-wrapper"
    :class="{
      'is-sticky': props.sticky,
      'has-filters': !!$slots.filters
    }"
  >
    <div class="sb-table-filters">
      <slot name="filters" />
    </div>

    <ElTable
      ref="tableRef"
      v-loading="props.loading"
      element-loading-custom-class="sb-table-loading"
      class="sb-table"
      stripe
      v-bind="$attrs"
      :class="{
        'is-clickable': !!$attrs.onRowClick
      }"
    >
      <template v-for="(_, slot) of $slots" #[slot]="scope">
        <slot :name="slot" v-bind="scope" />
      </template>
    </ElTable>

    <div v-if="props.loadMore" class="sb-table-load-wrapper">
      <SbLink :loading="props.loading" @click="handleLoadMoreClick">
        {{ t("common.loadNextPage") }}
      </SbLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElTable } from "element-plus";
import { shallowRef } from "vue";
import { i18n } from "@/locales";

import SbLink from "../SbLink/SbLink.vue";

const props = withDefaults(
  defineProps<{
    sticky?: boolean;
    loadMore?: boolean;
    loading?: boolean;
  }>(),
  {
    sticky: false,
    loadMore: false,
    loading: false
  }
);

const emit = defineEmits<{
  (e: "loadMore"): void;
}>();

const t = i18n.global.t;

const tableRef = shallowRef<InstanceType<typeof ElTable>>();

const handleLoadMoreClick = (): void => {
  emit("loadMore");
};

defineExpose({
  tableRef
});
</script>

<style lang="scss" scoped>
.sb-table-wrapper {
  --sb-table-header-sticky-offset: 0px;
  --sb-table-filters-padding-top: 0px;
  --sb-table-filters-padding-bottom: 0px;

  .sb-table-filters {
    background-color: var(--el-bg-color-page);
    display: flex;
    gap: calc(var(--sb-gap-y) / 2) calc(var(--sb-gap-x) / 2);
    padding-bottom: var(--sb-table-filters-padding-bottom);
    padding-top: var(--sb-table-filters-padding-top);
  }

  .sb-table {
    border-radius: var(--el-border-radius-base);

    &.is-clickable {
      :deep(tbody) .el-table__row {
        cursor: pointer;

        .el-table__cell {
          --el-table-row-hover-bg-color: var(--el-color-primary-light-9);
        }
      }

    }

    :deep(.el-table__header-wrapper) thead th,
    :deep(.el-table__body) tbody td {
      height: var(--el-component-size);
    }

    &.el-table--small {
      :deep(.el-table__header-wrapper) thead th,
      :deep(.el-table__body) tbody td {
        height: var(--el-component-size-small);
      }
    }

    &.el-table--large {
      :deep(.el-table__header-wrapper) thead th,
      :deep(.el-table__body) tbody td {
        height: var(--el-component-size-large);
      }
    }

    :deep(thead.is-group) th.el-table__cell {
      background: var(--el-table-header-bg-color);
    }

    :deep(.sb-table-loading) {
      .el-loading-spinner {
        position: sticky;
      }
    }
  }

  .sb-table-load-wrapper {
    align-items: center;
    display: flex;
    height: 50px;
    justify-content: center;
  }

  &.is-sticky {
    .sb-table-filters {
      position: sticky;
      top: var(--sb-table-header-sticky-offset);
      z-index: 1998;
    }

    .sb-table {
      --sb-table-header-wrapper-top: calc(var(--sb-table-filters-padding-top) + var(--sb-table-filters-padding-bottom) + var(--el-component-size) + var(--sb-table-header-sticky-offset));

      overflow: initial;

      :deep(.el-table__header-wrapper) {
        border-radius: var(--el-border-radius-base) var(--el-border-radius-base) 0 0;
        position: sticky;
        top: var(--sb-table-header-wrapper-top);
        z-index: 1997;
      }
    }

    &:not(.has-filters) {
      --sb-table-filters-padding-bottom: 0px;
      --sb-table-filters-padding-top: var(--sb-gap-y);
      --el-component-size: 0px;
    }
  }

  &.has-filters {
    --sb-table-filters-padding-bottom: var(--sb-gap-y);
    --sb-table-filters-padding-top: var(--sb-gap-y);
  }

}
</style>