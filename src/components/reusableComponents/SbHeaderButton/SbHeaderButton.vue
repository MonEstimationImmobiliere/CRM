<template>
  <div class="header-button" @click="handleHeaderButtonClick">
    <template v-if="$slots.icon">
      <slot name="icon" />
    </template>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: "click"): void;
}>();

const handleHeaderButtonClick = (): void => {
  emit("click");
};
</script>

<style lang="scss" scoped>
.header-button {
  align-items: center;
  aspect-ratio: 1;
  background-color: var(--el-color-info-light-8);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  height: 40px;
  justify-content: center;
}
</style>
