<template>
  <el-select v-model="scope" :aria-label="label" size="small" class="agency-scope-select">
    <el-option value="personal" label="Personnel" />
    <el-option v-if="!personalOnly" value="agency" label="Agence" />
  </el-select>
</template>

<script setup lang="ts">
defineProps<{ label: string; personalOnly?: boolean }>();
const scope = defineModel<'agency' | 'personal'>({ required: true });
</script>

<style scoped>
.agency-scope-select {
  width: 180px;
  max-width: 100%;
}
</style>
