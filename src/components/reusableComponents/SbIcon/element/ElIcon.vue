<template>
  <ElIcon class="sb-element-icon" v-bind="$attrs">
    <component :is="props.name" />
  </ElIcon>
</template>

<script setup lang="ts">
import { ElIcon } from "element-plus";
import { computed, defineAsyncComponent } from "vue";

// import { elementIconsResolver } from "./elementIconResolver";

const props = defineProps<{
  name: string;
}>();

// const resolvedIcon = computed((): ReturnType<typeof defineAsyncComponent> => elementIconsResolver(props.name));
</script>

<script>
</script>
