<template>
  <ElOptionGroup
    class="sb-select-option-group"
    v-bind="$attrs"
  >
    <template v-for="(_, slot) of $slots" #[slot]="scope">
      <slot :name="slot" v-bind="scope" />
    </template>
  </ElOptionGroup>
</template>

<script setup lang="ts">
import { ElOptionGroup } from "element-plus";
</script>

<style scoped lang="scss">
.sb-select-option-group {
  :deep(.el-select-group__title) {
    &:not(:empty) {
      margin-top: calc(var(--sb-gap-y) / 2);
      padding: 0 var(--sb-gap-x);
    }
  }

  :deep(.el-select-dropdown__item) {
    padding: 0 calc(var(--sb-gap-x) - var(--sb-select-option-margin));
  }

  &:not(:last-of-type)::after {
    left: var(--sb-gap-x);
    right: var(--sb-gap-x);
  }
}
</style>
