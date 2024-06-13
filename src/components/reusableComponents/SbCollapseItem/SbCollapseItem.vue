<template>
  <ElCollapseItem class="sb-collapse-item">
    <slot />
  </ElCollapseItem>
</template>

<script setup lang="ts">
import { ElCollapseItem } from "element-plus";

</script>

<style scoped lang="scss">

.sb-collapse-item {
  --el-collapse-border-color: 1px solid var(--el-border-color-extra-light);
  --el-collapse-content-bg-color: var(--el-color-primary-light-9);
  --el-collapse-content-font-size: var(--el-font-size-base);
  --el-collapse-header-height: var(--el-component-size);

  :deep(.el-collapse-item__content) {
    display: flex;
    width: 100%;

    img {
      max-width: 100%;
      vertical-align: middle;
    }
  }

  &:not(:last-child) {
    border-bottom: var(--el-collapse-border-color);
    margin-bottom: var(--sb-gap-y);
    padding-bottom: var(--sb-gap-y);
  }

  :deep(.el-collapse-item__header) {
    align-items: center;
    font-size: var(--el-font-size-large);
    height: unset;
    justify-content: flex-end;
    line-height: unset !important;
    min-height: var(--el-collapse-header-height);

    .el-collapse-item__arrow {
      font-size: 20px;
      margin-right: 0;
    }
  }

  :deep(.el-collapse-item__wrap) {
    border-radius: var(--el-border-radius-base);
    margin-top: var(--sb-gap-y);

    .el-collapse-item__content {
      padding: var(--sb-gap-y) var(--sb-gap-x);
    }
  }
}
</style>
