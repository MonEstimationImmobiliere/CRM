<template>
  <ElCard
    :class="classes"
    :shadow="props.shadow ? 'always' : 'never'"
    v-bind="$attrs"
  >
    <template v-if="$slots.header || props.header" #header>
      <slot name="header">
        <div class="sb-card-header">
          <SbTypography as="h6" semi-bold>
            {{ props.header }}
          </SbTypography>
          <slot name="header-end" />
        </div>
      </slot>
      <slot name="header-bottom" />
    </template>
    <slot />
  </ElCard>
</template>

<script setup lang="ts">
import { ElCard } from "element-plus";
import { computed, useSlots } from "vue";

import { SbTypography } from "../../index";

const props = withDefaults(
  defineProps<{
    header?: string;
    shadow?: boolean;
    squared?: boolean;
    border?: boolean;
    list?: boolean;
    radius?: boolean;
    padding?: boolean;
    hoover?: boolean;
    noBackground?: boolean;
  }>(),
  {
    header: "",
    shadow: false,
    squared: false,
    border: true,
    list: false,
    radius: false,
    padding: true,
    hoover: true,
    noBackground: false,
  }
);

const slots = useSlots();

const classes = computed((): Record<string, boolean> => ({
  "sb-card": true,
  "has-header": !!slots.header || !!props.header,
  "is-squared": props.squared,
  "has-border": props.border,
  "is-list": props.list,
  "has-radius": props.radius,
  "has-padding": props.padding,
  "is-always-shadow": props.shadow,
  "is-always-hoover": props.hoover,
  "has-no-background": props.noBackground,

}));
</script>

<style scoped lang="scss">
.sb-card {
  --el-card-border-color: rgb(181, 181, 181);
  //--sb-card-border-style: solid;
  //--sb-card-border-width: 1px;
  border-color: #c1bfbf;
  border-radius: unset;
  border-style: var(--sb-card-border-style);
  border-width: var(--sb-card-border-width);

  margin: 20px;

  color: var(--el-text-color-primary);
  display: flex;
  flex-direction: column;
  transition: unset;
  transition: border-color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
  user-select: none;
  
  &.is-always-hoover {
  &:hover {
    background-color: var(--light-gray);
  }
  }
  &:not(.has-padding) {
    --el-card-padding: 0;
  }

  .sb-card-header {
    margin: -20px;
    align-items: center;
    display: flex;
    justify-content: space-between;
  }

  &.is-always-shadow {
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);

    &:hover {
      box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.3);
    }
  }

  &.has-radius {
    border-radius: 10px;
  }

  &.has-no-background {
    background-color: transparent;
  }

  &.is-list {
    border-width: 0 0 var(--sb-card-border-width) 0;
  }

  &.has-border {
    --sb-card-border-width: 1px;
  }

  &.is-always-shadow {
    border-color: transparent;
  }

  &:not(.has-border) {
    border-color: transparent;
  }

  > :deep(.el-card__header) {
    background-color: #ffffff;
    border: unset;
    display: none;
    position: relative;
  }

  > :deep(.el-card__body) {
    flex: 1;

    > :last-child {
      margin-bottom: 0;
    }
  }

  &.has-header {
    > :deep(.el-card__header) {
      display: block;
    }
  }

  &.is-squared {
    aspect-ratio: 1;
  }
}
</style>
