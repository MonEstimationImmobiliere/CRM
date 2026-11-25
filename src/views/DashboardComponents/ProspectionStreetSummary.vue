<template>
  <div class="street-summary">
    <section class="street-summary-card">
      <h4>{{ title }}</h4>
      <ProspectionProgressBadge :count="count" show-counts count-unit="biens" />

      <template v-if="count">
        <div
          class="street-progress-track"
          role="progressbar"
          :aria-label="title"
          :aria-valuenow="percentage"
        >
          <span :style="{ width: `${percentage}%`, backgroundColor: prospectionColor(count) }" />
        </div>
        <dl class="street-progress-counts">
          <div>
            <dt>Prospectés</dt>
            <dd>{{ count.prospected }}</dd>
          </div>
          <div>
            <dt>Restant à prospecter</dt>
            <dd>{{ count.total - count.prospected }}</dd>
          </div>
        </dl>
      </template>
      <dl v-if="commune" class="street-progress-counts">
        <div>
          <dt>Rues distinctes</dt>
          <dd>{{ streetCount ?? '—' }}</dd>
        </div>
      </dl>
    </section>

    <section class="street-summary-card">
      <DvfStatisticsSummary :code-insee="codeInsee" :street-key="streetKey" :commune="commune" />
    </section>

    <p class="street-summary-hint">
      {{ commune ? 'Cliquez sur une pastille pour consulter une rue.' : 'Cliquez sur une pastille pour consulter une adresse.' }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ProspectionProgressBadge from './ProspectionProgressBadge.vue';
import DvfStatisticsSummary from './DvfStatisticsSummary.vue';
import { prospectionColor, prospectionRatio } from '@/utils/prospectionProgress';
import type { ProspectionCount } from '@/utils/prospectionProgress';

const props = defineProps<{
  count: ProspectionCount | null;
  commune?: boolean;
  streetCount?: number | null;
  codeInsee?: string | null;
  streetKey?: string;
}>();
const title = computed(() => props.commune ? 'Prospection de la commune' : 'Prospection de la rue');
const percentage = computed(() => prospectionRatio(props.count) * 100);
</script>

<style scoped>
.street-summary,
.street-summary-card {
  display: grid;
  gap: 10px;
}

.street-summary-card {
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.street-summary-card h4,
.street-summary-card p,
.street-summary-hint {
  margin: 0;
}

.street-summary-card p,
.street-summary-hint {
  color: #64748b;
  font-size: 13px;
}

.street-progress-track {
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: #e5e7eb;
}

.street-progress-track > span {
  display: block;
  height: 100%;
}

.street-progress-counts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
}

.street-progress-counts dt {
  color: #64748b;
  font-size: 12px;
}

.street-progress-counts dd {
  margin: 2px 0 0;
  font-weight: 600;
}
</style>
