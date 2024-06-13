<template>
  <component
    :is="icon.is"
    v-bind="icon.attrs"
    class="sb-icon"
    :class="{'icon-spinning': iconSpinning}"
  />
</template>

<script lang="ts" setup>
import { computed } from "vue";

import CustomIcon from "./custom/CustomIcon.vue";
import ElIcon from "./element/ElIcon.vue";
import type { IconPath } from "./types";

const props = defineProps<{
  iconPath: IconPath;
  iconSize?: number | string;
  iconColor?: string;
  iconSpinning?: boolean;
  iconColorFill?: boolean;
  iconColorStroke?: boolean;
}>();

const icon = computed((): { is: unknown; attrs: Record<string, unknown> } => {
  const [iconLibrary, iconPath] = props.iconPath.split(":");
  switch (iconLibrary) {
    case "Element": {
      return {
        is: ElIcon,
        attrs: {
          name: iconPath ?? "",
          size: props.iconSize,
          color: props.iconColor
        }
      };
    }
    case "Custom": {
      return {
        is: CustomIcon,
        attrs: {
          name: iconPath ?? "",
          size: props.iconSize,
          color: props.iconColor,
          colorFill: props.iconColorFill,
          colorStroke: props.iconColorStroke
        }
      };
    }
    default: {
      throw new Error(`SbIcon: Unsupported icon library "${iconLibrary}"`);
    }
  }
});
</script>

<style scoped lang="scss">
.sb-icon {
  &.icon-spinning {
    animation: spin 1s infinite linear;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(359deg);
  }
}
</style>
