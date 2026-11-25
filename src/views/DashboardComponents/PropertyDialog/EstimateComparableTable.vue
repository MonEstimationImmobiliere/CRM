<template>
  <p>{{ sales.length }} ventes retenues. Les lignes surlignées déterminent la médiane temporelle.</p>
  <el-table :data="sales" size="small" max-height="360" :row-class-name="rowClass">
    <el-table-column prop="address" label="Adresse" sortable min-width="145" />
    <el-table-column prop="commune" label="Commune" sortable min-width="130" />
    <el-table-column prop="date_mutation" label="Date" sortable min-width="110">
      <template #default="{ row }">{{ formatDateShort(row.date_mutation) }}</template>
    </el-table-column>
    <el-table-column prop="type" label="Type" sortable min-width="105" />
    <el-table-column prop="surface" label="Surface" sortable min-width="100">
      <template #default="{ row }">{{ row.surface }} m²</template>
    </el-table-column>
    <el-table-column prop="land_area" label="Terrain" sortable :sort-by="row => row.land_area ?? -1" min-width="125">
      <template #default="{ row }">{{ row.land_area == null ? 'Non disponible' : `${row.land_area.toLocaleString('fr-FR')} m²` }}</template>
    </el-table-column>
    <el-table-column prop="sale_price" label="Prix vendu" sortable min-width="115">
      <template #default="{ row }">{{ formatCurrency(row.sale_price) }}</template>
    </el-table-column>
    <el-table-column prop="price" label="Prix réel au m²" sortable min-width="135">
      <template #default="{ row }">{{ formatCurrency(row.price) }} / m²</template>
    </el-table-column>
    <el-table-column prop="age_years" label="Ancienneté" sortable min-width="112">
      <template #default="{ row }">{{ row.age_years ? `${row.age_years} an(s) révolu(s)` : 'Moins de 1 an' }}</template>
    </el-table-column>
    <el-table-column prop="weight" label="Coefficient" sortable min-width="110">
      <template #default="{ row }">{{ coefficient.format(row.weight / 100) }}</template>
    </el-table-column>
    <el-table-column prop="cumulative_percent" label="Cumul par prix croissant" sortable min-width="176">
      <template #default="{ row }">
        {{ row.cumulative_percent.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) }} %
        <small v-if="row.determines_median"> · Médiane</small>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup lang="ts">
import { formatCurrency, formatDateShort } from '@/helpers/intl';

export interface ComparableSale {
  address: string;
  commune: string;
  date_mutation: string;
  type: string;
  surface: number;
  land_area?: number | null;
  sale_price: number;
  price: number;
  age_years: number;
  weight: number;
  cumulative_percent: number;
  determines_median?: boolean;
}

defineProps<{ sales: ComparableSale[] }>();
const coefficient = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const rowClass = ({ row }: { row: ComparableSale }) => row.determines_median ? 'median-determinant' : '';
</script>

<style scoped>
:deep(.median-determinant) { --el-table-tr-bg-color: var(--el-color-success-light-9); }
</style>
