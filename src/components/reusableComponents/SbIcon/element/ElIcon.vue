<template>
  <ElIcon class="sb-element-icon" v-bind="$attrs">
    <slot v-if="!props.name" />
    <component v-else :is="props.name" />
  </ElIcon>
</template>

<script setup lang="ts">
import { ElIcon } from "element-plus";

const props = defineProps<{
  name?: string;
}>();
</script>

<script>
</script>
