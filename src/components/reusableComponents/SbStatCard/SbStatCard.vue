<template>
  <SbCard
    radius
    class="sb-stat-card"
    v-bind="$attrs"
    :style="{
      '--card-color': props.bgColor,
      '--title-color': props.titleColor,
      '--sub-title-color': props.subTitleColor
    }"
  >
    <div class="container h-100 d-flex">
      <div class="state-icon">
        <SbIcon :icon-path="props.iconPath" :color="props.iconColor" :icon-size="props.iconSize" />
      </div>
      <div class="right-content w-100">
        <SbTypography class="title-stat-card-title text-clamp-1" semi-bold as="h4">
          {{ props.title }}
        </SbTypography>
        <SbTypography class="sub-title-stat-card-title pr-1">
          {{ props.subTitle }}
        </SbTypography>
      </div>
    </div>
  </SbCard>
</template>

<script lang="ts" setup>

import SbCard from "../SbCard/SbCard.vue";
import SbIcon from "../SbIcon/SbIcon.vue";
import type { IconPath } from "../SbIcon/types";
import SbTypography from "../SbTypography/SbTypography.vue";

const props = withDefaults(defineProps<{
  bgColor?: string;
  iconPath?: IconPath;
  iconColor?: string;
  iconSize?: number;
  title?: string;
  subTitle?: string;
  subTitleColor?: string;
  titleColor?: string;
}>(), {
  bgColor: "#B5B5B5",
  iconPath: "Element:InfoFilled",
  iconColor: "#ffffff",
  iconSize: 30,
  title: "",
  subTitle: "",
  subTitleColor: "#ffffff",
  titleColor: "#ffffff"
});

</script>

<style lang="scss" scoped>
.sb-stat-card {
  background-color: var(--card-color);
  height: 110px;
  width: 100%;

  :deep(.el-card__body) {
    padding: 0;

    .container {
      .state-icon {
        align-items: center;
        background-color: rgba(0, 0, 0, 0.1);
        display: flex;
        justify-content: center;
        width: 33%;
      }

      .right-content {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 20px 10px;

        .title-stat-card-title {
          color: var(--title-color);
          width: max-content;
        }

        .sub-title-stat-card-title {
          color: var(--sub-title-color);
        }
      }
    }
  }
}
</style>