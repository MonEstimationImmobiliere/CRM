<template>
  <EMTableWithCard
    :data="favorites"
    :columns="favoriteColumns"
    :actions="favoriteActions"
    :searchable="true"
    search-placeholder="Rechercher une propriété..."
    :page-size="20"
    empty-message="Aucune propriété favorite trouvée"
    :navigateFromLine="(row: any) => emit('edit-property', row)"
  >
    <!-- Address -->
    <template #cell-address="{ row }">
      <div class="address-info">
        <span class="street-name">{{ getFullAddress(row) }}</span>
        <span v-if="getUnitLabel(row)" class="unit-label">
          {{ getUnitLabel(row) }}
        </span>
      </div>
    </template>

    <!-- Property Type -->
    <template #cell-property_type="{ row }">
      <div class="property-type">
        <el-tag :type="getPropertyTypeTagType(row.property_type)" size="small" round>
          {{ row.property_type || 'Non renseigné' }}
        </el-tag>
      </div>
    </template>

    <!-- Owner -->
    <template #cell-owner="{ row }">
      <div class="owner-info">
        <span class="owner-name">{{ row.owner || 'Non renseigné' }}</span>
      </div>
    </template>

    <!-- Surface -->
    <template #cell-surface="{ row }">
      <div class="surface-info">
        <span class="surface-value">{{ row.surface || 0 }} m²</span>
      </div>
    </template>

    <!-- Price -->
    <template #cell-price="{ row }">
      <div class="price-info">
        <span class="price-value">{{ formatPrice(row.price, 'Non renseigné') }}</span>
      </div>
    </template>
  </EMTableWithCard>
</template>

<script setup lang="ts">
import { formatPrice } from '@/helpers/intl';
import { getPropertyTypeTagType } from '@/utils/propertyHelpers';
import EMTableWithCard from '@/components/OwnReusableComponents/table/EMTableWithCard.vue';
import type {
  ColumnDefinition,
  TableAction,
} from '@/components/OwnReusableComponents/table/types';

interface Props {
  favorites: any[];
}

defineProps<Props>();

const emit = defineEmits([
  'edit-property',
  'toggle-favorite',
  'create-reminder',
  'go-to-map',
]);

const favoriteColumns: ColumnDefinition<any>[] = [
  { key: 'address', label: 'Adresse', sortable: false, minWidth: '280px' },
  { key: 'property_type', label: 'Type', width: '120px' },
  { key: 'owner', label: 'Propriétaire', width: '150px', filterMenu: true },
  { key: 'surface', label: 'Surface', width: '100px' },
  { key: 'price', label: 'Prix estimé', width: '130px' },
];

const favoriteActions: TableAction<any>[] = [
  {
    key: 'edit',
    label: 'Modifier la propriété',
    icon: '✏️',
    handler: (row) => emit('edit-property', row),
  },
  {
    key: 'create-reminder',
    label: 'Créer un rappel',
    icon: '➕',
    handler: (row) => emit('create-reminder', row),
  },
  {
    key: 'go-to-map',
    label: 'Voir sur la carte',
    icon: '📍',
    handler: (row) => emit('go-to-map', row),
  },
  {
    key: 'toggle-favorite',
    label: 'Retirer des favoris',
    icon: '⭐',
    danger: true,
    handler: (row) => emit('toggle-favorite', row),
  },
];

const getFullAddress = (row: any): string => {
  const parts: string[] = [];

  if (row.numero) parts.push(String(row.numero));
  if (row.rep) parts.push(row.rep);
  if (row.nom_voie) parts.push(row.nom_voie);

  const cityLine = `${row.code_postal ?? ''} ${row.city ?? ''}`.trim();
  if (cityLine) parts.push(cityLine);

  return parts.join(' ') || 'Adresse non renseignée';
};

const getUnitLabel = (row: any): string => {
  const parts: string[] = [];

  if (row.apart_number) {
    parts.push(`Appartement ${row.apart_number}`);
  }

  if (row.unit_label) {
    parts.push(row.unit_label);
  }

  return parts.join(' / ');
};
</script>

<style scoped>
.owner-info,
.surface-info,
.price-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.street-name,
.owner-name {
  font-weight: 500;
  color: #1e293b;
}

.surface-value,
.price-value {
  font-weight: 500;
  color: #059669;
}

.property-type {
  display: flex;
  justify-content: flex-start;
}

:deep(.el-tag) {
  font-weight: 500;
}

.address-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.unit-label {
  font-size: 12px;
  color: #64748b;
}
</style>
