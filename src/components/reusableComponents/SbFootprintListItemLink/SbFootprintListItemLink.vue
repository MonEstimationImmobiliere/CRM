<template>
  <SbListItemLink
    v-bind="$attrs"
    class="footprint-list-item-link"
    title="Empreinte environnementale"
    text="Empreinte du produit calculée par https://lempreinte.fr"
  >
    <template #bottom>
      <div class="footprint-section">
        <SbFootprintLabel :score="props.footprint.score" />

        <SbEnvironmentalFootprintGauge
          class="mt-4"
          :foot-print-impact-level="props.footprint.a"
          title="Réchauffement climatique"
          icon-path="Custom:GlobalWarming"
        />
        <SbEnvironmentalFootprintGauge
          class="mt-3"
          :foot-print-impact-level="props.footprint.b"
          title="Consomation d'eau"
          icon-path="Custom:Droplet"
        />
        <SbEnvironmentalFootprintGauge
          class="mt-3"
          :foot-print-impact-level="props.footprint.c"
          title="Eutrophisation"
          icon-path="Custom:FishBones"
        />
        <SbEnvironmentalFootprintGauge
          class="mt-3"
          :foot-print-impact-level="props.footprint.d"
          title="Réchauffement climatique"
          icon-path="Custom:Fuel"
        />
      </div>
    </template>
  </SbListItemLink>
</template>

<script lang="ts" setup>

import type { IFootprint } from "@confero/common/types/ticket";

import SbEnvironmentalFootprintGauge from "../SbEnvironmentalFootprintGauge/SbEnvironmentalFootprintGauge.vue";
import SbFootprintLabel from "../SbFootprintLabel/SbFootprintLabel.vue";
import SbListItemLink from "../SbListItemLink/SbListItemLink.vue";

const props = defineProps<{
  footprint: IFootprint;
}>();

</script>

<style scoped lang="scss">
.footprint-list-item-link {
  .footprint-section {
    margin-top: 10px;

    .footprint-label {
      font-size: 16px;
      font-weight: bold;
    }
  }
}
</style>