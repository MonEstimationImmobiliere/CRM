<template>
  <ElDropdownMenu class="sb-dropdown-menu">
    <slot />
  </ElDropdownMenu>
</template>

<script lang="ts" setup>
import { ElDropdownMenu } from "element-plus";
</script>

<style lang="scss" scoped>
.sb-dropdown-menu {
  padding: 0;
}
</style>
