<template>
  <ElContainer class="sb-desktop-layout">
    <template v-if="$slots.menu">
      <ElAside class="sb-desktop-layout-menu">
        <slot name="menu" />
      </ElAside>
    </template>
    <ElMain class="sb-desktop-layout-main">
      <slot />
    </ElMain>
  </ElContainer>
</template>

<script lang="ts" setup>
import { ElAside, ElContainer, ElMain } from "element-plus";

</script>

<style lang="scss" scoped>
.sb-desktop-layout {
  --sb-header-height: 50px;
  position: relative;
  width: 100%;

  .sb-desktop-layout-menu {
    border-right: 1px solid var(--el-border-color-light);
    height: 100vh;
    position: sticky;
    top: 0;
    transition: width var(--el-transition-duration-fast) ease;
    width: var(--sb-side-nav-width);
  }

  .sb-desktop-layout-main {
    ////// important for layout, don't set padding top and bottom on main, use padding with SbPage instead
    --el-main-padding: #{$sb-main-padding};
    background-color: var(--el-bg-color-page);
    display: flex;
    flex-direction: column;
    overflow: initial;
    padding-bottom: 0;
    padding-top: 0;

    :deep(.sb-page) {
      margin-left: auto;
      margin-right: auto;
    }
  }
}

@media screen and (max-width: $sb-md-max-width) {
  .sb-desktop-layout {
    .sb-desktop-layout-menu {
      --sb-side-nav-width: 110px;
    }

    .sb-layout-aside {
      width: 90px;
    }
  }
}
</style>
