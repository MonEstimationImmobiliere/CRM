<template>
  <SbCard class="sb-checkbox-wrapper">
    <template v-for="(_, slot) in $slots" #[slot]="scope">
      <slot :name="slot" v-bind="scope || {}" />
    </template>
  </SbCard>
</template>

<script setup lang="ts">
import SbCard from "../SbCard/SbCard.vue";
</script>

<style scoped lang="scss">
.sb-checkbox-wrapper {
  --el-card-padding: 0 var(--sb-gap-x);

  :deep(.el-card__body) {
    display: flex;
    gap: 0 var(--sb-gap-x);

    .sb-checkbox {
      height: calc(var(--sb-checkbox-height) - 2px);
    }
  }
}
</style>
