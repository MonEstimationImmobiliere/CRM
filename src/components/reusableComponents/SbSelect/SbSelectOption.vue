<template>
  <ElOption
    :value="props.value"
    class="sb-select-option"
  >
    <template v-if="Object.keys($slots).length">
      <div class="sb-select-option-content-wrapper">
        <template v-if="$slots.left">
          <div class="sb-select-option-left">
            <slot name="left" />
          </div>
        </template>
        <slot />
      </div>
    </template>
  </ElOption>
</template>

<script setup lang="ts">
import { ElOption } from "element-plus";

const props = defineProps<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
}>();

// Allow to use the component with value null in select
// related to issue : https://github.com/element-plus/element-plus/issues/8017
ElOption.props.value.type = undefined;
////////////////////////////
</script>

<style scoped lang="scss">
.sb-select-option {
  --sb-select-option-margin: 6px;
  border: 1px solid transparent;
  border-radius: var(--el-border-radius-base);
  margin: var(--sb-select-option-margin);
  padding: 0 calc(var(--sb-gap-x) - var(--sb-select-option-margin));

  &:not(.is-disabled) {
    &:not(:hover):not(.selected).hover {
      background-color: transparent;
    }

    &:hover {
      background-color: var(--el-color-info-light-9);
    }

    &.selected {
      background-color: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary);
      color: inherit;
      font-weight: 500;
    }
  }
}

.sb-select-option {
  .sb-select-option-content-wrapper {
    align-items: center;
    display: flex;
    gap: 10px;
    height: 100%;
    width: 100%;

    .sb-select-option-left {
      display: inline-flex;
      height: 100%;
      width: var(--sb-gap-x);
    }
  }

}
</style>
