<template>
  <div class="property-table-container">
    <p v-if="failed" class="dvf-status" role="status">Statistiques DVF temporairement indisponibles.</p>
    <p v-else-if="loading" class="dvf-status" role="status">Chargement des statistiques DVF…</p>
    <p v-else-if="statistics?.period" class="dvf-status">
      Médianes DVF du {{ formatDateShort(statistics.period.from) }} au {{ formatDateShort(statistics.period.to) }}
    </p>
    <el-table
      :data="rows"
      row-key="id_fantoir"
      class="modern-property-table"
      row-class-name="custom-row"
      max-height="calc(100vh - 320px)"
      :default-sort="sort ?? undefined"
      @sort-change="saveSort"
    >
      <el-table-column label="Ville" prop="nom_commune" sortable min-width="155">
        <template #default="{ row }">{{ [row.code_postal, row.nom_commune].filter(Boolean).join(' ') }}</template>
      </el-table-column>
      <el-table-column label="Rue" prop="nom_voie" sortable min-width="175">
        <template #default="{ row }">
          <button type="button" class="rueClickable" @click.stop="emit('select-street', row)">{{ row.nom_voie }}</button>
        </template>
      </el-table-column>
      <el-table-column label="Biens" prop="total" sortable :sort-by="row => row.total ?? -1" min-width="85">
        <template #default="{ row }">{{ row.total ?? '—' }}</template>
      </el-table-column>
      <el-table-column label="Prix au m²" prop="median" sortable :sort-by="row => row.median ?? -1" min-width="135">
        <template #default="{ row }">
          <DvfMarketTooltip :details="row.tooltip">{{ row.median == null ? '—' : `${formatPrice(row.median)} / m²` }}</DvfMarketTooltip>
          <small v-if="row.indicative && row.median !== null" class="limited-sample">
            Faible échantillon · {{ row.salesCount }} {{ row.salesCount === 1 ? 'vente' : 'ventes' }}
          </small>
          <small v-else-if="row.referenceCommune">Réf. commune</small>
          <small v-else-if="row.limitedSample" class="limited-sample">Échantillon limité · {{ row.salesCount }} ventes</small>
          <small v-else-if="row.salesCount">{{ row.salesCount }} ventes</small>
          <small v-if="row.lowReliability" class="limited-sample">Faible fiabilité</small>
        </template>
      </el-table-column>
      <el-table-column label="Dernière vente" prop="latestDate" sortable :sort-by="row => row.latestDate ?? ''" min-width="138">
        <template #default="{ row }">{{ formatDateShort(row.latestDate) || '—' }}</template>
      </el-table-column>
      <el-table-column label="Prix vendu" prop="latestPrice" sortable :sort-by="row => row.latestPrice ?? -1" min-width="125">
        <template #default="{ row }">{{ row.latestPrice == null ? '—' : formatCurrency(row.latestPrice) }}</template>
      </el-table-column>
      <el-table-column label="Écart commune" prop="difference" sortable :sort-by="row => row.difference ?? -1" min-width="144">
        <template #default="{ row }">
          <DvfMarketTooltip :details="row.difference == null ? undefined : row.tooltip">
            {{ row.referenceCommune ? 'Réf. commune' : row.difference == null ? '—' : percent.format(row.difference) }}
          </DvfMarketTooltip>
          <small v-if="row.indicative && row.difference !== null" class="limited-sample">Indicatif</small>
        </template>
      </el-table-column>
      <el-table-column label="Prospection" prop="coverage" sortable :sort-by="row => row.coverage ?? -1" min-width="123">
        <template #default="{ row }"><ProspectionProgressBadge :count="row.count" /></template>
      </el-table-column>
      <el-table-column fixed="right" class-name="action-column-right" label="Actions" min-width="91">
        <template #default="{ row }">
          <div class="action-buttons">
            <el-button type="primary" size="small" @click.stop="emit('select-street', row)">Ouvrir</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { DvfStatistics } from '@/api/dvf-statistics.service';
import { formatCurrency, formatDateShort, formatPrice } from '@/helpers/intl';
import type { IAddressGrouped } from '@/types/address';
import { prospectionRatio, rowProspectionCount, type ProspectionProgress } from '@/utils/prospectionProgress';
import { communeStreetPrice } from '@/utils/dvfResidentialComparison';
import ProspectionProgressBadge from './ProspectionProgressBadge.vue';
import DvfMarketTooltip from './DvfMarketTooltip.vue';

const props = defineProps<{
  streets: IAddressGrouped[];
  progress: ProspectionProgress | null;
  statistics: DvfStatistics | null;
  loading: boolean;
  failed: boolean;
}>();
const sort = defineModel<{ prop: string; order: 'ascending' | 'descending' } | null>('sort', { required: true });
const emit = defineEmits<{ 'select-street': [street: IAddressGrouped] }>();
const percent = new Intl.NumberFormat('fr-FR', { style: 'percent', signDisplay: 'exceptZero', maximumFractionDigits: 1 });

const rows = computed(() => {
  return props.streets.map(street => {
    const count = rowProspectionCount(props.progress, street);
    const summary = props.statistics?.streets?.[street.id_fantoir];
    return {
      ...street,
      count,
      total: count?.total ?? null,
      coverage: count ? prospectionRatio(count) : null,
      ...communeStreetPrice(props.statistics, street.id_fantoir),
      latestDate: summary?.latest_sale?.date ?? null,
      latestPrice: summary?.latest_sale?.price ?? null,
    };
  });
});

function saveSort({ prop, order }: { prop?: string; order?: 'ascending' | 'descending' | null }) {
  sort.value = prop && order ? { prop, order } : null;
}

</script>

<style scoped>
.property-table-container {
  --prospection-dot-size: 14px;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  box-sizing: border-box;
}

.modern-property-table {
  width: 100%;
  border-radius: var(--table-radius);
  overflow: hidden;
  box-shadow: var(--table-shadow);
  border: 1px solid #c4c3c3;
  font-weight: 600;
  color: #303030;
}

.modern-property-table :deep(tr) {
  background-color: transparent;
}

.modern-property-table :deep(.el-table__header) {
  background: #f7f7f7;
}

.modern-property-table :deep(.el-table__header th) {
  background: transparent;
  color: #303030;
  font-weight: 600;
  padding: var(--table-cell-padding);
}

.modern-property-table :deep(.el-table__body td) {
  padding: var(--table-cell-padding);
  border-bottom: 1px solid var(--table-border-color);
}

.modern-property-table :deep(.el-table__row.custom-row) {
  transition: all 0.3s ease;
}

.modern-property-table :deep(.el-table__row.custom-row:hover) {
  background-color: var(--table-row-hover) !important;
  transform: var(--btn-hover-translate);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.rueClickable {
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  font-weight: 600;
  text-align: left;
  color: #3b82f6;
  cursor: pointer;
  transition: color 0.2s ease;
}

.rueClickable:hover,
.rueClickable:focus-visible {
  text-decoration: underline;
  color: #2563eb;
}

.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-buttons :deep(.el-button) {
  border-radius: var(--btn-radius);
  transition: all 0.3s ease;
}

.action-buttons :deep(.el-button:hover) {
  transform: var(--btn-hover-translate);
  box-shadow: var(--btn-hover-shadow);
}

@media (max-width: 768px) {
  .modern-property-table :deep(.el-table__header th),
  .modern-property-table :deep(.el-table__body td) {
    padding: var(--table-cell-padding-mobile);
  }
}

.dvf-status {
  margin: 0 0 8px;
  color: #64748b;
  font-size: 13px;
}

.limited-sample {
  display: block;
  color: #92400e;
}
</style>
