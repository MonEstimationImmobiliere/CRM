<template>
  <ElDropdown
    class="sb-dropdown"
    trigger="click"
  >
    <template v-for="(_, slot) of $slots" #[slot]="scope">
      <slot :name="slot" v-bind="scope" />
    </template>
  </ElDropdown>
</template>

<script lang="ts" setup>

import { ElDropdown } from "element-plus";

export type SbDropdownMenuItems = Array<ISbDropdownMenuItem>;
export interface ISbDropdownMenuItem {
  dropdownMenuItemId: string;
  dropdownMenuItemLabel: string;
}

</script>

<style lang="scss" scoped>

</style>

<style lang="scss">
.el-dropdown__popper {
  --el-popper-border-radius: var(--el-border-radius-base);
}
</style>