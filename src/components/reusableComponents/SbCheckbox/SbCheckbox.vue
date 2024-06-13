<template>
  <ElCheckbox
    class="sb-checkbox"
    :checkbox-position="checkboxPosition"
    :class="{ 'is-shadow': props.shadow }"
  >
    <template v-for="(_, slot) of $slots" #[slot]="scope">
      <slot :name="slot" v-bind="scope" />
    </template>
  </ElCheckbox>
</template>

<script setup lang="ts">
import { ElCheckbox } from "element-plus";

const props = withDefaults(
  defineProps<{
    shadow?: boolean;
    checkboxPosition?: "left" | "right";
  }>(),
  {
    shadow: false,
    checkboxPosition: "left"
  }
);

</script>

<style scoped lang="scss">
.sb-checkbox {
  --sb-checkbox-height: var(--el-component-size);
  height: var(--sb-checkbox-height);
  margin-right: 0;
  white-space: initial;

  :deep(.el-checkbox__label) {
    color: var(--el-text-color-primary);
    font-size: var(--el-font-size-base);
    font-weight: 400;

    > * {
      vertical-align: top;
    }
  }

  &[checkbox-position='right'] {
    flex-direction: row-reverse;

    :deep(.el-checkbox__label) {
      flex: 1;
      padding-left: 0;
      padding-right: 8px;
    }
  }

  &.el-checkbox--small {
    --sb-checkbox-height: var(--el-component-size-small);

    :deep(.el-checkbox__label) {
      font-size: var(--el-font-size-small);
    }
  }

  &.el-checkbox--large {
    --sb-checkbox-height: var(--el-component-size-large);

    :deep(.el-checkbox__label) {
      font-size: var(--el-font-size-large);
    }
  }

  &.is-shadow {
    :deep(.el-checkbox__inner) {
      box-shadow: var(--el-box-shadow-light);
    }
  }

  &.is-disabled {
    cursor: not-allowed;

    :deep(.el-checkbox__inner) {
      &::after {
        --el-checkbox-disabled-checked-icon-color: #b8b8b8;
      }
    }
  }
}
</style>
