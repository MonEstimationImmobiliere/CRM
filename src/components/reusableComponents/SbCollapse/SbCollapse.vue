<template>
  <SbCard shadow>
    <ElCollapse
      class="sb-collapse"
      accordion
      v-bind="$attrs"
    >
      <slot />
    </ElCollapse>
  </SbCard>
</template>

<script setup lang="ts">
import { ElCollapse } from "element-plus";

import SbCard from "../SbCard/SbCard.vue";

</script>

<style scoped lang="scss">
.sb-collapse {
  border: unset;
  padding: unset;
}
</style>
