<template>
  <ElMenu mode="horizontal" :ellipsis="false" class="sb-mobile-bottom-menu">
    <template v-for="menuItem in computedMenuItems" :key="menuItem.label">
      <ElMenuItem class="flex-1 p-0">
        <RouterLink class="sb-mobile-bottom-menu-item" :to="menuItem">
          <div class="sb-mobile-bottom-menu-item-content">
            <template v-if="menuItem.iconPath">
              <div class="sb-mobile-bottom-menu-item-icon-wrapper" :style="{ backgroundColor: menuItem.iconColor }">
                <SbIcon
                  class="sb-mobile-bottom-menu-item-icon"
                  :icon-size="24"
                  :icon-path="menuItem.iconPath"
                />
              </div>
            </template>
            <div class="sb-mobile-bottom-menu-item-label-wrapper">
              <span class="sb-mobile-bottom-menu-item-label text-clamp-1">{{ menuItem.label }}</span>
            </div>
          </div>
        </RouterLink>
      </ElMenuItem>
    </template>
    <ElMenuItem class="sb-mobile-bottom-menu-item flex-1 p-0" @click="handleMoreIconClick">
      <div class="sb-mobile-bottom-menu-item-content">
        <div class="sb-mobile-bottom-menu-item-icon-wrapper" :style="{ backgroundColor: '#33b544' }">
          <SbIcon
            class="sb-mobile-bottom-menu-item-icon"
            :icon-size="24"
            icon-path="Element:MoreFilled"
          />
        </div>

        <div class="sb-mobile-bottom-menu-item-label-wrapper">
          <span class="sb-mobile-bottom-menu-item-label text-clamp-1">{{ t('common.words.menu') }}</span>
        </div>
      </div>
    </ElMenuItem>
  </ElMenu>
</template>

<script lang="ts" setup>
import { ElMenu, ElMenuItem } from "element-plus";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { IRoute } from "@confero/common/types/route";

import SbIcon from "../SbIcon/SbIcon.vue";

const props = defineProps<{
  menuItems: IRoute[];
  isUserLoggedIn: boolean;
}>();

const emit = defineEmits<{
  (e: "moreIconClick"): void;
}>();

const { t } = useI18n();

const computedMenuItems = computed((): IRoute[] => {
  return props.menuItems.filter((menuItem): boolean => menuItem.gestAccess || props.isUserLoggedIn);
});

const handleMoreIconClick = (): void => {
  emit("moreIconClick");
};
</script>

<style lang="scss" scoped>

.sb-mobile-bottom-menu {
  --el-menu-border-color: transparent;
  height: 100%;
  -webkit-tap-highlight-color: transparent;
  width: 100%;

  .el-menu-item:hover {
    background-color: #fff;
  }

  .sb-mobile-bottom-menu-item {
    --el-menu-item-height: initial;
    --el-menu-item-font-size: var(--el-font-size-base);
    --el-menu-item-hover-fill: var(--el-color-primary-light-9);
    --el-menu-level-padding: var(--sb-gap-x);
    --el-menu-base-level-padding: var(--sb-gap-x);
    color: var(--el-text-color);
    height: 100%;
    text-decoration: none;
    width: 100%;

    .sb-mobile-bottom-menu-item-content {
      align-items: center;
      display: flex;
      flex-direction: column;
      height: 100%;
      justify-content: space-evenly;

      .sb-mobile-bottom-menu-item-icon-wrapper {
        align-items: center;
        border-radius: var(--sb-gap-y);
        color: #ffffff;
        display: flex;
        filter: grayscale(1);
        gap: var(--sb-gap-y);
        justify-content: center;

        .sb-mobile-bottom-menu-item-icon {
          margin: calc(var(--sb-gap-y)/2);
          padding: calc(var(--sb-gap-x)/5);
        }
      }

      .sb-mobile-bottom-menu-item-label-wrapper {
        align-items: flex-start;
        display: flex;
        flex-direction: column;
        justify-content: center;
        text-align: center;
        width: 100%;

        .sb-mobile-bottom-menu-item-label {
          font-size: var(--el-menu-item-font-size);
          line-height: normal;
          transition: font-size var(--el-transition-duration-fast) ease;
          width: 100%;
          will-change: font-size;
        }
      }
    }

    &.router-link-active {
      background-color: #fff;

      .sb-mobile-bottom-menu-item-icon-wrapper {
        filter: none;
      }

      .sb-mobile-bottom-menu-item-label {
        font-weight: 600;
      }
    }
  }
}
</style>