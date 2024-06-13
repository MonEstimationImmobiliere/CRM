<template>
  <SbCard
    :class="classes"
    :shadow="false"
  >
    <template v-for="(_, slot) of $slots" #[slot]="scope">
      <slot :name="slot" v-bind="scope" />
    </template>
  </SbCard>
</template>

<script lang="ts" setup>
import { computed, useAttrs } from "vue";

import SbCard from "../SbCard/SbCard.vue";

const props = withDefaults(
  defineProps<{
    hoverable?: boolean;
    hoverScale?: boolean;
    active?: boolean;
    disabled?: boolean;
  }>(),
  {
    hoverable: undefined,
    hoverScale: false,
    active: false,
    disabled: false
  }
);

const attrs = useAttrs();

const classes = computed((): Record<string, boolean> => ({
  "sb-card-zone": true,
  "is-hoverable": !props.disabled && (props.hoverable === true || !!attrs.onClick),
  "is-active": props.active && !props.disabled,
  "is-disabled": props.disabled,
  "is-clickable": !!attrs.onClick && !props.disabled,
  "is-hover-scale": props.hoverScale
}));

</script>

<style lang="scss" scoped>
.sb-card-zone {
  --el-card-border-color: var(--el-border-color-light);
  --el-card-bg-color: #ffffff;

  &.is-clickable {
    cursor: pointer;
  }

  &.is-active,
  &.is-hoverable:hover {
    --el-card-border-color: var(--el-color-primary);
    --el-card-bg-color: var(--el-color-primary-light-9);

    &.is-hover-scale {
      transform: scale(1.03);
    }
  }

  &.is-disabled {
    --el-card-border-color: var(--el-disabled-border-color);
    --el-card-bg-color: var(--el-disabled-bg-color);
  }
}
</style>
