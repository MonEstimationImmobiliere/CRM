<template>
  <el-tooltip :disabled="!details && !note" placement="top">
    <template #content>
      <div v-for="line in details?.lines" :key="line">{{ line }}</div>
      <div v-if="note">{{ note }}</div>
      <strong v-if="details">{{ details.reference }}</strong>
    </template>
    <span :tabindex="details || note ? 0 : undefined"><slot /></span>
  </el-tooltip>
</template>

<script setup lang="ts">
import type { DvfTooltip } from '@/utils/dvfResidentialComparison';

defineProps<{ details?: DvfTooltip; note?: string }>();
</script>
