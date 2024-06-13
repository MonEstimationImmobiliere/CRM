<template>
  <Component :is="imgSrc" class="sb-ecoscore" />
</template>

<script setup lang="ts">

import { computed } from "vue";

import EcoScoreA from "../../assets/score/ecoscore/ecoscore-a.svg";
import EcoScoreB from "../../assets/score/ecoscore/ecoscore-b.svg";
import EcoScoreC from "../../assets/score/ecoscore/ecoscore-c.svg";
import EcoScoreD from "../../assets/score/ecoscore/ecoscore-d.svg";
import EcoScoreE from "../../assets/score/ecoscore/ecoscore-e.svg";
import EcoScoreUnknown from "../../assets/score/ecoscore/ecoscore-unknown.svg";

const props = withDefaults(defineProps<{
  modelValue: "A" | "B" | "C" | "D" | "E" | undefined;
}>(), {
  modelValue: undefined
});

const imgSrc = computed((): string => {
  switch (props.modelValue) {
    case "A":
      return EcoScoreA;
    case "B":
      return EcoScoreB;
    case "C":
      return EcoScoreC;
    case "D":
      return EcoScoreD;
    case "E":
      return EcoScoreE;
    default:
      return EcoScoreUnknown;
  }
});

</script>

<style scoped lang="scss">
.sb-ecoscore {
  //
}
</style>