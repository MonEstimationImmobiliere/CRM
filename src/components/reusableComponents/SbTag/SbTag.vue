<template>
  <ElTag
    v-bind="$attrs"
    disable-transitions
    class="sb-tag"
    :class="{
      'is-clickable': isClickable
    }"
  >
    <template v-if="props.iconPath && props.iconPosition === 'start'">
      <SbIcon
        :icon-path="props.iconPath"
        :icon-size="iconSize"
        :icon-color="props.iconColor"
        :icon-spinning="props.iconSpinning"
      />
    </template>
    <div class="sb-tag-content">
      <slot />
    </div>
    <template v-if="props.iconPath && props.iconPosition === 'end'">
      <SbIcon
        :icon-path="props.iconPath"
        :icon-size="iconSize"
        :icon-color="props.iconColor"
        :icon-spinning="props.iconSpinning"
      />
    </template>
  </ElTag>
</template>

<script setup lang="ts">
import { ElTag } from "element-plus";
import { computed, useAttrs } from "vue";

import SbIcon from "../SbIcon/SbIcon.vue";
import type { IconPath, IconPosition } from "../SbIcon/types";

const props = withDefaults(defineProps<{
  iconPath?: IconPath;
  iconSize?: number | string;
  iconColor?: string;
  iconSpinning?: boolean;
  iconPosition?: IconPosition;
}>(), {
  iconPath: undefined,
  iconColor: undefined,
  iconSize: undefined,
  iconSpinning: false,
  iconPosition: "start"
});

const attrs = useAttrs();

const isClickable = computed((): boolean => {
  return !!attrs.onClick;
});

const iconSize = computed((): number | string | undefined => {
  if (props.iconSize) return props.iconSize;
  if (attrs.size === "small") return 16;
  if (attrs.size === "large") return 24;
  return undefined;
});

</script>

<style scoped lang="scss">
.sb-tag {
  --el-tag-bg-color: var(--el-color-primary-light-8);
  --el-tag-border-color: var(--el-color-primary-light-7);
  --el-tag-text-color: var(--el-text-color-primary);
  --el-tag-border-radius: var(--el-component-size);

  :deep(.el-tag__content) {
    align-items: center;
    display: inline-flex;
    gap: 5px;
    justify-content: center;
    width: 100%;

    .sb-tag-content {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .sb-icon {
    cursor: inherit;
  }

  &.is-clickable {
    cursor: pointer;
    user-select: none;
  }

  &.el-tag--primary {
    --el-tag-bg-color: var(--el-color-primary-light-8);
    --el-tag-border-color: var(--el-color-primary-light-7);
  }

  &.el-tag--success {
    --el-tag-bg-color: var(--el-color-success-light-8);
    --el-tag-border-color: var(--el-color-success-light-7);
  }

  &.el-tag--info {
    --el-tag-bg-color: var(--el-color-info-light-8);
    --el-tag-border-color: var(--el-color-info-light-7);
  }

  &.el-tag--warning {
    --el-tag-bg-color: var(--el-color-warning-light-8);
    --el-tag-border-color: var(--el-color-warning-light-7);
  }

  &.el-tag--danger {
    --el-tag-bg-color: var(--el-color-danger-light-8);
    --el-tag-border-color: var(--el-color-danger-light-7);
  }
}
</style>
