<template>
  <h4>Analyse immobilière</h4>
  <p v-if="loading" role="status">Chargement des ventes DVF…</p>
  <p v-else-if="failed" role="status">Statistiques DVF temporairement indisponibles.</p>
  <template v-else>
    <p v-if="statistics?.period">
      Ventes DVF du {{ formatDate(statistics.period.from) }} au {{ formatDate(statistics.period.to) }}
    </p>
    <dl v-if="rows.length">
      <div v-for="row in rows" :key="row.label" class="market-category">
        <dt>{{ row.label }}</dt>
        <dd>
          <DvfMarketTooltip v-if="row.median_price_per_m2 !== null" :details="row.tooltip">
            <strong>{{ formatPrice(row.median_price_per_m2) }}</strong>
          </DvfMarketTooltip>
          <span v-else>Données insuffisantes</span>
          <small>{{ row.sales_count }} {{ row.sales_count === 1 ? 'vente retenue' : 'ventes retenues' }}</small>
          <small v-if="row.limited_sample" class="market-warning">Échantillon limité</small>
          <small v-if="row.indicative" class="market-warning">Faible échantillon</small>
          <small v-if="row.lowReliability" class="market-warning">Faible fiabilité</small>
          <small v-if="row.referenceCommune">Réf. commune</small>
          <small v-if="row.comparison"><DvfMarketTooltip :details="row.tooltip">{{ row.comparison }}</DvfMarketTooltip></small>
        </dd>
      </div>
    </dl>
    <p v-else>Données insuffisantes</p>
    <p v-if="rows.length">La médiane résidentielle regroupe maisons et appartements. Leur répartition peut influencer le résultat.</p>
  </template>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { getDvfStatistics, type DvfCategory, type DvfStatistics } from '@/api/dvf-statistics.service';
import { communeMarketTooltip, streetMarketPrice } from '@/utils/dvfResidentialComparison';
import DvfMarketTooltip from './DvfMarketTooltip.vue';

const props = defineProps<{ codeInsee?: string | null; streetKey?: string; commune?: boolean }>();
const statistics = ref<DvfStatistics | null>(null);
const loading = ref(false);
const failed = ref(false);
const categories: Record<DvfCategory, string> = {
  residential: 'Résidentiel',
  house: 'Maison',
  apartment: 'Appartement',
  commercial: 'Local commercial',
};
const priceFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const differenceFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'percent',
  signDisplay: 'exceptZero',
  maximumFractionDigits: 1,
});
const formatPrice = (price: number) => `${priceFormatter.format(price)} €/m²`;
const formatDate = (date: string) => date.split('-').reverse().join('/');

const rows = computed(() => {
  const samples = props.commune ? statistics.value?.commune : statistics.value?.street;
  if (!samples) return [];

  return (Object.keys(categories) as DvfCategory[]).flatMap(category => {
    const sample = samples[category];
    if (!sample) return [];
    const communeMedian = statistics.value?.commune?.[category]?.median_price_per_m2;
    const street = props.commune ? null : streetMarketPrice(sample, communeMedian, statistics.value?.commune_weight, statistics.value?.period, statistics.value?.max_dispersion_percent);
    const comparison = communeMedian != null && street?.difference != null
      ? `Commune ${formatPrice(communeMedian)} · ${differenceFormatter.format(street.difference)}`
      : null;
    return [{
      label: categories[category], ...sample, comparison,
      median_price_per_m2: street ? street.median : sample.median_price_per_m2,
      tooltip: street?.tooltip ?? communeMarketTooltip(props.commune ? sample : undefined, statistics.value?.period, statistics.value?.max_dispersion_percent),
      indicative: street?.indicative, referenceCommune: street?.referenceCommune, lowReliability: street?.lowReliability,
    }];
  });
});

watch(() => [props.codeInsee, props.streetKey, props.commune] as const, async ([codeInsee, streetKey, commune], _, onCleanup) => {
  statistics.value = null;
  failed.value = false;
  loading.value = false;
  if (!codeInsee || (!commune && !streetKey)) return;

  const request = new AbortController();
  onCleanup(() => request.abort());
  loading.value = true;
  try {
    const result = await getDvfStatistics(codeInsee, commune ? undefined : streetKey, request.signal);
    if (!request.signal.aborted) statistics.value = result;
  } catch {
    if (!request.signal.aborted) failed.value = true;
  } finally {
    if (!request.signal.aborted) loading.value = false;
  }
}, { immediate: true, flush: 'post' });
</script>

<style scoped>
h4, p, dl, dd {
  margin: 0;
}

p, dd, small {
  color: #64748b;
  font-size: 13px;
}

.market-category {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 8px;
  padding: 6px 0;
  border-top: 1px solid #e5e7eb;
}

dt, strong {
  color: #1e293b;
  font-size: 13px;
  font-weight: 600;
}

small {
  display: block;
  font-size: 12px;
}

.market-warning {
  color: #92400e;
}
</style>
