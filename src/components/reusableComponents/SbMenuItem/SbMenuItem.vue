<template>
  <ElMenuItem ref="menuItem" :class="classes">
    <SbTooltip :disabled="menuItemWidth > 100 || !props.tooltip" :content="label" placement="right">
      <RouterLink :class="`sb-menu-item`" :to="props.to" @click="handleMenuItemClick">
        <div class="sb-menu-item-content">
          <template v-if="props.iconPath">
            <div class="sb-menu-item-icon-wrapper" :style="{ backgroundColor: props.iconColor }">
              <SbIcon
                class="sb-menu-item-icon"
                :icon-path="props.iconPath"
                :icon-color="props.iconColor"
                :icon-size="props.iconSize"
              />
            </div>
          </template>
          <slot name="label">
            <div class="sb-menu-item-label-wrapper">
              <span class="sb-menu-item-label text-clamp-1">{{ label }}</span>
              <template v-if="subtitle">
                <span class="sb-menu-item-subtitle">{{ subtitle }}</span>
              </template>
            </div>
          </slot>
        </div>
      </RouterLink>
    </SbTooltip>
  </ElMenuItem>
</template>

<script setup lang="ts">
import { useResizeObserver } from "@vueuse/core";
import { ElMenuItem } from "element-plus";
import { computed, ref, shallowRef } from "vue";
import type { RouteLocationRaw } from "vue-router";

import type { IconPath } from "../SbIcon/types";
import { SbTooltip, SbIcon } from "@/components/index";

const props = withDefaults(defineProps<{
  label?: string;
  subtitle?: string;
  iconPath?: IconPath;
  iconSize?: number | string;
  iconColor?: string;
  to: RouteLocationRaw;
  tooltip?: boolean;
}>(), {
  active: false,
  label: "",
  subtitle: undefined,
  iconPath: undefined,
  iconSize: undefined,
  iconColor: undefined,
  to: undefined,
  tooltip: false
});

const emit = defineEmits<{
  (e: "menuItemClick"): void;
}>();

const menuItem = shallowRef();
const menuItemWidth = ref(0);

useResizeObserver(menuItem, (entries): void => {
  const entry = entries[0];
  if (entry) {
    menuItemWidth.value = entry.contentRect.width;
  }
});

const handleMenuItemClick = (): void => {
  emit("menuItemClick");
};

const classes = computed((): Record<string, boolean> => ({
  "sb-menu-item": true
}));
</script>

<style lang="scss" scoped>
.sb-menu-item {
  --el-menu-item-height: initial;
  // --el-menu-item-font-size: var(--el-font-size-base);
  // --el-menu-item-hover-fill: var(--el-color-primary-light-9);
  // --el-menu-level-padding: var(--sb-gap-x);
  // --el-menu-base-level-padding: var(--sb-gap-x);
  // color: var(--el-text-color-primary);
  text-decoration: none;
  width: 100%;

  .sb-menu-item-content {
    align-items: center;
    border-radius: 10px;
    display: flex;
    gap: 10px;
    height: 50px;
    justify-content: flex-start;
    // padding-left: calc(var(--sb-gap-x) / 2);
    // transition: background-color var(--el-transition-duration-fast) ease-out;
    width: 100%;

    .sb-menu-item-icon-wrapper {
      align-items: center;
      border-radius: var(--sb-gap-y);
      color: #ffffff;
      display: flex;
      gap: var(--sb-gap-y);
      justify-content: center;

      .sb-menu-item-icon {
        // margin: calc(var(--sb-gap-y)/2);
        // padding: calc(var(--sb-gap-x)/5);
      }
    }

    .sb-menu-item-icon {
      margin: 0;
    }

    .sb-menu-item-label-wrapper {
      align-items: flex-start;
      display: flex;
      flex-direction: column;
      gap: 3px;
      justify-content: center;
      width: 100%;

      .sb-menu-item-label {
        // font-size: var(--el-menu-item-font-size);
        // transition: font-size var(--el-transition-duration-fast) ease;
        width: 100%;
        will-change: font-size;
      }

      .sb-menu-item-subtitle {
        // color: var(--el-color-info);
        // font-size: var(--el-font-size-small);
      }
    }
  }

  &:hover {
    .sb-menu-item-content {
      // background-color: var(--el-color-info-light-9);
    }
  }

  &.router-link-active {
    .sb-menu-item-label {
      font-size: 1.2em !important;
      font-weight: 600;
    }
  }
}

// @media screen and (max-width: $sb-md-max-width) and (min-width: $sb-sm-max-width) {
//   .sb-menu-item {
//     .sb-menu-item-content {
//       align-items: center;
//       display: flex;
//       flex-direction: column;
//       height: 80px;
//       justify-content: center;
//       padding: 0;

//       .sb-menu-item-label-wrapper {
//         text-align: center;
//       }
//     }
//   }
// }

</style>

