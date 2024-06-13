<template>
  <ElAutocomplete
    ref="ElAutocompleteRef"
    class="sb-autocomplete"
    :debounce="$props.debounce"
    :class="{ 'is-shadow' : props.shadow}"
  >
    <template v-for="(_, slot) of $slots" #[slot]="scope">
      <slot :name="slot" v-bind="scope" />
    </template>
  </ElAutocomplete>
</template>

<script setup lang="ts">
import { ElAutocomplete } from "element-plus";
import { ref } from "vue";

const props = withDefaults(
  defineProps<{
    shadow?: boolean;
    debounce?: number;
  }>(), {
    shadow: false,
    debounce: 500
  }
);

const ElAutocompleteRef = ref<InstanceType<typeof ElAutocomplete>>();

defineExpose({
  ElAutocomplete: ElAutocompleteRef
});
</script>

<style lang="scss">
.sb-autocomplete {
  width: 100%;

  &.is-shadow {
    .el-input__wrapper {
      box-shadow: 0 0 0 1px var(--sb-input-border-color) inset, var(--el-box-shadow);

      &:hover {
        --sb-input-border-color: var(--el-input-hover-border-color);
      }

      &:focus {
        --sb-input-border-color: var(--el-input-focus-border-color);
      }

      &.is-disabled {
        --sb-input-border-color: transparent;
      }
    }

  }

  .el-input {
    --sb-input-border-color: transparent;
    font-size: var(--el-font-size-base);
  }

  .el-input__wrapper {
    padding: 0 var(--sb-gap-x);

    .el-input__inner {
      --el-input-inner-height: var(--el-input-height);
    }

    .el-input__inner {
      &.el-input--small {
        font-size: var(--el-font-size-small);
      }

      &.el-input--large {
        font-size: var(--el-font-size-large);
      }

      &.is-disabled {
        --el-text-color-placeholder: var(--el-disabled-placeholder-color);
      }
    }
  }
}
</style>