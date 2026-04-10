<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    color?: string;
    contentCenter?: boolean;
  }>(),
  {
    color: 'rgba(0, 0, 0, 0.65)',
    contentCenter: false,
  }
);

const emit = defineEmits<{
  (e: 'shadowClick'): void;
}>();
</script>
<template>
  <div class="shadow-wrapper">
    <div
      :class="['shadow-content-wrapper', contentCenter && 'flex-center']"
      @click.self="emit('shadowClick')"
    >
      <slot></slot>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.shadow-wrapper {
  position: fixed;
  inset: 0;
  z-index: 999;
  background-color: v-bind('props.color');
  overflow: hidden;
}

.shadow-content-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>
