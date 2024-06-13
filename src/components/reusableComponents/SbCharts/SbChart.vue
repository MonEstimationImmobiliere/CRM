<template>
  <SbCard
    class="sb-area-chart-card w-100 h-100"
    radius
    :style="{ '--background-color': props.backgroundColor}"
    v-bind="$attrs"
  >
    <template v-if="props.options?.series">
      <apexchart
        :height="props.height"
        :options="props.options"
        :series="props.options?.series"
      />
    </template>
  </SbCard>
</template>

<script lang="ts" setup>
import { ApexOptions } from "apexcharts";

import SbCard from "../SbCard/SbCard.vue";
const props = withDefaults(defineProps<{
  options: ApexOptions | null;
  backgroundColor?: string;
  height?: string;
}>(), {
  options: null,
  backgroundColor: "#ffffff",
  height: "350"
});

</script>

<style lang="scss" scoped>

.sb-area-chart-card {
  background-color: var(--background-color);
}

@media screen and (max-width: $sb-xs-max-width) {
  .sb-area-chart-card {
    --el-card-padding: 0;
  }
}

</style>