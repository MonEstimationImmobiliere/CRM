<template>
  <ElSelect
    ref="selectRef"
    class="sb-select"
    :class="{ 'is-shadow': props.shadow }"
    tag-type=""
    popper-class="sb-select-dropdown"
    @change="handleSelectChange"
  >
    <template v-for="(_, slot) of $slots" #[slot]="scope">
      <slot :name="slot" v-bind="scope" />
    </template>
  </ElSelect>
</template>

<script setup lang="ts">
import { ElSelect } from "element-plus";
import { shallowRef } from "vue";

const props = withDefaults(
  defineProps<{
    shadow?: boolean;
    closeOnChange?: boolean;
    remote?: boolean;
  }>(), {
    shadow: false,
    closeOnChange: true,
    remote: false
  }
);

const selectRef = shallowRef<InstanceType<typeof ElSelect>>();

const handleSelectChange = (): void => {
  // This handle is here to fix ElSelect being a fake HTML5 select which does not
  // trigger native "change" event and therefore HTML5 <form> when trigger for it
  selectRef.value?.$el?.dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));

  if (props.closeOnChange) {
    selectRef.value?.blur();
  }
};

if (props.remote) {
  // throw new Error is props.remote is used because samsung navigator failed to use it
  throw new Error("props.remote is not supported");
}

</script>

<style scoped lang="scss">
.sb-select {
  width: 100%;

  :deep(.el-tooltip__trigger) {
    width: inherit;
  }

  :deep(.el-select__tags) {
    padding: 0 var(--sb-gap-x);

    .el-select-tags-wrapper {
      margin: 0;
    }
  }

  :deep(.el-input) {
    font-size: var(--el-font-size-base);

    .el-input__wrapper {
      padding: 0 var(--sb-gap-x);

      .el-input__inner {
        --el-input-inner-height: var(--el-input-height);
        min-height: var(--el-input-inner-height);
      }
    }

    .el-input__suffix {
      //
    }

    &.el-input--small {
      font-size: var(--el-font-size-small);

    }

    &.el-input--large {
      font-size: var(--el-font-size-large);
    }
  }

  :deep(.el-select__tags) {
    .el-tag {
      --el-tag-font-size: var(--el-font-size-base);
      height: calc(var(--el-component-size) - 8px);
      line-height: 1;
    }
  }

  &.el-select--small {
    :deep(.el-select__tags) {
      .el-tag {
        --el-tag-font-size: var(--el-font-size-small);
        height: calc(var(--el-component-size-small) - 8px);
      }
    }
  }

  &.el-select--large {
    :deep(.el-select__tags) {
      .el-tag {
        --el-tag-font-size: var(--el-font-size-large);
        height: calc(var(--el-component-size-large) - 8px);
      }
    }
  }

  &.is-shadow {
    :deep(.el-input) {
      .el-input__wrapper {
        box-shadow: 0 0 0 1px transparent inset, var(--el-box-shadow);

        &:hover {
          box-shadow: 0 0 0 1px var(--el-input-hover-border-color) inset, var(--el-box-shadow);
        }

        &:focus {
          box-shadow: 0 0 0 1px var(--el-input-focus-border-color) inset, var(--el-box-shadow);
        }
      }

      &.is-disabled {
        --el-input-hover-border-color: transparent;
        --el-input-focus-border-color: transparent;
      }
    }
  }
}
</style>

<style lang="scss">
.el-select__popper.el-popper.sb-select-dropdown {
  border: 0;
  box-shadow: var(--el-box-shadow);

  .el-select-dropdown__wrap {
    max-height: 90vh;
  }

  .el-popper__arrow::before {
    display: none;
  }

  .el-select-dropdown__list {
    padding: 0;
  }

  .el-select-dropdown__item.is-disabled {
    background-color: unset;
  }
}
</style>

