<template>
  <ElLink
    class="sb-link"
    :class="classes"
    :underline="false"
    :disabled="disabled"
    v-bind="$attrs"
  >
    <template v-if="iconPath && props.iconPosition === 'start'">
      <SbIcon
        :icon-path="iconPath"
        :icon-size="props.iconSize"
        :icon-color="props.iconColor"
        :icon-spinning="isIconSpinning"
      />
    </template>
    <slot />
    <template v-if="iconPath && props.iconPosition === 'end'">
      <SbIcon
        :icon-path="iconPath"
        :icon-size="props.iconSize"
        :icon-color="props.iconColor"
        :icon-spinning="isIconSpinning"
      />
    </template>
  </ElLink>
</template>

<script setup lang="ts">
import { ElLink } from "element-plus";
import { computed } from "vue";

import SbIcon from "../SbIcon/SbIcon.vue";
import type { IconPath, IconPosition } from "../SbIcon/types";

const props = withDefaults(
  defineProps<{
    iconPath?: IconPath;
    iconSize?: number | string;
    iconColor?: string;
    iconSpinning?: boolean;
    iconPosition?: IconPosition;
    underline?: boolean;
    disabled?: boolean;
    loading?: boolean;
  }>(), {
    iconPath: undefined,
    iconColor: undefined,
    iconSize: 16,
    iconSpinning: false,
    iconPosition: "start",
    underline: true,
    disabled: false,
    loading: false
  }
);

const classes = computed((): Record<string, boolean> => {
  return {
    underline: props.underline
  };
});

const disabled = computed((): boolean => props.disabled || props.loading);
const iconPath = computed((): string | undefined => props.loading ? "Element:Loading" : props.iconPath);
const isIconSpinning = computed((): boolean => props.loading || props.iconSpinning);
</script>

<style lang="scss" scoped>
.sb-link {
  --el-link-font-weight: 400;
  --el-link-font-size: inherit;

  transition: color var(--el-transition-duration) ease;

  :deep(.el-link__inner) {
    align-items: center;
    display: flex;
    gap: 5px;
    width: 100%;

    .sb-icon {
      display: inline-block;
    }
  }

  &.underline {
    text-decoration: underline;
  }

  &.el-link--default {
    --el-link-text-color: currentColor;
    --el-link-hover-text-color: currentColor;
    --el-link-disabled-text-color: currentColor;
    transition: opacity var(--el-transition-duration) ease;

    &:hover {
      opacity: 0.8;
    }

    &.is-disabled {
      opacity: 0.4;
    }
  }

  &.el-link--primary {
    --el-link-text-color: #527dac;
    --el-link-hover-text-color: #{darken(#527dac, 15%)};
    --el-link-disabled-text-color: #{lighten(#527dac, 30%)};
  }

  &.el-link--success {
    --el-link-text-color: var(--el-color-success);
    --el-link-disabled-text-color: var(--el-color-success-light-5);
    --el-link-hover-text-color: var(--el-color-success-dark-2);
  }

  &.el-link--info {
    --el-link-text-color: var(--el-color-info);
    --el-link-disabled-text-color: var(--el-color-info-light-5);
    --el-link-hover-text-color: var(--el-color-info-dark-2);
  }

  &.el-link--warning {
    --el-link-text-color: var(--el-color-warning);
    --el-link-disabled-text-color: var(--el-color-warning-light-5);
    --el-link-hover-text-color: var(--el-color-warning-dark-2);
  }

  &.el-link--danger {
    --el-link-text-color: var(--el-color-danger);
    --el-link-disabled-text-color: var(--el-color-danger-light-5);
    --el-link-hover-text-color: var(--el-color-danger-dark-2);
  }

  &::after {
    display: none;
  }
}
</style>
