<template>
  <DvfMarketTooltip :details="details">
    <strong v-if="value?.origin === 'agent'">{{ formatPrice(value.price) }} <span class="agent-check" aria-label="Agent immobilier">✓</span></strong>
    <em v-else-if="value">{{ formatPrice(value.price) }}</em>
    <span v-else>—</span>
  </DvfMarketTooltip>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatDateShort, formatPrice } from '@/helpers/intl';
import DvfMarketTooltip from './DvfMarketTooltip.vue';

export interface DisplayEstimate {
  price: number;
  origin: 'agent' | 'automatic';
  date?: string | null;
  lower?: number | null;
  upper?: number | null;
}

const props = defineProps<{ value?: DisplayEstimate | null }>();
const details = computed(() => {
  const value = props.value;
  if (!value) return undefined;
  return {
    lines: [
      value.origin === 'agent' ? 'Estimation de l’agent immobilier' : 'Estimation automatique MyImmo',
      `Date : ${formatDateShort(value.date) || 'Non disponible'}`,
      ...(value.lower != null && value.upper != null ? [`Fourchette : ${formatPrice(value.lower)} – ${formatPrice(value.upper)}`] : []),
    ],
    reference: formatPrice(value.price),
  };
});
</script>

<style scoped>
.agent-check { color: var(--el-color-success-dark-2); }
</style>
