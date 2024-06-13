<template>
  <CustomIcon
    ref="customIconRef"
    class="sb-custom-icon"
    :style="customIconStyle"
    :class="customIconClasses"
  />
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, h, shallowRef } from "vue";

import { customIconsResolver } from "./customIconsResolver";

const props = defineProps<{
  name: string;
  size?: number;
  color?: string;
  colorFill?: boolean;
  colorStroke?: boolean;
}>();

const customIconRef = shallowRef();

const CustomIcon = computed((): ReturnType<typeof defineAsyncComponent> => {
  return defineAsyncComponent({
    loader: customIconsResolver(props.name),
    loadingComponent: (): ReturnType<typeof h> => h("span", { class: "sb-custom-icon" }),
    delay: 0
  });
});

const customIconStyle = computed((): Record<string, string> => {
  const style = {};
  if (props.size) style["--sb-icon-size"] = `${props.size}px`;
  if (props.color) style["--sb-icon-color"] = props.color;
  return style;
});

const customIconClasses = computed((): Record<string, boolean> => {
  return {
    "sb-custom-icon--fill": props.colorFill,
    "sb-custom-icon--stroke": props.colorStroke
  };
});
</script>

<style lang="scss" scoped>
.sb-custom-icon {
  --sb-icon-size: 1em;
  --sb-icon-color: currentColor;
  height: var(--sb-icon-size);
  min-height: var(--sb-icon-size);
  min-width: var(--sb-icon-size);
  width: var(--sb-icon-size);

  &.sb-custom-icon--fill {
    fill: var(--sb-icon-color);
  }

  &.sb-custom-icon--stroke {
    stroke: var(--sb-icon-color);
  }
}
</style>
