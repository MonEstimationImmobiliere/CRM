<template>
  <ElRadio
    ref="radioRef"
    class="sb-radio"
    :class="{ 'is-shadow': props.shadow }"
  >
    <template v-for="(_, slot) of $slots" #[slot]="scope">
      <slot :name="slot" v-bind="scope" />
    </template>
  </ElRadio>
</template>

<script setup lang="ts">
import { ElRadio } from "element-plus";

const props = withDefaults(
  defineProps<{
    shadow?: boolean;
  }>(), {
    shadow: false
  }
);
</script>

<style scoped lang="scss">
.sb-radio {
  height: var(--el-component-size);
  margin-right: 0;

  &.is-shadow {
    :deep(.el-radio__inner) {
      box-shadow: var(--el-box-shadow-light);
    }
  }

  :deep(.el-radio__label) {
    color: var(--el-text-color-primary);
    font-size: var(--el-font-size-base);
    font-weight: 400;
    line-height: 1.2;
  }

  &.el-radio--small {
    height: var(--el-component-size-small);

    :deep(.el-radio__label) {
      font-size: var(--el-font-size-small);
    }
  }

  &.el-radio--large {
    height: var(--el-component-size-large);

    :deep(.el-radio__label) {
      font-size: var(--el-font-size-large);
    }
  }

  &.is-disabled {
    cursor: not-allowed;

    :deep(.el-radio__inner) {
      &::after {
        background-color: #b8b8b8;
      }
    }
  }
}
</style>
