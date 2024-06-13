<template>
  <div class="sb-progress">
    <template v-if="props.labelValue || props.detail">
      <div class="description-row">
        <div class="text-bold" :style="{ color: props.color}">
          {{ props.labelValue }}
        </div>
        <div class="text-bold">
          {{ props.detail }}
        </div>
      </div>
    </template>
    <div class="progress-row">
      <ElProgress
        max="100"
        :color="props.color"
        :show-text="false"
        :percentage="props.percentage"
        class="el-progress"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElProgress } from "element-plus";
import { onBeforeMount, ref } from "vue";

import type { IconPath } from "../SbIcon/types";

const props = withDefaults(
  defineProps<{
    iconPath?: IconPath;
    color?: `#${ string }`;
    labelValue?: string;
    percentage?: number;
    detail?: string;
  }>(), {
    iconPath: undefined,
    color: "#111111",
    labelValue: "",
    detail: "",
    percentage: 0
  }
);

const progressBackgroundColor = ref("#000000");
const progressLineColor = ref("#FFFFFF");

const newShade = (hexColor: string, magnitude: number): `#${ string }` => {
  const color: string = hexColor.replace("#", "");
  if (color.length === 6) {
    const decimalColor = parseInt(color, 16);
    let r = magnitude + (decimalColor >> 16);
    r > 255 && (r = 255);
    r < 0 && (r = 0);
    let g = (decimalColor & 0x0000ff) + magnitude;
    g > 255 && (g = 255);
    g < 0 && (g = 0);
    let b = (decimalColor >> 8 & 0x00ff) + magnitude;
    b > 255 && (b = 255);
    b < 0 && (b = 0);
    return `#${ (g | b << 8 | r << 16).toString(16) }`;
  } else {
    return `#${ color }`;
  }
};

onBeforeMount((): void => {
  progressLineColor.value = props.color;
  progressBackgroundColor.value = newShade(props.color, 180);
});

</script>

<style lang="scss" scoped>
.sb-progress {
  .description-row {
    display: flex;
    justify-content: space-between;
  }

  .progress-row {
    margin-top: 5px;

    :deep(.el-progress-bar__outer) {
      background-color: v-bind('progressBackgroundColor') !important;
      height: 15px !important;
    }

    :deep(.el-progress-bar__inner) {
      background-color: v-bind('progressLineColor') !important;
      opacity: 1;
    }
  }
}

</style>
