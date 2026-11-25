<template>
  <span class="prospection-progress" :title="label" :aria-label="label">
    <span class="prospection-dot" :style="{ backgroundColor: prospectionColor(count) }" aria-hidden="true" />
    <span v-if="showCounts && count">{{ count.prospected }} / {{ count.total }}{{ countUnit ? ` ${countUnit}` : '' }} · </span>
    <span>{{ count ? prospectionPercent(count) : '—' }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { prospectionColor, prospectionPercent } from '@/utils/prospectionProgress';
import type { ProspectionCount } from '@/utils/prospectionProgress';

const props = defineProps<{ count: ProspectionCount | null; showCounts?: boolean; countUnit?: string }>();
const label = computed(() => props.count
  ? `${props.count.prospected} biens prospectés sur ${props.count.total}`
  : 'Progression indisponible');
</script>

<style scoped>
.prospection-progress {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.prospection-dot {
  width: var(--prospection-dot-size, 0.65rem);
  height: var(--prospection-dot-size, 0.65rem);
  flex: 0 0 auto;
  border-radius: 50%;
}
</style>
