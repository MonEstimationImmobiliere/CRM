<template>
  <ElDropdownItem class="sb-dropdown-menu-item" :class="{'selected': selected}">
    <SbTypography
      :type="type"
    >
      <slot />
    </SbTypography>
  </ElDropdownItem>
</template>

<script lang="ts" setup>
import { ElDropdownItem } from "element-plus";

import type { ComponentType } from "@confero/common/types/common";

import SbTypography from "../SbTypography/SbTypography.vue";

defineProps<{
  type?: ComponentType;
  selected?: boolean;
}>();

</script>

<style lang="scss">

.sb-dropdown-menu-item {
  --sb-drop-down-menu-item-margin: 6px;

  border: 1px solid transparent;

  border-radius: var(--el-border-radius-base);
  margin: var(--sb-drop-down-menu-item-margin);
  padding: calc(var(--sb-gap-y) / 2) calc(var(--sb-gap-x) - var(--sb-drop-down-menu-item-margin));

  &:not(.is-disabled) {
    &:not(:hover):not(.selected).hover {
      background-color: transparent;
    }

    &:hover {
      background-color: var(--el-color-info-light-9);
      color: initial;
    }

    &.selected {
      background-color: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary);
    }
  }

  &.el-dropdown-menu__item--divided {
    padding: 0;
  }
}
</style>
