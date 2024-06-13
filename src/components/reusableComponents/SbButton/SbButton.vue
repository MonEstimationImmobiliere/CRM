<template>
  <ElButton
    class="sb-button"
    :class="{
      'is-squared': props.squared,
      'has-shadow': props.shadow,
      'is-circle': props.circle,
      'is-rounded': props.rounded,
      'is-blue': props.blue
    }"
    v-bind="$attrs"
  >
    <template v-if="computedIconPath && props.iconPosition === 'start'">
      <SbIcon
        :icon-path="computedIconPath"
        :icon-spinning="computedIconSpinning"
        :icon-size="iconSize"
        :icon-color="props.iconColor"
      />
    </template>
    <slot />
    <template v-if="computedIconPath && props.iconPosition === 'end'">
      <SbIcon
        :icon-path="computedIconPath"
        :icon-spinning="computedIconSpinning"
        :icon-size="iconSize"
        :icon-color="props.iconColor"
      />
    </template>
  </ElButton>
</template>

<script setup lang="ts">
import { ElButton } from "element-plus";
import { computed, useAttrs } from "vue";

// import { SbIcon } from "../../index";
import type { IconPath, IconPosition } from "../SbIcon/types";

const props = withDefaults(defineProps<{
  iconPath?: IconPath;
  iconSize?: number | string;
  iconColor?: string;
  iconSpinning?: boolean;
  iconPosition?: IconPosition;
  squared?: boolean;
  loading?: boolean;
  shadow?: boolean;
  circle?: boolean;
  rounded?: boolean;
  blue?: boolean
}>(), {
  iconPath: undefined,
  iconColor: undefined,
  iconSize: undefined,
  iconSpinning: false,
  iconPosition: "start",
  squared: false,
  loading: false,
  shadow: false,
  circle: false,
  rounded: false,
  blue: false,
});

const attrs = useAttrs();

const iconPath = computed((): IconPath | undefined => props.loading ? undefined : props.iconPath);
const iconSize = computed((): number | string | undefined => {
  if (props.iconSize) {return props.iconSize;}
  if (attrs.size === "small") {return 16;}
  if (attrs.size === "large") {return 24;}
  return undefined;
});

const computedIconPath = computed((): IconPath | undefined => {
  if (props.loading) {return "Element:Loading";}
  return iconPath.value;
});

const computedIconSpinning = computed((): boolean => {
  if (props.loading) {return true;}
  return props.iconSpinning;
});
</script>

<style scoped lang="scss">
.sb-button {
  --el-border: var(--el-border-width) var(--el-border-style) var(--el-border-color);
  // --el-button-hover-bg-color: var(--el-button-bg-color);
  // --el-button-hover-border-color: var(--el-button-border-color);
  // --el-button-hover-text-color: var(--el-button-text-color);

  // --el-button-active-border-color: var(--el-button-border-color);
  // --el-button-active-text-color: var(--el-button-text-color);
  // --el-button-active-bg-color: var(--el-button-bg-color);

  height: var(--el-component-size);
  padding-left: 10px;
  padding-right: 10px;

  user-select: none !important;

  &.has-shadow {
    box-shadow: var(--el-box-shadow);
  }

  &.is-rounded {
    border-radius: var(--el-component-size);
    padding-left: 15px;
    padding-right: 15px;
  }

  :deep(> span) {
    gap: 5px;
    margin-left: 0;
  }

  &.el-button--small {
    font-size: var(--el-font-size-small);
    height: var(--el-component-size-small);
  }

  &.el-button--large {
    font-size: var(--el-font-size-large);
    height: var(--el-component-size-large);
  }

  &.is-text {
    --el-button-text-color: var(--el-text-color-primary);
    --el-button-hover-text-color: #{lighten(#243341, 10%)};

    box-shadow: unset;

    &.el-button--primary {
      --el-button-text-color: #217cbb;
    }

    &.is-blue {
     > :deep(.el-button) {
        background-color: #217cbb;
      --el-button-bg-color: #217cbb;

        color: white;
      }
      background-color: #217cbb;

      --el-button-bg-color: #217cbb;
    }

    &.el-button--success {
      --el-button-text-color: var(--el-color-success);
    }

    &.el-button--info {
      --el-button-text-color: var(--el-color-info);
    }

    &.el-button--warning {
      --el-button-text-color: var(--el-color-warning);
    }

    &.el-button--danger {
      --el-button-text-color: var(--el-color-danger);
    }

    &:hover,
    &:focus {
      background-color: var(--el-button-hover-bg-color);
    }

    &.is-disabled {
      background-color: unset;
      color: var(--el-disabled-text-color);
    }
  }

  &.is-squared {
    aspect-ratio: 1;
    padding: unset;
  }

  &.is-circle {
    aspect-ratio: 1;
    border-radius: 50%;
  }
}
</style>
