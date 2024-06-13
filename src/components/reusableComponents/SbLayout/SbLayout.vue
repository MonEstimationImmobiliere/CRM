<template>
  <component :is="layoutComponent" v-if="layoutComponent" class="sb-layout">
    <template #header>
      <slot name="header" />
    </template>
    <slot />

    <template #menu>
      <slot name="menu" />
    </template>

    <template #footer>
      <slot name="footer" />
    </template>
  </component>
</template>

<script lang="ts" setup>
import { computed, defineComponent } from "vue";

import { useIsMobileDevice } from "@confero/common/hooks/useIsMobileDevice";

import SbDesktopLayout from "./SbDesktopLayout.vue";
import SbMobileLayout from "./SbMobileLayout.vue";

const isMobileDevice = useIsMobileDevice();

const layoutComponent = computed((): ReturnType<typeof defineComponent> => {
  return isMobileDevice.value ? SbMobileLayout : SbDesktopLayout;
});

</script>

<style lang="scss" scoped>

.sb-layout {
  --sb-layout-sticky-top-offset: 0px;
}

</style>