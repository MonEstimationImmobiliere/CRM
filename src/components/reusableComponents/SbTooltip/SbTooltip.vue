<template>
  <ElTooltip
    :hide-after="props.hideAfter"
  >
    <template #content>
      <slot name="content" />
    </template>
    <slot />
  </ElTooltip>
</template>

<script lang="ts" setup>
import { ElTooltip } from "element-plus";

const props = withDefaults(
  defineProps<{
    hideAfter?: number;
  }>(), {
    hideAfter: 0
  }
);

</script>