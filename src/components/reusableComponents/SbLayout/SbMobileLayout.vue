<template>
  <div class="sb-mobile-layout">
    <template v-if="isHeaderSlotProvided">
      <div class="sb-mobile-layout-header">
        <slot name="header" />
      </div>
    </template>
    <ElMain class="sb-mobile-layout-main">
      <slot />
    </ElMain>
    <template v-if="isFooterSlotProvided">
      <div class="sb-mobile-layout-footer">
        <slot name="footer" />
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ElMain } from "element-plus";
import { computed, useSlots } from "vue";

const slots = useSlots();

const isHeaderSlotProvided = computed((): boolean => {
  return !!slots.header;
});

const isFooterSlotProvided = computed((): boolean => {
  return !!slots.footer;
});

</script>

<style lang="scss" scoped>
.sb-mobile-layout {
  --sb-header-height: 50px;
  --sb-footer-height: 80px;
  position: relative;
  width: 100%;

  .sb-mobile-layout-header {
    --el-main-padding: #{$sb-main-padding};
    background-color: var(--el-bg-color-overlay);
    box-shadow: var(--el-box-shadow-lighter);
    min-height: var(--sb-header-height);
    padding-inline: var(--el-main-padding);
    padding-top: env(safe-area-inset-top);
    position: sticky;
    top: 0;
    width: 100%;
    z-index: var(--sb-header-z-index);
  }

  .sb-mobile-layout-main {
    --el-main-padding: #{$sb-main-padding};
    --sb-layout-sticky-top-offset: var(--sb-header-height);
    display: flex;
    flex-direction: column;
    min-height: calc(100vh - var(--sb-header-height));
    overflow: initial;
    padding-bottom: calc(env(safe-area-inset-bottom, 0) + var(--sb-footer-height));
    padding-top: 0;
    width: 100%;
  }

  .sb-mobile-layout-footer {
    background-color: var(--el-bg-color-overlay);
    border-top: 1px solid var(--el-border-color);
    bottom: 0;
    height: calc(var(--sb-footer-height) + env(safe-area-inset-bottom, 0));
    padding-bottom: env(safe-area-inset-bottom, 0);
    position: fixed;
    width: 100%;
  }

}

</style>

<style lang="scss">
body.disclosable-opened {
  .sb-mobile-layout {
    overflow: hidden;
    visibility: hidden;
  }
}
</style>