<template>
  <ElDatePicker
    ref="datePickerRef"
    class="sb-date-picker"
    popper-class="sb-date-picker-popover"
    :clearable="props.clearable"
    :format="format"
    :popper-options="{ strategy: 'absolute' }"
    :class="{ 'is-shadow': props.shadow }"
    @change="handleDatePickerChange"
  />
</template>

<script setup lang="ts">
import { ElDatePicker } from "element-plus";
import { onMounted, shallowRef } from "vue";

import { useIsMobileDevice } from "@confero/common/hooks/useIsMobileDevice";
const props = withDefaults(
  defineProps<{
    shadow?: boolean;
    clearable?: boolean;
    format?: string;
  }>(),
  {
    shadow: false,
    clearable: true,
    format: "DD/MM/YYYY"
  }
);

const isMobileDevice = useIsMobileDevice();
const datePickerRef = shallowRef<InstanceType<typeof ElDatePicker>>();

const handleDatePickerChange = (): void => {
  // This handle is here to fix ElDatePicker being a fake HTML5 date picker which does not
  // trigger native "change" event and therefore HTML5 <form> when trigger for it
  datePickerRef.value?.$el?.dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
};

onMounted((): void => {
  if (isMobileDevice.value) {
    // disable time input editing to improve UX mobile
    const inputs = document.querySelectorAll(".sb-date-picker-popover .el-date-picker__editor-wrap:last-child input[type='text']");
    inputs.forEach((input): void => {
      input.setAttribute("readonly", "readonly");
    });
  }
});

</script>

<style lang="scss">
.sb-date-picker {
  font-size: var(--el-font-size-base);
  height: unset !important;
  width: 100% !important;

  .el-input__wrapper {
    padding: 0 var(--sb-gap-x);
    width: 100%;

    .el-input__inner {
      --el-input-inner-height: var(--el-input-height);
    }
  }

  .el-textarea__inner {
    padding: 10px var(--sb-gap-x);
  }

  &.is-shadow {
    .el-input__wrapper,
    .el-textarea__inner {
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

.sb-date-picker-popover.el-picker__popper.el-popper {
  .el-date-table__row td:not(.current) {
    transition: color var(--el-transition-duration) ease;

    .el-date-table-cell__text {
      transition: background-color var(--el-transition-duration) ease;
    }

    &:hover {
      .el-date-table-cell__text {
        background-color: var(--el-color-info-light-9);
      }
    }
  }

  .el-month-table,
  .el-year-table {
    td .cell {
      border-radius: var(--el-border-radius-base);

      &:hover {
        background-color: var(--el-color-info-light-9);
      }
    }
  }
}

// media to prevent datepicker overflow on mobile
@media (max-height: 768px) {
  .sb-date-picker-popover.el-picker__popper.el-popper {
    top: 60px !important;
  }
}
</style>
